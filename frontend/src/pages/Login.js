import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { MayajalBrand } from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await login(form.username, form.password);
      const role = data.user?.role;
      if (role === 'admin' || role === 'investigator' || role === 'organization') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 40%, #F0F9FF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background dots */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />
      {/* Corner decorations */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle at top right, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 300, height: 300, background: 'radial-gradient(circle at bottom left, rgba(34,197,94,0.06), transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <MayajalBrand />
        </div>

        {/* Dark card */}
        <div style={{
          background: '#1A1F2E',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(34,197,94,0.15)',
              border: '2px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🔒</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Welcome Back</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Sign in to continue to your account</div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handle}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>USERNAME OR EMAIL</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 16 }}>👤</span>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  placeholder="username or email"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
                    color: '#fff', borderRadius: 10, padding: '11px 12px 11px 38px',
                    width: '100%', outline: 'none', fontSize: 14,
                  }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 16 }}>🔐</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••••"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
                    color: '#fff', borderRadius: 10, padding: '11px 40px 11px 38px',
                    width: '100%', outline: 'none', fontSize: 14,
                  }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#22C55E', color: '#fff', border: 'none',
                borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 16,
                letterSpacing: 0.3, opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? 'Signing in...' : <>Sign In <span>→</span></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            No account? <Link to="/register" style={{ color: '#22C55E', fontWeight: 600 }}>Register here</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13 }}>
            <span style={{ color: '#22C55E' }}>🛡️</span>
            AI-Powered Fraud Detection Platform
          </div>
        </div>
      </div>
    </div>
  );
}
