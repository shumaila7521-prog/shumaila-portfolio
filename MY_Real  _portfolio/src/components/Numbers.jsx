import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NUMBERS_DATA } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Numbers() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll('.scrub-word');
    const chips = el.querySelectorAll('.number-chip');

    // Scroll-scrub words from muted to ivory
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 75%',
        end: 'bottom 45%',
        scrub: 0.8
      }
    });

    words.forEach((word) => {
      tl.to(word, { color: '#efebe4', duration: 0.2 }, '+=0.02');
    });

    // Chips pop in and count up
    chips.forEach((chip) => {
      const valEl = chip.querySelector('.chip-value');
      const targetVal = parseFloat(chip.getAttribute('data-value'));
      const isFloat = chip.getAttribute('data-float') === 'true';
      const isText = chip.getAttribute('data-text') === 'true';
      const suffix = chip.getAttribute('data-suffix') || '';

      ScrollTrigger.create({
        trigger: chip,
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo(chip,
            { scale: 0.7, opacity: 0, y: 8 },
            { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.7)' });

          if (!isText && !isNaN(targetVal)) {
            const counter = { val: 0 };
            gsap.to(counter, {
              val: targetVal, duration: 1.2, ease: 'power2.out',
              onUpdate: () => {
                if (valEl) valEl.textContent = (isFloat ? counter.val.toFixed(2) : Math.round(counter.val)) + suffix;
              }
            });
          }
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars?.trigger === el) st.kill();
      });
    };
  }, []);

  return (
    <section
      id="numbers"
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', minHeight: '80vh',
        background: 'linear-gradient(180deg, #111113 0%, #18181b 100%)',
        color: 'var(--color-ivory)',
        padding: 'clamp(70px, 10vh, 130px) var(--side-padding)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}
      className="dark-section"
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'clamp(36px, 5vh, 60px)',
        borderBottom: '1px solid var(--color-lines)', paddingBottom: '18px'
      }}>
        <div className="section-label" style={{ margin: 0 }}>03 — In numbers</div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: '14px', color: 'var(--color-silver)'
        }}>
          One sentence, read it slowly
        </div>
      </div>

      {/* Scrubbed paragraph */}
      <div style={{
        fontFamily: 'var(--font-body)', fontWeight: 500,
        fontSize: 'clamp(34px, 4.6vw, 84px)', lineHeight: 1.3,
        letterSpacing: '-0.035em', maxWidth: '1240px'
      }}>
        {NUMBERS_DATA.tokens.map((token, i) => {
          if (token.text) {
            return token.text.split(' ').map((word, wIdx) => (
              <span
                key={`${i}-${wIdx}`}
                className="scrub-word"
                style={{
                  color: '#3b3a3e',
                  display: 'inline-block',
                  marginRight: '0.28em',
                  transition: 'color 0.2s ease'
                }}
              >
                {word}
              </span>
            ));
          }

          if (token.chip) {
            return (
              <span
                key={i}
                className="number-chip"
                data-value={token.value || 0}
                data-float={token.isFloat ? 'true' : 'false'}
                data-text={token.isText ? 'true' : 'false'}
                data-suffix={token.suffix || ''}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  verticalAlign: 'middle', margin: '0 6px 4px 6px',
                  padding: '5px 16px', borderRadius: '999px',
                  background: 'linear-gradient(135deg, #efebe4 0%, #cfcac2 100%)',
                  color: 'var(--color-ink)',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
                  fontSize: '0.66em', fontWeight: 700, lineHeight: 1
                }}
              >
                <span className="chip-value">
                  {token.isText ? token.chip : '0'}
                </span>
                {token.label && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.52em',
                    fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--color-smoke)',
                    borderLeft: '1px solid rgba(14, 14, 15, 0.2)',
                    paddingLeft: '6px', lineHeight: 1
                  }}>
                    {token.label}
                  </span>
                )}
              </span>
            );
          }
          return null;
        })}
      </div>
    </section>
  );
}
