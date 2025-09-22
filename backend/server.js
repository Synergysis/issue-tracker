const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const WebSocketService = require("./websocket/websocketService");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased for file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/client", require("./routes/clientroutes"));
app.use("/api/superadmin", require("./routes/superadminroutes"));
app.use("/api", require("./routes/companyroutes"));
app.use("/api", require("./routes/companyviewroutes"));
// Remove chat routes as everything will be handled via WebSocket
// app.use("/api", require("./routes/ticketchatroutes"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 50e6, // 50MB for file uploads
});

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Make WebSocketService available globally for controllers to use
global.wsService = wsService;

io.on("connection", (socket) => {
  wsService.handleConnection(socket);
});

// Legacy support - keeping old events for backward compatibility during transition
io.on("connection", (socket) => {
  // Legacy chat message event (deprecated)
  socket.on("chat message", (msg) => {
    console.log(
      "Warning: Legacy 'chat message' event used. Please migrate to new WebSocket API."
    );
    io.emit("chat message", msg);
  });

  // Legacy fetch messages event (deprecated)
  socket.on("fetch messages", async (ticketId, callback) => {
    console.log(
      "Warning: Legacy 'fetch messages' event used. Please migrate to new WebSocket API."
    );
    try {
      if (!ticketId)
        return callback({ success: false, message: "ticketId required" });

      // Use WebSocket service for consistency
      const messages = await wsService.getTicketMessages(
        ticketId,
        null,
        "SuperAdmin"
      );
      callback({ success: true, data: messages });
    } catch (err) {
      callback({ success: false, message: "Error fetching messages" });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
