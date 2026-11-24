import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PERSONAL_INFO } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Contact({ framesConfig, getFrameImage }) {
  const containerRef = useRef(null);
  const bigTextRef = useRef(null);
  const canvasRef = useRef(null);
  const leftTextRef = useRef(null);
  const animFrameRef = useRef(0);

  // Fit "LET'S TALK" in background
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const text = bigTextRef.current;
      if (!container || !text) return;

      const containerWidth = container.offsetWidth * 0.96;
      let fontSize = containerWidth / 4.8;
      text.style.fontSize = `${fontSize}px`;

      const currentWidth = text.offsetWidth;
      if (currentWidth > 0) {
        fontSize = fontSize * (containerWidth / currentWidth);
        text.style.fontSize = `${fontSize}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Slide up left heading
  useEffect(() => {
    const el = leftTextRef.current;
    if (!el) return;

    gsap.fromTo(el.querySelectorAll('.slide-line'), {
      y: 30,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%'
      }
    });
  }, []);

  // Canvas loop for waving character — strictly clean full-body frames (24 to 95)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const totalFrames = framesConfig?.SEQ?.wave || 76;

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      animFrameRef.current = (animFrameRef.current + dt * 22) % totalFrames;
      const frameIdx = Math.floor(animFrameRef.current);

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const img = getFrameImage ? getFrameImage('wave', frameIdx) : null;
      if (img && img.complete && img.naturalWidth > 0) {
        // Fit character vertically with head and shoes fully visible
        const charH = rect.height * 0.96;
        const charW = charH * (640 / 1080);
        const charX = (rect.width - charW) / 2;
        const charY = rect.height - charH;

        ctx.drawImage(img, charX, charY, charW, charH);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [framesConfig, getFrameImage]);

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="contact"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '75vh',
        background: 'linear-gradient(180deg, #151517 0%, #0e0e0f 100%)',
        color: 'var(--color-ivory)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(50px, 7vh, 90px) var(--side-padding) 24px var(--side-padding)'
      }}
      className="dark-section"
    >
      {/* Background LET'S TALK */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '2%',
          width: '96%',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <span
          ref={bigTextRef}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0',
            lineHeight: 0.85,
            whiteSpace: 'nowrap',
            display: 'inline-block',
            background: 'linear-gradient(180deg, rgba(239, 235, 228, 0.08) 0%, rgba(239, 235, 228, 0.01) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          LET'S TALK
        </span>
      </div>

      {/* 3-column Grid matching reference reel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          alignItems: 'end',
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          zIndex: 5,
          gap: '24px'
        }}
        className="contact-main-grid"
      >
        {/* Lower Left Heading */}
        <div ref={leftTextRef} style={{ display: 'flex', flexDirection: 'column' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 4.4vw, 72px)',
              fontWeight: 400,
              lineHeight: .95,
              letterSpacing: 0,
              textTransform: 'uppercase',
              margin: 0
            }}
          >
            <div className="slide-line">Let's build</div>
            <div className="slide-line">something</div>
            <div
              className="slide-line"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--color-silver)',
                fontSize: '1.05em',
                textTransform: 'none'
              }}
            >
              that moves.
            </div>
          </h2>
        </div>

        {/* Center: Full-body Waving Character */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(320px, 50vh, 460px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}
          className="contact-char-col"
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />

          {/* Speech Bubble "Bye bye!" next to waving hand */}
          <div
            style={{
              position: 'absolute',
              top: '12%',
              left: 'calc(50% + 55px)',
              padding: '7px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-charcoal)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 235, 228, 0.2)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '14.5px',
              color: 'var(--color-ivory)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
          >
            Bye bye! 👋
          </div>
        </div>

        {/* Lower Right: Social Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '14px',
            alignItems: 'center'
          }}
          className="contact-social-col"
        >
          {/* GitHub */}
          <a
            href={PERSONAL_INFO.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub profile"
            data-cursor="GITHUB"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid rgba(239, 235, 228, 0.2)',
              backgroundColor: 'rgba(239, 235, 228, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-ivory)',
              transition: 'border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease'
            }}
            className="social-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href={PERSONAL_INFO.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn profile"
            data-cursor="LINKEDIN"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid rgba(239, 235, 228, 0.2)',
              backgroundColor: 'rgba(239, 235, 228, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-ivory)',
              transition: 'border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease'
            }}
            className="social-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>

          {/* Email */}
          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            aria-label="Send email"
            data-cursor="EMAIL"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid rgba(239, 235, 228, 0.2)',
              backgroundColor: 'rgba(239, 235, 228, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-ivory)',
              transition: 'border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease'
            }}
            className="social-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--color-lines)',
          paddingTop: '18px',
          marginTop: '36px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          color: 'var(--color-silver)',
          letterSpacing: '0.04em',
          zIndex: 10
        }}
      >
        <span>© {PERSONAL_INFO.year} {PERSONAL_INFO.fullName}</span>
        <a
          href="#hero"
          onClick={scrollToTop}
          style={{
            color: 'var(--color-ivory)',
            transition: 'opacity 0.2s ease'
          }}
        >
          Back to top ↑
        </a>
      </footer>

      <style>{`
        .social-btn:hover {
          border-color: var(--color-ivory) !important;
          background-color: rgba(239, 235, 228, 0.12) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .contact-main-grid {
            grid-template-columns: 1fr !important;
            align-items: center !important;
            text-align: center !important;
          }
          .contact-char-col {
            order: 2;
          }
          .contact-social-col {
            order: 3;
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  );
}
