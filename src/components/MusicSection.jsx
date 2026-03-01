import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const ubuntuSans = (w = 800) => ({ fontFamily: "'Ubuntu Sans', sans-serif", fontWeight: w });

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
          <h4 className="text-white text-xl font-bold" style={ubuntuSans(700)}>{name}</h4>
          <span className="text-cyan-400 text-xs uppercase tracking-wider font-bold">{role}</span>
        </div>
        <p className="text-zinc-400 text-base leading-relaxed font-light">{bio}</p>
      </div>
    </div>
  );
}

export default function MusicSection({ appleMusicLink, spotifyLink, youtubeLink }) {
  const streamLinks = [
    { href: appleMusicLink, label: 'Apple Music' },
    { href: spotifyLink, label: 'Spotify' },
    { href: youtubeLink, label: 'Youtube' },
  ];

  return (
    <section className="relative bg-black">

      {/* ═══════════════════════════════════════════════════════════════════
          PART 1: Landing Hero — marco.mp4 background
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative min-h-screen overflow-hidden">
        {/* marco.mp4 video background */}
        <video
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
              className="text-[2.6rem] sm:text-7xl md:text-9xl font-black tracking-tighter leading-none mb-8"
              style={ubuntuSans()}
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
                  className="group flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-cyan-500 hover:bg-white/[0.03] transition-all uppercase text-sm font-bold tracking-wider rounded-full backdrop-blur-sm"
                >
                  {link.label}
                  <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
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
      <div className="relative" style={{ minHeight: '500vh', marginBottom: '-100vh' }}>
        {/* Sticky Shards video background — stays pinned for all chapters */}
        <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ zIndex: 0 }}>
          <video
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
                <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-12 text-white" style={ubuntuSans()}>
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
                    The composition is built on polyrhythmic layers: patterns that feel complex
                    and dissonant up close, but lock into a clear, unified symmetry.
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
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white" style={ubuntuSans()}>
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
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white" style={ubuntuSans()}>
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
                    bio: 'World-renowned drummer who has recorded and toured with Steven Wilson, Joe Satriani, The Aristocrats, and Guthrie Govan. He also famously auditioned for Dream Theater, showcasing a legendary drum performance. A master of polyrhythmic expression.',
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
                <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-12 text-white" style={ubuntuSans()}>
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
                <a
                  href="/contribute"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-base font-bold uppercase tracking-wider shadow-[0_16px_48px_-12px_rgba(34,211,238,0.4)] hover:shadow-[0_20px_60px_-12px_rgba(34,211,238,0.55)] hover:brightness-110 active:scale-[0.98] transition-all"
                  style={ubuntuSans(700)}
                >
                  Support the Album <ArrowRight size={18} />
                </a>
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
      `}</style>
    </section>
  );
}
