import React, { useState, useEffect } from 'react';
import './Header.css';

function Header() {
  const [cartCount, setCartCount] = useState(() => {
    const saved = sessionStorage.getItem('cartCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    const handleCartUpdate = (e) => {
      setCartCount(e.detail || 0);
    };
    window.addEventListener('cartCountUpdated', handleCartUpdate);

    // Sync on mount in case sessionStorage changed
    const saved = sessionStorage.getItem('cartCount');
    if (saved) setCartCount(parseInt(saved, 10));

    return () => window.removeEventListener('cartCountUpdated', handleCartUpdate);
  }, []);

  return (
    <header className="twodegrees-header">
      <div className="twodegrees-header-inner">
        
        {/* Logo */}
        <div className="twodegrees-logo">
          <img 
            src={require('../assets/2dlogo.png')} 
            alt="2degrees" 
            className="twodegrees-logo-img" 
          />
        </div>

        {/* Navigation */}
        <nav className="twodegrees-nav">
          <div className="twodegrees-nav-top">
            <a href="#" className="active">Personal</a>
            <a href="#">Business</a>
          </div>
          <div className="twodegrees-nav-bottom">
            <a href="#" className="active">Mobile</a>
            <a href="#">Broadband</a>
            <a href="#">Power</a>
            <a href="#">Shop</a>
            <a href="#">Help</a>
          </div>
        </nav>

        {/* Right side actions */}
        <div className="twodegrees-actions">
          <div className="twodegrees-actions-top">
            <a href="#">Coverage</a>
            <a href="#">About</a>
            <a href="#">Roaming</a>
            <a href="#">Account</a>
          </div>
          <div className="twodegrees-actions-bottom">
            <button className="twodegrees-icon-btn twodegrees-cart-btn" aria-label="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartCount > 0 && (
                <span className="twodegrees-cart-badge">{cartCount}</span>
              )}
            </button>
            <button className="twodegrees-icon-btn" aria-label="Search">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* ─── HERO BANNER ─── */}
      <div className="twodegrees-hero">
        <div className="twodegrees-hero-inner">
          <div className="twodegrees-hero-text">
            <h1 className="twodegrees-hero-title">Time for a change of plan?</h1>
            <p className="twodegrees-hero-highlight">We have a plan</p>
            <p className="twodegrees-hero-desc">
              Whether you're after heaps of data or want gigs that carryover,<br />
              we've got plans starting at just $35.
            </p>
            <a href="#" className="twodegrees-hero-link">T&Cs apply</a>
          </div>
          <div className="twodegrees-hero-image">
            <img 
              src={require('../assets/smile2.png')} 
              alt="Smile" 
              className="twodegrees-hero-img" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;