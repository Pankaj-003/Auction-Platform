import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

function MyBids() {
  const [bids, setBids] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/bids/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setBids(data);
        setError(null);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch MyBids", err);
        setError("Failed to fetch your bids.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Helper function to determine bid status
  const getBidStatus = (bid) => {
    if (!bid.auctionId) return { status: "Auction Deleted", className: "text-secondary" };
    
    const now = new Date();
    const endDate = new Date(bid.auctionId.endDate);
    
    if (now > endDate) {
      if (bid.auctionId.highestBid === bid.amount && bid.auctionId.highestBidderId === userId) {
        return { status: "Won! 🏆", className: "text-success" };
      } else {
        return { status: "Outbid (Ended)", className: "text-danger" };
      }
    } else {
      if (bid.auctionId.highestBid === bid.amount && bid.auctionId.highestBidderId === userId) {
        return { status: "Highest Bid! 🔝", className: "text-success" };
      } else if (bid.auctionId.highestBid > bid.amount) {
        return { status: "Outbid", className: "text-warning" };
      } else {
        return { status: "Active", className: "text-primary" };
      }
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="text-center mb-3">My Bids</h4>

      {loading ? (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : bids.length > 0 ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
          {bids.map((bid) => {
            const bidStatus = getBidStatus(bid);
            return (
              <div key={bid._id} className="col">
                <div className="card h-100 shadow-sm border-0">
                  {bid.auctionId?.image && (
                    <img
                      src={bid.auctionId.image}
                      alt={bid.auctionId.title}
                      className="card-img-top rounded-top"
                      style={{
                        height: "120px",
                        objectFit: "cover",
                        borderBottom: "1px solid #dee2e6",
                      }}
                    />
                  )}
                  <div className="card-body py-2 px-3">
                    <h6 className="card-title mb-1 text-truncate" title={bid.auctionId?.title}>
                      {bid.auctionId?.title || "Auction Deleted"}
                    </h6>
                    
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <p className="card-text mb-0 small">
                        <strong>Your Bid:</strong> ₹ {bid.amount}
                      </p>
                      <span className={`badge ${bidStatus.className}`}>
                        {bidStatus.status}
                      </span>
                    </div>
                    
                    {bid.auctionId && (
                      <>
                        <p className="card-text mb-1 small">
                          <strong>Current Highest:</strong> ₹ {bid.auctionId.highestBid || "No bids"}
                        </p>
                        <p className="card-text mb-1 small">
                          <strong>Bid Date:</strong> {formatDate(bid.createdAt)}
                        </p>
                        <p className="card-text mb-1 small">
                          <strong>Auction Ends:</strong> {formatDate(bid.auctionId.endDate)}
                        </p>
                        <div className="mt-2 d-grid">
                          <Link 
                            to={`/auction/${bid.auctionId._id}`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            View Auction
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted">You haven't placed any bids yet.</p>
      )}
    </div>
  );
}

export default MyBids;
