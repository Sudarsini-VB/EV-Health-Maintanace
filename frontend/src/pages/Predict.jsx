import React, { useState } from 'react';
import { Zap, AlertOctagon } from 'lucide-react';
import Panel from '../components/Panel';
import CellGauge from '../components/CellGauge';
import StatusBadge from '../components/StatusBadge';
import { predictBatteryState } from '../services/api';

const DEFAULTS = {
  voltage_v: 360,
  current_a: 80,
  temperature_c: 30,
  internal_resistance_ohm: 0.095,
  soc_pct: 70,
  depth_of_discharge_pct: 60,
  fast_charge_event: 0,
  ambient_humidity_pct: 55,
  cycle: 100,
};

const FIELDS = [
  { key: 'voltage_v', label: 'Voltage', unit: 'V', min: 200, max: 420, step: 1 },
  { key: 'current_a', label: 'Current', unit: 'A', min: 0, max: 150, step: 1 },
  { key: 'temperature_c', label: 'Temperature', unit: '°C', min: 10, max: 55, step: 0.5 },
  { key: 'internal_resistance_ohm', label: 'Internal resistance', unit: 'Ω', min: 0.07, max: 0.2, step: 0.001 },
  { key: 'soc_pct', label: 'State of charge', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'depth_of_discharge_pct', label: 'Depth of discharge', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'ambient_humidity_pct', label: 'Ambient humidity', unit: '%', min: 20, max: 95, step: 1 },
  { key: 'cycle', label: 'Charge cycle count', unit: '', min: 1, max: 1500, step: 1 },
];

export default function Predict() {
  const [values, setValues] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runPrediction(newValues) {
    setLoading(true);
    try {
      const res = await predictBatteryState(newValues);
      setResult(res);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, value) {
    const updated = { ...values, [key]: parseFloat(value) };
    setValues(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    runPrediction(values);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Live Prediction Console</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Feed simulated BMS sensor readings into the model and see the fleet AI respond in real time
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <Panel eyebrow="Simulated BMS input" title="Sensor readings">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{f.label}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {values[f.key]}{f.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
                />
              </div>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={values.fast_charge_event === 1}
                onChange={(e) => setValues({ ...values, fast_charge_event: e.target.checked ? 1 : 0 })}
              />
              This cycle includes a fast-charge event
            </label>

            <button type="submit" disabled={loading} style={btnPrimary}>
              <Zap size={14} /> {loading ? 'Running model…' : 'Run prediction'}
            </button>
          </form>
        </Panel>

        <Panel eyebrow="Model output" title="Prediction result">
          {!result && !error && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              Adjust sensor values and run a prediction to see the model's assessment.
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--status-critical)', fontSize: 13 }}>Prediction failed: {error}</div>
          )}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CellGauge value={values.soc_pct} status={result.health_status} size={110} label="Health status" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StatusBadge status={result.health_status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Stat label="Confidence" value={`${(result.health_confidence * 100).toFixed(1)}%`} />
                <Stat label="Predicted RUL" value={`${result.predicted_rul_cycles.toFixed(0)} cycles`} />
              </div>

              {result.is_anomaly && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 12, background: 'var(--status-critical-dim)', borderRadius: 8 }}>
                  <AlertOctagon size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                    Anomaly flagged (score: {result.anomaly_score}). This reading deviates from learned normal battery behavior.
                  </div>
                </div>
              )}

              <div style={{ padding: 12, background: 'var(--bg-panel-raised)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {result.recommendation}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-inset)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const btnPrimary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px',
  background: 'var(--accent-amber)', color: 'var(--bg-base)', border: 'none',
  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, marginTop: 4,
};
