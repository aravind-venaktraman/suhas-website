import React, { useState, useEffect } from 'react';
import { X, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { colors, fonts } from './tokens';
import { listTemplates, getTemplateTasks } from '../../lib/studio/queries';
import { createRelease } from '../../lib/studio/mutations';
import { isSunday } from '../../lib/studio/analytics';

const RELEASE_TYPES = [
  { value: 'single', label: 'Single', desc: '1 track' },
  { value: 'ep', label: 'EP', desc: '2-6 tracks' },
  { value: 'album', label: 'Album', desc: '7+ tracks' },
];

export default function NewReleaseWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1: details, 2: preview, 3: success
  const [title, setTitle] = useState('');
  const [type, setType] = useState('single');
  const [targetDate, setTargetDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateTasks, setTemplateTasks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdRelease, setCreatedRelease] = useState(null);

  useEffect(() => {
    listTemplates().then(setTemplates).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      getTemplateTasks(selectedTemplateId).then(setTemplateTasks).catch(console.error);
    } else {
      setTemplateTasks([]);
    }
  }, [selectedTemplateId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const sundayWarning = targetDate && isSunday(targetDate);

  async function handleCreate() {
    if (!title.trim()) { setError('Release title is required.'); return; }
    setCreating(true);
    setError('');
    try {
      const release = await createRelease({
        title: title.trim(),
        type,
        targetDate: targetDate || null,
        templateId: selectedTemplateId,
      });
      setCreatedRelease(release);
      setStep(3);
    } catch (e) {
      setError(e.message);
    }
    setCreating(false);
  }

  const groupedTasks = templateTasks.reduce((acc, t) => {
    if (!acc[t.workstream_name]) acc[t.workstream_name] = [];
    acc[t.workstream_name].push(t);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: colors.bgCardSolid,
          border: `1px solid ${colors.border}`,
          maxHeight: '90vh',
        }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)' }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1"
              style={{ color: colors.textDim, fontFamily: fonts.display }}
            >
              {step === 1 ? 'Step 1 of 2' : step === 2 ? 'Step 2 of 2' : 'Done'}
            </p>
            <h2
              className="text-[15px] font-bold"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              {step === 1 && 'New release'}
              {step === 2 && 'Preview tasks'}
              {step === 3 && 'Release created'}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: colors.textDim }} className="hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ─── Step 1: Details ─── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="wiz-label">Release title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fractals Vol. 2"
                  autoFocus
                  className="wiz-input"
                />
              </div>

              <div>
                <label className="wiz-label">Type</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {RELEASE_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setType(rt.value)}
                      className="rounded-xl p-3 text-left transition-all"
                      style={{
                        background: type === rt.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${type === rt.value ? colors.indigo + '70' : colors.border}`,
                      }}
                    >
                      <p
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: type === rt.value ? colors.indigoDim : colors.textMuted, fontFamily: fonts.display }}
                      >
                        {rt.label}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="wiz-label">Target release date (optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="wiz-input"
                  style={{ colorScheme: 'dark' }}
                />
                {sundayWarning && (
                  <div
                    className="flex items-start gap-2 mt-2 rounded-lg px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: colors.amber,
                    }}
                  >
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    Sunday releases are generally avoided. Consider shifting to Saturday.
                  </div>
                )}
              </div>

              <div>
                <label className="wiz-label">Template (optional)</label>
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    onClick={() => setSelectedTemplateId(null)}
                    className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                    style={{
                      background: selectedTemplateId === null ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedTemplateId === null ? colors.indigo + '60' : colors.border}`,
                    }}
                  >
                    <span className="text-[11px]" style={{ color: colors.textMuted }}>Blank (no template)</span>
                  </button>
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className="flex flex-col rounded-xl p-3 text-left transition-all"
                      style={{
                        background: selectedTemplateId === t.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedTemplateId === t.id ? colors.indigo + '60' : colors.border}`,
                      }}
                    >
                      <span className="text-[11px] font-bold" style={{ color: colors.textSecondary, fontFamily: fonts.display }}>{t.name}</span>
                      {t.description && (
                        <span className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>{t.description}</span>
                      )}
                      {t.duration_days && (
                        <span className="text-[10px]" style={{ color: colors.textDim }}>{t.duration_days}-day playbook</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-[11px]" style={{ color: colors.red }}>{error}</p>
              )}
            </div>
          )}

          {/* ─── Step 2: Preview ─── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}` }}
              >
                <p className="text-[10px] mb-1" style={{ color: colors.textDim, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Summary</p>
                <p className="text-[14px] font-bold" style={{ color: colors.textPrimary, fontFamily: fonts.display }}>{title}</p>
                <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {targetDate && ` — target ${new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                </p>
              </div>

              {templateTasks.length > 0 ? (
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3"
                    style={{ color: colors.textDim, fontFamily: fonts.display }}
                  >
                    Tasks to be created ({templateTasks.filter((t) => !t.excluded_by_default).length} active, {templateTasks.filter((t) => t.excluded_by_default).length} excluded)
                  </p>
                  {Object.entries(groupedTasks).map(([wsName, wsTasks]) => (
                    <div key={wsName} className="mb-4">
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: colors.textMuted, fontFamily: fonts.display }}
                      >
                        {wsName}
                      </p>
                      {wsTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-col py-2 border-b"
                          style={{ borderColor: colors.border, opacity: t.excluded_by_default ? 0.45 : 1 }}
                        >
                          <p
                            className="text-[12px]"
                            style={{
                              color: colors.textSecondary,
                              textDecoration: t.excluded_by_default ? 'line-through' : 'none',
                              fontFamily: fonts.body,
                            }}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px]" style={{ color: colors.textDim }}>
                              {t.days_before_release}d before release
                              {targetDate && (() => {
                                const due = new Date(targetDate);
                                due.setDate(due.getDate() - t.days_before_release);
                                if (due.getDay() === 0) due.setDate(due.getDate() - 1);
                                return ` (${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
                              })()}
                            </span>
                            {t.excluded_by_default && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-widest"
                                style={{ color: colors.textDim }}
                              >
                                excluded
                              </span>
                            )}
                          </div>
                          {t.warning_note && !t.excluded_by_default && (
                            <div
                              className="flex items-center gap-1.5 mt-1 text-[10px]"
                              style={{ color: colors.amber }}
                            >
                              <AlertTriangle size={11} />
                              {t.warning_note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: colors.textDim }}>
                  Blank release. You can add tasks manually from the board.
                </p>
              )}

              <p className="text-[11px]" style={{ color: colors.textDim }}>
                5 workstreams (Audio, Visuals, Marketing, Content, Admin) and 8 checklist items will also be created automatically.
              </p>

              {error && (
                <p className="text-[11px]" style={{ color: colors.red }}>{error}</p>
              )}
            </div>
          )}

          {/* ─── Step 3: Success ─── */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <CheckCircle size={40} style={{ color: '#4ADE80' }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: colors.textPrimary, fontFamily: fonts.display }}>
                  {createdRelease?.title} is live
                </p>
                <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
                  Board, checklist, and workstreams are ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div
          className="flex justify-between items-center gap-3 px-6 py-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all"
                style={{ color: colors.textDim, border: `1px solid ${colors.border}`, fontFamily: fonts.display }}
              >
                Cancel
              </button>
              <button
                onClick={() => { if (!title.trim()) { setError('Release title is required.'); return; } setError(''); setStep(2); }}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #6366F1, #22D3EE)', color: '#09090B', fontFamily: fonts.display }}
              >
                Preview <ChevronRight size={14} />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all"
                style={{ color: colors.textDim, border: `1px solid ${colors.border}`, fontFamily: fonts.display }}
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366F1, #22D3EE)', color: '#09090B', fontFamily: fonts.display }}
              >
                {creating ? 'Creating...' : 'Create release'}
              </button>
            </>
          )}
          {step === 3 && (
            <button
              onClick={() => { onCreated?.(createdRelease); onClose(); }}
              className="w-full text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #6366F1, #22D3EE)', color: '#09090B', fontFamily: fonts.display }}
            >
              Open board
            </button>
          )}
        </div>
      </div>

      <style>{`
        .wiz-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: ${colors.textDim};
          font-family: 'Michroma', sans-serif;
          margin-bottom: 4px;
        }
        .wiz-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid ${colors.border};
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          color: ${colors.textSecondary};
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .wiz-input:focus {
          border-color: ${colors.cyan}60;
        }
      `}</style>
    </div>
  );
}
