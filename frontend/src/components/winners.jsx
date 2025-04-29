import React, { useEffect, useState } from "react";
import { FaTrophy, FaMoneyBillWave, FaUser, FaCalendarAlt, FaFilter, FaGavel, FaTimes, FaSortAmountDown, FaChevronDown } from "react-icons/fa";
import { useAlert } from "./AlertProvider";
import "../styles/winners.css";

const Winners = () => {
  const [allWinners, setAllWinners] = useState([]);
  const [displayedWinners, setDisplayedWinners] = useState([]);
  const [visibleWinners, setVisibleWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState("10"); // Default to last 10 days
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [itemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const alert = useAlert();

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => {
        const endedWithWinners = data.filter(
          (auction) =>
            new Date(auction.endTime) < new Date() && auction.winner
        );
        setAllWinners(endedWithWinners);
        filterWinnersByDays(endedWithWinners, dayFilter);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching winners:", err);
        alert.error("Failed to load winners data");
        setLoading(false);
      });
  }, [alert]);

  // Update visible winners whenever displayed winners or page changes
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage;
    const paginatedItems = displayedWinners.slice(0, endIndex);
    setVisibleWinners(paginatedItems);
    setHasMore(endIndex < displayedWinners.length);
  }, [displayedWinners, currentPage, itemsPerPage]);

  // Handle show more
  const handleShowMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  // Fetch bids for a specific auction
  const fetchAuctionBids = async (auctionId) => {
    setLoadingBids(true);
    try {
      const response = await fetch(`http://localhost:8000/api/bids/auction/${auctionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setAuctionBids(data);
    } catch (err) {
      console.error("Error fetching bids:", err);
      alert.error("Failed to load bid history");
      setAuctionBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  // Handle winner card click
  const handleWinnerClick = (auction) => {
    setSelectedAuction(auction);
    fetchAuctionBids(auction._id);
    setShowBidsModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowBidsModal(false);
    setSelectedAuction(null);
    setAuctionBids([]);
  };

  // Filter winners by days
  const filterWinnersByDays = (winners, days) => {
    if (days === "all") {
      setDisplayedWinners(winners);
      return;
    }

    const daysInMs = parseInt(days) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - daysInMs);
    
    const filteredWinners = winners.filter(winner => 
      new Date(winner.endTime) >= cutoffDate
    );
    
    setDisplayedWinners(filteredWinners);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const days = e.target.value;
    setDayFilter(days);
    filterWinnersByDays(allWinners, days);
  };

  // Get individual day options for the dropdown
  const getDayOptions = () => {
    // Today, last day, last 2 days, etc.
    const options = [];
    for (let i = 1; i <= 10; i++) {
      options.push(
        <option key={i} value={i.toString()}>
          {i === 1 ? "Today" : `Last ${i} days`}
        </option>
      );
    }
    return options;
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render the bids modal
  const renderBidsModal = () => {
    if (!showBidsModal) return null;

    return (
      <div className="bids-modal-overlay">
        <div className="bids-modal">
          <div className="bids-modal-header">
            <h3>
              <FaGavel className="me-2" />
              Bid History
            </h3>
            <button className="close-button" onClick={closeModal}>
              <FaTimes />
            </button>
          </div>

          <div className="bids-modal-item-details">
            {selectedAuction && (
              <>
                <div className="item-image" style={{backgroundImage: `url(${selectedAuction.image})`}}></div>
                <div className="item-info">
                  <h4>{selectedAuction.title}</h4>
                  <p className="text-muted">Auction ended on {formatDate(selectedAuction.endTime)}</p>
                  <div className="winner-badge">
                    <FaTrophy className="me-1" /> 
                    Winner: {selectedAuction.winner.name} (₹{selectedAuction.highestBid.toLocaleString()})
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bids-list-header">
            <FaSortAmountDown className="me-2" />
            <span>All Bids (Highest to Lowest)</span>
          </div>

          <div className="bids-modal-content">
            {loadingBids ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary spinner-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading bid history...</p>
              </div>
            ) : auctionBids.length === 0 ? (
              <div className="no-bids-message">
                <p>No bid data available for this auction.</p>
              </div>
            ) : (
              <div className="bids-list">
                {auctionBids.map((bid, index) => (
                  <div 
                    key={bid._id} 
                    className={`bid-item ${index === 0 ? 'highest' : ''} ${bid.userId?._id === selectedAuction?.winner?._id ? 'winner' : ''}`}
                  >
                    <div className="bidder-info">
                      <FaUser className="bidder-icon" />
                      <div className="bidder-details">
                        <span className="bidder-name">{bid.userId?.name || 'Anonymous'}</span>
                        {bid.userId?._id === selectedAuction?.winner?._id && (
                          <span className="winner-tag">Winner</span>
                        )}
                      </div>
                    </div>
                    <div className="bid-amount">
                      ₹{bid.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Show More button or end message
  const renderShowMoreSection = () => {
    if (displayedWinners.length === 0 || visibleWinners.length === 0) {
      return null;
    }

    return (
      <div className="show-more-container text-center mt-4">
        {hasMore ? (
          <button className="show-more-button" onClick={handleShowMore}>
            <FaChevronDown className="me-2" />
            Show More
          </button>
        ) : (
          <div className="end-message">
            <p>You've reached the end of the list</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="winners-container">
      <div className="winners-header">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div>
              <h2 className="winners-heading">
                <FaTrophy className="trophy-icon" /> Auction Winners
              </h2>
              <p className="winners-subheading">Congratulations to all successful bidders!</p>
            </div>
            
            <div className="filter-container mt-3 mt-md-0">
              <div className="d-flex align-items-center">
                <FaFilter className="me-2" />
                <label htmlFor="dayFilter" className="me-2">Show winners from:</label>
                <select 
                  id="dayFilter" 
                  className="form-select" 
                  value={dayFilter} 
                  onChange={handleFilterChange}
                >
                  {getDayOptions()}
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading winners data...</p>
          </div>
        ) : displayedWinners.length === 0 ? (
          <div className="empty-winners">
            <FaTrophy className="empty-icon" />
            <h3>No winners found for the selected time period</h3>
            <p>Try selecting a different time range or check back later</p>
          </div>
        ) : (
          <>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {visibleWinners.map((item) => (
                <div key={item._id} className="col">
                  <div className="winner-card" onClick={() => handleWinnerClick(item)}>
                    <div className="winner-ribbon">
                      <span>Winner!</span>
                    </div>
                    <div 
                      className="winner-image"
                      style={{backgroundImage: `url(${item.image})`}}
                    ></div>
                    <div className="winner-body">
                      <h5 className="winner-title">{item.title}</h5>
                      <p className="winner-description">{item.description}</p>
                      
                      <div className="winner-info">
                        <div className="winner-info-item">
                          <FaMoneyBillWave className="winner-icon" />
                          <span>
                            <strong>Final Bid:</strong> ₹{item.highestBid.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="winner-info-item">
                          <FaUser className="winner-icon" />
                          <span>
                            <strong>Winner:</strong> {item.winner.name}
                          </span>
                        </div>
                        
                        <div className="winner-info-item">
                          <FaCalendarAlt className="winner-icon" />
                          <span>
                            <strong>Ended:</strong> {formatDate(item.endTime)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="view-bids-button">
                        <FaGavel className="me-1" /> View All Bids
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          
            {renderShowMoreSection()}
          </>
        )}
      </div>
      
      {renderBidsModal()}
    </div>
  );
};

export default Winners;
