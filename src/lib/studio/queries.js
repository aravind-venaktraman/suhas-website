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
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTemplateTasks(templateId) {
  const { data, error } = await supabase
    .from('template_tasks')
    .select('*')
    .eq('template_id', templateId)
    .order('days_before_release', { ascending: false });
  if (error) throw error;
  return data;
}

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
