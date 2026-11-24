import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Work() {
  const containerRef = useRef(null);
  const browserWindowRef = useRef(null);
  const middleContentRef = useRef(null);
  const visualScreenRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);

  // 8s auto-fill progress loop
  useEffect(() => {
    let animId;
    let startTime = performance.now();
    const duration = 8000;

    const loop = (now) => {
      if (isPlaying) {
        const elapsed = now - startTime;
        const p = Math.min(100, (elapsed / duration) * 100);
        setProgressPercent(p);

        if (elapsed >= duration) {
          setActiveTab((prev) => (prev + 1) % PROJECTS.length);
          startTime = performance.now();
        }
      } else {
        startTime = performance.now() - (progressPercent / 100) * duration;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeTab]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActiveTab((prev) => (prev + 1) % PROJECTS.length);
        setProgressPercent(0);
      } else if (e.key === 'ArrowLeft') {
        setActiveTab((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
        setProgressPercent(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Browser tilt up on scroll
  useEffect(() => {
    const el = browserWindowRef.current;
    if (!el) return;

    gsap.fromTo(el, {
      rotateX: 12,
      y: 60,
      opacity: 0,
      transformPerspective: 1200
    }, {
      rotateX: 0,
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 45%',
        scrub: 0.6
      }
    });
  }, []);

  // Content fade & visual reveal on tab switch
  useEffect(() => {
    if (middleContentRef.current) {
      gsap.fromTo(middleContentRef.current, {
        opacity: 0,
        filter: 'blur(8px)',
        y: 10
      }, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.45,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });
    }

    if (visualScreenRef.current) {
      gsap.fromTo(visualScreenRef.current, {
        clipPath: 'inset(0% 0% 100% 0%)'
      }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.55,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });
    }
  }, [activeTab]);

  const currentProject = PROJECTS[activeTab];

  return (
    <section
      id="work"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#fbfaf7',
        color: 'var(--color-ink)',
        padding: 'clamp(70px, 10vh, 140px) var(--side-padding)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
      className="light-section"
    >
      <div style={{ width: '100%', maxWidth: '1280px', marginBottom: '40px' }}>
        <div className="section-label">04 — Selected work</div>
        <h2 className="section-heading">
          Things I've <span className="accent-serif">built.</span>
        </h2>
      </div>

      {/* Modern Light Browser Window */}
      <div
        ref={browserWindowRef}
        style={{
          width: '100%',
          maxWidth: '1280px',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(14, 14, 15, 0.08)',
          boxShadow: '0 24px 60px rgba(14, 14, 15, 0.08), 0 4px 16px rgba(14, 14, 15, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Tabs Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f3f1ec',
          borderBottom: '1px solid rgba(14, 14, 15, 0.08)',
          padding: '12px 18px 0 18px',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {/* Traffic light dots */}
          <div style={{ display: 'flex', gap: '6px', marginRight: '16px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          </div>

          {/* Project Tabs */}
          {PROJECTS.map((proj, idx) => {
            const isActive = idx === activeTab;
            return (
              <button
                key={proj.id}
                onClick={() => {
                  setActiveTab(idx);
                  setProgressPercent(0);
                }}
                style={{
                  position: 'relative',
                  padding: '9px 18px',
                  borderRadius: '10px 10px 0 0',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? 'var(--color-ink)' : 'var(--color-ash)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{proj.title}</span>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: `${progressPercent}%`,
                    backgroundColor: 'var(--color-ink)'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Address Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(14, 14, 15, 0.06)',
          gap: '16px'
        }}>
          <div style={{
            flex: 1,
            maxWidth: '680px',
            backgroundColor: '#f6f4ef',
            borderRadius: '999px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--color-smoke)'
          }}>
            <span style={{ color: 'var(--color-ash)' }}>https://</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
              github.com/{currentProject.repoName}
            </span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#f6f4ef',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              cursor: 'pointer'
            }}
          >
            <span>{isPlaying ? '⏸ Pause' : '▶ Play'}</span>
          </button>
        </div>

        {/* Browser Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1.2fr 1fr',
          minHeight: '440px',
          padding: 'clamp(24px, 3.2vw, 44px)',
          gap: 'clamp(20px, 3vw, 40px)'
        }}
        className="work-browser-body"
        >
          {/* Left Sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderRight: '1px solid rgba(14, 14, 15, 0.08)',
            paddingRight: '18px'
          }}
          className="work-sidebar"
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-ash)'
            }}>
              Tech Stack
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentProject.stack.map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-ash)' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Details & Action Buttons */}
          <div
            ref={middleContentRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ash)'
                }}>
                  {currentProject.category}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: 'var(--color-silver)'
                }}>
                  {currentProject.num}
                </span>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(36px, 4.4vw, 58px)',
                fontWeight: 400,
                lineHeight: .95,
                letterSpacing: 0,
                textTransform: 'uppercase',
                margin: '0 0 16px 0'
              }}>
                <span>{currentProject.title} </span>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '.92em',
                  color: '#8a867f',
                  textTransform: 'none'
                }}>
                  {currentProject.accent}
                </span>
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--color-smoke)',
                marginBottom: '24px'
              }}>
                {currentProject.description}
              </p>
            </div>

            {/* Action Buttons: Live Demo & GitHub */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {currentProject.liveUrl && (
                <a
                  href={currentProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="OPEN"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-charcoal)',
                    color: 'var(--color-ivory)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    display: 'inline-block'
                  }} />
                  <span>Live Demo</span>
                  <span>↗</span>
                </a>
              )}

              <a
                href={currentProject.repoUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="OPEN"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: '1.5px solid rgba(14, 14, 15, 0.18)',
                  backgroundColor: '#ffffff',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
              >
                <span>GitHub Repo</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Right: Dark Rounded Screen with Live Monochrome Visual */}
          <div
            ref={visualScreenRef}
            style={{
              backgroundColor: 'var(--color-charcoal)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '260px',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {/* Visual 1: Document Scanner */}
            {currentProject.visualType === 'scanner' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 235, 228, 0.12)', paddingBottom: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-silver)' }}>
                    LIVE API STATUS
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                    ACTIVE 99.9%
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden', padding: '8px 0' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'var(--color-ivory)',
                    boxShadow: '0 0 10px var(--color-ivory)',
                    animation: 'scanBeam 3s ease-in-out infinite alternate'
                  }} />
                  <div style={{ height: '7px', width: '85%', backgroundColor: 'rgba(239, 235, 228, 0.25)', borderRadius: '4px' }} />
                  <div style={{ height: '7px', width: '60%', backgroundColor: 'rgba(239, 235, 228, 0.15)', borderRadius: '4px' }} />
                  <div style={{ height: '7px', width: '92%', backgroundColor: '#10b981', opacity: 0.85, borderRadius: '4px' }} />
                  <div style={{ height: '7px', width: '74%', backgroundColor: 'rgba(239, 235, 228, 0.2)', borderRadius: '4px' }} />
                  <div style={{ height: '7px', width: '45%', backgroundColor: 'rgba(239, 235, 228, 0.25)', borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {/* Visual 2: Animated Heatmap Grid */}
            {currentProject.visualType === 'heatmap' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', width: '100%' }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '6px',
                      backgroundColor: `rgba(239, 235, 228, ${0.06 + ((i * 17) % 75) / 100})`,
                      transition: 'transform 0.2s ease, background-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.backgroundColor = '#efebe4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = `rgba(239, 235, 228, ${0.06 + ((i * 17) % 75) / 100})`;
                    }}
                  />
                ))}
              </div>
            )}

            {/* Visual 3: Labelled pills orbiting glossy core */}
            {currentProject.visualType === 'orbit' && (
              <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute',
                  width: '190px',
                  height: '190px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(239, 235, 228, 0.15)',
                  animation: 'orbitSpin 16s linear infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(239, 235, 228, 0.25)',
                  animation: 'orbitSpin 10s linear infinite reverse'
                }} />
                <div style={{
                  position: 'absolute',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(239, 235, 228, 0.35)',
                  animation: 'orbitSpin 6s linear infinite'
                }} />

                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #efebe4 0%, #a8a49e 50%, #151517 100%)',
                  boxShadow: '0 0 16px rgba(239, 235, 228, 0.3)'
                }} />

                <div style={{
                  position: 'absolute',
                  top: '10px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-ivory)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  animation: 'orbitPill 16s linear infinite'
                }}>
                  STORE API
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanBeam {
          0% { top: 0%; }
          100% { top: 90%; }
        }
        @keyframes orbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 960px) {
          .work-browser-body {
            grid-template-columns: 1fr !important;
          }
          .work-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
