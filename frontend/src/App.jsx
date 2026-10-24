import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { apiFetch } from './lib/api';

// Vistas
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import MyTeams from './pages/MyTeams';
import Historial from './pages/Historial'; 
import Navbar from './components/Navbar';

const getSavedUser = () => {
  try {
    if (!sessionStorage.getItem('access_token')) {
      localStorage.removeItem('user');
      return null;
    }
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);
    const email = typeof parsedUser.email === 'string' ? parsedUser.email.trim().toLowerCase() : '';
    if (!email) {
      localStorage.removeItem('user');
      return null;
    }

    return {
      id: parsedUser.id,
      email,
      name: parsedUser.name || parsedUser.nombre || parsedUser.nombreReal || email,
      picture: parsedUser.picture || parsedUser.foto || '',
      role: parsedUser.role || parsedUser.rol || 'jugador',
    };
  } catch (error) {
    console.error('No se pudo recuperar la sesión guardada:', error);
    try {
      localStorage.removeItem('user');
    } catch (storageError) {
      console.error('No se pudo limpiar la sesión local inválida:', storageError);
    }
    return null;
  }
};

function App() {
  const [user, setUser] = useState(getSavedUser);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSuccess = async (credentialResponse) => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error('Google no entregó una credencial válida. Intenta nuevamente.');
      }

      const authResponse = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialResponse.credential }),
      }, { authenticated: false });

      const backendUser = authResponse?.user;
      if (!authResponse?.access_token || !backendUser?.email) {
        throw new Error('El servidor devolvió una sesión incompleta.');
      }

      const authenticatedUser = {
        id: backendUser.id,
        email: backendUser.email.trim().toLowerCase(),
        name: backendUser.nombre || backendUser.email,
        picture: backendUser.foto || '',
        role: backendUser.rol || 'jugador',
      };
      try {
        sessionStorage.setItem('access_token', authResponse.access_token);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
      } catch (storageError) {
        try {
          sessionStorage.removeItem('access_token');
        } catch (cleanupError) {
          console.error('No se pudo limpiar la sesión incompleta:', cleanupError);
        }
        throw new Error('No se pudo guardar la sesión en este navegador.', { cause: storageError });
      }
      setUser(authenticatedUser);
    } catch (error) {
      console.error('Fallo en el inicio de sesión:', error);
      setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem('access_token');
    } catch (error) {
      console.error('No se pudo limpiar el token local:', error);
    }
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('No se pudo limpiar el perfil local:', error);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('session-expired', handleLogout);
    return () => window.removeEventListener('session-expired', handleLogout);
  }, [handleLogout]);

  const handleGoogleError = () => {
    setAuthError('Google no pudo autenticar tu cuenta. Intenta nuevamente.');
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/" 
            element={!user ? (
              <Landing
                onLoginSuccess={handleLoginSuccess}
                onGoogleError={handleGoogleError}
                authError={authError}
                isAuthenticating={isAuthenticating}
                googleClientIdConfigured={Boolean(googleClientId)}
              />
            ) : <Navigate to="/dashboard" />}
          />
          
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

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;