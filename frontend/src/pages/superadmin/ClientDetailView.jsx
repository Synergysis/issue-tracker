import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiService";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaClipboard,
  FaArrowLeft,
  FaDownload,
} from "react-icons/fa";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "approved":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <FaCheckCircle className="inline align-middle" />,
      };
    case "pending":
      return {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <FaHourglassHalf className="inline align-middle" />,
      };
    case "rejected":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <FaTimesCircle className="inline align-middle" />,
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <FaClipboard className="inline align-middle" />,
      };
  }
};

const ClientDetailView = () => {
  const { client_id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [ticketAnalytics, setTicketAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  useEffect(() => {
    if (client_id) {
      fetchClient();
    } else {
      setError("No client ID provided");
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [client_id]);
  const fetchClient = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/superadmin/clients/${client_id}`);
      setClient(response.data.client || {});
      setCompany(response.data.company || null);
      setTicketAnalytics(response.data.ticketAnalytics || null);
    } catch (err) {
      let message = "Failed to load client.";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 404) {
        message = "Client not found.";
      } else if (err.response?.status === 401) {
        message = "You are not authorized to view this client.";
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openImagePreview = (imageSrc, imageName) => {
    setSelectedImage({ src: imageSrc, name: imageName });
  };
  const closeImagePreview = () => setSelectedImage(null);

  // State for unified confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: null, // 'approve', 'reject', 'delete'
    title: "",
    message: "",
    confirmButtonText: "",
    confirmButtonColor: "",
    icon: null,
  });

  // Show confirmation dialog
  const showConfirmationDialog = (type) => {
    let dialogConfig = {
      show: true,
      type,
      title: "",
      message: "",
      confirmButtonText: "",
      confirmButtonColor: "",
      icon: null,
    };

    switch (type) {
      case "approve":
        dialogConfig.title = "Confirm Approval";
        dialogConfig.message =
          "Are you sure you want to approve this client? They will gain full access to the system.";
        dialogConfig.confirmButtonText = "Approve";
        dialogConfig.confirmButtonColor = "bg-green-600 hover:bg-green-700";
        dialogConfig.icon = (
          <svg
            className="h-6 w-6 text-green-500 mr-2"
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
        );
        break;
      case "reject":
        dialogConfig.title = "Confirm Rejection";
        dialogConfig.message =
          "Are you sure you want to reject this client? They will not be able to access the system until approved again.";
        dialogConfig.confirmButtonText = "Reject";
        dialogConfig.confirmButtonColor = "bg-red-600 hover:bg-red-700";
        dialogConfig.icon = (
          <svg
            className="h-6 w-6 text-red-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
        break;
      case "delete":
        dialogConfig.title = "Confirm Delete";
        dialogConfig.message =
          "Are you sure you want to delete this client? This action cannot be undone.";
        dialogConfig.confirmButtonText = "Delete";
        dialogConfig.confirmButtonColor = "bg-gray-600 hover:bg-gray-700";
        dialogConfig.icon = (
          <svg
            className="h-6 w-6 text-red-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
        break;
      default:
        break;
    }

    setConfirmDialog(dialogConfig);
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setConfirmDialog((prev) => ({ ...prev, show: false }));
  };

  // Handle confirmation action
  const handleConfirmAction = async () => {
    try {
      const type = confirmDialog.type;
      setConfirmDialog((prev) => ({ ...prev, show: false }));

      switch (type) {
        case "approve": {
          const approveResponse = await api.put(
            `/superadmin/clients/approve/${client._id}`
          );
          if (approveResponse.data.success) {
            setClient((prev) => ({ ...prev, status: "approved" }));
            setShowApprovePopup(true);
          }
          break;
        }
        case "reject": {
          const rejectResponse = await api.put(
            `/superadmin/clients/reject/${client._id}`
          );
          if (rejectResponse.data.success) {
            setClient((prev) => ({ ...prev, status: "rejected" }));
          }
          break;
        }
        case "delete": {
          const deleteResponse = await api.delete(
            `/superadmin/clients/${client._id}`
          );
          if (deleteResponse.data.success) {
            setShowDeletePopup(true);
            setTimeout(() => {
              navigate("/superadmin/clients");
            }, 2000);
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          `Failed to perform action. Please try again.`
      );
    }
  };

  // The unified confirmation dialog handles all actions: approve, reject, and delete

  // Popup close handlers
  const closeApprovePopup = () => setShowApprovePopup(false);
  const closeDeletePopup = () => setShowDeletePopup(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const statusConfig = getStatusConfig(client.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up z-10">
            <button
              onClick={cancelConfirmation}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="flex items-center mb-4">
              {confirmDialog.icon}
              <span className="text-lg font-semibold text-gray-900">
                {confirmDialog.title}
              </span>
            </div>
            <div className="text-gray-700 mb-4">{confirmDialog.message}</div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 ${confirmDialog.confirmButtonColor} text-white rounded transition`}
              >
                {confirmDialog.confirmButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Success Popup */}
      {showApprovePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up z-10">
            <button
              onClick={closeApprovePopup}
              className="absolute top-2 right-2 text-gray-400 hover:text-emerald-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="flex items-center mb-2">
              <svg
                className="h-6 w-6 text-emerald-500 mr-2"
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
              <span className="text-lg font-semibold text-emerald-700">
                Success
              </span>
            </div>
            <div className="text-gray-700">
              Client has been approved successfully.
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeApprovePopup}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Success Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up">
            <button
              onClick={closeDeletePopup}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="flex items-center mb-2">
              <svg
                className="h-6 w-6 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-lg font-semibold text-red-700">
                Deleted
              </span>
            </div>
            <div className="text-gray-700">
              Client has been deleted successfully.
            </div>
          </div>
        </div>
      )}
      {/* <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style> */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 bg-white rounded-lg px-4 py-3 shadow-sm">
          <button
            onClick={() => navigate("/superadmin/clients")}
            className="hover:text-green-700 transition-colors font-medium flex items-center gap-1"
          >
            <FaArrowLeft className="w-4 h-4" />
            Clients
          </button>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-semibold">
            {client.name || client.fullName || client.email}
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.name || client.fullName || "Client"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                >
                  <span>{statusConfig.icon}</span>
                  {(client.status || "Unknown").toUpperCase()}
                </span>
              </div>
              <p className="text-lg text-gray-700">{client.email}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {client.status === "pending" && (
                <>
                  <button
                    onClick={() => showConfirmationDialog("approve")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => showConfirmationDialog("reject")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Reject
                  </button>
                </>
              )}
              {client.status === "approved" && (
                <button
                  onClick={() => showConfirmationDialog("reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Reject
                </button>
              )}
              {client.status === "rejected" && (
                <button
                  onClick={() => showConfirmationDialog("approve")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Approve
                </button>
              )}
              {(client.status === "approved" ||
                client.status === "rejected") && (
                <button
                  onClick={() => showConfirmationDialog("delete")}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              )}
              {/* <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Client Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Client Information */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Client Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Company
                    </label>{" "}
                    <p className="text-gray-900">
                      {company ? company.name : client.companyName || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{client.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Joined Date
                    </label>
                    <p className="text-gray-900">
                      {formatDate(
                        client.joinedDate ||
                          client.createdAt ||
                          client.registeredAt
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone
                    </label>
                    <p className="text-gray-900">{client.phone || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Total Tickets
                    </label>
                    <p className="text-xl font-bold text-blue-600">
                      {client.ticketsCount ||
                        (ticketAnalytics && ticketAnalytics.total) ||
                        0}
                    </p>
                  </div>
                </div>
                {(client.approvedBy || client.approvedAt) && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">
                      Approval Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.approvedBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Approved By
                          </label>
                          <p className="text-gray-900">
                            {client.approvedBy.name} ({client.approvedBy.email})
                          </p>
                        </div>
                      )}
                      {client.approvedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Approved At
                          </label>
                          <p className="text-gray-900">
                            {formatDate(client.approvedAt)}
                          </p>
                        </div>
                      )}
                    </div>{" "}
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            {company && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Company Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Company Name
                      </label>
                      <p className="text-gray-900">{company.name || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Contact Email
                      </label>
                      <p className="text-gray-900">
                        {company.contactEmail || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Address
                      </label>
                      <p className="text-gray-900">{company.address || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Registration Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(company.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets List */}
            {ticketAnalytics &&
              ticketAnalytics.tickets &&
              ticketAnalytics.tickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Tickets
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ticket ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Priority
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ticketAnalytics.tickets.map((t) => {
                          const status = getStatusConfig(t.status);
                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm text-blue-600">
                                  #{t.id}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}
                                >
                                  {status.icon} {t.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                    t.priority === "high"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : t.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : t.priority === "low"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                  }`}
                                >
                                  {t.priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-5 space-y-6">
            {ticketAnalytics && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Analytics
                  </h2>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {ticketAnalytics.total}
                    </div>
                    <div className="text-sm text-gray-600">Total Tickets</div>
                  </div>
                  {/* Status Distribution */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Status
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(ticketAnalytics.statusCounts || {}).map(
                        ([status, count]) => {
                          const percentage =
                            ticketAnalytics.total > 0
                              ? (count / ticketAnalytics.total) * 100
                              : 0;
                          return (
                            <div
                              key={status}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-600 capitalize">
                                {status}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                  {/* Priority Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Priority
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(ticketAnalytics.priorityCounts || {}).map(
                        ([priority, count]) => {
                          const percentage =
                            ticketAnalytics.total > 0
                              ? (count / ticketAnalytics.total) * 100
                              : 0;
                          return (
                            <div
                              key={priority}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-600 capitalize">
                                {priority}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-3xl max-h-full bg-white rounded-lg overflow-hidden shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedImage.name}
                </h3>
                <button
                  onClick={closeImagePreview}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimesCircle className="w-5 h-5" />
                </button>
              </div>
              {/* Modal Body */}
              <div className="p-4 max-h-[70vh] overflow-auto">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.name}
                  className="max-w-full max-h-full object-contain mx-auto rounded-lg"
                />
              </div>
              {/* Modal Footer */}
              <div className="flex items-center justify-end p-4 border-t border-gray-200 gap-3">
                <a
                  href={selectedImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <FaDownload className="w-4 h-4 mr-2" />
                  Download
                </a>
                <button
                  onClick={closeImagePreview}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailView;
