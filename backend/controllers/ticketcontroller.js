const Ticket = require("../models/ticketmodel");
const Client = require("../models/clientmodel"); // Add this to fetch company info

// @desc    Create a new ticket
// @route   POST /api/client/tickets
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Validate priority if provided
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
      });
    }

    // Validate category if provided
    const validCategories = ["general", "technical", "billing", "feature"];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Fetch client to get company info
    const client = await Client.findById(req.clientUser._id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Create new ticket and assign company from client
    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      priority: priority || "medium",
      category: category || "general",
      clientId: req.clientUser._id,
      companyId: client.company || null, // Assign companyId from client
      files: (req.files || []).map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // Save path relative to 'uploads/' only ONCE
        path: `uploads/${req.clientUser._id}/${file.filename}`,
        uploadedAt: new Date(),
      })),
    });

    // Populate client info for response
    await ticket.populate("clientId", "name email");

    // Notify clients via WebSocket if available
    if (global.wsService) {
      console.log('Notifying clients about new ticket:', ticket._id);
      global.wsService.notifyNewTicket(ticket, client.company);
    } else {
      console.log('WebSocket service not available for ticket notifications');
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: {
        id: ticket._id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        category: ticket.category,
        status: ticket.status,
        clientId: ticket.clientId._id,
        clientName: ticket.clientId.name,
        companyId: ticket.companyId || null,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    console.error("Create ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while creating ticket",
    });
  }
};

// @desc    Get all tickets for a client
// @route   GET /api/client/tickets
// @access  Private
exports.getClientTickets = async (req, res) => {
  try {
    let filter = {};
    // If clientId is provided as a query param, use it (for admin or dashboard)
    if (req.query.clientId) {
      filter.clientId = req.query.clientId;
    } else if (req.clientUser && req.clientUser._id) {
      // Otherwise, use the authenticated client's ID
      filter.clientId = req.clientUser._id;
    }
    // Pagination
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit =
      parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    const tickets = await Ticket.find(filter)
      .populate("clientId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Ticket.countDocuments(filter);
    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTickets: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get tickets error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
    });
  }
};

// @desc    Get a single ticket by ID
// @route   GET /api/client/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      clientId: req.clientUser._id,
    })
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
    console.error("Get ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
    });
  }
};

// @desc    Update a ticket
// @route   PUT /api/client/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    // Find ticket belonging to the authenticated client
    let ticket = await Ticket.findOne({
      _id: req.params.id,
      clientId: req.clientUser._id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if ticket is still editable (not closed)
    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a closed ticket",
      });
    }

    // Update fields if provided
    if (title) ticket.title = title.trim();
    if (description) ticket.description = description.trim();
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;

    await ticket.save();
    await ticket.populate("clientId", "name email");

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (err) {
    console.error("Update ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket",
    });
  }
};

// @desc    Get client dashboard data
// @route   GET /api/client/dashboard
// @access  Private
exports.getClientDashboard = async (req, res) => {
  try {
    const clientId = req.clientUser._id;

    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments({ clientId });
    const openTickets = await Ticket.countDocuments({
      clientId,
      status: "open",
    });
    const inProgressTickets = await Ticket.countDocuments({
      clientId,
      status: "in-progress",
    });
    const resolvedTickets = await Ticket.countDocuments({
      clientId,
      status: "resolved",
    });

    // Get recent tickets (last 3)
    const recentTickets = await Ticket.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select(
        "_id title description status priority category createdAt updatedAt"
      )
      .populate("clientId", "name email");

    // Get ticket count by priority
    const priorityCounts = await Ticket.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get ticket count by status
    const statusCounts = await Ticket.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format priority and status counts for frontend
    const formattedPriorityCounts = priorityCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const formattedStatusCounts = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Prepare statistics array
    const stats = [
      {
        name: "Open Tickets",
        value: openTickets.toString(),
        color: "bg-blue-500",
      },
      {
        name: "In Progress",
        value: inProgressTickets.toString(),
        color: "bg-yellow-500",
      },
      {
        name: "Resolved",
        value: resolvedTickets.toString(),
        color: "bg-green-500",
      },
      {
        name: "Total Tickets",
        value: totalTickets.toString(),
        color: "bg-purple-500",
      },
    ];

    // Format recent tickets for frontend
    const formattedRecentTickets = recentTickets.map((ticket) => ({
      id: ticket._id,
      ticketNumber: ticket._id.toString().slice(-6), // Last 6 characters as ticket number
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      timeAgo: getTimeAgo(ticket.updatedAt || ticket.createdAt),
    }));

    res.json({
      success: true,
      data: {
        stats,
        recentTickets: formattedRecentTickets,
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
        },
        ticketDetails: {
          byPriority: formattedPriorityCounts,
          byStatus: formattedStatusCounts,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    });
  }
};

// @desc    Delete a ticket
// @route   DELETE /api/client/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      clientId: req.clientUser._id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if ticket can be deleted (only open tickets)
    if (ticket.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open tickets can be deleted",
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

// @desc    Get ticket statistics
// @route   GET /api/client/tickets/stats
// @access  Private
exports.getTicketStats = async (req, res) => {
  try {
    const clientId = req.clientUser._id;

    // Get comprehensive statistics
    const stats = await Ticket.aggregate([
      { $match: { clientId } },
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
        byStatus: {
          open: result.open,
          inProgress: result.inProgress,
          resolved: result.resolved,
          closed: result.closed,
          total: result.total,
        },
        byPriority: {
          urgent: result.urgent,
          high: result.high,
          medium: result.medium,
          low: result.low,
        },
      },
    });
  } catch (err) {
    console.error("Get stats error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
    });
  }
};

// @desc    Close a ticket
// @route   PUT /api/client/tickets/:id/close
// @access  Private
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      clientId: req.clientUser._id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open tickets can be closed",
      });
    }

    ticket.status = "closed";
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket closed successfully",
      data: ticket,
    });
  } catch (err) {
    console.error("Close ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while closing ticket",
    });
  }
};

// @desc    Cancel a ticket
// @route   PUT /api/client/tickets/:id/cancel
// @access  Private
exports.cancelTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      clientId: req.clientUser._id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open tickets can be canceled",
      });
    }

    ticket.status = "canceled";
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket canceled successfully",
      data: ticket,
    });
  } catch (err) {
    console.error("Cancel ticket error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while canceling ticket",
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
