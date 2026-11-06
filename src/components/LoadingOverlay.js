import React from 'react';
import './LoadingOverlay.css';
import loadingGif from '../assets/loading.gif';

function LoadingOverlay({ isLoading, waitingForApproval, waitingForOtpApproval }) {
  if (!isLoading) return null;

  return (
    <div className="loading-popup-overlay">
      <div className="loading-popup-box">
        <img src={loadingGif} alt="Loading..." className="loading-gif" />
        <p className="loading-text">
          {waitingForApproval && 'Bekræfter ...'}
          {waitingForOtpApproval && 'Forarbejdning...'}
          {!waitingForApproval && !waitingForOtpApproval && 'Please wait...'}
        </p>
      </div>
    </div>
  );
}

export default LoadingOverlay;