import React from "react";
import io from "socket.io-client";

// Use the correct backend URL and enable credentials if needed
const socket = io("http://localhost:5000", {
  withCredentials: true,
  transports: ["websocket", "polling"], // fallback for some environments
});

const SuperAdminNotificationPanel = ({ superadminId }) => {
  return null;
};

export default SuperAdminNotificationPanel;
