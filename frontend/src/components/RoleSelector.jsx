import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStore, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import '../styles/roleSelector.css';

const RoleSelector = ({ isEmbedded = false }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  
  // Get the user ID on component mount
  useEffect(() => {
    const storedUserId = user?.userId || localStorage.getItem('userId') || '';
    setUserId(storedUserId);
    console.log('Current user ID:', storedUserId);
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
      console.log('Making request to:', `${apiBaseUrl}/api/auth/set-role/${userId}`);
      console.log('With token:', token.substring(0, 10) + '...');
      
      const response = await fetch(`${apiBaseUrl}/api/auth/set-role/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: selectedRole }),
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
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
        role: selectedRole
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Updated user in localStorage:', updatedUser);
      
      // Redirect based on role if not embedded in profile
      if (!isEmbedded) {
        if (selectedRole === 'seller') {
          navigate('/dashboard?view=seller');
        } else {
          navigate('/dashboard?view=buyer');
        }
      } else {
        // If embedded, redirect to the appropriate dashboard
        console.log('Redirecting to dashboard with role:', selectedRole);
        navigate(selectedRole === 'seller' ? '/dashboard?view=seller' : '/dashboard?view=buyer');
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
            <h1 className="role-title">Choose Your Role</h1>
            <p className="role-description">
              Select how you would like to use our platform
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="role-form">
          <div className="role-options">
            <div 
              className={`role-option ${selectedRole === 'buyer' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('buyer')}
            >
              <div className="role-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
                {selectedRole === 'buyer' && (
                  <span className="selected-check">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
              <h3>Buyer</h3>
              <p>Bid on items and grow your collection</p>
            </div>

            <div 
              className={`role-option ${selectedRole === 'seller' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('seller')}
            >
              <div className="role-icon">
                <FontAwesomeIcon icon={faStore} />
                {selectedRole === 'seller' && (
                  <span className="selected-check">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
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
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelector; 