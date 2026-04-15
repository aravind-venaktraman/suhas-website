import React, { useState, useEffect } from 'react';
import { ExternalLink, Link2, Check } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';
import useIsMobile from '../hooks/useIsMobile';

// ── Brand icons ──────────────────────────────────────────────────────────────
const BrandIcon = ({ src, alt }) => (
  <img src={src} alt={alt} className="w-6 h-6 rounded-[4px]" />
);

const SpotifyIcon = () => <BrandIcon src="/images/spotify-icon.svg" alt="Spotify" />;
const AppleMusicIcon = () => <BrandIcon src="/images/applemusic-icon.svg" alt="Apple Music" />;
const YoutubeIcon = () => <BrandIcon src="/images/youtube-icon.svg" alt="YouTube" />;

// ── Streaming links ──────────────────────────────────────────────────────────
const STREAM_LINKS = [
  {
    title: 'Spotify',
    href: 'https://open.spotify.com/album/6spsOE6k5yIjDihEc8ni6O?si=oJk1KLEpRyWNH0Tn_kRFqQ',
    icon: <SpotifyIcon />,
    accent: '#1DB954',
  },
  {
    title: 'Apple Music',
    href: 'https://music.apple.com/us/song/fractals-feat-ric-fierabracci-marco-minnemann/1886637157',
    icon: <AppleMusicIcon />,
    accent: '#fc3c44',
  },
  {
    title: 'YouTube Music',
    href: 'https://music.youtube.com/watch?v=RA1Zhh74EiM&si=qvOXb4jcIk_cQ9Zv',
    icon: <YoutubeIcon />,
    accent: '#FF0000',
  },
  {
    title: 'YouTube',
    subtitle: 'Video Premiere',
    href: 'https://www.youtube.com/watch?v=QAzLqs3s8ic',
    icon: <YoutubeIcon />,
    accent: '#FF0000',
  },
];

// ── Share button ─────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = 'https://suhasmusic.com/fractals';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fractals — Suhas', url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97]"
      style={{
        backdropFilter: 'blur(12px)',
        background: copied ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${copied ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: copied ? '#22d3ee' : 'rgba(255,255,255,0.6)',
      }}
    >
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      {copied ? 'Link Copied!' : 'Share'}
    </button>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FractalsPage() {
  const isMobile = useIsMobile();

  usePageMeta({
    path: '/fractals',
    title: 'Fractals — Suhas ft. Ric Fierabracci & Marco Minnemann',
    description: 'Stream Fractals by Suhas featuring Ric Fierabracci and Marco Minnemann on Spotify, Apple Music, and YouTube.',
    ogTitle: 'Fractals — Stream Now',
    ogDescription: 'Stream Fractals by Suhas ft. Ric Fierabracci & Marco Minnemann on all platforms.',
  });

  useEffect(() => {
    if (!document.querySelector('link[data-suhas-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Michroma&display=swap';
      link.dataset.suhasFonts = 'true';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div
      style={{ fontFamily: "'Michroma', sans-serif", background: '#09090b', minHeight: '100dvh' }}
      className="relative flex flex-col items-center justify-center px-4 text-white overflow-x-hidden"
    >
      {/* ── Video background ── */}
      <div className="fixed inset-0" style={{ zIndex: 0, overflow: 'hidden' }}>
        <video
          key={isMobile ? 'fractals-bg-mobile' : 'fractals-bg-desktop'}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          src={isMobile ? '/images/Fractals_BG_mobile.webm' : '/images/Fractals Video for Website BG.webm'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.4) 0%, rgba(9,9,11,0.2) 40%, rgba(9,9,11,0.7) 100%)' }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col items-center w-full max-w-md py-16" style={{ zIndex: 1 }}>
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
          FRACTALS
        </h1>
        <p className="text-white/50 text-xs tracking-[0.25em] uppercase mb-1">
          Suhas
        </p>
        <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-10">
          ft. Ric Fierabracci &amp; Marco Minnemann
        </p>

        {/* Stream links */}
        <div className="w-full flex flex-col gap-3">
          {STREAM_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98]"
              style={{
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${link.accent}18`; e.currentTarget.style.borderColor = `${link.accent}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {/* Icon */}
              <span
                className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0"
                style={{ background: `${link.accent}22`, color: link.accent }}
              >
                {link.icon}
              </span>

              {/* Label */}
              <span className="flex-1 text-sm text-white tracking-wide">
                {link.title}
              </span>

              {/* Arrow */}
              <span
                className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
                style={{ background: `${link.accent}22`, color: link.accent }}
              >
                Play
              </span>
            </a>
          ))}
        </div>

        {/* Share button */}
        <ShareButton />

        {/* Divider */}
        <div className="w-12 h-[1px] bg-white/10 my-6" />

        {/* Back to site */}
        <a
          href="/"
          className="text-[10px] tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors uppercase"
        >
          suhasmusic.com
        </a>
      </div>
    </div>
  );
}
