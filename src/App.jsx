import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Menu, X, Instagram, Youtube, Music, ArrowRight, Heart, DollarSign, Mail, Headphones, Play, ArrowUpRight, ChevronDown, ExternalLink } from 'lucide-react';

const ScrollCtx = createContext({ scrollY: 0, velocity: 0, progress: 0 });
const SmoothScrollProvider = ({ children }) => {
  const [d, setD] = useState({ scrollY: 0, velocity: 0, progress: 0 });
  const lastY = useRef(0), lastT = useRef(Date.now()), smoothY = useRef(0);
  useEffect(() => {
    let raf;
    const up = () => {
      const now = Date.now(), dt = Math.max(now - lastT.current, 1), y = window.scrollY;
      smoothY.current += (y - smoothY.current) * 0.12;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setD({ scrollY: smoothY.current, velocity: (y - lastY.current) / dt * 16, progress: total > 0 ? y / total : 0 });
      lastY.current = y; lastT.current = now; raf = requestAnimationFrame(up);
    };
    raf = requestAnimationFrame(up);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <ScrollCtx.Provider value={d}>{children}</ScrollCtx.Provider>;
};
const useScroll = () => useContext(ScrollCtx);

const FontLoader = () => {
  useEffect(() => {
    if (!document.querySelector('link[data-suhas-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap';
      link.dataset.suhasFonts = 'true';
      document.head.appendChild(link);
    }
  }, []);
  return null;
};

/* --- Utility Components --- */
const Reveal = ({ children, className = "", delay = 0, direction = "up", distance = 50, once = true }) => {
  const [v, setV] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); if (once) obs.unobserve(e.target); } }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [once]);
  const dirs = { up: `translate3d(0,${distance}px,0)`, down: `translate3d(0,-${distance}px,0)`, left: `translate3d(${distance}px,0,0)`, right: `translate3d(-${distance}px,0,0)`, scale: 'scale(0.9)' };
  return <div ref={ref} className={className} style={{ transform: v ? 'translate3d(0,0,0) scale(1)' : dirs[direction], opacity: v ? 1 : 0, filter: v ? 'blur(0px)' : 'blur(4px)', transition: `transform 1s cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 0.8s ease ${delay}ms, filter 1s ease ${delay}ms`, willChange: 'transform, opacity, filter' }}>{children}</div>;
};

const CharReveal = ({ text, className = "", delay = 0, tag: Tag = "h2", stagger = 22 }) => {
  const [v, setV] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.unobserve(e.target); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={className} aria-label={text} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, letterSpacing: '-0.03em' }}>
      {text.split('').map((c, i) => (
        <span key={i} style={{ display: c === ' ' ? 'inline' : 'inline-block', overflow: 'hidden' }}>
          {c === ' ' ? '\u00A0' : <span style={{ display: 'inline-block', transform: v ? 'translateY(0)' : 'translateY(110%)', opacity: v ? 1 : 0, transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms, opacity 0.5s ease ${delay + i * stagger}ms` }}>{c}</span>}
        </span>
      ))}
    </Tag>
  );
};

const Magnetic = ({ children, className = "", strength = 0.12 }) => {
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  return <div ref={ref} onMouseMove={(e) => { const r = ref.current.getBoundingClientRect(); setP({ x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength }); }} onMouseLeave={() => setP({ x: 0, y: 0 })} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: 'transform 0.6s cubic-bezier(0.33,1,0.68,1)' }} className={`inline-block ${className}`}>{children}</div>;
};

const Grain = () => <div className="pointer-events-none fixed inset-0 z-[100] mix-blend-overlay opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }} />;

const Marquee = ({ children, speed = 30, className = "" }) => <div className={`overflow-hidden whitespace-nowrap ${className}`}><div className="inline-flex" style={{ animation: `marquee ${speed}s linear infinite` }}>{[0,1].map(i => <div key={i} className="inline-flex">{children}</div>)}</div></div>;

const FloatingParticles = ({ count = 25 }) => {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, sz: Math.random() * 2.5 + 0.5, dur: Math.random() * 25 + 15, del: Math.random() * -20, op: Math.random() * 0.25 + 0.05 }))).current;
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{pts.map(p => <div key={p.id} className="absolute rounded-full bg-white" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.sz, height: p.sz, opacity: p.op, animation: `float-particle ${p.dur}s ease-in-out ${p.del}s infinite` }} />)}</div>;
};

const SpotifyIcon = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>;

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) { p = 100; clearInterval(iv); setProgress(100); setTimeout(() => setPhase('revealing'), 200); setTimeout(() => { setPhase('done'); onCompleteRef.current(); }, 1000); }
      else setProgress(Math.floor(p));
    }, 80);
    return () => clearInterval(iv);
  }, []);
  if (phase === 'done') return null;
  return (
    <div className={`fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center transition-opacity duration-600 ${phase === 'revealing' ? 'opacity-0' : ''}`}>
      <div className="flex flex-col items-center gap-8">
        <span className="text-[clamp(2.5rem,8vw,5rem)] tracking-[-0.04em] text-white uppercase" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, opacity: phase === 'revealing' ? 0 : 1, transform: phase === 'revealing' ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)' }}>SUHAS</span>
        <div className="w-56 h-[2px] bg-zinc-900 relative overflow-hidden rounded-full"><div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} /></div>
        <span className="text-[11px] tracking-[0.5em] uppercase text-zinc-600 font-mono font-medium">{progress}%</span>
      </div>
    </div>
  );
};

/* --- PIANO: fix #6 — fewer keys on mobile in expanded mode --- */
const AbstractPiano = ({ isExpanded, onPlayNote }) => {
  const samplerRef = useRef(null);
  const [Tone, setTone] = useState(null);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [recording, setRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const effectsRef = useRef({});
  const [octaveShift, setOctaveShift] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    sc.async = true;
    sc.onload = () => {
      setTone(window.Tone);
      const s = new window.Tone.Sampler({ urls: { C4: "https://tonejs.github.io/audio/salamander/C4.mp3", "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3", "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3", A4: "https://tonejs.github.io/audio/salamander/A4.mp3", C5: "https://tonejs.github.io/audio/salamander/C5.mp3", "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3", "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3", A5: "https://tonejs.github.io/audio/salamander/A5.mp3" }, release: 1.2 });
      const rv = new window.Tone.Reverb({ decay: 3.5, wet: 0.4 }).toDestination();
      const dl = new window.Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.25, wet: 0.12 });
      const fl = new window.Tone.Filter({ frequency: 5000, type: 'lowpass', rolloff: -24 });
      s.connect(fl); fl.connect(dl); dl.connect(rv);
      samplerRef.current = s; effectsRef.current = { rv, dl, fl };
    };
    document.body.appendChild(sc);
    return () => { samplerRef.current?.dispose(); Object.values(effectsRef.current).forEach(e => e?.dispose?.()); sc.parentNode?.removeChild(sc); };
  }, []);

  const playNote = async (index, velocity = 0.8) => {
    onPlayNote?.(index);
    if (!samplerRef.current || !Tone) return;
    try {
      await Tone.start();
      const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
      const oct = (isExpanded ? 3 : 4) + octaveShift + Math.floor(index / 12);
      const nm = notes[index % 12] + oct;
      if (recording) setRecordedNotes(p => [...p, { note: nm, time: Tone.now(), velocity }]);
      setActiveNotes(p => new Set([...p, index]));
      setTotalPlayed(p => p + 1);
      samplerRef.current.triggerAttackRelease(nm, '2n', undefined, velocity);
      setTimeout(() => setActiveNotes(p => { const s = new Set(p); s.delete(index); return s; }), 300);
    } catch (e) { console.error(e); }
  };

  const playRecording = () => {
    if (!recordedNotes.length || !samplerRef.current) return;
    setIsPlaying(true);
    const st = Tone.now(), f = recordedNotes[0].time;
    recordedNotes.forEach(({ note, time, velocity }) => samplerRef.current.triggerAttackRelease(note, '2n', st + (time - f), velocity));
    setTimeout(() => setIsPlaying(false), (recordedNotes[recordedNotes.length - 1].time - f + 2) * 1000);
  };

  // Fix #6: on mobile expanded, show 25 keys (2 octaves) instead of 37
  const numKeys = isExpanded ? (isMobile ? 25 : 37) : 13;
  return (
    <div className="w-full space-y-4 overflow-x-hidden">
      {totalPlayed > 0 && <div className="text-center"><span className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-semibold">{totalPlayed} note{totalPlayed !== 1 ? 's' : ''} played</span></div>}
      <div className={`flex gap-[1px] sm:gap-[2px] items-start justify-center relative z-30 transition-all duration-700 ease-out ${isExpanded ? 'h-40 sm:h-48 mt-auto mb-4 sm:mb-6' : 'h-[72px] sm:h-28'}`}>
        {[...Array(numKeys)].map((_, i) => {
          const n = i % 12, isBlack = [1,3,6,8,10].includes(n), isActive = activeNotes.has(i);
          return (
            <button key={i} onMouseDown={() => playNote(i, 0.7)} onTouchStart={(e) => { e.preventDefault(); playNote(i, 0.7); }}
              className={`transition-all duration-75 ease-out relative active:scale-95 ${isBlack
                ? `z-10 rounded-b shadow-lg shadow-black/80 border ${isActive ? 'bg-cyan-400 border-cyan-300 shadow-cyan-400/30' : 'bg-[#0a0a0a] border-zinc-800/60 hover:bg-zinc-800'} ${isExpanded ? 'w-[14px] sm:w-7 h-[80px] sm:h-[100px] -mx-[7px] sm:-mx-[14px]' : 'w-[14px] sm:w-[19px] h-[42px] sm:h-16 -mx-[7px] sm:-mx-[9.5px]'}`
                : `rounded-b-lg border-t border-x border-b ${isActive ? 'bg-gradient-to-b from-cyan-400/80 via-cyan-300/50 to-cyan-200/30 border-cyan-400/60 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'bg-gradient-to-b from-white/15 via-white/8 to-white/4 border-white/15 hover:from-white/25 active:translate-y-0.5'} ${isExpanded ? 'w-[20px] sm:w-11 h-40 sm:h-48' : 'w-[22px] sm:w-9 h-[72px] sm:h-28'}`
              }`} aria-label={`Key ${i}`}
            >{!isBlack && isActive && <div className="absolute inset-0 rounded-b-lg bg-cyan-400/10 animate-pulse" />}</button>
          );
        })}
      </div>
      {isExpanded && (
        <div className="flex flex-wrap justify-center gap-2 pt-3 px-2">
          <button onClick={() => setRecording(!recording)} className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border-2 transition-all active:scale-95 ${recording ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/15 text-zinc-300'}`}>{recording ? '⏺ Rec' : '⏺ Record'}</button>
          <button onClick={playRecording} disabled={!recordedNotes.length || isPlaying} className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border-2 transition-all active:scale-95 ${isPlaying ? 'bg-green-500/20 border-green-500 text-green-400' : recordedNotes.length ? 'bg-white/5 border-white/15 text-zinc-300' : 'bg-white/5 border-white/10 text-zinc-700 cursor-not-allowed'}`}>▶ Play ({recordedNotes.length})</button>
          <button onClick={() => { setRecordedNotes([]); setIsPlaying(false); }} disabled={!recordedNotes.length} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border-2 bg-white/5 border-white/15 text-zinc-300 transition-all active:scale-95 disabled:text-zinc-700 disabled:cursor-not-allowed">⏹ Clear</button>
          <div className="flex items-center gap-2 bg-white/5 border-2 border-white/15 rounded-full px-3 sm:px-4 py-2 sm:py-2.5">
            <button onClick={() => setOctaveShift(Math.max(-2, octaveShift - 1))} className="text-zinc-300 hover:text-cyan-400 font-bold text-base sm:text-lg leading-none active:scale-90 transition-transform">−</button>
            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 min-w-[40px] sm:min-w-[50px] text-center font-mono">Oct {octaveShift > 0 ? '+' : ''}{octaveShift}</span>
            <button onClick={() => setOctaveShift(Math.min(2, octaveShift + 1))} className="text-zinc-300 hover:text-cyan-400 font-bold text-base sm:text-lg leading-none active:scale-90 transition-transform">+</button>
          </div>
        </div>
      )}
    </div>
  );
};

const GeometricVisualizer = () => {
  const mountRef = useRef(null);
  useEffect(() => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    sc.async = true;
    sc.onload = () => {
      if (!mountRef.current) return;
      const T = window.THREE, scene = new T.Scene();
      const cam = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cam.position.z = 5;
      const ren = new T.WebGLRenderer({ alpha: true, antialias: true });
      ren.setSize(window.innerWidth, window.innerHeight);
      ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(ren.domElement);
      const core = new T.Mesh(new T.IcosahedronGeometry(1.2, 1), new T.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.7 }));
      scene.add(core);
      const outer = new T.Mesh(new T.IcosahedronGeometry(2.5, 1), new T.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.1 }));
      scene.add(outer);
      const cnt = 500, pG = new T.BufferGeometry(), pos = new Float32Array(cnt * 3), vel = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt * 3; i++) { pos[i] = (Math.random() - 0.5) * 20; vel[i] = (Math.random() - 0.5) * 0.01; }
      pG.setAttribute('position', new T.BufferAttribute(pos, 3));
      pG.setAttribute('velocity', new T.BufferAttribute(vel, 3));
      const pts = new T.Points(pG, new T.PointsMaterial({ size: 0.02, color: 0xffffff, transparent: true, opacity: 0.3, blending: T.AdditiveBlending }));
      scene.add(pts);
      let t = 0;
      const anim = () => {
        requestAnimationFrame(anim); t += 0.005;
        core.rotation.x += 0.003; core.rotation.y += 0.004;
        const s = 1 + Math.sin(t * 2) * 0.04; core.scale.set(s, s, s);
        outer.rotation.x -= 0.001; outer.rotation.y -= 0.002;
        const p = pts.geometry.attributes.position.array, v = pts.geometry.attributes.velocity.array;
        for (let i = 0; i < p.length; i += 3) { p[i]+=v[i]; p[i+1]+=v[i+1]; p[i+2]+=v[i+2]; if(Math.abs(p[i])>10)v[i]*=-1; if(Math.abs(p[i+1])>10)v[i+1]*=-1; if(Math.abs(p[i+2])>10)v[i+2]*=-1; }
        pts.geometry.attributes.position.needsUpdate = true;
        pts.rotation.y = t * 0.025;
        cam.position.x = Math.sin(t * 0.3) * 0.2; cam.position.y = Math.cos(t * 0.2) * 0.15;
        cam.lookAt(0, 0, 0); ren.render(scene, cam);
      };
      anim();
      const onR = () => { ren.setSize(window.innerWidth, window.innerHeight); cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); };
      window.addEventListener('resize', onR);
      return () => { window.removeEventListener('resize', onR); mountRef.current?.contains(ren.domElement) && mountRef.current.removeChild(ren.domElement); };
    };
    document.body.appendChild(sc);
    return () => sc.parentNode?.removeChild(sc);
  }, []);
  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-80" />;
};

/* --- MAIN --- */
const SuhasWebsite = () => {
  const [loaded, setLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showViz, setShowViz] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { progress: scrollProgress } = useScroll();

  useEffect(() => { if (loaded) setTimeout(() => setHeroReady(true), 150); }, [loaded]);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 50); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => {
    if (!loaded) return;
    const ids = ['home','about','music','contribute','store','connect'];
    const obs = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }), { threshold: 0.3 });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [loaded]);

  // Fix #7: proper scroll lock for mobile menu (from original prod version)
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isMenuOpen]);

  const nav = [{ n: 'About', h: '#about' },{ n: 'Music', h: '#music' },{ n: 'Contribute', h: '#contribute' },{ n: 'Store', h: '#store' },{ n: 'Connect', h: '#connect' }];
  const store = [
    { id:1, name:'Fractals (Single)', price:'$1.29', desc:'Digital Copy of Fractals (Single)', type:'Digital Download', link:'https://music.apple.com/us/album/fractals-single/1768715442', soldOut:false },
    { id:2, name:'Fractals CD', price:'$5.00', desc:'Limited Digipak Edition', type:'CD', link:null, soldOut:true },
    { id:3, name:'Fractals Tee', price:'$30.00', desc:'Heavyweight Cotton - Black', type:'Apparel', link:null, soldOut:true },
  ];
  const L = {
    am: "https://music.apple.com/us/album/fractals-single/1768715442",
    sp: "https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6?si=KcFSYSf9Q2SwzGrJjKejNg",
    yt: "https://www.youtube.com/@Suhasmusicofficial",
    ig: "https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr",
    amA: "https://music.apple.com/us/artist/suhas/1768715441",
    spA: "https://open.spotify.com/artist/7jrJXlWGH3Z1L3r7q4qY8K",
  };
  const imgs = { 'Digital Download': '/images/album-art.PNG', CD: '/images/cd-art.png', Apparel: '/images/tshirt.png' };

  return (
    <>
      <FontLoader />
      <LoadingScreen onComplete={useCallback(() => setLoaded(true), [])} />
      {loaded && (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-x-hidden" style={{ fontFamily: "var(--font-body)" }}>
          {/* Fix #3: removed MorphCursor, removed lg:cursor-none */}
          <Grain />
          <div className="fixed top-0 left-0 h-[2px] z-[60]" style={{ width: `${scrollProgress * 100}%`, background: 'linear-gradient(90deg, #22d3ee, #3b82f6, #6366f1)' }} />

          {/* NAV */}
          <nav className={`fixed w-full z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-black/60 backdrop-blur-2xl border-b border-white/[0.04] py-3' : 'bg-transparent py-5'}`}>
            <div className="container mx-auto px-5 md:px-10 flex justify-between items-center max-w-[1400px]">
              <a href="#" className="z-50 hover:opacity-80 transition-opacity active:scale-95"><img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-10 md:h-14 w-auto" /></a>
              <div className="hidden md:flex items-center gap-10">
                {nav.map(l => (
                  <Magnetic key={l.n} strength={0.08}>
                    <a href={l.h} className={`text-[11px] uppercase tracking-[0.25em] transition-all duration-400 relative group font-semibold ${activeSection === l.h.slice(1) ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'}`}>
                      {l.n}<span className={`absolute -bottom-1.5 left-0 h-[2px] bg-cyan-400 transition-all duration-400 ${activeSection === l.h.slice(1) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </a>
                  </Magnetic>
                ))}
              </div>
              <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-white hover:text-cyan-400 z-50 w-12 h-12 flex items-center justify-center -mr-2 active:scale-90 transition-transform"><Menu size={24} /></button>
            </div>

            {/* Fix #7 & #8: mobile menu with logo, proper scroll handling */}
            {isMenuOpen && (
              <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center overflow-hidden" style={{ animation: 'fadeIn 0.3s ease' }}>
                {/* Fix #8: logo in mobile menu */}
                <div className="absolute top-6 left-6">
                  <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-12 w-auto" />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 w-14 h-14 flex items-center justify-center text-white hover:text-cyan-400 active:scale-90 transition-transform"><X size={28} /></button>
                <div className="flex flex-col items-center gap-7">
                  {nav.map((l, i) => <a key={l.n} href={l.h} className="text-[clamp(1.8rem,7vw,3.5rem)] tracking-[-0.02em] text-zinc-200 hover:text-white active:text-cyan-400 transition-all" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, opacity: 0, animation: `slideUp 0.5s ease ${i * 60}ms forwards` }} onClick={() => setIsMenuOpen(false)}>{l.n}</a>)}
                </div>
                <div className="flex gap-4 mt-10" style={{ opacity: 0, animation: 'slideUp 0.5s ease 400ms forwards' }}>
                  {[{ h:L.ig, i:<Instagram size={20}/> },{ h:L.yt, i:<Youtube size={20}/> },{ h:L.sp, i:<SpotifyIcon size={18}/> }].map(({ h, i }, idx) => <a key={idx} href={h} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 active:text-white active:scale-95 transition-all">{i}</a>)}
                </div>
              </div>
            )}
          </nav>

          {/* HERO */}
          <section id="home" className="relative flex flex-col justify-center items-center text-center overflow-hidden" style={{ height: '100dvh' }}>
            {showViz && <GeometricVisualizer />}
            {!showViz && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Fix #1 & #9: album art as blurred bg layer */}
                <div className="absolute inset-0 overflow-hidden z-0">
                  <img src="/images/album-art.PNG" alt="" className="w-full h-full object-cover" style={{ opacity: heroReady ? 0.25 : 0, filter: 'blur(60px) saturate(1.2) scale(1.1)', transform: 'scale(1.15)', transition: 'opacity 3s ease 0.3s' }} />
                </div>
                {/* Poster on top */}
                <div className="absolute inset-0 z-[1]" style={{ transform: `scale(${1 + scrollProgress * 0.15})`, transition: 'transform 0.05s linear' }}>
                  <img src="/images/poster.jpg" alt="" className="w-full h-full object-cover fixed top-0 left-0" style={{ opacity: heroReady ? 0.3 : 0, transition: 'opacity 2s ease' }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black z-[2]" />
                <div className="absolute inset-0 z-[2]" style={{ boxShadow: 'inset 0 0 250px 80px rgba(0,0,0,0.85)' }} />
                <div className="z-[3] absolute inset-0"><FloatingParticles count={30} /></div>
              </div>
            )}
            <div className="absolute top-0 left-0 right-0 bg-black z-20 pointer-events-none" style={{ height: heroReady ? 0 : '12vh', transition: 'height 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s' }} />
            <div className="absolute bottom-0 left-0 right-0 bg-black z-20 pointer-events-none" style={{ height: heroReady ? 0 : '12vh', transition: 'height 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s' }} />

            <div className={`relative z-10 max-w-6xl mx-auto px-5 md:px-8 flex flex-col items-center transition-all duration-800 ${showViz ? 'justify-end h-full pb-8 md:pb-12 pt-20' : 'justify-center'}`}>
              <div className={`flex flex-col items-center ${showViz ? 'opacity-0 h-0 overflow-hidden' : ''}`}>
                <div style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s' }}>
                  <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] backdrop-blur-sm mb-7 sm:mb-9">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 tracking-[0.35em] text-[9px] sm:text-[10px] font-bold uppercase">New Single Out Now</span>
                  </span>
                </div>
                {/* Fix #2: smaller clamp for mobile so "Fractals" doesn't overflow */}
                <div style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 0.7s' }}>
                  <h1 className="text-[clamp(3.5rem,15vw,16rem)] leading-[0.82] tracking-[-0.05em] mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>
                    <span className="hero-gradient-text">Fractals</span>
                  </h1>
                </div>
                <div style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(20px)', transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 1s' }}>
                  <p className="text-zinc-400 text-sm sm:text-base max-w-sm mx-auto tracking-[0.06em] mb-7 sm:mb-9 font-medium">A journey into the chaotic symmetry of Jazz</p>
                </div>
                <div style={{ opacity: heroReady ? 1 : 0, width: heroReady ? 70 : 0, transition: 'all 1.5s cubic-bezier(0.22,1,0.36,1) 1.2s' }} className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-7 sm:mb-9" />
              </div>

              <div style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 1.4s' }} className="flex flex-col gap-5 md:gap-6 items-center w-full">
                <AbstractPiano isExpanded={showViz} onPlayNote={() => {}} />
                {!showViz ? (
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-3 items-center">
                      {[{ href: L.am, icon: <Music size={16} />, l: 'Apple Music' }, { href: L.yt, icon: <Youtube size={16} />, l: 'YouTube' }, { href: L.sp, icon: <SpotifyIcon size={15} />, l: 'Spotify' }].map(s => (
                        <Magnetic key={s.l} strength={0.2}>
                          <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.l} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.25] flex items-center justify-center transition-all duration-400 hover:scale-110 active:scale-95 text-zinc-400 hover:text-white">{s.icon}</a>
                        </Magnetic>
                      ))}
                    </div>
                    <button onClick={() => setShowViz(true)} className="px-8 py-3 border border-white/20 hover:border-white/50 text-white text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-white/10 active:scale-95 transition-all duration-400 rounded-full backdrop-blur-sm">Interact</button>
                  </div>
                ) : (
                  <button onClick={() => setShowViz(false)} className="group w-14 h-14 flex items-center justify-center border border-white/15 rounded-full hover:bg-white/10 active:scale-90 transition-all"><X size={18} className="text-white group-hover:rotate-90 transition-transform duration-400" /></button>
                )}
              </div>
              {/* Fix #4: removed scroll text and chevron */}
            </div>
          </section>

          {/* MARQUEE */}
          {!showViz && (
            <div className="relative z-20 -mt-px">
              <div className="w-full py-4 sm:py-5 transform -skew-y-[0.5deg] origin-left" style={{ background: 'linear-gradient(135deg, #0a0014 0%, #081222 50%, #0c0a26 100%)' }}>
                <Marquee speed={40}>{[...Array(8)].map((_, i) => <span key={i} className="text-white/35 text-xs sm:text-base md:text-xl uppercase tracking-[0.15em] mx-6 sm:mx-10" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>FRACTALS — OUT NOW <span className="text-cyan-400/35">✦</span> JAZZ FUSION <span className="text-blue-400/35">✦</span> STREAM <span className="text-indigo-400/35">✦</span></span>)}</Marquee>
              </div>
            </div>
          )}

          {/* ABOUT — LEGACY */}
          <section id="about" className="min-h-screen flex items-center justify-center py-32 relative overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
              <img src="/images/suhas.jpeg" alt="" className="w-full h-full object-cover opacity-90 object-center" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-7xl">
              <Reveal>
                <div className="space-y-8">
                  <h2 className="text-4xl md:text-6xl uppercase tracking-tighter" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>About</h2>
                  <div className="w-20 h-1 bg-cyan-500" />
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="space-y-6 text-zinc-300 text-xl leading-relaxed font-light mt-0 md:mt-[65px]">
                  <p>Suhas is a pianist and composer exploring the progressive Jazz Fusion space.</p>
                  <p>Drawing from modern jazz, Suhas's music indulges in constantly evolving polyrhythms, and improvisation into rhythmically rich themes, rooted in live performance.</p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* MUSIC — Fix #11: vinyl now has visible border/shadow against dark bg */}
          <section id="music" className="min-h-screen flex items-center py-28 md:py-36 bg-black relative overflow-hidden border-t border-zinc-900">
            <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[150px]" /></div>
            <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
              <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="lg:w-1/2 flex justify-center">
                  <Reveal direction="scale" delay={100}>
                    <div className="relative">
                      <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[460px] md:h-[460px] animate-spin-slow">
                        {/* Fix #11: brighter vinyl with visible grooves */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border-2 border-zinc-700/50 flex items-center justify-center shadow-[0_0_80px_rgba(34,211,238,0.08)] overflow-hidden">
                          {/* Vinyl grooves - more visible */}
                          {[2,5,8,11,14,17,20,23,26].map((v,i) => <div key={i} className="absolute rounded-full border" style={{ inset: `${v*4}px`, borderColor: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)' }} />)}
                          {/* Light reflection on vinyl */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
                          {/* Center label */}
                          <div className="w-[55%] h-[55%] rounded-full relative overflow-hidden border-2 border-zinc-600/50 shadow-lg">
                            <img src="/images/album-art.PNG" alt="Fractals" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.03] to-black/30" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12%] h-[12%] rounded-full bg-black border-2 border-zinc-600/50" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -inset-8 rounded-full bg-cyan-500/[0.03] blur-xl pointer-events-none animate-pulse" />
                    </div>
                  </Reveal>
                </div>
                <div className="lg:w-1/2 space-y-7">
                  <Reveal><span className="text-cyan-400 tracking-[0.35em] text-[9px] sm:text-[10px] uppercase block mb-3 font-bold">Single · 2024</span></Reveal>
                  <CharReveal text="Fractals" delay={100} stagger={35} className="text-[clamp(3.5rem,11vw,8rem)] leading-[0.85] tracking-[-0.04em] mb-6" />
                  <Reveal delay={300}><div className="relative pl-6 border-l-2 border-cyan-500/30"><p className="text-zinc-400 text-[15px] sm:text-[16px] leading-relaxed max-w-md font-medium">"An exploration of polyrhythms and melodic improvisation. Suhas channels live interaction and rhythmic nuance into a modern jazz fusion sound."</p></div></Reveal>
                  <Reveal delay={450}>
                    <div className="flex flex-wrap gap-3 pt-3">
                      {[{ l:'Apple Music', h:L.am },{ l:'Spotify', h:L.sp },{ l:'Youtube', h:L.yt }].map(({ l, h }) => (
                        <Magnetic key={l} strength={0.1}><a href={h} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 px-6 py-3 border border-white/[0.07] hover:border-cyan-500/40 hover:bg-cyan-500/[0.04] active:scale-95 transition-all duration-400 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] rounded-full text-zinc-400 hover:text-white font-bold">{l}<ArrowUpRight size={10} className="opacity-0 group-hover:opacity-70 transition-all" /></a></Magnetic>
                      ))}
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          {/* CONTRIBUTE — Fix #5: smaller text on mobile */}
          <section id="contribute" className="min-h-screen flex items-center justify-center py-24 relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black border-t border-zinc-900">
            <div className="container mx-auto px-6 max-w-6xl relative z-10">
              <Reveal>
                <div className="mb-12 sm:mb-16 text-center">
                  <h2 className="text-3xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>Contribute</h2>
                  <div className="w-20 h-1 bg-cyan-500 mx-auto" />
                  <p className="text-zinc-300 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mt-6 sm:mt-8 font-light leading-relaxed">Help bring the next studio album to life</p>
                  <p className="text-cyan-400 text-base sm:text-lg font-medium mt-3 sm:mt-4">Your support makes all the difference</p>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                {[
                  { icon:<DollarSign size={36} />, title:'Kickstarter', desc:'Back the production run and get exclusive rewards', color:'green', items:['Limited edition vinyl pressings','Exclusive artwork & packaging','Early access to new releases'] },
                  { icon:<Heart size={36} />, title:'GoFundMe', desc:'Direct support for studio recording sessions', color:'yellow', items:['Professional studio recording','Equipment & production costs','Mixing & mastering sessions'] }
                ].map((c, idx) => (
                  <Reveal key={c.title} delay={idx * 100}>
                    {/* Fix #5: smaller padding on mobile */}
                    <div className={`group relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 p-6 sm:p-10 flex flex-col items-center gap-5 sm:gap-6 transition-all duration-500 rounded-2xl cursor-default overflow-hidden ${c.color === 'green' ? 'hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20' : 'hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/20'}`}>
                      <div className={`absolute inset-0 ${c.color === 'green' ? 'bg-gradient-to-br from-green-500/5 to-transparent' : 'bg-gradient-to-br from-yellow-500/5 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      <div className="relative z-10 w-full flex flex-col items-center gap-5 sm:gap-6 flex-1">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-500 shadow-lg ${c.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50' : 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/50'}`}>
                          <span className="text-white">{c.icon}</span>
                        </div>
                        <div className="text-center">
                          <h3 className="text-2xl sm:text-3xl uppercase mb-2 sm:mb-3 text-white" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>{c.title}</h3>
                          <p className="text-zinc-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-sm">{c.desc}</p>
                        </div>
                        <div className="w-full space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-zinc-400 border-t border-zinc-800 pt-4 sm:pt-6 flex-1">
                          {c.items.map((it, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              <span>{it}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto pt-3 sm:pt-4">
                          <span className={`inline-block text-sm sm:text-lg font-bold uppercase tracking-widest ${c.color === 'green' ? 'text-green-500' : 'text-yellow-500'} border-b-2 border-transparent group-hover:border-current transition-all pb-1`}>Coming Soon</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* STORE — Fix #9: album art bg behind store */}
          <section id="store" className="min-h-screen flex items-center justify-center py-24 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
            {/* Fix #9: album art behind store */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <img src="/images/album-art.PNG" alt="" className="w-full h-full object-cover opacity-[0.04] blur-[80px] scale-125" />
            </div>
            <div className="container mx-auto px-6 relative z-10">
              <Reveal>
                <div className="flex justify-between items-end mb-16">
                  <div>
                    <h2 className="text-4xl md:text-6xl uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>Store</h2>
                    <p className="text-zinc-500 tracking-widest uppercase text-xs font-bold">Official Merchandise</p>
                  </div>
                  <span className="hidden md:flex items-center gap-2 text-zinc-400 cursor-default text-sm uppercase tracking-widest font-bold">View All <ArrowRight size={16} /></span>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                {store.map((item, i) => {
                  const Tag = item.link ? 'a' : 'div';
                  const props = item.link ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' } : {};
                  return (
                    <Reveal key={item.id} delay={i * 150}>
                      <Tag {...props} className={`group block ${item.link ? 'cursor-pointer' : 'cursor-default'}`}>
                        <div className="aspect-square bg-zinc-900 mb-6 relative overflow-hidden border border-zinc-800">
                          {imgs[item.type] && <img src={imgs[item.type]} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105" />}
                          {item.link && <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm"><span className="text-white font-bold uppercase tracking-widest border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors text-xs">Buy Now</span></div>}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-heading)" }}>{item.name}</h3>
                            <p className="text-zinc-500 text-xs">{item.desc}</p>
                            {item.soldOut && <p className="text-red-500 text-xs mt-1 font-bold">Sold Out</p>}
                          </div>
                          <span className="text-cyan-400 font-mono text-lg">{item.price}</span>
                        </div>
                      </Tag>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CONNECT */}
          <section id="connect" className="min-h-screen flex items-center py-28 relative overflow-hidden bg-[#030306] border-t border-zinc-900">
            <div className="absolute inset-0 pointer-events-none opacity-15"><div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px]" /><div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[130px]" /></div>
            <div className="container mx-auto px-6 max-w-5xl relative z-10">
              <div className="text-center mb-14">
                <Reveal><span className="text-cyan-400 tracking-[0.4em] text-[9px] sm:text-[10px] uppercase block mb-5 font-bold">Follow the journey</span></Reveal>
                <CharReveal text="Connect" className="text-[clamp(2.5rem,8vw,5.5rem)] tracking-[-0.04em] leading-[0.9] mb-4 justify-center" stagger={30} />
                <Reveal delay={200}><div className="w-12 h-[2px] bg-cyan-500 mx-auto" /></Reveal>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {[{ href:L.ig, icon:<Instagram size={26} />, name:'Instagram', handle:'@suhas.als' },{ href:L.yt, icon:<Youtube size={26} />, name:'YouTube', handle:'@suhasmusicofficial' },{ href:L.am, icon:<Headphones size={26} />, name:'Music', handle:'Stream now' }].map((s, i) => (
                  <Reveal key={s.name} delay={i * 80}>
                    <Magnetic strength={0.06} className="w-full">
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-4 p-7 bg-white/[0.015] border border-white/[0.05] hover:border-white/[0.12] active:border-white/[0.12] transition-all duration-500 rounded-2xl hover:bg-white/[0.03] active:bg-white/[0.03] w-full active:scale-[0.98]">
                        <div className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-all duration-400 border border-white/[0.06] text-zinc-400 group-hover:text-white">{s.icon}</div>
                        <div className="text-center"><p className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>{s.name}</p><p className="text-[11px] text-zinc-500 font-medium">{s.handle}</p></div>
                      </a>
                    </Magnetic>
                  </Reveal>
                ))}
              </div>
              <div className="mt-20 pt-12 border-t border-white/[0.04]">
                <Reveal delay={200}>
                  <div className="text-center max-w-2xl mx-auto">
                    <span className="text-cyan-400 tracking-[0.4em] text-[9px] sm:text-[10px] uppercase block mb-5 font-bold">Inquiries</span>
                    <h3 className="text-xl md:text-2xl mb-5" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>Bookings & Collaborations</h3>
                    <p className="text-zinc-500 text-sm mb-6 font-medium">Live performances, studio sessions, and collaborations</p>
                    <Magnetic strength={0.1}><a href="mailto:suhasmusicofficial@gmail.com" className="group inline-flex items-center gap-2.5 text-base text-zinc-300 hover:text-cyan-400 active:text-cyan-400 transition-all duration-400 font-medium"><Mail size={16} className="opacity-30 group-hover:opacity-100 transition-opacity" />suhasmusicofficial@gmail.com</a></Magnetic>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-black py-12 border-t border-white/[0.04] relative z-10">
            <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="text-center md:text-left">
                  <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-10 w-auto mb-2 mx-auto md:mx-0" />
                  <p className="text-zinc-600 text-[9px] uppercase tracking-[0.35em] font-bold">&copy; 2026 Suhas Music. All Rights Reserved.</p>
                </div>
                <div className="flex gap-3">
                  {[{ h:L.ig, i:<Instagram size={16}/> },{ h:L.yt, i:<Youtube size={16}/> },{ h:L.amA, i:<Music size={16}/> },{ h:L.spA, i:<SpotifyIcon size={14}/> }].map(({ h, i }, idx) => <a key={idx} href={h} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 hover:text-white active:text-white hover:border-white/[0.15] active:scale-95 transition-all duration-400">{i}</a>)}
                </div>
              </div>
              <div className="flex gap-7 text-[9px] uppercase text-zinc-600 justify-center md:justify-end tracking-[0.25em] font-bold">
                {['Privacy','Terms','Contact'].map(t => <a key={t} href="mailto:suhasmusicofficial@gmail.com" className="hover:text-zinc-300 active:text-zinc-300 transition-colors py-2">{t}</a>)}
              </div>
            </div>
          </footer>

          <style>{`
            :root { --font-heading: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif; }
            * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; -webkit-tap-highlight-color: transparent; }
            html { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
            body { overscroll-behavior-y: none; }
            ::-webkit-scrollbar { width: 3px; }
            ::-webkit-scrollbar-track { background: #000; }
            ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
            ::-webkit-scrollbar-thumb:hover { background: #333; }
            .hero-gradient-text {
              background: linear-gradient(135deg, #22d3ee 0%, #e0e7ff 20%, #fff 38%, #93c5fd 58%, #3b82f6 78%, #22d3ee 100%);
              background-size: 300% 300%;
              -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
              animation: hero-shimmer 7s ease-in-out infinite;
            }
            @keyframes hero-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 25s linear infinite; }
            @keyframes float-particle { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.05; } 25% { transform: translateY(-35px) translateX(12px); opacity: 0.3; } 50% { transform: translateY(-18px) translateX(-8px); opacity: 0.1; } 75% { transform: translateY(-50px) translateX(6px); opacity: 0.25; } }
            :focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
            @supports(height: 100dvh) { #home { height: 100dvh; } }
          `}</style>
        </div>
      )}
    </>
  );
};

const App = () => <SmoothScrollProvider><SuhasWebsite /></SmoothScrollProvider>;
export default App;