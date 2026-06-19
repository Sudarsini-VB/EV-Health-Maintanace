import React from 'react';

export default function Panel({ title, eyebrow, action, children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--line-soft)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-panel)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line-soft)',
          }}
        >
          <div>
            {eyebrow && (
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', marginBottom: 2 }}>
                {eyebrow}
              </div>
            )}
            {title && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}
