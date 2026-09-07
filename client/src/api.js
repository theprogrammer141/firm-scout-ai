const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // ICP
  analyzeIcp: (body) =>
    request('/icp/analyze', { method: 'POST', body: JSON.stringify(body) }),
  getScenarios: () => request('/icp/scenarios'),

  // Discover
  discover: (body) =>
    request('/discover', { method: 'POST', body: JSON.stringify(body) }),
  getBusinesses: () => request('/businesses'),

  // Analyze
  analyzeLead: (body) =>
    request('/analyze', { method: 'POST', body: JSON.stringify(body) }),
  getJob: (id) => request(`/job/${id}`),

  // Leads
  getLeads: () => request('/leads'),
  getLead: (id) => request(`/leads/${id}`),
  updateLeadStatus: (id, body) =>
    request(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  getLeadResearch: (id) => request(`/leads/${id}/research`),
  getLeadOpportunities: (id) => request(`/leads/${id}/opportunities`),
  getLeadOutreach: (id) => request(`/leads/${id}/outreach`),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  // Settings
  getAiStatus: () => request('/settings/ai-status'),
  probeAi: () => request('/settings/probe', { method: 'POST' }),
  getConfig: () => request('/settings/config'),
};
