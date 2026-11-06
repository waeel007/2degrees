import React, { useEffect, useState } from 'react';
import './CaptchaVerification.css';

function CaptchaVerification({ onSuccess }) {
  const [userIP, setUserIP] = useState('Loading...');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // ✅ FIX: If the user already verified in this session, skip everything
    if (sessionStorage.getItem('captcha_verified') === 'true') {
      onSuccess();
      return;
    }

    // Get user IP address
    const fetchUserIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
      } catch (error) {
        console.error('Failed to get IP:', error);
        setUserIP('Unable to detect');
      }
    };

    // Set current time in UTC format
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
      setCurrentTime(formattedTime);
    };

    fetchUserIP();
    updateTime();
    
    // Update time every second
    const interval = setInterval(updateTime, 1000);

    // Define global callback for reCAPTCHA
    window.handleCaptchaSuccess = (response) => {
      if (response) {
        // ✅ FIX: Save the verified flag so it never shows again on reload
        sessionStorage.setItem('captcha_verified', 'true'); 
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    };

    // Load reCAPTCHA script (English)
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?hl=en';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.handleCaptchaSuccess;
      clearInterval(interval);
    };
  }, [onSuccess]);

  // Get current URL
  const currentURL = window.location.href;

  return (
    <div className="sorry-page">
      <div className="sorry-container">
        <hr className="sorry-hr" />
        
        <div 
          className="g-recaptcha"
          data-sitekey="6Lfj23EtAAAAAMPPg0FfH2gRIWGuxxDzr0qXMOmM"
          data-callback="handleCaptchaSuccess"
        ></div>

        <hr className="sorry-hr" />
        
        <div className="sorry-info">
          <b>About this page</b><br /><br />
          
          Our systems have detected unusual traffic from your computer network. 
          This page checks to see if the requests are really coming from you, 
          and not from a robot. 
          <a href="#" className="sorry-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('infoDiv').style.display = 'block';
          }}> Why?</a><br /><br />

          <div id="infoDiv" style={{ display: 'none' }}>
            This page appears when Google automatically detects requests coming 
            from your computer network that appear to violate the 
            <a href="https://www.google.com/policies/terms/"> Terms of Service</a>. 
            The block will expire after the requests stop. In the meantime, you 
            can continue using our services by completing the CAPTCHA above.<br /><br />
          </div>

          <div className="sorry-details">
            IP Address: {userIP}<br />

          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptchaVerification;