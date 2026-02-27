import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Vistas
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import MyTeams from './pages/MyTeams';
import Navbar from './components/Navbar';

// NOTA: Eliminamos la carga de Google Maps (LoadScript) para evitar el error de cobro/conexión

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
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />

          <Route 
            path="/mis-equipos" 
            element={user ? <MyTeams user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;