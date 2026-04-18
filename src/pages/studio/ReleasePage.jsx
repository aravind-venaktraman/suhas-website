import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Plus, Calendar, BarChart2, LayoutGrid, Pencil, Trash2 } from 'lucide-react';
import {
  listReleases,
  getRelease,
  listWorkstreams,
  listTasks,
  listSongs,
  getChecklist,
  listProfiles,
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

  // Load all profiles once for the assignee autocomplete
  useEffect(() => {
    listProfiles().then(setAllProfiles).catch(console.error);
  }, []);

  // Navigate to first release if none is selected
  useEffect(() => {
    if (!releaseId) {
      listReleases().then((r) => {
        if (r.length > 0) navigate(`/studio/release/${r[0].id}`, { replace: true });
        else setLoading(false);
      });
    }
  }, [releaseId]);

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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: fonts.display, fontSize: 9, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {release.type}
            </span>
            {release.target_date && (
              <>
                <span style={{ color: colors.border }}>·</span>
                <span style={{ fontFamily: fonts.display, fontSize: 9, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {new Date(release.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
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
