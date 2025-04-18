import React, { useEffect, useState } from "react";

const Winners = () => {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => {
        const endedWithWinners = data.filter(
          (auction) =>
            new Date(auction.endTime) < new Date() && auction.winner
        );
        setWinners(endedWithWinners);
      })
      .catch((err) => console.error("Error fetching winners:", err));
  }, []);

  return (
    <div className="container py-5">
      <h2 className="text-center text-success mb-4">🏆 Auction Winners</h2>

      {winners.length === 0 ? (
        <p className="text-center text-muted">No winners declared yet.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {winners.map((item) => (
            <div key={item._id} className="col">
              <div className="card h-100 shadow-sm border-0 rounded-4">
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
                  <h5 className="card-title text-primary fw-bold">
                    {item.title}
                  </h5>
                  <p className="text-muted">{item.description}</p>
                  <p className="fw-semibold">💰 Final Bid: ₹{item.highestBid}</p>
                  <p className="fw-semibold text-success">
                    🏁 Winner: {item.winner.name}
                  </p>
                  <p className="text-muted">
                    Ended On: {new Date(item.endTime).toLocaleString()}
                  </p>
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
