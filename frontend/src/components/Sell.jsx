import React, { useState } from "react";
import { FaUpload, FaImage, FaTags, FaMoneyBillWave, FaCalendarAlt, FaCheck } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../sell.css";
import { useAlert } from "./AlertProvider";

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

    const newAuction = {
      title: name.trim(),
      description: description.trim(),
      image,
      startingBid: parseFloat(startingBid),
      endDate,
      category
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/auctions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="sell-container">
      <div className="sell-header">
        <h2 className="sell-heading">📢 List an Item for Auction</h2>
      </div>
      
      <div className="container">
        <div className="sell-card">
          <form onSubmit={handleSubmit}>
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
      </div>
    </div>
  );
};

export default Sell;
