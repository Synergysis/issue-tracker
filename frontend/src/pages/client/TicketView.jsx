import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiService";
import {
  WEBSOCKET_BACKEND_URL,
  createWebSocketConnection,
} from "../../api/apiService";
import useAuthStore from "../../auth/useAuthStore";
import {
  FaLaptop,
  FaCreditCard,
  FaMagic,
  FaWrench,
  FaExclamationCircle,
  FaCircle,
  FaChartBar,
  FaRegCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const TicketView = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Set document title
  useEffect(() => {
    document.title = "My Tickets";
  }, []);

  // Reference to store WebSocket connection
  const socketRef = useRef(null);

  // Function to fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const clientId = user?._id || user?.id;
      if (!clientId) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }
      const response = await api.get(
        `/client/tickets?clientId=${clientId}&page=${currentPage}&limit=${itemsPerPage}`
      );
      const ticketsData = response.data?.data || response.data?.tickets || [];
      setTickets(ticketsData);
      // Try to get totalPages from response, fallback to 1
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching tickets:", err);

      // Handle different error scenarios
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection.");
      } else {
        setError(
          err.response?.data?.message ||
            "Error loading tickets. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      // Create WebSocket connection
      socketRef.current = createWebSocketConnection(WEBSOCKET_BACKEND_URL);

      // Authenticate the socket connection
      socketRef.current.on("connect", () => {
        console.log("TicketView - WebSocket connected");

        // Send authentication
        socketRef.current.emit("authenticate", {
          token: localStorage.getItem("authToken"),
        });
      });

      // Handle authentication response
      socketRef.current.on("authenticated", (data) => {
        console.log("TicketView - WebSocket authenticated:", data);
      });

      // Listen for new ticket events
      socketRef.current.on("ticket_created", (data) => {
        console.log("TicketView - New ticket notification received:", data);

        // Refresh the tickets list when a new ticket is created
        fetchTickets();
      });

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [user]);

  // Fetch tickets from API on component mount and page change
  useEffect(() => {
    fetchTickets();
  }, [user, currentPage]);

  const handleViewTicket = (ticketId) => {
    console.log("Navigate to ticket details:", ticketId);
    // Navigate to the correct ticket detail route
    navigate(`/client/tickets/${ticketId}`);
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to cancel this ticket?")) {
      return;
    }

    try {
      // Update ticket status to cancelled via API
      await api.put(`/superadmin/tickets/${ticketId}`, {
        status: "cancelled",
      });

      // Update local state - using 'id' instead of '_id'
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: "cancelled" } : ticket
        )
      );

      console.log("Ticket cancelled:", ticketId);
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      setError("Error cancelling ticket. Please try again.");
    }
  };

  const handleCreateTicket = () => {
    console.log("Navigate to create ticket");
    // You can implement navigation logic here
    // e.g., navigate("/tickets/create");
    navigate("/client/create-ticket");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "text-red-700 bg-red-100 border-red-200";
      case "in-progress":
      case "in_progress":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "resolved":
        return "text-green-700 bg-green-100 border-green-200";
      case "cancelled":
        return "text-gray-700 bg-gray-100 border-gray-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "text-red-700 bg-red-100 border-red-200";
      case "high":
        return "text-orange-700 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-700 bg-green-100 border-green-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "technical":
        return <FaLaptop className="inline-block text-gray-500" />;
      case "billing":
        return <FaCreditCard className="inline-block text-gray-500" />;
      case "feature":
        return <FaMagic className="inline-block text-gray-500" />;
      case "general":
      default:
        return <FaWrench className="inline-block text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <FaCircle className="inline-block text-red-500" />;
      case "in-progress":
      case "in_progress":
        return <FaCircle className="inline-block text-yellow-500" />;
      case "resolved":
        return <FaCheckCircle className="inline-block text-green-500" />;
      case "cancelled":
        return <FaTimesCircle className="inline-block text-gray-500" />;
      default:
        return <FaRegCircle className="inline-block text-gray-400" />;
    }
  };

  // Filter tickets based on search term and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Tickets
            </h1>
            <p className="text-gray-600">
              View and manage your support tickets.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
              <p className="text-gray-600 font-medium">
                Loading your tickets...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-full">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-2">
            View and manage your support tickets.
          </p>
        </div>
        {/* Filters and Search (keep original size) */}
        <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center max-w-full mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets by title, description, or ID..."
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
              {statusFilter === "all" && (
                <FaChartBar className="text-gray-500" />
              )}
              {statusFilter === "open" && <FaCircle className="text-red-500" />}
              {statusFilter === "in-progress" && (
                <FaCircle className="text-yellow-500" />
              )}
              {statusFilter === "resolved" && (
                <FaCircle className="text-green-500" />
              )}
              {statusFilter === "cancelled" && (
                <FaCircle className="text-gray-500" />
              )}
            </div>
          </div>
          <div className="relative inline-block">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
              {priorityFilter === "all" && (
                <FaChartBar className="text-gray-500" />
              )}
              {priorityFilter === "urgent" && (
                <FaExclamationCircle className="text-red-500" />
              )}
              {priorityFilter === "high" && (
                <FaExclamationCircle className="text-orange-500" />
              )}
              {priorityFilter === "medium" && (
                <FaExclamationCircle className="text-yellow-500" />
              )}
              {priorityFilter === "low" && (
                <FaExclamationCircle className="text-green-500" />
              )}
            </div>
          </div>
          {(searchTerm ||
            statusFilter !== "all" ||
            priorityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 ml-2"
            >
              Clear all
            </button>
          )}
        </div>
        {/* Active Filters */}
        {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600 mb-2 rounded">
            <span>Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 bg-white rounded border border-gray-200 text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 bg-white rounded border border-gray-200 text-xs">
                Status: {statusFilter}
              </span>
            )}
            {priorityFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 bg-white rounded border border-gray-200 text-xs">
                Priority: {priorityFilter}
              </span>
            )}
          </div>
        )}
        {/* Main Content - Table View */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Tickets ({filteredTickets.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredTickets.length !== tickets.length &&
                  `Showing ${filteredTickets.length} of ${tickets.length} tickets`}
              </p>
            </div>
            {/* <button
              onClick={handleCreateTicket}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg flex items-center"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Ticket
            </button> */}
          </div>
          <div className="overflow-x-auto">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No tickets found</div>
                <div className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters or check back later
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {ticket.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          #{ticket._id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}{" "}
                          {ticket.status?.replace("_", " ") || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-medium ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority || "Medium"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCategoryIcon(ticket.category)}{" "}
                        {ticket.category || "General"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewTicket(ticket._id)}
                          className="text-green-700 hover:underline mr-3"
                        >
                          View Details
                        </button>
                        {/* {ticket.status !== "resolved" &&
                          ticket.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelTicket(ticket._id)}
                              className="text-red-700 hover:underline"
                            >
                              Cancel
                            </button>
                          )} */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Previous
                </button>
                {/* Page numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded ${
                            pageNum === currentPage
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketView;
