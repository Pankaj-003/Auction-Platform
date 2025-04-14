// CustomAlert.jsx
import React from "react";

const CustomAlert = ({ message, type, onClose }) => {
  return (
    <div
      className={`alert alert-${type} alert-dismissible fade show`}
      role="alert"
    >
      <strong>{type === "success" ? "Success!" : "Error!"}</strong> {message}
      <button
        type="button"
        className="btn-close"
        data-bs-dismiss="alert"
        aria-label="Close"
        onClick={onClose}
      ></button>
    </div>
  );
};

export default CustomAlert;
