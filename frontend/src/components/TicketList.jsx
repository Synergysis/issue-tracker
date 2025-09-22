import React, { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Adjust if your backend runs elsewhere

function TicketList({ tickets, setTickets }) {
  useEffect(() => {
    socket.on("new_chat_message", ({ ticketId, message }) => {
      // Update the ticket list preview
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket._id === ticketId
            ? { ...ticket, lastMessage: message.message, hasNewMessage: true }
            : ticket
        )
      );
    });

    return () => {
      socket.off("new_chat_message");
    };
  }, [setTickets]);

  return (
    <div className="ticket-list">
      {tickets.map((ticket) => (
        <div
          key={ticket._id}
          className={`ticket-item p-4 border rounded mb-2 ${
            ticket.hasNewMessage ? "bg-yellow-100" : "bg-white"
          }`}
        >
          <h3 className="font-bold text-lg">{ticket.title}</h3>
          <p className="text-sm text-gray-600">{ticket.lastMessage || "No messages yet"}</p>
          {ticket.hasNewMessage && (
            <span className="text-xs text-red-500 font-semibold">New Message</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default TicketList;
