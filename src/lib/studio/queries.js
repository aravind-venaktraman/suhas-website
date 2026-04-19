import { supabase } from '../supabase';

// ── Profile fragment reused across queries ─────────────────────────────────────
const PROFILE_FIELDS = `id, display_name, initials, avatar_color_from, avatar_color_to, timezone`;

// ── Releases ───────────────────────────────────────────────────────────────────

export async function listReleases() {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Homepage: releases with aggregate per-release stats ──────────────────────
//
// Fetches releases + joins task/checklist counts via 3 round-trips (releases,
// tasks with workstream join, checklist). Client-computes readiness, blockers,
// stuck counts, days-out, and cycle time. Intentionally JS-side so tuning the
// readiness weight doesn't need a migration.
export async function listReleasesWithStats() {
  // parent_release_id may not exist on older databases. Try with it first,
  // fall back to the old shape so the homepage keeps working pre-migration.
  let releases;
  {
    const { data, error } = await supabase
      .from('releases')
      .select('id, title, type, status, target_date, released_at, created_at, parent_release_id')
      .order('created_at', { ascending: false });
    if (error) {
      const fallback = await supabase
        .from('releases')
        .select('id, title, type, status, target_date, released_at, created_at')
        .order('created_at', { ascending: false });
      if (fallback.error) throw fallback.error;
      releases = (fallback.data ?? []).map((r) => ({ ...r, parent_release_id: null }));
    } else {
      releases = data ?? [];
    }
  }
  if (!releases || releases.length === 0) return [];

  const releaseIds = releases.map((r) => r.id);

  // Pull workstreams so we can both map tasks → release and build per-card
  // workstream distribution viz.
  const { data: workstreams, error: wsErr } = await supabase
    .from('workstreams')
    .select('id, name, color, release_id, sort_order')
    .in('release_id', releaseIds);
  if (wsErr) throw wsErr;

  const wsByRelease = new Map();
  const wsById = new Map();
  (workstreams ?? []).forEach((w) => {
    wsById.set(w.id, w);
    if (!wsByRelease.has(w.release_id)) wsByRelease.set(w.release_id, []);
    wsByRelease.get(w.release_id).push(w);
  });

  const workstreamIds = (workstreams ?? []).map((w) => w.id);

  // Tasks — fetch in bulk, scope in JS. Safer than a deep join if the inner
  // relationship isn't configured in PostgREST.
  let tasks = [];
  if (workstreamIds.length > 0) {
    const { data: taskRows, error: tErr } = await supabase
      .from('tasks')
      .select('id, workstream_id, status, due_date, created_at, completed_at')
      .in('workstream_id', workstreamIds);
    if (tErr) throw tErr;
    tasks = taskRows ?? [];
  }

  const wsToRelease = new Map();
  (workstreams ?? []).forEach((w) => wsToRelease.set(w.id, w.release_id));

  const tasksByRelease = new Map();
  tasks.forEach((t) => {
    const rid = wsToRelease.get(t.workstream_id);
    if (!rid) return;
    if (!tasksByRelease.has(rid)) tasksByRelease.set(rid, []);
    tasksByRelease.get(rid).push(t);
  });

  // Checklist
  const { data: checklist, error: clErr } = await supabase
    .from('release_checklist')
    .select('release_id, completed')
    .in('release_id', releaseIds);
  if (clErr) throw clErr;

  const checklistByRelease = new Map();
  (checklist ?? []).forEach((c) => {
    if (!checklistByRelease.has(c.release_id)) checklistByRelease.set(c.release_id, []);
    checklistByRelease.get(c.release_id).push(c);
  });

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * DAY;

  const enriched = releases.map((release) => {
    const relTasks = tasksByRelease.get(release.id) ?? [];
    const relChecklist = checklistByRelease.get(release.id) ?? [];
    const relWorkstreams = wsByRelease.get(release.id) ?? [];

    const taskTotal = relTasks.length;
    const taskDone = relTasks.filter((t) => t.status === 'done').length;
    const taskInProgress = relTasks.filter((t) => t.status === 'in_progress').length;
    const blockers = relTasks.filter((t) => t.status === 'blocked').length;
    const stuck = relTasks.filter((t) => {
      if (t.status === 'done') return false;
      return now - new Date(t.created_at).getTime() > THIRTY_DAYS;
    }).length;

    const checklistTotal = relChecklist.length;
    const checklistDone = relChecklist.filter((c) => c.completed).length;

    // Readiness: weighted blend of task + checklist completion.
    const taskRatio = taskTotal > 0 ? taskDone / taskTotal : null;
    const checklistRatio = checklistTotal > 0 ? checklistDone / checklistTotal : null;
    let readiness;
    if (taskRatio === null && checklistRatio === null) readiness = 0;
    else if (taskRatio === null) readiness = Math.round(checklistRatio * 100);
    else if (checklistRatio === null) readiness = Math.round(taskRatio * 100);
    else readiness = Math.round((taskRatio * 0.6 + checklistRatio * 0.4) * 100);

    // Soonest upcoming due date among open tasks.
    const upcomingDueMs = relTasks
      .filter((t) => t.status !== 'done' && t.due_date)
      .map((t) => new Date(t.due_date).getTime())
      .filter((ms) => !Number.isNaN(ms) && ms >= now)
      .sort((a, b) => a - b);
    const nextDueMs = upcomingDueMs[0] ?? null;

    // Days to target (never negative; null if no target set).
    const targetMs = release.target_date ? new Date(release.target_date).getTime() : null;
    const daysOut = targetMs !== null && !Number.isNaN(targetMs)
      ? Math.max(0, Math.ceil((targetMs - now) / DAY))
      : null;
    const isOverdue = targetMs !== null && !Number.isNaN(targetMs)
      && release.status !== 'released' && release.status !== 'archived'
      && targetMs < now;

    // Cycle time (released only).
    const cycleDays = release.status === 'released' && release.created_at && release.released_at
      ? Math.max(1, Math.ceil((new Date(release.released_at).getTime() - new Date(release.created_at).getTime()) / DAY))
      : null;

    // Per-workstream distribution for the mini-viz.
    const distribution = relWorkstreams
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((w) => {
        const laneTasks = relTasks.filter((t) => t.workstream_id === w.id);
        const laneDone = laneTasks.filter((t) => t.status === 'done').length;
        return {
          id: w.id,
          name: w.name,
          color: w.color,
          total: laneTasks.length,
          done: laneDone,
        };
      });

    return {
      ...release,
      stats: {
        task_total: taskTotal,
        task_done: taskDone,
        task_in_progress: taskInProgress,
        blockers,
        stuck,
        readiness,
        days_out: daysOut,
        next_due_ms: nextDueMs,
        cycle_days: cycleDays,
        checklist_total: checklistTotal,
        checklist_done: checklistDone,
        is_overdue: isOverdue,
        distribution,
      },
    };
  });

  // Attach album rollups: an album's card should reflect its own tasks PLUS
  // the sum of its children's tasks. readiness is recomputed on the combined
  // totals so the progress bar is honest.
  const byParent = new Map();
  enriched.forEach((r) => {
    if (r.parent_release_id) {
      if (!byParent.has(r.parent_release_id)) byParent.set(r.parent_release_id, []);
      byParent.get(r.parent_release_id).push(r);
    }
  });

  return enriched.map((r) => {
    const children = byParent.get(r.id) ?? [];
    if (children.length === 0) {
      return { ...r, children: [] };
    }

    const kTotal = children.reduce((s, c) => s + c.stats.task_total, 0) + r.stats.task_total;
    const kDone  = children.reduce((s, c) => s + c.stats.task_done, 0)  + r.stats.task_done;
    const kInProg = children.reduce((s, c) => s + c.stats.task_in_progress, 0) + r.stats.task_in_progress;
    const kBlock = children.reduce((s, c) => s + c.stats.blockers, 0)   + r.stats.blockers;
    const kStuck = children.reduce((s, c) => s + c.stats.stuck, 0)      + r.stats.stuck;
    const kChkTotal = children.reduce((s, c) => s + c.stats.checklist_total, 0) + r.stats.checklist_total;
    const kChkDone  = children.reduce((s, c) => s + c.stats.checklist_done, 0)  + r.stats.checklist_done;

    const taskRatio = kTotal > 0 ? kDone / kTotal : null;
    const chkRatio  = kChkTotal > 0 ? kChkDone / kChkTotal : null;
    let readiness;
    if (taskRatio === null && chkRatio === null) readiness = 0;
    else if (taskRatio === null) readiness = Math.round(chkRatio * 100);
    else if (chkRatio === null)  readiness = Math.round(taskRatio * 100);
    else readiness = Math.round((taskRatio * 0.6 + chkRatio * 0.4) * 100);

    // Earliest upcoming due across self + children
    const nexts = [r.stats.next_due_ms, ...children.map((c) => c.stats.next_due_ms)].filter(Boolean).sort((a,b)=>a-b);

    return {
      ...r,
      children,
      rollup: {
        task_total: kTotal,
        task_done: kDone,
        task_in_progress: kInProg,
        blockers: kBlock,
        stuck: kStuck,
        readiness,
        child_count: children.length,
        child_released: children.filter((c) => c.status === 'released').length,
        next_due_ms: nexts[0] ?? null,
      },
    };
  });
}

// Pull just the children of one parent release (for the album detail page).
export async function listChildReleases(parentId) {
  const { data, error } = await supabase
    .from('releases')
    .select('id, title, type, status, target_date, released_at, created_at, parent_release_id')
    .eq('parent_release_id', parentId)
    .order('target_date', { ascending: true, nullsLast: true });
  if (error) {
    // Pre-migration fallback: column doesn't exist yet.
    if (/parent_release_id/.test(error.message ?? '')) return [];
    throw error;
  }
  return data ?? [];
}

// All releases eligible to be an album (top-level albums, excluding self).
export async function listAssignableAlbums(excludeId = null) {
  let query = supabase
    .from('releases')
    .select('id, title, type, status')
    .eq('type', 'album')
    .is('parent_release_id', null)
    .order('title', { ascending: true });

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) {
    if (/parent_release_id/.test(error.message ?? '')) return [];
    throw error;
  }
  return data ?? [];
}

// Aggregate the portfolio-level stat strip from the per-release rows.
export function computePortfolioStats(releases) {
  const active = releases.filter((r) => r.status !== 'released' && r.status !== 'archived');
  const released = releases.filter((r) => r.status === 'released');

  const totalActiveTasks = active.reduce(
    (sum, r) => sum + Math.max(0, r.stats.task_total - r.stats.task_done),
    0,
  );
  const totalBlockers = active.reduce((sum, r) => sum + r.stats.blockers, 0);
  const totalStuck = active.reduce((sum, r) => sum + r.stats.stuck, 0);
  const totalInFlightTasks = active.reduce((sum, r) => sum + r.stats.task_in_progress, 0);
  const overdueCount = active.filter((r) => r.stats.is_overdue).length;

  const upcoming = active
    .map((r) => ({ release: r, ms: r.stats.next_due_ms }))
    .filter((x) => x.ms !== null)
    .sort((a, b) => a.ms - b.ms);

  const globalNext = upcoming[0] ?? null;
  const globalNextDueDays = globalNext
    ? Math.max(0, Math.ceil((globalNext.ms - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  // Median cycle time for released items (nice portfolio insight).
  const cycles = released
    .map((r) => r.stats.cycle_days)
    .filter((d) => d !== null)
    .sort((a, b) => a - b);
  const medianCycle = cycles.length
    ? cycles.length % 2
      ? cycles[Math.floor(cycles.length / 2)]
      : Math.round((cycles[cycles.length / 2 - 1] + cycles[cycles.length / 2]) / 2)
    : null;

  return {
    total_releases: releases.length,
    active_count: active.length,
    released_count: released.length,
    total_active_tasks: totalActiveTasks,
    total_in_flight_tasks: totalInFlightTasks,
    total_blockers: totalBlockers,
    total_stuck: totalStuck,
    overdue_count: overdueCount,
    next_due_days: globalNextDueDays,
    next_due_release: globalNext?.release.title ?? null,
    median_cycle_days: medianCycle,
  };
}

export async function getRelease(id) {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Workstreams ────────────────────────────────────────────────────────────────

export async function listWorkstreams(releaseId) {
  const { data, error } = await supabase
    .from('workstreams')
    .select('*')
    .eq('release_id', releaseId)
    .order('sort_order');
  if (error) throw error;
  return data;
}

// ── Songs ──────────────────────────────────────────────────────────────────────

export async function listSongs(releaseId) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('release_id', releaseId)
    .order('track_number');
  if (error) throw error;
  return data;
}

// ── Tasks (with assignee profile joined) ──────────────────────────────────────

export async function listTasks(releaseId) {
  // tasks don't have release_id directly; go via workstreams
  const { data: workstreams, error: wsError } = await supabase
    .from('workstreams')
    .select('id')
    .eq('release_id', releaseId);
  if (wsError) throw wsError;

  const ids = workstreams.map((w) => w.id);
  if (ids.length === 0) return [];

  // Try with profiles join first; fall back to plain select if profiles table
  // doesn't exist yet (common during initial setup before SQL migration is run)
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id, workstream_id, song_id, title, description,
      status, priority, due_date, blocked_reason,
      external_assignee, sort_order, created_at, completed_at,
      assignee:profiles!assignee_id ( ${PROFILE_FIELDS} )
    `)
    .in('workstream_id', ids)
    .order('sort_order');

  if (error) {
    // Profiles table might not exist yet — fall back to simple query
    console.warn('[studio] listTasks profiles join failed, falling back:', error.message);
    const { data: plain, error: plainError } = await supabase
      .from('tasks')
      .select(`
        id, workstream_id, song_id, title, description,
        status, priority, due_date, blocked_reason,
        external_assignee, sort_order, created_at, completed_at
      `)
      .in('workstream_id', ids)
      .order('sort_order');
    if (plainError) throw plainError;
    return (plain ?? []).map((t) => ({ ...t, assignee: null }));
  }

  return data ?? [];
}

export async function getTask(id) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id, workstream_id, song_id, title, description,
      status, priority, due_date, blocked_reason,
      external_assignee, sort_order, created_at, completed_at,
      assignee:profiles!assignee_id ( ${PROFILE_FIELDS} )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Comments (with author profile joined) ─────────────────────────────────────

export async function listComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      id, body, created_at,
      author:profiles!author_id ( ${PROFILE_FIELDS} )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Keep the old name as an alias so nothing breaks during migration
export const listTaskComments = listComments;

// ── Attachments ────────────────────────────────────────────────────────────────

export async function listTaskAttachments(taskId) {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export function getAttachmentUrl(storagePath) {
  const { data } = supabase.storage
    .from('studio-attachments')
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function getChecklist(releaseId) {
  const { data, error } = await supabase
    .from('release_checklist')
    .select('*')
    .eq('release_id', releaseId)
    .order('sort_order');
  if (error) throw error;
  return data;
}

// ── Activity log ──────────────────────────────────────────────────────────────

export async function getActivityLog(releaseId, limit = 100) {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      id,
      action,
      metadata,
      created_at,
      task_id,
      actor:profiles!actor_id (
        id,
        display_name,
        initials,
        avatar_color_from,
        avatar_color_to
      ),
      task:tasks!task_id (
        id,
        title
      )
    `)
    .eq('release_id', releaseId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // profiles table might not exist yet — fall back to raw rows
    console.warn('[studio] getActivityLog join failed, falling back:', error.message);
    const { data: plain, error: plainError } = await supabase
      .from('activity_log')
      .select('*')
      .eq('release_id', releaseId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (plainError) throw plainError;
    return (plain ?? []).map((row) => ({ ...row, actor: null, task: null }));
  }

  return data ?? [];
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function listTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      id, name, description, release_type, duration_days, task_count,
      created_at, is_system,
      created_by_profile:profiles!created_by (display_name)
    `)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTemplate(templateId) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();
  if (error) throw error;
  return data;
}

export async function listTemplateTasks(templateId) {
  const { data, error } = await supabase
    .from('template_tasks')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

// Keep old name as alias for any callers that still use it
export const getTemplateTasks = listTemplateTasks;

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name', { ascending: true });
  if (error) throw error;
  return data;
}
