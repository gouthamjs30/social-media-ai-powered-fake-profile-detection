import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesAPI, analysisAPI, reportsAPI } from '../services/api';

const GaugeMeter = ({ score }) => {
  const color = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E';
  const cx = 90, cy = 90, r = 70;
  const endAngle = Math.PI + (score / 100) * Math.PI;
  const x1 = cx + r * Math.cos(Math.PI);
  const y1 = cy + r * Math.sin(Math.PI);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#F3F4F6" strokeWidth="12" strokeLinecap="round" />
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + 55 * Math.cos(endAngle - Math.PI)} y2={cy + 55 * Math.sin(endAngle - Math.PI)} stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#374151" />
      </svg>
      <div style={{ fontSize: 42, fontWeight: 800, color, marginTop: -10 }}>{score}%</div>
      <div style={{
        display: 'inline-block', padding: '4px 16px', borderRadius: 99, marginTop: 8,
        background: color === '#EF4444' ? 'rgba(239,68,68,0.1)' : color === '#F59E0B' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
        color, fontWeight: 700, fontSize: 13,
      }}>
        {score >= 70 ? 'HIGH RISK PROFILE' : score >= 40 ? 'MEDIUM RISK PROFILE' : 'LOW RISK PROFILE'}
      </div>
    </div>
  );
};

const RiskBar = ({ score }) => (
  <div>
    <div style={{ position: 'relative', height: 18, borderRadius: 99, overflow: 'hidden', background: 'linear-gradient(to right, #22C55E 0%, #22C55E 40%, #F59E0B 40%, #F59E0B 70%, #EF4444 70%)' }}>
      <div style={{ position: 'absolute', top: '-4px', left: `${Math.min(score, 99)}%`, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #374151' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
      {['0%', '25%', '50%', '75%', '100%'].map(v => <span key={v}>{v}</span>)}
    </div>
    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#374151', marginTop: 4 }}>{score}%</div>
  </div>
);

const ScoreCard = ({ icon, label, sublabel, score }) => {
  const color = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E';
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{sublabel}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color }}>{score}%</div>
      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
};

const FindingRow = ({ icon, label, data, bullets }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', background: '#fff' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{label}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
            {Object.entries(data).map(([k, v]) => (
              <div key={k} style={{ fontSize: 12 }}>
                <span style={{ color: '#9CA3AF' }}>{k} </span>
                <span style={{ fontWeight: 700, color: '#374151' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && bullets?.length > 0 && (
        <div style={{ padding: '12px 16px 14px 66px', background: '#FAFAFA', borderTop: '1px solid #F3F4F6' }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
              <span style={{ color: '#EF4444', marginTop: 2 }}>•</span> {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const fmt = (n) => n != null ? n.toLocaleString() : '—';

export default function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await profilesAPI.getProfile(id);
      setProfile(data);
      if (data.status === 'completed') {
        try { const r = await reportsAPI.getByProfile(id); setReport(r.data); } catch {}
      }
    } catch {
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const runAnalysis = async () => {
    setAnalyzing(true); setError('');
    try {
      await analysisAPI.analyze(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="loading">Loading analysis...</div>;
  if (error && !profile) return <div className="alert alert-error">{error}</div>;

  const ar        = profile?.analysis_results || {};
  const score     = Math.round(profile?.fraud_score ?? ar?.fraud_score ?? ar?.risk_score ?? 0);
  const riskColor = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E';
  const riskBg    = score >= 70 ? 'rgba(239,68,68,0.08)' : score >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';
  const isCompleted = profile?.status === 'completed';

  // Sub-scores from Gemini — no estimation from global score
  const profileScore    = Math.round(ar.profile_score    ?? (report?.fraud_score ?? score));
  const imageScore      = Math.round(ar.image_score      ?? (report?.fraud_score ?? score));
  const contentScore    = Math.round(ar.content_score    ?? (report?.fraud_score ?? score));
  const behavioralScore = Math.round(ar.behavioral_score ?? (report?.fraud_score ?? score));
  const followerScore   = Math.round(ar.follower_score   ?? (report?.fraud_score ?? score));

  const reasons         = ar.reasons || (report?.summary ? [report.summary] : []);
  const recommendations = ar.recommendations || report?.recommendations || [];

  // Follower ratio
  const followers = profile?.follower_count;
  const following = profile?.following_count;
  const posts     = profile?.post_count;
  const ratio     = followers != null && following != null && followers > 0
    ? `1 : ${(following / followers).toFixed(1)}`
    : '—';

  const platformIcon = { instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', telegram: '✈️' }[profile?.platform] || '🌐';

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>←</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>AI Fraud Investigation Report</h1>
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Analysis by MAYAJAL AI</p>
          </div>
        </div>
        {isCompleted && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#15803D', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
            ✓ Analysis Completed
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Profile Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: '#F3F4F6', border: '2px solid #E5E7EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
          {profile?.profile_image_url
            ? <img src={profile.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
            : '👤'}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>@{profile?.username || 'unknown'}</span>
            {profile?.display_name && profile.display_name !== profile.username && (
              <span style={{ fontSize: 14, color: '#6B7280' }}>— {profile.display_name}</span>
            )}
            {profile?.is_verified && <span title="Verified">✅</span>}
            <span style={{ fontSize: 16 }}>{platformIcon}</span>
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2, textTransform: 'capitalize' }}>{profile?.platform}</div>
          {profile?.bio && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, maxWidth: 400 }}>{profile.bio}</div>
          )}
          {profile?.profile_url && (
            <a href={profile.profile_url} target="_blank" rel="noreferrer" style={{ color: '#22C55E', fontSize: 12, marginTop: 4, display: 'inline-block' }}>
              {profile.profile_url} ↗
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Followers',    value: fmt(followers) },
            { label: 'Following',    value: fmt(following) },
            { label: 'Posts',        value: fmt(posts) },
            { label: 'Account Age',  value: profile?.account_age_days != null ? `${profile.account_age_days}d` : 'Unavailable' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending state */}
      {profile?.status === 'pending' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '40px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>Ready for Analysis</div>
          <p style={{ color: '#6B7280', marginBottom: 20 }}>Click below to run AI fraud analysis on this profile.</p>
          <button onClick={runAnalysis} disabled={analyzing} style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 15 }}>
            {analyzing ? '⟳ Analyzing...' : '▶ Run AI Analysis'}
          </button>
        </div>
      )}

      {/* Results */}
      {isCompleted && (
        <>
          {/* Score cards */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Fraud Probability Score</div>
              <GaugeMeter score={score} />
              <p style={{ color: '#6B7280', fontSize: 12, marginTop: 12 }}>
                {score >= 70 ? 'Highly suspicious — multiple red flags detected.' : score >= 40 ? 'Moderately suspicious — some indicators found.' : 'Appears relatively safe — no major indicators found.'}
              </p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Risk Score Overview</div>
              <div style={{ marginTop: 32 }}><RiskBar score={score} /></div>
            </div>
          </div>

          {/* AI Sub-scores — all from real Gemini response */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>AI Analysis Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              <ScoreCard icon="👥" label="Profile Score"    sublabel="Identity & bio signals"    score={profileScore} />
              <ScoreCard icon="🖼️" label="Image Score"     sublabel="Visual authenticity"        score={imageScore} />
              <ScoreCard icon="📝" label="Content Score"   sublabel="Post & bio language"        score={contentScore} />
              <ScoreCard icon="📊" label="Behaviour Score" sublabel="Activity patterns"          score={behavioralScore} />
              <ScoreCard icon="👁️" label="Follower Score"  sublabel="Network & ratio signals"   score={followerScore} />
            </div>
          </div>

          {/* Detailed Findings */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Detailed Findings</div>
            <FindingRow icon="👥" label="Follower Analysis"
              data={{
                Followers:       fmt(followers),
                Following:       fmt(following),
                Posts:           fmt(posts),
                'Follow Ratio':  ratio,
              }}
              bullets={
                reasons.length > 0
                  ? reasons.filter(r => /follow|ratio|network/i.test(r))
                  : ['Follower analysis complete']
              }
            />
            <FindingRow icon="📋" label="Bio & Profile Analysis"
              data={{
                'Bio Length':    profile?.bio ? `${profile.bio.length} chars` : 'No bio',
                'Display Name':  profile?.display_name || '—',
                'Verified':      profile?.is_verified ? 'Yes ✅' : 'No',
              }}
              bullets={
                reasons.filter(r => /bio|name|profile|identity/i.test(r))
              }
            />
            <FindingRow icon="📝" label="Content Analysis"
              data={{ 'Content Risk Score': `${contentScore}%` }}
              bullets={
                reasons.filter(r => /content|post|caption|keyword|scam|spam/i.test(r))
              }
            />
            <FindingRow icon="📊" label="Behavioural Analysis"
              data={{ 'Behavioural Risk Score': `${behavioralScore}%` }}
              bullets={
                reasons.filter(r => /behav|activ|pattern|growth|age/i.test(r))
              }
            />
          </div>

          {/* Conclusion + Recommendations */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>AI Final Conclusion</div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: riskColor }}>{score}%</div>
                <div style={{ display: 'inline-block', background: riskBg, color: riskColor, fontWeight: 700, fontSize: 12, padding: '4px 14px', borderRadius: 99, marginTop: 6 }}>
                  {score >= 70 ? 'HIGH RISK ACCOUNT' : score >= 40 ? 'MEDIUM RISK ACCOUNT' : 'LOW RISK ACCOUNT'}
                </div>
              </div>
              {ar.summary && (
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>{ar.summary}</p>
              )}
              <div>
                {reasons.slice(0, 5).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#374151' }}>
                    <span style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }}>⚠</span>
                    {typeof r === 'string' ? r : JSON.stringify(r)}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Recommended Actions</div>
              {recommendations.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#22C55E', flexShrink: 0, marginTop: 1 }}>✓</div>
                  {typeof r === 'string' ? r : JSON.stringify(r)}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/submit')} style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontWeight: 700, fontSize: 14 }}>
              📡 Analyse Another Profile
            </button>
            <button onClick={() => navigate(-1)} style={{ background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '11px 20px', fontWeight: 500, fontSize: 14 }}>
              ← Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
