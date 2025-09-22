const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  category: {
    type: String,
    enum: ["general", "technical", "billing", "feature"],
    default: "general",
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed", "canceled"],
    default: "open",
  },
  assignedTo: {
    type: String,
    default: null,
    trim: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  companyId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  files: [
    {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Update the updatedAt field before saving
ticketSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
