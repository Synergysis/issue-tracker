// api/apiService.js
import axios from "axios";
import { io } from "socket.io-client";

// Helper to get backend URL from env
export function getBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${getBackendUrl()}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (error.response?.status === 500) {
      console.error("Server error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

// WebSocket API helper
export const createWebSocketConnection = (url, options = {}) => {
  // For socket.io, we should use the HTTP URL, not WebSocket URL (ws://)
  // Socket.io will handle the protocol switching internally
  const socket = io(url, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    ...options
  });

  socket.on("connect", () => {
    console.log("WebSocket connected");
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  return socket;
};

// Centralized WebSocket backend URL - for socket.io we use the HTTP URL
export const WEBSOCKET_BACKEND_URL = getBackendUrl();

export default api;
