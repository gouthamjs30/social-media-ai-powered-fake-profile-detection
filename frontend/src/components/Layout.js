import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { SpiderWebLogo } from './Logo';

const navItems = (isAdmin) => [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/submit', icon: '⊕', label: 'Submit Profile' },
  ...(isAdmin ? [
    { to: '/reports', icon: '📋', label: 'Analysis Reports' },
    { to: '/admin', icon: '⚙', label: 'Admin Panel' },
  ] : [
    { to: '/reports', icon: '📋', label: 'Reports' },
  ]),
  { to: '/settings', icon: '⚙', label: 'Settings', disabled: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ['admin', 'investigator', 'organization'].includes(user?.role);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <SpiderWebLogo size={36} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>
              <span>MAYA</span><span style={{ color: '#22C55E' }}>JAL</span>
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: 0.3 }}>Fraud Detection</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {[
            { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
            { to: '/submit', icon: '⊕', label: 'Submit Profile' },
            { to: '/reports', icon: '📊', label: 'Analysis Reports' },
            { to: '/profiles', icon: '🔍', label: 'Profile Analyses', disabled: true },
            { to: '/alerts', icon: '⚠', label: 'Risk Alerts', disabled: true },
            ...(isAdmin ? [{ to: '/admin', icon: '📋', label: 'Admin Panel' }] : []),
          ].map(item => (
            item.disabled ? (
              <div key={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                color: '#D1D5DB', fontSize: 14, cursor: 'not-allowed',
              }}>
                <span style={{ fontSize: 14, opacity: 0.5 }}>{item.icon}</span>
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#22C55E' : '#6B7280',
                  background: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                  transition: 'all 0.12s',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ fontSize: 14, color: isActive ? '#22C55E' : '#9CA3AF' }}>{item.icon}</span>
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {user?.full_name?.[0] || user?.username?.[0] || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 12 }}>▾</span>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, background: 'transparent',
            border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 13, fontWeight: 500,
            transition: 'all 0.12s',
          }}>
            <span>⏻</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
