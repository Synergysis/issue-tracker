const jwt = require('jsonwebtoken');
const Client = require('../models/clientmodel');
const SuperAdmin = require('../models/superadminmodel');
const TicketChat = require('../models/ticketchatmodel');
const Ticket = require('../models/ticketmodel');
const WebSocketAuthMiddleware = require('../middleware/wsAuthMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> { userId, userType, ticketIds: Set() }
    this.ticketRooms = new Map(); // ticketId -> Set of socketIds
    this.rateLimiter = WebSocketAuthMiddleware.createRateLimiter();

    // Clean up rate limiter every 5 minutes
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }

  // Authenticate socket connection using the middleware
  async authenticateSocket(socket, token) {
    try {
      this.rateLimiter.checkLimit(socket.id);
      return await WebSocketAuthMiddleware.authenticateSocket(token);
    } catch (error) {
      throw error;
    }
  }

  // Join ticket room with improved error handling
  async joinTicketRoom(socket, ticketId, userId, userType) {
    try {
      this.rateLimiter.checkLimit(socket.id);

      // Verify user has access to this ticket
      const ticket = await WebSocketAuthMiddleware.verifyTicketAccess(ticketId, userId, userType);

      // Join the socket room
      socket.join(`ticket_${ticketId}`);

      // Track user in ticket room
      if (!this.ticketRooms.has(ticketId)) {
        this.ticketRooms.set(ticketId, new Set());
      }
      this.ticketRooms.get(ticketId).add(socket.id);

      // Update connected users
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.ticketIds.add(ticketId);
      }

      // Notify other users in the room
      socket.to(`ticket_${ticketId}`).emit('user_joined_ticket', {
        userId: userId,
        userName: userInfo?.user?.name || 'Unknown User',
        ticketId: ticketId
      });

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  // Leave ticket room with notifications
  leaveTicketRoom(socket, ticketId) {
    const userInfo = this.connectedUsers.get(socket.id);

    socket.leave(`ticket_${ticketId}`);

    // Remove from tracking
    if (this.ticketRooms.has(ticketId)) {
      this.ticketRooms.get(ticketId).delete(socket.id);
      if (this.ticketRooms.get(ticketId).size === 0) {
        this.ticketRooms.delete(ticketId);
      }
    }

    if (userInfo) {
      userInfo.ticketIds.delete(ticketId);

      // Notify other users in the room
      socket.to(`ticket_${ticketId}`).emit('user_left_ticket', {
        userId: userInfo.userId,
        userName: userInfo.user?.name || 'Unknown User',
        ticketId: ticketId
      });
    }
  }

  // Get chat messages for a ticket with improved access control
  async getTicketMessages(ticketId, userId, userType) {
    try {
      // Verify access
      await WebSocketAuthMiddleware.verifyTicketAccess(ticketId, userId, userType);

      const messages = await TicketChat.find({ ticketId })
        .sort({ createdAt: 1 })
        .populate('sender', '_id name email company')
        .lean();

      // Add asset URLs to attachments
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

      const messagesWithAssetUrls = messages.map((msg) => {
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments = msg.attachments.map((att) => {
            // Ensure consistent URL format
            let url;
            if (att.path) {
              const normalizedPath = att.path.replace(/\\/g, '/');
              const uploadsIdx = normalizedPath.indexOf('/uploads/');
              let relativePath;
              if (uploadsIdx !== -1) {
                relativePath = normalizedPath.slice(uploadsIdx);
              } else {
                const uploadsDir = path.resolve(__dirname, '../uploads').replace(/\\/g, '/');
                const rel = path.relative(uploadsDir, normalizedPath).replace(/\\/g, '/');
                relativePath = '/uploads/' + rel;
              }
              url = `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
            }
            // Use a consistent 'url' property for all attachments
            return { ...att, url };
          });
        }
        return msg;
      });

      return messagesWithAssetUrls;
    } catch (error) {
      throw error;
    }
  }

  // Save uploaded file with better error handling
  async saveUploadedFile(fileData, originalName, mimetype) {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/chat');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 9);
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext).substring(0, 50); // Limit filename length
      const filename = `${timestamp}_${randomStr}_${baseName}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      // Write file with error handling
      fs.writeFileSync(filePath, fileData);

      // Verify file was written correctly
      if (!fs.existsSync(filePath)) {
        throw new Error('File was not saved correctly');
      }

      return {
        filename,
        originalname: originalName,
        mimetype,
        size: fileData.length,
        path: filePath.replace(/\\/g, '/'),
        uploadedAt: new Date()
      };
    } catch (error) {
      throw new Error('Failed to save file: ' + error.message);
    }
  }

  // Post a new chat message with comprehensive validation
  async postMessage(socketId, ticketId, userId, userType, messageData) {
    try {
      this.rateLimiter.checkLimit(socketId);

      // Validate message data
      const validatedData = WebSocketAuthMiddleware.validateMessageData(messageData);
      const { message, attachments: fileAttachments = [] } = validatedData;

      // Verify access
      await WebSocketAuthMiddleware.verifyTicketAccess(ticketId, userId, userType);

      // Sanitize message content
      const sanitizedMessage = WebSocketAuthMiddleware.sanitizeMessage(message);

      // Process file attachments
      let attachments = [];
      if (fileAttachments && fileAttachments.length > 0) {
        for (const fileData of fileAttachments) {
          const { data, name, type } = fileData;
          const buffer = Buffer.from(data, 'base64');
          const savedFile = await this.saveUploadedFile(buffer, name, type);

          // Generate and add a proper URL for the file
          const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
          const normalizedPath = savedFile.path.replace(/\\/g, '/');
          const uploadsIdx = normalizedPath.indexOf('/uploads/');
          let relativePath;

          if (uploadsIdx !== -1) {
            relativePath = normalizedPath.slice(uploadsIdx);
          } else {
            const uploadsDir = path.resolve(__dirname, '../uploads').replace(/\\/g, '/');
            const rel = path.relative(uploadsDir, normalizedPath).replace(/\\/g, '/');
            relativePath = '/uploads/' + rel;
          }

          savedFile.url = `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
          attachments.push(savedFile);
        }
      }

      // Create chat message
      const chat = await TicketChat.create({
        ticketId,
        sender: userId,
        senderModel: userType,
        message: sanitizedMessage,
        attachments
      });

      await chat.populate('sender', '_id name email company');

      // Add URLs to attachments for frontend
      if (chat.attachments && chat.attachments.length > 0) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        chat.attachments = chat.attachments.map((att) => {
          let url = null;
          let pathField = att.path;
          if (att.path) {
            const normalized = att.path.replace(/\\/g, '/');
            const match = normalized.match(/uploads\/(.+)$/i);
            if (match) {
              url = `${baseUrl}/uploads/${match[1]}`;
              pathField = `/uploads/${match[1]}`;
            }
          }
          return {
            ...att.toObject(),
            url,
            path: pathField
          };
        });
      }

      // Create the message object to broadcast
      const messageToSend = {
        _id: chat._id,
        ticketId: chat.ticketId,
        sender: chat.sender,
        senderModel: chat.senderModel,
        message: chat.message,
        attachments: chat.attachments,
        createdAt: chat.createdAt
      };

      // Broadcast to all users in the ticket room
      this.io.to(`ticket_${ticketId}`).emit('new_message', {
        success: true,
        data: messageToSend
      });

      return chat;
    } catch (error) {
      throw error;
    }
  }

  // Get online users in a ticket
  getOnlineUsersInTicket(ticketId) {
    const roomSockets = this.ticketRooms.get(ticketId) || new Set();
    const onlineUsers = [];

    for (const socketId of roomSockets) {
      const userInfo = this.connectedUsers.get(socketId);
      if (userInfo) {
        onlineUsers.push({
          userId: userInfo.userId,
          userName: userInfo.user.name,
          userType: userInfo.userType
        });
      }
    }

    return onlineUsers;
  }

  // Notify all clients about a new ticket
  notifyNewTicket(ticket, companyId) {
    try {
      console.log('Emitting ticket_created event:', ticket._id);

      // Broadcast to all authenticated clients from the same company
      for (const [socketId, userInfo] of this.connectedUsers.entries()) {
        // Send to the client who created the ticket
        if (userInfo.userId === ticket.clientId.toString()) {
          this.io.to(socketId).emit('ticket_created', {
            ticketId: ticket._id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt
          });
        }

        // Send to superadmins (if we need to notify them too)
        if (userInfo.userType === 'SuperAdmin') {
          this.io.to(socketId).emit('ticket_created', {
            ticketId: ticket._id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            clientId: ticket.clientId,
            companyId: ticket.companyId
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending ticket_created notification:', error);
      return false;
    }
  }

  // Handle socket connection with comprehensive event handling
  handleConnection(socket) {
    console.log('New WebSocket connection:', socket.id);

    // Set disconnect timeout (24 hours)
    const disconnectTimer = setTimeout(() => {
      socket.disconnect(true);
      console.log(`Socket ${socket.id} disconnected after 24 hours.`);
    }, 24 * 60 * 60 * 1000);

    // Authentication event
    socket.on('authenticate', async ({ token }) => {
      try {
        const { user, userType } = await this.authenticateSocket(socket, token);

        this.connectedUsers.set(socket.id, {
          userId: user._id.toString(),
          userType,
          user,
          ticketIds: new Set()
        });

        socket.emit('authenticated', {
          success: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            company: user.company,
            type: userType
          }
        });

        console.log(`User authenticated: ${user.name} (${userType}) - Socket: ${socket.id}`);
      } catch (error) {
        socket.emit('authentication_error', {
          success: false,
          message: error.message
        });
        console.log('Authentication failed for socket:', socket.id, error.message);
      }
    });

    // Join ticket room
    socket.on('join_ticket', async ({ ticketId }) => {
      try {
        const userInfo = this.connectedUsers.get(socket.id);
        if (!userInfo) {
          throw new Error('User not authenticated');
        }

        const ticket = await this.joinTicketRoom(socket, ticketId, userInfo.userId, userInfo.userType);

        socket.emit('joined_ticket', {
          success: true,
          ticketId,
          ticket: {
            id: ticket._id,
            title: ticket.title,
            status: ticket.status
          }
        });

        // Send list of online users
        const onlineUsers = this.getOnlineUsersInTicket(ticketId);
        socket.emit('online_users', {
          ticketId,
          users: onlineUsers
        });

        console.log(`User ${userInfo.user.name} joined ticket ${ticketId}`);
      } catch (error) {
        socket.emit('join_ticket_error', {
          success: false,
          message: error.message
        });
        console.log(`Failed to join ticket: ${error.message}`);
      }
    });

    // Leave ticket room
    socket.on('leave_ticket', ({ ticketId }) => {
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo && userInfo.ticketIds.has(ticketId)) {
        this.leaveTicketRoom(socket, ticketId);
        socket.emit('left_ticket', {
          success: true,
          ticketId
        });
        console.log(`User ${userInfo.user.name} left ticket ${ticketId}`);
      }
    });

    // Get ticket messages
    socket.on('get_messages', async ({ ticketId, limit = 50, offset = 0 }) => {
      try {
        const userInfo = this.connectedUsers.get(socket.id);
        if (!userInfo) {
          throw new Error('User not authenticated');
        }

        const messages = await this.getTicketMessages(ticketId, userInfo.userId, userInfo.userType);

        // Apply pagination
        const paginatedMessages = messages.slice(offset, offset + limit);

        socket.emit('messages_loaded', {
          success: true,
          ticketId,
          messages: paginatedMessages,
          total: messages.length,
          hasMore: offset + limit < messages.length
        });
      } catch (error) {
        socket.emit('messages_error', {
          success: false,
          message: error.message
        });
        console.log(`Failed to load messages: ${error.message}`);
      }
    });

    // Send message
    socket.on('send_message', async ({ ticketId, message, attachments }) => {
      try {
        const userInfo = this.connectedUsers.get(socket.id);
        if (!userInfo) {
          throw new Error('User not authenticated');
        }

        await this.postMessage(socket.id, ticketId, userInfo.userId, userInfo.userType, {
          message,
          attachments
        });

        // Response is handled by the broadcast in postMessage
      } catch (error) {
        socket.emit('send_message_error', {
          success: false,
          message: error.message,
          ticketId
        });
        console.log(`Failed to send message: ${error.message}`);
      }
    });

    // Handle typing indicators with debouncing
    let typingTimeouts = new Map();

    socket.on('typing_start', ({ ticketId }) => {
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo && userInfo.ticketIds.has(ticketId)) {
        socket.to(`ticket_${ticketId}`).emit('user_typing', {
          userId: userInfo.userId,
          userName: userInfo.user.name,
          ticketId
        });

        // Auto-stop typing after 3 seconds
        if (typingTimeouts.has(socket.id)) {
          clearTimeout(typingTimeouts.get(socket.id));
        }

        const timeout = setTimeout(() => {
          socket.to(`ticket_${ticketId}`).emit('user_stopped_typing', {
            userId: userInfo.userId,
            ticketId
          });
          typingTimeouts.delete(socket.id);
        }, 3000);

        typingTimeouts.set(socket.id, timeout);
      }
    });

    socket.on('typing_stop', ({ ticketId }) => {
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo && userInfo.ticketIds.has(ticketId)) {
        socket.to(`ticket_${ticketId}`).emit('user_stopped_typing', {
          userId: userInfo.userId,
          ticketId
        });

        if (typingTimeouts.has(socket.id)) {
          clearTimeout(typingTimeouts.get(socket.id));
          typingTimeouts.delete(socket.id);
        }
      }
    });

    // Get online users in ticket
    socket.on('get_online_users', ({ ticketId }) => {
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo && userInfo.ticketIds.has(ticketId)) {
        const onlineUsers = this.getOnlineUsersInTicket(ticketId);
        socket.emit('online_users', {
          ticketId,
          users: onlineUsers
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      clearTimeout(disconnectTimer);

      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo) {
        // Leave all ticket rooms
        userInfo.ticketIds.forEach(ticketId => {
          this.leaveTicketRoom(socket, ticketId);
        });

        this.connectedUsers.delete(socket.id);
        console.log(`User ${userInfo.user.name} disconnected (Socket: ${socket.id})`);
      } else {
        console.log('Unknown user disconnected:', socket.id);
      }

      // Clean up typing timeouts
      if (typingTimeouts.has(socket.id)) {
        clearTimeout(typingTimeouts.get(socket.id));
        typingTimeouts.delete(socket.id);
      }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }
}

module.exports = WebSocketService;
