import React, { useState, useEffect, useRef } from "react";
import api from "../../api/apiService";
import {
  WEBSOCKET_BACKEND_URL,
  createWebSocketConnection,
} from "../../api/apiService";

const SuperAdminDashboard = () => {
  useEffect(() => {
    document.title = "Super Admin Dashboard";
  }, []);

  const [dashboardData, setDashboardData] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [ticketTrends, setTicketTrends] = useState(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [clientAnalytics, setClientAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard analytics
  const fetchDashboardAnalytics = async () => {
    try {
      const response = await api.get("/superadmin/analytics/dashboard");
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error("Dashboard analytics error:", err);
      setError("Failed to load dashboard data");
    }
  };

  // Fetch activity feed
  const fetchActivityFeed = async () => {
    try {
      const response = await api.get("/superadmin/analytics/activity?limit=8");
      if (response.data.success) {
        setActivityFeed(response.data.data);
      }
    } catch (err) {
      console.error("Activity feed error:", err);
    }
  };

  // Fetch ticket trends
  const fetchTicketTrends = async () => {
    try {
      const response = await api.get("/superadmin/analytics/trends?days=7");
      if (response.data.success) {
        setTicketTrends(response.data.data);
      }
    } catch (err) {
      console.error("Ticket trends error:", err);
    }
  };

  // Fetch category analytics
  const fetchCategoryAnalytics = async () => {
    try {
      const response = await api.get("/superadmin/analytics/categories");
      if (response.data.success) {
        setCategoryAnalytics(response.data.data.slice(0, 5)); // Top 5 categories
      }
    } catch (err) {
      console.error("Category analytics error:", err);
    }
  };

  // Fetch client analytics
  const fetchClientAnalytics = async () => {
    try {
      const response = await api.get("/superadmin/analytics/clients");
      if (response.data.success) {
        setClientAnalytics(response.data.data.slice(0, 5)); // Top 5 clients
      }
    } catch (err) {
      console.error("Client analytics error:", err);
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDashboardAnalytics(),
        fetchActivityFeed(),
        fetchTicketTrends(),
        fetchCategoryAnalytics(),
        fetchClientAnalytics(),
      ]);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Create a reference to store the WebSocket connection
  const socketRef = useRef(null);

  // Initial data load effect
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardAnalytics();
      fetchActivityFeed();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // WebSocket connection effect - separate from data loading
  useEffect(() => {
    // Get authentication token for WebSocket
    const token = localStorage.getItem("authToken");
    console.log("Dashboard: Token found:", !!token);

    // Store reference to the refresh function
    const refreshDashboard = () => {
      console.log("WebSocket event triggered - refreshing dashboard data");
      // These are the same functions used in loadDashboardData, calling them directly avoids dependency issues
      fetchDashboardAnalytics();
      fetchActivityFeed();
      fetchTicketTrends();
      fetchCategoryAnalytics();
      fetchClientAnalytics();
    };

    // Create WebSocket connection
    if (token && !socketRef.current) {
      // Connect to the WebSocket server with the correct URL
      console.log("Dashboard: Creating WebSocket connection to:", WEBSOCKET_BACKEND_URL);
      socketRef.current = createWebSocketConnection(WEBSOCKET_BACKEND_URL);
      
      // Authenticate with the WebSocket server
      socketRef.current.on('connect', () => {
        console.log("Dashboard: WebSocket connected, authenticating...");
        socketRef.current.emit('authenticate', { token });
      });
      
      // Listen for successful authentication
      socketRef.current.on('authenticated', () => {
        console.log('WebSocket authenticated successfully for dashboard');
      });
      
      // Handle authentication errors
      socketRef.current.on('authentication_error', (error) => {
        console.error('WebSocket authentication failed for dashboard:', error.message);
      });

      // Listen for ticket creation events
      socketRef.current.on("ticket_created", (data) => {
        console.log("Dashboard: New ticket created - refreshing dashboard", data);
        refreshDashboard();
      });

      // Listen for ticket status change events
      socketRef.current.on("ticket_updated", (data) => {
        console.log("Dashboard: Ticket updated - refreshing dashboard", data);
        refreshDashboard();
      });
    }

    // Clean up WebSocket connection on component unmount
    return () => {
      if (socketRef.current) {
        console.log("Dashboard: Cleaning up WebSocket connection");
        // Remove all event listeners
        socketRef.current.off('connect');
        socketRef.current.off('authenticated');
        socketRef.current.off('authentication_error');
        socketRef.current.off("ticket_created");
        socketRef.current.off("ticket_updated");
        
        // Disconnect
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Helper function to get priority color
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

  // Helper function to get status color
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
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={loadDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6  min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Overview of all system activities and metrics
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {dashboardData && (
        <>
          {/* Ticket Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Tickets
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.tickets.summary.total}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {dashboardData.tickets.metrics.recentTickets} created this
                    week
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Open Tickets
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.tickets.summary.open}
                  </p>
                  <p className="text-sm text-red-600 mt-1">Needs attention</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    In Progress
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.tickets.summary.inProgress}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Being worked on
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.tickets.summary.resolved}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {dashboardData.tickets.metrics.recentResolved} this week
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Priority & Client Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Priority Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Priority Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Urgent",
                    count: dashboardData.tickets.byPriority.urgent,
                    color: "bg-red-500",
                  },
                  {
                    label: "High",
                    count: dashboardData.tickets.byPriority.high,
                    color: "bg-orange-500",
                  },
                  {
                    label: "Medium",
                    count: dashboardData.tickets.byPriority.medium,
                    color: "bg-yellow-500",
                  },
                  {
                    label: "Low",
                    count: dashboardData.tickets.byPriority.low,
                    color: "bg-green-500",
                  },
                ].map((priority) => (
                  <div
                    key={priority.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${priority.color} mr-3`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {priority.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {priority.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Client Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.clients.summary.total}
                  </p>
                  <p className="text-sm text-gray-600">Total Clients</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardData.clients.summary.pending}
                  </p>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.clients.summary.approved}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardData.clients.summary.rejected}
                  </p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData.tickets.metrics.avgResolutionTime}h
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Avg Resolution Time
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(
                    (dashboardData.tickets.summary.resolved /
                      dashboardData.tickets.summary.total) *
                      100
                  ) || 0}
                  %
                </p>
                <p className="text-sm text-gray-600 mt-1">Resolution Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    (dashboardData.clients.summary.approved /
                      dashboardData.clients.summary.total) *
                      100
                  ) || 0}
                  %
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Client Approval Rate
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            {activityFeed.length > 0 ? (
              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "ticket"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      {activity.type === "ticket" ? (
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {activity.client}
                        </span>
                        {activity.priority && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                              activity.priority
                            )}`}
                          >
                            {activity.priority}
                          </span>
                        )}
                        {activity.status && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {activity.timeAgo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Categories
            </h3>
          </div>
          <div className="p-6">
            {categoryAnalytics.length > 0 ? (
              <div className="space-y-4">
                {categoryAnalytics.map((category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          #{index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {category.category || "Uncategorized"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Avg Priority: {category.avgPriorityScore}/4
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {category.total}
                      </p>
                      <p className="text-xs text-green-600">
                        {category.statusBreakdown.resolved} resolved
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No category data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      {clientAnalytics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Clients by Ticket Volume
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientAnalytics.map((client) => (
                  <tr key={client.clientId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                        {client.company && (
                          <div className="text-xs text-gray-400">
                            {client.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.ticketCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {client.openTickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {client.resolvedTickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${client.resolutionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {client.resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
