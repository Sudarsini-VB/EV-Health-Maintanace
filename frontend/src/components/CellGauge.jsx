import React from 'react';

const STATUS_COLORS = {
  Healthy: 'var(--status-healthy)',
  Moderate: 'var(--status-moderate)',
  Degraded: 'var(--status-degraded)',
  Critical: 'var(--status-critical)',
};

/**
 * CellGauge — the signature visual element of EV Guardian.
 * Renders battery capacity as a circular "cell" ring, echoing the shape
 * of a battery cross-section rather than a generic progress arc.
 */
export default function CellGauge({ value, status, size = 88, label }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;
  const color = STATUS_COLORS[status] || 'var(--text-secondary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Cell terminal nub, top of ring, to echo battery iconography */}
          <rect
            x={size / 2 - 4}
            y={2}
            width={8}
            height={5}
            rx={1.5}
            fill="var(--line)"
            transform={`rotate(90 ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--line-soft)"
            strokeWidth={7}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="mono" style={{ fontSize: size * 0.22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
            {pct.toFixed(0)}
          </span>
          <span style={{ fontSize: size * 0.1, color: 'var(--text-tertiary)' }}>%</span>
        </div>
      </div>
      {label && (
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      )}
    </div>
  );
}
