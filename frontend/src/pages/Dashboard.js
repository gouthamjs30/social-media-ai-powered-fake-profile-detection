import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profilesAPI, analysisAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RiskBadge = ({ level }) => {
  const map = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E', Safe: '#22C55E' };
  const bg = { High: 'rgba(239,68,68,0.1)', Medium: 'rgba(245,158,11,0.1)', Low: 'rgba(34,197,94,0.1)', Safe: 'rgba(34,197,94,0.1)' };
  if (!level) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>;
  return (
    <span style={{ background: bg[level] || 'rgba(0,0,0,0.05)', color: map[level] || '#6B7280', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      {level}
    </span>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPrivileged = ['admin', 'investigator', 'organization'].includes(user?.role);

  useEffect(() => {
    const load = async () => {
      try {
        const pRes = isPrivileged ? await profilesAPI.allProfiles() : await profilesAPI.myProfiles();
        setProfiles(pRes.data || []);
        if (isPrivileged) {
          const sRes = await analysisAPI.getStats();
          setStats(sRes.data || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPrivileged]);

  if (loading) return <div className="loading">Loading...</div>;

  const myStats = {
    total: profiles.length,
    high: profiles.filter(p => p.risk_level === 'High' || p.risk_level === 'HIGH').length,
    medium: profiles.filter(p => p.risk_level === 'Medium' || p.risk_level === 'MEDIUM').length,
    completed: profiles.filter(p => p.status === 'completed').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>
            Welcome back, {user?.full_name || user?.username} 👋
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Monitor your submitted profiles and analysis results.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/submit')}>
          + Submit Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Submitted', value: myStats.total, icon: '🔍', color: '#22C55E' },
          { label: 'High Risk Found', value: myStats.high, icon: '🚨', color: '#EF4444' },
          { label: 'Medium Risk', value: myStats.medium, icon: '⚠️', color: '#F59E0B' },
          { label: 'Completed', value: myStats.completed, icon: '✅', color: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: `rgba(0,0,0,0.04)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>
            {isPrivileged ? 'All Submitted Profiles' : 'My Submitted Profiles'}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{profiles.length} total</span>
        </div>

        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6B7280' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No profiles submitted yet</div>
            <Link to="/submit" style={{ color: '#22C55E', fontSize: 13 }}>Submit your first profile →</Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {['Platform', 'Username', 'Display Name', 'Status', 'Risk Level', 'Score', 'Date', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{ background: '#F3F4F6', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{p.platform}</span>
                  </td>
                  <td style={{ fontWeight: 500, color: '#111' }}>{p.username || '—'}</td>
                  <td>{p.display_name || '—'}</td>
                  <td>
                    <span style={{
                      background: p.status === 'completed' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                      color: p.status === 'completed' ? '#15803D' : '#D97706',
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                    }}>{p.status}</span>
                  </td>
                  <td><RiskBadge level={p.risk_level} /></td>
                  <td style={{ fontWeight: 700, color: (p.fraud_score ?? 0) >= 75 ? '#EF4444' : (p.fraud_score ?? 0) >= 45 ? '#D97706' : '#22C55E' }}>
                    {p.fraud_score != null ? `${Math.round(p.fraud_score)}%` : '—'}
                  </td>
                  <td style={{ color: '#9CA3AF' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => navigate(`/profile/${p.id}`)} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#374151' }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
