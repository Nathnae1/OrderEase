import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // Login function
  const login = (token, expiryTime) => {
    setIsAuthenticated(true);
    setAuthToken(token);
    localStorage.setItem('authToken', token); // Save token
    localStorage.setItem('authExpiry', expiryTime); // Save expiry time
  };

  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    localStorage.removeItem('authToken'); // Clear token
    localStorage.removeItem('authExpiry'); // Clear expiry
  };

  // Check token validity on page load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authExpiry');

    if (token && expiry && Date.now() < Number(expiry)) {
      setIsAuthenticated(true);
      setAuthToken(token);
    } else {
      logout(); // Clear invalid or expired session
    }
  }, []);

  // Optional: Logout when tab is closed
  useEffect(() => {
    const handleTabClose = () => logout();
    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
