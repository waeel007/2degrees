import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="twodegrees-footer">
      {/* ─── Top section (blue) ─── */}
      <div className="twodegrees-footer-top">
        <div className="twodegrees-footer-inner">

          {/* Column 1: Follow us */}
          <div className="twodegrees-footer-col">
            <h4 className="twodegrees-footer-heading">Follow us</h4>
            <ul className="twodegrees-footer-list twodegrees-footer-social">
              <li><a href="#"><span className="twodegrees-footer-icon">f</span> Facebook</a></li>
              <li><a href="#"><span className="twodegrees-footer-icon">𝕏</span> X (Twitter)</a></li>
              <li><a href="#"><span className="twodegrees-footer-icon">◎</span> Instagram</a></li>
              <li><a href="#"><span className="twodegrees-footer-icon">▶</span> YouTube</a></li>
              <li><a href="#"><span className="twodegrees-footer-icon">in</span> LinkedIn</a></li>
            </ul>
          </div>

          {/* Column 2: About */}
          <div className="twodegrees-footer-col">
            <h4 className="twodegrees-footer-heading">About 2degrees</h4>
            <ul className="twodegrees-footer-list">
              <li><a href="#">About us</a></li>
              <li><a href="#">Join our team</a></li>
              <li><a href="#">2degrees App</a></li>
              <li><a href="#">Data Clock</a></li>
              <li><a href="#">Fighting for Fair</a></li>
              <li><a href="#">News &amp; Media Releases</a></li>
              <li><a href="#">Coverage</a></li>
            </ul>
          </div>

          {/* Column 3: Shop */}
          <div className="twodegrees-footer-col">
            <h4 className="twodegrees-footer-heading">Shop</h4>
            <ul className="twodegrees-footer-list">
              <li><a href="#">Mobile phones</a></li>
              <li><a href="#">Wearables</a></li>
              <li><a href="#">Tablets</a></li>
              <li><a href="#">Hello Deals</a></li>
              <li><a href="#">Trade In</a></li>
            </ul>
          </div>

          {/* Column 4: Fighting for Fair logo */}
          <div className="twodegrees-footer-col twodegrees-footer-brand">
            <div className="twodegrees-footer-brand-text">
              FIGHTING<br />FOR FAIR
            </div>
            <img src={require('../assets/2dlogo.png')} alt="2degrees" className="twodegrees-footer-brand-logo" />
          </div>

        </div>
      </div>

      {/* ─── Bottom section (dark) ─── */}
      <div className="twodegrees-footer-bottom">
        <div className="twodegrees-footer-inner twodegrees-footer-bottom-inner">

          <div className="twodegrees-footer-copy">
            © Two Degrees Mobile Limited {new Date().getFullYear()}.<br />
            All rights reserved.
          </div>

          <div className="twodegrees-footer-legal">
            <a href="#">Accessibility</a>
            <span className="twodegrees-footer-sep">|</span>
            <a href="#">Privacy Policy</a>
            <span className="twodegrees-footer-sep">|</span>
            <a href="#">Terms and Conditions</a>
          </div>

          <div className="twodegrees-footer-badge" aria-hidden="true">

          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;