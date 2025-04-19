import React, { createContext, useState, useContext } from "react";
import CustomAlert from "./CustomAlert";

// Create a context for the alert system
const AlertContext = createContext();

// Hook to use the alert context
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

// The alert provider component
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  // Add a new alert
  const showAlert = (message, type = "info", duration = 3000, position = "top-right") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type, duration, position }]);
    return id;
  };

  // Shortcuts for different alert types
  const success = (message, options = {}) => 
    showAlert(message, "success", options.duration, options.position);
  
  const error = (message, options = {}) => 
    showAlert(message, "error", options.duration, options.position);
  
  const warning = (message, options = {}) => 
    showAlert(message, "warning", options.duration, options.position);
  
  const info = (message, options = {}) => 
    showAlert(message, "info", options.duration, options.position);

  // Remove an alert
  const hideAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info }}>
      {children}
      {alerts.map((alert) => (
        <CustomAlert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          duration={alert.duration}
          position={alert.position}
          onClose={() => hideAlert(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
};

export default AlertProvider; 