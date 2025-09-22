import { create } from "zustand";

// Helper function to get user from localStorage
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

// Helper function to get token from localStorage
const getTokenFromStorage = () => {
  try {
    return localStorage.getItem("authToken");
  } catch (error) {
    console.error("Error getting token from localStorage:", error);
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getUserFromStorage(),
  token: getTokenFromStorage(),
  isAuthenticated: !!(getTokenFromStorage() && getUserFromStorage()),

  login: (userData, token) => {
    // Store both token and user data
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));

    // console.log("Login - storing user data:", userData);
    // console.log("Login - storing token:", token);

    set({
      user: userData,
      token: token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    // Remove both token and user data
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData });
  },

  // Helper method to initialize auth state from localStorage
  initializeAuth: () => {
    const token = getTokenFromStorage();
    const user = getUserFromStorage();

    // console.log("Initialize Auth - token:", token);
    // console.log("Initialize Auth - user:", user);

    set({
      user: user,
      token: token,
      isAuthenticated: !!(token && user),
    });
  },

  // Helper method to refresh user data
  refreshUser: () => {
    const user = getUserFromStorage();
    // console.log("Refresh User - user data:", user);
    set({ user });
    return user;
  },
}));

export default useAuthStore;
