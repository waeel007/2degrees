import React from 'react';
import './Footer.css';
import nztaLogo from '../assets/nzta-logo.png';
import nzGov from '../assets/nzgov.png';

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
          <img
            src={nztaLogo}
            alt="NZ Transport Agency Waka Kotahi"
            className="nzta-footer-logo-nzta"
          />

          {/* NZ Government logo */}
          <img
            src={nzGov}
            alt="New Zealand Government"
            className="nzta-footer-logo-govt"
          />
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