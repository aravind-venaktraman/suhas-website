import React from 'react';
import { colors, statusMeta, priorityMeta, cardTopLine, fonts } from './tokens';
import SongPill from './SongPill';
import AvatarMini from './AvatarMini';

const STUCK_DAYS = 30;

function isStuck(task) {
  if (task.status === 'done') return false;
  const age = (Date.now() - new Date(task.created_at)) / (1000 * 60 * 60 * 24);
  return age >= STUCK_DAYS;
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

export default function TaskCard({ task, song, onClick, isDragging, onDragStart, onDragEnd }) {
  const stuck = isStuck(task);
  const overdue = isOverdue(task);
  const status = statusMeta[task.status] ?? statusMeta.not_started;
  const priority = priorityMeta[task.priority] ?? priorityMeta.normal;

  // task.assignee is the joined profile object (may be null if unassigned)
  const assigneeProfile = task.assignee ?? null;
  const externalAssignee = task.external_assignee ?? null;

  return (
    <button
      draggable
      onDragStart={(e) => {
        // Don't let the column-header drag handler fire for card drags
        e.stopPropagation();
        e.dataTransfer.setData('dragtype', 'card');
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={(e) => { e.stopPropagation(); onDragEnd?.(); }}
      onClick={onClick}
      className="w-full text-left relative rounded-xl p-3.5 flex flex-col gap-2.5 group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
      style={{
        background: colors.bgCard,
        border: `1px solid ${task.status === 'blocked' ? 'rgba(248,113,113,0.3)' : colors.border}`,
        backdropFilter: 'blur(12px)',
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 0.15s, transform 0.15s',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px transition-opacity duration-200 opacity-60 group-hover:opacity-100"
        style={{ background: cardTopLine }}
      />

      {/* Title */}
      <p
        className={`text-[12px] font-semibold leading-snug studio-card-title ${task.status === 'done' ? 'line-through opacity-50' : ''}`}
        style={{ color: colors.textSecondary, fontFamily: fonts.body }}
      >
        {task.title}
      </p>

      {/* Chips row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* Status */}
        <span
          className="inline-flex items-center gap-1 rounded-full text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
          style={{
            background: `${status.color}18`,
            border: `1px solid ${status.color}40`,
            color: status.color,
            fontFamily: fonts.display,
          }}
        >
          {status.label}
        </span>

        {/* Stuck */}
        {stuck && (
          <span
            className="rounded-full text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.35)',
              color: '#A855F7',
              fontFamily: fonts.display,
            }}
          >
            Stuck 30d+
          </span>
        )}

        {/* Overdue */}
        {overdue && !stuck && (
          <span
            className="rounded-full text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
            style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.35)',
              color: colors.red,
              fontFamily: fonts.display,
            }}
          >
            Overdue
          </span>
        )}

        {/* Priority (high/urgent only) */}
        {(task.priority === 'high' || task.priority === 'urgent') && (
          <span
            className="rounded-full text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
            style={{
              background: `${priority.color}18`,
              border: `1px solid ${priority.color}40`,
              color: priority.color,
              fontFamily: fonts.display,
            }}
          >
            {priority.label}
          </span>
        )}

        {/* Song */}
        {song && <SongPill trackNumber={song.track_number} title={song.title} />}
      </div>

      {/* Bottom row: due date + assignee */}
      <div className="flex items-center justify-between gap-2">
        {task.due_date ? (
          <p
            className="text-[10px]"
            style={{ color: overdue ? colors.red : colors.textDim, fontFamily: fonts.body }}
          >
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        ) : (
          <span />
        )}

        {/* Assigned to a known user */}
        {assigneeProfile && (
          <AvatarMini profile={assigneeProfile} size={18} />
        )}

        {/* Assigned to an external collaborator (no profile row) */}
        {!assigneeProfile && externalAssignee && (
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(161,161,170,0.1)',
              border: '1px solid rgba(161,161,170,0.25)',
              color: colors.textDim,
              fontFamily: fonts.display,
            }}
          >
            {externalAssignee}
          </span>
        )}
      </div>
    </button>
  );
}
