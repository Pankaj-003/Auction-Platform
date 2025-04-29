import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { watchlistAPI } from '../api.js';
import '../styles/WatchlistButton.css';

const WatchlistButton = ({ auctionId }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkWatchlistStatus();
  }, [auctionId]);

  const checkWatchlistStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await watchlistAPI.checkWatchlistStatus(userId, auctionId);
      setIsInWatchlist(response.data.isInWatchlist);
      setWatchlistItemId(response.data.watchlistItemId);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleToggleWatchlist = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Please log in to add items to your watchlist');
        return;
      }

      if (isInWatchlist) {
        // Remove from watchlist
        await watchlistAPI.removeFromWatchlist(watchlistItemId, userId);
        setIsInWatchlist(false);
        setWatchlistItemId(null);
      } else {
        // Add to watchlist
        const response = await watchlistAPI.addToWatchlist(userId, auctionId);
        setIsInWatchlist(true);
        setWatchlistItemId(response.data._id);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      setError(error.response?.data?.message || 'Error updating watchlist');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="watchlist-button-container">
      <button 
        className={`watchlist-button ${isInWatchlist ? 'active' : ''}`}
        onClick={handleToggleWatchlist}
        disabled={isProcessing}
        title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
      >
        {isInWatchlist ? <FaHeart className="heart-icon" /> : <FaRegHeart className="heart-icon" />}
        {isInWatchlist ? "Watching" : "Watch"}
      </button>
      {error && <div className="watchlist-error">{error}</div>}
    </div>
  );
};

export default WatchlistButton; 