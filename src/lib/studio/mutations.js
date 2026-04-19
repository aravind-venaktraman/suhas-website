import { supabase } from '../supabase';

const DEFAULT_WORKSTREAMS = [
  { name: 'Audio',     color: '#6366F1', sort_order: 1 },
  { name: 'Visuals',   color: '#22D3EE', sort_order: 2 },
  { name: 'Marketing', color: '#F59E0B', sort_order: 3 },
  { name: 'Content',   color: '#EC4899', sort_order: 4 },
  { name: 'Admin',     color: '#A1A1AA', sort_order: 5 },
];

const DEFAULT_CHECKLIST = [
  'Artwork delivered',
  'Masters approved',
  'ISRC codes registered',
  'Distributor upload',
  'Pre-save link live',
  'Split sheets signed',
  'EPK updated',
  'Press embargo set',
];

async function logActivity({ releaseId, taskId = null, actorId, action, metadata = {} }) {
  await supabase.from('activity_log').insert({
    release_id: releaseId,
    task_id: taskId,
    actor_id: actorId,
    action,
    metadata,
  });
}

export async function createRelease({ title, type, targetDate, templateId = null }) {
  const { data: release, error } = await supabase
    .from('releases')
    .insert({ title, type, target_date: targetDate || null, status: 'planning' })
    .select()
    .single();
  if (error) throw error;

  const { error: wsError } = await supabase
    .from('workstreams')
    .insert(DEFAULT_WORKSTREAMS.map((ws) => ({ ...ws, release_id: release.id })));
  if (wsError) throw wsError;

  const { error: clError } = await supabase
    .from('release_checklist')
    .insert(
      DEFAULT_CHECKLIST.map((label, i) => ({
        label,
        release_id: release.id,
        completed: false,
        sort_order: i,
      }))
    );
  if (clError) throw clError;

  // If a template was chosen, seed tasks from it
  if (templateId && targetDate) {
    const { data: templateTasks } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_id', templateId);

    const { data: workstreams } = await supabase
      .from('workstreams')
      .select('*')
      .eq('release_id', release.id);

    if (templateTasks?.length && workstreams?.length) {
      const wsMap = Object.fromEntries(workstreams.map((w) => [w.name, w.id]));
      const releaseDate = new Date(targetDate);

      const tasks = templateTasks
        .filter((t) => !t.excluded_by_default)
        .map((t) => {
          const due = new Date(releaseDate);
          due.setDate(due.getDate() - t.days_before_release);
          // Bump Sunday to Saturday
          if (due.getDay() === 0) due.setDate(due.getDate() - 1);

          return {
            workstream_id: wsMap[t.workstream_name],
            title: t.title,
            status: 'not_started',
            due_date: due.toISOString().split('T')[0],
            sort_order: t.days_before_release,
          };
        })
        .filter((t) => t.workstream_id);

      if (tasks.length) {
        const { error: taskErr } = await supabase.from('tasks').insert(tasks);
        if (taskErr) throw taskErr;
      }
    }
  }

  return release;
}

export async function deleteRelease(id) {
  const { error } = await supabase.from('releases').delete().eq('id', id);
  if (error) throw error;
}

export async function updateRelease({ id, ...fields }) {
  // If status is being set to 'released' and no released_at is provided,
  // stamp it now. If status transitions away from 'released', clear the stamp.
  if (fields.status === 'released' && fields.released_at === undefined) {
    fields.released_at = new Date().toISOString();
  } else if (
    fields.status !== undefined &&
    fields.status !== 'released' &&
    fields.released_at === undefined
  ) {
    fields.released_at = null;
  }

  const { data, error } = await supabase
    .from('releases')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Create an empty album (no template, no default workstreams / checklist —
// albums are containers for other releases, not work boards themselves).
export async function createAlbum({ title, targetDate = null }) {
  const { data, error } = await supabase
    .from('releases')
    .insert({
      title,
      type: 'album',
      status: 'planning',
      target_date: targetDate,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTask({ workstreamId, releaseId, actorId, ...fields }) {
  if (!fields.assignee_id && !fields.external_assignee && fields.status !== 'not_started') {
    throw new Error('Assign this task before setting a status other than "not started".');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({ workstream_id: workstreamId, status: 'not_started', ...fields })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    releaseId,
    taskId: data.id,
    actorId,
    action: 'created',
    metadata: { title: data.title },
  });
  return data;
}

export async function updateTask({ id, releaseId, actorId, ...fields }) {
  // Assignee guard: can't leave not_started without an assignee
  if (fields.status && fields.status !== 'not_started') {
    const { data: existing } = await supabase
      .from('tasks')
      .select('assignee_id, external_assignee')
      .eq('id', id)
      .single();
    if (!existing?.assignee_id && !existing?.external_assignee && !fields.assignee_id && !fields.external_assignee) {
      throw new Error('Assign this task before changing its status.');
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    releaseId,
    taskId: id,
    actorId,
    action: 'moved',
    metadata: fields,
  });
  return data;
}

export async function markComplete({ id, releaseId, actorId }) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({ releaseId, taskId: id, actorId, action: 'completed' });
  return data;
}

export async function reopenTask({ id, releaseId, actorId }) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'in_progress', completed_at: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({ releaseId, taskId: id, actorId, action: 'reopened' });
  return data;
}

export async function markBlocked({ id, releaseId, actorId, blockedReason }) {
  const { data: existing } = await supabase
    .from('tasks')
    .select('assignee_id, external_assignee')
    .eq('id', id)
    .single();
  if (!existing?.assignee_id && !existing?.external_assignee) {
    throw new Error('Assign this task before marking it blocked.');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'blocked', blocked_reason: blockedReason })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    releaseId,
    taskId: id,
    actorId,
    action: 'blocked',
    metadata: { reason: blockedReason },
  });
  return data;
}

export async function deleteTask({ id, releaseId, actorId, title }) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  await logActivity({
    releaseId,
    taskId: null,
    actorId,
    action: 'archived',
    metadata: { title },
  });
}

export async function addComment({ taskId, releaseId, actorId, body }) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: actorId, body })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    releaseId,
    taskId,
    actorId,
    action: 'commented',
    metadata: { preview: body.slice(0, 80) },
  });
  return data;
}

export async function uploadAttachment({ taskId, releaseId, actorId, file }) {
  const ext = file.name.split('.').pop();
  const path = `${taskId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('studio-attachments')
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      storage_path: path,
      filename: file.name,
      uploaded_by: actorId,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    releaseId,
    taskId,
    actorId,
    action: 'commented',
    metadata: { attachment: file.name },
  });
  return data;
}

export async function toggleChecklistItem({ id, completed }) {
  const { data, error } = await supabase
    .from('release_checklist')
    .update({ completed })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSong({ releaseId, title, trackNumber }) {
  const { data, error } = await supabase
    .from('songs')
    .insert({ release_id: releaseId, title, track_number: trackNumber, status: 'writing' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Workstreams ───────────────────────────────────────────────────────────────

export async function updateWorkstream({ id, name, sortOrder }) {
  const updates = {};
  if (name      !== undefined) updates.name       = name;
  if (sortOrder !== undefined) updates.sort_order = sortOrder;
  const { data, error } = await supabase
    .from('workstreams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function createReleaseFromTemplate({ templateId, title, targetDate, excludedTaskIds = [] }) {
  const { data, error } = await supabase.rpc('create_release_from_template', {
    p_template_id: templateId,
    p_title: title,
    p_target_date: targetDate,
    p_excluded_task_ids: excludedTaskIds,
  });
  if (error) throw error;
  return data;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

// ── Streaming stats ────────────────────────────────────────────────────────────

export async function updatePlatformIds(releaseId, platformIds) {
  const { data, error } = await supabase
    .from('releases')
    .update({ platform_ids: platformIds })
    .eq('id', releaseId)
    .select('platform_ids')
    .single();
  if (error) throw error;
  return data.platform_ids;
}

// Upsert today's snapshot for a platform. Caller passes only the fields it has.
export async function upsertReleaseStat({ releaseId, platform, source = 'manual', ...metrics }) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('release_stats')
    .upsert(
      { release_id: releaseId, platform, snapshot_date: today, source, ...metrics },
      { onConflict: 'release_id,platform,snapshot_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function updateProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.display_name,
      initials: updates.initials,
      avatar_color_from: updates.avatar_color_from,
      avatar_color_to: updates.avatar_color_to,
      timezone: updates.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
