import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Touch devices — hide entirely
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let visible = false;
    let hovered = false;
    let disc = false;
    let isDown = false;
    let isLight = false;
    let cursorLabel = '';
    let targetSize = 36;
    let currentSize = 36;
    let animId;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const text = textRef.current;
    if (!dot || !ring || !text) return;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;

      const target = e.target.closest('[data-cursor], a, button, [role="button"]');
      isLight = Boolean(e.target.closest('.light-section'));

      if (target) {
        const customType = target.getAttribute('data-cursor');
        if (customType) {
          disc = true;
          hovered = false;
          cursorLabel = customType.toUpperCase();
        } else {
          disc = false;
          hovered = true;
          cursorLabel = '';
        }
      } else {
        disc = false;
        hovered = false;
        cursorLabel = '';
      }
    };

    const onMouseDown = () => {
      isDown = true;
    };

    const onMouseUp = () => {
      isDown = false;
    };

    const onMouseLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const render = () => {
      const factor = 0.16;
      ringX += (mouseX - ringX) * factor;
      ringY += (mouseY - ringY) * factor;

      if (disc) {
        targetSize = isDown ? 68 : 84;
      } else if (hovered) {
        targetSize = isDown ? 46 : 58;
      } else {
        targetSize = isDown ? 26 : 36;
      }

      currentSize += (targetSize - currentSize) * 0.22;
      const s = Math.round(currentSize * 10) / 10;
      const offset = s / 2;

      ring.style.transform = `translate3d(${ringX - offset}px, ${ringY - offset}px, 0)`;
      ring.style.width = `${s}px`;
      ring.style.height = `${s}px`;

      // Visual styling with high contrast adaptation
      if (disc) {
        ring.style.backgroundColor = isLight ? '#0e0e0f' : '#efebe4';
        ring.style.border = 'none';
        ring.style.boxShadow = isLight ? '0 10px 28px rgba(0,0,0,0.22)' : '0 10px 28px rgba(0,0,0,0.5)';
        text.textContent = cursorLabel;
        text.style.color = isLight ? '#efebe4' : '#0e0e0f';
        text.style.opacity = '1';
        dot.style.opacity = '0';
      } else if (hovered) {
        ring.style.backgroundColor = isLight ? 'rgba(14, 14, 15, 0.08)' : 'rgba(239, 235, 228, 0.08)';
        ring.style.border = isLight ? '1.5px solid rgba(14, 14, 15, 0.75)' : '1.5px solid rgba(239, 235, 228, 0.75)';
        ring.style.boxShadow = 'none';
        text.style.opacity = '0';
        text.textContent = '';
        if (visible) {
          dot.style.opacity = '1';
          dot.style.backgroundColor = isLight ? '#0e0e0f' : '#efebe4';
        }
      } else {
        ring.style.backgroundColor = 'transparent';
        ring.style.border = isLight ? '1px solid rgba(14, 14, 15, 0.35)' : '1px solid rgba(239, 235, 228, 0.35)';
        ring.style.boxShadow = 'none';
        text.style.opacity = '0';
        text.textContent = '';
        if (visible) {
          dot.style.opacity = '1';
          dot.style.backgroundColor = isLight ? '#0e0e0f' : '#efebe4';
        }
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* 6px precision center dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#efebe4',
          pointerEvents: 'none',
          zIndex: 10001,
          opacity: 0,
          transition: 'background-color 0.2s ease',
          willChange: 'transform'
        }}
        aria-hidden="true"
      />

      {/* Interactive trailing ring / disc */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(239, 235, 228, 0.35)',
          backgroundColor: 'transparent',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
          willChange: 'transform, width, height'
        }}
        aria-hidden="true"
      >
        <span
          ref={textRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '10.5px',
            letterSpacing: '0.12em',
            opacity: 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        />
      </div>
    </>
  );
}
