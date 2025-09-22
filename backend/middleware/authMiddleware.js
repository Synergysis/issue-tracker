const jwt = require("jsonwebtoken");
const Client = require("../models/clientmodel");
const { SuperAdmin } = require("../models/superadminmodel");

const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find SuperAdmin first (for admin routes)
    const admin = await SuperAdmin.findById(decoded.id).select("-password");
    if (admin) {
      req.superAdminUser = admin;
      req.userType = "admin";
      return next();
    }

    // If not admin, try to find Client
    const client = await Client.findById(decoded.id).select("-password");
    if (client) {
      req.clientUser = client;
      req.userType = "client";
      return next();
    }

    // If neither found, token is invalid
    return res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// Middleware specifically for Super Admin routes
const adminAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await SuperAdmin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Super Admin privileges required.",
      });
    }

    req.superAdminUser = admin;
    next();
  } catch (err) {
    console.error("Admin auth middleware error:", err.message);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// Middleware specifically for Client routes
const clientAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.id).select("-password");

    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    // Check if client is approved
    if (client.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          client.status === "pending"
            ? "Your account is pending approval"
            : "Your account has been rejected",
      });
    }

    req.clientUser = client;
    next();
  } catch (err) {
    console.error("Client auth middleware error:", err.message);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

module.exports = { auth, adminAuth, clientAuth };
