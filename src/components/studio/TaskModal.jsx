import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Send, CheckCircle, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { colors, statusMeta, priorityMeta, fonts } from './tokens';
import Comment from './Comment';
import AvatarMini from './AvatarMini';
import WorkstreamPill from './WorkstreamPill';
import SongPill from './SongPill';
import { listComments, listTaskAttachments, getAttachmentUrl } from '../../lib/studio/queries';
import {
  addComment,
  markComplete,
  reopenTask,
  markBlocked,
  updateTask,
  deleteTask,
  uploadAttachment,
} from '../../lib/studio/mutations';

// Studio users Arav and Suhas are the known assignees; externals (Ric, Marco, etc.) are plain text
const KNOWN_ASSIGNEES = ['Arav', 'Suhas'];

export default function TaskModal({
  task: initialTask,
  workstream,
  song,
  songs = [],
  releaseId,
  user,            // Supabase auth user
  userProfile,     // current user's profile row
  allProfiles = [], // all studio profiles for assignee autocomplete
  onClose,
  onTaskUpdate,
}) {
  const [task, setTask] = useState(initialTask);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blockedReason, setBlockedReason] = useState(task.blocked_reason || '');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editDue, setEditDue] = useState(task.due_date || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'normal');
  // Assignee input: display_name for known users, plain text for externals
  const [editAssignee, setEditAssignee] = useState(
    task.assignee?.display_name ?? task.external_assignee ?? ''
  );
  const fileInputRef = useRef(null);
  const commentEndRef = useRef(null);

  useEffect(() => {
    listComments(task.id).then(setComments).catch(console.error);
    listTaskAttachments(task.id).then(setAttachments).catch(console.error);
  }, [task.id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const refresh = (updated) => {
    setTask(updated);
    onTaskUpdate?.(updated);
  };

  async function handleComplete() {
    try {
      setError('');
      const updated = await markComplete({ id: task.id, releaseId, actorId: user.id });
      refresh(updated);
    } catch (e) { setError(e.message); }
  }

  async function handleReopen() {
    try {
      setError('');
      const updated = await reopenTask({ id: task.id, releaseId, actorId: user.id });
      refresh(updated);
    } catch (e) { setError(e.message); }
  }

  async function handleBlock() {
    try {
      setError('');
      const updated = await markBlocked({ id: task.id, releaseId, actorId: user.id, blockedReason });
      refresh(updated);
      setShowBlockForm(false);
    } catch (e) { setError(e.message); }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setPosting(true);
    try {
      const c = await addComment({ taskId: task.id, releaseId, actorId: user.id, body: commentBody.trim() });
      // Attach the current user's profile so Comment renders correctly without refetching
      setComments((prev) => [...prev, { ...c, author: userProfile }]);
      setCommentBody('');
    } catch (e) { setError(e.message); }
    setPosting(false);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const att = await uploadAttachment({ taskId: task.id, releaseId, actorId: user.id, file });
      setAttachments((prev) => [...prev, att]);
    } catch (e) { setError(e.message); }
    setUploading(false);
    e.target.value = '';
  }

  async function handleSaveEdit() {
    try {
      setError('');
      // Resolve the assignee text to a profile ID or external text
      const matchedProfile = allProfiles.find(
        (p) => p.display_name.toLowerCase() === editAssignee.toLowerCase()
      );
      const fields = {
        title: editTitle.trim() || task.title,
        description: editDesc.trim() || null,
        due_date: editDue || null,
        priority: editPriority,
        assignee_id: matchedProfile?.id ?? null,
        external_assignee: !matchedProfile && editAssignee.trim() ? editAssignee.trim() : null,
      };
      const updated = await updateTask({ id: task.id, releaseId, actorId: user.id, ...fields });
      // Re-attach the matched profile so the UI reflects the change immediately
      refresh({ ...updated, assignee: matchedProfile ?? null });
      setEditing(false);
    } catch (e) { setError(e.message); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await deleteTask({ id: task.id, releaseId, actorId: user.id, title: task.title });
      onTaskUpdate?.(null, task.id);
      onClose();
    } catch (e) { setError(e.message); }
  }

  const status = statusMeta[task.status] ?? statusMeta.not_started;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: colors.bgCardSolid, border: `1px solid ${colors.border}` }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)' }}
        />

        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-transparent text-[15px] font-bold outline-none border-b pb-1"
                style={{ color: colors.textPrimary, borderColor: colors.cyan + '60', fontFamily: fonts.body }}
                autoFocus
              />
            ) : (
              <h2
                className={`text-[15px] font-bold leading-snug ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
                style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              >
                {task.title}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className="inline-flex items-center gap-1 rounded-full text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
                style={{ background: `${status.color}18`, border: `1px solid ${status.color}40`, color: status.color, fontFamily: fonts.display }}
              >
                {status.label}
              </span>
              {workstream && <WorkstreamPill name={workstream.name} color={workstream.color} size="xs" />}
              {song && <SongPill trackNumber={song.track_number} title={song.title} />}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
              style={{ color: colors.textMuted, border: `1px solid ${colors.border}`, background: 'transparent', fontFamily: fonts.display }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={onClose} style={{ color: colors.textDim }} className="hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 flex flex-col gap-5">

            {error && (
              <p className="text-[11px] px-3 py-2 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: colors.red }}>
                {error}
              </p>
            )}

            {/* ── Edit form ── */}
            {editing && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="modal-label">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    placeholder="Add details..."
                    className="w-full rounded-lg px-3 py-2 text-[12px] mt-1 resize-none outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="modal-label">Due date</label>
                    <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-[12px] mt-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body, colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="modal-label">Priority</label>
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-[12px] mt-1 outline-none"
                      style={{ background: colors.bgCardSolid, border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body }}>
                      {Object.entries(priorityMeta).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="modal-label">Assignee</label>
                  <input
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    placeholder="Arav, Suhas, Ric, Marco..."
                    list="studio-assignees"
                    className="w-full rounded-lg px-3 py-2 text-[12px] mt-1 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body }}
                  />
                  <datalist id="studio-assignees">
                    {allProfiles.map((p) => <option key={p.id} value={p.display_name} />)}
                    <option value="Ric Fierabracci" />
                    <option value="Marco Minnemann" />
                  </datalist>
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="self-start px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #22D3EE)', color: '#09090B', fontFamily: fonts.display }}
                >
                  Save changes
                </button>
              </div>
            )}

            {/* ── Description (read mode) ── */}
            {!editing && task.description && (
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: colors.textMuted }}>
                {task.description}
              </p>
            )}

            {/* ── Meta row ── */}
            {!editing && (
              <div className="flex flex-wrap gap-4 text-[11px]" style={{ color: colors.textDim }}>
                {task.due_date && (
                  <span>Due: <span style={{ color: colors.textMuted }}>
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span></span>
                )}
                {task.priority && task.priority !== 'normal' && (
                  <span>Priority: <span style={{ color: priorityMeta[task.priority]?.color }}>
                    {priorityMeta[task.priority]?.label}
                  </span></span>
                )}
                {task.assignee && (
                  <span className="flex items-center gap-1.5">
                    Assignee:
                    <AvatarMini profile={task.assignee} size={16} />
                    <span style={{ color: colors.textMuted }}>{task.assignee.display_name}</span>
                  </span>
                )}
                {!task.assignee && task.external_assignee && (
                  <span>Assignee: <span style={{ color: colors.textMuted }}>{task.external_assignee}</span></span>
                )}
              </div>
            )}

            {/* ── Blocked reason ── */}
            {task.status === 'blocked' && task.blocked_reason && (
              <div className="rounded-xl px-4 py-3 text-[11px]"
                style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', color: colors.red }}>
                <strong>Blocked:</strong> {task.blocked_reason}
              </div>
            )}

            {/* ── Actions ── */}
            {!editing && (
              <div className="flex flex-wrap gap-2">
                {task.status !== 'done' && (
                  <button onClick={handleComplete}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ADE80', fontFamily: fonts.display }}>
                    <CheckCircle size={12} /> Mark complete
                  </button>
                )}
                {task.status === 'done' && (
                  <button onClick={handleReopen}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: colors.amber, fontFamily: fonts.display }}>
                    <RotateCcw size={12} /> Reopen
                  </button>
                )}
                {task.status !== 'blocked' && task.status !== 'done' && (
                  <button onClick={() => setShowBlockForm((v) => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: colors.red, fontFamily: fonts.display }}>
                    <AlertCircle size={12} /> Mark blocked
                  </button>
                )}
                <button onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110 ml-auto"
                  style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textDim, fontFamily: fonts.display }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}

            {/* ── Block form ── */}
            {showBlockForm && (
              <div className="flex gap-2">
                <input
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="Why is it blocked?"
                  className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(248,113,113,0.4)', color: colors.textSecondary, fontFamily: fonts.body }}
                />
                <button onClick={handleBlock}
                  className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(248,113,113,0.15)', color: colors.red, fontFamily: fonts.display }}>
                  Confirm
                </button>
              </div>
            )}

            {/* ── Attachments ── */}
            {attachments.length > 0 && (
              <div>
                <p className="modal-label mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <a key={att.id} href={getAttachmentUrl(att.storage_path)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition-all hover:brightness-110"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.cyanDim, fontFamily: fonts.body }}>
                      <Paperclip size={11} /> {att.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Comments ── */}
            <div>
              <p className="modal-label mb-3">Comments</p>
              <div className="flex flex-col gap-4">
                {comments.map((c) => (
                  <Comment key={c.id} comment={c} viewerProfile={userProfile} />
                ))}
                <div ref={commentEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Comment input footer */}
        <div className="px-6 py-4 flex gap-2 items-end" style={{ borderTop: `1px solid ${colors.border}` }}>
          {userProfile && <AvatarMini profile={userProfile} size={24} />}
          <form onSubmit={handleComment} className="flex-1 flex gap-2 items-end">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e); } }}
              rows={1}
              placeholder="Add a comment... (Enter to post)"
              className="flex-1 rounded-xl px-3 py-2 text-[12px] resize-none outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontFamily: fonts.body, minHeight: 38 }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: colors.textDim, border: `1px solid ${colors.border}` }} title="Attach file">
              <Paperclip size={16} />
            </button>
            <button type="submit" disabled={posting || !commentBody.trim()}
              className="p-2 rounded-xl transition-all"
              style={{
                background: commentBody.trim() ? 'linear-gradient(135deg, #6366F1, #22D3EE)' : 'rgba(255,255,255,0.04)',
                color: commentBody.trim() ? '#09090B' : colors.textDim,
                border: `1px solid ${colors.border}`,
              }}>
              <Send size={16} />
            </button>
          </form>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <style>{`
        .modal-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: ${colors.textDim};
          font-family: 'Michroma', sans-serif;
        }
      `}</style>
    </div>
  );
}
