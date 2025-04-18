import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Auction from "./components/Auction";
import Sell from "./components/Sell";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import Contact from "./components/Contact";
import MyBids from "./components/MyBids";
import Winners from "./components/winners";
import ResetPassword from "./components/ResetPassword";
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      {/* Wrapping everything in a flex-column container */}
      <div className="app-container">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Auction />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/signin" element={<Signin setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mybids" element={<MyBids />} />
            <Route path="/winners" element={<Winners />} />
            <Route path="/reset-password" element={<ResetPassword />} />

          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
