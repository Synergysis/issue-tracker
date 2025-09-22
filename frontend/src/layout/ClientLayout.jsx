import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../auth/useAuthStore";
import logo from "../assets/logo.png"; // Adjust path if needed
import {
  WEBSOCKET_BACKEND_URL,
  createWebSocketConnection,
} from "../api/apiService";

const ClientLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Start with sidebar collapsed on mobile
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    initializeAuth();
    setIsReady(true);
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      socketRef.current = createWebSocketConnection(WEBSOCKET_BACKEND_URL);

      socketRef.current.on("new_chat_message", (message) => {
        console.log("New chat message received:", message);
        if (message.clientId === user._id) {
          setHasNewMessage(true);
        }
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  const handleViewChat = () => {
    setHasNewMessage(false);
    navigate("/client/tickets"); // Adjust the route as needed
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/client/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Create Ticket",
      href: "/client/create-ticket",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: "View Tickets",
      href: "/client/tickets",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: "/client/profile",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  // Show loading indicator while initializing auth state
  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-4"></div>
          <p className="text-green-700 text-lg font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  // Debug the user object structure to help diagnose issues
  console.log("ClientLayout - User Object:", user);
  console.log("ClientLayout - Auth status:", isAuthenticated);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header for mobile view */}
      <div className="lg:hidden bg-white shadow-sm border-b border-green-100 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold text-green-800">
            Issue Tracker
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-2 text-gray-700 hover:bg-green-100"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - responsive */}
        <div
          className={`${
            collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
          } lg:block fixed lg:static inset-y-0 left-0 z-40 lg:z-0 w-64 
          bg-white shadow-lg flex flex-col justify-between border-r border-green-200
          transition-transform duration-300 ease-in-out transform lg:transform-none`}
        >
          {/* Close button for mobile */}
          <button
            onClick={() => setCollapsed(true)}
            className="lg:hidden absolute right-3 top-3 p-2 rounded-full bg-green-100 text-green-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col h-full">
            <div className="overflow-y-auto flex-1">
              <div className="p-4 space-y-6">
                {/* Logo - hidden on mobile since it's in the header */}
                <div className="hidden lg:flex justify-center py-4">
                  <Link to="/" className="flex flex-col items-center space-y-1">
                    <img src={logo} alt="Logo" className="h-16" />
                  </Link>
                </div>

                {/* User Info with avatar */}
                {/* <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 shadow-inner">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-green-200 border-2 border-green-300 flex items-center justify-center text-green-800 text-xl font-bold shadow-md">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-900">
                        {user.name || "Not Available"}
                      </div>
                      <div className="text-xs text-green-700 break-all mt-1 bg-white bg-opacity-50 rounded-full px-3 py-1">
                        {user.email || "Not Available"}
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* Navigation Links */}
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setCollapsed(true)} // Close sidebar on mobile when nav item is clicked
                        className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                          ${
                            isActive
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                              : "text-gray-700 hover:bg-green-100"
                          }`}
                      >
                        <span
                          className={`mr-3 ${
                            isActive ? "text-white" : "text-green-600"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {item.name}
                        {isActive && (
                          <span className="ml-auto">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Footer with Logout Button */}
            <div className="p-4 border-t border-green-100 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium
                  bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600
                  transition-colors shadow-sm hover:shadow"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log Out
              </button>
              <div className="text-xs text-gray-500 text-center mt-4">
                &copy; {new Date().getFullYear()} Issue Tracker
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-100">
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-transparent z-20"
          onClick={() => setCollapsed(true)}
        ></div>
      )}

      {hasNewMessage && (
        <button
          onClick={handleViewChat}
          className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg"
        >
          New Message
        </button>
      )}
    </div>
  );
};

export default ClientLayout;
