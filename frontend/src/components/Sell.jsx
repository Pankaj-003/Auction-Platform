import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// import "./Sell.css"; // Import custom styles
import "../sell.css";
const Sell = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    startingBid: "",
    duration: "",
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.image || !formData.startingBid || !formData.duration) {
      alert("Please fill in all fields!");
      return;
    }

    const newAuction = {
      title: formData.name,
      description: formData.description,
      image: formData.image,
      startingBid: parseFloat(formData.startingBid),
      duration: parseInt(formData.duration),
    };

    try {
      const response = await fetch("http://localhost:8000/api/auctions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAuction),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Item listed successfully!");
        setFormData({ name: "", description: "", image: "", startingBid: "", duration: "" });
        setPreviewImage(null);
        onAddItem(data.auction);
      } else {
        alert(data.error || "Failed to list item");
      }
    } catch (error) {
      console.error("Error listing item:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 sell-heading">📢 List an Item for Auction</h2>
      <div className="card p-4 shadow-sm sell-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item Name</label>
            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Image</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} required />
            {previewImage && <img src={previewImage} alt="Preview" className="mt-3 preview-img" />}
          </div>

          <div className="mb-3">
            <label className="form-label">Starting Bid ($)</label>
            <input type="number" className="form-control" name="startingBid" value={formData.startingBid} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Auction Duration (minutes)</label>
            <input type="number" className="form-control" name="duration" value={formData.duration} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-100 list-btn">🚀 List Item</button>
        </form>
      </div>
    </div>
  );
};

export default Sell;
