const jwt = require("jsonwebtoken");
const Client = require("../models/clientmodel");
const { SuperAdmin } = require("../models/superadminmodel");

class WebSocketAuthMiddleware {
  /**
   * Authenticate a WebSocket connection using JWT token
   * @param {string} token - JWT token
   * @returns {Promise<{user: Object, userType: string}>}
   */
  static async authenticateSocket(token) {
    try {
      if (!token) {
        throw new Error("No token provided");
      }

      // Remove Bearer prefix if present
      const cleanToken = token.replace("Bearer ", "");

      // Verify JWT token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

      if (!decoded.id) {
        throw new Error("Invalid token format");
      }

      let user, userType;

      // Try to find user in Client collection first
      user = await Client.findById(decoded.id).select("-password");
      console.log("Authenticated user:", user);
      if (user) {
        userType = "Client";
      } else {
        // Try SuperAdmin collection
        user = await SuperAdmin.findById(decoded.id).select("-password");
        if (user) {
          userType = "SuperAdmin";
        }
      }

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user is active (if you have such field)
      if (
        (userType === "Client" && user.status && user.status !== "approved") ||
        (userType === "SuperAdmin" && user.status && user.status !== "active")
      ) {
        throw new Error("User account is inactive");
      }

      return {
        user: {
          _id: user._id,
          id: user._id, // For backward compatibility
          name: user.name,
          email: user.email,
          company: user.company, // For clients
          userType: userType,
        },
        userType,
        rawUser: user,
      };
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      } else if (error.name === "TokenExpiredError") {
        throw new Error("Token expired");
      } else {
        throw error;
      }
    }
  }

  /**
   * Verify if user has access to a specific ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} userId - User ID
   * @param {string} userType - User type (Client/SuperAdmin)
   * @returns {Promise<Object>} - Ticket object if accessible
   */
  static async verifyTicketAccess(ticketId, userId, userType) {
    try {
      const Ticket = require("../models/ticketmodel");
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      // SuperAdmins can access all tickets
      if (userType === "SuperAdmin") {
        return ticket;
      }

      // Clients can only access their own tickets
      if (userType === "Client" && ticket.clientId.toString() === userId) {
        return ticket;
      }

      throw new Error("Access denied to this ticket");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a middleware function for Express routes (fallback)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async expressMiddleware(req, res, next) {
    try {
      const token = req.header("Authorization");
      const authData = await WebSocketAuthMiddleware.authenticateSocket(token);

      if (authData.userType === "Client") {
        req.clientUser = authData.rawUser;
      } else if (authData.userType === "SuperAdmin") {
        req.superAdminUser = authData.rawUser;
      }

      req.user = authData.user;
      req.userType = authData.userType;

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Validate message data
   * @param {Object} messageData - Message data to validate
   * @returns {Object} - Validated message data
   */
  static validateMessageData(messageData) {
    const { message, attachments = [] } = messageData;

    // Validate message content
    if (message && typeof message !== "string") {
      throw new Error("Message must be a string");
    }

    // Validate that either message or attachments exist
    if ((!message || !message.trim()) && attachments.length === 0) {
      throw new Error("Message or at least one file is required");
    }

    // Validate attachments
    if (attachments && !Array.isArray(attachments)) {
      throw new Error("Attachments must be an array");
    }

    // Validate each attachment
    attachments.forEach((attachment, index) => {
      if (typeof attachment !== "object") {
        throw new Error(`Attachment ${index} must be an object`);
      }

      const { name, type, data } = attachment;

      if (!name || typeof name !== "string") {
        throw new Error(`Attachment ${index} must have a valid name`);
      }

      if (!type || typeof type !== "string") {
        throw new Error(`Attachment ${index} must have a valid MIME type`);
      }

      if (!data || typeof data !== "string") {
        throw new Error(`Attachment ${index} must have valid base64 data`);
      }

      // Validate base64 format
      try {
        const buffer = Buffer.from(data, "base64");
        if (buffer.length === 0) {
          throw new Error(`Attachment ${index} has invalid base64 data`);
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (buffer.length > maxSize) {
          throw new Error(`Attachment ${index} exceeds maximum size of 10MB`);
        }
      } catch (error) {
        throw new Error(
          `Attachment ${index} has invalid base64 data: ${error.message}`
        );
      }
    });

    return {
      message: message ? message.trim() : "",
      attachments,
    };
  }

  /**
   * Sanitize message content to prevent XSS
   * @param {string} message - Message content
   * @returns {string} - Sanitized message
   */
  static sanitizeMessage(message) {
    if (!message) return "";

    // Basic HTML escape
    return message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Rate limiting for WebSocket events
   */
  static createRateLimiter() {
    const limits = new Map(); // socketId -> { lastAction: timestamp, count: number }
    const WINDOW_MS = 60000; // 1 minute
    const MAX_REQUESTS = 100; // max requests per minute

    return {
      checkLimit: (socketId) => {
        const now = Date.now();
        const userLimit = limits.get(socketId) || { lastAction: now, count: 0 };

        // Reset count if window has passed
        if (now - userLimit.lastAction > WINDOW_MS) {
          userLimit.count = 0;
          userLimit.lastAction = now;
        }

        userLimit.count++;
        limits.set(socketId, userLimit);

        if (userLimit.count > MAX_REQUESTS) {
          throw new Error("Rate limit exceeded. Please slow down.");
        }

        return true;
      },

      cleanup: () => {
        // Clean up old entries
        const now = Date.now();
        for (const [socketId, data] of limits.entries()) {
          if (now - data.lastAction > WINDOW_MS * 2) {
            limits.delete(socketId);
          }
        }
      },
    };
  }
}

module.exports = WebSocketAuthMiddleware;
