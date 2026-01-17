import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Instagram, Twitter, Youtube, Music, ArrowRight, ShoppingBag, ExternalLink, Play, Disc } from 'lucide-react';

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
    // Basic frequency algorithm relative to C3 (index 0) or C4 depending on expansion
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
      
      oscillator.type = 'triangle'; // Soft triangle wave for a synth-like pad sound
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); // Softer attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // 13 keys (1 octave C to C) vs 37 keys (3 octaves)
  const numKeys = isExpanded ? 37 : 13;

  return (
    <div className={`flex gap-1 items-start relative z-30 transition-all duration-700 ${isExpanded ? 'h-40 mt-auto mb-8' : 'h-24 mix-blend-normal'}`}>
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
                : `rounded-b-lg bg-white/5 border border-white/5 hover:bg-white/10 active:bg-white/20 backdrop-blur-sm ${isExpanded ? 'w-10 h-40' : 'w-8 h-24'}`
            }`}
            aria-label="Play piano note"
          >
            {/* Subtle reflection shine for that rubber/matte look */}
            {!isBlackKey && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white/10 rounded-full blur-[1px]"></div>}
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

      // Core Sphere - Cyan
      const coreGeometry = new THREE.IcosahedronGeometry(1.2, 1);
      const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x22d3ee, 
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      scene.add(coreMesh);

      // Outer Shell - Indigo
      const outerGeometry = new THREE.IcosahedronGeometry(2.5, 1);
      const outerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6366f1, 
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
      scene.add(outerMesh);

      // Particles
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
  const [scrollY, setScrollY] = useState(0);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [noteTrigger, setNoteTrigger] = useState(0); 

  const handleNotePlay = () => {
    setNoteTrigger(Date.now());
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Music', href: '#music' },
    { name: 'Store', href: '#store' },
    { name: 'About', href: '#about' },
  ];

  const discography = [
    { title: "Chasing Dreams", year: "2025", type: "Single" },
    { title: "Whispering Winds", year: "2025", type: "Single" },
    { title: "Electric Night", year: "2025", type: "Single" },
  ];

  const storeItems = [
    { id: 1, name: 'Fractals Hoodie', price: '$85', image: 'black' },
    { id: 2, name: 'Tour Tee 2026', price: '$45', image: 'gray' },
    { id: 3, name: 'Fractals LP (180g)', price: '$50', image: 'zinc' },
  ];

  const appleMusicLink = "https://music.apple.com/us/album/fractals-single/1768715442";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="text-3xl font-bold tracking-tighter hover:text-cyan-400 transition-colors z-50 relative flex items-center gap-2">
            SUHAS.
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-sm uppercase tracking-widest hover:text-cyan-400 transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={toggleMenu} className="md:hidden text-white hover:text-cyan-400 z-50 relative">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
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

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        
        {showVisualizer && <GeometricVisualizer noteTrigger={noteTrigger} />}

        {!showVisualizer && (
           <div className="absolute inset-0 pointer-events-none">
             <div 
               className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px]"
               style={{ transform: `translateY(${scrollY * 0.2}px)` }}
             ></div>
             <div 
               className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-[100px]"
               style={{ transform: `translateY(${scrollY * -0.1}px)` }}
             ></div>
           </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-0 pointer-events-none transition-opacity duration-1000 ${showVisualizer ? 'opacity-80' : 'opacity-100'}`}></div>

        <div 
          className={`relative z-10 max-w-5xl mx-auto space-y-8 will-change-transform flex flex-col items-center pt-32 md:pt-0 transition-all duration-1000 ${showVisualizer ? 'justify-end h-full pb-12' : 'justify-center'}`}
          style={{ 
            transform: showVisualizer ? 'none' : `translateY(${scrollY * 0.5}px)`, 
            opacity: showVisualizer ? 1 : Math.max(0, 1 - scrollY / 700) 
          }}
        >
          {/* Main Hero Text */}
          <div className={`transition-all duration-700 flex flex-col items-center gap-8 ${showVisualizer ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'opacity-100'}`}>
            <RevealOnScroll>
              <div className="flex flex-col items-center gap-4">
                 <h2 className="text-cyan-400 tracking-[0.3em] text-sm md:text-base font-bold uppercase shadow-black drop-shadow-lg">
                   Latest Release • Sept 20, 2024
                 </h2>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none drop-shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-500 animate-gradient-x">
                  FRACTALS
                </span>
              </h1>
              <p className="mt-4 text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide shadow-black drop-shadow-md">
                A 5-minute journey into modern jazz fusion.
              </p>
            </RevealOnScroll>
          </div>

          {/* Piano and Controls */}
          <RevealOnScroll delay={200}>
            <div className={`flex flex-col gap-6 justify-center items-center ${showVisualizer ? 'w-full' : ''}`}>
              
              <AbstractPiano isExpanded={showVisualizer} onPlayNote={handleNotePlay} />
              
              <div className="flex gap-4">
                {!showVisualizer ? (
                  <>
                    <a href={appleMusicLink} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-black text-lg font-bold uppercase tracking-wider hover:scale-105 transition-transform duration-300 flex items-center gap-2 rounded-full shadow-lg shadow-cyan-900/50">
                      <Play size={20} fill="currentColor" /> Stream Now
                    </a>
                    <button 
                      onClick={() => setShowVisualizer(true)}
                      className="px-8 py-4 border border-white/30 hover:border-white text-white text-lg font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 rounded-full backdrop-blur-sm"
                    >
                      Watch Visualizer
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowVisualizer(false)}
                    className="px-8 py-4 border border-white/30 text-white hover:bg-white hover:text-black text-lg font-bold uppercase tracking-wider transition-all duration-300 rounded-full backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  >
                    Close Visualizer
                  </button>
                )}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Marquee Scroller */}
      <div className="w-full bg-cyan-700 overflow-hidden py-4 whitespace-nowrap transform -skew-y-1 origin-left border-y-4 border-black z-20 relative shadow-2xl shadow-cyan-900/50">
        <div className="inline-block animate-marquee">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-black font-black text-xl md:text-3xl mx-8 uppercase tracking-widest italic">
              FRACTALS - SINGLE OUT NOW • PROGRESSIVE JAZZ FUSION • 
            </span>
          ))}
        </div>
      </div>

      {/* Latest Release / Music */}
      <section id="music" className="py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 flex justify-center perspective-1000">
              <div 
                className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]"
                style={{ 
                  transform: `rotate(${scrollY * 0.15}deg)`,
                  transition: 'transform 0.1s linear'
                }}
              >
                 <div className="absolute inset-0 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shadow-2xl shadow-cyan-900/20">
                    <div className="absolute inset-4 rounded-full border border-zinc-800/50"></div>
                    <div className="absolute inset-8 rounded-full border border-zinc-800/50"></div>
                    <div className="absolute inset-12 rounded-full border border-zinc-800/50"></div>
                    <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-tr from-cyan-900 to-black flex items-center justify-center relative overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-80">
                           <div className="flex gap-[2px]">
                             {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-8 bg-white/80"></div>)}
                           </div>
                           <span className="font-black text-white text-xs md:text-sm tracking-widest mt-2">SUHAS</span>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-10">
              <RevealOnScroll>
                <div>
                  <span className="text-cyan-400 font-bold tracking-[0.2em] uppercase mb-4 block">Single • 2024</span>
                  <h2 className="text-6xl md:text-8xl font-bold leading-tight mb-8">
                    FRACTALS
                  </h2>
                  <p className="text-zinc-400 text-xl leading-relaxed max-w-md border-l-2 border-cyan-500 pl-6">
                    "A daring exploration of poly-rhythms and melodic improvisation. Suhas blends classical piano roots with the raw energy of modern synthesis."
                  </p>
                </div>
              </RevealOnScroll>
              
              <RevealOnScroll delay={200}>
                <div className="flex flex-wrap gap-4">
                  <a href={appleMusicLink} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-8 py-4 border border-zinc-800 hover:border-cyan-500 hover:bg-zinc-900 transition-all uppercase text-sm font-bold tracking-wider rounded-full">
                    Apple Music <ExternalLink size={14} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  {['Spotify', 'Bandcamp'].map((platform) => (
                    <button key={platform} className="group flex items-center gap-2 px-8 py-4 border border-zinc-800 hover:border-cyan-500 hover:bg-zinc-900 transition-all uppercase text-sm font-bold tracking-wider rounded-full">
                      {platform} <ExternalLink size={14} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={300}>
                 <div className="mt-12 pt-12 border-t border-zinc-900">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">More by Suhas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {discography.map((disc, i) => (
                         <div key={i} className="bg-zinc-900/50 p-4 rounded hover:bg-zinc-900 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-600 transition-colors">
                               <Disc size={20} />
                            </div>
                            <h4 className="font-bold text-sm truncate">{disc.title}</h4>
                            <p className="text-xs text-zinc-500">{disc.type} • {disc.year}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Store Section */}
      <section id="store" className="py-32 bg-zinc-950">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="flex justify-between items-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight">Store</h2>
              <a href="#" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                View All <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {storeItems.map((item, i) => (
              <RevealOnScroll key={item.id} delay={i * 150}>
                <div className="group cursor-pointer">
                  <div className={`aspect-[4/5] bg-zinc-900 mb-8 relative overflow-hidden rounded-lg`}>
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-800 transition-transform duration-700 group-hover:scale-110">
                       <ShoppingBag size={80} strokeWidth={1} />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-bold uppercase tracking-widest border border-white/50 px-8 py-4 rounded-full hover:bg-white hover:text-black transition-colors">Add to Cart</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start border-t border-zinc-800 pt-6">
                    <div>
                      <h3 className="text-2xl font-bold uppercase mb-2">{item.name}</h3>
                      <p className="text-zinc-500 text-sm">Signature Series</p>
                    </div>
                    <span className="text-cyan-400 font-mono text-xl">{item.price}</span>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / Contact */}
      <section id="about" className="py-32 relative overflow-hidden bg-black">
        <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-950 via-black to-indigo-950 opacity-80"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto px-6 text-center max-w-3xl relative z-10">
          <RevealOnScroll>
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-8 leading-none tracking-tighter text-white">
              Join The <br /> Movement
            </h2>
            <p className="text-xl md:text-2xl font-bold mb-12 max-w-xl mx-auto opacity-80 text-white/90">
              Exclusive improvisation sessions, early vinyl access, and behind-the-scenes content.
            </p>
          </RevealOnScroll>
          
          <RevealOnScroll delay={100}>
            <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="YOUR@EMAIL.COM" 
                className="flex-1 bg-black/40 text-white px-8 py-5 outline-none focus:ring-4 focus:ring-white/50 placeholder:text-white/50 font-mono rounded-full backdrop-blur-md border border-white/20"
              />
              <button className="bg-white text-cyan-900 px-10 py-5 font-bold uppercase tracking-widest hover:bg-zinc-100 hover:scale-105 transition-all rounded-full shadow-xl">
                Subscribe
              </button>
            </form>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tighter mb-2">SUHAS.</h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">© 2026 Suhas Music.</p>
            </div>
            
            <div className="flex gap-6">
              {[Instagram, Twitter, Youtube, Music].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-cyan-600 hover:text-white hover:scale-110 transition-all">
                  <Icon size={20} />
                </a>
              ))}
            </div>
            
            <div className="flex gap-8 text-xs font-bold uppercase text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      <footer>
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
      `}</style>
    </div>
  );
};

export default SuhasWebsite;