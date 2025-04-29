/**
 * DEPRECATED - DO NOT USE
 * 
 * This file has been replaced by ThemeProvider.jsx.
 * Please import from ThemeProvider.jsx instead:
 * import { useTheme } from '../context/ThemeProvider';
 */
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check localStorage or system preference for initial theme
  const getInitialTheme = () => {
    if (typeof localStorage === 'undefined' || typeof window === 'undefined') {
      return 'light'; // Default if not in browser environment
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check if user prefers dark mode at OS level
    const prefersDark = window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme());

  // Update body class and localStorage when theme changes
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-theme', theme);
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 