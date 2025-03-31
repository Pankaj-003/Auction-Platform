import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import VaseImage from "../assets/vase.jpg";
import WatchImage from "../assets/watch.jpg";
import axios from "axios";

const auctionItems = [
  {
    id: 1,
    name: "Antique Vase",
    image: VaseImage,
    description: "A beautiful antique vase from the 18th century.",
    startingBid: 100,
    endTime: new Date().getTime() + 5 * 60 * 1000, // Auction ends in 5 minutes
  },
  {
    id: 2,
    name: "Vintage Watch",
    image: WatchImage,
    description: "A rare Swiss-made vintage watch.",
    startingBid: 250,
    endTime: new Date().getTime() + 10 * 60 * 1000, // Auction ends in 10 minutes
  },
];

const Home = () => {
  const [bids, setBids] = useState(
    auctionItems.reduce((acc, item) => {
      acc[item.id] = item.startingBid;
      return acc;
    }, {})
  );
  
  const [bidAmounts, setBidAmounts] = useState({});
  const [timers, setTimers] = useState({});
  const [user, setUser] = useState("user123"); // Placeholder for user info
  const [userBids, setUserBids] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      auctionItems.forEach((item) => {
        const timeLeft = item.endTime - new Date().getTime();
        updatedTimers[item.id] = timeLeft > 0 ? timeLeft : 0;
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleBidChange = (e, id) => {
    setBidAmounts({ ...bidAmounts, [id]: e.target.value });
  };

  const placeBid = async (id) => {
    const newBid = parseFloat(bidAmounts[id]);
    if (!newBid || newBid <= bids[id]) {
      alert("Your bid must be higher than the current highest bid.");
      return;
    }
    if (timers[id] <= 0) {
      alert("Auction time is over! You cannot place a bid.");
      return;
    }

    try {
      // Send POST request to backend
      const response = await axios.post(`/api/bids/${id}`, {
        userId: user, // Replace with the actual userId from your authentication
        amount: newBid,
      });

      // Update the bids state
      setBids((prevBids) => ({
        ...prevBids,
        [id]: newBid,
      }));

      // Save the user's bid in local state
      setUserBids((prevBids) => ({
        ...prevBids,
        [id]: newBid,
      }));

      alert("Bid placed successfully!");
      setBidAmounts({ ...bidAmounts, [id]: "" });
    } catch (error) {
      alert("Error placing bid: " + error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4" style={{ color: "#333", fontFamily: "Arial, sans-serif" }}>Live Auctions</h2>
      <div className="row">
        {auctionItems.map((item) => (
          <div className="col-md-4 mb-4" key={item.id}>
            <div className="card shadow-lg rounded" style={{ border: "none", overflow: "hidden" }}>
              <img 
                src={item.image} 
                className="card-img-top" 
                alt={item.name} 
                style={{ height: "250px", objectFit: "cover", width: "100%" }} 
              />
              <div className="card-body" style={{ backgroundColor: "#f8f9fa", padding: "1.5rem", borderTop: "2px solid #ddd" }}>
                <h5 className="card-title" style={{ color: "#2c3e50", fontSize: "1.25rem", fontWeight: "bold" }}>{item.name}</h5>
                <p className="card-text" style={{ color: "#7f8c8d", fontSize: "1rem" }}>{item.description}</p>
                <p><strong style={{ color: "#27ae60" }}>Current Bid:</strong> ${bids[item.id]}</p>
                <p className={`fw-bold ${timers[item.id] === 0 ? "text-danger" : "text-success"}`} style={{ fontSize: "1.1rem" }}>
                  ⏳ Time Left: {timers[item.id] > 0 ? formatTime(timers[item.id]) : "Auction Ended"}
                </p>

                <div className="mb-3">
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Enter your bid"
                    value={bidAmounts[item.id] || ""}
                    onChange={(e) => handleBidChange(e, item.id)}
                    disabled={timers[item.id] === 0}
                    style={{ borderRadius: "8px", padding: "0.8rem" }}
                  />
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => placeBid(item.id)}
                    disabled={timers[item.id] === 0}
                    style={{ borderRadius: "8px", padding: "0.8rem", backgroundColor: "#3498db" }}
                  >
                    {timers[item.id] === 0 ? "Auction Ended" : "Place Bid"}
                  </button>
                </div>

                {userBids[item.id] && (
                  <div className="mt-3">
                    <p><strong>Your Bid:</strong> ${userBids[item.id]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
