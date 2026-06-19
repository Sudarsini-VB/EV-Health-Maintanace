import React, { useEffect, useState } from 'react';
import { Check, Trash2, Filter } from 'lucide-react';
import Panel from '../components/Panel';
import StatusBadge from '../components/StatusBadge';
import { listAlerts, updateAlert, deleteAlert } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('open'); // open | resolved | all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      let query = '';
      if (filter === 'open') query = '?resolved=0';
      if (filter === 'resolved') query = '?resolved=1';
      const data = await listAlerts(query);
      setAlerts(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function handleResolve(id) {
    try {
      await updateAlert(id, { resolved: 1 });
      load();
    } catch (e) {
      alert(`Failed to resolve: ${e.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this alert permanently?')) return;
    try {
      await deleteAlert(id);
      load();
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Alerts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Auto-generated from ML predictions on every telemetry reading
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-panel)', padding: 4, borderRadius: 8, border: '1px solid var(--line-soft)' }}>
          {['open', 'resolved', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', fontSize: 12, borderRadius: 6, border: 'none',
                background: filter === f ? 'var(--bg-panel-raised)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
                textTransform: 'capitalize', fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Panel eyebrow={`${alerts.length} alerts`} title="Alert log">
        {loading && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>}
        {error && <div style={{ color: 'var(--status-critical)', fontSize: 13 }}>Error: {error}</div>}
        {!loading && !error && alerts.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No {filter !== 'all' ? filter : ''} alerts. Fleet is quiet.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--bg-panel-raised)',
                border: '1px solid var(--line-soft)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{a.vehicle_id}</span>
                  <StatusBadge status={a.severity} kind="severity" />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{a.alert_type}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.message}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {a.resolved === 0 && (
                  <button onClick={() => handleResolve(a.id)} style={resolveBtn} title="Mark resolved">
                    <Check size={13} /> Resolve
                  </button>
                )}
                <button onClick={() => handleDelete(a.id)} style={iconBtn} title="Delete">
                  <Trash2 size={13} color="var(--status-critical)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

const resolveBtn = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, padding: '6px 10px',
  background: 'rgba(63,193,201,0.12)', color: 'var(--status-healthy)', border: 'none',
  borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap',
};

const iconBtn = {
  background: 'transparent', border: 'none', padding: 6, borderRadius: 6, display: 'inline-flex',
};
