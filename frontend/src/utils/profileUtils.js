/**
 * Utility functions for debugging profile visibility
 */

/**
 * Fix profile visibility issues by forcibly applying styles
 * @returns {boolean} True if the function was run
 */
export const fixProfileVisibility = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes);
    return true;
  } else {
    return applyFixes();
  }
}

/**
 * Apply direct fixes to the profile container
 * @returns {boolean} True if fixes were applied
 */
const applyFixes = () => {
  // Check if element exists after a short delay
  setTimeout(() => {
    // Find the profile container
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) {
      console.log('Profile container found, applying visibility fixes');
      
      // Forcibly apply styles if needed
      const styles = {
        backgroundColor: '#f8f9fa', 
        color: '#333333',
        minHeight: '100vh',
        visibility: 'visible',
        display: 'block',
        position: 'relative',
        zIndex: '1',
        opacity: '1'
      };
      
      Object.assign(profileContainer.style, styles);
      
      // Find any children that might need fixes
      const profileHeader = profileContainer.querySelector('.profile-header');
      if (profileHeader) {
        Object.assign(profileHeader.style, {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #dee2e6',
          display: 'block',
          visibility: 'visible',
          marginBottom: '2rem'
        });
      }
      
      return true;
    } else {
      console.warn('Profile container not found in DOM');
      return false;
    }
  }, 100);
  
  return true;
}; 