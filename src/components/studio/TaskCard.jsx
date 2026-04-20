import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { colors, statusMeta, priorityMeta, cardTopLine, fonts } from './tokens';
import SongPill from './SongPill';
import AvatarMini from './AvatarMini';
import Popover, { PopoverItem } from './Popover';

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

function InlineEditableTitle({ value, isDone, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    if (editing) { ref.current?.focus(); ref.current?.select(); }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="studio-card-title-edit"
        rows={2}
      />
    );
  }

  return (
    <p
      className={`text-[12px] font-semibold leading-snug studio-card-title ${isDone ? 'line-through opacity-50' : ''}`}
      style={{ color: colors.textSecondary, fontFamily: fonts.body, margin: 0 }}
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Double-click to rename"
    >
      {value}
    </p>
  );
}

export default function TaskCard({
  task,
  song,
  songs = [],
  allProfiles = [],
  onClick,
  isDragging,
  onDragStart,
  onDragEnd,
  onTitleCommit,
  onTaskUpdate,
  isSelected,
  isDimmed,
}) {
  const stuck   = isStuck(task);
  const overdue = isOverdue(task);
  const status  = statusMeta[task.status]  ?? statusMeta.not_started;
  const priority = priorityMeta[task.priority] ?? priorityMeta.normal;

  const assigneeProfile = task.assignee ?? null;
  const externalAssignee = task.external_assignee ?? null;

  const addBtnRef = useRef(null);
  const [openPopover, setOpenPopover] = useState(null); // 'menu'|'date'|'assignee'|'song'|'priority'
  const [dateDraft, setDateDraft] = useState('');
  const [externalDraft, setExternalDraft] = useState('');

  function closePopover() { setOpenPopover(null); }

  function openMenu(e) {
    e.stopPropagation();
    e.preventDefault();
    setOpenPopover(prev => prev === 'menu' ? null : 'menu');
  }

  function openSub(type, e) {
    e?.stopPropagation();
    if (type === 'date')     setDateDraft(task.due_date ?? '');
    if (type === 'assignee') setExternalDraft(task.external_assignee ?? '');
    setOpenPopover(type);
  }

  function commitDate() {
    onTaskUpdate?.(task.id, { due_date: dateDraft || null });
    closePopover();
  }

  function commitAssignee(profileId) {
    onTaskUpdate?.(task.id, { assignee_id: profileId, external_assignee: null });
    closePopover();
  }

  function commitExternalAssignee() {
    onTaskUpdate?.(task.id, { assignee_id: null, external_assignee: externalDraft.trim() || null });
    closePopover();
  }

  function commitSong(songId) {
    onTaskUpdate?.(task.id, { song_id: songId || null });
    closePopover();
  }

  function commitPriority(p) {
    onTaskUpdate?.(task.id, { priority: p });
    closePopover();
  }

  const hasMetadata =
    task.status !== 'not_started' ||
    stuck ||
    overdue ||
    task.priority === 'high' ||
    task.priority === 'urgent' ||
    !!song;

  return (
    <div
      draggable
      onDragStart={e => {
        e.stopPropagation();
        e.dataTransfer.setData('dragtype', 'card');
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={e => { e.stopPropagation(); onDragEnd?.(); }}
      onClick={e => {
        if (e.target.closest('textarea, input, [data-card-action]')) return;
        onClick?.(e);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick?.(e); }}
      className="w-full text-left relative rounded-xl p-3.5 flex flex-col gap-2.5 group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
      style={{
        background: colors.bgCard,
        border: isSelected
          ? '2px solid #22D3EE'
          : `1px solid ${task.status === 'blocked' ? 'rgba(248,113,113,0.3)' : colors.border}`,
        backdropFilter: 'blur(12px)',
        opacity: isDragging ? 0.35 : isDimmed ? 0.2 : 1,
        cursor: isDragging ? 'grabbing' : 'default',
        transition: 'opacity 0.15s, transform 0.15s, border-color 0.1s',
        pointerEvents: isDimmed ? 'none' : undefined,
        userSelect: 'none',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px transition-opacity duration-200 opacity-60 group-hover:opacity-100"
        style={{ background: cardTopLine }}
      />

      {/* Title — double-click to edit inline */}
      <InlineEditableTitle
        value={task.title}
        isDone={task.status === 'done'}
        onCommit={newTitle => onTitleCommit?.(task.id, newTitle)}
      />

      {/* Chips row — only non-default metadata */}
      {(hasMetadata || true /* always render for the + button */) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Status — hidden when not_started */}
          {task.status !== 'not_started' && (
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
          )}

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

          {/* Priority — high / urgent only */}
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

          {/* Hover + button for quick metadata */}
          <div
            ref={addBtnRef}
            data-card-action
            onClick={openMenu}
            className="studio-card-meta-add"
            title="Add metadata"
          >
            <Plus size={10} />
          </div>
        </div>
      )}

      {/* Bottom row: due date + assignee — only when non-empty */}
      {(task.due_date || assigneeProfile || externalAssignee) && (
        <div className="flex items-center justify-between gap-2">
          {task.due_date ? (
            <p
              className="text-[10px]"
              style={{ color: overdue ? colors.red : colors.textDim, fontFamily: fonts.body, margin: 0 }}
            >
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          ) : (
            <span />
          )}

          {assigneeProfile && <AvatarMini profile={assigneeProfile} size={18} />}

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
      )}

      {/* ── Popovers ── */}

      {openPopover === 'menu' && (
        <Popover anchorEl={addBtnRef.current} onClose={closePopover}>
          <PopoverItem icon="📅" label="Due date"  onClick={() => openSub('date')} />
          <PopoverItem icon="👤" label="Assignee"  onClick={() => openSub('assignee')} />
          {songs.length > 0 && (
            <PopoverItem icon="🎵" label="Song"    onClick={() => openSub('song')} />
          )}
          <PopoverItem icon="⚡" label="Priority"  onClick={() => openSub('priority')} />
        </Popover>
      )}

      {openPopover === 'date' && (
        <Popover anchorEl={addBtnRef.current} onClose={closePopover} minWidth={200}>
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="date"
              autoFocus
              value={dateDraft}
              onChange={e => setDateDraft(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();
                if (e.key === 'Enter') commitDate();
                if (e.key === 'Escape') closePopover();
              }}
              style={{
                background: 'rgba(9,9,11,0.6)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: 4, padding: '6px 8px',
                color: '#E4E4E7', fontSize: 12,
                fontFamily: 'inherit', outline: 'none',
                width: '100%', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => { onTaskUpdate?.(task.id, { due_date: null }); closePopover(); }}
                style={{ flex: 1, padding: '5px 0', borderRadius: 4, border: '1px solid rgba(244,244,245,0.1)', background: 'transparent', color: '#71717A', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={commitDate}
                style={{ flex: 1, padding: '5px 0', borderRadius: 4, border: 'none', background: 'rgba(34,211,238,0.15)', color: '#22D3EE', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Set
              </button>
            </div>
          </div>
        </Popover>
      )}

      {openPopover === 'assignee' && (
        <Popover anchorEl={addBtnRef.current} onClose={closePopover} minWidth={200}>
          {allProfiles.map(p => (
            <PopoverItem
              key={p.id}
              label={p.display_name || p.initials || p.id.slice(0, 8)}
              onClick={() => commitAssignee(p.id)}
            />
          ))}
          <div style={{ borderTop: '1px solid rgba(244,244,245,0.08)', margin: '4px 0 0', padding: '6px 10px 4px' }}>
            <p style={{ fontSize: 10, color: '#71717A', margin: '0 0 4px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.1em' }}>External</p>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                placeholder="Name..."
                value={externalDraft}
                autoFocus={allProfiles.length === 0}
                onChange={e => setExternalDraft(e.target.value)}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter') commitExternalAssignee();
                  if (e.key === 'Escape') closePopover();
                }}
                style={{
                  flex: 1, background: 'rgba(9,9,11,0.6)',
                  border: '1px solid rgba(244,244,245,0.1)',
                  borderRadius: 4, padding: '4px 6px',
                  color: '#E4E4E7', fontSize: 11, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={commitExternalAssignee}
                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: 'rgba(34,211,238,0.15)', color: '#22D3EE', fontSize: 11, cursor: 'pointer' }}
              >
                Set
              </button>
            </div>
            {(task.assignee_id || task.external_assignee) && (
              <button
                type="button"
                onClick={() => { onTaskUpdate?.(task.id, { assignee_id: null, external_assignee: null }); closePopover(); }}
                style={{ marginTop: 6, padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(244,244,245,0.08)', background: 'transparent', color: '#71717A', fontSize: 11, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
              >
                Clear assignee
              </button>
            )}
          </div>
        </Popover>
      )}

      {openPopover === 'song' && (
        <Popover anchorEl={addBtnRef.current} onClose={closePopover} minWidth={200}>
          <PopoverItem label="No song" onClick={() => commitSong(null)} />
          {songs.map(s => (
            <PopoverItem
              key={s.id}
              label={`${s.track_number ? `${s.track_number}. ` : ''}${s.title}`}
              onClick={() => commitSong(s.id)}
            />
          ))}
        </Popover>
      )}

      {openPopover === 'priority' && (
        <Popover anchorEl={addBtnRef.current} onClose={closePopover}>
          {['low', 'normal', 'high', 'urgent'].map(p => (
            <PopoverItem
              key={p}
              label={priorityMeta[p].label}
              onClick={() => commitPriority(p)}
            />
          ))}
        </Popover>
      )}
    </div>
  );
}
