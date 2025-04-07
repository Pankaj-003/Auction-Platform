import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

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
        <div className="row row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
          {bids.map((bid) => (
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
                  <p className="card-text mb-1 small">
                    <strong>Bid:</strong> ${bid.amount}
                  </p>
                  {bid.auctionId?.description && (
                    <p className="card-text text-muted small mb-0">
                      {bid.auctionId.description.slice(0, 60)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">You haven't placed any bids yet.</p>
      )}
    </div>
  );
}

export default MyBids;
