import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, AlertTriangle, Flame, CheckCircle2,
  Sparkles, Clock, Calendar, Layers, Disc3, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { listReleasesWithStats, computePortfolioStats } from '../../lib/studio/queries';
import { createAlbum } from '../../lib/studio/mutations';
import {
  loadAlbumOrder, loadSinglesOrder,
  saveAlbumOrder, saveSinglesOrder,
  applyOrder,
} from '../../lib/studio/background';
import ReleaseCard from '../../components/studio/ReleaseCard';
import './HomePage.css';

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'active',   label: 'Active' },
  { id: 'planning', label: 'Planning' },
  { id: 'released', label: 'Released' },
];

export default function HomePage() {
  const [releases, setReleases]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [query, setQuery]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  // Bump to re-read saved order after a drag commits. Cheap, avoids needing
  // to mirror localStorage in React state.
  const [orderVersion, setOrderVersion] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Initial load + on-demand reload.
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await listReleasesWithStats();
      setReleases(data);
      setError(null);
    } catch (err) {
      setError(err.message ?? 'Failed to load releases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates: any insert/update/delete on tasks, checklist, or releases
  // debounce-refetches the aggregate query. Keeps the homepage honest if
  // someone completes a task on another device.
  useEffect(() => {
    function scheduleReload() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setRefreshing(true);
      debounceRef.current = setTimeout(() => load({ silent: true }), 400);
    }

    const channel = supabase
      .channel('studio-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'release_checklist' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'releases' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workstreams' }, scheduleReload)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Cmd/Ctrl-K focuses the search input.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const portfolio = useMemo(
    () => (releases.length > 0 ? computePortfolioStats(releases) : null),
    [releases],
  );

  // Only top-level releases show in the grid. Children appear nested under
  // their album card (or surface as standalone when search matches them).
  const topLevel = useMemo(
    () => releases.filter((r) => !r.parent_release_id),
    [releases],
  );

  // Default status-bucket sort (used when the user hasn't manually reordered).
  const defaultSort = (a, b) => {
    const bucket = (r) => {
      if (r.status === 'archived') return 3;
      if (r.status === 'released') return 2;
      return 1;
    };
    const ba = bucket(a); const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    if (ba === 1) {
      const at = a.target_date ? new Date(a.target_date).getTime() : Number.POSITIVE_INFINITY;
      const bt = b.target_date ? new Date(b.target_date).getTime() : Number.POSITIVE_INFINITY;
      if (at !== bt) return at - bt;
      return a.title.localeCompare(b.title);
    }
    if (ba === 2) {
      const ar = a.released_at ? new Date(a.released_at).getTime() : 0;
      const br = b.released_at ? new Date(b.released_at).getTime() : 0;
      return br - ar;
    }
    return (a.title ?? '').localeCompare(b.title ?? '');
  };

  // Split albums from everything else so we can group them in the UI.
  const rawAlbums = useMemo(
    () => topLevel.filter((r) => r.type === 'album'),
    [topLevel],
  );
  const rawSingles = useMemo(
    () => topLevel.filter((r) => r.type !== 'album'),
    [topLevel],
  );

  // Saved manual order takes precedence; otherwise fall back to status sort.
  // `orderVersion` forces a re-read after a drag commits.
  const orderedAlbums = useMemo(() => {
    const saved = loadAlbumOrder();
    if (saved.length > 0) return applyOrder(rawAlbums, saved);
    return [...rawAlbums].sort(defaultSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawAlbums, orderVersion]);

  const orderedSingles = useMemo(() => {
    const saved = loadSinglesOrder();
    if (saved.length > 0) return applyOrder(rawSingles, saved);
    return [...rawSingles].sort(defaultSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSingles, orderVersion]);

  const { albumsVisible, singlesVisible } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesFilter = (r) => {
      if (filter === 'all')      return true;
      if (filter === 'active')   return r.status === 'in_progress';
      if (filter === 'planning') return r.status === 'planning';
      if (filter === 'released') return r.status === 'released';
      return true;
    };
    const matchesQuery = (r) =>
      !q || r.title.toLowerCase().includes(q) || (r.type ?? '').toLowerCase().includes(q);
    const albumMatches = (r) => {
      if (matchesQuery(r)) return true;
      if (r.type === 'album' && r.children?.length) {
        return r.children.some((c) => matchesQuery(c));
      }
      return false;
    };
    return {
      albumsVisible: orderedAlbums.filter((r) => matchesFilter(r) && albumMatches(r)),
      singlesVisible: orderedSingles.filter((r) => matchesFilter(r) && matchesQuery(r)),
    };
  }, [orderedAlbums, orderedSingles, query, filter]);

  const visibleCount = albumsVisible.length + singlesVisible.length;

  // ── Drag and drop reorder ────────────────────────────────────────────────
  const onDragStart = useCallback((e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const onDragOver = useCallback((e, overId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(overId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  const commitReorder = useCallback((section, draggedId, overId) => {
    const list = section === 'albums' ? orderedAlbums : orderedSingles;
    const ids = list.map((r) => r.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    if (section === 'albums') saveAlbumOrder(ids);
    else saveSinglesOrder(ids);
    setOrderVersion((v) => v + 1);
  }, [orderedAlbums, orderedSingles]);

  const onDrop = useCallback((e, section, overId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!draggedId || draggedId === overId) return;
    commitReorder(section, draggedId, overId);
  }, [draggingId, commitReorder]);

  // ── Render paths ──────────────────────────────────────────────────────────

  if (loading) return <HomeSkeleton />;

  if (error) {
    return (
      <div className="hp-error-shell" role="alert">
        <div className="hp-error-card">
          <div className="hp-error-title">Couldn't load releases</div>
          <div className="hp-error-msg">{error}</div>
          <button className="hp-btn-primary" onClick={() => load()}>Try again</button>
        </div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="hp-empty-shell">
        <div className="hp-empty">
          <div className="hp-empty-mark">
            <Sparkles size={18} />
          </div>
          <div className="hp-empty-title">Nothing in flight yet</div>
          <p className="hp-empty-body">
            Kick off your first release from a template. Pick a cadence (single, EP,
            LP), give it a target date, and we'll lay out the workstreams and
            checklist so you're ready to ship.
          </p>
          <button className="hp-btn-primary" onClick={() => navigate('/studio/templates')}>
            Browse templates
          </button>
        </div>
      </div>
    );
  }

  const noResults = visibleCount === 0;

  return (
    <div className="hp">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="hp-head">
        <div className="hp-head-left">
          <div className="hp-eyebrow">
            <span>Portfolio</span>
            {refreshing && <span className="hp-live-dot" aria-hidden />}
          </div>
          <h1 className="hp-title">All releases</h1>
          <p className="hp-sub">
            {portfolio.active_count > 0
              ? `${portfolio.active_count} in flight · ${portfolio.released_count} shipped`
              : `${portfolio.released_count} shipped · no active releases`}
          </p>
        </div>
        <div className="hp-head-right">
          <div className="hp-search-wrap">
            <Search size={13} className="hp-search-icon" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search releases…"
              aria-label="Search releases"
              className="hp-search"
            />
            <kbd className="hp-kbd" aria-hidden>⌘K</kbd>
          </div>
          <button className="hp-btn-ghost hp-btn-album" onClick={() => setAlbumModalOpen(true)}>
            <Disc3 size={13} /> New album
          </button>
          <button className="hp-btn-primary" onClick={() => navigate('/studio/templates')}>
            <Plus size={13} /> New release
          </button>
        </div>
      </header>

      {/* ── Portfolio strip ─────────────────────────────────────────────────── */}
      <section className="hp-portfolio" aria-label="Portfolio totals">
        <StatCard
          icon={<Layers size={12} />}
          label="Total releases"
          value={portfolio.total_releases}
          sub={`${portfolio.released_count} shipped · ${portfolio.active_count} active`}
        />
        <StatCard
          icon={<Sparkles size={12} />}
          label="Active tasks"
          value={portfolio.total_active_tasks}
          sub={
            portfolio.total_in_flight_tasks > 0
              ? `${portfolio.total_in_flight_tasks} in progress`
              : portfolio.active_count > 0 ? 'Ready to pick up' : 'Nothing active'
          }
          tone="cyan"
        />
        <StatCard
          icon={<AlertTriangle size={12} />}
          label="Blockers"
          value={portfolio.total_blockers}
          sub={portfolio.total_blockers > 0 ? 'Need attention' : 'All clear'}
          tone={portfolio.total_blockers > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={<Calendar size={12} />}
          label="Next deadline"
          value={
            portfolio.next_due_days === null
              ? <span className="hp-stat-empty">—</span>
              : <>{portfolio.next_due_days}<span className="hp-stat-unit">d</span></>
          }
          sub={portfolio.next_due_release ?? (portfolio.overdue_count > 0 ? `${portfolio.overdue_count} overdue` : 'No upcoming dates')}
          tone={
            portfolio.overdue_count > 0 ? 'red'
            : portfolio.next_due_days !== null && portfolio.next_due_days <= 7 ? 'amber'
            : undefined
          }
        />
        <StatCard
          icon={<Clock size={12} />}
          label={portfolio.median_cycle_days !== null ? 'Median cycle' : 'Stuck tasks'}
          value={
            portfolio.median_cycle_days !== null
              ? <>{portfolio.median_cycle_days}<span className="hp-stat-unit">d</span></>
              : portfolio.total_stuck
          }
          sub={
            portfolio.median_cycle_days !== null
              ? `Across ${portfolio.released_count} shipped`
              : portfolio.total_stuck > 0 ? 'Open 30d+' : 'Nothing stale'
          }
          tone={
            portfolio.median_cycle_days !== null
              ? 'indigo'
              : portfolio.total_stuck > 0 ? 'purple' : 'green'
          }
        />
      </section>

      {/* ── Section header + filters ────────────────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-section-head">
          <div className="hp-section-titles">
            <div className="hp-section-title">Releases</div>
            <div className="hp-section-count">{visibleCount} of {topLevel.length}</div>
          </div>
          <div className="hp-filters" role="tablist" aria-label="Filter releases">
            {FILTERS.map((f) => {
              const count =
                f.id === 'all'      ? topLevel.length
                : f.id === 'active' ? topLevel.filter((r) => r.status === 'in_progress').length
                : f.id === 'planning' ? topLevel.filter((r) => r.status === 'planning').length
                : topLevel.filter((r) => r.status === 'released').length;
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  className={`hp-filter${filter === f.id ? ' is-active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span className="hp-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {noResults ? (
          <div className="hp-noresults">
            <div className="hp-noresults-title">No releases match</div>
            <div className="hp-noresults-sub">
              Try clearing the search or switching filters.
            </div>
            <button
              className="hp-btn-ghost"
              onClick={() => { setQuery(''); setFilter('all'); }}
            >
              Reset
            </button>
          </div>
        ) : (
          <>
            {albumsVisible.length > 0 && (
              <div className="hp-subsection">
                <div className="hp-subsection-head">
                  <Disc3 size={11} className="hp-subsection-icon" aria-hidden />
                  <span className="hp-subsection-title">Albums</span>
                  <span className="hp-subsection-count">{albumsVisible.length}</span>
                  <span className="hp-subsection-hint">drag to reorder</span>
                </div>
                <div className="hp-grid hp-grid-albums">
                  {albumsVisible.map((release, i) => (
                    <div
                      key={release.id}
                      className={[
                        'hp-grid-item hp-grid-item-album',
                        draggingId === release.id ? 'is-dragging' : '',
                        dragOverId === release.id && draggingId && draggingId !== release.id ? 'is-drag-over' : '',
                      ].filter(Boolean).join(' ')}
                      style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
                      draggable
                      onDragStart={(e) => onDragStart(e, release.id)}
                      onDragOver={(e) => onDragOver(e, release.id)}
                      onDrop={(e) => onDrop(e, 'albums', release.id)}
                      onDragEnd={onDragEnd}
                    >
                      <ReleaseCard release={release} />
                      {release.children?.length > 0 && (
                        <AlbumChildren items={release.children} navigate={navigate} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {singlesVisible.length > 0 && (
              <div className="hp-subsection">
                <div className="hp-subsection-head">
                  <Sparkles size={11} className="hp-subsection-icon" aria-hidden />
                  <span className="hp-subsection-title">Singles &amp; releases</span>
                  <span className="hp-subsection-count">{singlesVisible.length}</span>
                  <span className="hp-subsection-hint">drag to reorder</span>
                </div>
                <div className="hp-grid">
                  {singlesVisible.map((release, i) => (
                    <div
                      key={release.id}
                      className={[
                        'hp-grid-item',
                        draggingId === release.id ? 'is-dragging' : '',
                        dragOverId === release.id && draggingId && draggingId !== release.id ? 'is-drag-over' : '',
                      ].filter(Boolean).join(' ')}
                      style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
                      draggable
                      onDragStart={(e) => onDragStart(e, release.id)}
                      onDragOver={(e) => onDragOver(e, release.id)}
                      onDrop={(e) => onDrop(e, 'singles', release.id)}
                      onDragEnd={onDragEnd}
                    >
                      <ReleaseCard release={release} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {albumModalOpen && (
        <AlbumCreateModal
          onClose={() => setAlbumModalOpen(false)}
          onCreated={() => {
            setAlbumModalOpen(false);
            load({ silent: true });
          }}
        />
      )}
    </div>
  );
}

// ── Album children: compact list nested under an album card ────────────────

function AlbumChildren({ items, navigate }) {
  return (
    <div className="hp-album-kids" aria-label="Included releases">
      <div className="hp-album-kids-head">
        <Disc3 size={10} style={{ color: '#D8B4FE' }} />
        <span>Included releases</span>
      </div>
      <ul className="hp-album-kids-list">
        {items.map((c) => (
          <li
            key={c.id}
            className="hp-album-kid"
            onClick={() => navigate(`/studio/release/${c.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/studio/release/${c.id}`);
              }
            }}
          >
            <span className="hp-album-kid-title">{c.title}</span>
            <span className="hp-album-kid-meta">
              <span className={`hp-album-kid-status hp-album-kid-status-${c.status}`}>
                {c.status === 'in_progress' ? 'In progress'
                  : c.status === 'released' ? 'Released'
                  : c.status === 'planning' ? 'Planning'
                  : c.status}
              </span>
              <span className="hp-album-kid-ready">{c.stats.readiness}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Album creation modal ──────────────────────────────────────────────────

function AlbumCreateModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    setErr(null);
    try {
      await createAlbum({ title: trimmed, targetDate: targetDate || null });
      onCreated();
    } catch (e) {
      setErr(e.message ?? 'Could not create album');
      setSaving(false);
    }
  }

  return (
    <div className="hp-modal-backdrop" onClick={onClose}>
      <form
        className="hp-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <header className="hp-modal-head">
          <div className="hp-modal-eyebrow">
            <Disc3 size={11} style={{ color: '#D8B4FE' }} />
            <span>New album</span>
          </div>
          <button
            type="button"
            className="hp-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>
        <p className="hp-modal-sub">
          Albums group singles into a release cycle. You can attach existing
          singles later from each release's page.
        </p>
        <label className="hp-modal-field">
          <span className="hp-modal-label">Album title</span>
          <input
            ref={inputRef}
            className="hp-modal-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Nightshade"
            maxLength={120}
            required
          />
        </label>
        <label className="hp-modal-field">
          <span className="hp-modal-label">Target date (optional)</span>
          <input
            className="hp-modal-input"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </label>
        {err && <div className="hp-modal-err">{err}</div>}
        <footer className="hp-modal-foot">
          <button type="button" className="hp-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className="hp-btn-primary"
            disabled={saving || !title.trim()}
          >
            {saving ? 'Creating…' : 'Create album'}
          </button>
        </footer>
      </form>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, tone }) {
  return (
    <div className={`hp-stat hp-stat-${tone ?? 'neutral'}`}>
      <div className="hp-stat-top">
        <span className="hp-stat-icon" aria-hidden>{icon}</span>
        <span className="hp-stat-label">{label}</span>
      </div>
      <div className="hp-stat-val">{value}</div>
      <div className="hp-stat-sub">{sub}</div>
    </div>
  );
}

// ── Skeleton (shown while the first fetch is in flight) ──────────────────────

function HomeSkeleton() {
  return (
    <div className="hp hp-skel-root" aria-busy="true" aria-label="Loading releases">
      <header className="hp-head">
        <div className="hp-head-left">
          <div className="hp-eyebrow"><span>Portfolio</span></div>
          <div className="hp-skel hp-skel-title" />
          <div className="hp-skel hp-skel-sub" />
        </div>
      </header>
      <section className="hp-portfolio">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="hp-stat hp-stat-neutral">
            <div className="hp-skel hp-skel-line hp-skel-line-sm" />
            <div className="hp-skel hp-skel-line hp-skel-line-lg" />
            <div className="hp-skel hp-skel-line hp-skel-line-sm" />
          </div>
        ))}
      </section>
      <section className="hp-section">
        <div className="hp-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="hp-card hp-card-skel">
              <div className="hp-skel hp-skel-line hp-skel-line-sm" />
              <div className="hp-skel hp-skel-line hp-skel-line-title" />
              <div className="hp-skel hp-skel-bar" />
              <div className="hp-skel hp-skel-meta" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
