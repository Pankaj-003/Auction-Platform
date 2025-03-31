import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// import './Contact.css';  // Import custom styles
import "../contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSuccess(true);

    setFormData({
      name: "",
      email: "",
      message: "",
    });

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 contact-header">Contact Us</h2>
      {success && <div className="alert alert-success">Your message has been sent!</div>}
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
    </div>
  );
};

export default Contact;
