import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { store, COLLECTIONS, makeId } from '../src/lib/store.js';

// The store methods accept the collection *key* (e.g. 'businesses'),
// not the filename stored in COLLECTIONS values.
const BIZ = 'businesses';

describe('JsonCollectionStore', () => {
  before(async () => {
    await store.init();
    // Clear businesses collection so tests are isolated
    await store.replaceAll(BIZ, []);
  });

  after(async () => {
    // Best-effort cleanup: leave the collection empty
    await store.replaceAll(BIZ, []);
  });

  it('makeId generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeId('test')));
    assert.equal(ids.size, 100);
  });

  it('insert and findById work', async () => {
    const item = { business_id: 'test-1', name: 'Test Business', industry: 'Dental' };
    await store.insert(BIZ, item);
    const found = await store.findById(BIZ, 'business_id', 'test-1');
    assert.equal(found.name, 'Test Business');
  });

  it('find with filter works', async () => {
    await store.insert(BIZ, { business_id: 'test-2', name: 'Another', industry: 'Real Estate' });
    const results = await store.find(BIZ, b => b.industry === 'Real Estate');
    assert.ok(results.length >= 1);
    assert.equal(results[0].industry, 'Real Estate');
  });

  it('update modifies existing record', async () => {
    await store.update(BIZ, 'business_id', 'test-1', { name: 'Updated Name' });
    const found = await store.findById(BIZ, 'business_id', 'test-1');
    assert.equal(found.name, 'Updated Name');
  });

  it('upsert creates if not exists', async () => {
    await store.upsert(BIZ, 'business_id', { business_id: 'test-upsert', name: 'Upserted' });
    const found = await store.findById(BIZ, 'business_id', 'test-upsert');
    assert.equal(found.name, 'Upserted');
  });

  it('count returns correct number', async () => {
    const count = await store.count(BIZ);
    assert.ok(count >= 2); // At least test-1 and test-2
  });

  it('replaceAll replaces entire collection', async () => {
    await store.replaceAll(BIZ, [{ business_id: 'only-one', name: 'Solo' }]);
    const count = await store.count(BIZ);
    assert.equal(count, 1);
    const found = await store.findById(BIZ, 'business_id', 'only-one');
    assert.equal(found.name, 'Solo');
  });
});
