// import React, { useState, useRef, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { io } from "socket.io-client";
// import useAuthStore from "../auth/useAuthStore";
// import logo from "../assets/logo.png";

// const Navbar = () => {
//   const { user, logout } = useAuthStore();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [hasNewMessage, setHasNewMessage] = useState(false);
//   const dropdownRef = useRef(null);
//   const socketRef = useRef(null);

//   useEffect(() => {
//     if (user) {
//       const backendUrl = "ws://localhost:5000"; // Replace with your backend WebSocket URL
//       socketRef.current = io(backendUrl);

//       socketRef.current.on("new_chat_message", (message) => {
//         console.log("New chat message received:", message);
//         if (message.clientId === user._id) {
//           setHasNewMessage(true);
//         }
//       });

//       return () => {
//         socketRef.current.disconnect();
//       };
//     }
//   }, [user]);

//   const handleViewChat = () => {
//     setHasNewMessage(false);
//     navigate("/client/tickets"); // Adjust the route as needed
//   };

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Close dropdown when route changes
//   useEffect(() => {
//     setDropdownOpen(false);
//   }, [location.pathname]);

//   if (!user) return null;

//   const isActive = (path) => {
//     return location.pathname === path ? "bg-green-700" : "";
//   };

//   return (
//     <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-md">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex justify-between h-16">
//           <div className="flex items-center space-x-8">
//             <Link to="/" className="flex items-center space-x-2">
//               <img src={logo} alt="Logo" className="h-10" />
//               <span className="font-bold text-white text-xl hidden sm:block">
//                 Issue Tracker
//               </span>
//             </Link>

//             <div className="hidden md:flex items-center space-x-1">
//               <Link
//                 to="/"
//                 className={`${isActive(
//                   "/"
//                 )} px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-green-700 transition duration-150`}
//               >
//                 Dashboard
//               </Link>
//               <Link
//                 to="/tickets"
//                 className={`${isActive(
//                   "/tickets"
//                 )} px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-green-700 transition duration-150`}
//               >
//                 Tickets
//               </Link>
//               {user.role === "admin" && (
//                 <Link
//                   to="/admin"
//                   className={`${isActive(
//                     "/admin"
//                   )} px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-green-700 transition duration-150`}
//                 >
//                   Admin
//                 </Link>
//               )}
//             </div>
//           </div>

//           <div className="flex items-center">
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//                 className="flex items-center space-x-2 text-white bg-green-700 hover:bg-green-800 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
//               >
//                 <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
//                   {user.name
//                     ? user.name.charAt(0).toUpperCase()
//                     : user.email.charAt(0).toUpperCase()}
//                 </div>
//                 <div className="hidden sm:block text-left">
//                   <div className="text-sm font-medium truncate max-w-[100px]">
//                     {user.name || user.email}
//                   </div>
//                   <div className="text-xs text-green-200">{user.role}</div>
//                 </div>
//                 <svg
//                   className={`w-4 h-4 transition-transform ${
//                     dropdownOpen ? "rotate-180" : ""
//                   }`}
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M19 9l-7 7-7-7"
//                   />
//                 </svg>
//               </button>

//               {dropdownOpen && (
//                 <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fadeIn">
//                   <div className="py-1" role="menu">
//                     <Link
//                       to="/profile"
//                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       My Profile
//                     </Link>
//                     <Link
//                       to="/settings"
//                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       Settings
//                     </Link>
//                     <div className="border-t border-gray-100"></div>
//                     <button
//                       onClick={handleLogout}
//                       className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="ml-4">
//               {hasNewMessage && (
//                 <button
//                   onClick={handleViewChat}
//                   className="relative text-gray-700 hover:text-gray-900 focus:outline-none"
//                 >
//                   <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"></span>
//                   <svg
//                     className="h-6 w-6"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
//                     ></path>
//                   </svg>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Mobile navigation - revealed in small screens */}
//         <div className="md:hidden border-t border-green-500 pt-2 pb-3 space-y-1">
//           <Link
//             to="/"
//             className={`${isActive(
//               "/"
//             )} block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700`}
//           >
//             Dashboard
//           </Link>
//           <Link
//             to="/tickets"
//             className={`${isActive(
//               "/tickets"
//             )} block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700`}
//           >
//             Tickets
//           </Link>
//           {user.role === "admin" && (
//             <Link
//               to="/admin"
//               className={`${isActive(
//                 "/admin"
//               )} block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700`}
//             >
//               Admin
//             </Link>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
