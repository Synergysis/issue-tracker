import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/apiService";
import {
  ArrowLeft,
  Building,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Check,
  AlertCircle,
  Tag,
  Flag,
} from "lucide-react";

const CompanyDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [tickets, setTickets] = useState({ list: [], summary: {} });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        // Use the /company/:id endpoint and api instance
        const response = await api.get(`/company/${id}`);
        setCompany(response.data.data);

        // Set tickets and clients from response if available
        if (response.data.tickets) {
          setTickets(response.data.tickets);
        }

        if (response.data.clients) {
          setClients(response.data.clients);
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        setError("Failed to load company details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [id]);

  // Function to get badge color based on priority
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get badge color based on status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get badge color based on client status
  const getClientStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      await api.delete(`/superadmin/companies/${id}`);
      navigate("/superadmin/companies");
    } catch (error) {
      console.error("Error deleting company:", error);
      setError("Failed to delete company. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p>{error || "Company not found"}</p>
        <button
          onClick={() => navigate("/superadmin/companies")}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Back to Companies
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to="/superadmin/companies"
          className="inline-flex items-center text-green-600 hover:text-green-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Companies
        </Link>
      </div>

      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Building className="h-8 w-8 text-green-700" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Added on {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                navigate(
                  `/superadmin/companies/edit/${
                    company._id || company.companyId
                  }`
                )
              }
              className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-md flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-md flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
          Company Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Company ID</h3>
              <p className="text-gray-900 mt-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 select-all">
                {company.companyId}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Company Name
              </h3>
              <p className="text-gray-900 mt-1">{company.name}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Contact Information
              </h3>
              <div className="mt-1 flex items-center text-gray-900">
                <Mail className="h-4 w-4 text-gray-500 mr-1" />
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="text-green-600 hover:text-green-800"
                >
                  {company.contactEmail}
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <div className="mt-1 flex items-start text-gray-900">
                <MapPin className="h-4 w-4 text-gray-500 mr-1 mt-1" />
                <p>{company.address}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <div className="mt-1 flex items-center text-gray-900">
                <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                <p>{new Date(company.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Stats */}
      {tickets && tickets.summary && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            Company Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Total Tickets
              </h3>
              <p className="text-2xl font-semibold text-green-700">
                {tickets.summary.total || 0}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Open Tickets
              </h3>
              <p className="text-2xl font-semibold text-orange-700">
                {tickets.summary?.status?.open || 0}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Urgent Tickets
              </h3>
              <p className="text-2xl font-semibold text-red-700">
                {tickets.summary?.priority?.urgent || 0}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                High Priority
              </h3>
              <p className="text-2xl font-semibold text-yellow-700">
                {tickets.summary?.priority?.high || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Associated Users Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
          Associated Users ({clients.length})
        </h2>
        {clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((clientData) => (
                  <tr key={clientData.client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {clientData.client.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {clientData.client.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-1" />
                        {clientData.client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getClientStatusColor(
                          clientData.client.status
                        )}`}
                      >
                        {clientData.client.status === "approved" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : clientData.client.status === "pending" ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {clientData.client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        clientData.client.joinedDate
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {clientData.ticketSummary.total || 0} tickets
                        </span>
                        <div className="flex space-x-1 mt-1">
                          {clientData.ticketSummary.priority?.urgent > 0 && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {clientData.ticketSummary.priority.urgent} urgent
                            </span>
                          )}
                          {clientData.ticketSummary.priority?.high > 0 && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              {clientData.ticketSummary.priority.high} high
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() =>
                          navigate(
                            `/superadmin/clients/${clientData.client._id}`
                          )
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No clients associated with this company yet.
          </p>
        )}
      </div>

      {/* Tickets Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
          Recent Tickets ({tickets.list?.length || 0})
        </h2>
        {tickets.list && tickets.list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {tickets.list.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <AlertTriangle
                          className={`flex-shrink-0 h-5 w-5 mr-2 ${
                            ticket.priority === "urgent"
                              ? "text-red-500"
                              : ticket.priority === "high"
                              ? "text-orange-500"
                              : "text-gray-400"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {ticket.description.length > 50
                              ? `${ticket.description.substring(0, 50)}...`
                              : ticket.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm text-gray-900 capitalize">
                          {ticket.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() =>
                          navigate(`/superadmin/tickets/${ticket._id}`)
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No tickets found for this company.
          </p>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailView;
