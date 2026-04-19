import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Save, Youtube, Music2, Apple, Waves, ExternalLink } from 'lucide-react';
import { getRelease } from '../../lib/studio/queries';
import { listReleaseStats } from '../../lib/studio/queries';
import { updatePlatformIds, upsertReleaseStat } from '../../lib/studio/mutations';
import { colors, fonts } from '../../components/studio/tokens';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNum(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Extract a plain video ID from a full YouTube URL or bare ID.
function parseYouTubeId(input) {
  if (!input) return '';
  const trim = input.trim();
  try {
    const url = new URL(trim);
    return url.searchParams.get('v') || url.pathname.split('/').pop() || trim;
  } catch {
    return trim;
  }
}

// Extract Spotify track ID from URL or bare ID.
function parseSpotifyId(input) {
  if (!input) return '';
  const trim = input.trim();
  const match = trim.match(/track\/([A-Za-z0-9]+)/);
  return match ? match[1] : trim;
}

const PLATFORMS = [
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    dim: 'rgba(255,0,0,0.12)',
    primaryLabel: 'Views',
    primaryKey: 'plays',
    secondaryFields: [
      { key: 'likes',    label: 'Likes' },
      { key: 'comments', label: 'Comments' },
    ],
    canAutoFetch: true,
    idLabel: 'Video ID or URL',
    idPlaceholder: 'https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    icon: Music2,
    color: '#1DB954',
    dim: 'rgba(29,185,84,0.10)',
    primaryLabel: 'Streams',
    primaryKey: 'plays',
    secondaryFields: [
      { key: 'saves',        label: 'Saves' },
      { key: 'likes',        label: 'Playlist adds' },
    ],
    canAutoFetch: false,
    idLabel: 'Track URL (optional)',
    idPlaceholder: 'https://open.spotify.com/track/...',
    hint: 'Copy stream count from your DistroKid → Stats page',
  },
  {
    id: 'apple_music',
    label: 'Apple Music',
    icon: Apple,
    color: '#FA243C',
    dim: 'rgba(250,36,60,0.10)',
    primaryLabel: 'Plays',
    primaryKey: 'plays',
    secondaryFields: [
      { key: 'saves', label: 'Library adds' },
    ],
    canAutoFetch: false,
    idLabel: 'Apple Music link (optional)',
    idPlaceholder: 'https://music.apple.com/...',
    hint: 'Copy play count from DistroKid → Stats → Apple Music',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    icon: Waves,
    color: '#FF5500',
    dim: 'rgba(255,85,0,0.10)',
    primaryLabel: 'Plays',
    primaryKey: 'plays',
    secondaryFields: [
      { key: 'likes',    label: 'Likes' },
      { key: 'comments', label: 'Comments' },
    ],
    canAutoFetch: false,
    idLabel: 'Track URL (optional)',
    idPlaceholder: 'https://soundcloud.com/...',
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: fonts.display, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: colors.textDim, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function StatCell({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: fonts.display, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.textDim }}>{label}</span>
      <span style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 900, lineHeight: 1, color: accent ?? colors.textPrimary }}>{formatNum(value)}</span>
    </div>
  );
}

function PlatformCard({ platform, stat, platformIds, onFetchYouTube, onManualSave, fetching }) {
  const { id, label, icon: Icon, color, dim, primaryKey, primaryLabel, secondaryFields, canAutoFetch, hint } = platform;
  const latest = stat?.latest;
  const videoId = id === 'youtube' ? parseYouTubeId(platformIds?.[id] ?? '') : null;

  // Local form state for manual entry
  const [manualValues, setManualValues] = useState({});
  const [saving, setSaving] = useState(false);

  // Pre-fill inputs with latest known values when stat loads
  useEffect(() => {
    if (!latest) return;
    const prefill = {};
    [primaryKey, ...secondaryFields.map(f => f.key)].forEach(k => {
      if (latest[k] != null) prefill[k] = String(latest[k]);
    });
    setManualValues(prefill);
  }, [latest?.id]);

  async function handleSave() {
    setSaving(true);
    const parsed = {};
    Object.entries(manualValues).forEach(([k, v]) => {
      const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n)) parsed[k] = n;
    });
    await onManualSave(id, parsed);
    setSaving(false);
  }

  const hasData = latest != null;

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${hasData ? `rgba(${hexToRgb(color)},0.25)` : colors.border}`,
      background: hasData ? dim : 'rgba(24,24,27,0.55)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={15} style={{ color }} />
          <span style={{ fontFamily: fonts.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.textSecondary }}>
            {label}
          </span>
        </div>
        {latest?.snapshot_date && (
          <span style={{ fontSize: 10, color: colors.textDim }}>
            Updated {latest.snapshot_date}
          </span>
        )}
      </div>

      {/* Stats display */}
      {hasData ? (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <StatCell label={primaryLabel} value={latest[primaryKey]} accent={color} />
          {secondaryFields.map(f => (
            <StatCell key={f.key} label={f.label} value={latest[f.key]} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: colors.textDim, lineHeight: 1.5 }}>
          No data yet.{hint ? ` ${hint}.` : ''}
        </div>
      )}

      {/* YouTube: auto-fetch */}
      {canAutoFetch && videoId && (
        <button
          onClick={() => onFetchYouTube(videoId)}
          disabled={fetching}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            padding: '7px 14px', borderRadius: 999,
            fontFamily: fonts.display, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            border: `1px solid rgba(${hexToRgb(color)},0.35)`,
            background: fetching ? 'rgba(255,255,255,0.04)' : `rgba(${hexToRgb(color)},0.1)`,
            color: fetching ? colors.textDim : color,
            cursor: fetching ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={10} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
          {fetching ? 'Fetching…' : 'Refresh from YouTube'}
        </button>
      )}

      {canAutoFetch && !videoId && (
        <span style={{ fontSize: 11, color: colors.textDim }}>
          Add a YouTube Video ID above to enable auto-fetch.
        </span>
      )}

      {/* Manual entry */}
      {!canAutoFetch && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 120px' }}>
              <label style={{ fontFamily: fonts.display, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.textDim }}>
                {primaryLabel}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={manualValues[primaryKey] ?? ''}
                onChange={e => setManualValues(v => ({ ...v, [primaryKey]: e.target.value }))}
                placeholder="e.g. 42000"
                style={{
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`,
                  borderRadius: 6, padding: '6px 10px', color: colors.textSecondary,
                  fontFamily: fonts.body, fontSize: 13, outline: 'none', width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {secondaryFields.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 100px' }}>
                <label style={{ fontFamily: fonts.display, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.textDim }}>
                  {f.label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualValues[f.key] ?? ''}
                  onChange={e => setManualValues(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder="0"
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`,
                    borderRadius: 6, padding: '6px 10px', color: colors.textSecondary,
                    fontFamily: fonts.body, fontSize: 13, outline: 'none', width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
              padding: '7px 14px', borderRadius: 999,
              fontFamily: fonts.display, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              border: `1px solid rgba(${hexToRgb(color)},0.35)`,
              background: saving ? 'rgba(255,255,255,0.04)' : `rgba(${hexToRgb(color)},0.1)`,
              color: saving ? colors.textDim : color,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Save size={10} />
            {saving ? 'Saving…' : 'Save snapshot'}
          </button>
        </div>
      )}
    </div>
  );
}

// Simple hex-to-rgb for rgba() usage
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { releaseId } = useParams();
  useOutletContext(); // keep auth context alive

  const [release, setRelease] = useState(null);
  const [stats, setStats] = useState({});     // { platform -> { latest, history[] } }
  const [platformIds, setPlatformIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingYT, setFetchingYT] = useState(false);
  const [ytError, setYtError] = useState(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [idDraft, setIdDraft] = useState({});
  const [savingIds, setSavingIds] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rel, s] = await Promise.all([
        getRelease(releaseId),
        listReleaseStats(releaseId),
      ]);
      setRelease(rel);
      setStats(s);
      const ids = rel?.platform_ids ?? {};
      setPlatformIds(ids);
      setIdDraft(ids);
      // Auto-open setup panel if nothing configured yet
      if (Object.keys(ids).length === 0) setSetupOpen(true);
    } catch (e) {
      console.error('[stats] load failed:', e);
    }
    setLoading(false);
  }, [releaseId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleFetchYouTube(videoId) {
    setFetchingYT(true);
    setYtError(null);
    try {
      const resp = await fetch(`/api/youtube-stats?videoId=${encodeURIComponent(videoId)}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Unknown error');
      await upsertReleaseStat({
        releaseId, platform: 'youtube', source: 'api',
        plays: json.views, likes: json.likes, comments: json.comments,
      });
      const fresh = await listReleaseStats(releaseId);
      setStats(fresh);
    } catch (e) {
      setYtError(e.message);
    }
    setFetchingYT(false);
  }

  async function handleManualSave(platform, values) {
    await upsertReleaseStat({ releaseId, platform, source: 'manual', ...values });
    const fresh = await listReleaseStats(releaseId);
    setStats(fresh);
  }

  async function handleSaveIds() {
    setSavingIds(true);
    const ids = {};
    PLATFORMS.forEach(p => {
      const raw = (idDraft[p.id] ?? '').trim();
      if (raw) ids[p.id] = raw;
    });
    const saved = await updatePlatformIds(releaseId, ids);
    setPlatformIds(saved ?? ids);
    setSavingIds(false);
    setSetupOpen(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 32, color: colors.textDim, fontFamily: fonts.body, fontSize: 13 }}>
        Loading stats…
      </div>
    );
  }

  const hasAnyId = Object.keys(platformIds).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0 48px' }}>
      {/* ── Back nav + title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to={`/studio/release/${releaseId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: fonts.display, fontSize: 9, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: colors.textDim, textDecoration: 'none',
              border: `1px solid ${colors.border}`, borderRadius: 999, padding: '6px 12px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = colors.textSecondary; e.currentTarget.style.borderColor = 'rgba(244,244,245,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = colors.border; }}
          >
            <ChevronLeft size={11} />
            {release?.title ?? 'Back'}
          </Link>
          <div>
            <div style={{ fontFamily: fonts.display, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#D8B4FE', marginBottom: 2 }}>
              Streaming Stats
            </div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 900, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1, margin: 0 }}>
              {release?.title}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setSetupOpen(v => !v)}
          style={{
            fontFamily: fonts.display, fontSize: 9, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: colors.textDim,
            border: `1px solid ${colors.border}`, borderRadius: 999,
            padding: '7px 14px', background: 'transparent', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = colors.textSecondary}
          onMouseLeave={e => e.currentTarget.style.color = colors.textDim}
        >
          {setupOpen ? 'Done' : hasAnyId ? 'Edit platform links' : 'Set up platforms'}
        </button>
      </div>

      {/* ── Platform ID setup panel ── */}
      {setupOpen && (
        <div style={{
          borderRadius: 14, border: '1px solid rgba(168,85,247,0.28)',
          background: 'linear-gradient(180deg, rgba(168,85,247,0.05), rgba(168,85,247,0.02))',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <SectionLabel>Platform links</SectionLabel>
          <p style={{ fontSize: 12, color: colors.textDim, lineHeight: 1.5, margin: 0 }}>
            Paste the YouTube video URL (or bare video ID) and optional links for other platforms.
            These are saved on the release and used for auto-fetching.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {PLATFORMS.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: fonts.display, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.textDim }}>
                  {p.idLabel}
                </label>
                <input
                  type="text"
                  value={idDraft[p.id] ?? ''}
                  onChange={e => setIdDraft(v => ({ ...v, [p.id]: e.target.value }))}
                  placeholder={p.idPlaceholder}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`,
                    borderRadius: 6, padding: '7px 10px', color: colors.textSecondary,
                    fontFamily: fonts.body, fontSize: 12, outline: 'none', width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveIds}
            disabled={savingIds}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
              padding: '8px 18px', borderRadius: 999,
              fontFamily: fonts.display, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #A855F7, #EC4899)',
              border: 'none', color: '#FFF', cursor: savingIds ? 'not-allowed' : 'pointer',
              opacity: savingIds ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            <Save size={10} />
            {savingIds ? 'Saving…' : 'Save links'}
          </button>
        </div>
      )}

      {/* ── YouTube fetch error ── */}
      {ytError && (
        <div style={{ borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', padding: '12px 16px', fontSize: 12, color: '#FCA5A5' }}>
          YouTube fetch failed: {ytError}
        </div>
      )}

      {/* ── Platform cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionLabel>Platform snapshots</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {PLATFORMS.map(p => (
            <PlatformCard
              key={p.id}
              platform={p}
              stat={stats[p.id]}
              platformIds={platformIds}
              onFetchYouTube={handleFetchYouTube}
              onManualSave={handleManualSave}
              fetching={p.id === 'youtube' && fetchingYT}
            />
          ))}
        </div>
      </div>

      {/* ── DistroKid hint ── */}
      <div style={{
        borderRadius: 10, border: `1px solid ${colors.border}`,
        background: 'rgba(24,24,27,0.4)', padding: '14px 18px',
        display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: colors.textDim, lineHeight: 1.5,
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span>
          For Spotify and Apple Music stream counts, open your{' '}
          <strong style={{ color: colors.textSecondary }}>DistroKid dashboard → Stats</strong>{' '}
          and copy the numbers into the cards above. Snapshots are dated so you can track growth over time.
        </span>
      </div>

      {/* Spinning animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
