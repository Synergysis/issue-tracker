import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Ticket,
  LogOut,
  User,
  Mail,
  Shield,
  ChevronRight,
  Sparkles,
  Building,
} from "lucide-react";
import { io } from "socket.io-client";
import useAuthStore from "../auth/useAuthStore";
import logo from "../assets/logo.png";
import {
  WEBSOCKET_BACKEND_URL,
  createWebSocketConnection,
} from "../api/apiService";

const SuperAdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isReady, setIsReady] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const socketRef = useRef(null);

  const { user, isAuthenticated, logout, initializeAuth, userId } =
    useAuthStore();

  useEffect(() => {
    initializeAuth();
    setIsReady(true);
  }, []);

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
    navigate("/superadmin/tickets"); // Adjust the route as needed
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/superadmin/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      name: "Companies",
      href: "/superadmin/companies",
      icon: Building,
      description: "Manage Companies",
    },
    {
      name: "Clients",
      href: "/superadmin/clients",
      icon: Users,
      description: "Manage Clients",
    },
    {
      name: "All Tickets",
      href: "/superadmin/tickets",
      icon: Ticket,
      description: "Support Tickets",
    },
  ];

  // Show enhanced loading screen
  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <p className="text-emerald-700 text-lg font-semibold">
            Initializing Dashboard...
          </p>
          <p className="text-emerald-600 text-sm">
            Please wait while we load your workspace
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gradient-to-b from-emerald-900 via-green-800 to-emerald-900 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/20 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 -left-8 w-24 h-24 bg-green-400/10 rounded-full blur-lg"></div>
          </div>

          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            {/* <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Super Admin</h2>
                <p className="text-emerald-300 text-xs">Control Panel</p>
              </div>
            </div> */}

            {/* Logo */}
            {/* <div className="flex justify-center py-4 ">
              <Link to="/" className="group">
                <div className="relative">
                  <img src={logo} alt="Logo" className=" bg-amber-50 h-20 " />
                </div>
              </Link>
            </div> */}

            {/* User Info */}
            <div className="bg-gradient-to-r from-emerald-800/50 to-green-800/50 backdrop-blur-sm rounded-2xl p-4 border border-emerald-700/30 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm flex items-center">
                    <span className="truncate">
                      {user.name || "Administrator"}
                    </span>
                    <Sparkles className="w-4 h-4 ml-2 text-emerald-300" />
                  </div>
                  <div className="flex items-center text-emerald-300 text-xs mt-1">
                    <Mail className="w-3 h-3 mr-1" />
                    <span className="truncate">
                      {user.email || "admin@company.com"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
                  Role: {user.role || "Super Administrator"}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2 pt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105"
                        : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 text-emerald-300 group-hover:text-white" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div
                        className={`text-xs ${
                          isActive
                            ? "text-emerald-100"
                            : "text-emerald-400 group-hover:text-emerald-200"
                        } mt-1`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="relative z-10 p-6 border-t border-emerald-700/50">
            <button
              onClick={handleLogout}
              className={`group w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-emerald-200 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500 hover:to-red-600 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:text-white" />
              <div className="flex items-center justify-between w-full">
                <span>Sign Out</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-white/70 backdrop-blur-sm m-4 rounded-2xl shadow-xl border border-emerald-100/50 overflow-y-auto">
            <div className="p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
