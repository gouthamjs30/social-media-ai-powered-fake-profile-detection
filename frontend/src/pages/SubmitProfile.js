import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesAPI, analysisAPI } from '../services/api';

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="rgba(34,197,94,0.12)"/>
    <path d="M5.5 9L7.5 11L12.5 6.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InputWithCheck = ({ value, ...props }) => (
  <div style={{ position: 'relative' }}>
    <input value={value} {...props} style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 36px 9px 12px', fontSize: 14, outline: 'none', background: '#fff', color: '#111', ...props.style }} />
    {value && (
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
        <CheckIcon />
      </span>
    )}
  </div>
);

const platforms = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'twitter', label: 'Twitter (X)', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '🌐' },
];

export default function SubmitProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    platform: 'instagram', username: '', profile_url: '', display_name: '',
    bio: '', follower_count: '', following_count: '', post_count: '',
    account_age_days: '', profile_image_url: '', notes: '',
    sample_posts: ['', '', ''],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchNote, setFetchNote] = useState('');
  const [fetched, setFetched] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFetch = async () => {
    if (!form.username.trim()) { setError('Enter a username to fetch.'); return; }
    setError(''); setFetchNote(''); setFetchLoading(true); setFetched(false);
    try {
      const { data } = await profilesAPI.fetchProfile(form.platform, form.username.trim());

      if (data.success === false) {
        // Always pre-fill the profile URL even on failure
        setForm(f => ({ ...f, profile_url: data.profile_url || f.profile_url }));
        setError(data.error || 'Could not fetch profile automatically. Please fill in the details manually.');
        return;
      }

      setForm(f => ({
        ...f,
        username: data.username || f.username,
        display_name: data.display_name || f.display_name,
        profile_url: data.profile_url || f.profile_url,
        bio: data.bio != null ? data.bio : f.bio,
        follower_count: data.follower_count != null ? String(data.follower_count) : f.follower_count,
        following_count: data.following_count != null ? String(data.following_count) : f.following_count,
        post_count: data.post_count != null ? String(data.post_count) : f.post_count,
        account_age_days: data.account_age_days != null ? String(data.account_age_days) : f.account_age_days,
        profile_image_url: data.profile_image_url || f.profile_image_url,
      }));
      setFetched(true);
      setFetchNote(data.fetch_note || 'Profile data loaded from Instagram.');
    } catch (err) {
      setError('Could not fetch profile. You can fill in the details manually.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        follower_count: form.follower_count ? parseInt(form.follower_count) : null,
        following_count: form.following_count ? parseInt(form.following_count) : null,
        post_count: form.post_count ? parseInt(form.post_count) : null,
        account_age_days: form.account_age_days ? parseInt(form.account_age_days) : null,
        sample_posts: form.sample_posts.filter(Boolean),
      };
      const { data } = await profilesAPI.submit(payload);
      // If auto-analysis didn't complete in the backend, run it now
      if (data.status !== 'completed') {
        try { await analysisAPI.analyze(data.id); } catch {}
      }
      navigate(`/profile/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel = (text) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#22C55E', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9 }}>▶</span> {text}
    </div>
  );

  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' };
  const inputStyle = { width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 36px 9px 12px', fontSize: 14, outline: 'none', background: '#fff', color: '#111' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate('/dashboard')} style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Submit Suspicious Profile</h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>Enter a platform and username — we'll try to auto-fetch the profile details.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: '#EF4444', fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#B91C1C', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Profile Fetch Failed</div>
            <div style={{ color: '#374151', fontSize: 13 }}>{error}</div>
            {form.profile_url && (
              <a href={form.profile_url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                🔗 Open on Instagram ↗
              </a>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handle}>
        {/* Basic Information */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
          {sectionLabel('Basic Information')}

          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>PLATFORM *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
                  {platforms.find(p => p.value === form.platform)?.icon || '📸'}
                </span>
                <select value={form.platform} onChange={e => { set('platform', e.target.value); setFetched(false); setFetchNote(''); }} required style={{ ...inputStyle, paddingLeft: 34, paddingRight: 36, appearance: 'none' }}>
                  {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none', fontSize: 11 }}>▼</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>USERNAME *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <InputWithCheck
                    value={form.username}
                    onChange={e => { set('username', e.target.value); setFetched(false); setFetchNote(''); }}
                    required
                    placeholder="@username or handle"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={fetchLoading || !form.username.trim()}
                  style={{
                    background: fetched ? 'rgba(34,197,94,0.1)' : '#111', color: fetched ? '#22C55E' : '#fff',
                    border: fetched ? '1.5px solid rgba(34,197,94,0.3)' : 'none',
                    borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13,
                    whiteSpace: 'nowrap', opacity: fetchLoading || !form.username.trim() ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {fetchLoading ? '⟳ Fetching...' : fetched ? '✓ Fetched' : '🔍 Fetch Profile'}
                </button>
              </div>
              {fetchNote && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#22C55E' }}>ℹ</span> {fetchNote}
                </div>
              )}
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>DISPLAY NAME</label>
              <InputWithCheck value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label style={labelStyle}>PROFILE URL</label>
              <InputWithCheck value={form.profile_url} onChange={e => set('profile_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {form.profile_image_url && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={form.profile_image_url}
                alt="profile"
                style={{ width: 52, height: 52, borderRadius: 99, objectFit: 'cover', border: '2px solid #E5E7EB' }}
                onError={e => e.target.style.display = 'none'}
              />
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>PROFILE IMAGE URL</label>
                <InputWithCheck value={form.profile_image_url} onChange={e => set('profile_image_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}
          {!form.profile_image_url && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>PROFILE IMAGE URL</label>
              <InputWithCheck value={form.profile_image_url} onChange={e => set('profile_image_url', e.target.value)} placeholder="https://..." />
            </div>
          )}

          <div>
            <label style={labelStyle}>BIO / DESCRIPTION</label>
            <div style={{ position: 'relative' }}>
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Copy-paste the account bio here..." style={{ ...inputStyle, resize: 'vertical', paddingRight: 12 }} />
              {form.bio && <span style={{ position: 'absolute', right: 10, top: 10 }}><CheckIcon /></span>}
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
          {sectionLabel('Account Statistics')}
          <div className="grid-4">
            {[
              { k: 'follower_count', label: 'FOLLOWERS' },
              { k: 'following_count', label: 'FOLLOWING' },
              { k: 'post_count', label: 'POSTS' },
              { k: 'account_age_days', label: 'AGE (DAYS)' },
            ].map(f => (
              <div key={f.k}>
                <label style={labelStyle}>{f.label}</label>
                <InputWithCheck type="number" min="0" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
        </div>

        {/* Sample Posts */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
          {sectionLabel('Sample Posts / Captions')}
          <div className="grid-3">
            {form.sample_posts.map((post, i) => (
              <div key={i}>
                <label style={labelStyle}>POST {i + 1}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={post}
                    onChange={e => {
                      const posts = [...form.sample_posts];
                      posts[i] = e.target.value;
                      set('sample_posts', posts);
                    }}
                    placeholder={`Caption ${i + 1}...`}
                    style={{ ...inputStyle, paddingRight: post ? 36 : 12 }}
                  />
                  {post && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><CheckIcon /></span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investigator Notes */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          {sectionLabel('Investigator Notes')}
          <label style={labelStyle}>ADDITIONAL NOTES</label>
          <div style={{ position: 'relative' }}>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional context, suspicious behaviours observed..." style={{ ...inputStyle, resize: 'vertical', paddingRight: 12 }} />
            {form.notes && <span style={{ position: 'absolute', right: 10, top: 10 }}><CheckIcon /></span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading} style={{
            background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8,
            padding: '11px 28px', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '⟳ Analyzing...' : <><span>📡</span> Submit for Analysis →</>}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} style={{
            background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8,
            padding: '11px 20px', fontWeight: 500, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ✕ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
