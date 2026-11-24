import React, { useState } from 'react';
import { PERSONAL_INFO } from '../data';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Numbers', href: '#numbers' },
  { label: 'Work', href: '#work' },
  { label: 'Skills', href: '#skills' },
  { label: 'Journey', href: '#journey' },
  { label: 'Certificates', href: '#certifications' },
  { label: 'Contact', href: '#contact' }
];

export default function Nav({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(18px, 3vw, 36px) var(--side-padding)',
          zIndex: 100,
          background: 'transparent',
          pointerEvents: 'auto'
        }}
        aria-label="Main Navigation"
      >
        {/* Initials */}
        <a
          href="#hero"
          onClick={(e) => handleLinkClick(e, '#hero')}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '2px',
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            fontWeight: 400,
            letterSpacing: '0',
            color: 'var(--color-ink)',
            textDecoration: 'none'
          }}
        >
          <span>S</span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-ash)' }}>©</span>
        </a>

        {/* Desktop Links */}
        <div className="desktop-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 2.2vw, 32px)'
        }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="nav-link-item"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                color: '#4a4844',
                position: 'relative',
                display: 'inline-block',
                overflow: 'hidden',
                height: '19px',
                lineHeight: '19px'
              }}
            >
              <span className="nav-link-inner">
                <span className="nav-link-primary" style={{ display: 'block', height: '19px', lineHeight: '19px' }}>{link.label}</span>
                <span className="nav-link-secondary" aria-hidden="true" style={{ display: 'block', height: '19px', lineHeight: '19px' }}>{link.label}</span>
              </span>
            </a>
          ))}
        </div>

        {/* Open to work pill & Mobile Burger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-charcoal)',
              color: 'var(--color-ivory)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'transform 0.2s var(--ease-custom)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}
            className="open-to-work-pill"
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block',
              animation: 'pulseGreen 2s infinite'
            }} />
            <span>Open to work</span>
          </a>

          {/* Mobile burger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-burger-btn"
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '5px',
              width: '36px',
              height: '36px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '22px',
              height: '2px',
              backgroundColor: 'var(--color-ink)',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }} />
            <span style={{
              width: '22px',
              height: '2px',
              backgroundColor: 'var(--color-ink)',
              transition: 'opacity 0.2s ease',
              opacity: menuOpen ? 0 : 1
            }} />
            <span style={{
              width: '22px',
              height: '2px',
              backgroundColor: 'var(--color-ink)',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
            }} />
          </button>
        </div>
      </nav>

      {/* Full screen mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--color-ink)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            padding: '40px'
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              color: 'var(--color-ivory)',
              fontSize: '32px',
              lineHeight: 1
            }}
          >
            ×
          </button>

          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(32px, 7vw, 48px)',
                fontWeight: 400,
                color: 'var(--color-ivory)',
                letterSpacing: '0',
                lineHeight: 1.2,
                textTransform: 'uppercase'
              }}
            >
              {link.label}
            </a>
          ))}

          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            style={{
              marginTop: '16px',
              padding: '12px 28px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-ivory)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.04em',
              fontWeight: 600
            }}
          >
            {PERSONAL_INFO.email}
          </a>
        </div>
      )}

      <style>{`
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @media (max-width: 1100px) {
          .desktop-nav-links { display: none !important; }
          .mobile-burger-btn { display: flex !important; }
        }
        .nav-link-inner {
          display: flex;
          flex-direction: column;
          transition: transform 0.28s var(--ease-custom);
        }
        .nav-link-secondary {
          color: var(--color-ink);
          font-weight: 600;
        }
        .nav-link-item:hover .nav-link-inner {
          transform: translateY(-19px);
        }
      `}</style>
    </>
  );
}
