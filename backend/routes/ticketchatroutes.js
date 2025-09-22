const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const auth = authMiddleware.auth || authMiddleware.protect || authMiddleware;
const {
  getTicketChat,
  postTicketChat,
} = require("../controllers/ticketchatcontroller");
const chatUpload = require("../middleware/chatUpload");

// Get all chat messages for a ticket
router.get("/tickets/:ticketId/chat", auth, getTicketChat);
// Post a new chat message to a ticket
router.post(
  "/tickets/:ticketId/chat",
  auth,
  chatUpload.array("files", 10),
  postTicketChat
);

module.exports = router;
