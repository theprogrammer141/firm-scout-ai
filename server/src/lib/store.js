import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Storage abstraction. The rest of the app only uses the exported `store`
 * interface, so swapping the JSON files for Tablestore/PostgreSQL means
 * providing another object with the same methods.
 */

export const COLLECTIONS = {
  leads: 'leads-db.json',
  businesses: 'businesses-db.json',
  research: 'research-db.json',
  opportunities: 'opportunities-db.json',
  outreach: 'outreach-db.json',
};

class JsonCollectionStore {
  constructor(dir) {
    this.dir = dir;
    this.cache = new Map();
    this.writeChain = new Map();
  }

  filePath(collection) {
    const file = COLLECTIONS[collection];
    if (!file) throw new Error(`Unknown collection: ${collection}`);
    return path.join(this.dir, file);
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    for (const collection of Object.keys(COLLECTIONS)) {
      const fp = this.filePath(collection);
      try {
        await fs.access(fp);
      } catch {
        await fs.writeFile(fp, '[]', 'utf8');
      }
    }
  }

  async readAll(collection) {
    if (this.cache.has(collection)) {
      return structuredClone(this.cache.get(collection));
    }
    const fp = this.filePath(collection);
    let rows = [];
    try {
      const raw = await fs.readFile(fp, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
    this.cache.set(collection, rows);
    return structuredClone(rows);
  }

  /** Serializes writes per collection so concurrent pipeline steps cannot clobber each other. */
  async _write(collection, mutate) {
    const previous = this.writeChain.get(collection) || Promise.resolve();
    const next = previous.then(async () => {
      const rows = await this.readAll(collection);
      const result = await mutate(rows);
      this.cache.set(collection, rows);
      await fs.mkdir(this.dir, { recursive: true });
      const fp = this.filePath(collection);
      const tmp = `${fp}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
      await fs.rename(tmp, fp);
      return result;
    });
    this.writeChain.set(collection, next.catch((err) => { console.error(`Store write error [${collection}]:`, err); }));
    return next;
  }

  async insert(collection, record) {
    return this._write(collection, (rows) => {
      rows.push(record);
      return structuredClone(record);
    });
  }

  async findById(collection, idField, id) {
    const rows = await this.readAll(collection);
    return rows.find((r) => r[idField] === id) || null;
  }

  async find(collection, predicate) {
    const rows = await this.readAll(collection);
    return predicate ? rows.filter(predicate) : rows;
  }

  async update(collection, idField, id, patch) {
    return this._write(collection, (rows) => {
      const idx = rows.findIndex((r) => r[idField] === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch, updated_at: new Date().toISOString() };
      return structuredClone(rows[idx]);
    });
  }

  async remove(collection, idField, id) {
    return this._write(collection, (rows) => {
      const idx = rows.findIndex((r) => r[idField] === id);
      if (idx === -1) return null;
      const [removed] = rows.splice(idx, 1);
      return removed;
    });
  }

  async upsert(collection, idField, record) {
    return this._write(collection, (rows) => {
      const idx = rows.findIndex((r) => r[idField] === record[idField]);
      if (idx === -1) rows.push(record);
      else rows[idx] = { ...rows[idx], ...record, updated_at: new Date().toISOString() };
      return structuredClone(record);
    });
  }

  async replaceAll(collection, records) {
    return this._write(collection, (rows) => {
      rows.length = 0;
      rows.push(...records);
      return records.length;
    });
  }

  async count(collection) {
    return (await this.readAll(collection)).length;
  }
}

export const store = new JsonCollectionStore(config.paths.data);

export function makeId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}
