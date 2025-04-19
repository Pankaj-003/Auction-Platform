import React, { useEffect, useState } from "react";
import { FaTrophy, FaMoneyBillWave, FaUser, FaCalendarAlt } from "react-icons/fa";
import { useAlert } from "./AlertProvider";
import "../styles/winners.css";

const Winners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const alert = useAlert();

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/auctions")
      .then((res) => res.json())
      .then((data) => {
        const endedWithWinners = data.filter(
          (auction) =>
            new Date(auction.endTime) < new Date() && auction.winner
        );
        setWinners(endedWithWinners);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching winners:", err);
        alert.error("Failed to load winners data");
        setLoading(false);
      });
  }, [alert]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="winners-container">
      <div className="winners-header">
        <div className="container">
          <h2 className="winners-heading">
            <FaTrophy className="trophy-icon" /> Auction Winners
          </h2>
          <p className="winners-subheading">Congratulations to all successful bidders!</p>
        </div>
      </div>

      <div className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading winners data...</p>
          </div>
        ) : winners.length === 0 ? (
          <div className="empty-winners">
            <FaTrophy className="empty-icon" />
            <h3>No winners declared yet</h3>
            <p>Check back later for completed auctions</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {winners.map((item) => (
              <div key={item._id} className="col">
                <div className="winner-card">
                  <div className="winner-ribbon">
                    <span>Winner!</span>
                  </div>
                  <div 
                    className="winner-image"
                    style={{backgroundImage: `url(${item.image})`}}
                  ></div>
                  <div className="winner-body">
                    <h5 className="winner-title">{item.title}</h5>
                    <p className="winner-description">{item.description}</p>
                    
                    <div className="winner-info">
                      <div className="winner-info-item">
                        <FaMoneyBillWave className="winner-icon" />
                        <span>
                          <strong>Final Bid:</strong> ₹{item.highestBid.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="winner-info-item">
                        <FaUser className="winner-icon" />
                        <span>
                          <strong>Winner:</strong> {item.winner.name}
                        </span>
                      </div>
                      
                      <div className="winner-info-item">
                        <FaCalendarAlt className="winner-icon" />
                        <span>
                          <strong>Ended:</strong> {formatDate(item.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Winners;
