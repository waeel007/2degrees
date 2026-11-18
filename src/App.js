import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  useEffect(() => {
    console.log("App loaded! Sending notification...");
    
    // Raw fetch bypassing the hook entirely
    fetch('https://puntkumdka.onrender.com//api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "User in Page " })
    })
    .then(r => r.json())
    .then(data => console.log("Server response:", data))
    .catch(err => console.error("Fetch error:", err));
    
  }, []);

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <AdminPanel />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;