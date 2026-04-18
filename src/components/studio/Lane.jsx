import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { colors, fonts } from './tokens';
import TaskCard from './TaskCard';

export default function Lane({
  workstream,
  tasks = [],
  songs = [],
  onTaskClick,
  onAddTask,
  onRename,
  // Card DnD
  draggingCardId,
  isDragOverCard,
  onCardDragStart,
  onCardDrop,
  // Column DnD
  isColumnDragging,
  showInsertAfter,
  onColumnDragStart,
  onColumnDrop,
  // Shared
  onDragOver,
  onDragEnd,
}) {
  const [editing, setEditing]     = useState(false);
  const [draftName, setDraftName] = useState(workstream.name);
  const [addHovered, setAddHovered] = useState(false);
  const inputRef = useRef(null);

  // Keep draft in sync if workstream.name changes (e.g. after a remote update)
  useEffect(() => {
    if (!editing) setDraftName(workstream.name);
  }, [workstream.name, editing]);

  function startEdit(e) {
    e.stopPropagation();
    setDraftName(workstream.name);
    setEditing(true);
  }

  function commitEdit() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== workstream.name) onRename?.(trimmed);
    else setDraftName(workstream.name);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setDraftName(workstream.name); setEditing(false); }
  }

  const songMap   = Object.fromEntries(songs.map((s) => [s.id, s]));
  const laneTasks = tasks.filter((t) => t.workstream_id === workstream.id);
  const done      = laneTasks.filter((t) => t.status === 'done').length;
  const total     = laneTasks.length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        borderRadius: 16, overflow: 'visible',
        background: 'rgba(24,24,27,0.35)',
        border: isDragOverCard
          ? `1px solid ${workstream.color}70`
          : `1px solid ${colors.border}`,
        backdropFilter: 'blur(8px)',
        boxShadow: isDragOverCard ? `0 0 0 3px ${workstream.color}20` : undefined,
        opacity: isColumnDragging ? 0.35 : 1,
        transition: 'border-color 0.12s, box-shadow 0.12s, opacity 0.15s',
      }}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('dragtype');
        if (type === 'card')   onCardDrop?.();
        if (type === 'column') onColumnDrop?.();
      }}
    >
      {/* Column-reorder insert indicator (right edge) */}
      {showInsertAfter && (
        <div style={{
          position: 'absolute', right: -4, top: 16, bottom: 16,
          width: 3, borderRadius: 2,
          background: colors.cyan,
          zIndex: 50, pointerEvents: 'none',
          boxShadow: `0 0 8px ${colors.cyan}80`,
        }} />
      )}

      {/* ── Header (draggable for column reorder) ── */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('dragtype', 'column');
          e.dataTransfer.effectAllowed = 'move';
          onColumnDragStart?.();
        }}
        onDragEnd={onDragEnd}
        style={{
          padding: '14px 14px 10px',
          borderBottom: `1px solid ${colors.border}`,
          cursor: 'grab',
          userSelect: 'none',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
          {/* Dot + editable name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: workstream.color, flexShrink: 0,
            }} />

            {editing ? (
              <input
                ref={inputRef}
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, minWidth: 0,
                  fontFamily: fonts.display, fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: colors.textSecondary,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${workstream.color}70`,
                  borderRadius: 4, padding: '2px 6px',
                  outline: 'none',
                }}
              />
            ) : (
              <h3
                onDoubleClick={startEdit}
                title="Double-click to rename"
                style={{
                  fontFamily: fonts.display, fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: colors.textSecondary, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  cursor: 'text',
                }}
              >
                {workstream.name}
              </h3>
            )}
          </div>

          {/* done/total count */}
          <span style={{
            fontFamily: fonts.body, fontSize: 10,
            color: colors.textDim, flexShrink: 0,
          }}>
            {done}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 999, background: `${workstream.color}20`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: workstream.color, borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* ── Cards ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 10, flex: 1,
        overflowY: 'auto', maxHeight: 520,
        borderRadius: '0 0 16px 16px',
      }}>
        {/* Drop zone placeholder when a card hovers this lane */}
        {isDragOverCard && (
          <div style={{
            height: 56, borderRadius: 12,
            border: `2px dashed ${workstream.color}50`,
            background: `${workstream.color}08`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: fonts.display, fontSize: 9,
              color: workstream.color, textTransform: 'uppercase',
              letterSpacing: '0.15em', opacity: 0.8,
            }}>
              Drop here
            </span>
          </div>
        )}

        {!isDragOverCard && laneTasks.length === 0 && (
          <p style={{
            fontFamily: fonts.body, fontSize: 11,
            color: colors.textDim, textAlign: 'center',
            padding: '16px 0',
          }}>
            No tasks yet
          </p>
        )}

        {laneTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            song={task.song_id ? songMap[task.song_id] : null}
            isDragging={draggingCardId === task.id}
            onDragStart={() => onCardDragStart?.(task)}
            onDragEnd={onDragEnd}
            onClick={() => onTaskClick?.(task)}
          />
        ))}

        {/* Add task */}
        <button
          onClick={() => onAddTask?.(workstream)}
          onMouseEnter={() => setAddHovered(true)}
          onMouseLeave={() => setAddHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 12, padding: '10px 12px',
            border: `1px dashed ${addHovered ? `${colors.cyan}60` : colors.border}`,
            color: addHovered ? colors.cyan : colors.textDim,
            background: addHovered ? 'rgba(34,211,238,0.04)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: fonts.display, fontSize: 10,
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', width: '100%', flexShrink: 0,
          }}
        >
          <Plus size={12} />
          Add task
        </button>
      </div>
    </div>
  );
}
