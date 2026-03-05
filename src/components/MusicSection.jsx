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
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
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
              className="text-[clamp(1.8rem,11vw,2.6rem)] sm:text-7xl md:text-9xl font-black tracking-tighter leading-none mb-8"
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
        <div className="relative" style={{ zIndex: 1, marginTop: '-100vh' }}>

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
                  The Collaboration
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
