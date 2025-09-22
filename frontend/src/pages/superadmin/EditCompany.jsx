import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../api/apiService";
import { ArrowLeft, Building, Mail, MapPin, AlertCircle } from "lucide-react";

const EditCompany = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
  });

  // Email validation function using regex
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    document.title = "Edit Company";
    const fetchCompany = async () => {
      try {
        const response = await api.get(`/company/${id}`);
        const company = response.data.data;
        setFormData({
          name: company.name || "",
          address: company.address || "",
          email: company.contactEmail || company.email || "",
        });
      } catch (error) {
        console.error("Error fetching company:", error);
        setError("Failed to load company data.");
      } finally {
        setFetching(false);
      }
    };
    fetchCompany();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate email field on change
    if (name === "email") {
      if (!value) {
        setValidationErrors((prev) => ({ ...prev, email: "" }));
      } else if (!validateEmail(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      } else {
        setValidationErrors((prev) => ({ ...prev, email: "" }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation before submission
    if (!validateEmail(formData.email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      setError("Please correct the errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await api.put(`/company/${id}`, {
        name: formData.name,
        address: formData.address,
        email: formData.email,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/superadmin/companies");
      }, 2000);
    } catch (error) {
      let errorMessage = "Failed to update company. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.error || "Invalid company data provided.";
      } else if (error.response?.status === 409) {
        errorMessage =
          error.response.data?.error || "Company name or email already exists.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => setError("");
  const closeSuccess = () => setSuccess(false);

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up">
            <button
              onClick={closeError}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
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
              <span className="text-lg font-semibold text-red-700">Error</span>
            </div>
            <div className="text-gray-700">{error}</div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeError}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Popup */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up">
            <button
              onClick={closeSuccess}
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
              Company has been updated successfully.
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeSuccess}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="mb-8">
        <Link
          to="/superadmin/companies"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Companies
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Company</h1>
        <p className="text-gray-600">Update organization details</p>
      </div>
      <div className="mx-auto">
        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-500 ${
            success ? "opacity-50" : "opacity-100"
          }`}
        >
          <div className="p-8 space-y-8">
            {/* Company Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="Enter company name"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>
            {/* Address */}
            <div className="space-y-2">
              <label
                htmlFor="address"
                className="block text-sm font-semibold text-gray-700"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="Enter company address"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>
            {/* Contact Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Contact Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                    validationErrors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  }`}
                  placeholder="Enter contact email"
                  required
                  disabled={loading || success}
                />
                {validationErrors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>
            {/* Buttons */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/superadmin/companies")}
                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                disabled={loading || success}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  <>
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Save Changes
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default EditCompany;
