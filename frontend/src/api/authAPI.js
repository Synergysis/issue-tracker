// api/authAPI.js
import api from "./apiService";

// Authentication API endpoints
const AUTH_ENDPOINTS = {
  CLIENT_LOGIN: "/auth/client/login",
  ADMIN_LOGIN: "/auth/admin/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH_TOKEN: "/auth/refresh",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",
};

// Updated Client login function
export const clientLogin = async (credentials) => {
  try {
    const response = await api.post("/client/login", {
      email: credentials.email,
      password: credentials.password,
    });

    // Pass through the original client object directly
    return {
      success: response.data.success,
      message: response.data.message,
      client: response.data.client, // Use the client object directly
      token: response.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.msg || "Client login failed",
      status: error.response?.status,
    };
  }
};

// Updated Admin login function (for Superadmin)
export const adminLogin = async (credentials) => {
  try {
    const response = await api.post("/superadmin/login", {
      email: credentials.email,
      password: credentials.password,
    });

    return {
      success: response.data.success,
      message: response.data.msg,
      user: {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      },
      token: response.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.msg || "Admin login failed",
      status: error.response?.status,
    };
  }
};

// Register function
export const registerUser = async (userData) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
    });

    return {
      success: true,
      data: response.data,
      message: response.data.message || "Registration successful",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Registration failed",
      status: error.response?.status,
    };
  }
};

// Logout function
export const logoutUser = async () => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.LOGOUT);

    // Clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    return {
      success: true,
      message: response.data.message || "Logout successful",
    };
  } catch (error) {
    // Even if API call fails, clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    return {
      success: false,
      error: error.response?.data?.message || "Logout failed",
    };
  }
};

// Refresh token function
export const refreshToken = async () => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN);

    return {
      success: true,
      token: response.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Token refresh failed",
    };
  }
};

// Forgot password function
export const forgotPassword = async (email) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      email: email,
    });

    return {
      success: true,
      message: response.data.message || "Password reset email sent",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to send reset email",
    };
  }
};

// Reset password function
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token: token,
      password: newPassword,
    });

    return {
      success: true,
      message: response.data.message || "Password reset successful",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Password reset failed",
    };
  }
};

// Verify email function
export const verifyEmail = async (token) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.VERIFY_EMAIL, {
      token: token,
    });

    return {
      success: true,
      message: response.data.message || "Email verified successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Email verification failed",
    };
  }
};

// Request OTP for client password reset
export const requestClientPasswordReset = async (email) => {
  try {
    const response = await api.post("/client/request-password-reset", {
      email,
    });
    return {
      success: true,
      message: response.data.message || "OTP sent to your email.",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to send OTP.",
    };
  }
};

// Reset client password with OTP
export const resetClientPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post("/client/reset-password", {
      email,
      otp,
      newPassword,
    });
    return {
      success: true,
      message: response.data.message || "Password reset successful.",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to reset password.",
    };
  }
};
