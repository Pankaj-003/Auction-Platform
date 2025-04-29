import React, { useState, useEffect } from "react";
import { FaUpload, FaImage, FaTags, FaMoneyBillWave, FaCalendarAlt, FaCheck, FaList } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Sell.css";
import { useAlert } from "./AlertProvider";
import { useNavigate } from "react-router-dom";
import { getAuctionItemPlaceholder } from "../utils/imageUtils";

const Sell = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    startingBid: "",
    endDate: "",
    category: ""
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const alert = useAlert();
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      alert.warning("You must be logged in to create an auction");
      navigate("/signin");
    }
  }, [alert, navigate]);

  const categories = [
    "Antiques",
    "Art",
    "Books",
    "Collectibles",
    "Electronics",
    "Fashion",
    "Jewelry",
    "Music",
    "Sports",
    "Vintage",
    "Other"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "startingBid") {
      // Allow only digits (no letters or special characters)
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleCategorySelect = (category) => {
    setFormData({ ...formData, category });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, description, image, startingBid, endDate, category } = formData;

    if (
      name.trim() === "" ||
      description.trim() === "" ||
      !image ||
      startingBid.trim() === "" ||
      endDate === "" ||
      category === ""
    ) {
      alert.error("Please fill in all fields including a category");
      return;
    }

    if (isNaN(startingBid) || parseFloat(startingBid) <= 0) {
      alert.error("Starting bid must be a valid positive number");
      return;
    }

    // Show confirmation dialog to warn users about checking details
    const confirmSubmit = window.confirm(
      "⚠️ IMPORTANT: Please verify all details carefully!\n\n" +
      "You will NOT be able to edit this listing after submission.\n\n" +
      "Are you sure you want to proceed with listing this item?"
    );
    
    if (!confirmSubmit) {
      return; // User canceled the submission
    }

    // Get the user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert.error("You must be logged in to create an auction");
      return;
    }

    const newAuction = {
      title: name.trim(),
      description: description.trim(),
      image,
      startingBid: parseFloat(startingBid),
      endDate,
      category,
      seller: userId  // Add the seller ID to the auction data
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/auctions/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify(newAuction),
      });

      const data = await response.json();

      if (response.ok) {
        alert.success("Item listed successfully!");
        setFormData({
          name: "",
          description: "",
          image: "",
          startingBid: "",
          endDate: "",
          category: ""
        });
        setPreviewImage(null);
        if (typeof onAddItem === "function") {
          onAddItem(data.auction);
        }
      } else {
        alert.error(data.error || "Failed to list item");
      }
    } catch (error) {
      console.error("Error:", error);
      alert.error("Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={onAddItem ? "embedded-sell-container" : "sell-container"}>
      {!onAddItem && (
        <div className="sell-header">
          <h2 className="sell-heading">📢 List an Item for Auction</h2>
        </div>
      )}
      
      <div className="container p-0">
        <div className="sell-card">
          <form onSubmit={handleSubmit}>
            <div className="alert alert-warning mb-4">
              <strong>⚠️ Important Notice:</strong> Please review your listing carefully before submitting. 
              You will <strong>not be able to edit</strong> the information after posting.
            </div>
            
            <div className="mb-4">
              <label className="form-label" htmlFor="itemName">
                <FaUpload className="me-2" /> Item Name
              </label>
              <input
                type="text"
                className="form-control"
                id="itemName"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="category">
                <FaTags className="me-2" /> Category
              </label>
              <div className="category-selector">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className={`category-option ${formData.category === cat ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat} {formData.category === cat && <FaCheck className="ms-1" size={12} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="description">
                <FaUpload className="me-2" /> Description
              </label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details about the item's condition, history, and any other relevant information"
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label">
                <FaImage className="me-2" /> Upload Image
              </label>
              
              {!previewImage ? (
                <label htmlFor="itemImage" className="custom-file-input d-block">
                  <div className="text-center">
                    <FaImage size={40} className="mb-2" style={{ opacity: 0.5 }} />
                    <p className="mb-0">Click to upload an image</p>
                    <p className="small text-muted">JPG, PNG or GIF (max. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    id="itemImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="d-none"
                    required
                  />
                </label>
              ) : (
                <div className="image-preview-container text-center">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="preview-img mx-auto" 
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData(prev => ({ ...prev, image: "" }));
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="startingBid">
                <FaMoneyBillWave className="me-2" /> Starting Bid (₹)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                id="startingBid"
                name="startingBid"
                value={formData.startingBid}
                onChange={handleChange}
                placeholder="Enter starting price"
                required
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="endDate">
                <FaCalendarAlt className="me-2" /> Auction End Date
              </label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              <div className="form-text mt-2">
                🗓 Auction will automatically close at 11:59 PM on the selected date.
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 list-btn" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "🚀 List Item for Auction"}
            </button>
          </form>
        </div>
        
        {/* Only show UserListings when not embedded in profile */}
        {!onAddItem && <UserListings key={formData.name} refreshTrigger={isSubmitting} />}
      </div>
    </div>
  );
};

// New component to display user's current listings
const UserListings = ({ refreshTrigger }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch(`http://localhost:8000/api/profile/listings/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        
        const data = await response.json();
        setListings(data);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load your listings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [refreshTrigger]); // Refresh when the trigger changes
  
  if (loading) {
    return (
      <div className="listings-section text-center">
        <div className="py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your listings...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="listings-section">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }
  
  if (!listings || listings.length === 0) {
    return (
      <div className="listings-section text-center">
        <div className="py-5">
          <div className="mb-3">
            <FaList style={{ fontSize: "3rem", opacity: 0.2 }} />
          </div>
          <h4>You haven't listed any items yet</h4>
          <p className="text-muted">Your listings will appear here once you create them</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="listings-section">
      <div className="listings-header d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Your Current Listings ({listings.length})</h3>
        <button 
          className="btn btn-outline-primary"
          onClick={() => navigate("/profile")}
        >
          View All in Profile
        </button>
      </div>
      
      <div className="row">
        {listings.slice(0, 3).map(listing => (
          <div key={listing._id} className="col-md-4 mb-3">
            <div className="card listing-card h-100">
              <div className="listing-img-container">
                <img 
                  src={listing.image || getAuctionItemPlaceholder()} 
                  className="listing-img" 
                  alt={listing.title}
                />
                <div className={`listing-badge ${listing.status}`}>
                  {listing.status === 'active' ? 'Active' : 
                   listing.status === 'sold' ? 'Sold' : 'Ended'}
                </div>
              </div>
              <div className="listing-details">
                <h5 className="listing-title">{listing.title}</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="listing-price">₹{listing.highestBid || listing.startingBid}</span>
                  <small className="listing-date">
                    {listing.status === 'active' 
                      ? `Ends: ${new Date(listing.endTime).toLocaleDateString()}`
                      : `Ended: ${new Date(listing.endTime).toLocaleDateString()}`}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {listings.length > 3 && (
          <div className="col-12 text-center mt-3">
            <button 
              className="btn btn-outline-primary view-all-btn"
              onClick={() => navigate("/profile")}
            >
              View All {listings.length} Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;
