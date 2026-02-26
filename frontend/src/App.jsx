import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import './index.css';
import './App.css';

const Landing = ({ onLoginSuccess }) => (
  <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
    
    {/* Glows de fondo - Estética Electric Striker */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#CCFF00]/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>

    <div className="relative z-10 text-center w-full max-w-4xl">
      <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-black text-white italic uppercase mb-2 tracking-tighter leading-[0.9] font-display">
        MATCH TO <br className="block md:hidden" /> 
        <span className="text-primary text-shadow-glow">MATCH</span>
      </h1>
      
      <div className="h-1 w-20 md:w-32 bg-primary mx-auto mb-6 md:mb-10 skew-x-[-15deg]"></div>

      <p className="text-slate-400 mb-10 md:mb-14 text-lg md:text-2xl font-medium max-w-sm md:max-w-xl mx-auto leading-tight font-body px-4">
        La red de futbolito más grande de <span className="text-white">Talca</span>. 
        Encuentra tu próximo 6 vs 6 en segundos.
      </p>
      
      {/* BOTÓN DE GOOGLE PERSONALIZADO */}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white/5 backdrop-blur-md p-8 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(204,255,0,0.1)] skew-x-[-5deg]">
          <div className="skew-x-[5deg] flex flex-col items-center">
            <p className="text-primary font-black italic mb-6 uppercase tracking-widest text-sm">Inicia sesión para jugar</p>
            <GoogleLogin 
              onSuccess={onLoginSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="filled_blue"
              shape="pill"
              text="continue_with"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="absolute bottom-6 md:bottom-8 text-slate-600 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold">
      Talca • Chile • 2026
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
    localStorage.setItem('user', JSON.stringify(decoded));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <GoogleOAuthProvider clientId="954066819953-l2nrbmtvaq74l6q4820tp0d5015ibuaf.apps.googleusercontent.com">
      <BrowserRouter>
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/" 
            element={!user ? <Landing onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/" />} 
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;