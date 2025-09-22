const TicketChat = require("../models/ticketchatmodel");
const Ticket = require("../models/ticketmodel");
const Client = require("../models/clientmodel");
const { SuperAdmin } = require("../models/superadminmodel");

// @desc    Get all chat messages for a ticket
// @route   GET /api/tickets/:ticketId/chat
// @access  Private (ticket owner, client, superadmin)
exports.getTicketChat = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const messages = await TicketChat.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate("sender", "_id name email company")
      .lean();
    // Add assetUrl to each attachment for preview in frontend
    const baseUrl = req.protocol + "://" + req.get("host");
    const path = require("path");
    const uploadsDir = path
      .resolve(__dirname, "../uploads")
      .replace(/\\/g, "/");
    const messagesWithAssetUrls = messages.map((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments = msg.attachments.map((att) => {
          let assetUrl;
          if (att.path) {
            // Normalize path to use forward slashes
            const normalizedPath = att.path.replace(/\\/g, "/");
            // Find the index of '/uploads/' in the normalized path
            const uploadsIdx = normalizedPath.indexOf("/uploads/");
            let relativePath;
            if (uploadsIdx !== -1) {
              relativePath = normalizedPath.slice(uploadsIdx);
            } else {
              // Fallback: try to get path relative to uploadsDir
              const rel = path
                .relative(uploadsDir, normalizedPath)
                .replace(/\\/g, "/");
              relativePath = "/uploads/" + rel;
            }
            assetUrl = `${baseUrl}${
              relativePath.startsWith("/") ? "" : "/"
            }${relativePath}`;
          }
          return {
            ...att,
            assetUrl,
          };
        });
      }
      return msg;
    });
    res.json({ success: true, data: messagesWithAssetUrls });
  } catch (err) {
    console.error("Get ticket chat error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Post a new chat message to a ticket
// @route   POST /api/tickets/:ticketId/chat
// @access  Private (ticket owner, client, superadmin)
exports.postTicketChat = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    let sender, senderModel;
    // Debug logging for authentication
    console.log("TicketChat POST: req.clientUser:", req.clientUser);
    console.log("TicketChat POST: req.superAdminUser:", req.superAdminUser);
    if (req.clientUser) {
      sender = req.clientUser._id;
      senderModel = "Client";
    } else if (req.superAdminUser) {
      sender = req.superAdminUser._id; // Always use _id for Mongoose docs
      senderModel = "SuperAdmin";
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    if (!sender) {
      return res
        .status(400)
        .json({ success: false, message: "Sender is missing (auth error)" });
    }
    // Message is required only if no files are uploaded
    if (
      (!message || !message.trim()) &&
      (!req.files || req.files.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Message or at least one file is required",
      });
    }
    // Extra debug logs
    console.log("TicketChat POST: Object.keys(req):", Object.keys(req));
    console.log("TicketChat POST: req.body:", req.body);
    console.log("TicketChat POST: req.params:", req.params);
    // Log sender and type before create
    console.log(
      "TicketChat POST: sender:",
      sender,
      "typeof sender:",
      typeof sender,
      "senderModel:",
      senderModel
    );
    // Ensure sender is a valid ObjectId
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(sender)) {
      return res.status(400).json({
        success: false,
        message: "Sender is not a valid ObjectId",
        sender,
        senderType: typeof sender,
      });
    }
    sender = new mongoose.Types.ObjectId(sender);
    // Prepare attachments array from uploaded files
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path.replace(/\\/g, "/"), // Normalize for Windows
        uploadedAt: new Date(),
      }));
    }
    const chat = await TicketChat.create({
      ticketId,
      sender,
      senderModel,
      message: message.trim(),
      attachments,
    });
    await chat.populate("sender", "_id name email company");
    // Add url field to each attachment for preview in frontend (full server URL, always correct for Windows)
    // Overwrite the 'path' field to be the correct server asset path (relative to /uploads/...)
    if (chat.attachments && chat.attachments.length > 0) {
      const baseUrl = req.protocol + "://" + req.get("host");
      chat.attachments = chat.attachments.map((att) => {
        let url = null;
        let pathField = att.path;
        if (att.path) {
          // Always extract the path after the first 'uploads/' (case-insensitive)
          const normalized = att.path.replace(/\\/g, "/");
          const match = normalized.match(/uploads\/(.+)$/i);
          if (match) {
            url = `${baseUrl}/uploads/${match[1]}`;
            pathField = `/uploads/${match[1]}`;
          }
        }
        return {
          ...att,
          url,
          path: pathField, // overwrite path to be relative
        };
      });
    }
    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    console.error("Post ticket chat error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
