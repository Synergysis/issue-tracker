import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getBackendUrl } from "../../api/apiService";
import TicketChat from "../../components/TicketChat";

const TicketDetailView = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Ticket Details";
  }, []);

  useEffect(() => {
    if (ticket_id) {
      fetchTicket();
    } else {
      setError("No ticket ID provided");
      setLoading(false);
    }
  }, [ticket_id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/client/tickets/${ticket_id}`);

      console.log("Ticket response:", response.data);

      const ticketData = response.data.data || response.data;
      setTicket(ticketData);
    } catch (err) {
      console.error("Error fetching ticket:", err);

      let message = "Failed to load ticket.";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 404) {
        message = "Ticket not found.";
      } else if (err.response?.status === 401) {
        message = "You are not authorized to view this ticket.";
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-red-50 text-red-700 border border-red-200";
      case "in-progress":
      case "in_progress":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "resolved":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-50 text-red-700 border border-red-200";
      case "high":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "low":
        return "bg-green-50 text-green-700 border border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this ticket?")) {
      return;
    }

    try {
      await api.put(`/client/tickets/${ticket_id}/cancel`);
      fetchTicket();
      alert("Ticket canceled successfully!");
    } catch (error) {
      console.error("Error canceling ticket:", error);
      let message = "Error canceling ticket. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      alert(message);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Are you sure you want to close this ticket?")) {
      return;
    }
    try {
      await api.put(`/client/tickets/${ticket_id}/close`);
      fetchTicket();
      alert("Ticket closed successfully!");
    } catch (error) {
      console.error("Error closing ticket:", error);
      let message = "Error closing ticket. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-100"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent absolute top-0"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">
                  Error Loading Ticket
                </h3>
                <p className="mt-2 text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={fetchTicket}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
              <button
                onClick={() => navigate("/client/tickets")}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Ticket Data Available
            </h3>
            <p className="text-gray-600 mb-6">
              The ticket information could not be loaded.
            </p>
            <button
              onClick={() => navigate("/client/tickets")}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-green-600 hover:text-green-800 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Tickets
        </button>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ticket #{ticket._id}
                </h1>
              </div>
              <p className="text-xl text-gray-600 font-medium">
                {ticket.title}
              </p>
            </div>
            <div className="flex gap-3">
              {!(
                ticket.status === "resolved" ||
                ticket.status === "cancelled" ||
                ticket.status === "canceled" ||
                ticket.status === "closed"
              ) && (
                <>
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Close Ticket
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel Ticket
                  </button>
                </>
              )}
              {/* <button
                onClick={() => navigate("/client/tickets")}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Tickets
              </button> */}
            </div>
          </div>
        </div>{" "}
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ticket Details */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Status Bar */}
              <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg
                        className="h-4 w-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status?.replace("_", "-") || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg
                        className="h-4 w-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Priority
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority || "Medium"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg
                        className="h-4 w-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Category
                      </p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {ticket.category || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg
                        className="h-4 w-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Created
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(ticket.createdAt || ticket.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-8">
                <div className="space-y-8">
                  {/* Description */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Description
                      </h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {ticket.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Attached Files */}
                  {ticket.files && ticket.files.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Attachments
                        </h3>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <ul className="space-y-4">
                          {ticket.files.map((file) => (
                            <li key={file._id} className="flex flex-col gap-2">
                              {file.mimetype.startsWith("image/") ? (
                                <img
                                  src={`${getBackendUrl()}/${file.path.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt={file.originalname}
                                  className="max-w-xs rounded-lg border border-gray-300"
                                />
                              ) : (
                                <span className="text-gray-700 font-medium">
                                  {file.originalname}
                                </span>
                              )}
                              <a
                                href={`${getBackendUrl()}/${file.path.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-700 underline hover:text-green-900 text-sm"
                              >
                                Download
                              </a>
                              <span className="text-xs text-gray-500">
                                ({file.mimetype}, {Math.round(file.size / 1024)}{" "}
                                KB)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Additional Details
                      </h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">
                            Ticket ID
                          </label>
                          <p className="text-gray-900 font-mono font-semibold">
                            #{ticket._id}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">
                            Last Updated
                          </label>
                          <p className="text-gray-900 font-medium">
                            {formatDate(
                              ticket.updatedAt ||
                                ticket.updated_at ||
                                ticket.createdAt ||
                                ticket.created_at
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TicketChat ticketId={ticket_id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailView;
