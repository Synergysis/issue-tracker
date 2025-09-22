const { SuperAdmin } = require("../models/superadminmodel");
const Company = require("../models/companymodel");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// @desc    Register a new super admin
// @route   POST /api/superadmin/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    const existing = await SuperAdmin.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Super admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await SuperAdmin.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      msg: "Registration successful",
      id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id, "1h"),
    });
  } catch (err) {
    console.error("SuperAdmin Register error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Login super admin
// @route   POST /api/superadmin/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const admin = await SuperAdmin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      msg: "Login successful",
      id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id, "1h"),
    });
  } catch (err) {
    console.error("SuperAdmin Login error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create a new company
// @route   POST /api/superadmin/companies
// @access  Private
exports.createCompany = async (req, res) => {
  try {
    const { name, address, contactEmail } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: "Name and contact email are required",
      });
    }

    // First check if a company exists with the same name (required unique field)
    const existingByName = await Company.findOne({ name });
    if (existingByName) {
      return res.status(409).json({
        success: false,
        error: `Company name already exists.`
      });
    }

    // Then check if a company exists with the same email (required unique field)
    const existingByEmail = await Company.findOne({ contactEmail });
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        error: `Company contact email already exists.`
      });
    }

    // If address is provided, check for duplicate combination of name+email+address
    if (address) {
      const existingByAll = await Company.findOne({
        name,
        contactEmail,
        address
      });
      if (existingByAll) {
        return res.status(409).json({
          success: false,
          error: `A company with the same name, email, and address already exists.`
        });
      }
    }

    // Generate companyId: first 3 letters of name (uppercase, padded), last 3 random numeric, ensure unique
    const prefix = name.trim().substring(0, 3).toUpperCase().padEnd(3, "X");
    let uniqueId, companyId, exists;
    const chars = "0123456789";
    do {
      uniqueId = Array.from(
        { length: 3 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
      companyId = prefix + uniqueId;
      exists = await Company.findOne({ companyId });
    } while (exists);

    const company = await Company.create({
      name,
      address,
      contactEmail,
      companyId,
    });

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (err) {
    console.error("Create Company error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get all companies
// @route   GET /api/superadmin/companies
// @access  Private
exports.getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const companies = await Company.find()
      .skip(skip)
      .limit(limit)
      .select('name address contactEmail companyId createdAt');

    const formatted = companies.map(c => ({
      _id: c._id,
      name: c.name,
      address: c.address,
      contactEmail: c.contactEmail,
      companyId: c.companyId,
      createdAt: c.createdAt
    }));

    const total = await Company.countDocuments();
    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Get Companies error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get company details by ID
// @route   GET /api/superadmin/companies/:id
// @access  Private
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    // Use companyId (custom string) instead of MongoDB _id
    const company = await Company.findOne({ companyId: id });
    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    // Fetch all tickets for this company (by companyId)
    const Ticket = require("../models/ticketmodel");
    const tickets = await Ticket.find({ companyId: id });
    // Ticket summary
    const ticketSummary = tickets.reduce(
      (acc, t) => {
        acc.total++;
        acc.status[t.status] = (acc.status[t.status] || 0) + 1;
        acc.priority[t.priority] = (acc.priority[t.priority] || 0) + 1;
        return acc;
      },
      { total: 0, status: {}, priority: {} }
    );

    // Fetch all clients for this company (by companyId string)
    const Client = require("../models/clientmodel");
    const clients = await Client.find({ company: id }).select("-password");
    // For each client, get ticket summary
    const clientSummaries = await Promise.all(
      clients.map(async (client) => {
        const clientTickets = tickets.filter(
          (t) => t.clientId.toString() === client._id.toString()
        );
        const summary = clientTickets.reduce(
          (acc, t) => {
            acc.total++;
            acc.status[t.status] = (acc.status[t.status] || 0) + 1;
            acc.priority[t.priority] = (acc.priority[t.priority] || 0) + 1;
            return acc;
          },
          { total: 0, status: {}, priority: {} }
        );
        return {
          client,
          ticketSummary: summary,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: company,
      tickets: {
        list: tickets,
        summary: ticketSummary,
      },
      clients: clientSummaries,
    });
  } catch (err) {
    console.error("Get Company By ID error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Search companies by name and email
// @route   GET /api/superadmin/companies/search
// @access  Private
exports.searchCompanies = async (req, res) => {
  try {
    const { name, email } = req.query;

    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (email) query.contactEmail = { $regex: email, $options: "i" };

    const companies = await Company.find(query);

    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (err) {
    console.error("Search Companies error:", err.message);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
