import React from 'react';

export default function KpiCard({ label, value, suffix, accent, icon: Icon, sub }) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--line-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && <Icon size={14} color={accent || 'var(--text-tertiary)'} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: accent || 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{suffix}</span>}
      </div>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  );
}
