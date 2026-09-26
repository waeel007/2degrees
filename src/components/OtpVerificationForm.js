import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './OtpVerificationForm.css';

function OtpVerificationForm({ otpCode, otpError, isLoading, onOtpChange, onSubmit, onBack }) {
  const { t } = useLanguage();

  // Safe translations with fallbacks
  const safeT = {
    otpMessage: 'Please enter the OTP code we sent you to complete your verification.',
    otpCode: 'OTP Code',
    otpPlaceholder: '000000',
    confirmCode: 'Confirm code',
    verifying: 'Verifying...',
    ...t,
  };

  return (
    <div className="otpv-page">
      <div className="otpv-container">
        <h1 className="otpv-title">Verify your identity</h1>

        <p className="otpv-intro">{safeT.otpMessage}</p>

        <hr className="otpv-divider" />

        <h2 className="otpv-subtitle">Enter the code</h2>

        <form onSubmit={onSubmit}>
          <div className="otpv-field">
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
              className={`otpv-input ${otpError ? 'otpv-error' : ''}`}
              autoFocus
            />
            {otpError && <span className="otpv-error-msg">{otpError}</span>}
          </div>

          <div className="otpv-actions">
            <button
              type="submit"
              className="otpv-btn otpv-btn-continue"
              disabled={isLoading}
            >
              {isLoading ? safeT.verifying : safeT.confirmCode}
            </button>
            <button
              type="button"
              className="otpv-btn otpv-btn-cancel"
              onClick={onBack}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OtpVerificationForm;