import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Auction = () => {
  const [auctionItems, setAuctionItems] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const [countdowns, setCountdowns] = useState({});
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(() => {
      fetchAuctions(); // Refresh auctions and countdowns every 10 seconds
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set up live countdowns
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000); // Update countdowns every second
    return () => clearInterval(interval);
  }, [auctionItems]);

  const fetchAuctions = () => {
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => setAuctionItems(data))
      .catch((err) => console.error("Error fetching auctions:", err));
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    auctionItems.forEach((item) => {
      newCountdowns[item._id] = getTimeRemaining(item.endTime);
    });
    setCountdowns(newCountdowns);
  };

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
    if (!userId) {
      toast.error("❌ Please log in to place a bid");
      return;
    }

    const amount = bidAmounts[auctionId];
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("❌ Enter a valid bid amount");
      return;
    }
    if (Number(amount) <= startingBid) {
      toast.error("❌ Your bid must be higher than the starting bid");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/bids/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, amount }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Bid placed successfully");
        setBidAmounts((prev) => ({ ...prev, [auctionId]: "" }));
        fetchAuctions(); // refresh data
      } else {
        toast.error(data.message || "❌ Failed to place bid");
      }
    } catch (err) {
      console.error("Bid Error:", err);
      toast.error("❌ Error placing bid");
    }
  };

  const handleCardClick = (auction) => setSelectedAuction(auction);
  const handleBack = () => setSelectedAuction(null);

  const isAuctionEnded = (endTime) => new Date(endTime) < new Date();

  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-5 animate__animated animate__fadeInDown text-primary">
        🔥 Live Auctions
      </h2>

      {selectedAuction ? (
        <div className="row justify-content-center animate__animated animate__fadeIn">
          <div className="col-lg-8">
            <div
              className="card p-5 shadow-lg border-0 rounded-5"
              style={{
                background: "#fdfdfd",
                boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
              }}
            >
              <button
                className="btn btn-light mb-4 shadow-sm"
                onClick={handleBack}
                style={{
                  borderRadius: "50px",
                  fontWeight: "bold",
                  padding: "10px 20px",
                  boxShadow: "inset 0px 2px 5px rgba(0,0,0,0.05)",
                }}
              >
                ← Back to all auctions
              </button>

              <div
                className="rounded-4 mb-4"
                style={{
                  height: "400px",
                  backgroundImage: `url(${selectedAuction.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "20px",
                }}
              ></div>

              <h3 className="fw-bold text-dark">{selectedAuction.title}</h3>
              <p className="lead text-muted">{selectedAuction.description}</p>
              <p className="fs-5">
                <strong>Starting Bid:</strong> ₹ {selectedAuction.startingBid}
              </p>
              <p className="text-danger fw-semibold fs-5">
                ⏳ {countdowns[selectedAuction._id] || "Loading..."}
              </p>

              {selectedAuction.highestBid > selectedAuction.startingBid ? (
                <p className="text-success fw-semibold fs-5">
                  💰 Current Highest Bid: ₹ {selectedAuction.highestBid}
                  <br />
                  👤 By: {selectedAuction.highestBidder?.name || "Anonymous"}
                </p>
              ) : (
                <p className="text-muted fw-semibold fs-5">
                  ❌ No user bid on this item
                </p>
              )}

              {new Date(selectedAuction.endTime) < new Date() ? (
                selectedAuction.winner ? (
                  <p className="text-success fw-semibold fs-5">
                    🏁 Final Winner: {selectedAuction.winner.name}
                  </p>
                ) : (
                  <p className="text-warning fw-semibold fs-5">
                    🏁 Auction Ended. Winner not declared yet.
                  </p>
                )
              ) : null}

              {!isAuctionEnded(selectedAuction.endTime) && (
                <div className="d-flex mt-4 gap-3 align-items-center">
                  <input
                    type="number"
                    className="form-control border rounded-pill px-4 py-2 shadow-sm"
                    placeholder="Enter your bid"
                    value={bidAmounts[selectedAuction._id] || ""}
                    onChange={(e) => handleBidChange(e, selectedAuction._id)}
                    disabled={!userId}
                    style={{ maxWidth: "200px" }}
                  />
                  <button
                    className="btn btn-success px-4 py-2 rounded-pill fw-semibold shadow"
                    onClick={() =>
                      handlePlaceBid(
                        selectedAuction._id,
                        selectedAuction.startingBid
                      )
                    }
                    disabled={!userId}
                  >
                    💸 Place Bid
                  </button>
                </div>
              )}

              {!userId && (
                <p className="text-muted mt-3">
                  🔒 Please log in to place a bid
                </p>
              )}
            </div>
          </div>
        </div>
      ) : auctionItems.length === 0 ? (
        <h5 className="text-center text-muted">No auctions available</h5>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {auctionItems.map((item) => (
            <div key={item._id} className="col">
              <div
                className="card h-100 shadow border-0 rounded-4 auction-card animate__animated animate__zoomIn"
                onClick={() => handleCardClick(item)}
                style={{
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <div
                  style={{
                    height: "220px",
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderTopLeftRadius: "1.5rem",
                    borderTopRightRadius: "1.5rem",
                  }}
                ></div>
                <div className="card-body p-4">
                  <h5 className="card-title fw-bold text-primary">
                    {item.title}
                  </h5>
                  <p className="text-muted">{item.description}</p>
                  <p>
                    <strong>Starting Bid:</strong> ₹ {item.startingBid}
                  </p>
                  <p className="text-danger fw-semibold">
                    ⌛ {countdowns[item._id] || "Loading..."}
                  </p>

                  {item.highestBid > item.startingBid ? (
                    <p className="text-success fw-semibold">
                      💰 Highest Bid: ₹ {item.highestBid}
                      <br />
                      👤 By: {item.highestBidder?.name || "Anonymous"}
                    </p>
                  ) : (
                    <p className="text-muted fw-semibold">
                      ❌ No user bid on this item
                    </p>
                  )}

                  {new Date(item.endTime) < new Date() ? (
                    item.winner ? (
                      <p className="text-success fw-semibold">
                        🏁 Final Winner: {item.winner.name}
                      </p>
                    ) : (
                      <p className="text-warning fw-semibold">
                        🏁 Auction Ended. Winner not declared yet.
                      </p>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default Auction;
