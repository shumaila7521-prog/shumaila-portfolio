import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ABOUT_CHAPTERS } from '../data';

gsap.registerPlugin(ScrollTrigger);

function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return [243, 242, 235];
  const r = parseInt(hex.slice(1, 3), 16) || 243;
  const g = parseInt(hex.slice(3, 5), 16) || 242;
  const b = parseInt(hex.slice(5, 7), 16) || 235;
  return [r, g, b];
}

export default function About({ framesConfig, getFrameImage }) {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const activeChapterIdxRef = useRef(0);
  const animRef = useRef({ currentP: 0, targetP: 0 });

  // ScrollTrigger for scrubbing 520vh section + direct bounding rect fallback
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const rotProgress = Math.min(1, progress / 0.92);
        animRef.current.targetP = rotProgress;

        const chapterIdx = Math.min(
          ABOUT_CHAPTERS.length - 1,
          Math.floor(rotProgress * ABOUT_CHAPTERS.length)
        );
        if (chapterIdx !== activeChapterIdxRef.current) {
          activeChapterIdxRef.current = chapterIdx;
          setActiveChapterIdx(chapterIdx);
        }
      }
    });
    return () => trigger.kill();
  }, []);

  // Text animation on chapter change
  useEffect(() => {
    if (leftColRef.current) {
      gsap.fromTo(
        leftColRef.current.querySelectorAll('.animate-rise'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
    if (rightColRef.current) {
      gsap.fromTo(
        rightColRef.current.querySelectorAll('.word-fade'),
        { opacity: 0, filter: 'blur(5px)', y: 8 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.4, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }, [activeChapterIdx]);

  // Canvas render loop: continuous smooth rotation scrub, never overlaps text
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const bgHex = framesConfig?.BG || '#f3f2eb';
    const [bgR, bgG, bgB] = hexToRgb(bgHex);

    const render = () => {
      // Direct scroll calculation fallback to ensure 100% reliable 3D model rotation
      const sec = sectionRef.current;
      if (sec) {
        const secRect = sec.getBoundingClientRect();
        const totalScroll = sec.offsetHeight - window.innerHeight;
        if (totalScroll > 0) {
          const directP = Math.max(0, Math.min(1, -secRect.top / totalScroll));
          animRef.current.targetP = Math.min(1, directP / 0.92);

          const chIdx = Math.min(
            ABOUT_CHAPTERS.length - 1,
            Math.floor(animRef.current.targetP * ABOUT_CHAPTERS.length)
          );
          if (chIdx !== activeChapterIdxRef.current) {
            activeChapterIdxRef.current = chIdx;
            setActiveChapterIdx(chIdx);
          }
        }
      }

      const st = animRef.current;
      st.currentP += (st.targetP - st.currentP) * 0.18;

      const totalFrames = framesConfig?.SEQ?.rotc || 97;
      const exactFrame = st.currentP * (totalFrames - 1);
      const frameIdx = Math.round(exactFrame) % totalFrames;

      const rect = stickyRef.current ? stickyRef.current.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const img = getFrameImage ? getFrameImage('rotc', frameIdx) : null;
      if (img && img.complete && img.naturalWidth > 0) {
        const isNarrow = rect.width < 860;
        let drawX, drawY, drawW, drawH;

        if (isNarrow) {
          // On mobile/tablet: character is framed safely BETWEEN top heading and bottom description
          const topSafeH = Math.min(150, rect.height * 0.22);
          const btmSafeH = Math.min(150, rect.height * 0.22);
          const availH = Math.max(180, rect.height - topSafeH - btmSafeH);
          drawH = Math.min(availH, 440);
          drawW = drawH * (800 / 1080);
          drawX = (rect.width - drawW) / 2;
          drawY = topSafeH + (availH - drawH) / 2;
        } else {
          // On desktop: 3-column layout where character fits strictly within the center column
          const maxCenterW = Math.min(rect.width * 0.32, 440);
          const maxCenterH = Math.min(rect.height * 0.84, 820);
          drawW = Math.min(maxCenterW, maxCenterH * (800 / 1080));
          drawH = drawW * (1080 / 800);
          drawX = (rect.width - drawW) / 2;
          drawY = (rect.height - drawH) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Soft edge fade on sides
        const fadeW = Math.min(50, drawW * 0.14);

        const leftGrad = ctx.createLinearGradient(drawX, 0, drawX + fadeW, 0);
        leftGrad.addColorStop(0, `rgba(${bgR},${bgG},${bgB},1)`);
        leftGrad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
        ctx.fillStyle = leftGrad;
        ctx.fillRect(drawX - 2, drawY, fadeW + 2, drawH);

        const rightGrad = ctx.createLinearGradient(drawX + drawW, 0, drawX + drawW - fadeW, 0);
        rightGrad.addColorStop(0, `rgba(${bgR},${bgG},${bgB},1)`);
        rightGrad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
        ctx.fillStyle = rightGrad;
        ctx.fillRect(drawX + drawW - fadeW, drawY, fadeW + 2, drawH);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [framesConfig, getFrameImage]);

  const chapter = ABOUT_CHAPTERS[activeChapterIdx];
  const sentenceWords = chapter.sentence.split(' ');
  const bgColor = framesConfig?.BG || '#f3f2eb';

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '520vh',
        backgroundColor: bgColor,
        color: 'var(--color-ink)'
      }}
      className="light-section"
    >
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100svh',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 var(--side-padding)',
          perspective: '1200px'
        }}
        className="about-sticky-wrapper"
      >
        {/* Full-viewport canvas for character */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />

        {/* Left Column (Desktop: left third / Mobile: top zone) */}
        <div
          ref={leftColRef}
          style={{
            flex: '0 0 clamp(260px, 31vw, 400px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            textAlign: 'right',
            zIndex: 10,
            transform: 'translateZ(20px)'
          }}
          className="about-col-left"
        >
          <div className="section-label animate-rise" style={{ margin: '0 0 12px 0' }}>
            {chapter.tag}
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(44px, 5.2vw, 96px)',
            fontWeight: 400,
            lineHeight: .92,
            letterSpacing: 0,
            textTransform: 'uppercase',
            margin: '0 0 16px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <span className="animate-rise">{chapter.headingLine1}</span>
            <span
              className="animate-rise"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#8a867f',
                fontSize: '.92em',
                whiteSpace: 'nowrap',
                textTransform: 'none'
              }}
            >
              {chapter.headingLine2}
            </span>
          </h2>

          <div className="animate-rise" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1.5px solid rgba(14, 14, 15, 0.14)',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            letterSpacing: '0.04em'
          }}>
            {chapter.pill}
          </div>
        </div>

        {/* Center spacing gap to guarantee zero overlap on desktop */}
        <div style={{ flex: '1 1 auto', minWidth: ' clamp(240px, 28vw, 420px)', height: '100%', pointerEvents: 'none' }} className="about-center-spacer" />

        {/* Right Column (Desktop: right third / Mobile: bottom zone) */}
        <div
          ref={rightColRef}
          style={{
            flex: '0 0 clamp(260px, 31vw, 420px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            zIndex: 10,
            transform: 'translateZ(20px)'
          }}
          className="about-col-right"
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(17px, 1.5vw, 24px)',
            lineHeight: 1.55,
            color: '#3a3835',
            maxWidth: '24ch',
            margin: '0 0 24px 0',
            fontWeight: 450
          }}>
            {sentenceWords.map((word, wIdx) => (
              <span
                key={`${activeChapterIdx}-${wIdx}`}
                className="word-fade"
                style={{ display: 'inline-block', marginRight: '0.28em' }}
              >
                {word}
              </span>
            ))}
          </p>

          {/* Progress dashes */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {ABOUT_CHAPTERS.map((_, i) => (
              <div key={i} style={{
                width: i === activeChapterIdx ? '28px' : '10px',
                height: '3px',
                borderRadius: '2px',
                backgroundColor: i === activeChapterIdx ? 'var(--color-ink)' : 'rgba(14, 14, 15, 0.18)',
                transition: 'width 0.35s var(--ease-custom), background-color 0.35s ease'
              }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .about-sticky-wrapper {
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 24px var(--side-padding) 28px var(--side-padding) !important;
          }
          .about-center-spacer {
            display: none !important;
          }
          .about-col-left {
            flex: 0 0 auto !important;
            width: 100% !important;
            align-items: center !important;
            text-align: center !important;
          }
          .about-col-left h2 {
            align-items: center !important;
            font-size: clamp(34px, 6.5vw, 54px) !important;
            margin-bottom: 8px !important;
          }
          .about-col-right {
            flex: 0 0 auto !important;
            width: 100% !important;
            align-items: center !important;
            text-align: center !important;
          }
          .about-col-right p {
            font-size: clamp(14px, 3.8vw, 17px) !important;
            max-width: 34ch !important;
            margin-bottom: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
