const Ticket = require("../models/ticketmodel");
const Client = require("../models/clientmodel"); // Assuming you have a client model
const { Company } = require("../models/superadminmodel"); // Import Company model

// @desc    Get all tickets (SuperAdmin view) with live search
// @route   GET /api/superadmin/tickets
// @access  Private (SuperAdmin only)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10, search = "", filter } = req.query;

    // Build filter object
    const ticketFilter = {};

    // Flexible status/priority filter via 'filter' param
    if (filter) {
      switch (filter) {
        case "resolve":
          ticketFilter.status = "resolved";
          break;
        case "close":
          ticketFilter.status = "closed";
          break;
        case "in-progress":
          ticketFilter.status = "in-progress";
          break;
        case "open":
          ticketFilter.status = "open";
          break;
        case "urgent":
          ticketFilter.priority = "urgent";
          break;
        case "high":
          ticketFilter.priority = "high";
          break;
        case "medium":
          ticketFilter.priority = "medium";
          break;
        case "low":
          ticketFilter.priority = "low";
          break;
        default:
          break;
      }
    }

    // Direct status/priority filter
    if (status && status !== "all") {
      ticketFilter.status = status;
    }
    if (priority && priority !== "all") {
      ticketFilter.priority = priority;
    }

    // Live search: search by ticket title, description, company name, and client name
    let orFilters = [];
    if (search && search.trim() !== "") {
      // Find companies matching the search
      const companies = await Company.find({
        name: { $regex: search, $options: "i" },
      });
      const companyIds = companies.map((c) => c._id.toString());

      // Find clients matching the search
      const clients = await Client.find({
        name: { $regex: search, $options: "i" },
      });
      const clientIds = clients.map((c) => c._id.toString());

      orFilters = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { companyId: { $in: companyIds } },
        { clientId: { $in: clientIds } },
      ];
    }

    // Company filter
    if (req.query.companyId) {
      ticketFilter.companyId = req.query.companyId;
    }

    // Merge $or filters if present
    let finalFilter = { ...ticketFilter };
    if (orFilters.length > 0) {
      finalFilter.$or = orFilters;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get tickets with client information
    const tickets = await Ticket.find(finalFilter)
      .populate("clientId", "name company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(finalFilter);

    // Fetch all company names for tickets in one go
    const companyIds = tickets.map((t) => t.companyId).filter(Boolean);
    let companyMap = {};
    if (companyIds.length > 0) {
      const companies = await Company.find({ companyId: { $in: companyIds } });
      companyMap = companies.reduce((acc, c) => {
        acc[c.companyId] = c.name;
        return acc;
      }, {});
    }

    // Format tickets for frontend
    const formattedTickets = tickets.map((ticket) => ({
      id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      client: ticket.clientId?.name || "Unknown Client",
      company: companyMap[ticket.companyId?.toString()] || null,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString().split("T")[0],
      updatedAt: ticket.updatedAt.toISOString().split("T")[0],
    }));

    res.json({
      success: true,
      data: formattedTickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
        hasNext: page * limit < totalTickets,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get all tickets error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
    });
  }
};

// @desc    Get ticket by ID (SuperAdmin view) - Enhanced with full details
// @route   GET /api/superadmin/tickets/:id
// @access  Private (SuperAdmin only)
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("clientId", "_id name email company status joinedDate")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    console.error("Get ticket by ID error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
    });
  }
};

// @desc    Update ticket status/priority (SuperAdmin)
// @route   PUT /api/superadmin/tickets/:id
// @access  Private (SuperAdmin only)
exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, category } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update fields if provided
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;

    await ticket.save();
    await ticket.populate("clientId", "name email");

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: {
        id: ticket._id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket",
    });
  }
};

// @desc    Delete ticket (SuperAdmin)
// @route   DELETE /api/superadmin/tickets/:id
// @access  Private (SuperAdmin only)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    console.error("Delete ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
    });
  }
};

// @desc    Resolve ticket (SuperAdmin)
// @route   PUT /api/superadmin/tickets/:id/resolve
// @access  Private (SuperAdmin only)
exports.resolveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "resolved";
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket resolved successfully",
      data: {
        id: ticket._id,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (err) {
    console.error("Resolve ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while resolving ticket",
    });
  }
};

// @desc    Get ticket statistics (SuperAdmin Dashboard)
// @route   GET /api/superadmin/tickets/stats
// @access  Private (SuperAdmin only)
exports.getTicketStats = async (req, res) => {
  try {
    // Get overall statistics
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
        },
      },
    ]);

    // Get recent tickets
    const recentTickets = await Ticket.find()
      .populate("clientId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id title status priority createdAt clientId");

    // Get tickets by category
    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    res.json({
      success: true,
      data: {
        summary: {
          total: result.total,
          open: result.open,
          inProgress: result.inProgress,
          resolved: result.resolved,
          closed: result.closed,
        },
        byPriority: {
          urgent: result.urgent,
          high: result.high,
          medium: result.medium,
          low: result.low,
        },
        byCategory: categoryStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentTickets: recentTickets.map((ticket) => ({
          id: ticket._id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          client: ticket.clientId?.name || "Unknown",
          createdAt: ticket.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("Get ticket stats error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
    });
  }
};

// @desc    Bulk update tickets
// @route   PUT /api/superadmin/tickets/bulk-update
// @access  Private (SuperAdmin only)
exports.bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, updateData } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ticketIds array is required",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "updateData is required",
      });
    }

    // Update multiple tickets
    const result = await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} tickets updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    console.error("Bulk update tickets error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while bulk updating tickets",
    });
  }
};

// @desc    Search tickets by client name, ticket ID, or company (SuperAdmin)
// @route   GET /api/superadmin/tickets/search
// @access  Private (SuperAdmin only)
exports.searchTickets = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    let filter = {};
    let companyIds = [];
    if (q) {
      // Search by ticket ID (exact), client name/company (partial), company name (partial), or company ID (exact)
      const clientMatch = await Client.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { company: { $regex: q, $options: "i" } },
        ],
      }).select("_id");
      const clientIds = clientMatch.map((c) => c._id);
      // Find companies by name or ID
      const { Company } = require("../models/superadminmodel");
      let companyMatch = await Company.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { _id: q.match(/^[a-fA-F0-9]{24}$/) ? q : undefined },
        ].filter(Boolean),
      }).select("_id");
      companyIds = companyMatch.map((c) => c._id.toString());
      const orFilter = [];
      if (/^[a-fA-F0-9]{24}$/.test(q)) {
        orFilter.push({ _id: q });
      }
      if (clientIds.length > 0) {
        orFilter.push({ clientId: { $in: clientIds } });
      }
      if (companyIds.length > 0) {
        orFilter.push({ companyId: { $in: companyIds } });
      }
      filter = orFilter.length > 0 ? { $or: orFilter } : {};
    }
    const tickets = await Ticket.find(filter)
      .populate("clientId", "name company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Ticket.countDocuments(filter);

    // Fetch all company names for tickets in one go (same as getAllTickets)
    const ticketCompanyIds = tickets.map((t) => t.companyId).filter(Boolean);
    let companyMap = {};
    if (ticketCompanyIds.length > 0) {
      const companies = await Company.find({
        companyId: { $in: ticketCompanyIds },
      });
      companyMap = companies.reduce((acc, c) => {
        acc[c.companyId] = c.name;
        return acc;
      }, {});
    }

    // Format tickets for frontend (same as getAllTickets)
    const formattedTickets = tickets.map((ticket) => ({
      id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      client: ticket.clientId?.name || "Unknown Client",
      company: companyMap[ticket.companyId?.toString()] || null, // Add company name
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString().split("T")[0],
      updatedAt: ticket.updatedAt.toISOString().split("T")[0],
    }));

    res.json({
      success: true,
      data: formattedTickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTickets: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Ticket search error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while searching tickets",
    });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const ticketDate = new Date(date);
  const diffInMinutes = Math.floor((now - ticketDate) / (1000 * 60));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes < 10080) {
    // 7 days
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    const weeks = Math.floor(diffInMinutes / 10080);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
};
