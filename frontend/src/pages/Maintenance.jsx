import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Wrench, CheckCircle2 } from 'lucide-react';
import Panel from '../components/Panel';
import { listMaintenance, createMaintenance, updateMaintenance, deleteMaintenance, listVehicles } from '../services/api';

const EMPTY_FORM = { vehicle_id: '', scheduled_date: '', reason: '', notes: '' };

const STATUS_COLORS = {
  Scheduled: 'var(--accent-amber)',
  Completed: 'var(--status-healthy)',
  Cancelled: 'var(--text-tertiary)',
};

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const [m, v] = await Promise.all([listMaintenance(query), listVehicles('?limit=200')]);
      setRecords(m);
      setVehicles(v);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    try {
      await createMaintenance({
        ...form,
        scheduled_date: new Date(form.scheduled_date).toISOString(),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setFormError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateMaintenance(id, { status });
      load();
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await deleteMaintenance(id);
      load();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Maintenance</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Scheduled service actions, auto-suggested by degraded battery health
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormError(null); setShowForm(true); }} style={btnPrimary}>
          <Plus size={14} /> Schedule maintenance
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {['all', 'Scheduled', 'Completed', 'Cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 12px', fontSize: 12, borderRadius: 6,
              border: '1px solid var(--line-soft)',
              background: statusFilter === s ? 'var(--bg-panel-raised)' : 'transparent',
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <Panel eyebrow={`${records.length} records`} title="Service schedule">
        {loading && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>}
        {error && <div style={{ color: 'var(--status-critical)', fontSize: 13 }}>Error: {error}</div>}
        {!loading && !error && records.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No maintenance records.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--bg-panel-raised)',
                border: '1px solid var(--line-soft)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{r.vehicle_id}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, color: STATUS_COLORS[r.status], background: 'rgba(255,255,255,0.05)' }}
                  >
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.reason}</div>
                {r.notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.notes}</div>}
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                  Scheduled: {new Date(r.scheduled_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {r.status === 'Scheduled' && (
                  <button onClick={() => handleStatusChange(r.id, 'Completed')} style={completeBtn} title="Mark completed">
                    <CheckCircle2 size={13} /> Complete
                  </button>
                )}
                <button onClick={() => handleDelete(r.id)} style={iconBtn} title="Delete">
                  <Trash2 size={13} color="var(--status-critical)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={16} /> Schedule maintenance
              </h3>
              <button onClick={() => setShowForm(false)} style={iconBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Vehicle">
                <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} style={input}>
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id} — {v.model}</option>)}
                </select>
              </Field>
              <Field label="Scheduled date">
                <input required type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} style={input} />
              </Field>
              <Field label="Reason">
                <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={input} placeholder="Battery diagnostic check" />
              </Field>
              <Field label="Notes (optional)">
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...input, minHeight: 60, resize: 'vertical' }} />
              </Field>
              {formError && <div style={{ color: 'var(--status-critical)', fontSize: 12 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={btnPrimary}>Schedule</button>
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

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
  background: 'var(--accent-amber)', color: 'var(--bg-base)', border: 'none',
  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
};

const btnSecondary = {
  padding: '9px 14px', background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 13,
};

const completeBtn = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, padding: '6px 10px',
  background: 'rgba(63,193,201,0.12)', color: 'var(--status-healthy)', border: 'none',
  borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap',
};

const iconBtn = {
  background: 'transparent', border: 'none', padding: 6, borderRadius: 6, display: 'inline-flex',
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
