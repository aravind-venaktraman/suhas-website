import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const michroma = () => ({ fontFamily: "'Michroma', sans-serif" });

function MusicianCard({ name, role, imgSrc, bio }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="aspect-[4/3] bg-zinc-900 flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="text-center">
            <span className="text-zinc-600 text-xs uppercase tracking-widest">Photo Coming Soon</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-white text-xl font-bold" style={michroma()}>{name}</h4>
          <span className="text-cyan-400 text-xs uppercase tracking-wider font-bold">{role}</span>
        </div>
        <p className="text-zinc-400 text-base leading-relaxed font-light">{bio}</p>
      </div>
    </div>
  );
}

export default function MusicSection({ appleMusicLink, spotifyLink, youtubeLink }) {
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  const marcoBgRef = useRef(null);
  const shardsBgRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobileLayout(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    [marcoBgRef, shardsBgRef].forEach((ref) => {
      if (ref.current) {
        ref.current.muted = true;
        ref.current.play().catch(() => {});
      }
    });
  }, []);

  const streamLinks = [
    {
      href: appleMusicLink,
      label: 'Apple Music',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
          <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208A6.19 6.19 0 0 0 .05 5.05C.019 5.4.006 5.75 0 6.1v11.8c.015.395.04.79.1 1.18.2 1.183.7 2.17 1.56 2.963.86.792 1.89 1.253 3.04 1.4.57.073 1.15.1 1.72.108.29.006.575.006.862.003h10.516c.418 0 .83-.02 1.248-.06 1.044-.1 1.973-.46 2.76-1.13.787-.67 1.308-1.52 1.55-2.51.148-.62.19-1.253.2-1.89.004-.28.004-.558.004-.837V6.1c0-.7.004-1.4 0-2.1l-.006.124zM14.954 2.403h-5.9l.006-.003.003-.005h5.89c.002.008.001.008.001.008zm2.766 7.8c-.01.015-.016.033-.02.05-.14.407-.347.78-.61 1.117-.21.27-.46.496-.75.682-.46.287-.98.42-1.524.393-.41-.02-.793-.14-1.148-.34a3.17 3.17 0 0 1-.924-.797c-.228-.29-.41-.608-.545-.956-.14-.36-.215-.74-.22-1.13-.005-.413.065-.81.21-1.19.165-.42.4-.79.71-1.11.365-.375.797-.62 1.296-.735.335-.077.675-.083 1.01-.013.56.115 1.025.4 1.39.845.28.35.47.75.565 1.19.065.31.087.625.07.935-.01.025-.01.026-.01.053zm-6.81-.375c-.06-.19-.12-.38-.19-.57-.58-1.58-1.16-3.17-1.74-4.75-.02-.058-.04-.116-.07-.172-.05-.1-.12-.15-.235-.15H7.61c-.12 0-.21.05-.268.17-.037.08-.048.16-.028.245l.05.16c.65 1.77 1.3 3.55 1.95 5.32.07.19.15.38.22.57.05.14.14.215.29.215h1.063c.15 0 .24-.07.29-.215zm4.4 4.25c-.15.39-.36.75-.65 1.06-.45.49-1.01.8-1.67.93-.46.09-.93.09-1.39 0-.98-.2-1.75-.7-2.31-1.54-.37-.55-.58-1.17-.6-1.84-.02-.32.01-.64.09-.95.18-.74.56-1.36 1.12-1.86.19-.17.4-.31.63-.43-.64-.03-1.24.12-1.79.43a4.02 4.02 0 0 0-1.62 1.73c-.26.55-.38 1.13-.37 1.73.02.97.34 1.83.95 2.57.62.74 1.4 1.22 2.33 1.42.6.13 1.21.12 1.81-.01 1.12-.25 1.99-.86 2.6-1.81.31-.48.5-1.01.55-1.57.01-.1.01-.2.01-.3.02-.06.02-.13.02-.2.02-.37-.03-.73-.13-1.08-.01-.05-.03-.1-.04-.15a4.27 4.27 0 0 1-.55.87z" />
        </svg>
      ),
    },
    {
      href: spotifyLink,
      label: 'Spotify',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      ),
    },
    {
      href: youtubeLink,
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative bg-black">

      {/* ═══════════════════════════════════════════════════════════════════
          PART 1: Landing Hero — marco.mp4 background
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative min-h-screen overflow-hidden">
        {/* marco.mp4 video background */}
        <video
          ref={marcoBgRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.4 }}
        >
          <source src="/images/marco.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        {/* Landing content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <RevealOnScroll cacheKey="music:hero-tag">
            <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
              Single &middot; 2024
            </span>
          </RevealOnScroll>

          <RevealOnScroll delay={100} cacheKey="music:hero-title">
            <h2
              className="text-[clamp(2rem,11vw,2.6rem)] sm:text-7xl md:text-9xl font-black tracking-tighter leading-none mb-8"
              style={michroma()}
            >
              FRACTALS
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={150} cacheKey="music:hero-spotify">
            <div className="w-full max-w-lg mx-auto mb-10">
              <iframe
                style={{ borderRadius: '12px' }}
                src="https://open.spotify.com/embed/track/4Udyb9Ijofesgz8YcmrsB6?utm_source=generator&theme=0"
                width="100%"
                height="152"
                frameBorder="0"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={200} cacheKey="music:hero-links">
            <div className="flex flex-wrap gap-4 justify-center">
              {streamLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-8 py-4 border border-white/10 hover:border-cyan-500 hover:bg-white/[0.03] transition-all uppercase text-sm font-bold tracking-wider rounded-full backdrop-blur-sm"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </RevealOnScroll>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 music-scroll-indicator">
            <ChevronDown size={24} className="text-zinc-500" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PART 2: Chapters — Shards_Video_Loop.mp4 sticky background
          minHeight: 500vh ensures sticky covers all 4 chapters (needs
          parent height > 4×100vh + 100vh for sticky to hold through Ch4).
          marginBottom: -100vh collapses the extra space so Connect
          section starts immediately after Ch4 with no gap.
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative"
        style={{ minHeight: '500vh', marginBottom: isMobileLayout ? 0 : '-100vh' }}
      >
        {/* Sticky Shards video background — stays pinned for all chapters */}
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <video
            ref={shardsBgRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            style={{ opacity: 0.4 }}
          >
            <source src="/images/Shards_Video_Loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        {/* Chapter content — overlaid on sticky via negative margin.
            zIndex: 1 renders content above the video (zIndex: 0).
            Parent minHeight: 500vh gives sticky enough room to pin all 4 chapters. */}
        <div className="relative" style={{ zIndex: 1, marginTop: isMobileLayout ? 0 : '-100vh' }}>

          {/* ── Chapter 01: The Story Behind The Track ── */}
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
              <RevealOnScroll cacheKey="music:story-tag">
                <span className="text-cyan-400 tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
                  Chapter 01
                </span>
              </RevealOnScroll>

              <RevealOnScroll delay={100} cacheKey="music:story-title">
                <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-12 text-white" style={michroma()}>
                  The Story Behind<br />The Track
                </h3>
              </RevealOnScroll>

              <div className="space-y-8 text-center">
                <RevealOnScroll delay={200} cacheKey="music:story-p1">
                  <p className="text-zinc-200 text-xl md:text-2xl leading-relaxed font-light">
                    Fractals began as a solo piano improvisation, a recursive rhythmic idea
                    that mirrors its own structure throughout the track.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={300} cacheKey="music:story-p2">
                  <p className="text-zinc-400 text-lg md:text-xl leading-relaxed font-light">
                    The composition is built on polyrhythmic layers — patterns that feel intricate
                    and unpredictable up close, but resolve into a clear, unified symmetry.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={400} cacheKey="music:story-p3">
                  <div className="w-16 h-[2px] bg-cyan-500/60 mx-auto" />
                  <p className="text-zinc-400 text-lg md:text-xl leading-relaxed font-light mt-8">
                    What started as a rhythmic experiment evolved into a musical dialogue once the
                    full trio came together. The final track features three distinct instrumental
                    voices: piano, bass, and drums, each interpreting the same rhythmic
                    foundation through their own unique playing styles.
                  </p>
                </RevealOnScroll>
              </div>
            </div>
          </div>

          {/* ── Chapter 02: In The Studio ── */}
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-5xl mx-auto w-full text-center">
              <RevealOnScroll cacheKey="music:studio-tag">
                <span className="text-cyan-400 tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
                  Chapter 02
                </span>
              </RevealOnScroll>

              <RevealOnScroll delay={100} cacheKey="music:studio-title">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white" style={michroma()}>
                  In The Studio
                </h3>
              </RevealOnScroll>

              <RevealOnScroll delay={150} cacheKey="music:studio-img">
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <img
                    src="/images/ableton.png"
                    alt="Fractals — Production Session"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={300} cacheKey="music:studio-text">
                <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mx-auto mt-10 font-light text-center">
                  Recorded and produced in 2024, the track was built from the ground up,
                  layering piano improvisation with programmed rhythmic foundations before bringing in
                  the live session recordings from Ric and Marco.
                </p>
              </RevealOnScroll>
            </div>
          </div>

          {/* ── Chapter 03: The Collaborators ── */}
          <div className="min-h-screen flex items-center justify-center px-6 pt-24">
            <div className="max-w-5xl mx-auto w-full text-center">
              <RevealOnScroll cacheKey="music:legends-tag">
                <span className="text-cyan-400 tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
                  Chapter 03
                </span>
              </RevealOnScroll>

              <RevealOnScroll delay={100} cacheKey="music:legends-title">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white" style={michroma()}>
                  The Collaborators
                </h3>
              </RevealOnScroll>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {[
                  {
                    name: 'Ric Fierabracci',
                    role: 'Bass',
                    imgSrc: '/images/Ric.jpg',
                    bio: '3x Grammy-nominated bassist known for his work with Yanni, Chick Corea, Jean-Luc Ponty, and Planet X. A true virtuoso of modern fusion bass.',
                  },
                  {
                    name: 'Marco Minnemann',
                    role: 'Drums',
                    imgSrc: '/images/marco.jpg',
                    bio: 'World-renowned drummer who has recorded and toured with Steven Wilson, Joe Satriani, The Aristocrats, and Guthrie Govan. A master of polyrhythmic expression.',
                  },
                ].map((musician, i) => (
                  <RevealOnScroll key={musician.name} delay={i * 150} cacheKey={`music:legend-${i}`}>
                    <MusicianCard {...musician} />
                  </RevealOnScroll>
                ))}
              </div>

              <RevealOnScroll delay={300} cacheKey="music:legends-text">
                <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mx-auto mt-10 font-light">
                  When Ric and Marco came on board, the track transformed. Their live performances
                  brought a raw energy and conversational interplay that elevated Fractals from a
                  composition into a living, breathing piece of music.
                </p>
              </RevealOnScroll>
            </div>
          </div>

          {/* ── Chapter 04: Beyond The Single ── */}
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
              <RevealOnScroll cacheKey="music:vision-tag">
                <span className="text-cyan-400 tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
                  Chapter 04
                </span>
              </RevealOnScroll>

              <RevealOnScroll delay={100} cacheKey="music:vision-title">
                <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-12 text-white" style={michroma()}>
                  Beyond The Single
                </h3>
              </RevealOnScroll>

              <RevealOnScroll delay={200} cacheKey="music:vision-p1">
                <p className="text-zinc-200 text-xl md:text-2xl leading-relaxed font-light mb-12 max-w-2xl mx-auto">
                  Fractals is just the beginning. The vision is a full-length album:
                  a deep dive into progressive jazz fusion, recorded with world-class production.
                </p>
              </RevealOnScroll>

              <div className="w-24 h-[2px] bg-cyan-500/60 mx-auto mb-12" />

              <RevealOnScroll delay={300} cacheKey="music:support-cta">
                <span
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-base font-bold uppercase tracking-wider cursor-not-allowed select-none"
                  style={michroma()}
                >
                  Fundraiser Coming Soon
                </span>
              </RevealOnScroll>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes music-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .music-scroll-indicator {
          animation: music-bounce 2s ease-in-out infinite;
        }
        @media (max-width: 767px) {
          .music-chapters-container {
            margin-bottom: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
