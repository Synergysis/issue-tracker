import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiService";
import useAuthStore from "../../auth/useAuthStore";
import { FaCircle } from "react-icons/fa6";

const TicketCreate = () => {
  useEffect(() => {
    document.title = "Create Ticket";
  }, []);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    files: [], // Changed from 'image' to 'files' to match schema
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // Handler to clear form data
  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      category: "general",
      files: [],
    });
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Debug user information
      console.log("TicketCreate - User Object:", user);

      // Validate user authentication - improved check
      if (!user) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      // Use the correct ID field from the user object
      const clientId = user.id || user._id;

      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("priority", formData.priority);
      form.append("category", formData.category);
      form.append("clientId", clientId); // Use the client ID variable defined above

      // Append files if any are selected
      formData.files.forEach((file) => {
        form.append("files", file);
      });

      // Make API call
      const response = await api.post("/client/tickets", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Ticket created successfully:", response.data);
      setSuccess(true);

      // Reset form after success and redirect to tickets view
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          category: "general",
          files: [],
        });
        setSuccess(false);
        // Navigate to ticket list after successful creation
        navigate("/client/tickets");
      }, 2000);
    } catch (error) {
      console.error("Error creating ticket:", error);

      let errorMessage = "Error creating ticket. Please try again.";

      // Handle different error scenarios
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message || "Invalid ticket data provided.";
      } else if (error.response?.status === 413) {
        errorMessage = "File size too large. Please upload smaller files.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "files") {
      // File size validation: max 10MB per file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileArr = Array.from(files);
      const tooLarge = fileArr.find((file) => file.size > maxSize);
      if (tooLarge) {
        setError(
          `File "${tooLarge.name}" is larger than 10MB. Please select smaller files.`
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        files: fileArr,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const removeFile = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove),
    }));
  };

  const priorityColors = {
    low: "text-green-600 bg-green-100 border-green-200",
    medium: "text-yellow-600 bg-yellow-100 border-yellow-200",
    high: "text-orange-600 bg-orange-100 border-orange-200",
    urgent: "text-red-600 bg-red-100 border-red-200",
  };

  const priorityOptions = [
    {
      value: "low",
      label: "Low Priority",
      icon: <FaCircle className="h-4 w-4 text-green-500" />,
    },
    {
      value: "medium",
      label: "Medium Priority",
      icon: <FaCircle className="h-4 w-4 text-yellow-500" />,
    },
    {
      value: "high",
      label: "High Priority",
      icon: <FaCircle className="h-4 w-4 text-orange-500" />,
    },
    {
      value: "urgent",
      label: "Urgent Priority",
      icon: <FaCircle className="h-4 w-4 text-red-500" />,
    },
  ];

  const categoryOptions = [
    {
      value: "general",
      label: "General Support",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-blue-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      value: "technical",
      label: "Technical Issue",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      value: "billing",
      label: "Billing Question",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-green-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      value: "feature",
      label: "Feature Request",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-purple-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
        </svg>
      ),
    },
  ];

  const priorityIcons = {
    low: <FaCircle className="h-4 w-4 mr-1 text-green-500" />,
    medium: <FaCircle className="h-4 w-4 mr-1 text-yellow-500" />,
    high: <FaCircle className="h-4 w-4 mr-1 text-orange-500" />,
    urgent: <FaCircle className="h-4 w-4 mr-1 text-red-500" />,
  };

  const categoryIcons = {
    general: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-blue-500 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    technical: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-500 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    billing: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-green-500 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    feature: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-purple-500 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
      </svg>
    ),
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Popup close handlers
  const closeError = () => setError("");
  const closeSuccess = () => setSuccess(false);

  // Handle priority dropdown
  const handlePrioritySelect = (priority) => {
    setFormData((prev) => ({ ...prev, priority }));
    setPriorityDropdownOpen(false);
  };

  // Handle category dropdown
  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, category }));
    setCategoryDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setPriorityDropdownOpen(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up">
            <button
              onClick={closeSuccess}
              className="absolute top-2 right-2 text-gray-400 hover:text-green-600"
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
              <span className="text-lg font-semibold text-green-700">
                Success
              </span>
            </div>
            <div className="text-gray-700">
              Your ticket has been created successfully. We'll review it
              shortly. Redirecting to your tickets...
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeSuccess}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Tickets
        </h1>
        <p className="text-gray-600">Creat your support tickets.</p>
      </div>
      <div className=" mx-auto">
        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-500 ${
            success ? "opacity-50" : "opacity-100"
          }`}
        >
          <div className="p-8 space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                placeholder="Brief summary of your issue"
                disabled={loading || success}
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Category
                </label>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryDropdownOpen(!categoryDropdownOpen)
                    }
                    className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none transition-all duration-200 text-left"
                    disabled={loading || success}
                  >
                    {
                      categoryOptions.find(
                        (option) => option.value === formData.category
                      )?.label
                    }
                  </button>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <div className="flex items-center">
                      {categoryIcons[formData.category]}
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        categoryDropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {categoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleCategorySelect(option.value)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-200 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="priority"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Priority
                </label>
                <div className="relative" ref={priorityDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setPriorityDropdownOpen(!priorityDropdownOpen)
                    }
                    className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none transition-all duration-200 text-left"
                    disabled={loading || success}
                  >
                    {
                      priorityOptions.find(
                        (option) => option.value === formData.priority
                      )?.label
                    }
                  </button>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <div className="flex items-center">
                      {priorityIcons[formData.priority]}
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        priorityDropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {priorityDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePrioritySelect(option.value)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-200 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${
                      priorityColors[formData.priority]
                    }`}
                  >
                    {priorityIcons[formData.priority]}
                    {formData.priority.charAt(0).toUpperCase() +
                      formData.priority.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all duration-200"
                placeholder="Describe your issue in detail. Include any relevant information that might help us assist you better."
                disabled={loading || success}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label
                htmlFor="files"
                className="block text-sm font-semibold text-gray-700"
              >
                Upload Screenshots / Attachments
              </label>
              <label
                htmlFor="files"
                className="relative block mt-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-6 pt-5 pb-6 text-center transition-all duration-200 hover:border-green-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
              >
                <input
                  type="file"
                  name="files"
                  id="files"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading || success}
                />

                <div className="space-y-1">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m4 0H20"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="flex justify-center text-sm text-gray-600">
                    <span className="font-medium text-green-600 hover:text-green-500">
                      Upload files
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Images, documents or videos up to 10MB each
                  </p>
                </div>
              </label>

              {/* Display selected files, one by one */}
              {formData.files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected files ({formData.files.length}):
                  </h4>
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {formData.files.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between py-3 px-4 bg-white hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center min-w-0">
                          <span className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="object-cover h-10 w-10 rounded"
                                onLoad={(e) =>
                                  URL.revokeObjectURL(e.target.src)
                                }
                              />
                            ) : file.type.startsWith("video/") ? (
                              <video
                                src={URL.createObjectURL(file)}
                                className="object-cover h-10 w-10 rounded"
                                controls
                                onLoadedData={(e) =>
                                  URL.revokeObjectURL(e.target.src)
                                }
                              />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </span>
                          <div className="ml-3 min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-4 flex-shrink-0 p-1 text-gray-400 rounded-full hover:text-red-500 hover:bg-red-50 focus:outline-none focus:bg-red-100 focus:text-red-600 transition-colors duration-200"
                          disabled={loading || success}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                disabled={loading || success}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                    Submitting...
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
                      Create Ticket
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

export default TicketCreate;
