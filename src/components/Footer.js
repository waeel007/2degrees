import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="nzta-footer">
      {/* ─── Top row: links + logos ─── */}
      <div className="nzta-footer-top">
        <div className="nzta-footer-links">
          <a href="https://www.nzta.govt.nz/contact-us" target="_blank" rel="noopener noreferrer">Contact</a>
          <a href="https://www.nzta.govt.nz/about-us/copyright" target="_blank" rel="noopener noreferrer">Copyright</a>
          <a href="https://www.nzta.govt.nz/about-us/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
        </div>

        <div className="nzta-footer-logos">
          {/* NZ Transport Agency logo */}
          <svg
            viewBox="0 0 220 55"
            className="nzta-footer-logo-nzta"
            aria-label="NZ Transport Agency Waka Kotahi"
          >
            <g fill="#ffffff">
              {/* Simple NZTA mark (M-like icon) */}
              <path d="M8 40 L8 12 L22 30 L36 12 L36 40 L30 40 L30 24 L22 36 L14 24 L14 40 Z" />
              <text x="46" y="22" fontSize="13" fontWeight="800" letterSpacing="0.5">NZ TRANSPORT</text>
              <text x="46" y="36" fontSize="12" fontWeight="700" letterSpacing="0.5">AGENCY</text>
              <text x="46" y="48" fontSize="9" fontStyle="italic" opacity="0.85">WAKA KOTAHI</text>
            </g>
          </svg>

          {/* NZ Government logo */}
          <div className="nzta-footer-logo-govt">
            <svg viewBox="0 0 44 44" className="nzta-govt-crest" aria-hidden="true">
              <circle cx="22" cy="22" r="20" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="22" cy="22" r="14" fill="none" stroke="#ffffff" strokeWidth="1" />
              <path d="M22 10 L22 34 M10 22 L34 22" stroke="#ffffff" strokeWidth="1" />
            </svg>
            <div className="nzta-govt-text">
              <div className="nzta-govt-title">New Zealand Government</div>
              <div className="nzta-govt-sub">Te Kāwanatanga o Aotearoa</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div className="nzta-footer-divider" />

      {/* ─── Bottom row: copyright + badge ─── */}
      <div className="nzta-footer-bottom">
        <span className="nzta-footer-copy">
          © {new Date().getFullYear()} NZ Transport Agency, all rights reserved
        </span>
        <span className="nzta-footer-badge" aria-hidden="true">🏛</span>
      </div>
    </footer>
  );
}

export default Footer;