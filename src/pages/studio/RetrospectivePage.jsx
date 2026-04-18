import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  getRelease,
  listWorkstreams,
  listTasks,
  getActivityLog,
} from '../../lib/studio/queries';
import {
  computeCycleTimeMedian,
  computeProgressByLane,
  computeActivityByDay,
  computeWorkDistribution,
  formatRelativeTime,
} from '../../lib/studio/analytics';
import { colors, fonts } from '../../components/studio/tokens';
import ActivityFeed from '../../components/studio/ActivityFeed';

function StatCard({ label, value, sub, accent = colors.cyan }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
    >
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }}
      />
      <p
        className="text-[9px] font-bold uppercase tracking-[0.15em]"
        style={{ color: colors.textDim, fontFamily: fonts.display }}
      >
        {label}
      </p>
      <p
        className="text-[24px] font-black leading-none"
        style={{ color: accent, fontFamily: fonts.display }}
      >
        {value ?? 'N/A'}
      </p>
      {sub && (
        <p className="text-[10px]" style={{ color: colors.textDim }}>{sub}</p>
      )}
    </div>
  );
}

const DAY_HEIGHT = 40;

export default function RetrospectivePage() {
  const { releaseId } = useParams();
  const { user } = useOutletContext();

  const [release, setRelease] = useState(null);
  const [workstreams, setWorkstreams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rel, ws, t, log] = await Promise.all([
          getRelease(releaseId),
          listWorkstreams(releaseId),
          listTasks(releaseId),
          getActivityLog(releaseId, 200),
        ]);
        setRelease(rel);
        setWorkstreams(ws);
        setTasks(t);
        setActivityLog(log);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [releaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: colors.textDim, fontFamily: fonts.display }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!release) return null;

  const cycleTimeMedian = computeCycleTimeMedian(activityLog);
  const byLane = computeProgressByLane(tasks, workstreams);
  const byDay = computeActivityByDay(activityLog);
  const workDist = computeWorkDistribution(tasks, workstreams);

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const blockedCount = activityLog.filter((e) => e.action === 'blocked').length;
  const completedCount = activityLog.filter((e) => e.action === 'completed').length;

  const maxDayCount = Math.max(1, ...byDay.map((d) => d.count));
  const maxWorkCount = Math.max(1, ...workDist.map((w) => w.count));

  return (
    <div className="px-5 md:px-8 py-8 max-w-4xl mx-auto">

      {/* Back link */}
      <Link
        to={`/studio/release/${releaseId}`}
        className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-70"
        style={{ color: colors.textDim, fontFamily: fonts.display }}
      >
        <ChevronLeft size={13} /> Back to board
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1"
          style={{ color: colors.textDim, fontFamily: fonts.display }}
        >
          Retrospective
        </p>
        <h1
          className="text-[22px] md:text-[28px] font-black uppercase tracking-tight leading-none"
          style={{ color: colors.textPrimary, fontFamily: fonts.display }}
        >
          {release.title}
        </h1>
        <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
          {release.released_at
            ? `Released ${new Date(release.released_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
            : 'Release date not set'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Cycle time (median)"
          value={cycleTimeMedian != null ? `${cycleTimeMedian.toFixed(1)}d` : 'N/A'}
          sub="task open to done"
          accent={colors.cyan}
        />
        <StatCard
          label="Tasks completed"
          value={`${doneTasks}/${totalTasks}`}
          sub={`${Math.round((doneTasks / Math.max(1, totalTasks)) * 100)}% complete`}
          accent="#4ADE80"
        />
        <StatCard
          label="Total blockers"
          value={blockedCount}
          sub="times blocked across tasks"
          accent={blockedCount > 0 ? colors.red : '#4ADE80'}
        />
        <StatCard
          label="Total activity"
          value={activityLog.length}
          sub="log entries"
          accent={colors.indigoDim}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Day of week activity */}
        <div
          className="rounded-2xl p-5"
          style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
            style={{ color: colors.textDim, fontFamily: fonts.display }}
          >
            Activity by day of week
          </p>
          <div className="flex items-end gap-2 h-28">
            {byDay.map((d) => {
              const barH = Math.round((d.count / maxDayCount) * 100);
              const isSun = d.name === 'Sun';
              return (
                <div key={d.name} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${barH}%`,
                      minHeight: 2,
                      background: isSun
                        ? `${colors.red}50`
                        : `linear-gradient(to top, ${colors.indigo}60, ${colors.cyan}40)`,
                    }}
                  />
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: isSun ? colors.red : colors.textDim, fontFamily: fonts.display }}
                  >
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] mt-3" style={{ color: colors.textDim }}>
            Sunday activity is typically low. Tasks are avoided on Sundays.
          </p>
        </div>

        {/* Work distribution by lane */}
        <div
          className="rounded-2xl p-5"
          style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
            style={{ color: colors.textDim, fontFamily: fonts.display }}
          >
            Tasks by workstream
          </p>
          <div className="flex flex-col gap-3">
            {workDist.map((ws) => (
              <div key={ws.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: ws.color, fontFamily: fonts.display }}
                  >
                    {ws.name}
                  </span>
                  <span className="text-[10px]" style={{ color: colors.textDim }}>{ws.count} tasks</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${ws.color}20` }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((ws.count / maxWorkCount) * 100)}%`, background: ws.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress by workstream (done %) */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
          style={{ color: colors.textDim, fontFamily: fonts.display }}
        >
          Completion by workstream
        </p>
        <div className="flex flex-col gap-4">
          {byLane.map((lane) => (
            <div key={lane.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted, fontFamily: fonts.display }}
                >
                  {lane.name}
                </span>
                <span className="text-[10px]" style={{ color: colors.textDim }}>
                  {lane.done}/{lane.total} ({lane.percent}%)
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: `${lane.color}20` }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${lane.percent}%`, background: lane.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div
        className="rounded-2xl p-5"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
          style={{ color: colors.textDim, fontFamily: fonts.display }}
        >
          Full activity log ({activityLog.length} entries)
        </p>
        <ActivityFeed entries={activityLog} />
      </div>
    </div>
  );
}
