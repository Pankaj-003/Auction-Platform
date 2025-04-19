import React, { useState, useEffect, useRef } from "react";
import { useAlert } from "./AlertProvider";
import { FaSearch, FaFilter, FaHeart, FaTrophy, FaGavel, FaArrowRight, FaArrowLeft, FaChevronLeft, FaChevronRight, FaSortAmountDown, FaStar, FaRegClock, FaRegEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/Auction.css";
import "../styles/banner.css";
import "../styles/productSlider.css";
import "../styles/theme.css";

const Auction = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const [countdowns, setCountdowns] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("endTime");
  const [watchlist, setWatchlist] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  
  const userId = localStorage.getItem("userId");
  const alert = useAlert();

  useEffect(() => {
    fetchAuctions();
    if (userId) {
      fetchWatchlist();
    }
    
    const interval = setInterval(() => {
      fetchAuctions(); // Refresh auctions and countdowns every 30 seconds
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionItems]);

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      if (featuredItems.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  const fetchAuctions = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => {
        const liveAuctions = data.filter(
          (item) => new Date(item.endTime) > new Date()
        );
        
        // Extract unique categories
        const categorySet = new Set(liveAuctions.map(item => item.category).filter(Boolean));
        setCategories(["all", ...Array.from(categorySet)]);
        
        // Set featured items (items ending soon or with high bids)
        const sorted = [...liveAuctions].sort((a, b) => {
          // First prefer items with more bids
          const aBidCount = a.bids?.length || 0;
          const bBidCount = b.bids?.length || 0;
          
          if (bBidCount !== aBidCount) {
            return bBidCount - aBidCount;
          }
          
          // Then prefer items ending sooner
          return new Date(a.endTime) - new Date(b.endTime);
        });
        
        setFeaturedItems(sorted.slice(0, Math.min(5, sorted.length)));
        setAuctionItems(liveAuctions);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching auctions:", err);
        alert.error("Failed to load auctions. Please try again later.");
        setLoading(false);
      });
  };

  const fetchWatchlist = () => {
    fetch(`http://localhost:8000/api/watchlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Extract auction IDs from watchlist
        const watchlistIds = data.map(item => item.auction._id);
        setWatchlist(watchlistIds);
      })
      .catch((err) => {
        console.error("Error fetching watchlist:", err);
      });
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    auctionItems.forEach((item) => {
      newCountdowns[item._id] = getTimeRemaining(item.endTime);
    });
    setCountdowns(newCountdowns);
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return "Auction Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  const handleBidChange = (e, auctionId) => {
    const value = e.target.value;
    // Allow only positive numbers and empty string
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setBidAmounts({ ...bidAmounts, [auctionId]: value });
    }
  };

  const validateBid = (amount, auction) => {
    if (!userId) {
      alert.warning("Please log in to place a bid", { position: "bottom-center" });
      return false;
    }

    if (!amount || amount === "") {
      alert.error("Please enter a valid bid amount");
      return false;
    }

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      alert.error("Bid amount must be a positive number");
      return false;
    }

    const minBid = auction.highestBid > auction.startingBid 
      ? auction.highestBid 
      : auction.startingBid;
    
    if (bidAmount <= minBid) {
      alert.warning(`Your bid must be higher than ${minBid}`);
      return false;
    }

    return true;
  };

  const handlePlaceBid = async (auctionId) => {
    const auction = auctionItems.find(item => item._id === auctionId);
    if (!auction) return;

    const amount = bidAmounts[auctionId];
    if (!validateBid(amount, auction)) return;

    setIsSubmitting(true);

    try {
      // Get token for authentication
      const token = localStorage.getItem("token");
      if (!token) {
        alert.error("You need to be logged in to place a bid");
        setIsSubmitting(false);
        return;
      }

      // Make API request with correct URL and body format
      const res = await fetch(`http://localhost:8000/api/bids/${auctionId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId, 
          amount: parseFloat(amount) 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert.success(data.message || "Bid placed successfully!");
        setBidAmounts((prev) => ({ ...prev, [auctionId]: "" }));
        // Refresh auctions to show updated bid
        fetchAuctions();
      } else {
        alert.error(data.message || "Failed to place bid");
        console.error("Bid error response:", data);
      }
    } catch (err) {
      console.error("Bid Error:", err);
      alert.error("Error placing bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWatchlist = async (auctionId) => {
    if (!userId) {
      alert.warning("Please log in to add items to your watchlist");
      return;
    }

    try {
      if (watchlist.includes(auctionId)) {
        // Remove from watchlist
        await fetch(`http://localhost:8000/api/watchlist/${userId}/${auctionId}`, {
          method: "DELETE"
        });
        setWatchlist(prev => prev.filter(id => id !== auctionId));
        alert.success("Removed from watchlist");
      } else {
        // Add to watchlist
        await fetch(`http://localhost:8000/api/watchlist/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId }),
        });
        setWatchlist(prev => [...prev, auctionId]);
        alert.success("Added to watchlist");
      }
    } catch (err) {
      console.error("Watchlist Error:", err);
      alert.error("Error updating watchlist");
    }
  };

  const handleCardClick = (auction) => setSelectedAuction(auction);
  const handleBack = () => setSelectedAuction(null);

  const handleSlide = (direction) => {
    if (direction === "prev") {
      setCurrentSlide((prev) => (prev === 0 ? featuredItems.length - 1 : prev - 1));
    } else {
      setCurrentSlide((prev) => (prev === featuredItems.length - 1 ? 0 : prev + 1));
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // We don't need to fetch data again, just filter the existing items
  };

  // Filter and sort auctions based on selected options
  const filteredAuctions = auctionItems
    .filter(item => {
      // Filter by category
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on selected sort option
      switch (sortBy) {
        case "priceAsc":
          return (a.highestBid || a.startingBid) - (b.highestBid || b.startingBid);
        case "priceDesc":
          return (b.highestBid || b.startingBid) - (a.highestBid || a.startingBid);
        case "endTime":
          return new Date(a.endTime) - new Date(b.endTime);
        case "popularity":
          return (b.bids?.length || 0) - (a.bids?.length || 0);
        default:
          return new Date(a.endTime) - new Date(b.endTime);
      }
    });

  return (
    <div className="auction-page">
      {/* New Futuristic Banner */}
      {!selectedAuction && (
        <div className="container py-4">
          <div className="futuristic-banner">
            <div className="banner-background"></div>
            <div className="banner-grid"></div>
            
            <div className="banner-content">
              <div className="banner-info">
                <span className="banner-subtitle">Exclusive Auctions</span>
                <h1 className="banner-title">Discover Unique Items and Place Your Bids</h1>
                <p className="banner-description">
                  Explore our curated collection of premium items and participate in live auctions. 
                  Every bid brings you closer to owning something extraordinary.
                </p>
                <div className="banner-cta">
                  <button className="banner-button primary" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
                    Explore Auctions <FaArrowRight />
                  </button>
                  <button className="banner-button secondary">
                    Learn More <FaRegEye />
                  </button>
                </div>
              </div>
              <div className="banner-image">
                <div className="banner-circle"></div>
                <div className="banner-particle"></div>
                <div className="banner-particle"></div>
                <div className="banner-particle"></div>
                <div className="banner-particle"></div>
                <img 
                  src="/images/auction-hero.png" 
                  alt="Featured auction item" 
                  className="banner-product"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/500x400?text=Premium+Items";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Product Slider */}
      {!selectedAuction && featuredItems.length > 0 && (
        <div className="container">
          <div className="product-slider-container">
            <div className="product-slider-heading">
              <h2 className="product-slider-title">Featured Auctions</h2>
              <p className="product-slider-subtitle">
                Don't miss out on these hot items ending soon
              </p>
            </div>
            
            <div className="product-slider">
              <div 
                className="product-slider-track"
                style={{ transform: `translateX(-${currentSlide * 25}%)` }}
              >
                {featuredItems.map((item) => (
                  <div className="product-slide" key={item._id}>
                    <div className="product-card">
                      <div className="product-image-container">
                        <img 
                          src={item.image}
                          alt={item.title}
                          className="product-image"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x220?text=Item";
                          }}
                        />
                        <div className="product-badge">Featured</div>
                      </div>
                      <div className="product-content">
                        <div className="product-category">{item.category || "Uncategorized"}</div>
                        <h3 className="product-title">{item.title}</h3>
                        <div className="product-price-container">
                          <div className="product-price">
                            <span className="price-label">Current Bid</span>
                            <span className="price-value">₹{item.highestBid || item.startingBid}</span>
                          </div>
                          <div className="product-time">
                            <FaRegClock />
                            {countdowns[item._id] || "Loading..."}
                          </div>
                        </div>
                        <div className="product-actions">
                          <div className="bid-count">
                            <span>{item.bids?.length || 0}</span> bids
                          </div>
                          <div className="action-buttons">
                            <button 
                              className={`action-button wishlist ${watchlist.includes(item._id) ? 'active' : ''}`}
                              onClick={() => toggleWatchlist(item._id)}
                            >
                              <FaHeart />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="slider-controls">
              <button 
                className="slider-arrow" 
                onClick={() => handleSlide("prev")}
                aria-label="Previous items"
              >
                <FaChevronLeft />
              </button>
              <button 
                className="slider-arrow" 
                onClick={() => handleSlide("next")}
                aria-label="Next items"
              >
                <FaChevronRight />
              </button>
            </div>
            
            <div className="slider-dots">
              {[...Array(Math.ceil(featuredItems.length / 4))].map((_, index) => (
                <button
                  key={index}
                  className={`slider-dot ${Math.floor(currentSlide / 4) === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index * 4)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container py-5">
        {!selectedAuction && (
          <>
            <h2 className="text-center fw-bold mb-5 fade-in text-primary section-title">
              <FaGavel className="me-2" /> Live Auctions
            </h2>

            {/* Search and Filters */}
            <div className="filters-container mb-4">
              {/* Search Bar */}
              <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <button type="submit" className="search-button">
                    <FaSearch />
                  </button>
                </div>
              </form>

              {/* Filter by Categories */}
              <div className="categories-container">
                <div className="categories-scroll">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category === "all" ? "All Items" : category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options - Fixed Dropdown */}
              <div className="sort-container">
                <button className="sort-button">
                  <FaSortAmountDown className="me-2" /> Sort
                </button>
                <div className="sort-dropdown-content">
                  <button 
                    className={`sort-option ${sortBy === 'endTime' ? 'active' : ''}`}
                    onClick={() => handleSortChange('endTime')}
                  >
                    Ending Soon
                  </button>
                  <button 
                    className={`sort-option ${sortBy === 'priceAsc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('priceAsc')}
                  >
                    Price: Low to High
                  </button>
                  <button 
                    className={`sort-option ${sortBy === 'priceDesc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('priceDesc')}
                  >
                    Price: High to Low
                  </button>
                  <button 
                    className={`sort-option ${sortBy === 'popularity' ? 'active' : ''}`}
                    onClick={() => handleSortChange('popularity')}
                  >
                    Most Popular
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedAuction ? (
          <div className="row justify-content-center fade-in">
            <div className="col-lg-10">
              <div className="auction-detail-card">
                <button
                  className="btn btn-light mb-4 shadow-sm back-button"
                  onClick={handleBack}
                >
                  <FaChevronLeft className="me-2" /> Back to all auctions
                </button>

                <div className="auction-detail-grid">
                  <div className="auction-detail-image">
                    <div className="auction-image-wrapper" style={{backgroundImage: `url(${selectedAuction.image})`}}>
                      {userId && (
                        <button 
                          className={`watchlist-button ${watchlist.includes(selectedAuction._id) ? 'active' : ''}`}
                          onClick={() => toggleWatchlist(selectedAuction._id)}
                        >
                          <FaHeart />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="auction-detail-info">
                    <h3 className="fw-bold">{selectedAuction.title}</h3>
                    <div className="category-tag">{selectedAuction.category || "Uncategorized"}</div>
                    <p className="lead auction-description">{selectedAuction.description}</p>
                    
                    <div className="auction-meta">
                      <div className="auction-meta-item">
                        <span className="label">Starting Bid</span>
                        <span className="value">₹ {selectedAuction.startingBid}</span>
                      </div>
                      
                      <div className="auction-meta-item time-remaining">
                        <span className="label">Time Remaining</span>
                        <span className="value countdown">{countdowns[selectedAuction._id] || "Loading..."}</span>
                      </div>
                      
                      {selectedAuction.bids?.length > 0 && (
                        <div className="auction-meta-item">
                          <span className="label">Total Bids</span>
                          <span className="value">{selectedAuction.bids.length}</span>
                        </div>
                      )}
                    </div>

                    {selectedAuction.highestBid > selectedAuction.startingBid ? (
                      <div className="highest-bid-info">
                        <p className="highest-bid-label">Current Highest Bid</p>
                        <div className="highest-bid-amount">₹ {selectedAuction.highestBid}</div>
                        <p className="highest-bidder">
                          By: {selectedAuction.highestBidder?.name || "Anonymous"}
                        </p>
                      </div>
                    ) : (
                      <div className="no-bids-info">
                        <p className="no-bids-text">
                          <FaTrophy className="me-2" /> No bids on this item yet. Be the first!
                        </p>
                      </div>
                    )}

                    <div className="bid-form-container">
                      <p className="bid-instruction">Place your bid (must be higher than current highest bid)</p>
                      <div className="bid-form">
                        <div className="bid-input-wrapper">
                          <span className="currency-symbol">₹</span>
                          <input
                            type="text"
                            className="bid-input"
                            placeholder="Enter your bid"
                            value={bidAmounts[selectedAuction._id] || ""}
                            onChange={(e) => handleBidChange(e, selectedAuction._id)}
                            disabled={!userId || isSubmitting}
                          />
                        </div>
                        <button
                          className="bid-button"
                          onClick={() => handlePlaceBid(selectedAuction._id)}
                          disabled={!userId || isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Place Bid"}
                        </button>
                      </div>

                      {!userId && (
                        <p className="login-notice">
                          Please <Link to="/signin">log in</Link> to place a bid
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading auctions...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="empty-state">
            <FaFilter className="empty-icon" />
            <h5>No auctions match your criteria</h5>
            <p>Try adjusting your filters or search query</p>
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setSortBy("endTime");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="auction-grid">
            {filteredAuctions.map((item) => (
              <div key={item._id} className="auction-card card-hover slide-up">
                <div 
                  className="auction-card-image" 
                  style={{backgroundImage: `url(${item.image})`}}
                  onClick={() => handleCardClick(item)}
                >
                  {userId && (
                    <button 
                      className={`card-watchlist-button ${watchlist.includes(item._id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(item._id);
                      }}
                    >
                      <FaHeart />
                    </button>
                  )}
                  {item.category && (
                    <div className="card-category-tag">{item.category}</div>
                  )}
                </div>
                <div className="auction-card-body" onClick={() => handleCardClick(item)}>
                  <h5 className="auction-card-title">{item.title}</h5>
                  <p className="auction-card-description">{item.description}</p>
                  
                  <div className="auction-card-meta">
                    <div className="auction-price">
                      <span className="price-label">Current Bid:</span>
                      <span className="price-value">₹ {item.highestBid || item.startingBid}</span>
                    </div>
                    <div className="auction-time">
                      <span className="time-icon">⏱️</span>
                      <span className="time-value">{countdowns[item._id] || "Loading..."}</span>
                    </div>
                  </div>

                  {item.bids?.length > 0 ? (
                    <div className="auction-bid-info">
                      <span className="bid-count">{item.bids.length} {item.bids.length === 1 ? 'bid' : 'bids'}</span>
                      {item.highestBidder && (
                        <span className="bidder-name">by {item.highestBidder.name}</span>
                      )}
                    </div>
                  ) : (
                    <p className="no-bids">
                      No bids yet - Be the first!
                    </p>
                  )}
                  
                  <button className="view-auction-btn">
                    Bid Now <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auction;
