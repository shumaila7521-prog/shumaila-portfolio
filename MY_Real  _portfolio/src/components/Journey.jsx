import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { JOURNEY_MILESTONES } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Journey() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const N = JOURNEY_MILESTONES.length;
  const totalHeightVh = 100 + N * 70; // 380vh for ultra-smooth scroll progression

  // Continuous animation state
  const stateRef = useRef({
    currentOffset: 0,
    targetOffset: 0,
    isDragging: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    isManual: false
  });

  const cardsContainerRef = useRef(null);

  // ScrollTrigger for scrubbing cards horizontally on page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        if (!stateRef.current.isDragging && !stateRef.current.isManual) {
          stateRef.current.targetOffset = self.progress * (N - 1);
        }
      }
    });

    // Render loop for smooth horizontal card carousel
    let animId;
    const render = () => {
      const state = stateRef.current;

      // Fallback direct scroll progress calculation
      if (!state.isDragging && !state.isManual) {
        const rect = el.getBoundingClientRect();
        const totalScroll = el.offsetHeight - window.innerHeight;
        if (totalScroll > 0) {
          const p = Math.max(0, Math.min(1, -rect.top / totalScroll));
          state.targetOffset = p * (N - 1);
        }
      }

      // Smooth lerp
      state.currentOffset += (state.targetOffset - state.currentOffset) * 0.14;

      const nearest = Math.max(0, Math.min(N - 1, Math.round(state.currentOffset)));
      setActiveIdx(nearest);

      // Position each card along horizontal axis
      if (cardsContainerRef.current) {
        const cardEls = cardsContainerRef.current.children;
        const stageW = stageRef.current ? stageRef.current.offsetWidth : window.innerWidth;
        const spacing = Math.min(380, Math.max(260, stageW * 0.32));

        for (let i = 0; i < cardEls.length; i++) {
          const card = cardEls[i];
          const dist = i - state.currentOffset;
          const absDist = Math.abs(dist);

          const x = dist * spacing;
          const scale = Math.max(0.72, 1 - absDist * 0.12);
          const opacity = Math.max(0.3, 1 - absDist * 0.32);
          const zIndex = Math.round(50 - absDist * 10);
          const rotateY = Math.max(-25, Math.min(25, dist * -8));

          card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, 0) scale(${scale}) rotateY(${rotateY}deg)`;
          card.style.opacity = `${opacity}`;
          card.style.zIndex = `${zIndex}`;

          const isCenter = absDist < 0.45;
          card.style.backgroundColor = isCenter ? 'var(--color-ivory)' : 'rgba(28, 28, 32, 0.75)';
          card.style.color = isCenter ? 'var(--color-ink)' : 'var(--color-silver)';
          card.style.boxShadow = isCenter ? '0 24px 60px rgba(0,0,0,0.55)' : 'none';
          card.style.border = isCenter ? 'none' : '1px solid rgba(239, 235, 228, 0.12)';
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      trigger.kill();
      cancelAnimationFrame(animId);
    };
  }, [N]);

  // Pointer drag handling
  const handlePointerDown = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const state = stateRef.current;
    state.isDragging = true;
    state.isManual = true;
    state.startX = clientX;
    state.lastX = clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
  }, []);

  const handlePointerMove = useCallback((e) => {
    const state = stateRef.current;
    if (!state.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const now = performance.now();
    const dt = Math.max(1, now - state.lastTime);
    const dx = clientX - state.lastX;

    state.velocity = dx / dt;
    state.lastX = clientX;
    state.lastTime = now;

    // Convert pixel delta into offset index delta
    const stageW = stageRef.current ? stageRef.current.offsetWidth : window.innerWidth;
    const spacing = Math.min(380, Math.max(260, stageW * 0.32));
    const offsetDelta = -dx / spacing;

    state.targetOffset = Math.max(-0.2, Math.min(N - 0.8, state.targetOffset + offsetDelta));
  }, [N]);

  const handlePointerUp = useCallback(() => {
    const state = stateRef.current;
    if (!state.isDragging) return;
    state.isDragging = false;

    // Fling momentum and snap
    const projected = state.targetOffset - state.velocity * 0.3;
    const snapIdx = Math.max(0, Math.min(N - 1, Math.round(projected)));
    state.targetOffset = snapIdx;

    setTimeout(() => {
      if (!state.isDragging) {
        state.isManual = false;
      }
    }, 1500);
  }, [N]);

  // Direct card click
  const handleCardClick = (idx) => {
    const state = stateRef.current;
    state.isManual = true;
    state.targetOffset = idx;
    setTimeout(() => {
      state.isManual = false;
    }, 1500);
  };

  const activeMilestone = JOURNEY_MILESTONES[activeIdx] || JOURNEY_MILESTONES[0];

  return (
    <section
      id="journey"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${totalHeightVh}vh`,
        backgroundColor: 'var(--color-ink)',
        color: 'var(--color-ivory)',
        userSelect: 'none'
      }}
      className="dark-section"
      data-cursor="DRAG"
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(36px, 5vh, 70px) var(--side-padding) clamp(24px, 4vh, 48px)',
          overflow: 'hidden',
          perspective: '1200px'
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Header matching reference reel: "THE ROAD so far" */}
        <div style={{ textAlign: 'center', zIndex: 60, pointerEvents: 'none' }}>
          <div className="section-label" style={{ justifyContent: 'center', margin: '0 0 10px 0' }}>
            06 — Journey
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(38px, 4.8vw, 76px)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: 0,
            textTransform: 'uppercase',
            margin: 0
          }}>
            THE ROAD <span style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--color-silver)',
              textTransform: 'none'
            }}>so far</span>
          </h2>
        </div>

        {/* Horizontal Coverflow Carousel Stage */}
        <div
          ref={stageRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1280px',
            height: 'clamp(320px, 42vh, 440px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none'
          }}
          data-cursor="DRAG"
        >
          <div
            ref={cardsContainerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          >
            {JOURNEY_MILESTONES.map((item, i) => {
              const isCenter = i === activeIdx;

              return (
                <div
                  key={i}
                  onClick={() => handleCardClick(i)}
                  data-cursor="DRAG"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 'clamp(280px, 30vw, 380px)',
                    height: 'clamp(280px, 36vh, 380px)',
                    borderRadius: '24px',
                    padding: 'clamp(22px, 2.6vw, 34px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity',
                    cursor: 'grab',
                    transition: 'background-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease'
                  }}
                >
                  {/* Card Top: Year & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(32px, 3.6vw, 48px)',
                      fontWeight: 400,
                      lineHeight: 1,
                      letterSpacing: 0
                    }}>
                      {item.year}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: isCenter ? '1px solid var(--color-ink)' : '1px solid rgba(239, 235, 228, 0.2)',
                      letterSpacing: '0.04em',
                      fontWeight: 600
                    }}>
                      {item.meta}
                    </span>
                  </div>

                  {/* Card Middle: Title & Institution */}
                  <div style={{ margin: 'auto 0', pointerEvents: 'none' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 2.5vw, 32px)',
                      lineHeight: 1.15,
                      marginBottom: '6px'
                    }}>
                      {item.title}
                    </h3>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      letterSpacing: '0.04em',
                      opacity: 0.75
                    }}>
                      {item.place}
                    </div>
                  </div>

                  {/* Card Bottom: Summary */}
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    opacity: 0.85,
                    margin: 0,
                    pointerEvents: 'none'
                  }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Indicator & Active Subtitle matching ref reel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 60,
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          {/* Active Title Subtitle */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            color: 'var(--color-silver)',
            letterSpacing: '0.06em',
            transition: 'opacity 0.25s ease'
          }}>
            {activeMilestone.title} — <span style={{ color: 'var(--color-ivory)' }}>{activeMilestone.place}</span>
          </div>

          {/* Progress Dashes */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {JOURNEY_MILESTONES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeIdx ? '32px' : '10px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: i === activeIdx ? 'var(--color-ivory)' : 'rgba(239, 235, 228, 0.2)',
                  transition: 'width 0.35s var(--ease-custom), background-color 0.35s ease'
                }}
              />
            ))}
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-ash)'
          }}>
            Stop 0{activeIdx + 1} of 0{N}
          </div>
        </div>
      </div>
    </section>
  );
}
