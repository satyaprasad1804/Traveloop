import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-login on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('traveloop_token') || localStorage.getItem('token');
      
      if (token) {
        try {
          // Verify token by fetching user profile
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token verification failed:", error);
          // Token is invalid or expired
          localStorage.removeItem('traveloop_token');
          localStorage.removeItem('token');
          localStorage.removeItem('traveloop_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('traveloop_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('traveloop_token');
    localStorage.removeItem('token');
    localStorage.removeItem('traveloop_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
