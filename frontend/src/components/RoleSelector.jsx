import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStore, faCheckCircle, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import '../styles/roleSelector.css';

const RoleSelector = ({ isEmbedded = false }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [changingRole, setChangingRole] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  
  // Get the user ID and current role on component mount
  useEffect(() => {
    const storedUserId = user?.userId || localStorage.getItem('userId') || '';
    setUserId(storedUserId);
    
    const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}').role || '';
    setCurrentRole(userRole);
    
    // If user already has a role that is not 'unset', we're changing roles
    if (userRole && userRole !== 'unset') {
      setChangingRole(true);
      // Pre-select the opposite role for easier switching
      setSelectedRole(userRole === 'buyer' ? 'seller' : 'buyer');
    }
    
    console.log('Current user ID:', storedUserId, 'Current role:', userRole);
  }, [user]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    // Don't do anything if selected role is the same as current role
    if (changingRole && selectedRole === currentRole) {
      if (isEmbedded) {
        // Just refresh the page to update UI
        window.location.reload();
        return;
      } else {
        // Stay on current page
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Use the right endpoint format
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log(`${changingRole ? 'Changing' : 'Setting'} role to ${selectedRole}`);
      console.log('Making request to:', `${apiBaseUrl}/api/auth/set-role/${userId}`);
      
      const response = await fetch(`${apiBaseUrl}/api/auth/set-role/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: selectedRole }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to update role (${response.status})`);
      }

      const data = await response.json();
      console.log('Role update successful:', data);

      // Update user context with new role
      setUser(prev => ({ ...prev, role: selectedRole }));
      
      // Also update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        role: selectedRole,
        roleSelected: true
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Updated user in localStorage:', updatedUser);
      
      // Stay on the current page after role selection/change
      if (!isEmbedded) {
        // For standalone role selector, just reload the current page
        window.location.reload();
      } else {
        // For embedded in profile, reload the current page
        window.location.reload();
      }
    } catch (err) {
      console.error('Role selection error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use a more compact layout when embedded in profile
  const containerClass = isEmbedded 
    ? "role-selector-container embedded" 
    : "role-selector-container";
  
  const cardClass = isEmbedded 
    ? "role-selector-card embedded p-0" 
    : "role-selector-card";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        {!isEmbedded && (
          <>
            <h1 className="role-title">
              {changingRole ? 'Change Your Role' : 'Choose Your Role'}
              {changingRole && <FontAwesomeIcon icon={faExchangeAlt} className="ms-2" />}
            </h1>
            <p className="role-description">
              {changingRole 
                ? 'You can switch between buyer and seller roles anytime'
                : 'Select how you would like to use our platform'}
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="role-form">
          <div className="role-options">
            <div 
              className={`role-option ${selectedRole === 'buyer' ? 'selected' : ''} ${currentRole === 'buyer' ? 'current' : ''}`}
              onClick={() => handleRoleSelect('buyer')}
            >
              <div className="role-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
                {selectedRole === 'buyer' && (
                  <span className="selected-check">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
                {currentRole === 'buyer' && changingRole && (
                  <span className="current-role-indicator">Current</span>
                )}
              </div>
              <h3>Buyer</h3>
              <p>Bid on items and grow your collection</p>
            </div>

            <div 
              className={`role-option ${selectedRole === 'seller' ? 'selected' : ''} ${currentRole === 'seller' ? 'current' : ''}`}
              onClick={() => handleRoleSelect('seller')}
            >
              <div className="role-icon">
                <FontAwesomeIcon icon={faStore} />
                {selectedRole === 'seller' && (
                  <span className="selected-check">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
                {currentRole === 'seller' && changingRole && (
                  <span className="current-role-indicator">Current</span>
                )}
              </div>
              <h3>Seller</h3>
              <p>List items and manage your auctions</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="role-submit-btn" 
            disabled={isLoading || !selectedRole}
          >
            {isLoading ? 'Processing...' : changingRole ? 'Switch Role' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelector; 