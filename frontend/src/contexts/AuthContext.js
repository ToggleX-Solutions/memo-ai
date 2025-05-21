import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:3001/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          let userData = response.data.user;
          // Forcer le rôle admin pour l'email concerné
          if (userData.email === 'toggleinc.rdc@gmail.com') {
            userData = { ...userData, role: 'admin' };
          }
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      let userData = user;
      // Forcer le rôle admin pour l'email concerné
      if (userData.email === 'toggleinc.rdc@gmail.com') {
        userData = { ...userData, role: 'admin' };
      }
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la connexion'
      };
    }
  };

  const register = async (email, password, full_name, plan) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        email,
        password,
        full_name,
        plan
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'inscription'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 