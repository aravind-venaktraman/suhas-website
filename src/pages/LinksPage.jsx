import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

// ── Icon components using original brand SVG files ───────────────────────────
const BrandIcon = ({ src, alt }) => (
  <img src={src} alt={alt} className="w-5 h-5 rounded-[4px]" />
);

const SpotifyIcon = () => <BrandIcon src="/images/spotify-icon.svg" alt="Spotify" />;
const AppleMusicIcon = () => <BrandIcon src="/images/applemusic-icon.svg" alt="Apple Music" />;
const YoutubeIcon = () => <BrandIcon src="/images/youtube-icon.svg" alt="YouTube" />;
const InstagramIcon = () => <BrandIcon src="/images/instagram-icon.svg" alt="Instagram" />;
const TikTokIcon = () => <BrandIcon src="/images/tiktok-icon.svg" alt="TikTok" />;

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

// ── Link data ─────────────────────────────────────────────────────────────────
const LINK_GROUPS = [
  {
    label: 'Website',
    links: [
      {
        title: 'suhasmusic.com',
        subtitle: 'Official website',
        href: 'https://suhasmusic.com',
        icon: <GlobeIcon />,
        accent: '#06b6d4',
      },
    ],
  },
  {
    label: 'Latest Release — Fractals',
    links: [
      {
        title: 'Listen on Spotify',
        subtitle: 'Fractals · Single',
        href: 'https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6?si=KcFSYSf9Q2SwzGrJjKejNg',
        icon: <SpotifyIcon />,
        accent: '#1DB954',
      },
      {
        title: 'Listen on Apple Music',
        subtitle: 'Fractals · Single',
        href: 'https://music.apple.com/us/album/fractals-single/1768715442',
        icon: <AppleMusicIcon />,
        accent: '#fc3c44',
      },
    ],
  },
  {
    label: 'Follow',
    links: [
      {
        title: 'Instagram',
        subtitle: '@suhas.als',
        href: 'https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr',
        icon: <InstagramIcon />,
        accent: '#E1306C',
      },
      {
        title: 'TikTok',
        subtitle: '@suhasmusicofficial',
        href: 'https://www.tiktok.com/@suhasmusicofficial',
        icon: <TikTokIcon />,
        accent: '#ffffff',
      },
      {
        title: 'YouTube',
        subtitle: '@Suhasmusicofficial',
        href: 'https://www.youtube.com/@Suhasmusicofficial',
        icon: <YoutubeIcon />,
        accent: '#FF0000',
      },
    ],
  },
  {
    label: 'All Music',
    links: [
      {
        title: 'Spotify',
        subtitle: 'Full discography',
        href: 'https://open.spotify.com/artist/7jrJXlWGH3Z1L3r7q4qY8K',
        icon: <SpotifyIcon />,
        accent: '#1DB954',
      },
      {
        title: 'Apple Music',
        subtitle: 'Full discography',
        href: 'https://music.apple.com/us/artist/suhas/1768715441',
        icon: <AppleMusicIcon />,
        accent: '#fc3c44',
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LinksPage() {
  useEffect(() => {
    document.title = 'Suhas — Links';
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
      className="relative flex flex-col items-center px-4 py-12 text-white overflow-x-hidden"
    >
      {/* ── Shards video background ── */}
      <div className="fixed inset-0" style={{ zIndex: 0, overflow: 'hidden' }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
          }}
        >
          <source src="/images/Shards_Video_Loop.webm" type="video/webm" />
        </video>
        {/* dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.5) 0%, rgba(9,9,11,0.25) 50%, rgba(9,9,11,0.65) 100%)' }}
        />
      </div>

      {/* ── Content (above video) ── */}
      <div className="relative flex flex-col items-center w-full" style={{ zIndex: 1 }}>
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <img
            src="/images/suhas.webp"
            alt="Suhas"
            loading="lazy"
            className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-lg"
            style={{ boxShadow: '0 0 32px rgba(6,182,212,0.25)' }}
          />
          <div className="text-center">
            <h1 className="text-2xl tracking-widest text-white" style={{ fontFamily: "'Michroma', sans-serif" }}>
              SUHAS
            </h1>
            <p className="text-white/50 text-xs tracking-widest mt-1 uppercase">Music · Artist</p>
          </div>
        </div>

        {/* Link groups */}
        <div className="w-full max-w-sm flex flex-col gap-8">
          {LINK_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase px-1 mb-1">
                {group.label}
              </p>
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; }}
                >
                  {/* Icon bubble */}
                  <span
                    className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                    style={{ background: `${link.accent}22`, color: link.accent }}
                  >
                    {link.icon}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white tracking-wide truncate">{link.title}</p>
                    <p className="text-xs text-white/40 tracking-wide truncate mt-0.5">{link.subtitle}</p>
                  </div>

                  {/* Arrow */}
                  <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <a
          href="/"
          className="mt-14 text-[10px] tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors uppercase"
        >
          suhasmusic.com
        </a>
      </div>
    </div>
  );
}
