import React from 'react';
import { useTheme } from '../context/ThemeProvider';

const ThemeToggle = () => {
  // Keep the functionality but don't render the button
  // This ensures any code that uses this component won't break
  const { theme, toggleTheme } = useTheme();
  
  // Return null instead of the button to effectively remove it from the UI
  return null;
};

export default ThemeToggle; 