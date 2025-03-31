import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Sell from "./components/Sell";
import Auction from "./components/Auction";
import "./index.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [auctionItems, setAuctionItems] = useState([]);

  // ✅ Fetch auction items from the backend when the app loads
  const fetchAuctions = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/auctions");
      const data = await response.json();
      setAuctionItems(data);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // ✅ Add a new auction item dynamically
  const handleAddItem = async (newItem) => {
    try {
      const response = await fetch("http://localhost:8000/api/auctions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();
      if (response.ok) {
        setAuctionItems((prevItems) => [data.auction, ...prevItems]); // ✅ Add new auction item dynamically
      } else {
        console.error("Failed to add auction:", data.error);
      }
    } catch (error) {
      console.error("Error adding auction:", error);
    }
  };

  // ✅ Update bid for a specific auction item
  const handleUpdateBid = (id, newBid) => {
    setAuctionItems((prevItems) =>
      prevItems.map((item) =>
        item._id === id ? { ...item, highestBid: newBid } : item
      )
    );
  };

  return (
    <Router> 
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/auction" element={<Auction auctionItems={auctionItems} onUpdateBid={handleUpdateBid} />} />
        <Route path="/sell" element={<Sell onAddItem={handleAddItem} />} />
        <Route path="/signin" element={<Signin setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/contact" element={<Contact />} />  
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
