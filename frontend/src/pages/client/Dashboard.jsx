import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../../auth/useAuthStore";
import api from "../../api/apiService";

const ClientDashboard = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default stats structure for loading state
  const defaultStats = [
    { name: "Open Tickets", value: "0", color: "bg-blue-500" },
    { name: "In Progress", value: "0", color: "bg-yellow-500" },
    { name: "Resolved", value: "0", color: "bg-green-500" },
    { name: "Total Tickets", value: "0", color: "bg-purple-500" },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/client/dashboard");

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Dashboard API error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Get stats data from API or use defaults
  const stats = dashboardData?.stats || defaultStats;
  const recentTickets = dashboardData?.recentTickets || [];
  const summary = dashboardData?.summary || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  };
  const ticketDetails = dashboardData?.ticketDetails || {
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    byStatus: { open: 0, "in-progress": 0, resolved: 0, closed: 0 },
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status) => {
    const statusStyles = {
      open: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };

    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  // Helper function to get priority badge styling
  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    return priorityStyles[priority] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <motion.div
          className="flex space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          {[
            "bg-blue-500",
            "bg-yellow-500",
            "bg-green-500",
            "bg-purple-500",
          ].map((color, index) => (
            <motion.div
              key={index}
              className={`w-6 h-6 rounded-full ${color}`}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            ></motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your support tickets.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white font-semibold text-lg">
                    {stat.value}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ticket Summary
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-gray-900">
                {summary.totalTickets}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Total Tickets
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-gray-900">
                {summary.openTickets}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Open Tickets
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-gray-900">
                {summary.inProgressTickets}
              </div>
              <div className="text-sm font-medium text-gray-600">
                In Progress
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-gray-900">
                {summary.resolvedTickets}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Resolved Tickets
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Analysis - New Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tickets by Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tickets by Priority
            </h2>
            <div className="space-y-4">
              {Object.entries(ticketDetails.byPriority).map(
                ([priority, count]) => (
                  <div key={priority} className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${getPriorityBadge(
                        priority
                      )}`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          priority === "urgent"
                            ? "bg-red-500"
                            : priority === "high"
                            ? "bg-orange-500"
                            : priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${
                            summary.totalTickets > 0
                              ? (count / summary.totalTickets) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Tickets by Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tickets by Status
            </h2>
            <div className="space-y-4">
              {Object.entries(ticketDetails.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${getStatusBadge(
                      status
                    )}`}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("-", " ")}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        status === "open"
                          ? "bg-blue-500"
                          : status === "in-progress"
                          ? "bg-yellow-500"
                          : status === "resolved"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                      style={{
                        width: `${
                          summary.totalTickets > 0
                            ? (count / summary.totalTickets) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Tickets
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          Ticket #{ticket.ticketNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.charAt(0).toUpperCase() +
                            ticket.status.slice(1).replace("-", " ")}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </span>
                        {ticket.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {ticket.category.charAt(0).toUpperCase() +
                              ticket.category.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500">{ticket.timeAgo}</p>
                      <p className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Updated:{" "}
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tickets yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first support ticket.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ticket Details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                By Priority
              </h3>
              <div className="flex gap-2">
                {Object.entries(ticketDetails.byPriority).map(
                  ([priority, count]) => (
                    <div
                      key={priority}
                      className="flex-1 bg-gray-100 rounded-lg p-4"
                    >
                      <div className="text-xs font-medium text-gray-500 capitalize">
                        {priority}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {count}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                By Status
              </h3>
              <div className="flex gap-2">
                {Object.entries(ticketDetails.byStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex-1 bg-gray-100 rounded-lg p-4"
                    >
                      <div className="text-xs font-medium text-gray-500 capitalize">
                        {status}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {count}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
