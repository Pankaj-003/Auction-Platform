/**
 * Utility functions for theme management
 */

/**
 * Check if CSS variables are properly loaded
 * @returns {boolean} True if CSS variables are loaded correctly
 */
export const areThemeVariablesLoaded = () => {
  if (typeof document === 'undefined') {
    return true; // Assume loaded in non-browser environment
  }
  
  // Get a computed CSS variable to see if it's available
  const computedStyle = getComputedStyle(document.documentElement);
  const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
  const textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
  
  return bgPrimary !== '' && textPrimary !== '';
};

/**
 * Apply fallback styles if CSS variables are not loaded
 */
export const applyFallbackStyles = () => {
  if (typeof document === 'undefined') {
    return false; // Can't apply styles in non-browser environment
  }
  
  if (!areThemeVariablesLoaded()) {
    console.warn('Theme variables not loaded, applying fallback styles');
    
    // Light theme fallback
    const style = document.createElement('style');
    style.id = 'theme-fallback-styles';
    style.innerHTML = `
      :root {
        --bg-primary: #f8f9fa;
        --bg-secondary: #ffffff;
        --bg-card: #ffffff;
        --bg-elevated: #f0f0f0;
        --text-primary: #333333;
        --text-secondary: #555555;
        --text-muted: #6c757d;
        --border-color: #dee2e6;
        --border-dark: #ced4da;
        --input-bg: #ffffff;
        --input-border: #ced4da;
        --stats-card-bg: #ffffff;
        --navbar-bg: #ffffff;
        --shadow-color: rgba(0, 0, 0, 0.1);
        --primary-color: #3498db;
        --primary-hover: #2980b9;
        --secondary-color: #f39c12;
        --secondary-hover: #e67e22;
        --success-color: #2ecc71;
        --danger-color: #e74c3c;
        --warning-color: #f1c40f;
        --info-color: #3498db;
        --border-radius: 8px;
        --transition-speed: 0.3s;
      }
      
      [data-theme="dark"] {
        --bg-primary: #121212;
        --bg-secondary: #1e1e1e;
        --bg-card: #2a2a2a;
        --bg-elevated: #3a3a3a;
        --text-primary: #f8f9fa;
        --text-secondary: #e2e2e2;
        --text-muted: #b0b0b0;
        --border-color: #444444;
        --border-dark: #555555;
        --input-bg: #2c2c2c;
        --input-border: #555555;
        --stats-card-bg: #2a2a2a;
        --navbar-bg: #1a1a1a;
        --shadow-color: rgba(0, 0, 0, 0.3);
      }
    `;
    
    document.head.appendChild(style);
    return true;
  }
  
  return false;
};

/**
 * Initialize theme system
 */
export const initializeTheme = () => {
  // Only run this code when the DOM is fully available
  if (typeof document === 'undefined' || !document.body) {
    // If called too early, schedule it to run after DOM is available
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
      });
    }
    return;
  }
  
  // Apply theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-theme', 'dark');
  }
  
  // Apply fallback styles if needed
  applyFallbackStyles();
}; 