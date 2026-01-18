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

// --- Interactive Piano Keys Component ---
const AbstractPiano = ({ isExpanded, onPlayNote }) => {
  const playNote = (index) => {
    const baseFreq = isExpanded ? 130.81 : 261.63; 
    const frequency = baseFreq * Math.pow(2, index / 12);

    if (onPlayNote) onPlayNote();

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'triangle'; 
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const numKeys = isExpanded ? 37 : 13;

  return (
    <div className={`flex gap-1 items-start justify-center relative z-30 transition-all duration-700 ${isExpanded ? 'h-40 mt-auto mb-8' : 'h-24 mix-blend-normal'}`}>
      {[...Array(numKeys)].map((_, i) => {
        const octaveIndex = i % 12;
        const isBlackKey = [1, 3, 6, 8, 10].includes(octaveIndex);
        
        return (
          <button 
            key={i} 
            onMouseDown={() => playNote(i)}
            className={`transition-all duration-100 ease-out cursor-pointer active:scale-95 relative ${
              isBlackKey 
                ? `z-10 rounded-b-lg bg-zinc-950 border border-zinc-800 shadow-lg shadow-black/80 active:bg-zinc-800 ${isExpanded ? 'w-6 h-24 -mx-3' : 'w-5 h-14 -mx-2.5'}` 
                : `rounded-b-lg bg-gradient-to-b from-white/30 via-white/20 to-white/15 border-t-2 border-x border-b border-white/40 hover:from-white/35 hover:via-white/25 active:translate-y-0.5 active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.25)] backdrop-blur-lg shadow-[0_2px_8px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-100 ${isExpanded ? 'w-10 h-40' : 'w-8 h-24'}`
            }`}
            aria-label="Play piano note"
          >
            {!isBlackKey && (
              <>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-white/40 rounded-full blur-[1px]"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-1.5 bg-white/20 rounded-full blur-[2px]"></div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

// --- Geometric Resonance Visualizer (Three.js) ---
const GeometricVisualizer = ({ noteTrigger }) => {
  const mountRef = useRef(null);
  const reactionRef = useRef({ intensity: 0 }); 

  useEffect(() => {
    if (noteTrigger > 0) {
      reactionRef.current.intensity = 1.0; 
    }
  }, [noteTrigger]);

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

      const coreGeometry = new THREE.IcosahedronGeometry(1.2, 1);
      const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x22d3ee, 
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      scene.add(coreMesh);

      const outerGeometry = new THREE.IcosahedronGeometry(2.5, 1);
      const outerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6366f1, 
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
      scene.add(outerMesh);

      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 700;
      const posArray = new Float32Array(particlesCount * 3);
      
      for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      let time = 0;
      const animate = () => {
        requestAnimationFrame(animate);
        time += 0.01;

        reactionRef.current.intensity *= 0.92;
        const impulse = reactionRef.current.intensity;

        coreMesh.rotation.x += 0.002 + (impulse * 0.05);
        coreMesh.rotation.y += 0.005 + (impulse * 0.05);

        const scale = 1 + Math.sin(time * 2) * 0.1 + (impulse * 0.5);
        coreMesh.scale.set(scale, scale, scale);
        
        if (impulse > 0.1) {
            coreMaterial.color.setHex(0xffffff);
        } else {
            coreMaterial.color.setHex(0x22d3ee); 
        }

        outerMesh.rotation.x -= 0.001;
        outerMesh.rotation.y -= 0.002;
        
        const outerScale = 1 + Math.sin(time * 1.5 + 1) * 0.05 + (impulse * 0.2);
        outerMesh.scale.set(outerScale, outerScale, outerScale);

        particlesMesh.rotation.y = time * 0.05 + (impulse * 0.1);

        camera.position.x = Math.sin(time * 0.5) * 0.2;
        camera.position.y = Math.cos(time * 0.3) * 0.2;
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
        if (mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-80 animate-in fade-in duration-1000" />;
};

const SuhasWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [noteTrigger, setNoteTrigger] = useState(0); 

  const handleNotePlay = () => {
    setNoteTrigger(Date.now());
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Music', href: '#music' },
    { name: 'Store', href: '#store' },
    { name: 'Support', href: '#donate' },
  ];

  const discography = [
    { title: "Chasing Dreams", year: "2025", type: "Single" },
    { title: "Whispering Winds", year: "2025", type: "Single" },
    { title: "Electric Night", year: "2025", type: "Single" },
  ];

  const storeItems = [
    { id: 1, name: 'Fractals (Single)', price: '$1.29', desc: 'Digital Copy of Fractals (Single)', type: 'Digital Download', link: 'https://music.apple.com/us/album/fractals-single/1768715442' },
    { id: 2, name: 'Fractals CD', price: '$5.00', desc: 'Limited Digipak Edition', type: 'CD', link: null },
    { id: 3, name: 'Fractals Tee', price: '$30.00', desc: 'Heavyweight Cotton - Black', type: 'Apparel', link: null },
  ];

  const appleMusicLink = "https://music.apple.com/us/album/fractals-single/1768715442";
  const spotifyLink = "https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6?si=KcFSYSf9Q2SwzGrJjKejNg";
  const youtubeLink = "https://youtube.com/@suhaspadav?si=9VeGZgDY1mThJlF9";
  const instagramLink = "https://www.instagram.com/suhas.als?igsh=MTVjaTR2a2YwaDFhOQ%3D%3D&utm_source=qr";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="text-3xl font-bold tracking-tighter hover:text-cyan-400 transition-colors z-50 relative flex items-center gap-2">
            SUHAS
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
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
          className={`relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-8 flex flex-col items-center pt-32 md:pt-0 transition-all duration-1000 ${showVisualizer ? 'justify-end h-full pb-12' : 'justify-center'}`}
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
            <div className={`flex flex-col gap-8 justify-center items-center ${showVisualizer ? 'w-full' : ''}`}>
              
              <AbstractPiano isExpanded={showVisualizer} onPlayNote={handleNotePlay} />
              
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {!showVisualizer ? (
                  <>
                    <a href={appleMusicLink} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-black text-lg font-bold uppercase tracking-wider hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 rounded-full shadow-lg shadow-cyan-900/50">
                       Stream Now
                    </a>
                    <button 
                      onClick={() => setShowVisualizer(true)}
                      className="px-8 py-4 border border-white/30 hover:border-white text-white text-lg font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 rounded-full backdrop-blur-sm"
                    >
                      Interact
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowVisualizer(false)}
                    className="group relative w-16 h-16 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <X size={24} className="text-white group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute -bottom-8 text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                  </button>
                )}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Marquee Scroller */}
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
                FRACTALS - SINGLE OUT NOW • PROGRESSIVE JAZZ FUSION • STREAM ON APPLE MUSIC •
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio / About Section */}
      <section id="about" className="min-h-[80vh] flex items-center justify-center py-20 relative overflow-hidden bg-black">
         <div className="absolute inset-0 z-0">
            <img 
              src="/images/suhas.jpeg"
              alt="Suhas Background" 
              className="w-full h-full object-cover opacity-90 object-[center_35%]"
            />
            <div className="absolute inset-0 bg-black/30"></div>
         </div>

         <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <RevealOnScroll>
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                        About
                    </h2>
                    <div className="w-20 h-1 bg-cyan-500"></div>
                </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
                <div className="space-y-6 text-zinc-300 text-xl leading-relaxed font-light">
                    <p>
                        Suhas is a pianist and composer exploring the progressive Jazz Fusion space.
                    </p>
                    <p>
                        Drawing from modern jazz, Suhas's music indulges in constantly evolving polyrhythms, and improvisation into rhythmically rich themes, rooted in live performance.
                    </p>
                    <div className="pt-4">
                        <a href="#music" className="inline-flex items-center gap-2 text-white border-b border-cyan-500 pb-1 hover:text-cyan-400 transition-colors uppercase tracking-widest text-sm font-bold">
                            Explore Discography <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </RevealOnScroll>
         </div>
      </section>

      {/* Latest Release / Music */}
      <section id="music" className="py-32 bg-black relative overflow-hidden border-t border-zinc-900">
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
                    "A daring exploration of poly-rhythms and melodic improvisation. Suhas channels live interaction and rhythmic nuance into a modern jazz fusion sound."
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

      {/* Store Section */}
      <section id="store" className="py-32 bg-zinc-950 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="flex justify-between items-end mb-20">
              <div>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">Store</h2>
                <p className="text-zinc-500 tracking-widest uppercase text-xs">Official Merchandise</p>
              </div>
              <a href="#" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-sm uppercase tracking-widest">
                View All <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {storeItems.map((item, i) => (
              <RevealOnScroll key={item.id} delay={i * 150}>
                <a 
                  href={item.link || '#'} 
                  target={item.link ? "_blank" : "_self"}
                  rel={item.link ? "noopener noreferrer" : undefined}
                  className="group cursor-pointer block"
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
                          {item.link ? 'Buy Now' : 'Add to Cart'}
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
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Donate / Support / Connect Section */}
      <section id="donate" className="py-32 relative overflow-hidden bg-[#050505] border-t border-zinc-900">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 leading-none tracking-widest text-white">
                Support & Connect
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light leading-relaxed">
                Be a part of the journey. Help fund the upcoming studio album.
                </p>
            </div>
          </RevealOnScroll>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            <RevealOnScroll delay={100}>
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-center lg:text-left text-white mb-8 flex items-center gap-2">
                      <div className="w-2 h-8 bg-green-500 rounded-full"></div> Funding
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <a href="#" className="group relative bg-zinc-900 border border-zinc-800 hover:border-green-500 p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:bg-zinc-800 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-green-500 mb-2 group-hover:scale-110 transition-transform">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Kickstarter</h3>
                            <p className="text-zinc-500 text-sm text-center">Back the Vinyl production run.</p>
                            <span className="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-green-500 transition-all mt-4">View Campaign</span>
                        </a>

                        <a href="#" className="group relative bg-zinc-900 border border-zinc-800 hover:border-yellow-500 p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:bg-zinc-800 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
                                <Heart size={24} />
                            </div>
                            <h3 className="text-xl font-bold uppercase">GoFundMe</h3>
                            <p className="text-zinc-500 text-sm text-center">Direct support for tour logistics.</p>
                            <span className="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-yellow-500 transition-all mt-4">Donate Now</span>
                        </a>
                    </div>
                </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-center lg:text-left text-white mb-8 flex items-center gap-2">
                      <div className="w-2 h-8 bg-cyan-500 rounded-full"></div> Socials
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a 
                            href={instagramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-cyan-500 transition-all rounded-xl group"
                        >
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 group-hover:bg-cyan-900/30 transition-colors">
                                <Instagram size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">Instagram</p>
                                <p className="text-xs text-zinc-500">Follow</p>
                            </div>
                        </a>

                        <a 
                            href={youtubeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-cyan-500 transition-all rounded-xl group"
                        >
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 group-hover:bg-cyan-900/30 transition-colors">
                                <Youtube size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">YouTube</p>
                                <p className="text-xs text-zinc-500">Follow</p>
                            </div>
                        </a>

                        <a 
                            href={appleMusicLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-cyan-500 transition-all rounded-xl group"
                        >
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 group-hover:bg-cyan-900/30 transition-colors">
                                <Music size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">Apple Music</p>
                                <p className="text-xs text-zinc-500">Follow</p>
                            </div>
                        </a>
                    </div>
                </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={300}>
            <div className="mt-16 pt-16 border-t border-zinc-900">
              <h3 className="text-2xl font-bold text-center text-white mb-8 flex items-center gap-2 justify-center">
                <div className="w-2 h-8 bg-purple-500 rounded-full"></div> Bookings & Recordings
              </h3>
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed mb-8">
                  For inquiries regarding live performances, studio sessions, and collaborations, please reach out directly.
                </p>
                <a 
                  href="mailto:suhasmusicofficial@gmail.com" 
                  className="relative inline-block text-lg md:text-2xl font-bold tracking-tight hover:text-cyan-400 transition-colors py-2 group"
                >
                  suhasmusicofficial@gmail.com
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-16 border-t border-zinc-800 text-sm relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-widest mb-2">SUHAS</h2>
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
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
              <a 
                href={appleMusicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-zinc-800 transition-all"
                aria-label="Apple Music"
              >
                <Music size={18} />
              </a>
            </div>
          </div>
          
          <div className="flex gap-8 text-xs font-bold uppercase text-zinc-500 justify-center md:justify-end">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
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
          padding: 0 0.25em; /* Increased padding to prevent text clipping */
          display: inline-block; /* Critical for preventing overflow clipping */
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