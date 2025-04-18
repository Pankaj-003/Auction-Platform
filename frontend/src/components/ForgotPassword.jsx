import React, { useState } from "react";
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || "Failed to send reset email.");
      }
    } catch (err) {
    console.error("Fetch error:", err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ width: "350px" }}>
        <h3 className="text-center mb-3">Forgot Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100">Reset Password</button>
        </form>
        {message && <p className="text-success mt-3">{message}</p>}
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
