import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/apiService";
import { Search } from "lucide-react";

const CompaniesView = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Removed unused state
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [pagination, setPagination] = useState({});

  // Use refs to track current state without creating dependencies
  const searchTermRef = React.useRef("");
  const currentPageRef = React.useRef(1);

  // Keep refs in sync with state
  React.useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  React.useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Fetch companies from API using useCallback to memoize the function
  const fetchCompanies = useCallback(
    async (search = "", page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: page,
          limit: itemsPerPage,
        };
        // Only add search param if there's actual content to search
        if (search && search.trim()) {
          params.search = search.trim();
        }

        console.log("Fetching companies with params:", params);
        const response = await api.get("/superadmin/companies", { params });
        console.log("API response:", response.data);

        const data = response.data?.data || [];
        setCompanies(data);

        // Map backend pagination to frontend format
        const pag = response.data?.pagination;
        setPagination({
          totalCompanies: pag?.total || data.length,
          totalPages: pag?.pages || 1,
          currentPage: pag?.current || page,
          hasPrev: (pag?.current || page) > 1,
          hasNext: (pag?.current || page) < (pag?.pages || 1),
        });
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError("Failed to fetch companies. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    // Remove currentPage from dependencies to avoid infinite loop
    // Only depend on itemsPerPage which doesn't change
    [itemsPerPage]
  );

  // Effect for initial load only
  useEffect(() => {
    // This effect only runs once on component mount
    fetchCompanies("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to refresh companies list - uses refs to avoid dependency cycles
  const refreshCompaniesList = useCallback(() => {
    fetchCompanies(searchTermRef.current, currentPageRef.current);
  }, [fetchCompanies]);

  // Delete company function
  const deleteCompany = useCallback(
    async (companyId) => {
      try {
        setLoading(true);
        await api.delete(`/superadmin/companies/${companyId}`);

        // Show success message (can be implemented with a toast notification)
        console.log("Company deleted successfully");
        setError(null);

        // Refresh the companies list after successful deletion
        refreshCompaniesList();
      } catch (error) {
        console.error("Error deleting company:", error);
        setError("Failed to delete company. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [refreshCompaniesList]
  );

  // Handle search term changes only
  useEffect(() => {
    // Skip if fetchCompanies hasn't been initialized
    if (!fetchCompanies) return;

    setSearching(true);

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout to debounce API calls
    const timeout = setTimeout(() => {
      // Always reset to page 1 when search term changes
      if (searchTerm !== searchTermRef.current) {
        setCurrentPage(1);
        fetchCompanies(searchTerm, 1);
      } else {
        fetchCompanies(searchTerm, currentPageRef.current);
      }
      setSearching(false);
    }, 300); // debounce

    setSearchTimeout(timeout);

    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, fetchCompanies]);

  // Handle pagination changes separately
  useEffect(() => {
    // Skip initial render and when page changes due to search
    if (!fetchCompanies || currentPageRef.current === currentPage) return;

    fetchCompanies(searchTermRef.current, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchCompanies]);

  // Helper to highlight search term in text
  const highlightText = (text) => {
    // Guard against null or undefined text
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

  // ...existing code...

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-600 mt-2">
          Manage and monitor all companies in the system.
        </p>

        {/* Filters & Actions Row */}
        <div className="mt-4 bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searching ? (
                <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, address or email..."
              className="pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-full"
              aria-label="Search companies"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  // First clear the search term
                  setSearchTerm("");
                  // Reset to page 1
                  setCurrentPage(1);
                  // No need to call fetchCompanies here - the useEffect will handle it
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>

          <Link
            to="/superadmin/companies/create"
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-0"
            style={{ minWidth: "fit-content" }}
          >
            Create Company
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={refreshCompaniesList}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Companies ({pagination.totalCompanies || companies.length})
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
                {/* Corrected column order */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50">
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() =>
                      navigate(
                        `/superadmin/companies/${
                          company.companyId || company._id
                        }`
                      )
                    }
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {highlightText(company.name)}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() =>
                      navigate(
                        `/superadmin/companies/${
                          company.companyId || company._id
                        }`
                      )
                    }
                  >
                    <div className="text-sm text-gray-900">
                      {company.companyId || "—"}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() =>
                      navigate(
                        `/superadmin/companies/${
                          company.companyId || company._id
                        }`
                      )
                    }
                  >
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {highlightText(company.address)}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() =>
                      navigate(
                        `/superadmin/companies/${
                          company.companyId || company._id
                        }`
                      )
                    }
                  >
                    <div className="text-sm text-gray-900">
                      {highlightText(company.contactEmail)}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    onClick={() =>
                      navigate(
                        `/superadmin/companies/${
                          company.companyId || company._id
                        }`
                      )
                    }
                  >
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/superadmin/companies/edit/${
                              company._id || company.companyId
                            }`
                          );
                        }}
                        className="text-green-600 hover:text-green-900 px-2 py-1"
                        title="Edit Company"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Are you sure you want to delete the company "${company.name}"?`
                            )
                          ) {
                            deleteCompany(company._id || company.companyId);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 px-2 py-1"
                        title="Delete Company"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination - moved to bottom of table, like ClientsView */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}{" "}
            (Total: {pagination.totalCompanies} companies)
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

      {/* Loading spinner overlay handled above */}

      {/* Show message when no companies */}
      {companies.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No companies found</div>
          <div className="text-gray-500 text-sm mt-2">
            Try adjusting your search or add a new company
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesView;
