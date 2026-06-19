import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gauge, Car, Bell, Wrench, BarChart3, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Gauge },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/predict', label: 'Predict', icon: Zap },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--line-soft)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="var(--bg-base)" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>EV Guardian</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>FLEET INTELLIGENCE</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-panel-raised)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-amber)' : '2px solid transparent',
              transition: 'background 0.15s, color 0.15s',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          MODEL STATUS<br />
          <span style={{ color: 'var(--status-healthy)' }}>● ONLINE</span>
        </div>
      </div>
    </aside>
  );
}
