import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { PERSONAL_INFO } from '../data';

const GREETINGS = [
  'Hello',
  'سلام',
  'नमस्ते',
  'Hola',
  'Bonjour',
  'Ciao',
  'こんにちは',
  'Hi'
];

export default function Preloader({ progress, onComplete }) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const countRef = useRef({ val: 0 });

  // Cycle greetings every 260ms
  useEffect(() => {
    const timer = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 260);
    return () => clearInterval(timer);
  }, []);

  // Smooth counter following real frame progress
  useEffect(() => {
    gsap.to(countRef.current, {
      val: progress,
      duration: 0.5,
      ease: 'power1.out',
      onUpdate: () => {
        setDisplayCount(Math.round(countRef.current.val));
      }
    });
  }, [progress]);

  // When reached 100%, animate out
  useEffect(() => {
    if (progress >= 100 && displayCount >= 100) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });

      tl.to(contentRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in'
      })
      .to(containerRef.current, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        duration: 1.1,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }, '-=0.2');
    }
  }, [progress, displayCount, onComplete]);

  const countStr = String(displayCount).padStart(3, '0');

  return (
    <aside
      ref={containerRef}
      aria-label="Portfolio Loading Screen"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'radial-gradient(circle at center, #232326 0%, #111112 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(24px, 4vw, 56px)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        willChange: 'clip-path'
      }}
    >
      <div
        ref={contentRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--color-silver)'
          }}>
            {PERSONAL_INFO.fullName}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--color-ash)'
          }}>
            Portfolio {PERSONAL_INFO.year}
          </span>
        </div>

        {/* Center: Greeting & Giant Counter */}
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(28px, 4.5vw, 64px)',
            color: 'var(--color-ivory)',
            minHeight: '1.4em',
            marginBottom: '16px',
            transition: 'opacity 0.2s ease'
          }}>
            {GREETINGS[greetingIndex]}
          </div>

          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(80px, 18vw, 240px)',
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #efebe4 0%, #5a5854 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {countStr}
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div style={{ width: '100%' }}>
          <div style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(239, 235, 228, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${displayCount}%`,
              backgroundColor: 'var(--color-ivory)',
              transition: 'width 0.3s ease-out'
            }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
