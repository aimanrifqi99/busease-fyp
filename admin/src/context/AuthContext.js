// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialize user state from localStorage with safe parsing
  const [user, setUser] = useState(() => {
      if (typeof window !== 'undefined') {  // Check if window is available
          const storedUser = localStorage.getItem('user');
          return storedUser ? JSON.parse(storedUser) : null;
      }
      return null;
  });

  // Update localStorage whenever user changes
  useEffect(() => {
      if (user) {
          localStorage.setItem('user', JSON.stringify(user));
      } else {
          localStorage.removeItem('user');  // Clear storage on logout
      }
  }, [user]);

  const login = async (credentials) => {
      try {
        const { data } = await axios.post('/auth/login', credentials);

        if (data.isAdmin) {
          const userData = {
            ...data.details,
            isAdmin: data.isAdmin,
            token: data.token, // Store the token
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          navigate('/admin');
        } else {
          alert('Access restricted to admin users only');
        }
      } catch (err) {
          alert('Login failed. Please check your credentials.');
          console.error(err);
      }
  };

  const logout = () => {
      setUser(null);
      localStorage.removeItem('user');  // Remove user data from localStorage
      navigate('/login');
  };

  return (
      <AuthContext.Provider value={{ user, login, logout }}>
          {children}
      </AuthContext.Provider>
  );
};
