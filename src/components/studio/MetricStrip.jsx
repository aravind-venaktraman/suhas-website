import React from 'react';
import { colors, cardTopLine, fonts } from './tokens';

function Metric({ label, value, sub, accent = colors.cyan }) {
  return (
    <div
      className="relative flex-1 min-w-0 rounded-xl p-4 flex flex-col gap-1 overflow-hidden"
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: cardTopLine }}
      />

      <p
        className="text-[9px] uppercase tracking-[0.15em] font-bold"
        style={{ color: colors.textDim, fontFamily: fonts.display }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-black leading-none"
        style={{ color: accent, fontFamily: fonts.display }}
      >
        {value ?? '--'}
      </p>
      {sub && (
        <p className="text-[10px]" style={{ color: colors.textDim, fontFamily: fonts.body }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function MetricStrip({ readiness, daysToRelease, blockers, stuck, collaborators }) {
  const readinessColor =
    readiness >= 80 ? '#4ADE80' : readiness >= 50 ? colors.amber : colors.cyan;

  const daysColor =
    daysToRelease == null
      ? colors.textDim
      : daysToRelease < 7
      ? colors.red
      : daysToRelease < 30
      ? colors.amber
      : colors.cyan;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
      <Metric
        label="Readiness"
        value={`${readiness}%`}
        sub="tasks + checklist"
        accent={readinessColor}
      />
      <Metric
        label="Days to release"
        value={daysToRelease != null ? daysToRelease : 'TBD'}
        sub={daysToRelease != null ? (daysToRelease < 0 ? 'overdue' : 'remaining') : 'no date set'}
        accent={daysColor}
      />
      <Metric
        label="Blockers"
        value={blockers}
        sub={blockers === 1 ? '1 task blocked' : `${blockers} tasks blocked`}
        accent={blockers > 0 ? colors.red : '#4ADE80'}
      />
      <Metric
        label="Stuck 30d+"
        value={stuck}
        sub="open over 30 days"
        accent={stuck > 0 ? '#A855F7' : '#4ADE80'}
      />
      <Metric
        label="Collaborators"
        value={collaborators}
        sub="assigned users"
        accent={colors.indigoDim}
      />
    </div>
  );
}
