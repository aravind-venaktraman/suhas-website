import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudioAuth } from '../../lib/studio/auth';
import { colors, fonts } from '../../components/studio/tokens';

export default function LoginPage() {
  const { user, loading, unauthorized, login } = useStudioAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load Inter font
  useEffect(() => {
    if (document.querySelector('link[data-studio-inter]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.dataset.studioInter = 'true';
    document.head.appendChild(link);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) navigate('/studio', { replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  if (loading) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: colors.bg, fontFamily: fonts.body }}
    >
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <img
          src="/images/suhas-productions-new-logo.webp"
          alt="SUHAS"
          className="h-16 w-auto"
        />
        <div className="flex items-center gap-2">
          <div className="w-5 h-px" style={{ background: colors.cyan + '60' }} />
          <p
            className="text-[9px] font-bold uppercase tracking-[0.3em]"
            style={{ color: colors.textDim, fontFamily: fonts.display }}
          >
            Studio
          </p>
          <div className="w-5 h-px" style={{ background: colors.cyan + '60' }} />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)' }}
        />

        {unauthorized ? (
          <div className="text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: colors.red, fontFamily: fonts.display }}
            >
              Access denied
            </p>
            <p className="text-[12px]" style={{ color: colors.textDim }}>
              That email is not authorized for Studio.
            </p>
          </div>
        ) : sent ? (
          <div className="text-center flex flex-col gap-3">
            <p
              className="text-[28px]"
              style={{ lineHeight: 1 }}
            >
              ✉
            </p>
            <p
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ color: colors.textSecondary, fontFamily: fonts.display }}
            >
              Check your inbox
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: colors.textDim }}>
              Magic link sent to <span style={{ color: colors.cyan }}>{email}</span>.
              Click it to sign in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors"
              style={{ color: colors.textDim, fontFamily: fonts.display }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h1
                className="text-[14px] font-bold uppercase tracking-widest mb-1"
                style={{ color: colors.textPrimary, fontFamily: fonts.display }}
              >
                Sign in
              </h1>
              <p className="text-[11px]" style={{ color: colors.textDim }}>
                Restricted to authorized team members.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[9px] font-bold uppercase tracking-[0.15em]"
                style={{ color: colors.textDim, fontFamily: fonts.display }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@suhasmusic.com"
                required
                autoFocus
                className="rounded-xl px-4 py-3 text-[13px] outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary,
                  fontFamily: fonts.body,
                }}
                onFocus={(e) => (e.target.style.borderColor = colors.cyan + '60')}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
            </div>

            {error && (
              <p
                className="text-[11px] px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: colors.red,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="rounded-full py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:brightness-110 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
                color: '#09090B',
                fontFamily: fonts.display,
              }}
            >
              {submitting ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>

      <p
        className="mt-8 text-[10px] uppercase tracking-widest"
        style={{ color: colors.textDim, fontFamily: fonts.display }}
      >
        Suhas Studio &mdash; Internal only
      </p>
    </div>
  );
}
