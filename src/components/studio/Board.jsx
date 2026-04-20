import React, { useState } from 'react';
import './Board.css';
import Lane from './Lane';

/**
 * Board owns drag-and-drop state and threads new direct-manipulation props
 * (filter, bulk selection, inline add trigger, inline metadata updates)
 * down to Lane / TaskCard without owning the data or mutations themselves.
 */
export default function Board({
  workstreams = [],
  tasks = [],
  songs = [],
  allProfiles = [],
  filterQuery,
  selectedIds,
  addTrigger,           // { laneId: string|null, counter: number }
  onTaskClick,          // (task, e) => void — e carries shiftKey for bulk select
  onAddTask,            // ({ workstreamId, title }) => void
  onTaskMove,           // (taskId, newWorkstreamId) => void
  onWorkstreamsReorder, // (newOrderedIds: string[]) => void
  onWorkstreamRename,   // (workstreamId, newName) => void
  onTaskTitleCommit,    // (taskId, newTitle) => void
  onTaskUpdate,         // (taskId, fields) => void
  onAddActivated,       // (workstreamId) => void
}) {
  const [dragCard, setDragCard]   = useState(null); // { taskId, fromWsId }
  const [dragColId, setDragColId] = useState(null);
  const [overColId, setOverColId] = useState(null);

  // ── Card DnD ────────────────────────────────────────────────────────────────
  function handleCardDragStart(task) {
    setDragCard({ taskId: task.id, fromWsId: task.workstream_id });
  }

  function handleCardDrop(targetWsId) {
    if (dragCard && dragCard.fromWsId !== targetWsId) {
      onTaskMove?.(dragCard.taskId, targetWsId);
    }
    setDragCard(null);
    setOverColId(null);
  }

  // ── Column DnD ───────────────────────────────────────────────────────────────
  function handleColDragStart(wsId) {
    setDragColId(wsId);
  }

  function handleColDrop(targetWsId) {
    if (dragColId && dragColId !== targetWsId) {
      const ids = workstreams.map(w => w.id).filter(id => id !== dragColId);
      const ti  = ids.indexOf(targetWsId);
      ids.splice(ti + 1, 0, dragColId);
      onWorkstreamsReorder?.(ids);
    }
    setDragColId(null);
    setOverColId(null);
  }

  // ── Shared ───────────────────────────────────────────────────────────────────
  function handleDragOver(e, wsId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColId(wsId);
  }

  function handleDragEnd() {
    setDragCard(null);
    setDragColId(null);
    setOverColId(null);
  }

  return (
    <div className="studio-board-scroll">
      <div className="studio-board-grid">
        {workstreams.map(ws => (
          <Lane
            key={ws.id}
            workstream={ws}
            tasks={tasks}
            songs={songs}
            allProfiles={allProfiles}
            filterQuery={filterQuery}
            selectedIds={selectedIds}
            onCardClick={onTaskClick}
            onAddTask={onAddTask}
            onRename={name => onWorkstreamRename?.(ws.id, name)}
            onTaskTitleCommit={onTaskTitleCommit}
            onTaskUpdate={onTaskUpdate}
            addTriggerPulse={addTrigger?.laneId === ws.id ? addTrigger.counter : 0}
            onAddActivated={onAddActivated}
            // card DnD
            draggingCardId={dragCard?.taskId ?? null}
            isDragOverCard={overColId === ws.id && !!dragCard}
            onCardDragStart={handleCardDragStart}
            onCardDrop={() => handleCardDrop(ws.id)}
            // column DnD
            isColumnDragging={dragColId === ws.id}
            showInsertAfter={!!dragColId && dragColId !== ws.id && overColId === ws.id}
            onColumnDragStart={() => handleColDragStart(ws.id)}
            onColumnDrop={() => handleColDrop(ws.id)}
            // shared
            onDragOver={e => handleDragOver(e, ws.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
