const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set storage engine for chat assets
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let clientId = null;
    // Try to get clientId from auth middleware (should be set if auth runs before multer)
    if (req.clientUser && req.clientUser._id) {
      clientId = req.clientUser._id.toString();
    } else if (req.superAdminUser) {
      // If admin, get clientId from ticket in DB
      try {
        const mongoose = require("mongoose");
        const Ticket = require("../models/ticketmodel");
        const ticketId = req.params.ticketId || (req.body && req.body.ticketId);
        if (ticketId && mongoose.Types.ObjectId.isValid(ticketId)) {
          const ticket = await Ticket.findById(ticketId).select("clientId");
          if (ticket && ticket.clientId) {
            clientId = ticket.clientId.toString();
          }
        }
      } catch (e) {}
    } else if (req.body && req.body.clientId) {
      clientId = req.body.clientId;
    }
    // Fallback: try to extract clientId from Authorization header (JWT) if not set
    if (!clientId && req.headers && req.headers.authorization) {
      try {
        const jwt = require("jsonwebtoken");
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) clientId = decoded.id;
      } catch (e) {}
    }
    // Always get ticketId from params
    const ticketId = req.params.ticketId || (req.body && req.body.ticketId);
    if (!clientId || !ticketId) {
      return cb(new Error("Client ID or Ticket ID not found in request"), null);
    }
    const chatDir = path.join(__dirname, "../uploads", clientId, ticketId);
    if (!fs.existsSync(chatDir)) {
      fs.mkdirSync(chatDir, { recursive: true });
    }
    cb(null, chatDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// File filter for images, videos, docs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

module.exports = upload;
