import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import Panel from '../components/Panel';
import StatusBadge from '../components/StatusBadge';
import { getRankings, getRegionComparison } from '../services/api';

export default function Analytics() {
  const [worst, setWorst] = useState([]);
  const [best, setBest] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [w, b, r] = await Promise.all([
          getRankings('worst'),
          getRankings('best'),
          getRegionComparison(),
        ]);
        setWorst(w);
        setBest(b);
        setRegions(r);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading analytics…</div>;
  if (error) return <div style={{ color: 'var(--status-critical)', fontSize: 13 }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Fleet Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Cross-vehicle comparisons for maintenance prioritization and climate impact analysis
        </p>
      </div>

      <Panel eyebrow="Climate correlation" title="Capacity vs ambient temperature by region">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" />
            <XAxis
              type="number"
              dataKey="avg_temperature_c"
              name="Avg Temperature"
              unit="°C"
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={{ stroke: 'var(--line)' }}
              label={{ value: 'Avg Temperature (°C)', position: 'bottom', fill: 'var(--text-tertiary)', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="avg_capacity_pct"
              name="Avg Capacity"
              unit="%"
              domain={[70, 95]}
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={false}
              label={{ value: 'Avg Capacity (%)', angle: -90, position: 'left', fill: 'var(--text-tertiary)', fontSize: 11 }}
            />
            <ZAxis dataKey="vehicle_count" range={[80, 400]} name="Fleet size" />
            <Tooltip
              contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
              cursor={{ stroke: 'var(--accent-amber)' }}
              formatter={(value, name) => [value, name]}
              labelFormatter={() => ''}
            />
            <Scatter data={regions} fill="var(--accent-amber)" name="Region" />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
          Bubble size reflects fleet size per region. Hover for region detail.
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RankingTable title="Lowest battery health (priority)" data={worst} />
        <RankingTable title="Highest battery health" data={best} />
      </div>
    </div>
  );
}

function RankingTable({ title, data }) {
  return (
    <Panel eyebrow="Ranking" title={title}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <th style={{ padding: '0 0 8px' }}>Vehicle</th>
            <th style={{ padding: '0 0 8px' }}>Capacity</th>
            <th style={{ padding: '0 0 8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 8).map((v) => (
            <tr key={v.vehicle_id} style={{ borderTop: '1px solid var(--line-soft)' }}>
              <td className="mono" style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{v.vehicle_id}</td>
              <td className="mono" style={{ padding: '8px 0' }}>{v.capacity_pct.toFixed(1)}%</td>
              <td style={{ padding: '8px 0' }}><StatusBadge status={v.health_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
