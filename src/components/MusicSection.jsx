import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';
import useIsMobile from '../hooks/useIsMobile';

const michroma = () => ({ fontFamily: "'Michroma', sans-serif" });

function MusicianCard({ name, role, imgSrc, bio }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="aspect-[4/5] md:aspect-square bg-zinc-900 flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-top"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="text-center">
            <span className="text-zinc-600 text-xs uppercase tracking-widest">Photo Coming Soon</span>
          </div>
        )}
      </div>
      <div className="p-8">
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="text-white text-2xl font-bold" style={michroma()}>{name}</h4>
          <span className="text-cyan-400 text-sm uppercase tracking-wider font-bold">{role}</span>
        </div>
        <p className="text-zinc-400 text-lg leading-relaxed font-light">{bio}</p>
      </div>
    </div>
  );
}

export default function MusicSection({ appleMusicLink, spotifyLink, youtubeLink, streamLink }) {
  const marcoBgRef = useRef(null);
  const shardsBgRef = useRef(null);
  const marcoSectionRef = useRef(null);
  const shardsSectionRef = useRef(null);

  // Skip heavy video backgrounds on mobile to prevent crashes
  const isMobile = useIsMobile();

  // Play/pause videos based on viewport visibility to conserve GPU memory
  useEffect(() => {
    if (isMobile) return;

    const pairs = [
      { video: marcoBgRef, section: marcoSectionRef },
      { video: shardsBgRef, section: shardsSectionRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pair = pairs.find((p) => p.section.current === entry.target);
          if (!pair?.video.current) return;
          if (entry.isIntersecting) {
            pair.video.current.play().catch(() => {});
          } else {
            pair.video.current.pause();
          }
        });
      },
      { rootMargin: '200px' }
    );

    pairs.forEach(({ section }) => {
      if (section.current) observer.observe(section.current);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  const streamLinks = [
    {
      href: appleMusicLink,
      label: 'Apple Music',
      icon: <img src="/images/applemusic-icon.svg" alt="Apple Music" className="w-4 h-4 shrink-0 rounded-[3px]" />,
    },
    {
      href: spotifyLink,
      label: 'Spotify',
      icon: <img src="/images/spotify-icon.svg" alt="Spotify" className="w-4 h-4 shrink-0 rounded-full" />,
    },
    {
      href: youtubeLink,
      label: 'YouTube',
      icon: <img src="/images/youtube-icon.svg" alt="YouTube" className="w-4 h-4 shrink-0 rounded-[3px]" />,
    },
  ];

  return (
    <section className="relative bg-black">

      {/* ═══════════════════════════════════════════════════════════════════
          PART 1: Landing Hero — Fractals video background
          ═══════════════════════════════════════════════════════════════════ */}
      <div ref={marcoSectionRef} className="relative min-h-screen overflow-hidden">
        {/* Fractals video background — compressed 720p version on mobile */}
        <video
          key={isMobile ? 'fractals-mobile' : 'fractals-desktop'}
          ref={marcoBgRef}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
          src={isMobile ? "/images/Fractals_BG_mobile.webm" : "/images/Fractals Video for Website BG.webm"}
        />
        <div className="absolute inset-0 bg-black/[0.37]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Landing content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <RevealOnScroll cacheKey="music:hero-tag">
            <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
              Out Now
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

          <RevealOnScroll delay={150} cacheKey="music:hero-presave">
            <div className="w-full max-w-lg mx-auto mb-10 flex justify-center">
              <a
                href={streamLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-[0.97] transition-all text-white text-sm font-bold uppercase tracking-wider"
                style={{ fontFamily: "'Michroma', sans-serif" }}
              >
                Stream Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
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
          PART 2: Chapters — Shards_Video_Loop sticky background
          CSS Grid overlay: both children in the same cell so they overlap.
          Content paddingBottom provides enough scroll room for the sticky
          video to pin through all 4 chapters.
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={shardsSectionRef}
        className="relative grid"
        style={{ gridTemplateColumns: '1fr' }}
      >
        {/* Sticky Shards video background — stays pinned for all chapters */}
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ gridRow: '1 / -1', gridColumn: '1 / -1', zIndex: 0 }}
        >
          <video
            key={isMobile ? 'shards-mobile' : 'shards-desktop'}
            ref={shardsBgRef}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-cover"
            style={{ opacity: 0.4 }}
            src={isMobile ? "/images/Shards_Video_Loop_mobile.webm" : "/images/Shards_Video_Loop.webm"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        {/* Chapter content — overlaid on sticky via CSS Grid (both in same cell).
            zIndex: 1 renders content above the video (zIndex: 0). */}
        <div className="relative" style={{ gridRow: '1 / -1', gridColumn: '1 / -1', zIndex: 1 }}>

          {/* ── Chapter 01: The Story Behind The Track ── */}
          <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <RevealOnScroll cacheKey="music:story-tag">
                <span className="invisible tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
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
          <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="max-w-5xl mx-auto w-full text-center">
              <RevealOnScroll cacheKey="music:studio-tag">
                <span className="invisible tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
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
                    src="/images/ableton.webp"
                    alt="Fractals — Production Session"
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={300} cacheKey="music:studio-text">
                <div className="space-y-6 max-w-3xl mx-auto mt-10 text-center">
                  <p className="text-zinc-400 text-lg leading-relaxed font-light">
                    The first version of Fractals was written and produced in 2024 — a solo
                    piano composition built entirely with MIDI, programmed rhythms, and
                    virtual instruments. That demo became the blueprint for everything that followed.
                  </p>
                  <p className="text-zinc-400 text-lg leading-relaxed font-light">
                    In 2026, the track was reimagined from the ground up with live musicians.
                    Ric and Marco each recorded their parts remotely, interpreting the
                    original composition through their own playing styles — turning a
                    programmed sketch into a living, breathing performance.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* ── Chapter 03: The Collaborators ── */}
          <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="max-w-7xl mx-auto w-full text-center">
              <RevealOnScroll cacheKey="music:legends-tag">
                <span className="invisible tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
                  Chapter 03
                </span>
              </RevealOnScroll>

              <RevealOnScroll delay={100} cacheKey="music:legends-title">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white" style={michroma()}>
                  The Collaboration
                </h3>
              </RevealOnScroll>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto">
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
                    imgSrc: '/images/marco.webp',
                    bio: 'World-renowned drummer who has recorded and toured with Steven Wilson, Joe Satriani, The Aristocrats, and Guthrie Govan. A master of polyrhythmic expression.',
                  },
                ].map((musician, i) => (
                  <RevealOnScroll key={musician.name} delay={i * 150} cacheKey={`music:legend-${i}`}>
                    <MusicianCard {...musician} />
                  </RevealOnScroll>
                ))}
              </div>

              <RevealOnScroll delay={300} cacheKey="music:legends-text">
                <blockquote className="max-w-3xl mx-auto mt-10 pl-6 border-l-2 border-cyan-500/50">
                  <p className="text-zinc-300 text-lg leading-relaxed font-light italic">
                    "Having Ric and Marco on this was unreal — they brought exactly the kind of energy
                    and conversation I was hoping for. Their live performances brought a raw interplay
                    that elevated Fractals from a composition into a living, breathing piece of music."
                  </p>
                  <footer className="mt-3 text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold">
                    — Suhas
                  </footer>
                </blockquote>
              </RevealOnScroll>
            </div>
          </div>

          {/* ── Chapter 04: Beyond The Single ── */}
          <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <RevealOnScroll cacheKey="music:vision-tag">
                <span className="invisible tracking-[0.3em] text-[10px] uppercase block mb-4 font-bold">
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
      `}</style>
    </section>
  );
}
