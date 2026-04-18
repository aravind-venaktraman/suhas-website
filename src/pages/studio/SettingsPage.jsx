import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getCurrentProfile } from '../../lib/studio/queries';
import { updateProfile } from '../../lib/studio/mutations';
import '../studio/StudioApp.css';

const TIMEZONES = [
  { value: 'America/Chicago',    label: 'Austin (America/Chicago)' },
  { value: 'America/New_York',   label: 'New York (America/New_York)' },
  { value: 'America/Los_Angeles',label: 'Los Angeles (America/Los_Angeles)' },
  { value: 'Asia/Muscat',        label: 'Oman (Asia/Muscat)' },
  { value: 'Asia/Kolkata',       label: 'India (Asia/Kolkata)' },
  { value: 'Europe/London',      label: 'London (Europe/London)' },
  { value: 'Europe/Berlin',      label: 'Berlin (Europe/Berlin)' },
];

export default function SettingsPage() {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentProfile()
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  if (!profile) {
    return (
      <div style={{ padding: 40, color: '#71717A', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
        {error || 'Loading...'}
      </div>
    );
  }

  const avatarBg = `linear-gradient(135deg, ${profile.avatar_color_from}, ${profile.avatar_color_to})`;

  return (
    <div className="studio-settings">

      <div className="studio-settings-head">
        <div className="studio-eyebrow">Settings</div>
        <h1 className="studio-settings-title">Profile &amp; preferences</h1>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          color: '#F87171',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Identity ── */}
      <div className="studio-setting-section">
        <div className="studio-setting-section-title">Identity</div>

        <div className="studio-setting-row">
          <div>
            <div className="studio-setting-label">Display name</div>
            <div className="studio-setting-help">Shown on tasks, comments, and the activity feed.</div>
          </div>
          <input
            className="studio-input"
            value={profile.display_name}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          />
        </div>

        <div className="studio-setting-row">
          <div>
            <div className="studio-setting-label">Initials</div>
            <div className="studio-setting-help">Up to 2 characters shown inside your avatar.</div>
          </div>
          <input
            className="studio-input"
            style={{ maxWidth: 64, textAlign: 'center', minWidth: 0 }}
            maxLength={2}
            value={profile.initials}
            onChange={(e) => setProfile({ ...profile, initials: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="studio-setting-row" style={{ alignItems: 'flex-start', paddingTop: 16 }}>
          <div>
            <div className="studio-setting-label">Avatar color</div>
            <div className="studio-setting-help">Your gradient across all of Studio.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <input
                type="color"
                value={profile.avatar_color_from}
                onChange={(e) => setProfile({ ...profile, avatar_color_from: e.target.value })}
                style={{ width: 36, height: 36, cursor: 'pointer', borderRadius: 6, border: 'none', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: 9, color: '#71717A', fontFamily: "'Michroma', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</span>
            </label>
            <span style={{ color: '#71717A', fontSize: 11 }}>→</span>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <input
                type="color"
                value={profile.avatar_color_to}
                onChange={(e) => setProfile({ ...profile, avatar_color_to: e.target.value })}
                style={{ width: 36, height: 36, cursor: 'pointer', borderRadius: 6, border: 'none', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: 9, color: '#71717A', fontFamily: "'Michroma', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>To</span>
            </label>
            {/* Live preview */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#09090B',
                fontFamily: "'Michroma', sans-serif",
                flexShrink: 0,
                marginLeft: 4,
              }}
            >
              {profile.initials}
            </div>
          </div>
        </div>
      </div>

      {/* ── Timezone ── */}
      <div className="studio-setting-section">
        <div className="studio-setting-section-title">Timezone</div>

        <div className="studio-setting-row">
          <div>
            <div className="studio-setting-label">Your local timezone</div>
            <div className="studio-setting-help">
              Comments show both your time and your collaborator's time. Setting this correctly means
              timestamps are always correct for you.
            </div>
          </div>
          <select
            className="studio-input"
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            style={{ minWidth: 220 }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Account info (read-only) ── */}
      <div className="studio-setting-section">
        <div className="studio-setting-section-title">Account</div>

        <div className="studio-setting-row">
          <div>
            <div className="studio-setting-label">Email</div>
            <div className="studio-setting-help">Used for magic link sign-in. Contact Arav to change.</div>
          </div>
          <span style={{ fontSize: 13, color: '#71717A', fontFamily: "'Inter', sans-serif" }}>
            {user?.email}
          </span>
        </div>
      </div>

      <div className="studio-setting-actions">
        <button
          className="studio-btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
