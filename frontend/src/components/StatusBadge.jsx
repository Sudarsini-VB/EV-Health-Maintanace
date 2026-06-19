import React from 'react';

const STATUS_STYLES = {
  Healthy: { color: 'var(--status-healthy)', bg: 'rgba(63,193,201,0.12)' },
  Moderate: { color: 'var(--status-moderate)', bg: 'rgba(91,143,214,0.12)' },
  Degraded: { color: 'var(--status-degraded)', bg: 'rgba(224,162,59,0.12)' },
  Critical: { color: 'var(--status-critical)', bg: 'rgba(226,83,61,0.14)' },
};

const SEVERITY_STYLES = {
  Low: { color: 'var(--text-secondary)', bg: 'rgba(156,165,176,0.1)' },
  Medium: { color: 'var(--status-degraded)', bg: 'rgba(224,162,59,0.12)' },
  High: { color: 'var(--accent-amber)', bg: 'rgba(242,169,59,0.14)' },
  Critical: { color: 'var(--status-critical)', bg: 'rgba(226,83,61,0.14)' },
};

export default function StatusBadge({ status, kind = 'health' }) {
  const styles = kind === 'health' ? STATUS_STYLES : SEVERITY_STYLES;
  const style = styles[status] || { color: 'var(--text-secondary)', bg: 'rgba(156,165,176,0.1)' };

  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: style.color,
        background: style.bg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
      {status}
    </span>
  );
}
