// CustomAlert.jsx
import React, { useEffect } from "react";
import "../styles/CustomAlert.css";

const CustomAlert = ({ message, type, onClose, duration = 3000, position = "top-right" }) => {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`custom-alert custom-alert-${position} custom-alert-${type}`}>
      <div className="custom-alert-icon">{getIcon()}</div>
      <div className="custom-alert-content">{message}</div>
      <button className="custom-alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default CustomAlert;
