import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  // Check local storage for saved theme or use system preference
  const getInitialTheme = () => {
    // Return default theme if not in browser
    if (!isBrowser) return 'light';
    
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.error('Error getting initial theme:', error);
      return 'light'; // Fallback to light theme
    }
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to html and body elements when theme changes
  useEffect(() => {
    // Skip effect if not in browser
    if (!isBrowser) return;
    
    try {
      const root = document.documentElement;
      if (root) {
        root.setAttribute('data-theme', theme);
      }
      
      // Also set on body for better selector specificity
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
        
        // Direct style application for immediate visual feedback
        document.body.style.backgroundColor = theme === 'dark' ? '#131417' : '#f7f7f9';
        document.body.style.color = theme === 'dark' ? '#f5f6fa' : '#2d3436';
        
        // Apply transition class to body
        document.body.classList.add('theme-transition');
      }
      
      // Store in localStorage
      localStorage.setItem('theme', theme);
      console.log('Theme changed to:', theme); // Debug log
      
      // Remove transition class after transition completes to avoid affecting other animations
      const transitionTimeout = setTimeout(() => {
        if (document.body) {
          document.body.classList.remove('theme-transition');
        }
      }, 1000);
      
      return () => clearTimeout(transitionTimeout);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, isBrowser]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('Toggling theme from', prevTheme, 'to', newTheme); // Debug log
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 