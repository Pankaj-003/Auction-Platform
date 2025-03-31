import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Auction = () => {
  const [auctionItems, setAuctionItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/auctions")
      .then((response) => response.json())
      .then((data) => setAuctionItems(data))
      .catch((error) => console.error("Error fetching auctions:", error));
  }, []);

  useEffect(() => {
    // Update timer every second
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
    if (!endTime) return "Invalid Time";

    const now = new Date().getTime();
    const auctionEndTime = new Date(endTime).getTime(); // Convert to valid timestamp
    const timeLeft = auctionEndTime - now;

    if (timeLeft <= 0) return "Auction Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">🔥 Live Auctions</h2>

      {auctionItems.length === 0 ? (
        <h4 className="text-center text-muted">No active auctions at the moment.</h4>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {auctionItems.map((item) => (
            <div className="col" key={item._id}>
              <div className="card h-100 shadow-sm border-0 rounded-4">
                <div
                  className="auction-img-container"
                  style={{
                    height: "230px",
                    background: `url(${item.image}) center/cover no-repeat`,
                    borderRadius: "12px 12px 0 0",
                  }}
                ></div>
                <div className="card-body">
                  <h5 className="card-title fw-bold">{item.title}</h5>
                  <p className="card-text text-muted">{item.description}</p>
                  <p className="mb-1">
                    <strong>Starting Bid:</strong>{" "}
                    <span className="text-primary">${item.startingBid}</span>
                  </p>
                  <p className="text-danger fw-bold">🕒 {getTimeRemaining(item.endTime)}</p>
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
