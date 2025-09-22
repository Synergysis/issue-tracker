# WebSocket Chat API Documentation

This document describes the WebSocket-based chat system that replaces HTTP requests for all chat functionality.

## Overview

The WebSocket chat system provides real-time communication for ticket-based conversations with the following features:

- Real-time messaging with instant delivery
- File upload support with multiple attachments
- Typing indicators
- User authentication via JWT tokens
- Room-based chat (tickets as rooms)
- Message history with pagination
- Automatic reconnection handling

## Connection

Connect to the WebSocket server at: `ws://your-server:port`

```javascript
const socket = io("http://localhost:5000");
```

## Authentication

All chat operations require authentication. Send your JWT token immediately after connecting:

### Event: `authenticate`

**Client sends:**

```javascript
socket.emit("authenticate", {
  token: "your-jwt-token-here",
});
```

**Server responds:**

- Success: `authenticated` event
- Error: `authentication_error` event

```javascript
socket.on("authenticated", (data) => {
  console.log("Authenticated as:", data.user.name);
  // data.user contains: { id, name, email, type }
});

socket.on("authentication_error", (data) => {
  console.error("Auth failed:", data.message);
});
```

## Ticket Management

### Joining a Ticket Room

Before sending or receiving messages, join the ticket room:

```javascript
socket.emit("join_ticket", {
  ticketId: "ticket-id-here",
});
```

**Server responses:**

```javascript
socket.on("joined_ticket", (data) => {
  // Successfully joined
  console.log("Joined ticket:", data.ticketId);
});

socket.on("join_ticket_error", (data) => {
  // Error joining
  console.error("Join error:", data.message);
});
```

### Leaving a Ticket Room

```javascript
socket.emit("leave_ticket", {
  ticketId: "ticket-id-here",
});
```

## Messages

### Loading Message History

```javascript
socket.emit("get_messages", {
  ticketId: "ticket-id-here",
});
```

**Server response:**

```javascript
socket.on("messages_loaded", (data) => {
  // data.messages is an array of message objects
  data.messages.forEach((message) => {
    console.log(message);
  });
});

socket.on("messages_error", (data) => {
  console.error("Failed to load messages:", data.message);
});
```

### Sending Messages

#### Text Message Only

```javascript
socket.emit("send_message", {
  ticketId: "ticket-id-here",
  message: "Hello, this is a text message!",
});
```

#### Message with File Attachments

```javascript
// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Send message with files
const fileInput = document.getElementById("fileInput");
const files = Array.from(fileInput.files);
const attachments = [];

for (const file of files) {
  const base64Data = await fileToBase64(file);
  attachments.push({
    name: file.name,
    type: file.type,
    data: base64Data.split(",")[1], // Remove data:mime;base64, prefix
  });
}

socket.emit("send_message", {
  ticketId: "ticket-id-here",
  message: "Check out these files!",
  attachments: attachments,
});
```

#### Files Only (No Text)

```javascript
socket.emit("send_message", {
  ticketId: "ticket-id-here",
  message: "", // Empty message
  attachments: attachments,
});
```

### Receiving New Messages

All users in the ticket room receive new messages in real-time:

```javascript
socket.on("new_message", (data) => {
  const message = data.data;

  console.log("New message from:", message.sender.name);
  console.log("Message text:", message.message);

  // Handle attachments
  if (message.attachments && message.attachments.length > 0) {
    message.attachments.forEach((attachment) => {
      console.log("Attachment:", attachment.originalname);
      console.log("Download URL:", attachment.url);
    });
  }
});

socket.on("send_message_error", (data) => {
  console.error("Failed to send message:", data.message);
});
```

## Typing Indicators

### Start Typing

```javascript
socket.emit("typing_start", {
  ticketId: "ticket-id-here",
});
```

### Stop Typing

```javascript
socket.emit("typing_stop", {
  ticketId: "ticket-id-here",
});
```

### Receiving Typing Events

```javascript
socket.on("user_typing", (data) => {
  console.log(`${data.userName} is typing...`);
});

socket.on("user_stopped_typing", (data) => {
  console.log(`${data.userName} stopped typing`);
});
```

## Message Object Structure

```javascript
{
    "_id": "message-id",
    "ticketId": "ticket-id",
    "sender": {
        "_id": "user-id",
        "name": "User Name",
        "email": "user@example.com",
        "company": "Company Name" // For clients
    },
    "senderModel": "Client" | "SuperAdmin",
    "message": "Message text content",
    "attachments": [
        {
            "filename": "unique-filename.jpg",
            "originalname": "original-filename.jpg",
            "mimetype": "image/jpeg",
            "size": 1234567,
            "path": "/uploads/chat/unique-filename.jpg",
            "url": "http://server.com/uploads/chat/unique-filename.jpg",
            "uploadedAt": "2025-06-29T10:30:00.000Z"
        }
    ],
    "createdAt": "2025-06-29T10:30:00.000Z"
}
```

## Error Handling

Common error events to handle:

```javascript
socket.on("authentication_error", (data) => {
  // Handle authentication failures
});

socket.on("join_ticket_error", (data) => {
  // Handle ticket access errors
});

socket.on("messages_error", (data) => {
  // Handle message loading errors
});

socket.on("send_message_error", (data) => {
  // Handle message sending errors
});

socket.on("disconnect", () => {
  // Handle connection loss
  // Implement reconnection logic
});
```

## Best Practices

### 1. Typing Indicators

Implement typing indicators with debouncing:

```javascript
let typingTimer = null;

messageInput.addEventListener("input", () => {
  if (currentTicketId) {
    socket.emit("typing_start", { ticketId: currentTicketId });

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit("typing_stop", { ticketId: currentTicketId });
    }, 1000); // Stop typing after 1 second of inactivity
  }
});
```

### 2. File Size Limits

The server accepts files up to 10MB. Check file sizes before sending:

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  alert("File too large. Maximum size is 10MB.");
  return;
}
```

### 3. Reconnection

Handle connection drops gracefully:

```javascript
socket.on("disconnect", () => {
  console.log("Connection lost. Attempting to reconnect...");
  // Socket.IO automatically attempts reconnection
});

socket.on("connect", () => {
  console.log("Reconnected!");
  // Re-authenticate and rejoin rooms
  if (authToken) {
    socket.emit("authenticate", { token: authToken });
  }
});
```

### 4. Message Queuing

For better UX, show optimistic updates and queue failed messages:

```javascript
function sendMessageWithRetry(messageData, retries = 3) {
  // Add message to UI immediately (optimistic update)
  addMessageToUI(messageData, "sending");

  socket.emit("send_message", messageData);

  // Handle errors with retry logic
  const errorHandler = (error) => {
    if (retries > 0) {
      setTimeout(() => {
        sendMessageWithRetry(messageData, retries - 1);
      }, 1000);
    } else {
      updateMessageStatus(messageData.id, "failed");
    }
  };

  socket.once("send_message_error", errorHandler);
  socket.once("new_message", () => {
    // Message sent successfully
    updateMessageStatus(messageData.id, "sent");
    socket.off("send_message_error", errorHandler);
  });
}
```

## Migration from HTTP

If you're migrating from HTTP-based chat:

### Old HTTP Approach:

```javascript
// DON'T USE - This is the old HTTP method
fetch("/api/tickets/123/chat", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello" }),
});
```

### New WebSocket Approach:

```javascript
// USE THIS - New WebSocket method
socket.emit("send_message", {
  ticketId: "123",
  message: "Hello",
});
```

## Security Notes

1. **Authentication**: All operations require valid JWT tokens
2. **Authorization**: Users can only access tickets they own (clients) or all tickets (super admins)
3. **File Upload**: Files are scanned for malicious content and stored securely
4. **Rate Limiting**: WebSocket connections have built-in rate limiting
5. **Validation**: All inputs are validated server-side

## Example Implementation

See `examples/websocket-chat-client.html` for a complete working example that demonstrates all features.

## Troubleshooting

### Common Issues:

1. **"User not authenticated"**: Ensure you call `authenticate` event after connecting
2. **"Access denied to this ticket"**: User doesn't have permission to access the ticket
3. **"Message or at least one file is required"**: Send either text message or file attachments
4. **File upload fails**: Check file size (max 10MB) and ensure proper base64 encoding
5. **Messages not received**: Ensure you've joined the ticket room first

### Debug Mode:

Enable debug logging:

```javascript
localStorage.debug = "socket.io-client:socket";
```

This will show detailed WebSocket communication in the browser console.
