const Ticket = require("../models/ticketmodel");
const Client = require("../models/clientmodel");

// @desc    Get comprehensive dashboard analytics
// @route   GET /api/superadmin/analytics/dashboard
// @access  Private (SuperAdmin only)
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Get ticket statistics
    const ticketStats = await Ticket.aggregate([
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

    // Get client statistics
    const clientStats = await Client.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get tickets created in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentTicketsCount = await Ticket.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    // Get tickets resolved in last 7 days
    const recentResolvedCount = await Ticket.countDocuments({
      status: "resolved",
      updatedAt: { $gte: lastWeek },
    });

    // Get average resolution time (in hours)
    const resolvedTickets = await Ticket.find({
      status: "resolved",
      updatedAt: { $exists: true },
    }).select("createdAt updatedAt");

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((acc, ticket) => {
        const resolutionTime =
          (ticket.updatedAt - ticket.createdAt) / (1000 * 60 * 60); // hours
        return acc + resolutionTime;
      }, 0);
      avgResolutionTime =
        Math.round((totalTime / resolvedTickets.length) * 10) / 10;
    }

    const ticketResult = ticketStats[0] || {
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

    const clientResult = clientStats[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    res.json({
      success: true,
      data: {
        tickets: {
          summary: {
            total: ticketResult.total,
            open: ticketResult.open,
            inProgress: ticketResult.inProgress,
            resolved: ticketResult.resolved,
            closed: ticketResult.closed,
          },
          byPriority: {
            urgent: ticketResult.urgent,
            high: ticketResult.high,
            medium: ticketResult.medium,
            low: ticketResult.low,
          },
          metrics: {
            recentTickets: recentTicketsCount,
            recentResolved: recentResolvedCount,
            avgResolutionTime: avgResolutionTime,
          },
        },
        clients: {
          summary: {
            total: clientResult.total,
            pending: clientResult.pending,
            approved: clientResult.approved,
            rejected: clientResult.rejected,
          },
        },
      },
    });
  } catch (err) {
    console.error("Get dashboard analytics error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
};

// @desc    Get recent activity feed
// @route   GET /api/superadmin/analytics/activity
// @access  Private (SuperAdmin only)
exports.getActivityFeed = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    // Get recent ticket activities (creations and updates)
    const recentTickets = await Ticket.find()
      .populate("clientId", "name email")
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select("title status priority category createdAt updatedAt clientId");

    // Get recent client activities (creations and updates)
    const recentClients = await Client.find()
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select("name email status company createdAt updatedAt");

    const activities = [];

    // Add ticket activities (creation or update)
    recentTickets.forEach((ticket) => {
      const isCreated =
        ticket.createdAt.getTime() === ticket.updatedAt.getTime();
      activities.push({
        id: `ticket-${ticket._id}`,
        type: "ticket",
        action: isCreated ? "Ticket created" : "Ticket updated",
        description: ticket.title,
        client: ticket.clientId?.name || "Unknown Client",
        clientEmail: ticket.clientId?.email,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        timestamp: ticket.updatedAt,
        timeAgo: getTimeAgo(ticket.updatedAt),
      });
    });

    // Add client activities (creation or update)
    recentClients.forEach((client) => {
      const isCreated =
        client.createdAt.getTime() === client.updatedAt.getTime();
      activities.push({
        id: `client-${client._id}`,
        type: "client",
        action: isCreated ? "Client registered" : "Client updated",
        description: isCreated
          ? `${client.name} registered`
          : `${client.name} updated profile/status`,
        client: client.name,
        clientEmail: client.email,
        status: client.status,
        company: client.company,
        timestamp: client.updatedAt,
        timeAgo: getTimeAgo(client.updatedAt),
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit)),
    });
  } catch (err) {
    console.error("Get activity feed error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching activity feed",
    });
  }
};

// @desc    Get ticket trends (last 30 days)
// @route   GET /api/superadmin/analytics/trends
// @access  Private (SuperAdmin only)
exports.getTicketTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get daily ticket creation data
    const dailyTickets = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Get ticket resolution data
    const dailyResolutions = await Ticket.aggregate([
      {
        $match: {
          status: "resolved",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" },
          },
          resolved: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Format data for frontend charts
    const trendData = dailyTickets.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(
        2,
        "0"
      )}-${String(item._id.day).padStart(2, "0")}`,
      created: item.count,
      resolved: item.resolved,
    }));

    res.json({
      success: true,
      data: {
        trends: trendData,
        summary: {
          totalPeriod: parseInt(days),
          totalCreated: dailyTickets.reduce((sum, item) => sum + item.count, 0),
          totalResolved: dailyResolutions.reduce(
            (sum, item) => sum + item.resolved,
            0
          ),
        },
      },
    });
  } catch (err) {
    console.error("Get ticket trends error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trends",
    });
  }
};

// @desc    Get category analytics
// @route   GET /api/superadmin/analytics/categories
// @access  Private (SuperAdmin only)
exports.getCategoryAnalytics = async (req, res) => {
  try {
    // Get tickets by category with status breakdown
    const categoryData = await Ticket.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "urgent"] }, then: 4 },
                ],
                default: 2,
              },
            },
          },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json({
      success: true,
      data: categoryData.map((item) => ({
        category: item._id,
        total: item.total,
        statusBreakdown: {
          open: item.open,
          inProgress: item.inProgress,
          resolved: item.resolved,
          closed: item.closed,
        },
        avgPriorityScore: Math.round(item.avgPriority * 10) / 10,
      })),
    });
  } catch (err) {
    console.error("Get category analytics error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching category analytics",
    });
  }
};

// @desc    Get client performance analytics
// @route   GET /api/superadmin/analytics/clients
// @access  Private (SuperAdmin only)
exports.getClientAnalytics = async (req, res) => {
  try {
    // Get top clients by ticket count
    const topClients = await Ticket.aggregate([
      {
        $group: {
          _id: "$clientId",
          ticketCount: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "urgent"] }, then: 4 },
                ],
                default: 2,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      {
        $unwind: "$clientInfo",
      },
      {
        $project: {
          clientId: "$_id",
          name: "$clientInfo.name",
          email: "$clientInfo.email",
          company: "$clientInfo.company",
          ticketCount: 1,
          openTickets: 1,
          resolvedTickets: 1,
          avgPriorityScore: { $round: ["$avgPriority", 1] },
          resolutionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$resolvedTickets", "$ticketCount"] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        $sort: { ticketCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json({
      success: true,
      data: topClients,
    });
  } catch (err) {
    console.error("Get client analytics error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching client analytics",
    });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes < 10080) {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    const weeks = Math.floor(diffInMinutes / 10080);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
};
