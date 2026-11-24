import React, { useEffect, useState, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Preloader from './components/Preloader';
import CustomCursor from './components/CustomCursor';
import NoiseOverlay from './components/NoiseOverlay';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Numbers from './components/Numbers';
import Marquee from './components/Marquee';
import Work from './components/Work';
import Skills from './components/Skills';
import Journey from './components/Journey';
import Certifications from './components/Certifications';
import Contact from './components/Contact';

import { SEQ, RUN, ROT, BG } from './lib/frames.js';

const FRAMES_CONFIG = {
  SEQ: SEQ || { run: 144, wave: 96, rot: 97, rotc: 97 },
  RUN: RUN || { stand: 0, startFrom: 1, startTo: 91, loopFrom: 91, loopLen: 21, loopEntry: 0 },
  ROT: ROT || { front: 0, end: 96, left: 27, right: 70 },
  BG: BG || '#f3f2eb'
};

export default function App() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [framesLoaded, setFramesLoaded] = useState(false);

  const lenisRef = useRef(null);
  const frameImagesRef = useRef(new Map());

  // Initialize Lenis smooth scroll driven by gsap.ticker
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5
    });

    lenisRef.current = lenis;
    lenis.stop(); // stopped until preloader ends

    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
    };
  }, []);

  // Frame Preloading Engine
  useEffect(() => {
    const isSD = Math.min(window.innerWidth, window.innerHeight) < 700;
    const folder = isSD ? 'sd' : 'hd';

    const seq = FRAMES_CONFIG.SEQ;
    const frameList = [];

    // Wave frames
    for (let i = 0; i < seq.wave; i++) {
      frameList.push({ type: 'wave', index: i, path: `/frames/${folder}/wave_${String(i).padStart(3, '0')}.webp` });
    }
    // Rot frames
    for (let i = 0; i < seq.rot; i++) {
      frameList.push({ type: 'rot', index: i, path: `/frames/${folder}/rot_${String(i).padStart(3, '0')}.webp` });
    }
    // Rotc frames
    for (let i = 0; i < seq.rotc; i++) {
      frameList.push({ type: 'rotc', index: i, path: `/frames/${folder}/rotc_${String(i).padStart(3, '0')}.webp` });
    }
    // Run frames
    for (let i = 0; i < seq.run; i++) {
      frameList.push({ type: 'run', index: i, path: `/frames/${folder}/run_${String(i).padStart(3, '0')}.webp` });
    }

    const total = frameList.length;
    let loadedCount = 0;

    const handleSingleLoad = (type, index, img) => {
      frameImagesRef.current.set(`${type}_${index}`, img);
      loadedCount++;
      const currentPct = Math.min(100, (loadedCount / total) * 100);
      setLoadProgress(currentPct);

      if (loadedCount >= total) {
        setFramesLoaded(true);
      }
    };

    frameList.forEach((item) => {
      const img = new Image();
      img.onload = () => handleSingleLoad(item.type, item.index, img);
      img.onerror = () => handleSingleLoad(item.type, item.index, img); // prevent stalling
      img.src = item.path;
    });
  }, []);

  // Handler when Preloader wipe animation completes
  const handlePreloaderComplete = useCallback(() => {
    setIsPreloaded(true);
    if (lenisRef.current) {
      lenisRef.current.start();
      if (window.location.hash) {
        setTimeout(() => {
          lenisRef.current?.scrollTo(window.location.hash, { offset: 0, duration: 1 });
        }, 150);
      }
    }
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, []);

  // Frame retrieval function for instant canvas drawing
  const getFrameImage = useCallback((type, index) => {
    const direct = frameImagesRef.current.get(`${type}_${index}`);
    if (direct && direct.complete && direct.naturalWidth > 0) return direct;
    const fallback = frameImagesRef.current.get(`${type}_0`);
    if (fallback && fallback.complete && fallback.naturalWidth > 0) return fallback;
    return null;
  }, []);

  // Smooth navigation scroll
  const handleNavigate = useCallback((href) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(href, { offset: 0, duration: 1.2 });
    } else {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="portfolio-app" style={{ position: 'relative', width: '100%', overflowX: 'clip' }}>
      {/* Noise Overlay */}
      <NoiseOverlay />

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Preloader */}
      {!isPreloaded && (
        <Preloader progress={loadProgress} onComplete={handlePreloaderComplete} />
      )}

      {/* Nav (absolute at top of hero only) */}
      <Nav onNavigate={handleNavigate} />

      {/* Sections in exact specified order, strictly supported by resume */}
      <main>
        {/* 1. Hero light */}
        <Hero
          framesLoaded={framesLoaded}
          isPreloaded={isPreloaded}
          framesConfig={FRAMES_CONFIG}
          getFrameImage={getFrameImage}
        />

        {/* 2. About light */}
        <About
          framesConfig={FRAMES_CONFIG}
          getFrameImage={getFrameImage}
        />

        {/* 3. Numbers dark */}
        <Numbers />

        {/* 4. Marquee dark */}
        <Marquee />

        {/* 5. Work light */}
        <Work />

        {/* 6. Skills dark */}
        <Skills />

        {/* 7. Journey dark */}
        <Journey />

        {/* 8. Certifications light */}
        <Certifications />

        {/* 9. Contact dark */}
        <Contact
          framesConfig={FRAMES_CONFIG}
          getFrameImage={getFrameImage}
        />
      </main>
    </div>
  );
}
