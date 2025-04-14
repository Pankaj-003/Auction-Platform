import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../sell.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sell = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    startingBid: "",
    endDate: "",
  });

  const [previewImage, setPreviewImage] = useState(null);

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

    const { name, description, image, startingBid, endDate } = formData;

    toast.dismiss();

    if (
      name.trim() === "" ||
      description.trim() === "" ||
      !image ||
      startingBid.trim() === "" ||
      endDate === ""
    ) {
      toast.error("❌ Please fill in all fields!");
      return;
    }

    if (isNaN(startingBid) || parseFloat(startingBid) <= 0) {
      toast.error("❌ Starting bid must be a valid positive number");
      return;
    }

    const newAuction = {
      title: name.trim(),
      description: description.trim(),
      image,
      startingBid: parseFloat(startingBid),
      endDate,
    };

    try {
      const response = await fetch("http://localhost:8000/api/auctions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAuction),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✅ Item listed successfully!");
        setFormData({
          name: "",
          description: "",
          image: "",
          startingBid: "",
          endDate: "",
        });
        setPreviewImage(null);
        if (typeof onAddItem === "function") {
          onAddItem(data.auction);
        }
      } else {
        toast.error(data.error || "❌ Failed to list item");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("❌ Server error. Please try again later.");
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer position="top-center" />
      <h2 className="text-center mb-4 sell-heading">📢 List an Item for Auction</h2>
      <div className="card p-4 shadow-sm sell-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Image</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImageUpload}
              required
            />
            {previewImage && (
              <img src={previewImage} alt="Preview" className="mt-3 preview-img" />
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Starting Bid (₹)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-control"
              name="startingBid"
              value={formData.startingBid}
              onChange={handleChange}
              required
              style={{
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Auction End Date</label>
            <input
              type="date"
              className="form-control"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <div className="form-text">
              🗓 Auction will automatically close at 11:59 PM on the selected date.
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 list-btn">
            🚀 List Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default Sell;
