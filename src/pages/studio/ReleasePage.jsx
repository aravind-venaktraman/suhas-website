import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Plus, Calendar, BarChart2, LayoutGrid, Pencil, Trash2, Disc3, ChevronDown, X } from 'lucide-react';
import {
  getRelease,
  getReleaseById,
  listWorkstreams,
  listTasks,
  listSongs,
  getChecklist,
  listProfiles,
  listChildReleases,
  listAssignableAlbums,
} from '../../lib/studio/queries';

import { createTask, toggleChecklistItem, updateTask, updateWorkstream, updateRelease, deleteRelease } from '../../lib/studio/mutations';
import {
  computeReadiness,
  computeBlockers,
  computeStuck,
  computeDaysToRelease,
  computeCollaborators,
} from '../../lib/studio/analytics';
import { useRealtimeRelease } from '../../lib/studio/realtime';
import { colors, fonts } from '../../components/studio/tokens';
import MetricStrip from '../../components/studio/MetricStrip';
import Board from '../../components/studio/Board';
import Timeline from '../../components/studio/Timeline';
import Analytics from '../../components/studio/Analytics';
import TaskModal from '../../components/studio/TaskModal';
import NewReleaseWizard from '../../components/studio/NewReleaseWizard';

const TABS = [
  { id: 'board',     label: 'Board',     icon: LayoutGrid },
  { id: 'timeline',  label: 'Timeline',  icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function ReleasePage() {
  const { releaseId } = useParams();
  const { user, profile: userProfile, refreshReleases } = useOutletContext();
  const navigate = useNavigate();

  const [release, setRelease] = useState(null);
  const [workstreams, setWorkstreams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [songs, setSongs] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [addingToWorkstream, setAddingToWorkstream] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [addTaskTitle, setAddTaskTitle] = useState('');
  const [addTaskError, setAddTaskError] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef(null);
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const dateInputRef = useRef(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false);
  const [assignableAlbums, setAssignableAlbums] = useState([]);
  const [childReleases, setChildReleases] = useState([]);
  const [parentRelease, setParentRelease] = useState(null);
  const [assignError, setAssignError] = useState(null);

  // Load all profiles once for the assignee autocomplete
  useEffect(() => {
    listProfiles().then(setAllProfiles).catch(console.error);
  }, []);

  // Bounce back to /studio if someone lands here without a release id
  // (e.g. after deleting a release). The homepage is the landing surface now.
  useEffect(() => {
    if (!releaseId) navigate('/studio', { replace: true });
  }, [releaseId, navigate]);

  const loadRelease = useCallback(async (id) => {
    setLoading(true);
    try {
      // Load core release data first — these never need the profiles table
      const [rel, ws, s, cl] = await Promise.all([
        getRelease(id),
        listWorkstreams(id),
        listSongs(id),
        getChecklist(id),
      ]);
      setRelease(rel);
      setWorkstreams(ws);
      setSongs(s);
      setChecklist(cl);

      // Load tasks separately so a profiles-join failure never blanks the board
      try {
        const t = await listTasks(id);
        setTasks(t);
      } catch (taskErr) {
        console.error('[studio] tasks failed to load:', taskErr);
        setTasks([]);
      }
    } catch (e) {
      console.error('[studio] loadRelease failed:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (releaseId) loadRelease(releaseId);
  }, [releaseId, loadRelease]);

  // Load album siblings/children metadata whenever release loads.
  // listAssignableAlbums + listChildReleases each gracefully return [] if the
  // parent_release_id column isn't there yet (pre-migration).
  useEffect(() => {
    if (!release) return;
    if (release.type === 'album') {
      listChildReleases(release.id).then(setChildReleases).catch((e) => {
        console.error('[studio] listChildReleases failed:', e);
        setChildReleases([]);
      });
    } else {
      listAssignableAlbums(release.id).then(setAssignableAlbums).catch((e) => {
        console.error('[studio] listAssignableAlbums failed:', e);
        setAssignableAlbums([]);
      });
    }
  }, [release?.id, release?.type]);

  // Close popovers on outside click / Escape.
  useEffect(() => {
    if (!statusMenuOpen && !albumMenuOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        setStatusMenuOpen(false);
        setAlbumMenuOpen(false);
      }
    }
    function onClick(e) {
      if (!e.target.closest?.('[data-popover]')) {
        setStatusMenuOpen(false);
        setAlbumMenuOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [statusMenuOpen, albumMenuOpen]);

  // Fetch parent album metadata directly so the chip renders the correct label
  // even when assignableAlbums hasn't loaded (pre-migration fallback, race).
  useEffect(() => {
    if (!release?.parent_release_id) {
      setParentRelease(null);
      return;
    }
    let cancelled = false;
    getReleaseById(release.parent_release_id)
      .then((r) => { if (!cancelled) setParentRelease(r ?? null); })
      .catch((e) => {
        console.error('[studio] getReleaseById(parent) failed:', e);
        if (!cancelled) setParentRelease(null);
      });
    return () => { cancelled = true; };
  }, [release?.parent_release_id]);

  const parentAlbum = release?.parent_release_id
    ? (parentRelease ?? assignableAlbums.find((a) => a.id === release.parent_release_id) ?? null)
    : null;

  // Realtime updates — tasks only (comments are scoped to modal)
  useRealtimeRelease(releaseId, {
    onTaskChange: (payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks((prev) =>
          prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
        );
        if (selectedTask?.id === payload.new.id) {
          setSelectedTask((prev) => ({ ...prev, ...payload.new }));
        }
      } else if (payload.eventType === 'DELETE') {
        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        if (selectedTask?.id === payload.old.id) setSelectedTask(null);
      }
    },
  });

  // Computed metrics
  const readiness      = computeReadiness(tasks, checklist);
  const blockersCount  = computeBlockers(tasks).length;
  const stuckCount     = computeStuck(tasks).length;
  const daysToRelease  = computeDaysToRelease(release?.target_date);
  const collaborators  = computeCollaborators(tasks);

  function handleTaskUpdate(updated, deletedId) {
    if (deletedId) {
      setTasks((prev) => prev.filter((t) => t.id !== deletedId));
      setSelectedTask(null);
    } else if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTask(updated);
    }
  }

  // ── Move card to a different workstream ────────────────────────────────────
  async function handleTaskMove(taskId, newWorkstreamId) {
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, workstream_id: newWorkstreamId } : t))
    );
    try {
      await updateTask({ id: taskId, releaseId, actorId: user.id, workstream_id: newWorkstreamId });
    } catch (err) {
      console.error('[studio] move failed, reverting:', err);
      listTasks(releaseId).then(setTasks).catch(console.error);
    }
  }

  // ── Reorder columns ─────────────────────────────────────────────────────────
  async function handleWorkstreamsReorder(newOrderIds) {
    const wsById = Object.fromEntries(workstreams.map((w) => [w.id, w]));
    // Optimistic
    setWorkstreams(newOrderIds.map((id, i) => ({ ...wsById[id], sort_order: i + 1 })));
    try {
      await Promise.all(
        newOrderIds.map((id, i) => updateWorkstream({ id, sortOrder: i + 1 }))
      );
    } catch (err) {
      console.error('[studio] reorder failed, reverting:', err);
      listWorkstreams(releaseId).then(setWorkstreams).catch(console.error);
    }
  }

  // ── Rename a workstream ─────────────────────────────────────────────────────
  async function handleWorkstreamRename(wsId, newName) {
    // Optimistic
    setWorkstreams((prev) =>
      prev.map((w) => (w.id === wsId ? { ...w, name: newName } : w))
    );
    try {
      await updateWorkstream({ id: wsId, name: newName });
    } catch (err) {
      console.error('[studio] rename failed, reverting:', err);
      listWorkstreams(releaseId).then(setWorkstreams).catch(console.error);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!addTaskTitle.trim() || !addingToWorkstream) return;
    setSubmittingTask(true);
    setAddTaskError('');
    try {
      await createTask({
        workstreamId: addingToWorkstream.id,
        releaseId,
        actorId: user.id,
        title: addTaskTitle.trim(),
        status: 'not_started',
      });
      const t = await listTasks(releaseId);
      setTasks(t);
      setAddTaskTitle('');
      setAddingToWorkstream(null);
    } catch (err) {
      setAddTaskError(err.message);
    }
    setSubmittingTask(false);
  }

  function startTitleEdit() {
    setTitleValue(release.title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  async function submitTitleEdit() {
    const trimmed = titleValue.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === release.title) return;
    setRelease(prev => ({ ...prev, title: trimmed }));
    try {
      await updateRelease({ id: releaseId, title: trimmed });
      refreshReleases?.();
    } catch (err) {
      console.error('[studio] rename failed:', err);
      setRelease(prev => ({ ...prev, title: release.title }));
    }
  }

  function startDateEdit() {
    setDateValue(release.target_date ?? '');
    setEditingDate(true);
    setTimeout(() => dateInputRef.current?.focus(), 0);
  }

  async function submitDateEdit() {
    const next = dateValue || null;
    setEditingDate(false);
    if (next === (release.target_date ?? null)) return;
    const prev = release.target_date;
    setRelease(p => ({ ...p, target_date: next }));
    try {
      await updateRelease({ id: releaseId, target_date: next });
      refreshReleases?.();
    } catch (err) {
      console.error('[studio] date update failed:', err);
      setRelease(p => ({ ...p, target_date: prev }));
    }
  }

  async function setStatus(newStatus) {
    setStatusMenuOpen(false);
    if (newStatus === release.status) return;
    const prev = release.status;
    const prevReleasedAt = release.released_at;
    setRelease(p => ({
      ...p,
      status: newStatus,
      // match mutation-side behavior optimistically
      released_at: newStatus === 'released' ? (p.released_at ?? new Date().toISOString()) : null,
    }));
    try {
      const updated = await updateRelease({ id: releaseId, status: newStatus });
      setRelease(updated);
      refreshReleases?.();
    } catch (err) {
      console.error('[studio] status update failed:', err);
      setRelease(p => ({ ...p, status: prev, released_at: prevReleasedAt }));
    }
  }

  async function setParentAlbum(newParentId) {
    setAlbumMenuOpen(false);
    setAssignError(null);
    const prev = release.parent_release_id ?? null;
    if ((newParentId ?? null) === prev) return;
    setRelease(p => ({ ...p, parent_release_id: newParentId ?? null }));
    try {
      const updated = await updateRelease({ id: releaseId, parent_release_id: newParentId ?? null });
      // Trust the server's returned row; keeps any trigger-adjusted fields in sync.
      if (updated) setRelease(updated);
      refreshReleases?.();
      // Refresh assignable list in case the set of eligible albums shifted.
      listAssignableAlbums(releaseId).then(setAssignableAlbums).catch(() => {});
    } catch (err) {
      console.error('[studio] parent update failed:', err);
      setRelease(p => ({ ...p, parent_release_id: prev }));
      setAssignError(
        /parent_release_id/i.test(err?.message ?? '')
          ? 'Album linking needs a database migration — contact your admin.'
          : (err?.message ?? 'Could not link to album.')
      );
    }
  }

  async function handleDeleteRelease() {
    if (!window.confirm(`Delete "${release.title}"? This cannot be undone.`)) return;
    try {
      await deleteRelease(releaseId);
      refreshReleases?.();
      navigate('/studio', { replace: true });
    } catch (err) {
      console.error('[studio] delete failed:', err);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontFamily: fonts.display, fontSize: 10, letterSpacing: '0.3em', color: colors.textDim, textTransform: 'uppercase' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!release) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, padding: 40, textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.display, fontSize: 11, letterSpacing: '0.2em', color: colors.textDim, textTransform: 'uppercase', marginBottom: 4 }}>
          No releases yet
        </p>
        <p style={{ fontSize: 13, color: colors.textMuted }}>Create your first release to get started.</p>
        <button
          onClick={() => setShowWizard(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 22px', borderRadius: 999,
            background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
            color: '#09090B', fontFamily: fonts.display,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Create release
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Release header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: fonts.display, fontSize: 9, color: release.type === 'album' ? '#D8B4FE' : colors.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {release.type === 'album' && <Disc3 size={10} />}
              {release.type}
            </span>

            {/* Editable target date */}
            <span style={{ color: colors.border }}>·</span>
            {editingDate ? (
              <form onSubmit={(e) => { e.preventDefault(); submitDateEdit(); }} style={{ margin: 0, display: 'inline-flex' }}>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  onBlur={submitDateEdit}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingDate(false)}
                  style={{
                    fontFamily: fonts.display, fontSize: 10,
                    color: colors.textSecondary, letterSpacing: '0.1em',
                    background: 'rgba(9,9,11,0.6)',
                    border: '1px solid rgba(34,211,238,0.45)',
                    borderRadius: 4,
                    padding: '3px 6px',
                    outline: 'none',
                  }}
                />
              </form>
            ) : (
              <button
                onClick={startDateEdit}
                title={release.target_date ? 'Edit target date' : 'Set target date'}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: fonts.display, fontSize: 9,
                  color: release.target_date ? colors.textDim : '#71717A',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontStyle: release.target_date ? 'normal' : 'italic',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#22D3EE'}
                onMouseLeave={e => e.currentTarget.style.color = release.target_date ? colors.textDim : '#71717A'}
              >
                {release.target_date
                  ? new Date(release.target_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Set target date'}
                <Pencil size={9} style={{ opacity: 0.55 }} />
              </button>
            )}

            {/* Status popover */}
            <span style={{ color: colors.border }}>·</span>
            <div data-popover style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setStatusMenuOpen(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 4,
                  fontFamily: fonts.display, fontSize: 8,
                  fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', cursor: 'pointer',
                  ...statusChipStyles(release.status),
                }}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
              >
                {statusLabelFor(release.status)}
                <ChevronDown size={10} style={{ opacity: 0.65 }} />
              </button>
              {statusMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                    minWidth: 140,
                    background: 'rgba(24,24,27,0.98)',
                    border: '1px solid rgba(244,244,245,0.1)',
                    borderRadius: 8,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    padding: 4,
                    zIndex: 60,
                  }}
                >
                  {[
                    { id: 'planning',    label: 'Planning' },
                    { id: 'in_progress', label: 'In progress' },
                    { id: 'released',    label: 'Released' },
                    { id: 'archived',    label: 'Archived' },
                  ].map(s => (
                    <button
                      key={s.id}
                      role="menuitem"
                      onClick={() => setStatus(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '7px 10px',
                        background: release.status === s.id ? 'rgba(34,211,238,0.08)' : 'transparent',
                        border: 'none', borderRadius: 6, cursor: 'pointer',
                        textAlign: 'left', color: colors.textSecondary,
                        fontFamily: fonts.body, fontSize: 12,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,244,245,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = release.status === s.id ? 'rgba(34,211,238,0.08)' : 'transparent'}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: statusChipStyles(s.id).color ?? '#A1A1AA',
                      }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Part of album chip / selector */}
            {release.type !== 'album' && (
              <>
                <span style={{ color: colors.border }}>·</span>
                <div data-popover style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setAlbumMenuOpen(v => !v)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 4,
                      fontFamily: fonts.display, fontSize: 8,
                      fontWeight: 700, letterSpacing: '0.18em',
                      textTransform: 'uppercase', cursor: 'pointer',
                      color: parentAlbum ? '#D8B4FE' : '#71717A',
                      background: parentAlbum ? 'rgba(168,85,247,0.08)' : 'transparent',
                      border: `1px solid ${parentAlbum ? 'rgba(168,85,247,0.28)' : colors.border}`,
                    }}
                    aria-haspopup="menu"
                  >
                    <Disc3 size={9} />
                    {parentAlbum ? parentAlbum.title : 'Link to album'}
                    <ChevronDown size={10} style={{ opacity: 0.65 }} />
                  </button>
                  {albumMenuOpen && (
                    <div
                      role="menu"
                      style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                        minWidth: 200, maxHeight: 260, overflow: 'auto',
                        background: 'rgba(24,24,27,0.98)',
                        border: '1px solid rgba(168,85,247,0.22)',
                        borderRadius: 8,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        padding: 4,
                        zIndex: 60,
                      }}
                    >
                      {parentAlbum && (
                        <button
                          role="menuitem"
                          onClick={() => setParentAlbum(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '7px 10px',
                            background: 'transparent', border: 'none', borderRadius: 6,
                            cursor: 'pointer', textAlign: 'left',
                            color: '#FCA5A5', fontFamily: fonts.body, fontSize: 12,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <X size={11} /> Remove from album
                        </button>
                      )}
                      {assignableAlbums.length === 0 && !parentAlbum && (
                        <>
                          <div style={{ padding: '8px 10px 4px', fontSize: 11, color: colors.textDim, lineHeight: 1.4 }}>
                            No albums yet. Create one from the releases page to group singles together.
                          </div>
                          <button
                            role="menuitem"
                            type="button"
                            onClick={() => { setAlbumMenuOpen(false); navigate('/studio'); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '8px 10px',
                              background: 'transparent', border: 'none', borderRadius: 6,
                              cursor: 'pointer', textAlign: 'left',
                              color: '#D8B4FE', fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Disc3 size={11} /> Go to releases
                          </button>
                        </>
                      )}
                      {assignableAlbums.map(a => (
                        <button
                          key={a.id}
                          role="menuitem"
                          onClick={() => setParentAlbum(a.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '7px 10px',
                            background: release.parent_release_id === a.id ? 'rgba(168,85,247,0.1)' : 'transparent',
                            border: 'none', borderRadius: 6, cursor: 'pointer',
                            textAlign: 'left', color: colors.textSecondary,
                            fontFamily: fonts.body, fontSize: 12,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,244,245,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = release.parent_release_id === a.id ? 'rgba(168,85,247,0.1)' : 'transparent'}
                        >
                          <Disc3 size={11} style={{ color: '#D8B4FE' }} />
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {assignError && (
                  <span
                    role="alert"
                    style={{
                      flexBasis: '100%',
                      marginTop: 4,
                      fontSize: 11,
                      color: '#FCA5A5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <X size={11} /> {assignError}
                    <button
                      type="button"
                      onClick={() => setAssignError(null)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#FCA5A5', fontSize: 11, padding: 0, textDecoration: 'underline',
                      }}
                    >
                      dismiss
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
          {editingTitle ? (
            <form onSubmit={(e) => { e.preventDefault(); submitTitleEdit(); }} style={{ margin: 0 }}>
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={submitTitleEdit}
                onKeyDown={(e) => e.key === 'Escape' && setEditingTitle(false)}
                style={{
                  fontFamily: fonts.display, fontSize: 24, fontWeight: 900,
                  color: colors.textPrimary, textTransform: 'uppercase',
                  letterSpacing: '-0.01em', lineHeight: 1, margin: 0,
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid rgba(34,211,238,0.5)`,
                  outline: 'none', padding: '0 0 2px', width: '100%',
                  minWidth: 120,
                }}
              />
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 900, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1, margin: 0 }}>
                {release.title}
              </h1>
              <button
                onClick={startTitleEdit}
                title="Rename release"
                style={{ background: 'transparent', border: 'none', color: colors.textDim, cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', opacity: 0.6, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Link
            to={`/studio/release/${releaseId}/retro`}
            style={{
              fontFamily: fonts.display, fontSize: 10, color: colors.textDim,
              border: `1px solid ${colors.border}`, borderRadius: 999,
              padding: '7px 14px', textDecoration: 'none',
              letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700,
            }}
          >
            Retro
          </Link>
          <button
            onClick={handleDeleteRelease}
            title="Delete release"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1px solid ${colors.border}`,
              borderRadius: 999, padding: '7px 10px', cursor: 'pointer',
              color: colors.textDim, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.color = '#FCA5A5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textDim; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Metrics ── */}
      <MetricStrip
        readiness={readiness}
        daysToRelease={daysToRelease}
        blockers={blockersCount}
        stuck={stuckCount}
        collaborators={collaborators}
      />

      {/* ── Album: included releases ── */}
      {release.type === 'album' && (
        <AlbumChildrenPanel
          items={childReleases}
          onOpen={(id) => navigate(`/studio/release/${id}`)}
        />
      )}

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, alignSelf: 'flex-start' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              fontFamily: fonts.display, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              cursor: 'pointer', border: tab === id ? `1px solid rgba(99,102,241,0.4)` : '1px solid transparent',
              background: tab === id ? 'rgba(99,102,241,0.18)' : 'transparent',
              color: tab === id ? '#A5B4FC' : colors.textDim,
              transition: 'all 0.15s',
            }}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'board' && (
        <Board
          workstreams={workstreams}
          tasks={tasks}
          songs={songs}
          onTaskClick={setSelectedTask}
          onAddTask={setAddingToWorkstream}
          onTaskMove={handleTaskMove}
          onWorkstreamsReorder={handleWorkstreamsReorder}
          onWorkstreamRename={handleWorkstreamRename}
        />
      )}

      {tab === 'timeline' && (
        <Timeline songs={songs} tasks={tasks} workstreams={workstreams} release={release} />
      )}

      {tab === 'analytics' && (
        <Analytics
          tasks={tasks}
          workstreams={workstreams}
          checklist={checklist}
          onChecklistToggle={async (item) => {
            const updated = await toggleChecklistItem({ id: item.id, completed: !item.completed });
            setChecklist((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
          onTaskClick={setSelectedTask}
        />
      )}

      {/* ── Add task quick-entry ── */}
      {addingToWorkstream && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setAddingToWorkstream(null)}
        >
          <form
            onSubmit={handleAddTask}
            style={{ width: '100%', maxWidth: 380, borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, background: colors.bgCardSolid, border: `1px solid ${colors.border}` }}
          >
            <p style={{ fontFamily: fonts.display, fontSize: 9, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              New task in {addingToWorkstream.name}
            </p>
            <input
              autoFocus
              value={addTaskTitle}
              onChange={(e) => setAddTaskTitle(e.target.value)}
              placeholder="Task title..."
              style={{ borderRadius: 10, padding: '10px 14px', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body, outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            {addTaskError && <p style={{ fontSize: 11, color: colors.red }}>{addTaskError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setAddingToWorkstream(null)}
                style={{ flex: 1, borderRadius: 999, padding: '9px 0', fontFamily: fonts.display, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: colors.textDim, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={submittingTask || !addTaskTitle.trim()}
                style={{ flex: 1, borderRadius: 999, padding: '9px 0', fontFamily: fonts.display, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#09090B', background: 'linear-gradient(135deg, #6366F1, #22D3EE)', border: 'none', cursor: 'pointer', opacity: submittingTask || !addTaskTitle.trim() ? 0.45 : 1 }}>
                {submittingTask ? 'Adding...' : 'Add task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Task modal ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          workstream={workstreams.find((w) => w.id === selectedTask.workstream_id)}
          song={songs.find((s) => s.id === selectedTask.song_id)}
          songs={songs}
          releaseId={releaseId}
          user={user}
          userProfile={userProfile}
          allProfiles={allProfiles}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* ── New release wizard ── */}
      {showWizard && (
        <NewReleaseWizard
          onClose={() => setShowWizard(false)}
          onCreated={(r) => navigate(`/studio/release/${r.id}`)}
        />
      )}
    </div>
  );
}

// ── Status chip styling (shared between pill + popover swatch) ─────────────

function statusChipStyles(status) {
  switch (status) {
    case 'in_progress':
      return { color: '#67E8F9', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.28)' };
    case 'planning':
      return { color: '#A5B4FC', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.28)' };
    case 'released':
      return { color: '#6EE7B7', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' };
    case 'archived':
      return { color: '#A1A1AA', background: 'rgba(82,82,91,0.15)', border: '1px solid rgba(82,82,91,0.4)' };
    default:
      return { color: '#A1A1AA', background: 'rgba(9,9,11,0.5)', border: '1px solid rgba(244,244,245,0.08)' };
  }
}

function statusLabelFor(status) {
  switch (status) {
    case 'in_progress': return 'In progress';
    case 'planning':    return 'Planning';
    case 'released':    return 'Released';
    case 'archived':    return 'Archived';
    default:            return status ?? '—';
  }
}

// ── Album: included releases panel ────────────────────────────────────────

function AlbumChildrenPanel({ items, onOpen }) {
  if (!items || items.length === 0) {
    return (
      <div style={{
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px dashed rgba(168,85,247,0.28)',
        background: 'linear-gradient(180deg, rgba(168,85,247,0.05), rgba(168,85,247,0.02))',
        color: '#D4D4D8', fontSize: 12, lineHeight: 1.5,
      }}>
        <div style={{ fontFamily: 'Michroma, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#D8B4FE', textTransform: 'uppercase', marginBottom: 6 }}>
          Included releases
        </div>
        No singles linked yet. Open a single release and use <strong style={{ color: '#FAFAFA' }}>Link to album</strong> to attach it here.
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px 18px 14px',
      borderRadius: 12,
      border: '1px solid rgba(168,85,247,0.22)',
      background: 'linear-gradient(180deg, rgba(168,85,247,0.05), rgba(168,85,247,0.02))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Michroma, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#D8B4FE', textTransform: 'uppercase' }}>
          Included releases
        </div>
        <div style={{ fontSize: 11, color: '#A1A1AA' }}>
          {items.filter(c => c.status === 'released').length}/{items.length} shipped
        </div>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(c => (
          <li
            key={c.id}
            onClick={() => onOpen(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.id); }
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              color: '#D4D4D8', fontSize: 13, transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; e.currentTarget.style.color = '#FAFAFA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D4D4D8'; }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Disc3 size={11} style={{ color: '#D8B4FE', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{c.title}</span>
              <span style={{ fontFamily: 'Michroma, sans-serif', fontSize: 8, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                {c.type}
              </span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {c.target_date && (
                <span style={{ fontSize: 11, color: '#A1A1AA' }}>
                  {new Date(c.target_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span style={{
                fontFamily: 'Michroma, sans-serif', fontSize: 8,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                padding: '3px 6px', borderRadius: 3,
                ...statusChipStyles(c.status),
              }}>
                {statusLabelFor(c.status)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
