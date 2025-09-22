# Issue Tracker Frontend - Knowledge Transfer Document

## Project Overview

This is a React-based frontend application for an issue tracking system built using modern web technologies. The system supports multiple user roles (clients, admins, super admins) with role-based access control and real-time communication features.

### Project Details
- **Project Name**: Issue Tracker Frontend
- **Repository**: issue-tracker-frontend
- **Branch**: main
- **Framework**: React 19.1.0 with Vite
- **Language**: JavaScript (ES6+)
- **UI Framework**: Tailwind CSS + Ant Design
- **State Management**: Zustand

## Technology Stack

### Core Technologies
- **React**: 19.1.0 - Main UI framework
- **Vite**: 6.3.5 - Build tool and development server
- **React Router DOM**: 7.6.0 - Client-side routing
- **Tailwind CSS**: 4.1.7 - Utility-first CSS framework
- **Ant Design**: 5.25.2 - UI component library

### State Management & Data Fetching
- **Zustand**: 5.0.5 - Lightweight state management
- **Axios**: 1.9.0 - HTTP client for API calls

### Real-time Communication
- **Socket.io Client**: 4.8.1 - WebSocket client for real-time features

### UI Enhancement
- **Framer Motion**: 12.15.0 - Animation library
- **Lucide React**: 0.511.0 - Icon library
- **React Icons**: 5.5.0 - Additional icon library

### Development Tools
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Project Structure

```
frontend/
├── public/                          # Static assets
│   └── 311447951_460858929487700_1968813450344567263_n.png
├── src/
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # Application entry point
│   ├── App.css                      # Global styles
│   ├── index.css                    # Base styles with Tailwind imports
│   │
│   ├── api/                         # API layer
│   │   ├── apiService.js            # Main API service with axios instance
│   │   ├── authAPI.js               # Authentication API endpoints
│   │   └── axiosInstance.js         # Axios configuration
│   │
│   ├── auth/                        # Authentication components & store
│   │   ├── useAuthStore.js          # Zustand auth state management
│   │   ├── Login.jsx                # Client/Admin login form
│   │   ├── AdminLogin.jsx           # Dedicated admin login
│   │   ├── Register.jsx             # Client registration form
│   │   └── ClientPasswordReset.jsx  # Password reset functionality
│   │
│   ├── components/                  # Reusable components
│   │   ├── Navbar.jsx               # Navigation component
│   │   ├── TicketChat.jsx           # Real-time chat component
│   │   ├── TicketList.jsx           # Ticket listing component
│   │   ├── NotificationPanel.jsx    # Client notifications
│   │   └── SuperAdminNotificationPanel.jsx # Admin notifications
│   │
│   ├── layout/                      # Layout components
│   │   ├── ClientLayout.jsx         # Client dashboard layout
│   │   └── SuperAdminLayout.jsx     # Admin dashboard layout
│   │
│   ├── pages/                       # Page components
│   │   ├── client/                  # Client-specific pages
│   │   │   ├── Dashboard.jsx        # Client dashboard
│   │   │   ├── Profile.jsx          # Client profile management
│   │   │   ├── TicketCreate.jsx     # Create new tickets
│   │   │   ├── TicketView.jsx       # View all tickets
│   │   │   └── TicketDetailView.jsx # Detailed ticket view
│   │   │
│   │   └── superadmin/              # Admin-specific pages
│   │       ├── Dashboard.jsx        # Admin dashboard
│   │       ├── ClientsView.jsx      # Manage clients
│   │       ├── ClientDetailView.jsx # Detailed client view
│   │       ├── CompaniesView.jsx    # Manage companies
│   │       ├── CreateCompany.jsx    # Create new company
│   │       ├── EditCompany.jsx      # Edit company details
│   │       ├── CompanyDetailView.jsx # Detailed company view
│   │       ├── TicketsView.jsx      # View all tickets
│   │       └── SuperAdminTicketDetailPage.jsx # Detailed ticket view
│   │
│   ├── routes/                      # Routing configuration
│   │   └── AppRouter.jsx            # Main router with protected routes
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── useNotifications.js      # Notification management hook
│   │
│   └── assets/                      # Static assets
│       ├── front-view-off-office-desk.jpg
│       ├── logo.png
│       └── react.svg
│
├── eslint.config.js                 # ESLint configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── vite.config.js                   # Vite build configuration
├── package.json                     # Project dependencies
├── README.md                        # Project documentation
├── WEBSOCKET_IMPLEMENTATION.md      # WebSocket documentation
├── websocket-test.html              # WebSocket testing tool
└── index.html                       # HTML template
```

## User Roles & Permissions

### 1. Client
- **Access**: `/client/*` routes
- **Capabilities**:
  - Create and manage own tickets
  - View ticket history and status
  - Real-time chat with support team
  - Upload files and attachments
  - Update profile information
  - Reset password via OTP

### 2. Admin
- **Access**: `/superadmin/*` routes
- **Capabilities**:
  - View and manage all tickets
  - Respond to client queries via chat
  - Manage client accounts
  - Update ticket statuses
  - View analytics and reports

### 3. Super Admin
- **Access**: `/superadmin/*` routes
- **Enhanced Capabilities**:
  - All admin capabilities
  - Manage companies
  - Create and edit company information
  - Full system administration

## Key Features

### Authentication System
- **JWT-based authentication** with token storage in localStorage
- **Role-based access control** with protected routes
- **Multi-login support** (client/admin on same page)
- **Password reset** with OTP verification
- **Email verification** for new registrations
- **Session management** with automatic logout on token expiry

### Real-time Communication
- **WebSocket-based chat** using Socket.io
- **Typing indicators** with visual feedback
- **File upload support** (images, videos, documents)
- **Real-time message delivery** with delivery confirmations
- **Connection status** indicators
- **Automatic reconnection** handling

### Ticket Management
- **Create tickets** with title, description, priority, category
- **File attachments** with preview capabilities
- **Status tracking** (open, in-progress, resolved, cancelled)
- **Priority levels** (low, medium, high, urgent)
- **Category classification** (general, technical, billing, etc.)
- **Search and filter** functionality

### UI/UX Features
- **Responsive design** with mobile-first approach
- **Dark/light theme** considerations
- **Loading states** and error handling
- **Animation support** with Framer Motion
- **Gallery view** for media attachments
- **Drag-and-drop** file uploads

## State Management

### Auth Store (Zustand)
Located in `src/auth/useAuthStore.js`

```javascript
{
  user: Object,           // Current user information
  token: String,          // JWT authentication token
  isAuthenticated: Boolean, // Authentication status
  login: Function,        // Login action
  logout: Function,       // Logout action
  setUser: Function,      // Update user data
  initializeAuth: Function, // Initialize from localStorage
  refreshUser: Function   // Refresh user data
}
```

## API Integration

### Base Configuration
- **Base URL**: Configurable via environment variables
- **Timeout**: 10 seconds
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Automatic 401 redirect to login

### Key API Endpoints

#### Authentication
- `POST /client/login` - Client login
- `POST /superadmin/login` - Admin login
- `POST /client/register` - Client registration
- `POST /client/request-password-reset` - Request OTP
- `POST /client/reset-password` - Reset password with OTP

#### Tickets
- `GET /client/tickets` - Get client tickets
- `POST /client/tickets` - Create new ticket
- `GET /client/tickets/:id` - Get ticket details
- `PUT /client/tickets/:id` - Update ticket

#### File Handling
- File uploads via multipart/form-data
- WebSocket-based file sharing in chat
- Support for images, videos, documents

## WebSocket Implementation

### Connection Management
- **Auto-authentication** on connection
- **Room-based messaging** per ticket
- **Reconnection handling** with retry logic
- **Connection status** indicators

### Events

#### Client to Server
- `authenticate` - Send JWT token
- `join_ticket` - Join ticket room
- `leave_ticket` - Leave ticket room
- `send_message` - Send chat message
- `get_messages` - Request message history
- `typing_start/stop` - Typing indicators

#### Server to Client
- `authenticated` - Authentication success
- `joined_ticket` - Room join success
- `messages_loaded` - Message history
- `new_message` - Real-time message
- `user_typing` - Typing indicator
- `send_message_error` - Send failure

### File Upload via WebSocket
- **Base64 encoding** for binary data
- **Size limits**: 10MB per file
- **Multiple file support**
- **Real-time progress** indicators

## Routing Structure

### Public Routes
- `/login` - Client/Admin login
- `/register` - Client registration
- `/admin/login` - Dedicated admin login
- `/client/password-reset` - Password reset

### Protected Routes (Client)
- `/client/dashboard` - Client dashboard
- `/client/create-ticket` - Create new ticket
- `/client/tickets` - View all tickets
- `/client/tickets/:id` - Ticket details with chat
- `/client/profile` - Profile management

### Protected Routes (Admin/Super Admin)
- `/superadmin/dashboard` - Admin dashboard
- `/superadmin/clients` - Manage clients
- `/superadmin/clients/:id` - Client details
- `/superadmin/tickets` - View all tickets
- `/superadmin/tickets/:id` - Ticket details with chat
- `/superadmin/companies` - Manage companies (Super Admin only)
- `/superadmin/companies/create` - Create company
- `/superadmin/companies/edit/:id` - Edit company
- `/superadmin/companies/:id` - Company details

## Development Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API server running
- Environment variables configured

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Environment Variables
Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

## Common Development Patterns

### Error Handling
```javascript
try {
  const response = await api.get('/endpoint');
  // Handle success
} catch (error) {
  console.error('Error:', error);
  setError(error.response?.data?.message || 'Something went wrong');
}
```

### Loading States
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    // API call
  } finally {
    setLoading(false);
  }
};
```

### Protected Route Usage
```javascript
<ProtectedRoute allowedRoles={['client']}>
  <ClientComponent />
</ProtectedRoute>
```

### WebSocket Event Handling
```javascript
useEffect(() => {
  socket.on('event_name', handleEvent);
  return () => socket.off('event_name');
}, []);
```

## Testing

### WebSocket Testing
Use the provided `websocket-test.html` file:
1. Open in browser
2. Enter backend URL and JWT token
3. Test WebSocket functionality

### Manual Testing Checklist
- [ ] User registration and email verification
- [ ] Login for all user roles
- [ ] Ticket creation with file uploads
- [ ] Real-time chat functionality
- [ ] File sharing in chat
- [ ] Responsive design on mobile
- [ ] Error handling scenarios
- [ ] Route protection

## Deployment Considerations

### Build Configuration
- Vite optimizes bundles automatically
- Environment variables must be prefixed with `VITE_`
- Static assets are processed and optimized

### Production Setup
```bash
# Build for production
npm run build

# Serve built files (dist folder)
# Configure web server to serve index.html for all routes
```

### Security Considerations
- JWT tokens stored securely in localStorage
- API endpoints validate authentication
- File uploads have size and type restrictions
- XSS protection via React's default escaping

## Troubleshooting

### Common Issues

#### Authentication Problems
- Check JWT token validity
- Verify API endpoint URLs
- Ensure proper CORS configuration

#### WebSocket Connection Issues
- Verify WebSocket server is running
- Check network connectivity
- Review browser console for errors

#### File Upload Problems
- Check file size limits (10MB)
- Verify supported file types
- Ensure proper base64 encoding

#### Routing Issues
- Check protected route configurations
- Verify user roles and permissions
- Ensure proper redirect logic

### Debug Tips
- Use browser dev tools for network inspection
- Check localStorage for auth tokens
- Monitor WebSocket connection in Network tab
- Use React Developer Tools for state inspection

## Performance Optimization

### Code Splitting
- Routes are already split using React.lazy (can be implemented)
- Consider component-level splitting for large components

### Asset Optimization
- Images are optimized by Vite
- Consider implementing image compression for uploads
- Use proper caching headers for static assets

### State Management
- Zustand provides minimal re-renders
- Consider memoization for expensive calculations
- Implement proper cleanup in useEffect hooks

## Future Enhancements

### Suggested Improvements
1. **Dark Mode**: Complete theme system implementation
2. **Internationalization**: Multi-language support
3. **Progressive Web App**: Service worker implementation
4. **Advanced Search**: Full-text search with filters
5. **Analytics Dashboard**: Charts and metrics
6. **Email Notifications**: Integration with backend
7. **Keyboard Shortcuts**: Power user features
8. **Mobile App**: React Native implementation

### Technical Debt
1. **TypeScript Migration**: Gradually migrate to TypeScript
2. **Component Library**: Create standardized component library
3. **Testing**: Add unit and integration tests
4. **Documentation**: Component documentation with Storybook
5. **Performance**: Implement virtual scrolling for large lists

## Contact & Support

### Key Personnel
- **Development Team**: [Team Contact Information]
- **Project Manager**: [PM Contact Information]
- **DevOps**: [DevOps Contact Information]

### Documentation
- **API Documentation**: [Backend API Docs]
- **Design System**: [Design Guidelines]
- **Deployment Guide**: [Deployment Documentation]

### Resources
- **Repository**: https://github.com/KGVJWijesooriya/issue-tracker-frontend
- **Issue Tracking**: [Issue Tracker URL]
- **CI/CD Pipeline**: [Pipeline URL]

---

*This document should be updated regularly as the project evolves. Last updated: August 27, 2025*
