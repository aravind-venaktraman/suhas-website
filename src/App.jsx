import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Instagram, Twitter, Youtube, Music, ArrowRight, ShoppingBag, ExternalLink, Play, Disc, Heart, DollarSign } from 'lucide-react';

// --- Helper Component for "Apple-style" Scroll Reveals ---
const RevealOnScroll = ({ children, className = "", delay = 0, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 blur-0' 
          : 'opacity-0 translate-y-12 blur-sm'
      } ${className}`}
    >
      {children}
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
  
  // Effect states
  const [reverbMix, setReverbMix] = useState(0.3);
  const [delayMix, setDelayMix] = useState(0);
  const [filterFreq, setFilterFreq] = useState(5000);
  const [distortion, setDistortion] = useState(0);
  const [arpeggiator, setArpeggiator] = useState(false);
  const [octaveShift, setOctaveShift] = useState(0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    
    script.onload = () => {
      setTone(window.Tone);
      
      // Restore the beautiful Yamaha/Salamander Grand Piano samples
      const sampler = new window.Tone.Sampler({
        urls: {
          C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
          "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3",
          "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3",
          A4: "https://tonejs.github.io/audio/salamander/A4.mp3",
          C5: "https://tonejs.github.io/audio/salamander/C5.mp3",
          "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3",
          "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3",
          A5: "https://tonejs.github.io/audio/salamander/A5.mp3",
        },
        release: 1,
        baseUrl: "",
        onload: () => {
          setAudioLoaded(true);
        }
      });

      // Create effects chain
      const reverb = new window.Tone.Reverb({
        decay: 2.5,
        wet: reverbMix
      }).toDestination();
      
      const delay = new window.Tone.FeedbackDelay({
        delayTime: '8n',
        feedback: 0.4,
        wet: delayMix
      });
      
      const filter = new window.Tone.Filter({
        frequency: filterFreq,
        type: 'lowpass',
        rolloff: -24
      });
      
      const distortionEffect = new window.Tone.Distortion({
        distortion: distortion,
        wet: distortion > 0 ? 0.5 : 0
      });
      
      // Connect the chain: Piano -> Distortion -> Filter -> Delay -> Reverb
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
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }
      Object.values(effectsRef.current).forEach(effect => effect?.dispose?.());
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Update effects in real-time
  useEffect(() => {
    if (effectsRef.current.reverb) {
      effectsRef.current.reverb.wet.value = reverbMix;
    }
  }, [reverbMix]);

  useEffect(() => {
    if (effectsRef.current.delay) {
      effectsRef.current.delay.wet.value = delayMix;
    }
  }, [delayMix]);

  useEffect(() => {
    if (effectsRef.current.filter) {
      effectsRef.current.filter.frequency.value = filterFreq;
    }
  }, [filterFreq]);

  useEffect(() => {
    if (effectsRef.current.distortionEffect) {
      effectsRef.current.distortionEffect.distortion = distortion;
      effectsRef.current.distortionEffect.wet.value = distortion > 0 ? 0.5 : 0;
    }
  }, [distortion]);

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
      
      if (recording) {
        setRecordedNotes(prev => [...prev, { note: noteName, time: Tone.now(), velocity }]);
      }
      
      setActiveNotes(prev => new Set([...prev, index]));
      
      if (arpeggiator) {
        // Arpeggiator pattern
        const pattern = [noteName];
        const third = notes[(noteIndex + 4) % 12] + octave;
        const fifth = notes[(noteIndex + 7) % 12] + octave;
        pattern.push(third, fifth);
        
        pattern.forEach((note, i) => {
          setTimeout(() => {
            samplerRef.current.triggerAttackRelease(note, '16n', undefined, velocity);
          }, i * 100);
        });
      } else {
        samplerRef.current.triggerAttackRelease(noteName, '2n', undefined, velocity);
      }
      
      if (release) {
        setTimeout(() => {
          setActiveNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }, 200);
      }
      
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const playRecording = () => {
    if (recordedNotes.length === 0 || !samplerRef.current) return;
    
    setIsPlaying(true);
    const startTime = Tone.now();
    const firstNoteTime = recordedNotes[0].time;
    
    recordedNotes.forEach(({ note, time, velocity }) => {
      const delay = time - firstNoteTime;
      samplerRef.current.triggerAttackRelease(note, '2n', startTime + delay, velocity);
    });
    
    setTimeout(() => {
      setIsPlaying(false);
    }, (recordedNotes[recordedNotes.length - 1].time - firstNoteTime + 2) * 1000);
  };

  const clearRecording = () => {
    setRecordedNotes([]);
    setIsPlaying(false);
  };

  const numKeys = isExpanded ? 37 : 13;

  return (
    <div className="w-full space-y-6">
      {/* Keyboard */}
      <div className={`flex gap-1 items-start justify-center relative z-30 transition-all duration-700 ${isExpanded ? 'h-40 mt-auto mb-8' : 'h-24 mix-blend-normal'}`}>
        {[...Array(numKeys)].map((_, i) => {
          const octaveIndex = i % 12;
          const isBlackKey = [1, 3, 6, 8, 10].includes(octaveIndex);
          const isActive = activeNotes.has(i);
          
          return (
            <button 
              key={i} 
              onMouseDown={(e) => {
                const velocity = 0.5 + (e.clientY / window.innerHeight) * 0.5;
                playNote(i, velocity);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const velocity = 0.5 + (touch.clientY / window.innerHeight) * 0.5;
                playNote(i, velocity);
              }}
              className={`transition-all duration-100 ease-out cursor-pointer active:scale-95 relative ${
                isBlackKey 
                  ? `z-10 rounded-b-lg border shadow-lg shadow-black/80 ${
                      isActive 
                        ? 'bg-cyan-400 border-cyan-300' 
                        : 'bg-zinc-950 border-zinc-800 active:bg-zinc-800'
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
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-white/40 rounded-full blur-[1px]"></div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-1.5 bg-white/20 rounded-full blur-[2px]"></div>
                  {isActive && (
                    <div className="absolute inset-0 bg-cyan-400/30 rounded-b-lg animate-pulse"></div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Transport Controls - Below keyboard when expanded */}
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
            disabled={recordedNotes.length === 0 || isPlaying}
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
            onClick={clearRecording}
            disabled={recordedNotes.length === 0}
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
              Oct {octaveShift > 0 ? '+' : ''}{octaveShift}
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

// --- Advanced Three.js Visualizer with Particle Systems & Interactive Elements ---
const GeometricVisualizer = ({ noteTrigger }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const particleSystemsRef = useRef([]);
  const shockwavesRef = useRef([]);
  const trailsRef = useRef([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    
    script.onload = () => {
      if (!mountRef.current) return;

      const THREE = window.THREE;
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);

      // Core rotating icosahedron
      const coreGeometry = new THREE.IcosahedronGeometry(1.2, 1);
      const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x22d3ee, 
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      scene.add(coreMesh);

      // Outer sphere
      const outerGeometry = new THREE.IcosahedronGeometry(2.5, 1);
      const outerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6366f1, 
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
      scene.add(outerMesh);

      // Background particle field
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1000;
      const posArray = new Float32Array(particlesCount * 3);
      const velocityArray = new Float32Array(particlesCount * 3);
      
      for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
        velocityArray[i] = (Math.random() - 0.5) * 0.02;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      let time = 0;
      const animate = () => {
        requestAnimationFrame(animate);
        time += 0.01;

        // Animate core
        coreMesh.rotation.x += 0.005;
        coreMesh.rotation.y += 0.008;
        const coreScale = 1 + Math.sin(time * 2) * 0.05;
        coreMesh.scale.set(coreScale, coreScale, coreScale);

        // Animate outer sphere
        outerMesh.rotation.x -= 0.002;
        outerMesh.rotation.y -= 0.003;
        const outerScale = 1 + Math.sin(time * 1.5) * 0.03;
        outerMesh.scale.set(outerScale, outerScale, outerScale);

        // Animate background particles with flow
        const positions = particlesMesh.geometry.attributes.position.array;
        const velocities = particlesMesh.geometry.attributes.velocity.array;
        
        for(let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];
          
          // Wrap around
          if(Math.abs(positions[i]) > 10) velocities[i] *= -1;
          if(Math.abs(positions[i + 1]) > 10) velocities[i + 1] *= -1;
          if(Math.abs(positions[i + 2]) > 10) velocities[i + 2] *= -1;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
        particlesMesh.rotation.y = time * 0.05;

        // Camera orbit
        camera.position.x = Math.sin(time * 0.3) * 0.3;
        camera.position.y = Math.cos(time * 0.2) * 0.3;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!mountRef.current) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
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
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Trigger effects when note is played (simplified - no particle effects)
  useEffect(() => {
    if (noteTrigger.timestamp > 0 && sceneRef.current) {
      // Effects removed for cleaner performance
    }
  }, [noteTrigger]);

  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-90 animate-in fade-in duration-1000" />;
};

const SuhasWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [noteTrigger, setNoteTrigger] = useState({ timestamp: 0, noteIndex: null }); 

  const handleNotePlay = (noteIndex) => {
    setNoteTrigger({ timestamp: Date.now(), noteIndex });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Disable scrolling when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };
  
  useEffect(() => {
    if (isMenuOpen) {
      // Save current scroll position and scroll to top
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
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
    { name: 'Contribute', href: '#contribute' },
    { name: 'Store', href: '#store' },
    { name: 'Connect', href: '#connect' },
  ];

  const storeItems = [
    { id: 1, name: 'Fractals (Single)', price: '$1.29', desc: 'Digital Copy of Fractals (Single)', type: 'Digital Download', link: 'https://music.apple.com/us/album/fractals-single/1768715442', soldOut: false },
    { id: 2, name: 'Fractals CD', price: '$5.00', desc: 'Limited Digipak Edition', type: 'CD', link: null, soldOut: true },
    { id: 3, name: 'Fractals Tee', price: '$30.00', desc: 'Heavyweight Cotton - Black', type: 'Apparel', link: null, soldOut: true },
  ];

  const appleMusicLink = "https://music.apple.com/us/album/fractals-single/1768715442";
  const spotifyLink = "https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6?si=KcFSYSf9Q2SwzGrJjKejNg";
  const youtubeLink = "https://youtube.com/@suhaspadav?si=9VeGZgDY1mThJlF9";
  const instagramLink = "https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr";
  const saavnLink = "https://www.jiosaavn.com";
  const tidalLink = "https://tidal.com";
  
  const appleMusicArtistLink = "https://music.apple.com/us/artist/suhas/1768715441";
  const spotifyArtistLink = "https://open.spotify.com/artist/7jrJXlWGH3Z1L3r7q4qY8K";
  const youtubeCreatorLink = "https://youtube.com/@suhaspadav";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="z-50 relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/images/suhas-productions-logo.png" 
              alt="SUHAS" 
              className="h-12 md:h-16 w-auto"
            />
          </a>

          <div className="hidden md:flex space-x-12">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-sm uppercase tracking-widest hover:text-cyan-400 transition-colors relative group font-bold"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <button onClick={toggleMenu} className="md:hidden text-white hover:text-cyan-400 z-50 relative">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMenuOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
          {/* Logo at top */}
          <div className="absolute top-6 left-6">
            <img 
              src="/images/suhas-productions-logo.png" 
              alt="SUHAS" 
              className="h-12 w-auto"
            />
          </div>

          {/* Close button */}
          <button 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = 'unset';
            }}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white hover:text-cyan-400 transition-colors"
          >
            <X size={32} />
          </button>

          {/* Menu links */}
          <div className="flex flex-col items-center space-y-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-4xl font-bold uppercase hover:text-cyan-400 transition-colors tracking-tighter"
                onClick={() => {
                  setIsMenuOpen(false);
                  document.body.style.overflow = 'unset';
                }}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
      </nav>

      {/* Hero Section - FIXED SCROLLING */}
      <section id="home" className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        
        {showVisualizer && <GeometricVisualizer noteTrigger={noteTrigger} />}

        {!showVisualizer && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0">
              <img 
                src="/images/poster.jpg" 
                alt="" 
                className="w-full h-full object-cover opacity-55 fixed top-0 left-0"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70"></div>
            </div>
            
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-[100px]"></div>
          </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/40 z-0 pointer-events-none transition-opacity duration-1000 ${showVisualizer ? 'opacity-80' : 'opacity-100'}`}></div>

        <div 
          className={`relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-8 flex flex-col items-center transition-all duration-1000 ${showVisualizer ? 'justify-end h-full pb-8 md:pb-12 pt-20 md:pt-32' : 'justify-center pt-32 md:pt-0'}`}
        >
          {/* Main Hero Text */}
          <div className={`transition-all duration-700 flex flex-col items-center gap-8 ${showVisualizer ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'opacity-100'}`}>
            <RevealOnScroll>
              <div className="flex flex-col items-center gap-4">
                  <h2 className="text-cyan-400 tracking-[0.3em] text-sm md:text-base font-bold uppercase shadow-black drop-shadow-lg">
                   New Single Out Now
                  </h2>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
            <h1 
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none drop-shadow-2xl"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }}
              style={{
                '--mouse-x': '50%',
                '--mouse-y': '50%',
              }}
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

          {/* Piano and Controls */}
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
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </a>
                      {/* <a href={saavnLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 flex items-center justify-center transition-all duration-300 hover:scale-110">
                        <Music size={20} className="text-white" />
                      </a>
                      <a href={tidalLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 flex items-center justify-center transition-all duration-300 hover:scale-110">
                        <Music size={20} className="text-white" />
                      </a> */}
                    </div>
                    {/* <button 
                      onClick={() => setShowVisualizer(true)}
                      className="px-8 py-4 border border-white/30 hover:border-white text-white text-lg font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 rounded-full backdrop-blur-sm"
                    >
                      Interact
                    </button> */}
                  </>
                ) : (
                  <button 
                    onClick={() => setShowVisualizer(false)}
                    className="group relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
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

      {/* Marquee Scroller - Hidden in visualizer mode */}
      {!showVisualizer && (
        <div className="w-full relative z-20 -mt-16">
          {/* Dark overlay behind marquee */}
          <div className="absolute inset-0 bg-black/60 z-0"></div>
          
          <div 
            className="w-full overflow-hidden py-4 whitespace-nowrap transform -skew-y-1 origin-left relative z-10"
            style={{ 
              background: 'linear-gradient(to right, #360225, #2f43a983, #5f188291)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 15s ease infinite'
            }}
          >
            <div 
              className="inline-block"
              style={{ animation: 'marquee 30s linear infinite' }}
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="text-white font-black text-xl md:text-3xl mx-8 uppercase tracking-widest italic">
                  FRACTALS - SINGLE OUT NOW • PROGRESSIVE JAZZ FUSION • STREAM NOW ANYWHERE •
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bio / About Section */}
      <section id="about" className="min-h-screen flex items-center justify-center py-32 relative overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
            <img 
              src="/images/suhas.jpeg"
              alt="Suhas Background" 
              className="w-full h-full object-cover opacity-90 object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-7xl">
            <RevealOnScroll>
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                        About
                    </h2>
                    <div className="w-20 h-1 bg-cyan-500"></div>
                </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
                <div className="space-y-6 text-zinc-300 text-xl leading-relaxed font-light mt-[65px]">
                    <p>
                        Suhas is a pianist and composer exploring the progressive Jazz Fusion space.
                    </p>
                    <p>
                        Drawing from modern jazz, Suhas's music indulges in constantly evolving polyrhythms, and improvisation into rhythmically rich themes, rooted in live performance.
                    </p>
                </div>
            </RevealOnScroll>
        </div>
      </section>

      {/* Latest Release / Music */}
      <section id="music" className="min-h-screen flex items-center justify-center py-32 bg-black relative overflow-hidden border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 flex justify-center perspective-1000">
              <div 
                className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] animate-spin-slow"
              >
                <div className="absolute inset-0 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-2xl shadow-cyan-900/20 overflow-hidden">
                  
                  <div className="absolute inset-2 rounded-full border border-zinc-800/60"></div>
                  <div className="absolute inset-4 rounded-full border border-zinc-800/50"></div>
                  <div className="absolute inset-8 rounded-full border border-zinc-800/40"></div>
                  <div className="absolute inset-12 rounded-full border border-zinc-800/30"></div>
                  <div className="absolute inset-16 rounded-full border border-zinc-800/20"></div>
                  <div className="absolute inset-20 rounded-full border border-zinc-800/20"></div>
                  <div className="absolute inset-24 rounded-full border border-zinc-800/20"></div>
                  
                  <div className="w-[60%] h-[60%] rounded-full relative overflow-hidden border-2 border-zinc-700 shadow-lg">
                    <img 
                      src="/images/album-art.PNG"
                      alt="Fractals Album Art"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/30"></div>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-black border border-zinc-600 shadow-inner"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-10">
              <RevealOnScroll>
                <div>
                  <span className="text-cyan-400 font-bold tracking-[0.2em] uppercase mb-4 block">Single • 2024</span>
                  <h2 className="text-6xl md:text-8xl font-black leading-tight mb-8">
                    FRACTALS
                  </h2>
                  <p className="text-zinc-400 text-xl leading-relaxed max-w-md border-l-2 border-cyan-500 pl-6">
                    "An exploration of polyrhythms and melodic improvisation. Suhas channels live interaction and rhythmic nuance into a modern jazz fusion sound."
                  </p>
                </div>
              </RevealOnScroll>
              
              <RevealOnScroll delay={200}>
                <div className="flex flex-wrap gap-4">
                  <a href={appleMusicLink} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-8 py-4 border border-zinc-800 hover:border-cyan-500 hover:bg-zinc-900 transition-all uppercase text-sm font-bold tracking-wider rounded-full">
                    Apple Music <ExternalLink size={14} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a href={spotifyLink} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-8 py-4 border border-zinc-800 hover:border-cyan-500 hover:bg-zinc-900 transition-all uppercase text-sm font-bold tracking-wider rounded-full">
                    Spotify <ExternalLink size={14} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-8 py-4 border border-zinc-800 hover:border-cyan-500 hover:bg-zinc-900 transition-all uppercase text-sm font-bold tracking-wider rounded-full">
                    Youtube <ExternalLink size={14} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Contribute / Fundraising Section */}
      <section id="contribute" className="min-h-screen flex items-center justify-center py-24 relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black border-t border-zinc-900">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
                Contribute
              </h2>
              <div className="w-20 h-1 bg-cyan-500 mx-auto"></div>
              <p className="text-zinc-300 text-xl md:text-2xl max-w-3xl mx-auto mt-8 font-light leading-relaxed">
                Help bring the next studio album to life
              </p>
              <p className="text-cyan-400 text-lg font-medium mt-4">
                Your support makes all the difference
              </p>
            </div>
          </RevealOnScroll>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Kickstarter Card */}
            <RevealOnScroll delay={100}>
              <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 hover:border-green-500 p-10 flex flex-col items-center gap-6 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 rounded-2xl cursor-default overflow-hidden">
                {/* Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 w-full flex flex-col items-center gap-6 flex-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/50">
                    <DollarSign size={40} className="text-white" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-3xl font-black uppercase mb-3 text-white">Kickstarter</h3>
                    <p className="text-zinc-400 text-base mb-6 max-w-sm">
                      Back the production run and get exclusive rewards
                    </p>
                  </div>

                  <div className="w-full space-y-3 text-sm text-zinc-400 border-t border-zinc-800 pt-6 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Limited edition vinyl pressings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Exclusive artwork & packaging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Early access to new releases</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <span className="inline-block text-lg font-bold uppercase tracking-widest text-green-500 border-b-2 border-green-500/0 group-hover:border-green-500 transition-all pb-1">
                      Campaign Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* GoFundMe Card */}
            <RevealOnScroll delay={200}>
              <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 hover:border-yellow-500 p-10 flex flex-col items-center gap-6 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20 rounded-2xl cursor-default overflow-hidden">
                {/* Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 w-full flex flex-col items-center gap-6 flex-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-yellow-500/50">
                    <Heart size={40} className="text-white" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-3xl font-black uppercase mb-3 text-white">GoFundMe</h3>
                    <p className="text-zinc-400 text-base mb-6 max-w-sm">
                      Direct support for studio recording sessions
                    </p>
                  </div>

                  <div className="w-full space-y-3 text-sm text-zinc-400 border-t border-zinc-800 pt-6 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      <span>Professional studio recording</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      <span>Equipment & production costs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      <span>Mixing & mastering sessions</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <span className="inline-block text-lg font-bold uppercase tracking-widest text-yellow-500 border-b-2 border-yellow-500/0 group-hover:border-yellow-500 transition-all pb-1">
                      Campaign Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Store Section */}
      <section id="store" className="min-h-screen flex items-center justify-center py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">Store</h2>
                <p className="text-zinc-500 tracking-widest uppercase text-xs">Official Merchandise</p>
              </div>
              <span className="hidden md:flex items-center gap-2 text-zinc-400 cursor-default text-sm uppercase tracking-widest">
                View All <ArrowRight size={16} />
              </span>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {storeItems.map((item, i) => (
              <RevealOnScroll key={item.id} delay={i * 150}>
                {item.link ? (
                  <a 
                    href={item.link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block cursor-pointer"
                  >
                    <div className={`aspect-square bg-zinc-900 mb-6 relative overflow-hidden border border-zinc-800`}>
                      {item.type === 'Digital Download' ? (
                        <img 
                          src="/images/album-art.PNG"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : item.type === 'CD' ? (
                        <img 
                          src="/images/cd-art.png"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : item.type === 'Apparel' ? (
                        <img 
                          src="/images/tshirt.png"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-800 transition-transform duration-700 group-hover:scale-105">
                          {item.type === 'Vinyl' && <Disc size={120} strokeWidth={0.5} />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold uppercase tracking-widest border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors text-xs">
                          Buy Now
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold uppercase mb-1">{item.name}</h3>
                        <p className="text-zinc-500 text-xs">{item.desc}</p>
                      </div>
                      <span className="text-cyan-400 font-mono text-lg">{item.price}</span>
                    </div>
                  </a>
                ) : (
                  <div className="group block cursor-default">
                    <div className={`aspect-square bg-zinc-900 mb-6 relative overflow-hidden border border-zinc-800`}>
                      {item.type === 'Digital Download' ? (
                        <img 
                          src="/images/album-art.PNG"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : item.type === 'CD' ? (
                        <img 
                          src="/images/cd-art.png"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : item.type === 'Apparel' ? (
                        <img 
                          src="/images/tshirt.png"
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-800 transition-transform duration-700 group-hover:scale-105">
                          {item.type === 'Vinyl' && <Disc size={120} strokeWidth={0.5} />}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold uppercase mb-1">{item.name}</h3>
                        <p className="text-zinc-500 text-xs">{item.desc}</p>
                        {item.soldOut && (
                          <p className="text-red-500 text-xs mt-1">Sold Out</p>
                        )}
                      </div>
                      <span className="text-cyan-400 font-mono text-lg">{item.price}</span>
                    </div>
                  </div>
                )}
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Connect / Socials Section */}
      <section id="connect" className="min-h-screen flex items-center justify-center py-24 relative overflow-hidden bg-black border-t border-zinc-900">
        {/* More Subtle Background with Distant Elements */}
        <div className="absolute inset-0 z-0 opacity-30">
          {/* Animated gradient blobs - more subtle and distant */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-500/10 via-blue-500/5 to-transparent rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/8 via-pink-500/5 to-transparent rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Grid overlay - more subtle */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}></div>

          {/* Floating abstract shapes - more distant and subtle */}
          <div className="absolute top-32 left-32 w-24 h-24 border-2 border-cyan-500/10 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 border-2 border-purple-500/10 rotate-45" style={{animation: 'spin-slow 15s linear infinite reverse'}}></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-lg rotate-12 animate-pulse"></div>
        </div>

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <RevealOnScroll>
            <div className="mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
                Connect
              </h2>
              <div className="w-20 h-1 bg-cyan-500"></div>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <RevealOnScroll delay={0}>
              <a 
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center gap-6 p-8 bg-white/5 border-2 border-white/10 hover:border-purple-500/50 backdrop-blur-xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-orange-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/8 group-hover:to-orange-500/5 transition-all duration-500"></div>
                
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-110 transition-all duration-500 border border-white/20">
                  <Instagram size={36} className="text-white" />
                </div>
                
                <div className="text-center relative">
                  <p className="font-black text-2xl text-white mb-1">Instagram</p>
                  <p className="text-sm text-zinc-400 font-medium">@suhas.als</p>
                </div>

                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500"></div>
              </a>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <a 
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center gap-6 p-8 bg-white/5 border-2 border-white/10 hover:border-red-500/50 backdrop-blur-xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/10 transition-all duration-500"></div>
                
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 group-hover:scale-110 transition-all duration-500 border border-white/20">
                  <Youtube size={36} className="text-white" />
                </div>
                
                <div className="text-center relative">
                  <p className="font-black text-2xl text-white mb-1">YouTube</p>
                  <p className="text-sm text-zinc-400 font-medium">@suhasmusicofficial</p>
                </div>

                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-500"></div>
              </a>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <a 
                href={appleMusicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center gap-6 p-8 bg-white/5 border-2 border-white/10 hover:border-rose-500/50 backdrop-blur-xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-fuchsia-600/0 group-hover:from-rose-500/5 group-hover:to-fuchsia-600/8 transition-all duration-500"></div>
                
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-rose-500/30 group-hover:scale-110 transition-all duration-500 border border-white/20">
                  <Music size={36} className="text-white" />
                </div>
                
                <div className="text-center relative">
                  <p className="font-black text-2xl text-white mb-1">Music</p>
                  <p className="text-sm text-zinc-400 font-medium">Stream now</p>
                </div>

                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500"></div>
              </a>
            </RevealOnScroll>
          </div>

          {/* Bookings & Collaborations */}
          <div className="mt-16 pt-12 border-t border-zinc-800">
            <RevealOnScroll delay={300}>
              <div className="text-center max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-2 h-10 bg-purple-500 rounded-full"></div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase text-white">
                    Bookings & Collaborations
                  </h3>
                  <div className="w-2 h-10 bg-purple-500 rounded-full"></div>
                </div>
                <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed mb-6">
                  For inquiries regarding live performances, studio sessions, and collaborations
                </p>
                <a 
                  href="mailto:suhasmusicofficial@gmail.com" 
                  className="relative inline-block text-xl md:text-2xl font-bold tracking-tight text-white hover:text-cyan-400 transition-colors py-2 group"
                >
                  suhasmusicofficial@gmail.com
                  <span className="absolute bottom-0 left-0 w-0 h-1 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
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
              <img 
                src="/images/suhas-productions-logo.png" 
                alt="SUHAS" 
                className="h-10 md:h-12 w-auto mb-2 mx-auto md:mx-0"
              />
              <p className="text-zinc-500 text-xs uppercase tracking-widest">© 2026 Suhas Music. All Rights Reserved.</p>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href={youtubeCreatorLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
              <a 
                href={appleMusicArtistLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="Apple Music"
              >
                <Music size={18} />
              </a>
              <a 
                href={spotifyArtistLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="Spotify"
              >
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="flex gap-8 text-xs font-bold uppercase text-zinc-500 justify-center md:justify-end">
            <a href="mailto:suhasmusicofficial@gmail.com" className="hover:text-white transition-colors">Privacy</a>
            <a href="mailto:suhasmusicofficial@gmail.com" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:suhasmusicofficial@gmail.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-gradient-x {
           background-size: 200% 200%;
           animation: gradient-move 3s ease infinite;
        }
        @keyframes gradient-move {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
        }
        .perspective-1000 {
            perspective: 1000px;
        }
        .gradient-mouse {
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            #22d3ee 0%,
            #ffffff 25%,
            #6366f1 50%,
            #22d3ee 75%,
            #ffffff 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          padding: 0 0.25em;
          display: inline-block;
          transition: background-position 0.3s ease;
        }

        .gradient-mouse:hover {
          animation: none;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SuhasWebsite;