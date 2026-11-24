import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SKILLS_DATA } from '../data';

gsap.registerPlugin(ScrollTrigger);

const FILTER_KEYS = ['All', 'Languages', 'Frontend', 'Backend', 'Databases', 'Tools', 'Core', 'Shake all ✦'];

export default function Skills() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const bodiesRef = useRef([]);
  const wallsRef = useRef([]);

  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {
      Engine,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
      Body
    } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.15 }
    });
    engineRef.current = engine;

    const parentDiv = canvas.parentElement;
    let width = parentDiv ? parentDiv.offsetWidth : Math.min(window.innerWidth - 60, 1100);
    if (!width || width < 300) width = 1000;
    const height = 480;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // 4 Walls around the pit
    const wallOptions = { isStatic: true, restitution: 0.5, friction: 0.1 };
    const ground = Bodies.rectangle(width / 2, height + 25, width * 3, 50, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -180, width * 3, 50, wallOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height * 3, wallOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height * 3, wallOptions);
    wallsRef.current = [ground, ceiling, leftWall, rightWall];

    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    // Mouse drag support
    const mouse = Mouse.create(canvas);
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.25,
        render: { visible: false }
      }
    });

    Composite.add(engine.world, mouseConstraint);

    // Create pills immediately on mount so canvas is NEVER blank
    const pills = [];
    const styles = ['ivory-grad', 'outline', 'smoke-grad'];

    let idx = 0;
    Object.entries(SKILLS_DATA).forEach(([cat, list]) => {
      list.forEach((skill) => {
        const textLen = skill.length;
        const w = Math.max(92, textLen * 12 + 34);
        const h = 42;
        const x = (width * 0.12) + (Math.random() * (width * 0.76));
        const y = -30 - (idx * 20);

        const body = Bodies.rectangle(x, y, w, h, {
          chamfer: { radius: 21 },
          restitution: 0.48,
          friction: 0.12,
          frictionAir: 0.015
        });

        body.customData = {
          skill,
          category: cat,
          width: w,
          height: h,
          styleType: styles[idx % styles.length],
          dimmed: false,
          highlighted: false
        };

        pills.push(body);
        idx++;
      });
    });

    bodiesRef.current = pills;
    Composite.add(engine.world, pills);

    // When scrolling into view, trigger a dynamic pop
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 75%',
      onEnter: () => {
        pills.forEach((b) => {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.03,
            y: -(Math.random() * 0.04 + 0.01)
          });
        });
      }
    });

    const runner = Runner.create();
    Runner.run(runner, engine);

    // Resize handler to adjust walls
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const newW = canvas.parentElement.offsetWidth;
      if (!newW || Math.abs(newW - width) < 10) return;
      width = newW;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      Body.setPosition(ground, { x: width / 2, y: height + 25 });
      Body.setPosition(ceiling, { x: width / 2, y: -180 });
      Body.setPosition(leftWall, { x: -25, y: height / 2 });
      Body.setPosition(rightWall, { x: width + 25, y: height / 2 });
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    let animId;
    const renderLoop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Faint "STACK" watermark in Anton font
      ctx.save();
      const wmSize = Math.max(70, Math.min(width * 0.16, 170));
      ctx.font = `normal 400 ${wmSize}px 'Anton', sans-serif`;
      ctx.fillStyle = 'rgba(239, 235, 228, 0.035)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STACK', width / 2, height / 2 + 10);
      ctx.restore();

      // Render bodies and prevent out-of-bounds escape
      bodiesRef.current.forEach((body) => {
        let { x, y } = body.position;
        const angle = body.angle;
        const data = body.customData;
        if (!data) return;

        // Safety net: if pill escaped viewport, rescue it!
        if (y > height + 60 || y < -350 || x < -80 || x > width + 80) {
          Body.setPosition(body, {
            x: width * 0.2 + Math.random() * (width * 0.6),
            y: 40 + Math.random() * 80
          });
          Body.setVelocity(body, { x: 0, y: 1 });
          x = body.position.x;
          y = body.position.y;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const w = data.width;
        const h = data.height;
        const r = h / 2;

        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);

        if (data.styleType === 'ivory-grad') {
          const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
          grad.addColorStop(0, '#efebe4');
          grad.addColorStop(1, '#cfcac2');
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (data.styleType === 'smoke-grad') {
          const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
          grad.addColorStop(0, '#37363b');
          grad.addColorStop(1, '#26262a');
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(28, 28, 31, 0.9)';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(239, 235, 228, 0.25)';
          ctx.stroke();
        }

        if (data.highlighted) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#efebe4';
          ctx.shadowColor = 'rgba(239, 235, 228, 0.5)';
          ctx.shadowBlur = 14;
          ctx.stroke();
        }

        if (data.dimmed) {
          ctx.fillStyle = 'rgba(14, 14, 15, 0.72)';
          ctx.fill();
        }

        ctx.font = "500 12px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = data.styleType === 'ivory-grad' ? '#0e0e0f' : '#efebe4';
        if (data.dimmed) {
          ctx.fillStyle = 'rgba(239, 235, 228, 0.22)';
        }
        ctx.fillText(data.skill.toUpperCase(), 0, 1);

        ctx.restore();
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, []);

  const handleFilterClick = (cat) => {
    setActiveFilter(cat);

    if (cat === 'Shake all ✦') {
      bodiesRef.current.forEach((body) => {
        Matter.Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.08,
          y: -(Math.random() * 0.14 + 0.04)
        });
        body.customData.dimmed = false;
        body.customData.highlighted = true;
      });
      return;
    }

    bodiesRef.current.forEach((body) => {
      const match = (cat === 'All' || body.customData.category === cat);
      body.customData.dimmed = !match;
      body.customData.highlighted = match && cat !== 'All';

      if (match && cat !== 'All') {
        Matter.Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.035,
          y: -(Math.random() * 0.09 + 0.03)
        });
      }
    });
  };

  return (
    <section
      id="skills"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        background: 'linear-gradient(180deg, #111113 0%, #0e0e0f 100%)',
        color: 'var(--color-ivory)',
        padding: 'clamp(70px, 10vh, 140px) var(--side-padding)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
      className="dark-section"
    >
      <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '28px' }}>
        <div className="section-label">05 — Toolbox</div>
        <h2 className="section-heading" style={{ marginBottom: '24px' }}>
          Grab a skill, <span className="accent-serif">throw it around.</span>
        </h2>

        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          {FILTER_KEYS.map((key) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => handleFilterClick(key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'var(--color-ivory)' : 'rgba(239, 235, 228, 0.06)',
                  color: isActive ? 'var(--color-ink)' : 'var(--color-silver)',
                  border: isActive ? 'none' : '1px solid rgba(239, 235, 228, 0.1)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Physics Pit */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          height: '460px',
          borderRadius: '24px',
          backgroundColor: 'var(--color-charcoal)',
          border: '1px solid rgba(239, 235, 228, 0.08)',
          boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          position: 'relative'
        }}
        data-cursor="DRAG"
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>
    </section>
  );
}
