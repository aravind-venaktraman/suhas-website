import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { colors, fonts } from './tokens';
import TaskCard from './TaskCard';

export default function Lane({
  workstream,
  tasks = [],
  songs = [],
  allProfiles = [],
  filterQuery,
  selectedIds,
  onCardClick,        // (task, e) => void
  onAddTask,          // ({ workstreamId, title }) => void
  onRename,
  onTaskTitleCommit,  // (taskId, newTitle) => void
  onTaskUpdate,       // (taskId, fields) => void
  addTriggerPulse,    // number — increments to activate inline add from keyboard
  onAddActivated,     // (workstreamId) => void — notify parent of last-used lane
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
  const [adding, setAdding]       = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const headerInputRef = useRef(null);
  const addInputRef    = useRef(null);
  const escaping       = useRef(false);

  // Sync header name draft on external update
  useEffect(() => {
    if (!editing) setDraftName(workstream.name);
  }, [workstream.name, editing]);

  // Respond to keyboard N shortcut from parent
  const prevPulse = useRef(0);
  useEffect(() => {
    if (addTriggerPulse && addTriggerPulse > prevPulse.current) {
      prevPulse.current = addTriggerPulse;
      setAdding(true);
      onAddActivated?.(workstream.id);
    }
  }, [addTriggerPulse, workstream.id, onAddActivated]);

  // Focus the add input when adding activates
  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  // ── Column rename ────────────────────────────────────────────────────────────
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

  function handleHeaderKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setDraftName(workstream.name); setEditing(false); }
  }

  // ── Inline task add ──────────────────────────────────────────────────────────
  function activateAdd() {
    setAdding(true);
    onAddActivated?.(workstream.id);
  }

  function handleAddKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const title = draftTitle.trim();
      if (title) {
        onAddTask?.({ workstreamId: workstream.id, title });
        setDraftTitle('');
        // Stay open for rapid multi-task entry (Trello pattern)
      }
    } else if (e.key === 'Escape') {
      escaping.current = true;
      setAdding(false);
      setDraftTitle('');
    }
  }

  function handleAddBlur() {
    if (escaping.current) { escaping.current = false; return; }
    const title = draftTitle.trim();
    if (title) onAddTask?.({ workstreamId: workstream.id, title });
    setAdding(false);
    setDraftTitle('');
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const songMap   = Object.fromEntries(songs.map(s => [s.id, s]));
  const laneTasks = tasks.filter(t => t.workstream_id === workstream.id);
  const done      = laneTasks.filter(t => t.status === 'done').length;
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
      onDrop={e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('dragtype');
        if (type === 'card')   onCardDrop?.();
        if (type === 'column') onColumnDrop?.();
      }}
    >
      {/* Column-reorder insert indicator */}
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
        onDragStart={e => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: workstream.color, flexShrink: 0,
            }} />

            {editing ? (
              <input
                ref={headerInputRef}
                autoFocus
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleHeaderKeyDown}
                onClick={e => e.stopPropagation()}
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

          <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textDim, flexShrink: 0 }}>
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
        {/* Drop zone placeholder */}
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

        {!isDragOverCard && laneTasks.length === 0 && !adding && (
          <p style={{
            fontFamily: fonts.body, fontSize: 11,
            color: colors.textDim, textAlign: 'center',
            padding: '16px 0',
          }}>
            No tasks yet
          </p>
        )}

        {laneTasks.map(task => {
          const isDimmed = filterQuery
            ? !task.title.toLowerCase().includes(filterQuery.toLowerCase())
            : false;
          return (
            <TaskCard
              key={task.id}
              task={task}
              song={task.song_id ? songMap[task.song_id] : null}
              songs={songs}
              allProfiles={allProfiles}
              isDragging={draggingCardId === task.id}
              onDragStart={() => onCardDragStart?.(task)}
              onDragEnd={onDragEnd}
              onClick={e => onCardClick?.(task, e)}
              onTitleCommit={(taskId, newTitle) => onTaskTitleCommit?.(taskId, newTitle)}
              onTaskUpdate={onTaskUpdate}
              isSelected={selectedIds?.has(task.id)}
              isDimmed={isDimmed}
            />
          );
        })}

        {/* Inline add input / Add task button */}
        {adding ? (
          <div className="studio-inline-add">
            <textarea
              ref={addInputRef}
              className="studio-inline-add-input"
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={handleAddBlur}
              placeholder="Task title, Enter to add"
              rows={2}
            />
            <div className="studio-inline-add-hint">Enter to add · Esc to cancel</div>
          </div>
        ) : (
          <button onClick={activateAdd} className="studio-add-btn">
            <Plus size={12} />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
