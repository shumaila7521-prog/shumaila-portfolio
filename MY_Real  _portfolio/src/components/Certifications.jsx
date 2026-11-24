import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CERTIFICATIONS } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Certifications() {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const gridRef = useRef(null);
  const cardsRef = useRef([]);
  const countRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean);
    if (!container || cards.length === 0) return;

    // Stack offsets to bundle all cards in the center at the start
    const stackOffsets = [
      { xP: 150, yP: 12, rot: -14 },
      { xP: 50,  yP: -8, rot: 8 },
      { xP: -50, yP: 10, rot: -6 },
      { xP: -150, yP: -14, rot: 16 }
    ];

    const ctx = gsap.context(() => {
      // Set initial messy deck stack in the dead center
      cards.forEach((card, i) => {
        const offset = stackOffsets[i] || { xP: 0, yP: 0, rot: 0 };
        gsap.set(card, {
          xPercent: offset.xP,
          yPercent: offset.yP,
          rotation: offset.rot,
          scale: 0.62,
          transformOrigin: 'center center'
        });
      });

      // Pin the section for 220vh and scrub the exploding cards animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8
        }
      });

      // Explode and fan out from center pile into 4-column grid
      tl.to(cards, {
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale: 1,
        stagger: {
          each: 0.05,
          from: 'center'
        },
        ease: 'power3.out'
      }, 0);

      // Faint background count fades smoothly
      if (countRef.current) {
        tl.to(countRef.current, {
          opacity: 0,
          scale: 1.3,
          ease: 'power2.in'
        }, 0);
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="certifications"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '240vh',
        backgroundColor: '#ece8e1',
        background: 'radial-gradient(ellipse at 50% 50%, #fdfcfa 0%, #ece8e1 100%)',
        color: 'var(--color-ink)'
      }}
      className="light-section"
    >
      {/* Pinned 100vh Viewport */}
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
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(40px, 6vh, 80px) var(--side-padding) clamp(30px, 5vh, 60px)'
        }}
      >
        {/* Header matching reference reel: "PAPER trail" */}
        <div style={{ zIndex: 10 }}>
          <div className="section-label">07 — Certifications</div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(44px, 5.5vw, 88px)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: 0,
            textTransform: 'uppercase',
            margin: 0
          }}>
            PAPER <span style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#8a867f',
              textTransform: 'none'
            }}>trail</span>
          </h2>
        </div>

        {/* Faint center count watermark "04" */}
        <div
          ref={countRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(140px, 24vw, 340px)',
            color: 'rgba(14, 14, 15, 0.04)',
            pointerEvents: 'none',
            zIndex: 1,
            lineHeight: 1,
            userSelect: 'none'
          }}
          aria-hidden="true"
        >
          0{CERTIFICATIONS.length}
        </div>

        {/* 4-column Grid Stage */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'clamp(16px, 2vw, 24px)',
            zIndex: 5,
            width: '100%',
            maxWidth: '1380px',
            margin: 'auto 0'
          }}
          className="cert-cards-grid"
        >
          {CERTIFICATIONS.map((cert, idx) => {
            // Alternating luxury finishes: charcoal, white, smoke, stone
            let bg = 'var(--color-charcoal)';
            let textCol = 'var(--color-ivory)';
            let subTextCol = 'var(--color-silver)';
            let monoCol = 'rgba(239, 235, 228, 0.06)';
            let borderStyle = 'none';

            if (cert.style === 'white') {
              bg = '#ffffff';
              textCol = 'var(--color-ink)';
              subTextCol = '#5a5854';
              monoCol = 'rgba(14, 14, 15, 0.05)';
              borderStyle = '1px solid rgba(14, 14, 15, 0.08)';
            } else if (cert.style === 'smoke') {
              bg = 'var(--color-smoke)';
              textCol = 'var(--color-ivory)';
              subTextCol = 'var(--color-silver)';
              monoCol = 'rgba(239, 235, 228, 0.07)';
            } else if (cert.style === 'stone') {
              bg = '#dfdad1';
              textCol = 'var(--color-ink)';
              subTextCol = '#4a4844';
              monoCol = 'rgba(14, 14, 15, 0.07)';
            }

            return (
              <div
                key={idx}
                ref={(el) => (cardsRef.current[idx] = el)}
                data-cursor="VIEW"
                style={{
                  position: 'relative',
                  backgroundColor: bg,
                  color: textCol,
                  borderRadius: '24px',
                  padding: 'clamp(22px, 2.4vw, 32px)',
                  minHeight: 'clamp(260px, 32vh, 340px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  border: borderStyle,
                  overflow: 'hidden',
                  willChange: 'transform, opacity',
                  transition: 'box-shadow 0.3s ease'
                }}
                className="cert-card-item"
              >
                {/* Large watermark monogram */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-14px',
                    right: '12px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(80px, 9vw, 130px)',
                    color: monoCol,
                    pointerEvents: 'none',
                    lineHeight: 0.85,
                    userSelect: 'none'
                  }}
                  aria-hidden="true"
                >
                  {cert.initials}
                </div>

                {/* Top: Category Tag & Number */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    backgroundColor: cert.style === 'white' ? 'rgba(14, 14, 15, 0.06)' : 'rgba(239, 235, 228, 0.12)'
                  }}>
                    {cert.category}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: subTextCol,
                    fontWeight: 500
                  }}>
                    0{idx + 1}
                  </span>
                </div>

                {/* Middle & Bottom Info */}
                <div style={{ zIndex: 2, marginTop: 'auto' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: subTextCol,
                    letterSpacing: '0.04em',
                    marginBottom: '8px'
                  }}>
                    {cert.credential || cert.year}
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(20px, 2vw, 26px)',
                    lineHeight: 1.25,
                    marginBottom: '6px'
                  }}>
                    {cert.name}
                  </h3>

                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: subTextCol,
                    fontWeight: 500
                  }}>
                    {cert.issuer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom subtle progress hint */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#8a867f',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          0{CERTIFICATIONS.length} Credentials Collected
        </div>
      </div>

      <style>{`
        .cert-card-item:hover {
          box-shadow: 0 24px 50px rgba(0,0,0,0.18) !important;
        }
        @media (max-width: 900px) {
          .cert-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 540px) {
          .cert-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
