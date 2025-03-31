import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ width: "350px" }}>
        <h2 className="text-center mb-4">{isSignUp ? "Sign Up" : "Sign In"}</h2>
        <form>
          {isSignUp && (
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="Enter name" required />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" placeholder="Enter email" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <p className="text-center mt-3">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button className="btn btn-link" onClick={toggleForm}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
