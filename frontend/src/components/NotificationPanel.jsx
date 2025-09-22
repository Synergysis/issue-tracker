import React from "react";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationPanel({ userId }) {
  const notifications = useNotifications(userId);

  return (
    <div className="notification-panel">
      <h3>Notifications</h3>
      <ul>
        {notifications.map((n, idx) => (
          <li key={idx}>
            {n.type === "status"
              ? `Ticket ${n.ticketId} status changed to ${n.status} by ${n.updatedBy}`
              : `New chat message on ticket ${n.ticketId}: ${n.message}`}
            <span style={{ fontSize: "0.8em", color: "#888" }}>
              {" "}
              ({n.time.toLocaleTimeString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
