const Client = require("../models/clientmodel");
const ClientOtp = require("../models/clientotps");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { sendEmail } = require("../utils/emailService");
const crypto = require("crypto");
const { getOtpEmailTemplate } = require("../utils/otpEmailTemplate");
const { Company } = require("../models/superadminmodel");

// @desc    Register a new client
// @route   POST /api/client/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyId, phone } = req.body;

    // Basic validation
    if (!name || !email || !password || !companyId) {
      return res.status(400).json({
        success: false,
        message:
          "Full Name, Email Address, Company ID, and Password are required",
      });
    }

    // Check if user already exists
    const userExists = await Client.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Client with this email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate companyId exists in Company collection
    const company = await Company.findOne({ companyId });
    if (!company) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid company ID. Please provide a valid companyId from your organization.",
      });
    }

    // Create new client with pending status, include companyName from companyId
    const client = await Client.create({
      name,
      email,
      password: hashedPassword,
      company: companyId, // companyId string
      companyName: company.name, // new field for company name
      phone: phone || "",
      status: "pending",
    });

    // Respond with success message (no token until approved)
    res.status(200).json({
      success: true,
      message:
        "Registration successful. Your account is pending admin approval.",
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        company: client.company,
        phone: client.phone,
        status: client.status,
        joinedDate: client.joinedDate || client.createdAt,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Login client
// @route   POST /api/client/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if client exists
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check approval status
    if (client.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          client.status === "pending"
            ? "Your account is pending admin approval"
            : "Your account has been rejected. Please contact support.",
      });
    }

    // Respond with token for approved clients
    res.json({
      success: true,
      message: "Login successful",
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        company: client.company,
        status: client.status,
        ticketsCount: client.ticketsCount,
      },
      token: generateToken(client._id, "1h"),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all clients (Super Admin only)
// @route   GET /api/client/all
// @access  Private (Super Admin)
exports.getAllClients = async (req, res) => {
  try {
    let { status, page = 1, limit } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    // Only use limit if provided and valid
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        error: "'limit' query parameter is required and must be a positive integer."
      });
    }
    if (limit > 100) limit = 100; // max limit to prevent huge responses

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }
    const skip = (page - 1) * limit;
    const clients = await Client.find(filter)
      .select("-password")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Client.countDocuments(filter);

    // Fetch company names for all clients using companyId
    const companyIds = clients.map((c) => c.company).filter(Boolean);
    let companyMap = {};
    if (companyIds.length > 0) {
      const companies = await Company.find({ companyId: { $in: companyIds } });
      companyMap = companies.reduce((acc, c) => {
        acc[c.companyId] = c.name;
        return acc;
      }, {});
    }
    // Attach company name to each client
    const clientsWithCompany = clients.map((client) => {
      const clientObj = client.toObject();
      clientObj.companyName = companyMap[client.company] || null;
      return clientObj;
    });

    res.json({
      success: true,
      data: {
        clients: clientsWithCompany,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (err) {
    console.error("Get all clients error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Approve a client
// @route   PUT /api/client/approve/:id
// @access  Private (Super Admin)
exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    if (client.status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Client is already approved",
      });
    }

    client.status = "approved";
    client.approvedBy = req.superAdminUser._id;
    client.approvedAt = new Date();

    await client.save();

    const updatedClient = await Client.findById(client._id)
      .select("-password")
      .populate("approvedBy", "name email");

    res.json({
      success: true,
      message: "Client approved successfully",
      client: updatedClient,
    });
  } catch (err) {
    console.error("Approve client error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Reject a client
// @route   PUT /api/client/reject/:id
// @access  Private (Super Admin)
exports.rejectClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    if (client.status === "rejected") {
      return res.status(400).json({
        success: false,
        error: "Client is already rejected",
      });
    }

    client.status = "rejected";
    client.approvedBy = req.superAdminUser._id;
    client.approvedAt = new Date();

    await client.save();

    const updatedClient = await Client.findById(client._id)
      .select("-password")
      .populate("approvedBy", "name email");

    res.json({
      success: true,
      message: "Client rejected successfully",
      client: updatedClient,
    });
  } catch (err) {
    console.error("Reject client error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete a client
// @route   DELETE /api/client/:id
// @access  Private (Super Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (err) {
    console.error("Delete client error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update client profile
// @route   PUT /api/client/profile
// @access  Private (Client)
exports.updateProfile = async (req, res) => {
  try {
    const clientId = req.clientUser._id;
    const { name, email, company, password } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (company) updateFields.company = company;
    if (password) {
      const bcrypt = require("bcryptjs");
      updateFields.password = await bcrypt.hash(password, 10);
    }
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({
      success: true,
      message: "Profile updated successfully",
      client: updatedClient,
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// @desc    Get client profile
// @route   GET /api/client/profile
// @access  Private (Client)
exports.getProfile = async (req, res) => {
  try {
    const clientId = req.clientUser._id;
    const client = await Client.findById(clientId).select("-password");
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    // Fetch company name using companyId
    let companyName = client.companyName;
    if (!companyName && client.company) {
      const company = await Company.findOne({ companyId: client.company });
      if (company) companyName = company.name;
    }
    res.json({
      success: true,
      client: {
        ...client.toObject(),
        companyName,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Get client by ID (Super Admin)
// @route   GET /api/superadmin/clients/:id
// @access  Private (Super Admin)
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .select("-password")
      .populate("approvedBy", "_id name email");
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    // Get ticket analytics for this client
    const Ticket = require("../models/ticketmodel");
    const tickets = await Ticket.find({ clientId: client._id }).select(
      "_id status priority"
    );
    // Analytics summary
    const total = tickets.length;
    const statusCounts = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const priorityCounts = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    // Fetch full company details if company is set
    let companyDetails = null;
    if (client.company) {
      companyDetails = await Company.findOne({ companyId: client.company });
    }

    res.json({
      success: true,
      client,
      company: companyDetails,
      ticketAnalytics: {
        total,
        statusCounts,
        priorityCounts,
        tickets: tickets.map((t) => ({
          id: t._id,
          status: t.status,
          priority: t.priority,
        })),
      },
    });
  } catch (err) {
    console.error("Get client by ID error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching client",
    });
  }
};

// @desc    Search clients by name, company, or email (Super Admin)
// @route   GET /api/superadmin/clients/search?q=term
// @access  Private (Super Admin)
exports.searchClients = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { company: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const clients = await Client.find(filter)
      .select("_id name email company status joinedDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Client.countDocuments(filter);
    res.json({
      success: true,
      data: clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error("Client search error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while searching clients",
    });
  }
};

// @desc    Request password reset (send OTP)
// @route   POST /api/client/request-password-reset
// @access  Public
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    const client = await Client.findOne({ email });
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    // Remove previous OTPs for this email
    await ClientOtp.deleteMany({ email });
    // Save OTP
    await ClientOtp.create({ email, otp, expiresAt });
    // Send OTP email with improved template and user details
    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      text: `Hello ${
        client.name
      },\n\nYour OTP for password reset is: ${otp}. It expires in 10 minutes.\n\nName: ${
        client.name
      }\nEmail: ${client.email}\nCompany: ${client.company || "-"}`,
      html: getOtpEmailTemplate(otp, 10, client),
    });
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Request password reset error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/client/reset-password
// @access  Public
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }
    const otpDoc = await ClientOtp.findOne({ email, otp });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    const client = await Client.findOne({ email });
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    client.password = await bcrypt.hash(newPassword, 10);
    await client.save();
    await ClientOtp.deleteMany({ email }); // Remove used OTPs
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password with OTP error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
