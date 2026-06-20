import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isPrivileged = ['admin', 'investigator', 'organization'].includes(user?.role);

  useEffect(() => {
    const load = async () => {
      try {
        const res = isPrivileged ? await profilesAPI.allProfiles() : await profilesAPI.myProfiles();
        setProfiles((res.data || []).filter(p => p.status === 'completed'));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [isPrivileged]);

  const riskColor = (s) => s >= 75 ? '#EF4444' : s >= 45 ? '#D97706' : '#22C55E';
  const riskBg = (s) => s >= 75 ? 'rgba(239,68,68,0.1)' : s >= 45 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';
  const riskLabel = (s) => s >= 75 ? 'High' : s >= 45 ? 'Medium' : 'Low';

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Analysis Reports</h1>
        <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>View completed fraud analysis reports.</p>
      </div>

      {profiles.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '48px', textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 600 }}>No completed analyses yet</div>
          <button onClick={() => navigate('/submit')} style={{ marginTop: 12, background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14 }}>
            Submit a Profile
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Platform</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Analyzed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111' }}>{p.username || p.display_name || 'Unknown'}</div>
                    {p.display_name && p.username && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.display_name}</div>}
                  </td>
                  <td>
                    <span style={{ background: '#F3F4F6', borderRadius: 6, padding: '3px 8px', fontSize: 12, textTransform: 'capitalize' }}>📸 {p.platform}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ height: '100%', width: `${p.fraud_score ?? 0}%`, background: riskColor(p.fraud_score ?? 0), borderRadius: 99 }} />
                      </div>
                      <span style={{ fontWeight: 700, color: riskColor(p.fraud_score ?? 0) }}>{Math.round(p.fraud_score ?? 0)}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: riskBg(p.fraud_score ?? 0), color: riskColor(p.fraud_score ?? 0), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                      {riskLabel(p.fraud_score ?? 0)} Risk
                    </span>
                  </td>
                  <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.analyzed_at ? new Date(p.analyzed_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => navigate(`/profile/${p.id}`)} style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>
                      View Report →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
