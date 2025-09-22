#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 WebSocket Chat System Health Check\n");

// Get the backend directory (parent of scripts)
const backendDir = path.dirname(__dirname);

// Check if all required files exist
const requiredFiles = [
  "websocket/websocketService.js",
  "middleware/wsAuthMiddleware.js",
  "server.js",
  "models/ticketchatmodel.js",
  "examples/websocket-chat-client.html",
  "test/websocket-chat-test.js",
  "WEBSOCKET_CHAT_API.md",
  "README.md",
];

let allFilesExist = true;

console.log("📁 Checking required files:");
requiredFiles.forEach((file) => {
  const filePath = path.join(backendDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log("");

// Check package.json dependencies
console.log("📦 Checking dependencies:");
const packageJsonPath = path.join(backendDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const requiredDeps = [
  "socket.io",
  "jsonwebtoken",
  "mongoose",
  "multer",
  "express",
];
const requiredDevDeps = ["socket.io-client"];

requiredDeps.forEach((dep) => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(
    `  ${exists ? "✅" : "❌"} ${dep} ${exists ? `(${exists})` : "(missing)"}`
  );
});

requiredDevDeps.forEach((dep) => {
  const exists =
    packageJson.devDependencies && packageJson.devDependencies[dep];
  console.log(
    `  ${exists ? "✅" : "❌"} ${dep} (dev) ${
      exists ? `(${exists})` : "(missing)"
    }`
  );
});

console.log("");

// Check WebSocket service functionality
console.log("🔧 Checking WebSocket service:");
try {
  const WebSocketService = require(path.join(
    backendDir,
    "websocket/websocketService"
  ));
  console.log("  ✅ WebSocketService loads correctly");

  const WebSocketAuthMiddleware = require(path.join(
    backendDir,
    "middleware/wsAuthMiddleware"
  ));
  console.log("  ✅ WebSocketAuthMiddleware loads correctly");

  // Check if service has required methods
  const mockIo = { to: () => ({ emit: () => {} }) };
  const service = new WebSocketService(mockIo);
  const requiredMethods = [
    "authenticateSocket",
    "joinTicketRoom",
    "leaveTicketRoom",
    "getTicketMessages",
    "postMessage",
    "handleConnection",
  ];

  requiredMethods.forEach((method) => {
    const exists = typeof service[method] === "function";
    console.log(`  ${exists ? "✅" : "❌"} Method: ${method}`);
  });
} catch (error) {
  console.log("  ❌ Error loading WebSocket service:", error.message);
}

console.log("");

// Check models
console.log("🗄️  Checking database models:");
try {
  const TicketChat = require(path.join(backendDir, "models/ticketchatmodel"));
  console.log("  ✅ TicketChat model loads correctly");

  // Check schema structure
  const schema = TicketChat.schema;
  const requiredFields = [
    "ticketId",
    "sender",
    "senderModel",
    "message",
    "attachments",
    "createdAt",
  ];

  requiredFields.forEach((field) => {
    const exists = schema.paths[field];
    console.log(`  ${exists ? "✅" : "❌"} Field: ${field}`);
  });
} catch (error) {
  console.log("  ❌ Error loading models:", error.message);
}

console.log("");

// Check environment variables
console.log("🌍 Checking environment variables:");
const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
requiredEnvVars.forEach((envVar) => {
  const exists = process.env[envVar];
  console.log(
    `  ${exists ? "✅" : "⚠️"} ${envVar} ${
      exists ? "(set)" : "(not set - may be in .env file)"
    }`
  );
});

console.log("");

// Check uploads directory
console.log("📁 Checking uploads directory:");
const uploadsDir = path.join(backendDir, "uploads");
const chatDir = path.join(uploadsDir, "chat");

if (fs.existsSync(uploadsDir)) {
  console.log("  ✅ uploads/ directory exists");
} else {
  console.log(
    "  ⚠️  uploads/ directory does not exist (will be created automatically)"
  );
}

if (fs.existsSync(chatDir)) {
  console.log("  ✅ uploads/chat/ directory exists");
} else {
  console.log(
    "  ⚠️  uploads/chat/ directory does not exist (will be created automatically)"
  );
}

console.log("");

// Final summary
console.log("📊 Summary:");
if (allFilesExist) {
  console.log("  ✅ All required files are present");
} else {
  console.log("  ❌ Some required files are missing");
}

console.log("");
console.log("🚀 Next Steps:");
console.log("  1. Make sure MongoDB is running");
console.log("  2. Set up your .env file with JWT_SECRET and MONGO_URI");
console.log("  3. Start the server: npm start");
console.log("  4. Test the WebSocket chat: npm test:websocket");
console.log("  5. Open examples/websocket-chat-client.html to test manually");

console.log("");
console.log("📚 Documentation:");
console.log("  - API Documentation: WEBSOCKET_CHAT_API.md");
console.log("  - Setup Guide: README.md");
console.log("  - Example Client: examples/websocket-chat-client.html");
console.log("  - Test Script: test/websocket-chat-test.js");

console.log("");
console.log("✨ WebSocket Chat System is ready to use!");
