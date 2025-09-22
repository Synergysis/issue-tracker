import React, { useState } from "react";
import { Form, Input, Button, Alert, message, Card, Typography } from "antd";
import {
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  requestClientPasswordReset,
  resetClientPassword,
} from "../api/authAPI";
import { useNavigate, Link } from "react-router-dom";
import background from "../assets/front-view-off-office-desk.jpg";

const { Title, Text } = Typography;

const ClientPasswordReset = () => {
  const [step, setStep] = useState(1); // 1: request OTP, 2: reset password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await requestClientPasswordReset(email);
      if (res.success) {
        message.success(res.message || "OTP sent to your email.");
        setStep(2);
      } else {
        setError(res.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await resetClientPassword(email, otp, newPassword);
      if (res.success) {
        message.success(res.message || "Password reset successful.");
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        // Navigate to login after success
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setError(res.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Section (Hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full w-full">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <SafetyCertificateOutlined
                style={{ fontSize: 64, color: "#90EE90" }}
              />
              <h1 className="text-6xl font-bold mb-4">Password Reset</h1>
              <p className="text-xl text-green-100 leading-relaxed">
                Secure account recovery system for our issue tracker platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                <SafetyCertificateOutlined className="text-white text-3xl" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? "Account Recovery" : "Reset Password"}
            </h2>
            <p className="text-gray-600">
              {step === 1
                ? "Enter your email to receive a one-time password"
                : "Enter the OTP sent to your email"}
            </p>
          </div>

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

          {/* Step 1: Request OTP Form */}
          {step === 1 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fadeIn">
              <Form layout="vertical" onFinish={handleRequestOtp}>
                <div className="space-y-4">
                  <div className="group">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <MailOutlined className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full mt-6 flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <KeyOutlined className="ml-2" />
                    </>
                  )}
                </button>
              </Form>
            </div>
          ) : (
            // Step 2: Reset Password Form
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fadeIn">
              <Form layout="vertical" onFinish={handleResetPassword}>
                <div className="space-y-4">
                  <div className="group">
                    <label
                      htmlFor="email-display"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email-display"
                      type="text"
                      value={email}
                      disabled
                      className="block w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Verification Code
                    </label>
                    <div className="relative">
                      <input
                        id="otp"
                        type="text"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                        placeholder="Enter the OTP from your email"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <KeyOutlined className="text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type="password"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400"
                        placeholder="Create a new secure password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <LockOutlined className="text-gray-400" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 6 characters
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp || !newPassword}
                  className="w-full mt-6 flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
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
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
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

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full mt-3 flex justify-center items-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <ArrowLeftOutlined className="mr-2" />
                  Back to Request OTP
                </button>
              </Form>
            </div>
          )}

          {/* Footer navigation */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
            >
              Return to Login
            </Link>
          </div>
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

export default ClientPasswordReset;
