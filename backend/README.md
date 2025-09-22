# WebSocket Chat System

This project has been upgraded to use WebSocket-based real-time chat instead of HTTP requests for all chat functionality.

## 🚀 Features

- **Real-time messaging**: Instant message delivery using WebSockets
- **File uploads**: Support for multiple file attachments
- **Typing indicators**: Real-time typing status
- **User presence**: Online/offline status tracking
- **Room-based chat**: Ticket-based conversation rooms
- **Authentication**: JWT-based secure authentication
- **Rate limiting**: Built-in protection against spam
- **Message history**: Persistent chat history with pagination
- **Cross-platform**: Works on web, mobile, and desktop

## 📋 Migration from HTTP

### ❌ Old HTTP Method (Don't use)

```javascript
// DON'T USE - This is the old HTTP approach
fetch("/api/tickets/123/chat", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello" }),
});
```

### ✅ New WebSocket Method (Use this)

```javascript
// USE THIS - New WebSocket approach
const socket = io("http://localhost:5000");

// Authenticate
socket.emit("authenticate", { token: "your-jwt-token" });

// Join ticket room
socket.emit("join_ticket", { ticketId: "123" });

// Send message
socket.emit("send_message", {
  ticketId: "123",
  message: "Hello",
});
```

## 🔧 Setup & Installation

1. **Dependencies are already installed**

   ```bash
   npm install  # Already includes socket.io
   ```

2. **Start the server**

   ```bash
   npm start    # or npm run dev for development
   ```

3. **Server runs on**: http://localhost:5000

## 🧪 Testing

### Automated Test

```bash
npm test:websocket
```

### Manual Testing

1. Open `examples/websocket-chat-client.html` in your browser
2. Enter your JWT token
3. Join a ticket
4. Start chatting!

### Test Script

Update `test/websocket-chat-test.js` with valid tokens and ticket IDs, then run:

```bash
node test/websocket-chat-test.js
```

## 📚 WebSocket Events API

### Authentication

```javascript
// Authenticate with JWT token
socket.emit("authenticate", { token: "your-jwt-token" });

// Success response
socket.on("authenticated", (data) => {
  console.log("User:", data.user);
});

// Error response
socket.on("authentication_error", (data) => {
  console.error("Auth failed:", data.message);
});
```

### Ticket Management

```javascript
// Join a ticket room
socket.emit("join_ticket", { ticketId: "ticket-id" });

// Success response
socket.on("joined_ticket", (data) => {
  console.log("Joined:", data.ticketId);
});

// Leave a ticket room
socket.emit("leave_ticket", { ticketId: "ticket-id" });
```

### Messaging

```javascript
// Load message history
socket.emit("get_messages", {
  ticketId: "ticket-id",
  limit: 50, // optional, default 50
  offset: 0, // optional, default 0
});

// Send text message
socket.emit("send_message", {
  ticketId: "ticket-id",
  message: "Hello world!",
});

// Send message with files
socket.emit("send_message", {
  ticketId: "ticket-id",
  message: "Check this file!",
  attachments: [
    {
      name: "document.pdf",
      type: "application/pdf",
      data: "base64-encoded-file-data",
    },
  ],
});

// Receive new messages
socket.on("new_message", (data) => {
  const message = data.data;
  console.log("New message:", message);
});
```

### Typing Indicators

```javascript
// Start typing
socket.emit("typing_start", { ticketId: "ticket-id" });

// Stop typing
socket.emit("typing_stop", { ticketId: "ticket-id" });

// Receive typing events
socket.on("user_typing", (data) => {
  console.log(`${data.userName} is typing...`);
});

socket.on("user_stopped_typing", (data) => {
  console.log(`${data.userName} stopped typing`);
});
```

### User Presence

```javascript
// Get online users
socket.emit("get_online_users", { ticketId: "ticket-id" });

// Receive online users list
socket.on("online_users", (data) => {
  console.log("Online users:", data.users);
});

// User joined/left events
socket.on("user_joined_ticket", (data) => {
  console.log(`${data.userName} joined`);
});

socket.on("user_left_ticket", (data) => {
  console.log(`${data.userName} left`);
});
```

## 🏗️ Architecture

### Server Structure

```
websocket/
├── websocketService.js     # Main WebSocket service
middleware/
├── wsAuthMiddleware.js     # WebSocket authentication
server.js                   # Server setup with WebSocket
```

### Key Components

1. **WebSocketService**: Main service handling all chat operations
2. **wsAuthMiddleware**: Authentication and authorization
3. **Rate Limiting**: Prevents spam and abuse
4. **File Upload**: Handles file attachments via base64 encoding
5. **Room Management**: Manages ticket-based chat rooms

## 🔒 Security Features

- **JWT Authentication**: All operations require valid tokens
- **Authorization**: Users can only access their tickets
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Protection against spam and abuse
- **File Size Limits**: Maximum 10MB per file
- **XSS Protection**: Messages are sanitized before storage

## 📱 Client Integration

### JavaScript/TypeScript

```javascript
import io from "socket.io-client";

class ChatClient {
  constructor(token) {
    this.socket = io("http://localhost:5000");
    this.authenticate(token);
  }

  authenticate(token) {
    this.socket.emit("authenticate", { token });
    this.socket.on("authenticated", (data) => {
      console.log("Ready to chat!");
    });
  }

  joinTicket(ticketId) {
    this.socket.emit("join_ticket", { ticketId });
  }

  sendMessage(ticketId, message) {
    this.socket.emit("send_message", { ticketId, message });
  }
}
```

### React Integration

```jsx
import { useEffect, useState } from "react";
import io from "socket.io-client";

export function useWebSocketChat(token, ticketId) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("authenticated", () => {
      newSocket.emit("join_ticket", { ticketId });
    });

    newSocket.on("new_message", (data) => {
      setMessages((prev) => [...prev, data.data]);
    });

    newSocket.emit("authenticate", { token });

    return () => newSocket.close();
  }, [token, ticketId]);

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.emit("send_message", { ticketId, message });
    }
  };

  return { socket, messages, isConnected, sendMessage };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"User not authenticated"**

   - Ensure you call `authenticate` event after connecting
   - Check that your JWT token is valid and not expired

2. **"Access denied to this ticket"**

   - User doesn't have permission to access the ticket
   - Verify the ticket ID is correct and belongs to the user

3. **Messages not received**

   - Ensure you've joined the ticket room first
   - Check that the WebSocket connection is established

4. **File upload fails**
   - Check file size (max 10MB)
   - Ensure proper base64 encoding
   - Verify file type is supported

### Debug Mode

Enable debug logging:

```javascript
localStorage.debug = "socket.io-client:socket";
```

### Server Logs

Check server console for detailed error messages and connection logs.

## 📈 Performance

- **Concurrent Users**: Supports thousands of concurrent connections
- **Message Throughput**: Handles hundreds of messages per second
- **File Upload**: Efficient base64 processing with streaming
- **Memory Usage**: Optimized connection and room management
- **Scalability**: Ready for horizontal scaling with Redis adapter

## 🔮 Future Enhancements

- [ ] Message encryption
- [ ] Voice/video calling
- [ ] Screen sharing
- [ ] Message search
- [ ] Message reactions/emojis
- [ ] Thread/reply support
- [ ] Push notifications
- [ ] Offline message queueing
- [ ] Multi-language support
- [ ] Custom themes

## 📄 Documentation

- `WEBSOCKET_CHAT_API.md` - Complete API documentation
- `examples/websocket-chat-client.html` - Working example
- `test/websocket-chat-test.js` - Test script

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Test with the provided examples
4. Check server logs for error details

---

**Note**: The old HTTP chat endpoints are still available for backward compatibility but are deprecated. Please migrate to the WebSocket system for the best performance and features.
