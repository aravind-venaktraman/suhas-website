import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink, Download, Mail } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';
import useIsMobile from '../hooks/useIsMobile';
import useAutoplayVideo from '../hooks/useAutoplayVideo';

const PRESS_KIT_URL = 'https://drive.google.com/drive/folders/10Q4ToRwhJQQegIUp2W2O8gzj2bZ_vwx1?usp=drive_link';

const FACTS = [
  { label: 'Genre', value: 'Progressive Jazz Fusion' },
  { label: 'Instrument', value: 'Piano & Keys' },
  { label: 'Latest Release', value: 'Fractals (Debut Single)' },
  { label: 'Upcoming', value: 'Fractals (Album, April 2026)' },
  { label: 'Label', value: 'Independent' },
];

const COLLABORATORS = [
  {
    name: 'Ric Fierabracci',
    role: 'Bass Guitar',
    credits: 'Chick Corea Elektrik Band / Blood Sweat & Tears / Yanni / Joe Satriani',
    desc: 'Three-time Grammy-nominated bassist. Over 30 years of touring and session work with Chick Corea\'s Elektrik Band, Billy Cobham, Blood Sweat and Tears, Dave Weckl, Joe Satriani, and Yanni. His bass on Fractals provides a melodic and harmonic anchor that lets the composition\'s layered structures breathe.',
    img: '/images/Ric.jpg',
  },
  {
    name: 'Marco Minnemann',
    role: 'Drums',
    credits: 'The Aristocrats / Joe Satriani / Steven Wilson',
    desc: 'German multi-instrumentalist and one of the most technically advanced drummers working today. Member of The Aristocrats with Guthrie Govan and Bryan Beller. Toured and recorded with Joe Satriani, Steven Wilson, Paul Gilbert, and Adrian Belew. His drumming on Fractals treats rhythm as a compositional voice.',
    img: '/images/marco.webp',
  },
];

const COVERAGE_ANGLES = [
  'Debut single featuring three-time Grammy-nominated bassist Ric Fierabracci',
  'Drumming by Marco Minnemann (The Aristocrats, Joe Satriani, Steven Wilson)',
  'Progressive jazz fusion with composed structure and live improvisation',
  'Available on Spotify, Apple Music, YouTube Music, and all streaming platforms',
];

export default function PressPage() {
  const isMobile = useIsMobile();
  const autoplayRef = useAutoplayVideo();
  usePageMeta({
    path: '/press',
    title: 'Suhas — Press',
    description: 'Press resources for Suhas Padav — progressive jazz fusion pianist and composer. Download the press kit, high-res photos, and one-sheet.',
    ogTitle: 'Suhas Padav — Press & Media Resources',
    ogDescription: 'Press kit, high-res photos, bio, and media resources for Suhas Padav. Debut single Fractals featuring Ric Fierabracci and Marco Minnemann.',
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
      className="relative text-white overflow-x-hidden"
    >
      {/* Background video — compressed 720p on mobile */}
      <div className="fixed inset-0" style={{ zIndex: 0, overflow: 'hidden' }}>
        <video
          key={isMobile ? 'press-mobile' : 'press-desktop'}
          ref={autoplayRef}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.25 }}
          src={isMobile ? "/images/Shards_Video_Loop_mobile.webm" : "/images/Shards_Video_Loop.webm"}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.6) 0%, rgba(9,9,11,0.3) 50%, rgba(9,9,11,0.8) 100%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/[0.06]">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline tracking-widest uppercase text-[10px] font-bold">Back</span>
            </a>
            <a href="/">
              <img src="/images/suhas-productions-new-logo.webp" alt="SUHAS" className="h-10 md:h-12 w-auto" />
            </a>
            <div className="w-16" />
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-6 pt-16 pb-12 max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-cyan-400 tracking-[0.4em] text-[9px] sm:text-[10px] uppercase block mb-4 font-bold">
              Progressive Jazz Fusion / Debut Single / Out Now
            </span>
            <h1
              className="text-4xl md:text-6xl uppercase tracking-tighter mb-4"
              style={{ fontWeight: 800 }}
            >
              Fractals
            </h1>
            <div className="w-12 h-[2px] bg-cyan-500 mx-auto mb-6" />
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
              Press materials, artist information, and media resources.
            </p>
          </div>

          {/* Download Press Kit CTA */}
          <div className="flex justify-center mb-20">
            <a
              href={PRESS_KIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs md:text-sm font-bold uppercase tracking-[0.15em] hover:brightness-110 hover:scale-105 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              <Download size={18} />
              Download Press Kit
              <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* About the Single */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">About the Single</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed font-light rounded-2xl p-6 sm:p-8 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p>
                Fractals is the debut single from pianist and composer Suhas, a progressive jazz fusion track
                built on interlocking piano figures that fold and evolve with each pass.
              </p>
              <p>
                The single features three-time Grammy-nominated bassist <span className="text-white font-medium">Ric Fierabracci</span> (Chick
                Corea Elektrik Band, Blood Sweat and Tears) and drummer <span className="text-white font-medium">Marco Minnemann</span> (The
                Aristocrats, Joe Satriani, Steven Wilson).
              </p>
              <p>
                The track pairs composed structure with improvisation, giving each musician room to respond in
                real time. Fierabracci's bass provides a melodic and harmonic center while Minnemann's drumming
                pushes against the composition's boundaries, shifting meter and feel without losing the groove.
              </p>
              <p>
                Fractals will be available on all major streaming platforms including Spotify, Apple Music,
                YouTube Music, and Tidal. The single is the first release from a larger body of work currently
                in production.
              </p>
            </div>
          </div>

          {/* Artist Quote */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Artist Quote</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <blockquote
              className="rounded-2xl p-6 sm:p-10 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <div className="pl-6 border-l-2 border-cyan-500/50">
                <p className="text-zinc-200 text-base md:text-lg leading-relaxed italic">
                  "Fractals came from wanting to write something that sounds different every time you hear it.
                  The same passage can feel completely new depending on where your ear goes. Having Ric and Marco
                  on this was unreal — they brought exactly the kind of energy and conversation I was hoping for."
                </p>
                <footer className="mt-4 text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold">
                  — Suhas
                </footer>
              </div>
            </blockquote>
          </div>

          {/* Artist Bio */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Artist</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed font-light rounded-2xl p-6 sm:p-8 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p>
                Suhas is a pianist and composer whose music sits at the intersection of jazz harmony, classical
                structure, and progressive fusion. His compositions balance precision with spontaneity, built to
                reward close listening.
              </p>
              <p>
                He learned to play by ear before formal training, spending years developing his compositional
                approach on his own terms. For Suhas, the piano is both a melodic voice and a structural tool.
              </p>
              <p>
                Fractals is the first single from a larger project currently in production. The release marks
                his debut as a recording artist and composer in the progressive jazz fusion space.
              </p>
            </div>
            {/* Quick info row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Website', value: 'suhasmusic.com', href: 'https://suhasmusic.com' },
                { label: 'Instagram', value: '@suhas.als', href: 'https://www.instagram.com/suhas.als' },
                { label: 'YouTube', value: '@Suhasmusicofficial', href: 'https://www.youtube.com/@Suhasmusicofficial' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-white/[0.06] hover:border-cyan-500/30 transition-colors text-center"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <p className="text-[8px] sm:text-[9px] tracking-[0.3em] uppercase text-zinc-500 mb-1 font-bold">{item.label}</p>
                  <p className="text-cyan-400 text-[10px] sm:text-xs font-medium truncate">{item.value}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Key Facts */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Key Facts</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="p-5 rounded-xl border border-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
                >
                  <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-500 mb-2 font-bold">{fact.label}</p>
                  <p className="text-white text-sm font-medium">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborators */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Featured Artists</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div className="grid grid-cols-1 gap-6">
              {COLLABORATORS.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-col sm:flex-row gap-5 p-6 rounded-xl border border-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
                >
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    className="w-24 h-24 rounded-lg object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm mb-0.5">{c.name}</p>
                    <p className="text-cyan-400 text-[10px] tracking-[0.2em] uppercase mb-1 font-bold">{c.role}</p>
                    <p className="text-zinc-500 text-[9px] tracking-wider uppercase mb-3">{c.credits}</p>
                    <p className="text-zinc-400 text-xs leading-relaxed font-light">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why This Release Matters */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Why This Release Matters</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed font-light rounded-2xl p-6 sm:p-8 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p>
                Progressive jazz fusion has a deep lineage, from Mahavishnu Orchestra and Return to Forever
                through to modern artists like Tigran Hamasyan and Snarky Puppy. Fractals enters that
                conversation with a distinct voice: an emerging composer paired with world-class
                instrumentalists whose combined credits span the most significant recordings in the genre.
              </p>
              <p>
                Fractals is a deliberately composed debut that puts compositional vision front and center.
                Fierabracci and Minnemann were chosen because their musical vocabularies are essential to
                how the piece speaks.
              </p>
            </div>
          </div>

          {/* Key Angles for Coverage */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Key Angles for Coverage</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="rounded-2xl p-6 sm:p-8 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <ul className="space-y-4">
                {COVERAGE_ANGLES.map((angle, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm leading-relaxed font-light">
                    <span className="text-cyan-400 mt-0.5 shrink-0">+</span>
                    {angle}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">What's Next</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed font-light rounded-2xl p-6 sm:p-8 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p>
                Fractals is the lead single from a larger project currently in production. Additional singles
                featuring further collaborations are planned for later in 2026, with a full release to follow.
                Live performance dates and music video content are in development.
              </p>
            </div>
          </div>

          {/* Press Photos */}
          <div className="mb-20">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Press Photos & Artwork</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['/images/suhas.webp', '/images/suhas4.webp', '/images/suhas6.webp'].map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/[0.06]">
                  <img
                    src={src}
                    alt={`Suhas press photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-xs mt-4 text-center">
              High-resolution press photos, artwork, and audio previews available in the{' '}
              <a href={PRESS_KIT_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                press kit
              </a>
              .
            </p>
          </div>

          {/* Contact */}
          <div className="mb-16">
            <h2 className="text-lg md:text-xl uppercase tracking-wider mb-6 font-bold">Press & Booking</h2>
            <div className="w-10 h-[2px] bg-cyan-500/50 mb-8" />
            <div
              className="text-center p-6 sm:p-10 rounded-2xl border border-white/[0.06] overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p className="text-zinc-400 text-sm mb-6 font-light">
                For interview scheduling, playlist consideration, or feature inquiries
              </p>
              <a
                href="mailto:management@suhasmusic.com"
                className="group inline-flex items-center gap-2 sm:gap-3 text-white text-xs sm:text-base md:text-xl font-bold hover:text-cyan-400 transition-colors break-all"
              >
                <Mail size={20} className="text-cyan-400 shrink-0" />
                <span className="break-all">management@suhasmusic.com</span>
              </a>
            </div>
          </div>

          {/* Stream Links */}
          <div className="mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Website', href: 'https://suhasmusic.com', icon: <img src="/images/suhas-productions-new-logo.webp" alt="Suhas" className="h-5 w-auto" /> },
                { label: 'YouTube', href: 'https://www.youtube.com/@Suhasmusicofficial', icon: <img src="/images/youtube-icon.svg" alt="YouTube" className="w-5 h-5 rounded-[3px]" /> },
                { label: 'Instagram', href: 'https://www.instagram.com/suhas.als', icon: <img src="/images/instagram-icon.svg" alt="Instagram" className="w-5 h-5 rounded-[4px]" /> },
                { label: 'Spotify', href: 'https://open.spotify.com/artist/7jrJXlWGH3Z1L3r7q4qY8K', icon: <img src="/images/spotify-icon.svg" alt="Spotify" className="w-5 h-5 rounded-full" /> },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-4 rounded-xl border border-white/[0.06] hover:border-cyan-500/30 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {link.icon}
                  <p className="text-white text-xs font-bold uppercase tracking-wider">{link.label}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-10">
          <div className="container mx-auto px-6 text-center">
            <a
              href="/"
              className="text-[10px] tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors uppercase"
            >
              suhasmusic.com
            </a>
            <p className="text-zinc-700 text-[9px] mt-3 tracking-widest uppercase">
              &copy; 2026 Suhas Music. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
