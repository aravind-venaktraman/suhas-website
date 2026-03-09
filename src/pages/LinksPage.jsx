import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.048-2.31-2.07-3.03a6.28 6.28 0 00-1.977-.842c-.69-.168-1.39-.24-2.096-.268-.97-.045-1.274-.06-3.73-.06s-2.76.015-3.73.06c-.706.028-1.405.1-2.096.268-.996.236-1.96.75-2.705 1.52C4.44 2.67 3.77 3.76 3.55 4.95c-.163.848-.216 1.71-.226 2.563-.014.972-.018 1.275-.018 3.73s.004 2.76.018 3.73c.01.854.063 1.715.227 2.563.22 1.19.89 2.28 1.797 3.052.745.77 1.71 1.284 2.705 1.52.69.168 1.39.24 2.096.268.97.045 1.274.06 3.73.06s2.76-.015 3.73-.06c.706-.028 1.405-.1 2.096-.268 1.996-.47 3.577-2.05 4.048-4.046.163-.848.216-1.71.226-2.563.014-.97.018-1.274.018-3.73s-.004-2.758-.018-3.73zm-2.15 7.374c-.007.658-.06 1.315-.17 1.963-.27 1.388-1.356 2.474-2.743 2.743-.65.11-1.305.163-1.963.17-.965.044-1.258.057-3.716.057s-2.75-.013-3.716-.057c-.658-.007-1.315-.06-1.963-.17-1.388-.27-2.474-1.355-2.743-2.743-.11-.648-.163-1.305-.17-1.963-.044-.965-.057-1.258-.057-3.716s.013-2.75.057-3.716c.007-.658.06-1.315.17-1.963.27-1.388 1.355-2.474 2.743-2.743.648-.11 1.305-.163 1.963-.17.966-.044 1.258-.057 3.716-.057s2.75.013 3.716.057c.658.007 1.315.06 1.963.17 1.387.27 2.473 1.355 2.743 2.743.11.648.163 1.305.17 1.963.044.966.057 1.258.057 3.716s-.013 2.75-.057 3.716zM12 6.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

// ── Link data ─────────────────────────────────────────────────────────────────
const LINK_GROUPS = [
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
        title: 'YouTube',
        subtitle: '@Suhasmusicofficial',
        href: 'https://www.youtube.com/@Suhasmusicofficial',
        icon: <YoutubeIcon />,
        accent: '#FF0000',
      },
      {
        title: 'Instagram',
        subtitle: '@suhas.als',
        href: 'https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr',
        icon: <InstagramIcon />,
        accent: '#E1306C',
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
      className="flex flex-col items-center px-4 py-12 text-white"
    >
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <img
          src="/images/suhas.png"
          alt="Suhas"
          className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700 shadow-lg"
          style={{ boxShadow: '0 0 24px rgba(6,182,212,0.18)' }}
        />
        <div className="text-center">
          <h1 className="text-2xl tracking-widest text-white" style={{ fontFamily: "'Michroma', sans-serif" }}>
            SUHAS
          </h1>
          <p className="text-zinc-400 text-xs tracking-widest mt-1 uppercase">Music · Artist</p>
        </div>
      </div>

      {/* Link groups */}
      <div className="w-full max-w-sm flex flex-col gap-8">
        {LINK_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase px-1 mb-1">
              {group.label}
            </p>
            {group.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/80 active:scale-[0.98]"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                {/* Icon bubble */}
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors duration-200"
                  style={{ background: `${link.accent}18`, color: link.accent }}
                >
                  {link.icon}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white tracking-wide truncate">{link.title}</p>
                  <p className="text-xs text-zinc-500 tracking-wide truncate mt-0.5">{link.subtitle}</p>
                </div>

                {/* Arrow */}
                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <a
        href="/"
        className="mt-14 text-[10px] tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors uppercase"
      >
        suhasmusic.com
      </a>
    </div>
  );
}
