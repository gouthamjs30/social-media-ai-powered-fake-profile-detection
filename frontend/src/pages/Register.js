import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { MayajalBrand } from '../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    background: '#fff', border: '1.5px solid #E5E7EB',
    color: '#111', borderRadius: 10, padding: '11px 12px 11px 38px',
    width: '100%', outline: 'none', fontSize: 14,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 40%, #F0F9FF 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, opacity: 0.4, backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle at top right, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500 }}>
        <div style={{ marginBottom: 32 }}>
          <MayajalBrand />
        </div>

        {/* White card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🛡️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>Create Account</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Join MAYAJAL and stay protected online</div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handle}>
            <div className="grid-2">
              <div>
                <div className="form-label">USERNAME</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 15 }}>👤</span>
                  <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required placeholder="your_username" style={fieldStyle} />
                </div>
              </div>
              <div>
                <div className="form-label">FULL NAME</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 15 }}>👤</span>
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="John Doe" style={fieldStyle} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="form-label">EMAIL</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 15 }}>✉️</span>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" style={fieldStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="form-label">PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 15 }}>🔐</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  required placeholder="••••••••••"
                  style={{ ...fieldStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className="form-label">ROLE</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', fontSize: 15 }}>👥</span>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} style={{ ...fieldStyle, appearance: 'none' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#22C55E', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 16,
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? 'Creating...' : <>Create Account <span>→</span></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9CA3AF' }}>
            Have an account? <Link to="/login" style={{ color: '#22C55E', fontWeight: 600 }}>Sign in</Link>
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
