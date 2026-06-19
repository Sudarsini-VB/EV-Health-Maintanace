import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Car, Battery, AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Panel from '../components/Panel';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { getFleetSummary, getRankings, getRegionComparison, getModelMetrics } from '../services/api';

const HEALTH_COLORS = {
  Healthy: '#3FC1C9',
  Moderate: '#5B8FD6',
  Degraded: '#E0A23B',
  Critical: '#E2533D',
};

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [worst, setWorst] = useState([]);
  const [regions, setRegions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, w, r, m] = await Promise.all([
          getFleetSummary(),
          getRankings('worst'),
          getRegionComparison(),
          getModelMetrics(),
        ]);
        if (cancelled) return;
        setSummary(s);
        setWorst(w.slice(0, 5));
        setRegions(r);
        setMetrics(m);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const pieData = [
    { name: 'Healthy', value: summary.healthy_count },
    { name: 'Moderate', value: summary.moderate_count },
    { name: 'Degraded', value: summary.degraded_count },
    { name: 'Critical', value: summary.critical_count },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Fleet Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          {summary.total_vehicles} vehicles monitored · live battery intelligence across {regions.length} regions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Fleet Size" value={summary.total_vehicles} suffix="vehicles" icon={Car} />
        <KpiCard
          label="Avg Capacity"
          value={summary.avg_capacity_pct.toFixed(1)}
          suffix="%"
          icon={Battery}
          accent="var(--accent-cyan)"
        />
        <KpiCard
          label="Open Alerts"
          value={summary.open_alerts}
          icon={AlertTriangle}
          accent={summary.open_alerts > 0 ? 'var(--accent-amber)' : 'var(--text-primary)'}
        />
        <KpiCard label="Due Maintenance" value={summary.vehicles_due_maintenance} suffix="vehicles" icon={Wrench} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        <Panel eyebrow="Distribution" title="Fleet health breakdown">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={HEALTH_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLORS[d.name] }} />
                  <span style={{ color: 'var(--text-secondary)', minWidth: 70 }}>{d.name}</span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Climate impact"
          title="Avg capacity vs temperature by region"
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={regions} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
              <XAxis dataKey="region" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'var(--bg-panel-raised)' }}
              />
              <Bar dataKey="avg_capacity_pct" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} name="Avg capacity %" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel
        eyebrow="Priority queue"
        title="Vehicles needing attention"
        action={
          <Link to="/vehicles" style={{ fontSize: 12, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={12} />
          </Link>
        }
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>Vehicle</th>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>Model</th>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>Region</th>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>Capacity</th>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>RUL (cycles)</th>
              <th style={{ padding: '0 0 10px', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {worst.map((v) => (
              <tr key={v.vehicle_id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td className="mono" style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{v.vehicle_id}</td>
                <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{v.model}</td>
                <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{v.region}</td>
                <td className="mono" style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{v.capacity_pct.toFixed(1)}%</td>
                <td className="mono" style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{v.rul_cycles?.toFixed(0) ?? '—'}</td>
                <td style={{ padding: '10px 0' }}><StatusBadge status={v.health_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {metrics && (
        <Panel eyebrow="Model performance" title="ML pipeline diagnostics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricStat label="Health classifier" value={`${(metrics.health_classifier_accuracy * 100).toFixed(1)}%`} sub="accuracy" />
            <MetricStat label="RUL regressor" value={metrics.rul_regressor_mae} sub="MAE (cycles)" />
            <MetricStat label="RUL regressor" value={metrics.rul_regressor_r2.toFixed(3)} sub="R² score" />
            <MetricStat label="Anomaly detector" value={`${(metrics.anomaly_detection_rate * 100).toFixed(1)}%`} sub="flag rate" />
          </div>
        </Panel>
      )}
    </div>
  );
}

function MetricStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)', margin: '2px 0' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}

function LoadingState() {
  return <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading fleet data…</div>;
}

function ErrorState({ message }) {
  return (
    <div style={{ color: 'var(--status-critical)', fontSize: 13, background: 'var(--status-critical-dim)', padding: 16, borderRadius: 8 }}>
      Could not load fleet data: {message}. Confirm the API server is running at the configured URL.
    </div>
  );
}
