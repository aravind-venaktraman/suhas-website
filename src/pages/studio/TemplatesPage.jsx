import React, { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { listTemplates, getTemplateTasks } from '../../lib/studio/queries';
import { colors, fonts } from '../../components/studio/tokens';
import NewReleaseWizard from '../../components/studio/NewReleaseWizard';

export default function TemplatesPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [tasksByTemplate, setTasksByTemplate] = useState({});
  const [loading, setLoading] = useState(true);
  const [wizardTemplate, setWizardTemplate] = useState(null);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleExpand(templateId) {
    if (expanded === templateId) { setExpanded(null); return; }
    setExpanded(templateId);
    if (!tasksByTemplate[templateId]) {
      const tasks = await getTemplateTasks(templateId);
      setTasksByTemplate((prev) => ({ ...prev, [templateId]: tasks }));
    }
  }

  const WORKSTREAM_ORDER = ['Audio', 'Visuals', 'Marketing', 'Content', 'Admin'];

  return (
    <div className="px-5 md:px-8 py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p
            className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1"
            style={{ color: colors.textDim, fontFamily: fonts.display }}
          >
            Playbooks
          </p>
          <h1
            className="text-[22px] md:text-[28px] font-black uppercase tracking-tight leading-none"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Templates
          </h1>
        </div>
        <button
          onClick={() => setWizardTemplate(templates[0] ?? null)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
            color: '#09090B',
            fontFamily: fonts.display,
          }}
        >
          <Plus size={13} /> New release
        </button>
      </div>

      {loading && (
        <p className="text-[11px]" style={{ color: colors.textDim }}>Loading templates...</p>
      )}

      {!loading && templates.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center flex flex-col items-center gap-4"
          style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <BookOpen size={32} style={{ color: colors.textDim }} />
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-widest mb-1"
              style={{ color: colors.textMuted, fontFamily: fonts.display }}
            >
              No templates yet
            </p>
            <p className="text-[12px]" style={{ color: colors.textDim }}>
              Templates are created from completed releases via retrospectives.
              After your first release, you can save it as a playbook here.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {templates.map((template) => {
          const tasks = tasksByTemplate[template.id] ?? [];
          const isOpen = expanded === template.id;

          const grouped = WORKSTREAM_ORDER.reduce((acc, ws) => {
            const wsTasks = tasks.filter((t) => t.workstream_name === ws);
            if (wsTasks.length > 0) acc[ws] = wsTasks;
            return acc;
          }, {});

          return (
            <div
              key={template.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <button
                onClick={() => handleExpand(template.id)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-all hover:bg-white/[0.02]"
              >
                <div>
                  <p
                    className="text-[13px] font-bold uppercase tracking-wide"
                    style={{ color: colors.textPrimary, fontFamily: fonts.display }}
                  >
                    {template.name}
                  </p>
                  {template.description && (
                    <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {template.duration_days && (
                      <span className="text-[10px]" style={{ color: colors.textDim }}>
                        {template.duration_days}-day playbook
                      </span>
                    )}
                    {template.source_release_id && (
                      <span className="text-[10px]" style={{ color: colors.textDim }}>
                        Derived from a past release
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWizardTemplate(template);
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
                      color: '#09090B',
                      fontFamily: fonts.display,
                    }}
                  >
                    Use
                  </button>
                  <span
                    className="text-[11px] transition-transform"
                    style={{
                      color: colors.textDim,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}
                  >
                    ▾
                  </span>
                </div>
              </button>

              {isOpen && (
                <div
                  className="px-6 pb-6 pt-2 border-t"
                  style={{ borderColor: colors.border }}
                >
                  {tasks.length === 0 && (
                    <p className="text-[11px]" style={{ color: colors.textDim }}>Loading tasks...</p>
                  )}
                  {Object.entries(grouped).map(([wsName, wsTasks]) => (
                    <div key={wsName} className="mb-5">
                      <p
                        className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2"
                        style={{ color: colors.textDim, fontFamily: fonts.display }}
                      >
                        {wsName}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {wsTasks.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-start justify-between gap-3"
                            style={{ opacity: t.excluded_by_default ? 0.45 : 1 }}
                          >
                            <p
                              className="text-[12px] flex-1"
                              style={{
                                color: colors.textSecondary,
                                textDecoration: t.excluded_by_default ? 'line-through' : 'none',
                                fontFamily: fonts.body,
                              }}
                            >
                              {t.title}
                              {t.warning_note && (
                                <span className="ml-2 text-[10px]" style={{ color: colors.amber }}>
                                  ⚠ {t.warning_note}
                                </span>
                              )}
                            </p>
                            <span
                              className="text-[10px] shrink-0 tabular-nums"
                              style={{ color: colors.textDim }}
                            >
                              {t.days_before_release}d before
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {wizardTemplate && (
        <NewReleaseWizard
          template={wizardTemplate}
          onClose={() => setWizardTemplate(null)}
          onCreated={(releaseId) => navigate(`/studio/release/${releaseId}`)}
        />
      )}
    </div>
  );
}
