import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Gallery from './components/Gallery';
import Admin from './components/Admin';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import { API_URL } from './config';
import './App.css';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ==================== CHECK SESSION ON APP LOAD ====================
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking session...');
        const res = await fetch(`${API_URL}/api/session`, {
          credentials: 'include' // Important: Send cookies with request
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.authenticated && data.user) {
          console.log('✅ User session restored:', data.user.username);
          setCurrentUser(data.user);
        } else {
          console.log('⚠️ No active session');
        }
      } catch (err) {
        console.error('❌ Session check error:', err.message);
        // Session check failed, user is logged out
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, []);

  // ==================== THEME MANAGEMENT ====================
  useEffect(() => {
    document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  // Show loading state while checking session
  if (sessionLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className={`app ${isDarkTheme ? 'dark' : 'light'}`}>
        <Navbar 
          isDarkTheme={isDarkTheme} 
          toggleTheme={toggleTheme}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onChatOpen={() => setShowChat(true)}
        />
        
        <main className="main-content">
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<Home isDarkTheme={isDarkTheme} />} />
            <Route path="/about" element={<About isDarkTheme={isDarkTheme} />} />
            <Route path="/gallery" element={<Gallery isDarkTheme={isDarkTheme} currentUser={currentUser} />} />
            <Route path="/login" element={<LoginPage isDarkTheme={isDarkTheme} setCurrentUser={setCurrentUser} />} />
            <Route path="/register" element={<Register isDarkTheme={isDarkTheme} />} />
            <Route path="/forgot-password" element={<ForgotPassword isDarkTheme={isDarkTheme} />} />

            {/* ==================== PROTECTED ROUTES ==================== */}
            <Route 
              path="/chat" 
              element={<ChatPage isDarkTheme={isDarkTheme} currentUser={currentUser} />} 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute isLoggedIn={!!currentUser}>
                  <Profile isDarkTheme={isDarkTheme} currentUser={currentUser} setCurrentUser={setCurrentUser} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute isAdmin={currentUser?.isAdmin}>
                  <Admin isDarkTheme={isDarkTheme} currentUser={currentUser} />
                </ProtectedRoute>
              } 
            />

            {/* ==================== 404 ROUTE ==================== */}
            <Route 
              path="*" 
              element={
                <div className="not-found-page">
                  <h1>404 - Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                  <a href="/">← Back to Home</a>
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;