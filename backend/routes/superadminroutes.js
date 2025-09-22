const express = require("express");
const router = express.Router();

const {
  register,
  login,
  updateProfile,
  getProfile,
} = require("../controllers/superadmincontroller");

const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require("../controllers/companycontroller");

const {
  getAllClients,
  approveClient,
  rejectClient,
  deleteClient,
  getClientById,
  searchClients,
} = require("../controllers/clientcontroller");

// Import ticket controller functions
const {
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  resolveTicket,
  getTicketStats,
  bulkUpdateTickets,
  searchTickets,
} = require("../controllers/superadminticketcontroller");

// Import analytics controller functions
const {
  getDashboardAnalytics,
  getActivityFeed,
  getTicketTrends,
  getCategoryAnalytics,
  getClientAnalytics,
} = require("../controllers/superadminanalyticscontroller");

const authMiddleware = require("../middleware/authMiddleware");

const auth =
  authMiddleware.auth ||
  authMiddleware.protect ||
  authMiddleware.authenticateToken ||
  authMiddleware.verifyToken ||
  authMiddleware;

// Authentication routes
router.post("/register", register);
router.post("/login", login);

// Client management routes
router.get("/clients/search", auth, searchClients);
router.get("/clients", auth, getAllClients);
router.put("/clients/approve/:id", auth, approveClient);
router.put("/clients/reject/:id", auth, rejectClient);
router.delete("/clients/:id", auth, deleteClient);
router.get("/clients/:id", auth, getClientById);

// Ticket management routes
router.get("/tickets/search", auth, searchTickets);
router.get("/tickets", auth, getAllTickets);
router.get("/tickets/stats", auth, getTicketStats);
router.get("/tickets/:id", auth, getTicketById);
router.put("/tickets/:id", auth, updateTicket);
router.put("/tickets/:id/resolve", auth, resolveTicket);
router.put("/tickets/bulk-update", auth, bulkUpdateTickets);
router.delete("/tickets/:id", auth, deleteTicket);

// Analytics routes
router.get("/analytics/dashboard", auth, getDashboardAnalytics);
router.get("/analytics/activity", auth, getActivityFeed);
router.get("/analytics/trends", auth, getTicketTrends);
router.get("/analytics/categories", auth, getCategoryAnalytics);
router.get("/analytics/clients", auth, getClientAnalytics);

// Company management routes (using companycontroller.js only)
router.post("/companies", auth, createCompany);
router.get("/companies", auth, getCompanies);
router.get("/companies/:id", auth, getCompanyById);
router.put("/companies/:id", auth, updateCompany);
router.delete("/companies/:id", auth, deleteCompany);

module.exports = router;
