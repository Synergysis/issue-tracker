import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "./useAuthStore";
import { clientLogin, adminLogin } from "../api/authAPI";
import background from "../assets/front-view-off-office-desk.jpg";
import logo from "../assets/logo.png";

const Login = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientFormData, setClientFormData] = useState({
    email: "",
    password: "",
  });
  const [adminFormData, setAdminFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClientPassword, setShowClientPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e, userType) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = userType === "client" ? clientFormData : adminFormData;

    try {
      let result;
      // Call appropriate API based on user type
      if (userType === "client") {
        result = await clientLogin(formData);
      } else {
        result = await adminLogin(formData);
      }

      if (result.success) {
        // For client login, use result.client; for admin, use result.user (if present)
        const userObj = userType === "client" ? result.client : result.user;

        // Debug user object structure
        console.log("Login success - User object:", userObj);
        console.log("Login success - Token:", result.token);
        console.log("Login success - Full result:", result);

        // Make sure we have a valid user object with id
        if (!userObj || (!userObj.id && !userObj._id)) {
          setError("Invalid user data received. Please contact support.");
          setLoading(false);
          return;
        }

        const userData = {
          id: userObj.id || userObj._id, // Ensure we have a valid ID
          name: userObj?.name || "Unknown",
          email: userObj?.email || "Unknown",
          company: userObj?.company,
          status: userObj?.status,
          role: userType,
        };

        // Store data in localStorage FIRST
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Update auth store AFTER localStorage
        login(userData, result.token);

        // Double check that auth is properly initialized
        console.log("Login - Store data:", {
          localStorage: JSON.parse(localStorage.getItem("user")),
          token: localStorage.getItem("authToken"),
        });

        // Redirect only for client
        if (userType === "client") {
          navigate("/client/dashboard");
        }
        // No navigation for admin
      } else {
        // Only show error, do not navigate or refresh
        if (result.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else if (result.status === 403) {
          setError("Account is not activated. Please check your email.");
        } else if (result.status === 429) {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    setClientFormData({
      ...clientFormData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleAdminChange = (e) => {
    setAdminFormData({
      ...adminFormData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const resetError = () => {
    setError("");
  };

  const isFormValid = (userType) => {
    const formData = userType === "client" ? clientFormData : adminFormData;
    return formData.email.trim() !== "" && formData.password.trim() !== "";
  };

  return (
    <div className="min-h-screen flex ">
      {/* Left Side - Image Section */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full w-full">
          {/* Main Content */}
          <div className="text-center max-w-md">
            <div className="mb-8">
              <img src={logo} alt="Logo" className="h-20 mx-auto" />
              <h1 className="text-6xl font-bold mb-4">
                SIPMon support portal{" "}
              </h1>
              <p className="text-lg text-green-100 italic">
                "Connecting users, re solving issues, enhancing productivity."
              </p>
              {/* <p className="text-xl text-green-100 leading-relaxed">
                SIPMon support portal bridges the gap between SIPMon tool clients and administrators.
                Empowering users to report issues seamlessly, this platform ensures efficient communication
                and resolution, streamlining workflows and enhancing productivity.
              </p> */}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Right Side - Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Please sign in to your account</p>
          </div>

          {/* Tab Navigation */}
          {/* <div className="relative">
            <div className="flex rounded-xl bg-gray-100 p-1 relative">
              <div
                className={`absolute top-1 bottom-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg transition-all duration-300 ${
                  activeTab === "client"
                    ? "left-1 right-1/2 mr-0.5"
                    : "right-1 left-1/2 ml-0.5"
                }`}
              ></div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("client");
                  resetError();
                }}
                className={`relative flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors z-10 ${
                  activeTab === "client"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Client Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("admin");
                  resetError();
                }}
                className={`relative flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors z-10 ${
                  activeTab === "admin"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Admin Login
              </button>
            </div>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-shake">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Client Login Form */}
          {activeTab === "client" && (
            <form
              className="space-y-6 animate-fadeIn"
              onSubmit={(e) => handleSubmit(e, "client")}
            >
              <div className="space-y-4">
                <div className="group">
                  <label
                    htmlFor="client-email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="client-email"
                      name="email"
                      type="email"
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                      placeholder="Enter your email"
                      value={clientFormData.email}
                      onChange={handleClientChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="client-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="client-password"
                      name="password"
                      type={showClientPassword ? "text" : "password"}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                      placeholder="Enter your password"
                      value={clientFormData.password}
                      onChange={handleClientChange}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 focus:outline-none"
                      onClick={() => setShowClientPassword((prev) => !prev)}
                      aria-label={
                        showClientPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showClientPassword ? (
                        <FaEye className="w-5 h-5" />
                      ) : (
                        <FaEyeSlash className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid("client")}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in as Client
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/register"
                  className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
                >
                  Don't have an account? Register here
                </Link>
              </div>
              <div className="text-center mt-2">
                <Link
                  to="/client/password-reset"
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === "admin" && (
            <form
              className="space-y-6 animate-fadeIn"
              onSubmit={(e) => handleSubmit(e, "admin")}
            >
              <div className="space-y-4">
                <div className="group">
                  <label
                    htmlFor="admin-email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                      placeholder="Enter admin email"
                      value={adminFormData.email}
                      onChange={handleAdminChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      name="password"
                      type={showAdminPassword ? "text" : "password"}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                      placeholder="Enter admin password"
                      value={adminFormData.password}
                      onChange={handleAdminChange}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 focus:outline-none"
                      onClick={() => setShowAdminPassword((prev) => !prev)}
                      aria-label={
                        showAdminPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showAdminPassword ? (
                        <FaEyeSlash className="w-5 h-5" />
                      ) : (
                        <FaEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid("admin")}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Sign in as Admin
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                  <svg
                    className="w-4 h-4 inline mr-2 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Admin access only - Contact system administrator for
                  credentials
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
