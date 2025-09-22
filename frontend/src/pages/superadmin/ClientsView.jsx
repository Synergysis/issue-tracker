import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiService";

const ClientsView = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // Set document title
  useEffect(() => {
    document.title = "Clients";
  }, []);

  // Fetch clients from API
  const fetchClients = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page,
        limit: itemsPerPage,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      const response = await api.get("/superadmin/clients", { params });
      if (response.data.success) {
        const data =
          response.data.data?.clients ||
          response.data.data ||
          response.data.clients ||
          [];
        setClients(data);
        // Map backend pagination to frontend format
        const pag = response.data.data?.pagination || response.data.pagination;
        setPagination({
          totalClients: pag?.total || data.length,
          totalPages: pag?.pages || 1,
          currentPage: pag?.current || page,
          hasPrev: (pag?.current || page) > 1,
          hasNext: (pag?.current || page) < (pag?.pages || 1),
        });
      } else {
        setError("Failed to fetch clients");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error fetching clients"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox selection
  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Select all clients
  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map((client) => client._id));
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch clients when component mounts or filters change
  useEffect(() => {
    fetchClients(currentPage);
    // eslint-disable-next-line
  }, [currentPage, filterStatus]);

  // Live search effect
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchClients();
      return;
    }
    setSearching(true);
    setError(null);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`/superadmin/clients/search`, {
          params: { q: searchTerm, page: 1, limit: itemsPerPage },
        });
        if (response.data.success) {
          const data =
            response.data.data?.clients ||
            response.data.data ||
            response.data.clients ||
            [];
          setClients(data);
          // Map backend pagination to frontend format
          const pag =
            response.data.data?.pagination || response.data.pagination;
          setPagination({
            totalClients: pag?.total || data.length,
            totalPages: pag?.pages || 1,
            currentPage: pag?.current || 1,
            hasPrev: false,
            hasNext: false,
          });
        } else {
          setError("Failed to search clients");
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Error searching clients"
        );
      } finally {
        setSearching(false);
      }
    }, 400); // debounce
    setSearchTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Helper to highlight search term in text
  const highlightText = (text) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-black p-0 m-0">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Clients</h1>
        <p className="text-gray-600 mt-2">
          Manage and monitor all registered clients and their accounts.
        </p>
        {/* Filters Row */}
        <div className="mt-4 bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center max-w-full justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  if (e.target.value === "") {
                    fetchClients();
                  }
                }}
                placeholder="Search clients..."
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-80"
                style={{ minWidth: 0 }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                    fetchClients();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label="Clear search"
                >
                  &#10005;
                </button>
              )}
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            onClick={() => navigate("/superadmin/clients")}
          >
            View All Clients
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={fetchClients}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Clients ({pagination.totalClients || clients.length})
          </h3>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Removed checkbox column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr
                  key={client._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/superadmin/clients/${client._id}`)}
                >
                  {/* Removed checkbox cell */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {highlightText(client.name || client.fullName || "—")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {highlightText(client.companyName || "—")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {highlightText(client.email || "—")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                        client.status
                      )}`}
                    >
                      {client.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.ticketsCount || client.tickets || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.joinedDate ||
                    client.createdAt ||
                    client.registeredAt
                      ? new Date(
                          client.joinedDate ||
                            client.createdAt ||
                            client.registeredAt
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/superadmin/clients/${client._id}`);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs flex items-center mx-auto"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination - moved to bottom of table */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}{" "}
            (Total: {pagination.totalClients} clients)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const prevPage = Math.max(pagination.currentPage - 1, 1);
                setCurrentPage(prevPage);
              }}
              disabled={pagination.currentPage === 1 || loading}
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
                        onClick={() => {
                          setCurrentPage(pageNum);
                        }}
                        disabled={loading}
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
              onClick={() => {
                let nextPage = Number(pagination.currentPage) + 1;
                if (isNaN(nextPage) || nextPage < 1) nextPage = 1;
                setCurrentPage(nextPage);
              }}
              disabled={
                pagination.currentPage >= (pagination.totalPages || 1) ||
                loading
              }
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Show message when no clients */}
      {clients.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No clients found</div>
          <div className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or check back later
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
