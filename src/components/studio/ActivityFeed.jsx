import React from 'react';
import { formatRelativeTime, formatDualTimezone } from '../../lib/studio/analytics';
import { colors } from './tokens';

const ACTION_LABELS = {
  created:   { icon: '✦', label: 'created task',     color: colors.cyan },
  completed: { icon: '✓', label: 'completed task',   color: '#4ADE80' },
  reopened:  { icon: '↩', label: 'reopened task',    color: colors.amber },
  moved:     { icon: '→', label: 'updated task',     color: colors.indigoDim },
  blocked:   { icon: '⊘', label: 'marked blocked',   color: colors.red },
  commented: { icon: '⌁', label: 'commented',        color: colors.textMuted },
  archived:  { icon: '⊡', label: 'archived task',    color: colors.textDim },
};

function displayName(email) {
  if (email === 'arav@suhasmusic.com') return 'Arav';
  if (email === 'management@suhasmusic.com') return 'Suhas';
  return email?.split('@')[0] ?? 'Unknown';
}

export default function ActivityFeed({ entries = [], userEmailMap = {} }) {
  if (entries.length === 0) {
    return (
      <p className="text-[12px] text-center py-8" style={{ color: colors.textDim }}>
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => {
        const meta = ACTION_LABELS[entry.action] ?? ACTION_LABELS.moved;
        const actorEmail = userEmailMap[entry.actor_id] ?? entry.actor_id;
        const name = displayName(actorEmail);
        const date = new Date(entry.created_at);
        const taskTitle = entry.metadata?.title || entry.metadata?.preview || '';

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 py-2.5 border-b"
            style={{ borderColor: colors.border }}
          >
            <span
              className="text-[13px] mt-0.5 shrink-0 w-5 text-center"
              style={{ color: meta.color }}
            >
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                <span className="font-bold" style={{ fontFamily: "'Michroma', sans-serif" }}>
                  {name}
                </span>{' '}
                <span style={{ color: colors.textMuted }}>{meta.label}</span>
                {taskTitle && (
                  <>
                    {' — '}
                    <span
                      className="italic truncate max-w-[200px] inline-block align-bottom"
                      style={{ color: colors.textDim }}
                    >
                      {taskTitle}
                    </span>
                  </>
                )}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: colors.textDim }}
                title={formatDualTimezone(date)}
              >
                {formatRelativeTime(date)} &middot; {formatDualTimezone(date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
