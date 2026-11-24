import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { PERSONAL_INFO } from '../data';

const BUBBLES = [
  "Hi, I'm Shumaila!",
  "Hi there!",
  "Hello!",
  "Namaste!",
  "Hey, welcome!",
  "Hi again!"
];

export default function Hero({ framesLoaded, isPreloaded, framesConfig, getFrameImage }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const bgLettersRef = useRef([]);
  const floorLineRef = useRef(null);
  const leftNoteRef = useRef(null);
  const rightNoteRef = useRef(null);
  const bubbleRef = useRef(null);
  const introDoneRef = useRef(false);

  // Character state
  const charRef = useRef({
    x: 0,
    targetX: 0,
    vx: 0,
    facing: 1,       // 1: right, -1: left
    state: 'wave',   // 'wave', 'turn_to_profile', 'run_start', 'running', 'run_stop', 'turn_to_front'
    stateTime: 0,
    animFrame: 0,
    lean: 0,
    squashScaleX: 1,
    squashScaleY: 1,
    idleTimer: 0,
    bubbleIdx: 0,
    dustPuffs: []
  });

  const [bubbleText, setBubbleText] = useState(BUBBLES[0]);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleSide, setBubbleSide] = useState('right');

  // Intro animation on preloader complete
  useEffect(() => {
    if (!isPreloaded || introDoneRef.current) return;
    introDoneRef.current = true;

    const tl = gsap.timeline();

    if (floorLineRef.current) {
      tl.fromTo(floorLineRef.current,
        { scaleX: 0, transformOrigin: 'center center' },
        { scaleX: 1, duration: 1.1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }, 0);
    }
    if (bgLettersRef.current.length > 0) {
      tl.fromTo(bgLettersRef.current,
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.04, ease: 'power3.out' }, 0.2);
    }
    if (canvasRef.current) {
      tl.fromTo(canvasRef.current,
        { filter: 'blur(10px)', opacity: 0, y: 15 },
        { filter: 'blur(0px)', opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.3);
    }
    if (leftNoteRef.current && rightNoteRef.current) {
      tl.fromTo([leftNoteRef.current, rightNoteRef.current],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }, 0.4);
    }
  }, [isPreloaded]);

  // Pointer tracking (mouse and touch)
  useEffect(() => {
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relX = clientX - rect.left;
      charRef.current.targetX = Math.max(90, Math.min(rect.width - 90, relX));
      charRef.current.idleTimer = 0;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      if (charRef.current.x === 0) {
        charRef.current.x = rect.width / 2;
        charRef.current.targetX = rect.width / 2;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || window.innerWidth;
      const height = rect?.height || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Floor line position
      const floorDistFromBottom = Math.max(118, Math.min(170, height * 0.17));
      const floorY = height - floorDistFromBottom;

      // Character size (72% hero height, max 860px, 56% mobile)
      const isMobile = width < 768;
      const charTargetH = Math.min(860, height * (isMobile ? 0.56 : 0.72));
      const charTargetW = charTargetH * (640 / 1080);

      const state = charRef.current;
      const dist = state.targetX - state.x;
      const absDist = Math.abs(dist);

      // Side note fade
      if (leftNoteRef.current && rightNoteRef.current) {
        const ld = Math.abs(state.x - width * 0.15);
        const rd = Math.abs(state.x - width * 0.85);
        leftNoteRef.current.style.opacity = ld < 180 ? '0.08' : '1';
        rightNoteRef.current.style.opacity = rd < 180 ? '0.08' : '1';
      }

      // Parallax background letters
      if (bgLettersRef.current.length > 0) {
        const shiftX = (state.x - width / 2) * -0.04;
        bgLettersRef.current.forEach((el, idx) => {
          if (el) el.style.transform = `translateX(${shiftX * (1 + idx * 0.08)}px)`;
        });
      }

      // Frame configuration
      const rotEnd = framesConfig?.ROT?.end || 96;
      const rotRight = framesConfig?.ROT?.right || 70;
      const rotLeft = framesConfig?.ROT?.left || 27;

      const runLoopFrom = framesConfig?.RUN?.loopFrom || 91;
      const runLoopLen = framesConfig?.RUN?.loopLen || 21;

      // Snappy start ramp (last 16 frames before loop)
      const rampLen = 16;
      const rampFrom = Math.max(0, runLoopFrom - rampLen);

      // STATE MACHINE
      if (state.state === 'wave' || state.state === 'idle_wave') {
        state.idleTimer += dt;
        state.vx = 0;
        state.lean = 0;

        const waveTotal = framesConfig?.SEQ?.wave || 96;
        state.animFrame = (state.animFrame + dt * 26) % waveTotal;

        setBubbleVisible(true);
        setBubbleSide(state.x > width * 0.7 ? 'left' : 'right');

        if (absDist > 45) {
          state.state = 'turn_to_profile';
          state.stateTime = 0;
          state.facing = dist > 0 ? 1 : -1;
          setBubbleVisible(false);
        } else if (state.idleTimer > 6.5) {
          state.idleTimer = 0;
          state.bubbleIdx = (state.bubbleIdx + 1) % BUBBLES.length;
          setBubbleText(BUBBLES[state.bubbleIdx]);
        }
      } else if (state.state === 'turn_to_profile') {
        state.stateTime += dt;
        const dur = 0.22;
        const p = Math.min(1, state.stateTime / dur);

        if (state.facing === 1) {
          // Turning right: rotEnd (96) down to rotRight (70)
          state.animFrame = Math.round(rotEnd - p * (rotEnd - rotRight));
        } else {
          // Turning left: 0 up to rotLeft (27)
          state.animFrame = Math.round(p * rotLeft);
        }

        if (p >= 1) {
          state.state = 'run_start';
          state.stateTime = 0;
        }
      } else if (state.state === 'run_start') {
        state.stateTime += dt;
        const dur = 0.18;
        const p = Math.min(1, state.stateTime / dur);
        state.animFrame = Math.round(rampFrom + p * rampLen);

        if (p >= 1) {
          state.state = 'running';
          state.stateTime = 0;
          state.animFrame = runLoopFrom;
        }
      } else if (state.state === 'running') {
        // Relaxed, natural jog speed (140 to 230 px/s) — gentle and smooth
        const maxSpeed = Math.min(230, Math.max(140, width * 0.22));
        const targetSpeed = Math.min(maxSpeed, Math.max(70, absDist * 1.3));

        state.vx += (targetSpeed - state.vx) * 0.08;
        const moveStep = Math.sign(dist) * Math.min(absDist, state.vx * dt);
        state.x += moveStep;

        // Subtle, elegant forward lean
        const targetLean = Math.sign(dist) * Math.min(1.2, (state.vx / maxSpeed) * 1.2);
        state.lean += (targetLean - state.lean) * 0.1;

        // Sync loop advance strictly to ground velocity so feet never slide
        const fpsScale = Math.max(0.65, Math.min(1.15, state.vx / 180));
        state.animFrame = runLoopFrom +
          ((state.animFrame - runLoopFrom + dt * 24 * fpsScale + runLoopLen) % runLoopLen);

        // Ground dust puffs
        if (Math.random() < 0.26) {
          state.dustPuffs.push({
            x: state.x - state.facing * (charTargetW * 0.18),
            y: floorY - 3,
            vx: -state.facing * (Math.random() * 32 + 14),
            vy: -(Math.random() * 20 + 8),
            size: Math.random() * 3.2 + 2,
            alpha: 0.45,
            life: 0.32
          });
        }

        // Reversal of direction: flip facing with squash-and-stretch
        const newFacing = dist > 0 ? 1 : -1;
        if (newFacing !== state.facing && absDist > 35) {
          state.facing = newFacing;
          state.squashScaleX = 0.86;
          state.squashScaleY = 1.12;
        }

        state.squashScaleX += (1 - state.squashScaleX) * 0.15;
        state.squashScaleY += (1 - state.squashScaleY) * 0.15;

        // Target reached
        if (absDist <= 16) {
          state.state = 'run_stop';
          state.stateTime = 0;
          state.lean = 0;
        }
      } else if (state.state === 'run_stop') {
        state.stateTime += dt;
        const dur = 0.18;
        const p = Math.min(1, state.stateTime / dur);
        state.animFrame = Math.round(rampFrom + rampLen * (1 - p));

        if (p >= 1) {
          state.state = 'turn_to_front';
          state.stateTime = 0;
        }
      } else if (state.state === 'turn_to_front') {
        state.stateTime += dt;
        const dur = 0.22;
        const p = Math.min(1, state.stateTime / dur);

        if (state.facing === 1) {
          // Right profile to front: 70 up to 96
          state.animFrame = Math.round(rotRight + p * (rotEnd - rotRight));
        } else {
          // Left profile to front: 27 down to 0
          state.animFrame = Math.round(rotLeft * (1 - p));
        }

        if (p >= 1) {
          state.state = 'wave';
          state.animFrame = 0;
          state.stateTime = 0;
          state.idleTimer = 0;
          state.bubbleIdx = (state.bubbleIdx + 1) % BUBBLES.length;
          setBubbleText(BUBBLES[state.bubbleIdx]);
        }
      }

      // Update dust puffs
      for (let i = state.dustPuffs.length - 1; i >= 0; i--) {
        const pf = state.dustPuffs[i];
        pf.x += pf.vx * dt;
        pf.y += pf.vy * dt;
        pf.size += dt * 5;
        pf.alpha -= dt * (0.5 / pf.life);
        if (pf.alpha <= 0) state.dustPuffs.splice(i, 1);
      }

      // CLEAR & DRAW CANVAS
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Contact shadow under feet
      const shadowW = charTargetW * 0.52;
      const grad = ctx.createRadialGradient(state.x, floorY, 0, state.x, floorY, shadowW / 2);
      grad.addColorStop(0, 'rgba(14, 14, 15, 0.24)');
      grad.addColorStop(0.6, 'rgba(14, 14, 15, 0.06)');
      grad.addColorStop(1, 'rgba(14, 14, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(state.x, floorY, shadowW / 2, shadowW * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw dust puffs
      state.dustPuffs.forEach((pf) => {
        ctx.fillStyle = `rgba(111, 108, 104, ${Math.max(0, pf.alpha)})`;
        ctx.beginPath();
        ctx.arc(pf.x, pf.y, pf.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Frame selection and direction mirroring
      let frameType = 'wave';
      let frameIndex = Math.floor(state.animFrame);
      let mirror = 1;

      if (state.state === 'running' || state.state === 'run_start' || state.state === 'run_stop') {
        frameType = 'run';
        frameIndex = Math.max(0, Math.min(frameIndex, (framesConfig?.SEQ?.run || 144) - 1));
        // The original video jog faces RIGHT.
        // When running LEFT (facing === -1), flip horizontally (mirror = -1)!
        mirror = state.facing === -1 ? -1 : 1;
      } else if (state.state === 'turn_to_profile' || state.state === 'turn_to_front') {
        frameType = 'rot';
        frameIndex = Math.max(0, Math.min(frameIndex, (framesConfig?.SEQ?.rot || 97) - 1));
        mirror = 1;
      } else {
        frameType = 'wave';
        frameIndex = Math.max(0, Math.min(frameIndex, (framesConfig?.SEQ?.wave || 96) - 1));
        mirror = 1;
      }

      const img = getFrameImage ? getFrameImage(frameType, frameIndex) : null;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(state.x, floorY);
        ctx.rotate((state.lean * Math.PI) / 180);
        ctx.scale(mirror * state.squashScaleX, state.squashScaleY);

        ctx.drawImage(img, -charTargetW / 2, -charTargetH, charTargetW, charTargetH);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [framesLoaded, framesConfig, getFrameImage]);

  const bgColor = framesConfig?.BG || '#f3f2eb';

  return (
    <section
      id="hero"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100svh',
        minHeight: '620px',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 40%, #fdfcfa 0%, ${bgColor} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}
      className="light-section"
    >
      {/* Drifting blurred blobs */}
      <div style={{
        position: 'absolute', top: '12%', left: '15%',
        width: '40vw', height: '40vw', maxWidth: '480px', maxHeight: '480px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(207,202,194,.4) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '10%',
        width: '35vw', height: '35vw', maxWidth: '420px', maxHeight: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,164,158,.35) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none'
      }} />

      {/* Giant first name in Anton */}
      <div
        style={{
          position: 'absolute', top: '13vh', left: 0, width: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none', zIndex: 1
        }}
        aria-hidden="true"
      >
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(140px, 25vw, 480px)',
          fontWeight: 400, lineHeight: .9, letterSpacing: '0.04em',
          textTransform: 'uppercase', display: 'flex', margin: 0
        }}>
          {PERSONAL_INFO.firstName.split('').map((char, i) => (
            <span
              key={i}
              ref={(el) => (bgLettersRef.current[i] = el)}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(180deg, rgba(28,27,25,.11) 0%, rgba(28,27,25,.02) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                transition: 'transform 0.1s ease-out'
              }}
            >
              {char}
            </span>
          ))}
        </h1>
      </div>

      {/* Side notes at 46% height */}
      <div
        ref={leftNoteRef}
        style={{
          position: 'absolute', top: '46%', left: 'var(--side-padding)',
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: '4px',
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          letterSpacing: '0.04em', color: 'var(--color-ash)',
          zIndex: 2, pointerEvents: 'none', transition: 'opacity 0.25s ease'
        }}
      >
        <span>— PORTFOLIO — {PERSONAL_INFO.year}</span>
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{PERSONAL_INFO.role}</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-smoke)' }}>
          crafting products that move.
        </span>
      </div>

      <div
        ref={rightNoteRef}
        style={{
          position: 'absolute', top: '46%', right: 'var(--side-padding)',
          transform: 'translateY(-50%)', textAlign: 'right',
          display: 'flex', flexDirection: 'column', gap: '4px',
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          letterSpacing: '0.04em', color: 'var(--color-ash)',
          zIndex: 2, pointerEvents: 'none', transition: 'opacity 0.25s ease'
        }}
      >
        <span>Currently</span>
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{PERSONAL_INFO.subRole}</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-smoke)' }}>
          {PERSONAL_INFO.company}
        </span>
      </div>

      {/* Character Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 5, pointerEvents: 'none'
        }}
      />

      {/* Speech bubble beside head */}
      <div
        ref={bubbleRef}
        style={{
          position: 'absolute', top: '28%',
          left: charRef.current.x,
          transform: `translate(${bubbleSide === 'right' ? '25px' : '-125%'}, ${bubbleVisible ? '-14px' : '0px'})`,
          opacity: bubbleVisible ? 1 : 0,
          filter: bubbleVisible ? 'blur(0px)' : 'blur(8px)',
          backgroundColor: 'var(--color-charcoal)',
          color: 'var(--color-ivory)',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 'clamp(14px, 1.3vw, 17px)',
          padding: '10px 18px', borderRadius: '999px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          pointerEvents: 'none', zIndex: 10,
          transition: 'opacity 0.5s var(--ease-custom), transform 0.5s var(--ease-custom), filter 0.5s var(--ease-custom)',
          whiteSpace: 'nowrap'
        }}
      >
        {bubbleText}
      </div>

      {/* Floor line */}
      <div
        ref={floorLineRef}
        style={{
          position: 'absolute',
          bottom: 'clamp(118px, 17vh, 170px)',
          left: 'var(--side-padding)', right: 'var(--side-padding)',
          height: '1px',
          backgroundColor: 'rgba(14, 14, 15, 0.12)',
          zIndex: 4
        }}
      />

      {/* Under floor: Name + summary + action pills */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%',
        height: 'clamp(118px, 17vh, 170px)',
        padding: '0 var(--side-padding)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10, pointerEvents: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '620px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 3.4vw, 42px)',
              fontWeight: 400, color: 'var(--color-ink)', letterSpacing: 0,
              textTransform: 'uppercase', lineHeight: 1
            }}>
              {PERSONAL_INFO.firstName}
            </span>
            <span style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 'clamp(24px, 3vw, 36px)', color: '#8a867f', lineHeight: 1
            }}>
              Developer
            </span>
          </div>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'clamp(13px, 1.1vw, 15px)',
            color: 'var(--color-smoke)', margin: 0, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {PERSONAL_INFO.oneSentenceHero}
          </p>
        </div>

        {/* Action Pills */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href="#work"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '11px 22px', borderRadius: '999px',
              backgroundColor: 'var(--color-charcoal)', color: 'var(--color-ivory)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'transform 0.2s var(--ease-custom)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            See my work
          </a>
          <a
            href="#contact"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '10px 20px', borderRadius: '999px',
              border: '1.5px solid var(--color-ink)', color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'transform 0.2s var(--ease-custom)'
            }}
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
}
