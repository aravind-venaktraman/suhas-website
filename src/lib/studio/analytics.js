// ── Pure analytics functions (no Supabase deps) ──────────────────────────────

export function computeReadiness(tasks, checklist) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const totalChecklist = checklist.length;
  const doneChecklist = checklist.filter((c) => c.completed).length;

  if (totalTasks + totalChecklist === 0) return 0;

  // Tasks weighted 60%, checklist 40% (per studio context doc)
  const taskScore = totalTasks > 0 ? (doneTasks / totalTasks) * 0.6 : 0;
  const checklistScore = totalChecklist > 0 ? (doneChecklist / totalChecklist) * 0.4 : 0;

  // Normalize in case one dimension is missing entirely
  const denominator =
    (totalTasks > 0 ? 0.6 : 0) + (totalChecklist > 0 ? 0.4 : 0);

  return denominator > 0 ? Math.round((taskScore + checklistScore) / denominator * 100) : 0;
}

export function computeBlockers(tasks) {
  return tasks.filter((t) => t.status === 'blocked');
}

export function computeStuck(tasks) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.status !== 'archived' &&
      new Date(t.created_at) < cutoff
  );
}

export function computeProgressByLane(tasks, workstreams) {
  return workstreams.map((ws) => {
    const laneTasks = tasks.filter((t) => t.workstream_id === ws.id);
    const done = laneTasks.filter((t) => t.status === 'done').length;
    return {
      ...ws,
      total: laneTasks.length,
      done,
      percent: laneTasks.length > 0 ? Math.round((done / laneTasks.length) * 100) : 0,
    };
  });
}

export function computeDaysToRelease(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate) - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function computeCollaborators(tasks) {
  const set = new Set();
  tasks.forEach((t) => {
    if (t.assignee_id) set.add(t.assignee_id);
    if (t.external_assignee) set.add(t.external_assignee);
  });
  return set.size;
}

// ── Retrospective analytics (from activity_log) ───────────────────────────────

export function computeCycleTimeMedian(activityLog) {
  const completions = activityLog.filter((e) => e.action === 'completed');
  const creations = activityLog.filter((e) => e.action === 'created');
  const creationMap = Object.fromEntries(creations.map((e) => [e.task_id, e.created_at]));

  const cycleTimes = completions
    .filter((e) => creationMap[e.task_id])
    .map((e) => {
      const ms = new Date(e.created_at) - new Date(creationMap[e.task_id]);
      return ms / (1000 * 60 * 60 * 24); // days
    });

  if (cycleTimes.length === 0) return null;
  cycleTimes.sort((a, b) => a - b);
  const mid = Math.floor(cycleTimes.length / 2);
  return cycleTimes.length % 2 === 0
    ? (cycleTimes[mid - 1] + cycleTimes[mid]) / 2
    : cycleTimes[mid];
}

export function computeActivityByDay(activityLog) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  activityLog.forEach((e) => {
    const day = new Date(e.created_at).getDay();
    counts[day]++;
  });
  return days.map((name, i) => ({ name, count: counts[i] }));
}

export function computeWorkDistribution(tasks, workstreams) {
  return workstreams.map((ws) => ({
    ...ws,
    count: tasks.filter((t) => t.workstream_id === ws.id).length,
  }));
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatDualTimezone(date) {
  const d = new Date(date);
  const austin = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
  const oman = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Muscat',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
  return `${austin} Austin / ${oman} Oman`;
}

export function formatRelativeTime(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Sunday warning for wizard
export function isSunday(dateStr) {
  return new Date(dateStr).getDay() === 0;
}
