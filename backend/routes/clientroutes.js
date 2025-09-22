const express = require("express");
const {
  register,
  login,
  updateProfile,
  getProfile,
  requestPasswordReset,
  resetPasswordWithOtp,
} = require("../controllers/clientcontroller");
const {
  createTicket,
  getClientTickets,
  getTicketById,
  updateTicket,
  getClientDashboard,
  deleteTicket,
  getTicketStats,
  closeTicket,
  cancelTicket,
} = require("../controllers/ticketcontroller");
const upload = require("../middleware/ticketUpload");

// Try different ways to import auth middleware
const authMiddleware = require("../middleware/authMiddleware");
// If auth is exported as an object with a property, use one of these:
const auth = authMiddleware.auth || authMiddleware.protect || authMiddleware;

const router = express.Router();

// Authentication routes
router.post("/register", register);
router.post("/login", login);

// Password reset routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPasswordWithOtp);

// Dashboard route (protected)
router.get("/dashboard", auth, getClientDashboard);

// Profile view and update routes (protected)
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

// Ticket routes (protected)
// Allow up to 20 files per ticket (images, videos, docs, etc.)
router.post("/tickets", auth, upload.array("files", 20), createTicket);
// Add pagination support to GET /tickets
router.get("/tickets", auth, getClientTickets);
router.get("/tickets/stats", auth, getTicketStats);
router.get("/tickets/:id", auth, getTicketById);
router.put("/tickets/:id", auth, updateTicket);
router.delete("/tickets/:id", auth, deleteTicket);
// Add routes for closing and canceling tickets
router.put("/tickets/:id/close", auth, closeTicket);
router.put("/tickets/:id/cancel", auth, cancelTicket);

module.exports = router;
