const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch (_) {
      // response had no JSON body (e.g. 204 No Content on error path) — keep default detail
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------- Fleet Analytics ----------
export const getFleetSummary = () => request('/api/fleet/summary');
export const getLatestStatus = () => request('/api/fleet/latest-status');
export const getRankings = (order = 'worst') => request(`/api/fleet/rankings?order=${order}`);
export const getRegionComparison = () => request('/api/fleet/region-comparison');
export const getModelMetrics = () => request('/api/predict/model-metrics');

// ---------- Vehicles CRUD ----------
export const listVehicles = (params = '') => request(`/api/vehicles/${params}`);
export const getVehicle = (id) => request(`/api/vehicles/${id}`);
export const createVehicle = (data) => request('/api/vehicles/', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicle = (id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicle = (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' });

// ---------- Telemetry CRUD ----------
export const listTelemetry = (vehicleId, limit = 60) =>
  request(`/api/telemetry/?vehicle_id=${vehicleId}&limit=${limit}`);
export const createTelemetry = (data) => request('/api/telemetry/', { method: 'POST', body: JSON.stringify(data) });
export const updateTelemetry = (id, data) => request(`/api/telemetry/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTelemetry = (id) => request(`/api/telemetry/${id}`, { method: 'DELETE' });

// ---------- Alerts CRUD ----------
export const listAlerts = (params = '') => request(`/api/alerts/${params}`);
export const createAlert = (data) => request('/api/alerts/', { method: 'POST', body: JSON.stringify(data) });
export const updateAlert = (id, data) => request(`/api/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAlert = (id) => request(`/api/alerts/${id}`, { method: 'DELETE' });

// ---------- Maintenance CRUD ----------
export const listMaintenance = (params = '') => request(`/api/maintenance/${params}`);
export const createMaintenance = (data) => request('/api/maintenance/', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenance = (id, data) => request(`/api/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaintenance = (id) => request(`/api/maintenance/${id}`, { method: 'DELETE' });

// ---------- Direct Prediction ----------
export const predictBatteryState = (data) => request('/api/predict/', { method: 'POST', body: JSON.stringify(data) });
