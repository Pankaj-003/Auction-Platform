import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Winners = () => {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/auctions/winners")
      .then((res) => res.json())
      .then((data) => setWinners(data))
      .catch((err) => console.error("Error loading winners:", err));
  }, []);

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">🏆 Auction Winners</h2>
      {winners.length === 0 ? (
        <p className="text-center text-muted">No winners declared yet.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {winners.map((auction) => (
            <div className="col" key={auction._id}>
              <div className="card shadow">
                <img
                  src={auction.image}
                  className="card-img-top"
                  alt={auction.title}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{auction.title}</h5>
                  <p className="card-text">{auction.description}</p>
                  <p><strong>Winning Bid:</strong> ${auction.startingBid}</p>
                  <p><strong>Winner:</strong> {auction.winner?.name || "User ID: " + auction.winner}</p>
                  <p className="text-muted">⏰ Ended on: {new Date(auction.endTime).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Winners;
