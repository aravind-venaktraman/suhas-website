import React, { useState } from 'react';
import './Board.css';
import Lane from './Lane';

/**
 * Board
 *
 * Owns all drag-and-drop state so Lane / TaskCard stay stateless about DnD.
 *
 * Drag types (communicated via dataTransfer so browser ghost images work):
 *   'card'   – a TaskCard is being dragged between lanes
 *   'column' – a Lane header is being dragged to reorder columns
 */
export default function Board({
  workstreams = [],
  tasks = [],
  songs = [],
  onTaskClick,
  onAddTask,
  onTaskMove,            // (taskId, newWorkstreamId) => void
  onWorkstreamsReorder,  // (newOrderedIds: string[]) => void
  onWorkstreamRename,    // (workstreamId, newName) => void
}) {
  // Which task card is currently being dragged
  const [dragCard, setDragCard] = useState(null); // { taskId, fromWsId }
  // Which column is being dragged
  const [dragColId, setDragColId] = useState(null);
  // Which column the pointer is currently over
  const [overColId, setOverColId] = useState(null);

  // ── Card handlers ──────────────────────────────────────────────────────────
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

  // ── Column handlers ────────────────────────────────────────────────────────
  function handleColDragStart(wsId) {
    setDragColId(wsId);
  }

  function handleColDrop(targetWsId) {
    if (dragColId && dragColId !== targetWsId) {
      // Insert dragCol *after* the target in the current order
      const ids = workstreams.map((w) => w.id).filter((id) => id !== dragColId);
      const ti  = ids.indexOf(targetWsId);
      ids.splice(ti + 1, 0, dragColId);
      onWorkstreamsReorder?.(ids);
    }
    setDragColId(null);
    setOverColId(null);
  }

  // ── Shared ─────────────────────────────────────────────────────────────────
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
        {workstreams.map((ws) => (
          <Lane
            key={ws.id}
            workstream={ws}
            tasks={tasks}
            songs={songs}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            onRename={(name) => onWorkstreamRename?.(ws.id, name)}
            // card DnD
            draggingCardId={dragCard?.taskId ?? null}
            isDragOverCard={overColId === ws.id && !!dragCard}
            onCardDragStart={handleCardDragStart}
            onCardDrop={() => handleCardDrop(ws.id)}
            // column DnD
            isColumnDragging={dragColId === ws.id}
            showInsertAfter={
              !!dragColId &&
              dragColId !== ws.id &&
              overColId === ws.id
            }
            onColumnDragStart={() => handleColDragStart(ws.id)}
            onColumnDrop={() => handleColDrop(ws.id)}
            // shared
            onDragOver={(e) => handleDragOver(e, ws.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
