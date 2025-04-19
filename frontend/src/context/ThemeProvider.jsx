import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check local storage for saved theme or use system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to html and body elements when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Also set on body for better selector specificity
    document.body.setAttribute('data-theme', theme);
    
    localStorage.setItem('theme', theme);
    console.log('Theme changed to:', theme); // Debug log
    
    // Direct style application for immediate visual feedback
    document.body.style.backgroundColor = theme === 'dark' ? '#131417' : '#f7f7f9';
    document.body.style.color = theme === 'dark' ? '#f5f6fa' : '#2d3436';
    
    // Apply transition class to body
    document.body.classList.add('theme-transition');
    
    // Remove transition class after transition completes to avoid affecting other animations
    const transitionTimeout = setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 1000);
    
    return () => clearTimeout(transitionTimeout);
  }, [theme]);

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