import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { message, Typography, Progress } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  // ShieldCheckOutlined,
} from "@ant-design/icons";
import logo from "../assets/logo.png";
import background from "../assets/front-view-off-office-desk.jpg";
import api from "../api/apiService";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const ClientRegister = () => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    setSubmitError("");

    try {
      // Prepare registration data as required by the API
      const registrationData = {
        companyId: values.company?.trim() || "",
        name: values.name?.trim() || "",
        email: values.email?.trim() || "",
        password: values.password || "",
        phone: values.phone?.trim() || undefined,
      };

      // Call the real API endpoint for client registration
      const response = await api.post("/client/register", registrationData);

      // Show popup with API message
      setSuccessMessage(response.data?.message || "Registration successful!");
      setSuccess(true);
      // Remove form.resetFields(); because 'form' is not defined for plain HTML forms
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    const checks = [
      password.length >= 6,
      /(?=.*[a-z])/.test(password),
      /(?=.*[A-Z])/.test(password),
      /(?=.*\d)/.test(password),
      /(?=.*[@$!%*?&])/.test(password),
    ];
    strength = (checks.filter(Boolean).length / checks.length) * 100;
    return Math.round(strength);
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
    // Check match if confirmPassword is not empty
    if (confirmPassword && pwd !== confirmPassword) {
      setPasswordMatchError("Passwords do not match");
    } else {
      setPasswordMatchError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const cpwd = e.target.value;
    setConfirmPassword(cpwd);
    if (password && cpwd !== password) {
      setPasswordMatchError("Passwords do not match");
    } else {
      setPasswordMatchError("");
    }
  };

  const getStrengthColor = (strength) => {
    if (strength < 30) return "#ff4d4f";
    if (strength < 60) return "#faad14";
    if (strength < 80) return "#1890ff";
    return "#52c41a";
  };

  const getStrengthText = (strength) => {
    if (strength < 30) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    if (strength < 90) return "Strong";
    return "Very Strong";
  };

  // Add this function to handle plain HTML form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match");
      return;
    }
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());
    handleSubmit(values);
  };

  return (
    <div className="min-h-screen flex ">
      {/* Success Popup */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in-up">
            <button
              onClick={() => {
                setSuccess(false);
                navigate("/login");
              }}
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
            <div className="text-gray-700 whitespace-pre-line">
              {successMessage}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSuccess(false);
                  navigate("/login");
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Image Section */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full w-full">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <img src={logo} alt="Logo" className="h-20 mx-auto" />
              <h1 className="text-6xl font-bold mb-4">Register</h1>
              <p className="text-xl text-green-100 leading-relaxed">
                Join thousands of clients who trust us to manage and resolve
                their issues efficiently
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <SafetyCertificateOutlined className="text-white text-3xl" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Please fill in your details to get started
            </p>
          </div>

          {submitError && (
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
                <span className="text-sm">{submitError}</span>
              </div>
            </div>
          )}

          <form
            className="space-y-5 animate-fadeIn"
            onSubmit={handleFormSubmit}
          >
            <div className="space-y-4">
              <div className="group">
                <label
                  htmlFor="register-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserOutlined className="text-gray-400" />
                  </div>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="group">
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailOutlined className="text-gray-400" />
                  </div>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label
                    htmlFor="register-company"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BankOutlined className="text-gray-400" />
                    </div>
                    <input
                      id="register-company"
                      name="company"
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                      placeholder="Your organization"
                      autoComplete="organization"
                    />
                  </div>
                </div>
                <div className="group">
                  <label
                    htmlFor="register-phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneOutlined className="text-gray-400" />
                    </div>
                    <input
                      id="register-phone"
                      name="phone"
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                      placeholder="Your phone number"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
              <div className="group">
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <LockOutlined className="text-gray-400" />
                  </span>
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                {passwordStrength > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">
                        Password strength:
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: getStrengthColor(passwordStrength) }}
                      >
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div>
                      <Progress
                        percent={passwordStrength}
                        showInfo={false}
                        strokeColor={getStrengthColor(passwordStrength)}
                        trailColor="#e5e7eb"
                        size="small"
                        style={{ borderRadius: 999, height: 6 }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="group">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <LockOutlined className="text-gray-400" />
                  </span>
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 bg-gray-50"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 focus:outline-none"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                {passwordMatchError && (
                  <div className="text-xs text-red-600 mt-1">
                    {passwordMatchError}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  loading || !!passwordMatchError || passwordStrength < 80
                }
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-md"
              >
                {loading ? (
                  <span className="flex items-center">
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
                    Creating Your Account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create Account
                    <UserOutlined className="ml-2" />
                  </span>
                )}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
                >
                  Sign in here
                </a>
              </p>
              <p className="text-gray-600">
                Forgot your password?{" "}
                <a
                  href="/client/password-reset"
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                >
                  Reset it here
                </a>
              </p>
            </div>

            <p className="text-xs text-center text-gray-500 mt-6">
              By registering, you agree to our{" "}
              <a href="/terms" className="underline hover:text-gray-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-gray-700">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>

      <style>{`
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
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ClientRegister;
