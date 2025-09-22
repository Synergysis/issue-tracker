const mongoose = require("mongoose");

const ticketChatSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["Client", "SuperAdmin"],
  },
  message: {
    type: String,
    required: false,
    trim: true,
  },
  attachments: [
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TicketChat", ticketChatSchema);
