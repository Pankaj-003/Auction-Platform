import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaUser, FaEnvelope, FaComment } from "react-icons/fa";
import { useAlert } from "./AlertProvider";
import "../contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}`);
        const data = await response.json();
        if (response.ok) {
          setFormData((prev) => ({
            ...prev,
            name: data.name,
            email: data.email,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");

    // Check if user is logged in
    if (!userId) {
      alert.warning("Please login to send a message", { position: "bottom-center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ ...formData, message: "" });
        alert.success("Your message has been sent!");
      } else {
        alert.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container grid-bg">
      <div className="container">
        <div className="contact-header">
          <h1 className="gradient-text">Contact Us</h1>
          <p className="contact-subheading">We'd love to hear from you</p>
        </div>
        
        <div className="contact-content">
          <div className="contact-info">
            <div className="glass-panel contact-info-card">
              <h3>Get in Touch</h3>
              <p>Have questions about our auction platform? Our team is here to help you with any inquiries.</p>
              
              <div className="contact-features">
                <div className="contact-feature">
                  <div className="feature-icon">
                    <FaEnvelope />
                  </div>
                  <div className="feature-text">
                    <h4>Email Support</h4>
                    <p>support@auctionhub.com</p>
                  </div>
                </div>
                
                <div className="contact-feature">
                  <div className="feature-icon">
                    <FaComment />
                  </div>
                  <div className="feature-text">
                    <h4>Live Chat</h4>
                    <p>Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-container">
            <form onSubmit={handleSubmit} className="future-card contact-form">
              <div className="form-group">
                <label className="form-label">
                  <FaUser className="input-icon" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  className="future-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope className="input-icon" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  className="future-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaComment className="input-icon" />
                  <span>Message</span>
                </label>
                <textarea
                  className="future-input"
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?"
                />
              </div>
              
              <button 
                type="submit" 
                className="future-button submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
