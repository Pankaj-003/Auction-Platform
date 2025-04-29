import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaUser, FaEnvelope, FaComment } from "react-icons/fa";
import { useAlert } from "./AlertProvider";
import "../styles/ContactUnique.css";

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
    <div className="contact-unique-container">
      <h1 className="contact-title">Contact Us</h1>
      <p className="contact-subtitle">We'd love to hear from you and help with any questions</p>
      
      <div className="row">
        <div className="col-md-5 mb-4">
          <div className="contact-info-box">
            <div className="contact-info-header">
              <h3>Get in Touch</h3>
              <p>Have questions about our auction platform? Our team is here to help you with any inquiries.</p>
            </div>
            
            <div className="contact-info-body">
              <div className="contact-info-item">
                <div className="contact-icon-wrapper">
                  <FaEnvelope />
                </div>
                <div className="contact-info-content">
                  <h4>Email Support</h4>
                  <p>support@auctionhub.com</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-icon-wrapper">
                  <FaComment />
                </div>
                <div className="contact-info-content">
                  <h4>Live Chat</h4>
                  <p>Available 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-7">
          <div className="contact-form-box">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="form-floating-label">
                  <input
                    type="text"
                    className="form-floating-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                  <FaUser className="form-floating-icon" />
                </div>
                
                <div className="form-floating-label">
                  <input
                    type="email"
                    className="form-floating-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                  <FaEnvelope className="form-floating-icon" />
                </div>
                
                <div className="form-floating-label">
                  <textarea
                    className="form-floating-textarea"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                  />
                  <FaComment className="form-floating-icon-textarea" />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <FaPaperPlane className="submit-button-icon" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
