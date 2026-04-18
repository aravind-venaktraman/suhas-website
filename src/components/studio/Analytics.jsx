import React from 'react';
import { colors, fonts } from './tokens';
import {
  computeProgressByLane,
  computeBlockers,
  computeStuck,
} from '../../lib/studio/analytics';

function ProgressBar({ label, color, pct, done, total }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: colors.textMuted, fontFamily: fonts.display }}
        >
          {label}
        </span>
        <span className="text-[10px]" style={{ color: colors.textDim }}>
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${color}20` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function Analytics({
  tasks = [],
  workstreams = [],
  checklist = [],
  onChecklistToggle,
  onTaskClick,
}) {
  const byLane = computeProgressByLane(tasks, workstreams);
  const blockers = computeBlockers(tasks);
  const stuck = computeStuck(tasks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Progress by lane */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: colors.textDim, fontFamily: fonts.display }}
        >
          Progress by workstream
        </h3>
        {byLane.map((lane) => (
          <ProgressBar
            key={lane.id}
            label={lane.name}
            color={lane.color}
            pct={lane.percent}
            done={lane.done}
            total={lane.total}
          />
        ))}
        {byLane.length === 0 && (
          <p className="text-[11px]" style={{ color: colors.textDim }}>No workstreams found.</p>
        )}
      </div>

      {/* Release checklist */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: colors.textDim, fontFamily: fonts.display }}
        >
          Release checklist
        </h3>
        {checklist.map((item) => (
          <button
            key={item.id}
            onClick={() => onChecklistToggle?.(item)}
            className="flex items-center gap-3 text-left group transition-all"
          >
            <span
              className="shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-all"
              style={{
                background: item.completed ? colors.cyan + '25' : 'transparent',
                borderColor: item.completed ? colors.cyan + '70' : colors.border,
              }}
            >
              {item.completed && (
                <span style={{ color: colors.cyan, fontSize: 10, fontWeight: 700 }}>✓</span>
              )}
            </span>
            <span
              className="text-[12px] transition-colors"
              style={{
                color: item.completed ? colors.textDim : colors.textSecondary,
                textDecoration: item.completed ? 'line-through' : 'none',
                fontFamily: fonts.body,
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
        {checklist.length === 0 && (
          <p className="text-[11px]" style={{ color: colors.textDim }}>No checklist items.</p>
        )}
      </div>

      {/* Blockers */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: blockers.length > 0 ? colors.red : colors.textDim, fontFamily: fonts.display }}
        >
          Blockers ({blockers.length})
        </h3>
        {blockers.length === 0 && (
          <p className="text-[11px]" style={{ color: '#4ADE80' }}>No blockers. Keep it up.</p>
        )}
        {blockers.map((task) => (
          <button
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="flex flex-col gap-1 text-left rounded-xl p-3 transition-all hover:brightness-110"
            style={{
              background: 'rgba(248,113,113,0.07)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <p className="text-[12px] font-semibold" style={{ color: colors.red }}>{task.title}</p>
            {task.blocked_reason && (
              <p className="text-[11px]" style={{ color: colors.textDim }}>{task.blocked_reason}</p>
            )}
          </button>
        ))}
      </div>

      {/* Stuck tasks */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: stuck.length > 0 ? '#A855F7' : colors.textDim, fontFamily: fonts.display }}
        >
          Stuck 30d+ ({stuck.length})
        </h3>
        {stuck.length === 0 && (
          <p className="text-[11px]" style={{ color: '#4ADE80' }}>No tasks stuck over 30 days.</p>
        )}
        {stuck.map((task) => {
          const age = Math.floor((Date.now() - new Date(task.created_at)) / (1000 * 60 * 60 * 24));
          return (
            <button
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className="flex flex-col gap-1 text-left rounded-xl p-3 transition-all hover:brightness-110"
              style={{
                background: 'rgba(168,85,247,0.07)',
                border: '1px solid rgba(168,85,247,0.2)',
              }}
            >
              <p className="text-[12px] font-semibold" style={{ color: '#A855F7' }}>{task.title}</p>
              <p className="text-[11px]" style={{ color: colors.textDim }}>Open for {age} days</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
