import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import "../Auction.css";

const Auction = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [bidAmounts, setBidAmounts] = useState({});
  const userId = localStorage.getItem("userId");

  // Fetch auctions
  useEffect(() => {
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => setAuctionItems(data))
      .catch((err) => console.error("Error fetching auctions:", err));
  }, []);

  // Update time remaining for each auction
  useEffect(() => {
    const timer = setInterval(() => {
      setAuctionItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          timeRemaining: getTimeRemaining(item.endTime),
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionItems]);

  const getTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return "Auction Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleBidChange = (e, auctionId) => {
    setBidAmounts({ ...bidAmounts, [auctionId]: e.target.value });
  };

  const handlePlaceBid = async (auctionId, startingBid) => {
    if (!userId) return alert("❌ Please log in to place a bid");

    const amount = bidAmounts[auctionId];
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("❌ Enter a valid bid amount");
      return;
    }
    if (Number(amount) <= startingBid) {
      alert("❌ Your bid must be higher than the starting bid");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/bids/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId,  // Correct: auctionId in the body
          amount,     // Correct: amount in the body
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBidAmounts((prev) => ({ ...prev, [auctionId]: "" }));
        alert("✅ Bid placed successfully");
      } else {
        alert(`❌ ${data.message || "Failed to place bid"}`);
      }
    } catch (err) {
      console.error("Bid Error:", err);
      alert("❌ Error placing bid");
    }
  };

  // Poll auctions for updates every few seconds
  useEffect(() => {
    const fetchAuctions = async () => {
      const res = await fetch("http://localhost:8000/api/auctions");
      const data = await res.json();
      setAuctionItems(data);
    };

    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-5 animate__animated animate__fadeInDown">
        🔥 Live Auctions
      </h2>

      {auctionItems.length === 0 ? (
        <h5 className="text-center text-muted">No auctions available</h5>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5">
          {auctionItems.map((item) => (
            <div key={item._id} className="col">
              <div className="card h-100 shadow-lg border-0 rounded-4 auction-card animate__animated animate__zoomIn">
                <div
                  className="auction-image position-relative overflow-hidden"
                  style={{
                    height: "220px",
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                  }}
                ></div>
                <div className="card-body p-4">
                  <h5 className="card-title fw-semibold text-primary">
                    {item.title}
                  </h5>
                  <p className="text-secondary mb-1">{item.description}</p>
                  <p>
                    <strong>Starting Bid:</strong> ${item.startingBid}
                  </p>
                  <p className="text-danger fw-semibold">
                    ⌛ {getTimeRemaining(item.endTime)}
                  </p>

                  <div className="d-flex mt-3 align-items-center gap-2">
                    <input
                      type="number"
                      className="form-control px-3 py-2 border shadow-sm bid-input"
                      placeholder="Enter bid"
                      value={bidAmounts[item._id] || ""}
                      onChange={(e) => handleBidChange(e, item._id)}
                      disabled={!userId}
                    />
                    <button
                      className="btn btn-success bid-button"
                      style={{ height: "38px" }}
                      onClick={() => handlePlaceBid(item._id, item.startingBid)}
                      disabled={!userId}
                    >
                      Bid
                    </button>
                  </div>

                  {!userId && (
                    <p className="text-muted mt-2">
                      🔒 Please log in to place a bid
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Auction;
