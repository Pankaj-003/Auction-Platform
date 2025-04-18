import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../contact.css";
import { toast, ToastContainer } from "react-toastify"; // Correct import for both `toast` and `ToastContainer`
import "react-toastify/dist/ReactToastify.css"; // Required CSS import

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

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
      toast.error("Please login to send a message.");
      return;
    }

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
        toast.success("Your message has been sent!");
      } else {
        toast.error("Failed to send message.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 contact-header">Contact Us</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4 shadow-lg custom-card">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label custom-label">Full Name</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="mb-3">
                <label className="form-label custom-label">Email</label>
                <input
                  type="email"
                  className="form-control custom-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="mb-3">
                <label className="form-label custom-label">Message</label>
                <textarea
                  className="form-control custom-textarea"
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Enter your message"
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 custom-btn">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* ToastContainer to display the toasts */}
      <ToastContainer />
    </div>
  );
};

export default Contact;
