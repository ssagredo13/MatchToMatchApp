import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Analytics } from '@vercel/analytics/react';

// Vistas
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import MyTeams from './pages/MyTeams';
import Historial from './pages/Historial'; 
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  // Cargar usuario desde LocalStorage al iniciar
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

  /**
   * Manejador de éxito de Google Login con persistencia en Atlas
   */
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        ...decoded,
        nombreReal: decoded.name || decoded.given_name || "Organizador"
      };

      // URL Dinámica: Usa la variable de entorno de Vercel o el localhost si estás en desarrollo
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; 
      
      console.log("Persistiendo usuario en backend...");

      // Llamada al endpoint de autenticación para guardar en MongoDB Atlas
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decoded.email,
          displayName: userData.nombreReal,
          photoURL: decoded.picture
        })
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const backendData = await response.json();
      console.log("Usuario sincronizado con Atlas:", backendData);

      // Guardar en estado y LocalStorage solo tras éxito en backend
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

    } catch (error) {
      console.error("Fallo en la persistencia de usuario:", error);
      // Opcional: Podrías alertar al usuario si el backend está caído
    }
  };

  /**
   * Manejador de Logout
   */
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <GoogleOAuthProvider clientId="954066819953-l2nrbmtvaq74l6q4820tp0d5015ibuaf.apps.googleusercontent.com">
      <BrowserRouter>
        {/* Navbar solo se muestra si hay sesión activa */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          {/* Ruta raíz: Si no hay usuario va a Landing, si lo hay va a Dashboard */}
          <Route 
            path="/" 
            element={!user ? <Landing onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
          />
          
          {/* Rutas Protegidas */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />

          <Route 
            path="/mis-equipos" 
            element={user ? <MyTeams user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />

          <Route 
            path="/historial" 
            element={user ? <Historial user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;