import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Instagram, Youtube, Music, ArrowRight, ExternalLink, Headphones, ChevronRight } from 'lucide-react';

import RevealOnScroll from './components/RevealOnScroll';
import MusicSection from './components/MusicSection';

// ─── FEATURE 1: Font Loader (Michroma) ───────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.querySelector('link[data-suhas-fonts]')) return;

    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.googleapis.com';
    preconnect.dataset.suhasFonts = 'true';
    document.head.appendChild(preconnect);

    const preconnectStatic = document.createElement('link');
    preconnectStatic.rel = 'preconnect';
    preconnectStatic.href = 'https://fonts.gstatic.com';
    preconnectStatic.crossOrigin = 'anonymous';
    preconnectStatic.dataset.suhasFonts = 'true';
    document.head.appendChild(preconnectStatic);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Michroma&display=swap';
    link.dataset.suhasFonts = 'true';
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── FEATURE 1: Loading Screen ───────────────────────────────────────────────
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => setPhase('revealing'), 200);
        setTimeout(() => {
          setPhase('done');
          onCompleteRef.current();
        }, 1000);
      } else {
        setProgress(Math.floor(p));
      }
    }, 80);
    return () => clearInterval(iv);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center transition-opacity duration-600 ${
        phase === 'revealing' ? 'opacity-0' : ''
      }`}
      style={{ transition: 'opacity 0.6s ease' }}
    >
      <div className="flex flex-col items-center gap-8">
        <img
          src="/images/suhas-productions-new-logo.PNG"
          alt="SUHAS"
          className="h-20 md:h-28 w-auto"
          style={{
            opacity: phase === 'revealing' ? 0 : 1,
            transform: phase === 'revealing' ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        <div className="w-56 h-[2px] bg-zinc-900 relative overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] tracking-[0.5em] uppercase text-zinc-600 font-mono font-medium">
          {progress}%
        </span>
      </div>
    </div>
  );
};

// --- Advanced Interactive Music Keyboard with Effects ---
const AbstractPiano = ({ isExpanded, onPlayNote }) => {
  const samplerRef = useRef(null);
  const [Tone, setTone] = useState(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [recording, setRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const effectsRef = useRef({});
  const [reverbMix] = useState(0.3);
  const [delayMix] = useState(0);
  const [filterFreq] = useState(5000);
  const [distortion] = useState(0);
  const [arpeggiator] = useState(false);
  const [octaveShift, setOctaveShift] = useState(0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    script.onload = () => {
      setTone(window.Tone);
      const sampler = new window.Tone.Sampler({
        urls: {
          C4: 'https://tonejs.github.io/audio/salamander/C4.mp3',
          'D#4': 'https://tonejs.github.io/audio/salamander/Ds4.mp3',
          'F#4': 'https://tonejs.github.io/audio/salamander/Fs4.mp3',
          A4: 'https://tonejs.github.io/audio/salamander/A4.mp3',
          C5: 'https://tonejs.github.io/audio/salamander/C5.mp3',
          'D#5': 'https://tonejs.github.io/audio/salamander/Ds5.mp3',
          'F#5': 'https://tonejs.github.io/audio/salamander/Fs5.mp3',
          A5: 'https://tonejs.github.io/audio/salamander/A5.mp3',
        },
        release: 1,
        onload: () => setAudioLoaded(true),
      });

      const reverb = new window.Tone.Reverb({ decay: 2.5, wet: reverbMix }).toDestination();
      const delay = new window.Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.4, wet: delayMix });
      const filter = new window.Tone.Filter({ frequency: filterFreq, type: 'lowpass', rolloff: -24 });
      const distortionEffect = new window.Tone.Distortion({ distortion, wet: distortion > 0 ? 0.5 : 0 });

      sampler.connect(distortionEffect);
      distortionEffect.connect(filter);
      filter.connect(delay);
      delay.connect(reverb);

      samplerRef.current = sampler;
      effectsRef.current = { reverb, delay, filter, distortionEffect };
      setAudioLoaded(true);
    };

    document.body.appendChild(script);
    return () => {
      samplerRef.current?.dispose();
      Object.values(effectsRef.current).forEach((e) => e?.dispose?.());
      if (script.parentNode) document.body.removeChild(script);
    };
  }, []);

  const playNote = async (index, velocity = 0.8, release = true) => {
    if (onPlayNote) onPlayNote(index);
    if (!samplerRef.current || !Tone) return;

    try {
      await Tone.start();
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const baseOctave = isExpanded ? 3 : 4;
      const octave = baseOctave + octaveShift + Math.floor(index / 12);
      const noteIndex = index % 12;
      const noteName = notes[noteIndex] + octave;

      if (recording) setRecordedNotes((prev) => [...prev, { note: noteName, time: Tone.now(), velocity }]);
      setActiveNotes((prev) => new Set([...prev, index]));

      if (arpeggiator) {
        const pattern = [noteName, notes[(noteIndex + 4) % 12] + octave, notes[(noteIndex + 7) % 12] + octave];
        pattern.forEach((note, i) =>
          setTimeout(() => samplerRef.current.triggerAttackRelease(note, '16n', undefined, velocity), i * 100)
        );
      } else {
        samplerRef.current.triggerAttackRelease(noteName, '2n', undefined, velocity);
      }

      if (release) {
        setTimeout(() => {
          setActiveNotes((prev) => {
            const s = new Set(prev);
            s.delete(index);
            return s;
          });
        }, 200);
      }
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const playRecording = () => {
    if (!recordedNotes.length || !samplerRef.current || !Tone) return;
    setIsPlaying(true);
    const startTime = Tone.now();
    const firstNoteTime = recordedNotes[0].time;

    recordedNotes.forEach(({ note, time, velocity }) => {
      samplerRef.current.triggerAttackRelease(note, '2n', startTime + (time - firstNoteTime), velocity);
    });

    setTimeout(() => setIsPlaying(false), (recordedNotes[recordedNotes.length - 1].time - firstNoteTime + 2) * 1000);
  };

  const numKeys = isExpanded ? 37 : 13;

  return (
    <div className="w-full space-y-6">
      <div
        className={`flex gap-1 items-start justify-center relative z-30 transition-all duration-700 ${
          isExpanded ? 'h-40 mt-auto mb-8' : 'h-24 mix-blend-normal'
        }`}
      >
        {[...Array(numKeys)].map((_, i) => {
          const octaveIndex = i % 12;
          const isBlackKey = [1, 3, 6, 8, 10].includes(octaveIndex);
          const isActive = activeNotes.has(i);

          return (
            <button
              key={i}
              onMouseDown={(e) => playNote(i, 0.5 + (e.clientY / window.innerHeight) * 0.5)}
              onTouchStart={(e) => {
                e.preventDefault();
                playNote(i, 0.5 + (e.touches[0].clientY / window.innerHeight) * 0.5);
              }}
              className={`transition-all duration-100 ease-out cursor-pointer active:scale-95 relative ${
                isBlackKey
                  ? `z-10 rounded-b-lg border shadow-lg shadow-black/80 ${
                      isActive ? 'bg-cyan-400 border-cyan-300' : 'bg-zinc-950 border-zinc-800 active:bg-zinc-800'
                    } ${isExpanded ? 'w-6 h-24 -mx-3' : 'w-5 h-14 -mx-2.5'}`
                  : `rounded-b-lg border-t-2 border-x border-b hover:from-white/35 hover:via-white/25 active:translate-y-0.5 active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.25)] backdrop-blur-lg transition-all duration-100 ${
                      isActive
                        ? 'bg-gradient-to-b from-cyan-400/80 via-cyan-300/70 to-cyan-200/60 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]'
                        : 'bg-gradient-to-b from-white/30 via-white/20 to-white/15 border-white/40 shadow-[0_2px_8px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]'
                    } ${isExpanded ? 'w-10 h-40' : 'w-8 h-24'}`
              }`}
              aria-label="Play piano note"
            >
              {!isBlackKey && (
                <>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-white/40 rounded-full blur-[1px]" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-1.5 bg-white/20 rounded-full blur-[2px]" />
                  {isActive && <div className="absolute inset-0 bg-cyan-400/30 rounded-b-lg animate-pulse" />}
                </>
              )}
            </button>
          );
        })}
      </div>

      {isExpanded && (
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 pt-4 px-2">
          <button
            onClick={() => setRecording(!recording)}
            className={`group relative px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition-all ${
              recording
                ? 'bg-red-500/20 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-white/5 border-2 border-white/20 text-zinc-300 hover:border-cyan-500/60 hover:bg-white/10'
            }`}
          >
            <span className="relative z-10">{recording ? '⏺ Rec' : '⏺ Record'}</span>
          </button>

          <button
            onClick={playRecording}
            disabled={!recordedNotes.length || isPlaying}
            className={`group relative px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition-all ${
              isPlaying
                ? 'bg-green-500/20 border-2 border-green-500 text-green-400 shadow-lg shadow-green-500/30'
                : recordedNotes.length > 0
                  ? 'bg-white/5 border-2 border-white/20 text-zinc-300 hover:border-cyan-500/60 hover:bg-white/10'
                  : 'bg-white/5 border-2 border-white/10 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span className="relative z-10">▶ Play ({recordedNotes.length})</span>
          </button>

          <button
            onClick={() => {
              setRecordedNotes([]);
              setIsPlaying(false);
            }}
            disabled={!recordedNotes.length}
            className={`group relative px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition-all ${
              recordedNotes.length > 0
                ? 'bg-white/5 border-2 border-white/20 text-zinc-300 hover:border-red-500/60 hover:bg-red-900/20'
                : 'bg-white/5 border-2 border-white/10 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span className="relative z-10">⏹ Clear</span>
          </button>

          <div className="flex items-center gap-2 bg-white/5 border-2 border-white/20 rounded-full px-3 md:px-4 py-2 md:py-3">
            <button
              onClick={() => setOctaveShift(Math.max(-2, octaveShift - 1))}
              className="text-zinc-300 hover:text-cyan-400 font-bold transition-colors text-lg"
            >
              −
            </button>
            <span className="text-xs md:text-sm font-bold text-zinc-400 min-w-[60px] md:min-w-[70px] text-center">
              Oct {octaveShift > 0 ? '+' : ''}
              {octaveShift}
            </span>
            <button
              onClick={() => setOctaveShift(Math.min(2, octaveShift + 1))}
              className="text-zinc-300 hover:text-cyan-400 font-bold transition-colors text-lg"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Three.js Visualizer ---
const GeometricVisualizer = ({ noteTrigger }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;

    script.onload = () => {
      if (!mountRef.current) return;

      const THREE = window.THREE;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);

      const coreMesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2, 1),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.8 })
      );
      scene.add(coreMesh);

      const outerMesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.5, 1),
        new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.15 })
      );
      scene.add(outerMesh);

      const particlesCount = 1000;
      const posArray = new Float32Array(particlesCount * 3);
      const velocityArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
        velocityArray[i] = (Math.random() - 0.5) * 0.02;
      }

      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeo.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));

      const particlesMesh = new THREE.Points(
        particlesGeo,
        new THREE.PointsMaterial({
          size: 0.03,
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        })
      );
      scene.add(particlesMesh);

      let time = 0;
      const animate = () => {
        requestAnimationFrame(animate);
        time += 0.01;

        coreMesh.rotation.x += 0.005;
        coreMesh.rotation.y += 0.008;
        const cs = 1 + Math.sin(time * 2) * 0.05;
        coreMesh.scale.set(cs, cs, cs);

        outerMesh.rotation.x -= 0.002;
        outerMesh.rotation.y -= 0.003;
        const os = 1 + Math.sin(time * 1.5) * 0.03;
        outerMesh.scale.set(os, os, os);

        const p = particlesMesh.geometry.attributes.position.array;
        const v = particlesMesh.geometry.attributes.velocity.array;
        for (let i = 0; i < p.length; i += 3) {
          p[i] += v[i];
          p[i + 1] += v[i + 1];
          p[i + 2] += v[i + 2];
          if (Math.abs(p[i]) > 10) v[i] *= -1;
          if (Math.abs(p[i + 1]) > 10) v[i + 1] *= -1;
          if (Math.abs(p[i + 2]) > 10) v[i + 2] *= -1;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;

        particlesMesh.rotation.y = time * 0.05;
        camera.position.x = Math.sin(time * 0.3) * 0.3;
        camera.position.y = Math.cos(time * 0.2) * 0.3;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mountRef.current && renderer.domElement.parentNode) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    };

    document.body.appendChild(script);
    return () => {
      if (script.parentNode) document.body.removeChild(script);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-90 animate-in fade-in duration-1000" />;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SuhasWebsite = () => {
  const [loaded, setLoaded] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [noteTrigger, setNoteTrigger] = useState({ timestamp: 0, noteIndex: null });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  const [heroEmail, setHeroEmail] = useState('');
  const [heroEmailSubmitted, setHeroEmailSubmitted] = useState(false);
  const [connectEmail, setConnectEmail] = useState('');
  const [connectEmailSubmitted, setConnectEmailSubmitted] = useState(false);

  const handleEmailSubmit = (email, setSubmitted, setEmail) => (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    // TODO: wire up to email service (Mailchimp / Formspree)
    setSubmitted(true);
    setEmail('');
  };

  const handleNotePlay = (noteIndex) => setNoteTrigger({ timestamp: Date.now(), noteIndex });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const ids = ['home', 'about', 'music', 'connect'];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { threshold: 0, rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isMenuOpen]);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Music', href: '#music' },
    { name: 'Connect', href: '#connect' },
  ];

  const storeItems = [
    {
      id: 1,
      name: 'Fractals (Single)',
      price: '$1.29',
      desc: 'Digital Copy of Fractals (Single)',
      type: 'Digital Download',
      link: 'https://music.apple.com/us/album/fractals-single/1768715442',
      soldOut: false,
    },
    { id: 2, name: 'Fractals CD', price: '$5.00', desc: 'Limited Digipak Edition', type: 'CD', link: null, soldOut: true },
    { id: 3, name: 'Fractals Tee', price: '$30.00', desc: 'Heavyweight Cotton - Black', type: 'Apparel', link: null, soldOut: true },
  ];

  const appleMusicLink = 'https://music.apple.com/us/album/fractals-single/1768715442';
  const spotifyLink = 'https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6?si=KcFSYSf9Q2SwzGrJjKejNg';
  const youtubeLink = 'https://www.youtube.com/@Suhasmusicofficial';
  const instagramLink = 'https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr';
  const appleMusicArtistLink = 'https://music.apple.com/us/artist/suhas/1768715441';
  const spotifyArtistLink = 'https://open.spotify.com/artist/7jrJXlWGH3Z1L3r7q4qY8K';
  const youtubeCreatorLink = 'https://www.youtube.com/@Suhasmusicofficial';

  const imgMap = { 'Digital Download': '/images/album-art.PNG', CD: '/images/cd-art.png', Apparel: '/images/tshirt.png' };

  return (
    <>
      <FontLoader />
      <LoadingScreen onComplete={() => setLoaded(true)} />

      {loaded && (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black [overflow-x:clip]">
          <div
            className="fixed top-0 left-0 h-[2px] z-[60] pointer-events-none"
            style={{
              width: `${scrollProgress * 100}%`,
              background: 'linear-gradient(90deg, #22d3ee, #3b82f6, #6366f1)',
              transition: 'width 0.05s linear',
            }}
          />

          {/* Navigation */}
          <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
              <a href="#" className="z-50 relative flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-16 md:h-20 w-auto" />
              </a>

              <div className="hidden md:flex items-center space-x-10">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`text-sm uppercase tracking-widest transition-colors relative group font-bold ${
                      activeSection === link.href.slice(1) ? 'text-cyan-400' : 'text-white hover:text-cyan-400'
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-cyan-500 transition-all duration-400 ${
                        activeSection === link.href.slice(1) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </a>
                ))}
                <span
                  className="ml-2 px-5 py-2.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-[0.15em] cursor-not-allowed select-none"
                  style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 700 }}
                  title="Fundraiser launching soon"
                >
                  Fundraiser Coming Soon
                </span>
              </div>

              <div className="md:hidden flex items-center gap-3 z-50 relative">
                <span
                  className="px-4 py-2 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.12em] cursor-not-allowed select-none"
                  style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 700 }}
                  title="Fundraiser launching soon"
                >
                  Coming Soon
                </span>
                <button onClick={() => setIsMenuOpen(true)} className="text-white hover:text-cyan-400">
                  <Menu size={28} />
                </button>
              </div>
            </div>

            {isMenuOpen && (
              <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center overflow-hidden" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="absolute top-6 left-6">
                  <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-16 w-auto" />
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white hover:text-cyan-400 transition-colors"
                >
                  <X size={32} />
                </button>
                <div className="flex flex-col items-center space-y-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-4xl font-bold uppercase hover:text-cyan-400 transition-colors tracking-tighter"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  ))}
                  <span
                    className="mt-4 px-8 py-4 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-lg font-bold uppercase tracking-wider cursor-not-allowed select-none"
                    style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 700 }}
                  >
                    Fundraiser Coming Soon
                  </span>
                </div>
              </div>
            )}
          </nav>

          {/* Hero */}
          <section id="home" className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
            {showVisualizer && <GeometricVisualizer noteTrigger={noteTrigger} />}
            {!showVisualizer && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0">
                  <video
                    ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}); } }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover fixed top-0 left-0"
                    style={{ opacity: 0.85 }}
                  >
                    <source src="/images/Shards_Video_Loop.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
                </div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-[100px]" />
              </div>
            )}

            <div className={`absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20 z-0 pointer-events-none transition-opacity duration-1000 ${showVisualizer ? 'opacity-80' : 'opacity-100'}`} />

            <div className={`relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-8 flex flex-col items-center transition-all duration-1000 ${showVisualizer ? 'justify-end h-full pb-8 md:pb-12 pt-20 md:pt-32' : 'justify-center pt-0'}`}>
              <div className={`transition-all duration-700 flex flex-col items-center gap-8 ${showVisualizer ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'opacity-100'}`}>
                <RevealOnScroll>
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="text-cyan-400 tracking-[0.3em] text-sm md:text-base font-bold uppercase shadow-black drop-shadow-lg">
                      Coming Soon — April 2026
                    </h2>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll delay={100}>
                  <h1
                    className="text-[clamp(2rem,13vw,3.75rem)] md:text-8xl lg:text-9xl font-black tracking-tighter leading-none drop-shadow-2xl"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
                      e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
                    }}
                    style={{ '--mouse-x': '50%', '--mouse-y': '50%' }}
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-500 animate-gradient-x gradient-mouse">
                      FRACTALS
                    </span>
                  </h1>
                  <p className="mt-4 text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide shadow-black drop-shadow-md">
                    A journey into the chaotic symmetry of Jazz.
                  </p>
                </RevealOnScroll>
              </div>

              <RevealOnScroll delay={200}>
                <div className={`flex flex-col gap-6 md:gap-8 justify-center items-center w-full ${showVisualizer ? 'max-w-full' : ''}`}>
                  <AbstractPiano isExpanded={showVisualizer} onPlayNote={handleNotePlay} />
                  <div className="flex flex-col gap-4 items-center w-full">
                    {!showVisualizer ? (
                      <>
                      <div className="flex gap-4 items-center flex-wrap justify-center">
                        <a href={appleMusicLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 flex items-center justify-center transition-all duration-300 hover:scale-110">
                          <Music size={20} className="text-white" />
                        </a>
                        <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 flex items-center justify-center transition-all duration-300 hover:scale-110">
                          <Youtube size={20} className="text-white" />
                        </a>
                        <a href={spotifyLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 flex items-center justify-center transition-all duration-300 hover:scale-110">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                        </a>
                      </div>

                      {/* Hero email subscribe */}
                      <div className="mt-2 w-full max-w-sm mx-auto">
                        {heroEmailSubmitted ? (
                          <p className="text-center text-cyan-400 text-sm font-semibold tracking-wide py-3 animate-in fade-in duration-500">
                            ✓ You're in — we'll be in touch!
                          </p>
                        ) : (
                          <form
                            onSubmit={handleEmailSubmit(heroEmail, setHeroEmailSubmitted, setHeroEmail)}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            <input
                              type="email"
                              value={heroEmail}
                              onChange={(e) => setHeroEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-500/60 transition-colors"
                            />
                            <button
                              type="submit"
                              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all whitespace-nowrap"
                            >
                              Get Early Access
                            </button>
                          </form>
                        )}
                        <p className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-2">
                          Early access + 20% off when the merch store opens
                        </p>
                      </div>
                      </>
                    ) : (
                      <button onClick={() => setShowVisualizer(false)} className="group relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                        <X size={20} className="md:hidden text-white group-hover:scale-110 transition-transform duration-300" />
                        <X size={24} className="hidden md:block text-white group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute -bottom-8 text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">Close</span>
                      </button>
                    )}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          {/* Marquee */}
          {!showVisualizer && (
            <div className="w-full relative z-20 -mt-16">
              <div className="absolute inset-0 bg-black/60 z-0" />
              <div
                className="w-full overflow-hidden py-4 whitespace-nowrap transform -skew-y-1 origin-left relative z-10"
                style={{
                  background: 'linear-gradient(to right, #360225, #2f43a983, #5f188291)',
                  backgroundSize: '200% 100%',
                  animation: 'gradient-shift 15s ease infinite',
                }}
              >
                <div className="inline-block" style={{ animation: 'marquee 60s linear infinite' }}>
                  {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-white font-black text-xl md:text-3xl mx-8 uppercase tracking-widest italic">
                      FRACTALS — COMING SOON • APRIL 2026 • PRESAVE NOW • PROGRESSIVE JAZZ FUSION •
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          <section id="about" className="min-h-screen flex items-center relative overflow-hidden bg-black border-t border-zinc-900" style={{ scrollMarginTop: '80px' }}>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
              {/* Left: Image */}
              <RevealOnScroll>
                <div className="relative w-full h-[70vh] lg:h-full lg:min-h-screen overflow-hidden">
                  <img
                    src="/images/suhas4.jpg"
                    alt="Suhas"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.92)', objectPosition: 'center top' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                </div>
              </RevealOnScroll>

              {/* Right: Text */}
              <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20 lg:py-32 relative z-10">
                <RevealOnScroll delay={100}>
                  <div className="space-y-6 mb-10">
                    <h2 className="text-5xl md:text-6xl uppercase tracking-tighter" style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 800 }}>
                      About
                    </h2>
                    <div className="w-16 h-[2px] bg-cyan-500" />
                  </div>
                </RevealOnScroll>

                <RevealOnScroll delay={200}>
                  <div className="space-y-6 text-zinc-300 text-base md:text-lg leading-relaxed max-w-xl">
                    <p>
                      Suhas is a pianist and composer exploring music that sits at the intersection of progressive jazz and fusion.
                    </p>
                    <p>
                      He learned to play by ear before he could read, and spent years committing to writing music entirely on his own terms.
                    </p>
                    <p>
                      His music is open to interpretation. Listeners hear the same track and walk away with completely different experiences. The music is melodic but complex — always leading somewhere you do not expect.
                    </p>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          {/* Music */}
          <section id="music">
            <MusicSection appleMusicLink={appleMusicLink} spotifyLink={spotifyLink} youtubeLink={youtubeLink} />
          </section>

          {/* STORE (hidden for now) */}
          <section id="store" className="min-h-screen flex items-center justify-center py-24 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden" style={{ display: 'none' }}>
            {/* Store content (blurred behind overlay) */}
            <div className="container mx-auto px-6">
              <RevealOnScroll>
                <div className="flex justify-between items-end mb-16">
                  <div>
                    <h2 className="text-4xl md:text-6xl uppercase tracking-tight mb-2" style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 800 }}>
                      Store
                    </h2>
                    <p className="text-zinc-500 tracking-widest uppercase text-xs font-bold">Official Merchandise</p>
                  </div>
                  <span className="hidden md:flex items-center gap-2 text-zinc-400 cursor-default text-sm uppercase tracking-widest">
                    View All <ArrowRight size={16} />
                  </span>
                </div>
              </RevealOnScroll>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                {storeItems.map((item, i) => {
                  const Tag = item.link ? 'a' : 'div';
                  const props = item.link ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' } : {};
                  return (
                    <RevealOnScroll key={item.id} delay={i * 150}>
                      <Tag {...props} className={`group block ${item.link ? 'cursor-pointer' : 'cursor-default'}`}>
                        <div className="aspect-square bg-zinc-900 mb-6 relative overflow-hidden border border-zinc-800">
                          {imgMap[item.type] && (
                            <img
                              src={imgMap[item.type]}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold uppercase mb-1" style={{ fontFamily: "'Michroma', sans-serif" }}>
                              {item.name}
                            </h3>
                            <p className="text-zinc-500 text-xs">{item.desc}</p>
                          </div>
                          <span className="text-cyan-400 font-mono text-lg">{item.price}</span>
                        </div>
                      </Tag>
                    </RevealOnScroll>
                  );
                })}
              </div>
            </div>

            {/* Frosted glass overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md bg-black/60">
              <div className="text-center">
                <h3
                  className="text-4xl md:text-6xl uppercase tracking-tight text-white mb-4"
                  style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 800 }}
                >
                  Store Coming Soon
                </h3>
                <div className="w-20 h-[2px] bg-cyan-500 mx-auto" />
              </div>
            </div>
          </section>

          {/* CONNECT */}
          <section id="connect" className="min-h-screen flex items-center py-28 relative overflow-hidden bg-[#030306] border-t border-zinc-900">
            {/* suhas6 photo background */}
            <div className="absolute inset-0 z-0">
              <img
                src="/images/suhas6.JPG"
                alt=""
                className="absolute inset-0 w-full h-full connect-suhas-img"
                style={{ opacity: 0.4, objectFit: 'contain', objectPosition: 'right center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 connect-gradient" />
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-15">
              <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[130px]" />
            </div>

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
              <div className="text-center mb-14">
                <RevealOnScroll>
                  <span className="text-cyan-400 tracking-[0.4em] text-[9px] sm:text-[10px] uppercase block mb-5 font-bold">Follow the journey</span>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <h2 className="text-[clamp(2.5rem,8vw,5.5rem)] tracking-[-0.04em] leading-[0.9] mb-4" style={{ fontFamily: "'Michroma', sans-serif", fontWeight: 800 }}>
                    Connect
                  </h2>
                </RevealOnScroll>
                <RevealOnScroll delay={200}>
                  <div className="w-12 h-[2px] bg-cyan-500 mx-auto" />
                </RevealOnScroll>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {[
                  {
                    href: instagramLink,
                    icon: <Instagram size={26} />,
                    name: 'Instagram',
                    handle: '@suhas.als',
                    hoverBorder: 'hover:border-purple-500/50',
                    hoverShadow: 'hover:shadow-purple-500/20',
                    hoverBg: 'group-hover:from-purple-500/5 group-hover:via-pink-500/8 group-hover:to-orange-500/5',
                    iconHover: 'group-hover:shadow-purple-500/30',
                    blob: 'group-hover:bg-purple-500/10',
                  },
                  {
                    href: youtubeLink,
                    icon: <Youtube size={26} />,
                    name: 'YouTube',
                    handle: '@suhasmusicofficial',
                    hoverBorder: 'hover:border-red-500/50',
                    hoverShadow: 'hover:shadow-red-500/20',
                    hoverBg: 'group-hover:from-red-500/5 group-hover:to-red-500/10',
                    iconHover: 'group-hover:shadow-red-500/30',
                    blob: 'group-hover:bg-red-500/10',
                  },
                  {
                    href: appleMusicLink,
                    icon: <Headphones size={26} />,
                    name: 'Music',
                    handle: 'Stream now',
                    hoverBorder: 'hover:border-rose-500/50',
                    hoverShadow: 'hover:shadow-rose-500/20',
                    hoverBg: 'group-hover:from-rose-500/5 group-hover:to-fuchsia-600/8',
                    iconHover: 'group-hover:shadow-rose-500/30',
                    blob: 'group-hover:bg-rose-500/10',
                  },
                ].map((s, i) => (
                  <RevealOnScroll key={s.name} delay={i * 80}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex flex-col items-center gap-4 p-7 bg-transparent border-2 border-white/[0.08] ${s.hoverBorder} hover:backdrop-blur-xl hover:bg-white/[0.05] transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl ${s.hoverShadow} w-full active:scale-[0.98]`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent ${s.hoverBg} transition-all duration-500`} />
                      <div className={`relative w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-all duration-400 border border-white/[0.06] text-zinc-400 group-hover:text-white shadow-lg ${s.iconHover}`}>
                        {s.icon}
                      </div>
                      <div className="text-center relative">
                        <p className="text-lg font-bold mb-1" style={{ fontFamily: "'Michroma', sans-serif" }}>
                          {s.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-medium">{s.handle}</p>
                      </div>
                      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-transparent rounded-full blur-2xl ${s.blob} transition-all duration-500`} />
                    </a>
                  </RevealOnScroll>
                ))}
              </div>

              {/* Email Newsletter Subscribe */}
              <div className="mt-16 pt-12 border-t border-white/[0.04]">
                <RevealOnScroll delay={100}>
                  <div className="text-center max-w-lg mx-auto">
                    <span className="text-cyan-400 tracking-[0.4em] text-[9px] sm:text-[10px] uppercase block mb-4 font-bold">Stay in the loop</span>
                    <h3 className="text-2xl md:text-3xl font-black uppercase text-white mb-2" style={{ fontFamily: "'Michroma', sans-serif" }}>
                      Subscribe
                    </h3>
                    <p className="text-zinc-400 text-sm font-light mb-6">
                      Early access + <span className="text-cyan-400 font-semibold">20% off</span> when the merch store opens
                    </p>
                    {connectEmailSubmitted ? (
                      <p className="text-cyan-400 text-sm font-semibold tracking-wide py-3 animate-in fade-in duration-500">
                        ✓ You're on the list — see you in April!
                      </p>
                    ) : (
                      <form
                        onSubmit={handleEmailSubmit(connectEmail, setConnectEmailSubmitted, setConnectEmail)}
                        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                      >
                        <input
                          type="email"
                          value={connectEmail}
                          onChange={(e) => setConnectEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="flex-1 px-5 py-3 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.1] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.97] transition-all whitespace-nowrap"
                        >
                          Subscribe
                        </button>
                      </form>
                    )}
                  </div>
                </RevealOnScroll>
              </div>

              <div className="mt-12 pt-12 border-t border-white/[0.04]">
                <RevealOnScroll delay={200}>
                  <div className="text-center max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-2 h-10 bg-purple-500 rounded-full" />
                      <h3 className="text-2xl md:text-3xl font-black uppercase text-white" style={{ fontFamily: "'Michroma', sans-serif" }}>
                        Bookings &amp; Collaborations
                      </h3>
                      <div className="w-2 h-10 bg-purple-500 rounded-full" />
                    </div>
                    <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed mb-6">
                      For inquiries regarding live performances, studio sessions, and collaborations
                    </p>
                    <a
                      href="mailto:management@suhasmusic.com"
                      className="relative inline-block text-xl md:text-2xl font-bold tracking-tight text-white hover:text-cyan-400 transition-colors py-2 group"
                    >
                      management@suhasmusic.com
                      <span className="absolute bottom-0 left-0 w-0 h-1 bg-cyan-500 transition-all duration-300 group-hover:w-full" />
                    </a>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-zinc-950 py-16 border-t border-zinc-800 text-sm relative z-10">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                <div className="text-center md:text-left">
                  <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-14 md:h-16 w-auto mb-2 mx-auto md:mx-0" />
                  <p className="text-zinc-500 text-xs uppercase tracking-widest">© 2026 Suhas Music. All Rights Reserved.</p>
                </div>
                <div className="flex gap-4">
                  <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all" aria-label="Instagram">
                    <Instagram size={18} />
                  </a>
                  <a href={youtubeCreatorLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all" aria-label="YouTube">
                    <Youtube size={18} />
                  </a>
                  <a href={appleMusicArtistLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all" aria-label="Apple Music">
                    <Music size={18} />
                  </a>
                  <a href={spotifyArtistLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all" aria-label="Spotify">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex gap-8 text-xs font-bold uppercase text-zinc-500 justify-center md:justify-end">
                <a href="mailto:management@suhasmusic.com" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="mailto:management@suhasmusic.com" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="mailto:management@suhasmusic.com" className="hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </footer>

          <style>{`
            :root { --font-heading: 'Michroma', sans-serif; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .animate-gradient-x { background-size: 200% 200%; animation: gradient-move 3s ease infinite; }
            @keyframes gradient-move { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
            .perspective-1000 { perspective: 1000px; }
            .gradient-mouse {
              background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #22d3ee 0%, #ffffff 25%, #6366f1 50%, #22d3ee 75%, #ffffff 100%);
              background-size: 200% 200%;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              color: transparent;
              padding: 0 0.25em;
              display: inline-block;
              transition: background-position 0.3s ease;
            }
            .gradient-mouse:hover { animation: none; }
            @keyframes gradient-shift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 20s linear infinite; }
            @media (max-width: 767px) {
              .connect-suhas-img {
                object-fit: cover !important;
                object-position: center 15% !important;
                opacity: 0.65 !important;
              }
              .connect-gradient {
                background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.1), rgba(0,0,0,0.55)) !important;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default SuhasWebsite;