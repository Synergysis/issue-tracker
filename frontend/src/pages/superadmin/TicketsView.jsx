import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiService";
import {
  WEBSOCKET_BACKEND_URL,
  createWebSocketConnection,
} from "../../api/apiService";

const TicketsTable = ({
  tickets,
  pagination,
  selectedTickets,
  handleSelectTicket,
  handleSelectAll,
  updateTicket,
  navigate,
  getStatusColor,
  getPriorityColor,
  highlightText,
  setCurrentPage,
  loading,
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">
        Tickets ({pagination.totalTickets || tickets.length})
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={
                  selectedTickets.length === tickets.length &&
                  tickets.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ticket
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
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
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedTickets.includes(ticket.id)}
                  onChange={() => handleSelectTicket(ticket.id)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {highlightText(ticket.title)}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {highlightText(ticket.description)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {highlightText(ticket.client)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {highlightText(ticket.company)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={ticket.status}
                  onChange={(e) =>
                    updateTicket(ticket.id, { status: e.target.value })
                  }
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-green-500 ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={ticket.priority}
                  onChange={(e) =>
                    updateTicket(ticket.id, { priority: e.target.value })
                  }
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-green-500 ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {ticket.category || "General"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {ticket.createdAt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => navigate(`/superadmin/tickets/${ticket.id}`)}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Pagination */}
    {pagination.totalPages > 1 && (
      <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing page {pagination.currentPage} of {pagination.totalPages}{" "}
          (Total: {pagination.totalTickets} tickets)
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
          >
            Previous
          </button>
          {/* Page numbers */}
          <div className="flex space-x-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNum <= pagination.totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        pageNum === pagination.currentPage
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              }
            )}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    )}
    {loading && (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )}
    {/* Show message when no tickets */}
    {tickets.length === 0 && !loading && (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">No tickets found</div>
        <div className="text-gray-500 text-sm mt-2">
          Try adjusting your filters or check back later
        </div>
      </div>
    )}
  </div>
);

const SuperAdminTicketsView = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true); // for initial page load only
  const [tableLoading, setTableLoading] = useState(false); // for table refresh only
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Reference to WebSocket connection
  const socketRef = useRef(null);

  // Create refs to track latest state values without causing dependency cycles
  const searchTermRef = useRef(searchTerm);
  const currentPageRef = useRef(currentPage);
  const filterStatusRef = useRef(filterStatus);
  const filterPriorityRef = useRef(filterPriority);

  // Keep refs up to date with state changes
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    filterStatusRef.current = filterStatus;
  }, [filterStatus]);

  useEffect(() => {
    filterPriorityRef.current = filterPriority;
  }, [filterPriority]);

  // Fetch tickets from API - with improved dependency handling
  const fetchTickets = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setTableLoading(true);
        }
        setError(null);

        // Get current values from refs to avoid stale state
        const currentSearchTerm = searchTermRef.current;
        const currentPageValue = currentPageRef.current;
        const currentFilterStatus = filterStatusRef.current;
        const currentFilterPriority = filterPriorityRef.current;

        const params = {
          page: currentPageValue,
          limit: itemsPerPage,
        };

        // Combine filters for API
        if (currentFilterStatus !== "all") params.filter = currentFilterStatus;
        if (currentFilterPriority !== "all")
          params.filter = currentFilterPriority;
        if (currentSearchTerm.trim() !== "")
          params.search = currentSearchTerm.trim();

        console.log("Fetching tickets with params:", params);
        const response = await api.get("/superadmin/tickets", { params });
        console.log("API response:", response.data);

        if (response.data.success) {
          setTickets(response.data.data);
          setPagination(
            response.data.pagination || {
              totalTickets: response.data.data.length,
              totalPages: 1,
              currentPage: 1,
              hasPrev: false,
              hasNext: false,
            }
          );
        } else {
          setError("Failed to fetch tickets");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching tickets");
        console.error("Fetch tickets error:", err);
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setTableLoading(false);
        }
      }
    },
    // Remove dependencies that change frequently to prevent re-creation
    [itemsPerPage]
  );

  // Update ticket
  const updateTicket = async (ticketId, updateData) => {
    try {
      const response = await api.put(
        `/superadmin/tickets/${ticketId}`,
        updateData
      );

      if (response.data.success) {
        // Refresh tickets after update
        fetchTickets();
        alert("Ticket updated successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating ticket");
    }
  };

  // Resolve ticket
  const resolveTicket = async (ticketId) => {
    try {
      const response = await api.put(`/superadmin/tickets/${ticketId}/resolve`);

      if (response.data.success) {
        fetchTickets();
        alert("Ticket resolved successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error resolving ticket");
    }
  };

  // Delete ticket
  const deleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) {
      return;
    }

    try {
      const response = await api.delete(`/superadmin/tickets/${ticketId}`);

      if (response.data.success) {
        fetchTickets();
        alert("Ticket deleted successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting ticket");
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (selectedTickets.length === 0) {
      alert("Please select tickets first");
      return;
    }

    if (!bulkAction) {
      alert("Please select an action");
      return;
    }

    try {
      let updateData = {};

      switch (bulkAction) {
        case "resolve":
          updateData = { status: "resolved" };
          break;
        case "close":
          updateData = { status: "closed" };
          break;
        case "in-progress":
          updateData = { status: "in-progress" };
          break;
        case "open":
          updateData = { status: "open" };
          break;
        case "urgent":
          updateData = { priority: "urgent" };
          break;
        case "high":
          updateData = { priority: "high" };
          break;
        case "medium":
          updateData = { priority: "medium" };
          break;
        case "low":
          updateData = { priority: "low" };
          break;
        default:
          return;
      }

      const response = await api.put("/superadmin/tickets/bulk-update", {
        ticketIds: selectedTickets,
        updateData,
      });

      if (response.data.success) {
        fetchTickets();
        setSelectedTickets([]);
        setBulkAction("");
        alert(
          `${response.data.data.modifiedCount} tickets updated successfully!`
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating tickets");
    }
  };

  // Handle checkbox selection
  const handleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // Select all tickets
  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map((ticket) => ticket.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to highlight search term in text with improved error handling
  const highlightText = (text) => {
    // Check if text exists and is a string
    if (!searchTerm || !text || typeof text !== "string") {
      return text || "";
    }

    try {
      // Escape special regex characters in the search term
      const escapedSearchTerm = searchTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const regex = new RegExp(`(${escapedSearchTerm})`, "gi");

      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-black p-0 m-0">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch (error) {
      console.error("Error highlighting text:", error);
      return text;
    }
  };

  // Fetch tickets when component mounts
  useEffect(() => {
    fetchTickets(true); // initial load
    // eslint-disable-next-line
  }, []);

  // Handle filter changes separately from search
  useEffect(() => {
    // Skip initial render
    if (loading) return;

    // Always reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      // Only fetch if we're already on page 1
      fetchTickets(false);
    }
    // eslint-disable-next-line
  }, [filterStatus, filterPriority]);

  // Handle pagination changes
  useEffect(() => {
    // Skip initial render and filter-triggered page changes
    if (loading) return;

    // Fetch when page changes (but not when it's reset by filters or search)
    fetchTickets(false);
    // eslint-disable-next-line
  }, [currentPage]);

  // WebSocket connection for real-time ticket updates
  useEffect(() => {
    // Get authentication token for WebSocket
    const token = localStorage.getItem("authToken");
    console.log("TicketsView: Token found:", !!token);

    // Create WebSocket connection
    if (token && !socketRef.current) {
      // Connect to the WebSocket server with the correct URL and authentication
      console.log(
        "TicketsView: Creating WebSocket connection to:",
        WEBSOCKET_BACKEND_URL
      );
      socketRef.current = createWebSocketConnection(WEBSOCKET_BACKEND_URL);

      // Authenticate with the WebSocket server
      socketRef.current.on("connect", () => {
        console.log("TicketsView: WebSocket connected, authenticating...");
        socketRef.current.emit("authenticate", { token });
      });

      // Listen for successful authentication
      socketRef.current.on("authenticated", () => {
        console.log("WebSocket authenticated successfully");
      });

      // Handle authentication errors
      socketRef.current.on("authentication_error", (error) => {
        console.error("WebSocket authentication failed:", error.message);
      });

      // Listen for ticket creation events
      socketRef.current.on("ticket_created", (data) => {
        console.log("New ticket created - refreshing tickets list", data);
        fetchTickets(false);
      });

      // Listen for ticket status change events
      socketRef.current.on("ticket_updated", () => {
        console.log("Ticket updated - refreshing tickets list");
        fetchTickets();
      });
    }

    // Cleanup function to disconnect WebSocket on component unmount
    return () => {
      if (socketRef.current) {
        console.log("TicketsView: Cleaning up WebSocket connection");
        // Remove all event listeners
        socketRef.current.off("connect");
        socketRef.current.off("authenticated");
        socketRef.current.off("authentication_error");
        socketRef.current.off("ticket_created");
        socketRef.current.off("ticket_updated");

        // Disconnect
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchTickets]);

  // Use ref to track previous search term
  const prevSearchTermRef = useRef("");

  // Live search effect with improved debouncing
  useEffect(() => {
    // Skip initial render
    if (loading) return;

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set searching indicator
    setSearching(true);

    // Use a longer timeout for empty searches to prevent flickering when clearing
    const timeoutDuration = searchTerm === "" ? 100 : 400;

    const timeout = setTimeout(() => {
      // Only perform search if term has changed
      if (prevSearchTermRef.current !== searchTerm) {
        prevSearchTermRef.current = searchTerm;

        // Reset to page 1 when search term changes
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          // Only fetch if not changing page (to avoid double fetching)
          fetchTickets(false);
        }
      }
      setSearching(false);
    }, timeoutDuration);

    setSearchTimeout(timeout);

    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Tickets</h1>
        <p className="text-gray-600 mt-2">
          Manage and monitor all support tickets across clients.
        </p>
        {/* Filters Row */}
        <div className="mt-4 bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center max-w-full">
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                placeholder="Search tickets by title, client or company..."
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-80" // wider input
                style={{ minWidth: 0 }}
                aria-label="Search tickets"
              />
              {searching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {searchTerm && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    // Just clear the search term - the useEffect will handle the fetch
                    setSearchTerm("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label="Clear search"
                >
                  &#10005;
                </button>
              )}
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Select Action</option>
                <optgroup label="Status">
                  <option value="open">Mark as Open</option>
                  <option value="in-progress">Mark as In Progress</option>
                  <option value="resolve">Mark as Resolved</option>
                  <option value="close">Mark as Closed</option>
                </optgroup>
                <optgroup label="Priority">
                  <option value="urgent">Set Priority: Urgent</option>
                  <option value="high">Set Priority: High</option>
                  <option value="medium">Set Priority: Medium</option>
                  <option value="low">Set Priority: Low</option>
                </optgroup>
              </select>
              <button
                onClick={handleBulkAction}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Apply to {selectedTickets.length} tickets
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={() => fetchTickets(false)}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        {/* Table loading spinner overlay */}
        {tableLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}
        <TicketsTable
          tickets={tickets}
          pagination={pagination}
          selectedTickets={selectedTickets}
          handleSelectTicket={handleSelectTicket}
          handleSelectAll={handleSelectAll}
          updateTicket={updateTicket}
          navigate={navigate}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          highlightText={highlightText}
          setCurrentPage={setCurrentPage}
          loading={tableLoading}
        />
      </div>
    </div>
  );
};

export default SuperAdminTicketsView;
