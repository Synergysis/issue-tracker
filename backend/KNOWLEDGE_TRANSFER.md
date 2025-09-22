# Issue Tracker Backend - Knowledge Transfer Document

## 🏗️ Project Overview

**Project Name:** Issue Tracker Backend  
**Technology Stack:** Node.js, Express.js, MongoDB, Socket.IO  
**Main Purpose:** Backend API for a ticketing system with real-time chat functionality  
**Current Version:** 1.0.0

### Key Features
- RESTful API for ticket management
- User authentication and authorization (JWT-based)
- Real-time WebSocket chat system
- File upload capabilities
- Multi-role system (Clients, Super Admins)
- Company management
- Email notifications with OTP

---

## 📁 Project Structure

```
backend/
├── config/                    # Configuration files
│   ├── db.js                 # MongoDB connection
│   └── email.js              # Email service configuration
├── controllers/               # Business logic handlers
│   ├── clientcontroller.js   # Client authentication & management
│   ├── companycontroller.js  # Company CRUD operations
│   ├── superadmincontroller.js        # Super admin functions
│   ├── superadminanalyticscontroller.js  # Analytics for dashboard
│   ├── superadminticketcontroller.js     # Admin ticket management
│   ├── ticketchatcontroller.js           # Chat functionality (legacy)
│   └── ticketcontroller.js              # Ticket CRUD operations
├── middleware/                # Custom middleware
│   ├── authMiddleware.js     # JWT authentication
│   ├── chatUpload.js         # File uploads for chat
│   ├── ticketUpload.js       # File uploads for tickets
│   └── wsAuthMiddleware.js   # WebSocket authentication
├── models/                    # MongoDB schemas
│   ├── clientmodel.js        # Client user schema
│   ├── clientotps.js         # OTP storage schema
│   ├── companymodel.js       # Company information schema
│   ├── superadminmodel.js    # Super admin user schema
│   ├── ticketchatmodel.js    # Chat messages schema
│   └── ticketmodel.js        # Ticket schema
├── routes/                    # API route definitions
│   ├── clientroutes.js       # Client endpoints
│   ├── companyroutes.js      # Company management endpoints
│   ├── companyviewroutes.js  # Company view endpoints
│   ├── superadminroutes.js   # Super admin endpoints
│   └── ticketchatroutes.js   # Chat endpoints (legacy)
├── utils/                     # Utility functions
│   ├── emailService.js       # Email sending utilities
│   ├── emailService.example.js  # Email configuration template
│   ├── generateToken.js      # JWT token generation
│   └── otpEmailTemplate.js   # HTML email templates
├── websocket/                 # WebSocket implementation
│   └── websocketService.js   # Real-time chat service
├── scripts/                   # Utility scripts
│   └── health-check.js       # System health checker
├── test/                      # Test files
│   └── websocket-chat-test.js # WebSocket testing script
├── examples/                  # Example implementations
│   └── websocket-chat-client.html # Chat client example
├── uploads/                   # File storage directory
│   └── chat/                 # Chat file uploads
├── server.js                  # Main application entry point
├── package.json              # Dependencies and scripts
├── README.md                 # WebSocket chat documentation
└── WEBSOCKET_CHAT_API.md     # Complete WebSocket API guide
```

---

## 🔑 Core Technologies & Dependencies

### Production Dependencies
```json
{
  "bcryptjs": "^2.4.3",        // Password hashing
  "cors": "^2.8.5",            // Cross-Origin Resource Sharing
  "dotenv": "^16.5.0",         // Environment variables
  "express": "^4.21.2",        // Web framework
  "express-rate-limit": "^6.11.2",  // Rate limiting
  "express-validator": "^7.0.1",    // Input validation
  "jsonwebtoken": "^9.0.2",    // JWT token handling
  "mongoose": "^7.8.7",        // MongoDB ODM
  "multer": "^2.0.0",          // File upload handling
  "nodemailer": "^7.0.3",      // Email sending
  "socket.io": "^4.8.1"        // Real-time communication
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.1",         // Development server
  "socket.io-client": "^4.8.1" // WebSocket client for testing
}
```

---

## 🌐 API Architecture

### Authentication Flow
1. **Client Registration**: POST `/api/client/register`
2. **Admin Approval**: Super admin approves/rejects clients
3. **Login**: POST `/api/client/login` or `/api/superadmin/login`
4. **JWT Token**: Issued upon successful login
5. **Protected Routes**: Require Bearer token in Authorization header

### User Roles
- **Client**: Can create/manage own tickets, participate in chat
- **Super Admin**: Full system access, manage all tickets, users, and companies

### API Base URLs
- Client APIs: `/api/client/*`
- Super Admin APIs: `/api/superadmin/*`
- Company APIs: `/api/company/*` and `/api/companies`

---

## 🎫 Data Models

### Client Schema
```javascript
{
  name: String (required),
  email: String (unique, required),
  password: String (required, hashed),
  company: String,
  companyName: String,
  phone: String,
  status: "pending" | "approved" | "rejected",
  ticketsCount: Number (default: 0),
  joinedDate: Date,
  approvedBy: ObjectId (ref: SuperAdmin),
  approvedAt: Date
}
```

### Ticket Schema
```javascript
{
  title: String (required),
  description: String (required),
  priority: "low" | "medium" | "high" | "urgent",
  category: "general" | "technical" | "billing" | "feature",
  status: "open" | "in-progress" | "resolved" | "closed" | "canceled",
  assignedTo: String,
  clientId: ObjectId (ref: Client),
  companyId: String,
  files: [FileSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Message Schema
```javascript
{
  ticketId: ObjectId (ref: Ticket),
  sender: ObjectId (ref: Client/SuperAdmin),
  senderModel: "Client" | "SuperAdmin",
  message: String,
  attachments: [FileSchema],
  createdAt: Date
}
```

### Company Schema
```javascript
{
  name: String (required),
  address: String,
  contactEmail: String (required),
  companyId: String (unique, auto-generated)
}
```

---

## 🔐 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Expire in 2 days by default
- **Password Hashing**: bcryptjs with salt rounds
- **Route Protection**: Middleware validates tokens on protected routes
- **Role-based Access**: Different permissions for clients vs admins

### File Upload Security
- **Size Limits**: 10MB per file for chat, 50MB for tickets
- **Type Validation**: MIME type checking
- **Storage**: Local filesystem with organized directory structure
- **Access Control**: Files only accessible to authorized users

### Rate Limiting
- **WebSocket Connections**: Built-in rate limiting
- **API Endpoints**: Express rate limiting middleware
- **File Uploads**: Size and count restrictions

---

## 💬 WebSocket Chat System

### Connection Flow
1. **Connect**: Client connects to Socket.IO server
2. **Authenticate**: Send JWT token via `authenticate` event
3. **Join Room**: Join specific ticket room via `join_ticket` event
4. **Real-time Communication**: Send/receive messages instantly

### Key Events
- `authenticate` - User authentication
- `join_ticket` - Join ticket chat room
- `send_message` - Send text/file messages
- `get_messages` - Load message history
- `typing_start`/`typing_stop` - Typing indicators
- `new_message` - Receive new messages

### File Upload via WebSocket
- Files sent as base64-encoded data
- Server processes and stores files
- Returns URL for file access
- Supports multiple attachments per message

---

## 📧 Email System

### Configuration
```javascript
// config/email.js
{
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}
```

### Use Cases
- **Password Reset**: OTP-based password reset
- **Account Notifications**: Registration confirmations
- **Custom Templates**: HTML email templates with branding

---

## 🚀 Deployment & Environment

### Environment Variables
```bash
# Required
MONGO_URI=mongodb://localhost:27017/issuetracker
JWT_SECRET=your-secret-key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=5000
```

### Database Setup
1. **MongoDB**: Requires MongoDB instance (local or cloud)
2. **Collections**: Auto-created by Mongoose schemas
3. **Indexes**: Consider adding indexes for performance:
   - Client.email (unique)
   - Ticket.clientId
   - TicketChat.ticketId
   - Company.companyId (unique)

### File System Requirements
- **uploads/** directory with write permissions
- **uploads/chat/** for chat file storage
- Automatic directory creation on first upload

---

## 🔧 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env  # Edit with your values

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
npm run test:websocket
```

### Testing
- **Health Check**: `node scripts/health-check.js`
- **WebSocket Test**: `npm run test:websocket`
- **Manual Testing**: Open `examples/websocket-chat-client.html`

### API Testing
Use the included Postman collection (`postman_collection.json`) for API testing.

---

## 🛠️ Key Business Logic

### Company ID Generation
```javascript
// Auto-generates unique company IDs
const prefix = name.substring(0, 3).toUpperCase().padEnd(3, "X");
const suffix = randomNumeric(3);
const companyId = prefix + suffix; // e.g., "SYN123"
```

### Ticket Status Workflow
```
open → in-progress → resolved → closed
  ↓         ↓           ↓
canceled  canceled   canceled
```

### File Upload Organization
```
uploads/
├── [clientId]/
│   └── [ticketId]/
│       └── ticket-files...
└── chat/
    └── chat-files...
```

---

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. Database Connection
**Error**: "DB connection error"
**Solution**: 
- Check MongoDB is running
- Verify MONGO_URI in .env file
- Ensure network connectivity

#### 2. JWT Token Issues
**Error**: "No token, authorization denied"
**Solution**:
- Include Authorization header: `Bearer <token>`
- Verify JWT_SECRET is set
- Check token expiration

#### 3. WebSocket Authentication
**Error**: "User not authenticated"
**Solution**:
- Call `authenticate` event after connection
- Verify JWT token is valid
- Check WebSocket connection status

#### 4. File Upload Failures
**Error**: File upload fails
**Solution**:
- Check file size limits (10MB chat, 50MB tickets)
- Verify uploads directory permissions
- Ensure proper base64 encoding for WebSocket uploads

#### 5. Email Service Issues
**Error**: Email not sending
**Solution**:
- Verify EMAIL_* environment variables
- Check Gmail app password (if using Gmail)
- Test with email service provider

### Debug Commands
```bash
# Check system health
node scripts/health-check.js

# Test WebSocket functionality
npm run test:websocket

# Enable Socket.IO debug logs
DEBUG=socket.io* npm start

# MongoDB connection test
node -e "require('./config/db')()"
```

---

## 📈 Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields
- Use pagination for large datasets
- Implement query optimization for analytics

### File Storage
- Consider cloud storage (AWS S3, etc.) for production
- Implement file cleanup for deleted tickets
- Monitor storage usage

### WebSocket Scaling
- Use Redis adapter for multi-server deployments
- Implement connection pooling
- Monitor memory usage for concurrent connections

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Push notifications for mobile apps
- [ ] Advanced file type support (video, documents)
- [ ] Message search functionality
- [ ] Ticket templates
- [ ] Advanced analytics dashboard
- [ ] API rate limiting per user
- [ ] Audit logging for admin actions

### Technical Improvements
- [ ] Database migrations system
- [ ] Automated testing suite
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] API documentation with Swagger
- [ ] Error monitoring (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Code coverage reporting

---

## 📚 Additional Resources

### Documentation Files
- `README.md` - WebSocket chat system overview
- `WEBSOCKET_CHAT_API.md` - Complete WebSocket API documentation
- `examples/websocket-chat-client.html` - Working chat example
- `postman_collection.json` - API testing collection

### External Documentation
- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/) - JWT token debugging

### Support Contacts
- **Development Team**: [Add team contact information]
- **System Admin**: [Add admin contact information]
- **Database Admin**: [Add DBA contact information]

---

## 🏁 Getting Started Checklist

### For New Developers
- [ ] Clone repository
- [ ] Install Node.js (v16+) and MongoDB
- [ ] Set up environment variables
- [ ] Run `npm install`
- [ ] Run health check script
- [ ] Test WebSocket functionality
- [ ] Review API documentation
- [ ] Test with Postman collection

### For System Administrators
- [ ] Set up MongoDB instance
- [ ] Configure email service
- [ ] Set up file storage permissions
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test disaster recovery procedures

### For Frontend Developers
- [ ] Review WebSocket API documentation
- [ ] Test with provided HTML example
- [ ] Understand authentication flow
- [ ] Test file upload functionality
- [ ] Implement error handling
- [ ] Set up development environment

---

**Document Version**: 1.0  
**Last Updated**: August 27, 2025  
**Next Review Date**: November 27, 2025

---

*This knowledge transfer document should be updated regularly as the system evolves. Please contribute to keeping this documentation current and accurate.*
