import React from 'react';
import { formatRelativeTime, formatDualTimezone } from '../../lib/studio/analytics';
import { colors, fonts } from './tokens';

// ── Action metadata ────────────────────────────────────────────────────────────

const ACTION_META = {
  created:          { icon: '✦', verb: 'created task',            color: colors.cyan },
  completed:        { icon: '✓', verb: 'completed task',          color: '#4ADE80' },
  reopened:         { icon: '↩', verb: 'reopened task',           color: colors.amber },
  moved:            { icon: '→', verb: 'updated task',            color: colors.indigoDim },
  blocked:          { icon: '⊘', verb: 'marked blocked',          color: colors.red },
  commented:        { icon: '⌁', verb: 'commented on task',       color: colors.textMuted },
  archived:         { icon: '⊡', verb: 'archived task',           color: colors.textDim },
  scope_cut_summary:{ icon: '↻', verb: 'archived batch of cuts',  color: colors.textDim },
  historical_import:{ icon: '↻', verb: 'imported from Trello',    color: colors.textDim },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ActivityFeed({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <p style={{ fontFamily: fonts.body, fontSize: 12, textAlign: 'center', padding: '32px 0', color: colors.textDim }}>
        No activity yet.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map((entry) => {
        const meta = ACTION_META[entry.action] ?? ACTION_META.moved;
        const actor = entry.actor;

        // Task title: prefer the joined task row, fall back to metadata
        const taskTitle =
          entry.task?.title ||
          entry.metadata?.title ||
          entry.metadata?.preview ||
          null;

        const avatarBg = actor
          ? `linear-gradient(135deg, ${actor.avatar_color_from}, ${actor.avatar_color_to})`
          : 'rgba(113,113,122,0.3)';

        const displayName = actor?.display_name ?? 'Unknown';

        return (
          <div
            key={entry.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 0',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {/* Action icon */}
            <span style={{
              fontSize: 13, marginTop: 1, flexShrink: 0,
              width: 20, textAlign: 'center',
              color: meta.color,
            }}>
              {meta.icon}
            </span>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>

                {/* Actor name pill */}
                <span style={{
                  display: 'inline-block',
                  background: avatarBg,
                  color: '#09090B',
                  padding: '1px 8px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: fonts.display,
                  letterSpacing: '0.05em',
                  marginRight: 6,
                  verticalAlign: 'middle',
                }}>
                  {displayName}
                </span>

                {/* Action verb */}
                <span style={{ color: colors.textMuted }}>{meta.verb}</span>

                {/* Task title */}
                {taskTitle && (
                  <>
                    {' — '}
                    <span style={{
                      color: colors.textDim, fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', maxWidth: 220,
                      display: 'inline-block', verticalAlign: 'bottom',
                    }}>
                      {taskTitle}
                    </span>
                  </>
                )}

                {/* Blocked reason */}
                {entry.action === 'blocked' && entry.metadata?.reason && (
                  <span style={{ color: colors.red, fontSize: 10, marginLeft: 4 }}>
                    · {entry.metadata.reason}
                  </span>
                )}
              </p>

              {/* Timestamp */}
              <p style={{ fontSize: 10, color: colors.textDim, margin: '2px 0 0', fontFamily: fonts.body }}>
                {formatRelativeTime(new Date(entry.created_at))}
                {' · '}
                {formatDualTimezone(new Date(entry.created_at))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
