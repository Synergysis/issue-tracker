const io = require("socket.io-client");

// Configuration
const SERVER_URL = "http://localhost:5000";
const JWT_TOKEN = "your-jwt-token-here"; // Replace with a valid JWT token
const TICKET_ID = "your-ticket-id-here"; // Replace with a valid ticket ID

class WebSocketChatTester {
  constructor() {
    this.socket = null;
    this.isAuthenticated = false;
    this.isInTicket = false;
  }

  connect() {
    console.log("🔌 Connecting to WebSocket server...");

    this.socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    this.setupEventHandlers();

    // Authenticate after connection
    this.socket.on("connect", () => {
      console.log("✅ Connected to server");
      this.authenticate();
    });
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      this.isAuthenticated = false;
      this.isInTicket = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("💥 Connection error:", error.message);
    });

    // Authentication events
    this.socket.on("authenticated", (data) => {
      console.log("🔐 Authenticated successfully:", data.user);
      this.isAuthenticated = true;
      this.joinTicket();
    });

    this.socket.on("authentication_error", (data) => {
      console.error("🚫 Authentication failed:", data.message);
    });

    // Ticket events
    this.socket.on("joined_ticket", (data) => {
      console.log("🎫 Joined ticket:", data.ticketId);
      this.isInTicket = true;
      this.loadMessages();
    });

    this.socket.on("join_ticket_error", (data) => {
      console.error("❌ Failed to join ticket:", data.message);
    });

    this.socket.on("left_ticket", (data) => {
      console.log("👋 Left ticket:", data.ticketId);
      this.isInTicket = false;
    });

    // Message events
    this.socket.on("messages_loaded", (data) => {
      console.log(
        `📨 Loaded ${data.messages.length} messages for ticket ${data.ticketId}`
      );
      data.messages.forEach((msg, index) => {
        console.log(
          `  ${index + 1}. [${new Date(msg.createdAt).toLocaleTimeString()}] ${
            msg.sender.name
          }: ${msg.message}`
        );
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att) => {
            console.log(
              `    📎 ${att.originalname} (${this.formatFileSize(att.size)})`
            );
          });
        }
      });

      // Send a test message after loading
      setTimeout(() => {
        this.sendTestMessage();
      }, 2000);
    });

    this.socket.on("messages_error", (data) => {
      console.error("❌ Failed to load messages:", data.message);
    });

    this.socket.on("new_message", (data) => {
      const msg = data.data;
      console.log(`💬 New message from ${msg.sender.name}: ${msg.message}`);
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          console.log(
            `  📎 ${att.originalname} (${this.formatFileSize(att.size)})`
          );
        });
      }
    });

    this.socket.on("send_message_error", (data) => {
      console.error("❌ Failed to send message:", data.message);
    });

    // Typing events
    this.socket.on("user_typing", (data) => {
      console.log(`⌨️  ${data.userName} is typing...`);
    });

    this.socket.on("user_stopped_typing", (data) => {
      console.log(`⌨️  ${data.userName} stopped typing`);
    });

    // User presence events
    this.socket.on("user_joined_ticket", (data) => {
      console.log(`👋 ${data.userName} joined the ticket`);
    });

    this.socket.on("user_left_ticket", (data) => {
      console.log(`👋 ${data.userName} left the ticket`);
    });

    this.socket.on("online_users", (data) => {
      console.log(
        `👥 Online users in ticket ${data.ticketId}:`,
        data.users.map((u) => u.userName).join(", ")
      );
    });
  }

  authenticate() {
    if (!JWT_TOKEN || JWT_TOKEN === "your-jwt-token-here") {
      console.error("❌ Please set a valid JWT_TOKEN in the test script");
      return;
    }

    console.log("🔐 Authenticating...");
    this.socket.emit("authenticate", { token: JWT_TOKEN });
  }

  joinTicket() {
    if (!this.isAuthenticated) {
      console.error("❌ Not authenticated");
      return;
    }

    if (!TICKET_ID || TICKET_ID === "your-ticket-id-here") {
      console.error("❌ Please set a valid TICKET_ID in the test script");
      return;
    }

    console.log("🎫 Joining ticket...");
    this.socket.emit("join_ticket", { ticketId: TICKET_ID });
  }

  loadMessages() {
    if (!this.isInTicket) {
      console.error("❌ Not in ticket");
      return;
    }

    console.log("📨 Loading messages...");
    this.socket.emit("get_messages", { ticketId: TICKET_ID });
  }

  sendTestMessage() {
    if (!this.isInTicket) {
      console.error("❌ Not in ticket");
      return;
    }

    const testMessage = `Test message from WebSocket client at ${new Date().toLocaleTimeString()}`;
    console.log("📤 Sending test message:", testMessage);

    this.socket.emit("send_message", {
      ticketId: TICKET_ID,
      message: testMessage,
    });
  }

  sendTypingIndicator() {
    if (!this.isInTicket) {
      console.error("❌ Not in ticket");
      return;
    }

    console.log("⌨️  Sending typing indicator...");
    this.socket.emit("typing_start", { ticketId: TICKET_ID });

    // Stop typing after 2 seconds
    setTimeout(() => {
      this.socket.emit("typing_stop", { ticketId: TICKET_ID });
    }, 2000);
  }

  leaveTicket() {
    if (!this.isInTicket) {
      console.error("❌ Not in ticket");
      return;
    }

    console.log("👋 Leaving ticket...");
    this.socket.emit("leave_ticket", { ticketId: TICKET_ID });
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting...");
      this.socket.disconnect();
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Run a complete test cycle
  runTestCycle() {
    this.connect();

    // Schedule test actions
    setTimeout(() => {
      if (this.isInTicket) {
        this.sendTypingIndicator();
      }
    }, 5000);

    setTimeout(() => {
      if (this.isInTicket) {
        this.sendTestMessage();
      }
    }, 8000);

    setTimeout(() => {
      this.socket.emit("get_online_users", { ticketId: TICKET_ID });
    }, 10000);

    // Disconnect after 15 seconds
    setTimeout(() => {
      this.disconnect();
      process.exit(0);
    }, 15000);
  }
}

// Usage instructions
console.log("📋 WebSocket Chat System Tester");
console.log("📋 Instructions:");
console.log("📋 1. Update JWT_TOKEN with a valid JWT token");
console.log("📋 2. Update TICKET_ID with a valid ticket ID");
console.log("📋 3. Make sure the server is running on http://localhost:5000");
console.log("📋 4. Run this test script");
console.log("📋 ");

if (
  JWT_TOKEN === "your-jwt-token-here" ||
  TICKET_ID === "your-ticket-id-here"
) {
  console.log(
    "❌ Please update JWT_TOKEN and TICKET_ID before running the test"
  );
  console.log(
    "💡 You can get a JWT token by logging in through your client application"
  );
  console.log(
    "💡 You can get a ticket ID from your database or by creating a ticket"
  );
} else {
  // Run the test
  const tester = new WebSocketChatTester();
  tester.runTestCycle();
}

module.exports = WebSocketChatTester;
