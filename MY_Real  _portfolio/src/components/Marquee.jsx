import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MARQUEE_ITEMS } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Marquee() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let baseSpeed = 1.0;
    let scrollVelocity = 0;
    let currentX = 0;
    let skewX = 0;
    let animId;

    ScrollTrigger.create({
      onUpdate: (self) => {
        const vel = self.getVelocity() / 320;
        scrollVelocity = vel;
        skewX = Math.max(-6, Math.min(6, vel * -1.0));
      }
    });

    const loop = () => {
      scrollVelocity *= 0.92;
      skewX *= 0.92;

      const totalSpeed = baseSpeed + Math.abs(scrollVelocity);
      currentX -= totalSpeed;

      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(currentX) >= halfWidth) {
        currentX += halfWidth;
      }

      track.style.transform = `translate3d(${currentX}px, 0, 0) skewX(${skewX}deg)`;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const fullList = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--color-graphite)',
        padding: '24px 0',
        borderTop: '1px solid var(--color-lines)',
        borderBottom: '1px solid var(--color-lines)',
        userSelect: 'none'
      }}
      className="dark-section"
      aria-label="Skills Marquee"
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
          willChange: 'transform'
        }}
      >
        {fullList.map((item, idx) => {
          const isOutlined = idx % 2 === 0;
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'clamp(20px, 3vw, 36px)',
                padding: '0 clamp(14px, 1.8vw, 24px)'
              }}
            >
              {isOutlined ? (
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(28px, 3.2vw, 44px)',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(239, 235, 228, 0.45)'
                  }}
                >
                  {item}
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(30px, 3.4vw, 48px)',
                    color: 'var(--color-ivory)',
                    letterSpacing: '0.01em'
                  }}
                >
                  {item}
                </span>
              )}
              <span style={{ color: 'var(--color-ash)', fontSize: '16px' }}>✦</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
