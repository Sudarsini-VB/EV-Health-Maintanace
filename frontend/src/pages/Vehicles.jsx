import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Car } from 'lucide-react';
import Panel from '../components/Panel';
import StatusBadge from '../components/StatusBadge';
import CellGauge from '../components/CellGauge';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle, getLatestStatus, listTelemetry } from '../services/api';

const EMPTY_FORM = { vehicle_id: '', model: '', region: '', nominal_capacity_kwh: '', owner_name: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [formError, setFormError] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [vList, latest] = await Promise.all([listVehicles(), getLatestStatus()]);
      setVehicles(vList);
      const map = {};
      latest.forEach((l) => { map[l.vehicle_id] = l; });
      setStatusMap(map);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(v) {
    setForm({
      vehicle_id: v.vehicle_id,
      model: v.model,
      region: v.region,
      nominal_capacity_kwh: v.nominal_capacity_kwh,
      owner_name: v.owner_name || '',
    });
    setEditingId(v.vehicle_id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingId) {
        await updateVehicle(editingId, {
          model: form.model,
          region: form.region,
          nominal_capacity_kwh: parseFloat(form.nominal_capacity_kwh),
          owner_name: form.owner_name,
        });
      } else {
        await createVehicle({
          ...form,
          nominal_capacity_kwh: parseFloat(form.nominal_capacity_kwh),
        });
      }
      setShowForm(false);
      await loadAll();
    } catch (e) {
      setFormError(e.message);
    }
  }

  async function handleDelete(vehicleId) {
    if (!window.confirm(`Delete ${vehicleId}? This removes all its telemetry, alerts, and maintenance records.`)) return;
    try {
      await deleteVehicle(vehicleId);
      await loadAll();
      if (selectedVehicle === vehicleId) setSelectedVehicle(null);
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  async function handleSelectVehicle(vehicleId) {
    setSelectedVehicle(vehicleId);
    try {
      const data = await listTelemetry(vehicleId, 30);
      setTelemetry(data.slice().reverse());
    } catch (e) {
      setTelemetry([]);
    }
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading vehicles…</div>;
  if (error) return <div style={{ color: 'var(--status-critical)', fontSize: 13 }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vehicles</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {vehicles.length} registered · full CRUD management
          </p>
        </div>
        <button onClick={openCreateForm} style={btnPrimary}>
          <Plus size={14} /> Register vehicle
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedVehicle ? '1.6fr 1fr' : '1fr', gap: 16 }}>
        <Panel eyebrow="Fleet roster" title="All vehicles" style={{ overflow: 'visible' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={th}>Vehicle ID</th>
                  <th style={th}>Model</th>
                  <th style={th}>Region</th>
                  <th style={th}>Capacity (kWh)</th>
                  <th style={th}>Health</th>
                  <th style={th}>Owner</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const status = statusMap[v.vehicle_id];
                  return (
                    <tr
                      key={v.vehicle_id}
                      onClick={() => handleSelectVehicle(v.vehicle_id)}
                      style={{
                        borderTop: '1px solid var(--line-soft)',
                        cursor: 'pointer',
                        background: selectedVehicle === v.vehicle_id ? 'var(--bg-panel-raised)' : 'transparent',
                      }}
                    >
                      <td className="mono" style={td}>{v.vehicle_id}</td>
                      <td style={td}>{v.model}</td>
                      <td style={td}>{v.region}</td>
                      <td className="mono" style={td}>{v.nominal_capacity_kwh}</td>
                      <td style={td}>{status ? <StatusBadge status={status.health_status} /> : <span style={{ color: 'var(--text-tertiary)' }}>No data</span>}</td>
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>{v.owner_name || '—'}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button onClick={(e) => { e.stopPropagation(); openEditForm(v); }} style={iconBtn} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(v.vehicle_id); }} style={{ ...iconBtn, color: 'var(--status-critical)' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {selectedVehicle && (
          <Panel
            eyebrow="Detail"
            title={selectedVehicle}
            action={<button onClick={() => setSelectedVehicle(null)} style={iconBtn}><X size={14} /></button>}
          >
            {statusMap[selectedVehicle] && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <CellGauge
                  value={statusMap[selectedVehicle].capacity_pct}
                  status={statusMap[selectedVehicle].health_status}
                  size={100}
                  label="Capacity"
                />
              </div>
            )}
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Recent telemetry
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }} className="scrollbar-thin">
              {telemetry.length === 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No telemetry records yet.</div>}
              {telemetry.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 12 }}>
                  <span className="mono" style={{ color: 'var(--text-tertiary)' }}>Cycle {t.cycle}</span>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>{t.capacity_pct.toFixed(1)}%</span>
                  <StatusBadge status={t.health_status} />
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={16} /> {editingId ? `Edit ${editingId}` : 'Register new vehicle'}
              </h3>
              <button onClick={() => setShowForm(false)} style={iconBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!editingId && (
                <Field label="Vehicle ID">
                  <input required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} style={input} placeholder="EV-061" />
                </Field>
              )}
              <Field label="Model">
                <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} style={input} placeholder="Tata Nexon EV" />
              </Field>
              <Field label="Region">
                <input required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={input} placeholder="Madurai" />
              </Field>
              <Field label="Nominal capacity (kWh)">
                <input required type="number" step="0.1" value={form.nominal_capacity_kwh} onChange={(e) => setForm({ ...form, nominal_capacity_kwh: e.target.value })} style={input} placeholder="30.2" />
              </Field>
              <Field label="Owner name (optional)">
                <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} style={input} placeholder="A. Kumar" />
              </Field>
              {formError && <div style={{ color: 'var(--status-critical)', fontSize: 12 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={btnPrimary}>{editingId ? 'Save changes' : 'Register vehicle'}</button>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
      {label}
      {children}
    </label>
  );
}

const th = { padding: '0 12px 10px 0', fontWeight: 500 };
const td = { padding: '10px 12px 10px 0', color: 'var(--text-primary)' };

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
  background: 'var(--accent-amber)', color: 'var(--bg-base)', border: 'none',
  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
};

const btnSecondary = {
  padding: '9px 14px', background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 13,
};

const iconBtn = {
  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
  padding: 5, borderRadius: 4, display: 'inline-flex',
};

const input = {
  background: 'var(--bg-inset)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
  padding: '9px 10px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
};

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 100,
};

const modal = {
  background: 'var(--bg-panel-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
  padding: 24, width: 380, boxShadow: 'var(--shadow-panel)',
};
