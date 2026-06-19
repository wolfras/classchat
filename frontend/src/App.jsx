import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Gallery from './components/Gallery';
import Admin from './components/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
 // import ChatWrapper from './components/ChatWrapper';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import './App.css';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

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
            <Route path="/chat" element={
  <ChatPage isDarkTheme={isDarkTheme} currentUser={currentUser} />
} />
  <Route path="/" element={<Home isDarkTheme={isDarkTheme} />} />
  <Route path="/about" element={<About isDarkTheme={isDarkTheme} />} />
  <Route path="/gallery" element={<Gallery isDarkTheme={isDarkTheme} currentUser={currentUser} />} />
  <Route path="/login" element={
    <LoginPage isDarkTheme={isDarkTheme} setCurrentUser={setCurrentUser} />
  } />
  <Route path="/admin" element={
    <ProtectedRoute isAdmin={currentUser?.isAdmin}>
      <Admin isDarkTheme={isDarkTheme} />
    </ProtectedRoute>
  } />
<Route path="/register" element={<Register isDarkTheme={isDarkTheme} />} />
</Routes>
        </main>

      
      </div>
    </Router>
  );
}

export default App;