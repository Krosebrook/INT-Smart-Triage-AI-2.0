# Real-time Notification System Documentation

## Overview

The INT Smart Triage AI 2.0 platform now includes a comprehensive real-time notification system that alerts users when new comments are posted on their ideas or when triage reports are created. The system uses **Server-Sent Events (SSE)** technology for maximum compatibility with Vercel serverless functions.

## Architecture

### System Components

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Client Browser    │    │  Vercel Functions    │    │  Supabase Database  │
│                     │    │                      │    │                     │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────────┐ │
│ │ EventSource     │◄├────┤ │ /api/notifications│ │    │ │ notifications   │ │
│ │ Connection      │ │    │ │ (SSE Endpoint)   │ │    │ │ table           │ │
│ └─────────────────┘ │    │ └──────────────────┘ │    │ └─────────────────┘ │
│                     │    │                      │    │                     │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────────┐ │
│ │ Notification UI │ │    │ │ /api/comments    │◄├────┤ │ comments table  │ │
│ │ (Toast Messages)│ │    │ │ (Event Trigger)  │ │    │ └─────────────────┘ │
│ └─────────────────┘ │    │ └──────────────────┘ │    │                     │
│                     │    │                      │    │ ┌─────────────────┐ │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ │ reports table   │ │
│ │ Connection      │ │    │ │ /api/triage-     │◄├────┤ │ (existing)      │ │
│ │ Status          │ │    │ │ report           │ │    │ └─────────────────┘ │
│ └─────────────────┘ │    │ │ (Event Trigger)  │ │    │                     │
└─────────────────────┘    │ └──────────────────┘ │    └─────────────────────┘
                           └──────────────────────┘
```

### Data Flow

1. **Event Trigger**: A new comment is posted or triage report is created
2. **Notification Creation**: The API endpoint creates a notification payload
3. **Database Logging**: Notification is stored in the database (optional)
4. **Broadcasting**: Notification is sent to all connected SSE clients
5. **Client Display**: Browser receives notification and displays it to user
6. **Auto-cleanup**: Notification auto-hides after timeout

## Implementation Details

### Server-Side Components

#### 1. Notifications API (`/api/notifications.js`)

**Purpose**: Manages SSE connections and broadcasts notifications

**Endpoints**:
- `GET /api/notifications?clientId=xxx&userId=yyy` - Establishes SSE connection
- `POST /api/notifications` - Broadcasts notification to connected clients

**Key Features**:
- Server-Sent Events (SSE) for real-time communication
- Connection management with automatic cleanup
- Heartbeat mechanism (30-second intervals)
- User targeting support
- Database logging of notifications
- CORS support for cross-origin requests

**Example SSE Connection**:
```javascript
const eventSource = new EventSource('/api/notifications?clientId=client123&userId=user456');

eventSource.onmessage = function(event) {
    const notification = JSON.parse(event.data);
    console.log('Received:', notification);
};
```

#### 2. Comments API (`/api/comments.js`)

**Purpose**: Handles comment creation and triggers notifications

**Endpoints**:
- `POST /api/comments` - Creates new comment and triggers notification
- `GET /api/comments?ideaId=xxx` - Retrieves comments for an idea

**Notification Trigger**:
When a new comment is created, it automatically sends a notification to the idea owner:
```javascript
{
    type: 'new_comment',
    message: 'New comment on your idea "IDEA-001" by john_doe',
    data: {
        ideaId: 'IDEA-001',
        commentId: 'CMT-123',
        userId: 'john_doe',
        commentText: 'Great idea! I have some suggestions...',
        timestamp: '2024-01-01T12:00:00Z'
    },
    targetUserId: 'idea_owner'
}
```

#### 3. Enhanced Triage Report API (`/api/triage-report.js`)

**Enhancement**: Now triggers notifications when triage reports are completed

**Notification Example**:
```javascript
{
    type: 'new_triage_report',
    message: 'New triage report created for Jane Smith: Login Issues',
    data: {
        reportId: 'TR-123',
        customerName: 'Jane Smith',
        ticketSubject: 'Login Issues',
        priority: 'high',
        confidence: '92%',
        csrAgent: 'CSR_USER'
    },
    targetUserId: 'CSR_USER'
}
```

### Client-Side Components

#### 1. Notification System JavaScript

**Key Functions**:
- `initializeNotificationSystem()` - Sets up SSE connection
- `connectToNotifications(userId)` - Establishes connection with reconnection logic
- `handleNotification(notification)` - Processes incoming notifications
- `showNotification(notification)` - Displays notification in UI
- `hideNotification(notificationId)` - Removes notification from UI

**Auto-Reconnection**: 
- Exponential backoff strategy (3, 6, 9, 12, 15 seconds)
- Maximum 5 reconnection attempts
- Connection status indicator updates in real-time

#### 2. Notification UI Components

**CSS Classes**:
- `.notification-container` - Fixed container for notifications
- `.notification` - Individual notification styling
- `.notification.show` - Animation for showing notifications
- `.notification.hide` - Animation for hiding notifications
- `.connection-status` - Connection status indicator

**Visual Features**:
- Smooth slide-in animations from the right
- Color-coded notification types (comment: blue, triage: green, system: gray)
- Auto-hide after 10 seconds
- Manual close buttons
- Connection status indicator (bottom-left)
- Sound alerts for new notifications

### Database Schema

#### Notifications Table
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    target_user_id VARCHAR(100),
    broadcast_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Comments Table
```sql
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    comment_id VARCHAR(50) UNIQUE NOT NULL,
    idea_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage Examples

### 1. Testing the System

Visit the demo page: `/public/notifications-demo.html`

**Demo Features**:
- Connection management controls
- Test notification buttons
- Real-time connection status
- Message logging and statistics

### 2. Integrating Notifications

**Trigger a custom notification**:
```javascript
fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        type: 'custom',
        message: 'Your custom notification message',
        data: {
            customField1: 'value1',
            customField2: 'value2'
        },
        targetUserId: 'specific_user' // Optional: target specific user
    })
});
```

**Create a comment (auto-triggers notification)**:
```javascript
fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ideaId: 'IDEA-001',
        userId: 'commenter_id',
        commentText: 'This is my comment',
        ideaOwnerId: 'owner_user_id'
    })
});
```

### 3. Handling Notifications Client-Side

```javascript
// Initialize the notification system
initializeNotificationSystem();

// Custom notification handler
eventSource.onmessage = function(event) {
    const notification = JSON.parse(event.data);
    
    if (notification.type === 'new_comment') {
        // Handle comment notifications
        updateCommentBadge();
        playNotificationSound();
    } else if (notification.type === 'new_triage_report') {
        // Handle triage report notifications
        refreshDashboard();
    }
};
```

## Security Considerations

### Row Level Security (RLS)
- All database tables have RLS enabled
- Public access is denied by default
- Only service role can read/write data
- Server-side validation of all inputs

### Input Sanitization
- All user inputs are sanitized and truncated
- XSS protection with proper encoding
- CSRF protection with security headers
- Content-Type validation

### Connection Security
- HTTPS enforcement in production
- CORS headers properly configured
- Connection limits to prevent DoS
- Heartbeat mechanism prevents hung connections

## Scalability Features

### Performance Optimizations
- SSE instead of WebSockets for serverless compatibility
- Connection pooling and cleanup
- Message queuing for high-traffic scenarios
- Database indexing for fast queries

### Multi-User Support
- User-specific targeting for notifications
- Connection tracking by client ID
- Broadcast to all users or specific users
- Session isolation and cleanup

### Error Handling
- Graceful degradation if notifications fail
- Retry logic for failed connections
- Fallback mechanisms for offline scenarios
- Comprehensive logging for debugging

## Monitoring and Maintenance

### Health Checks
- Monitor `/api/health-check` endpoint
- Check SSE connection stability
- Database performance monitoring
- Error rate tracking

### Metrics to Track
- Active SSE connections
- Notification delivery success rate
- Average connection duration  
- Database query performance
- Failed reconnection attempts

### Debugging Tools
- Browser DevTools Network tab for SSE messages
- Server logs for API requests
- Database logs for query performance
- Connection status in demo interface

## Troubleshooting

### Common Issues

**1. SSE Connection Fails**
- Check CORS headers
- Verify endpoint accessibility
- Check browser console for errors
- Test with curl: `curl -N -H "Accept: text/event-stream" http://localhost:3000/api/notifications`

**2. Notifications Not Received**
- Verify connection status indicator
- Check network connectivity
- Ensure proper user targeting
- Review server logs for errors

**3. Database Connection Issues**  
- Verify Supabase environment variables
- Check RLS policies
- Test database connectivity
- Review service role permissions

### Development Testing

**Local Testing**:
```bash
# Start local test server
node test-server.js

# Test notification endpoint
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "message": "Test notification"}'

# Test SSE connection
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3000/api/notifications?clientId=test&userId=testuser"
```

## Future Enhancements

### Potential Improvements
- Push notifications for mobile devices
- Email notifications as fallback
- Notification history and persistence
- User notification preferences
- Rich notification content (images, actions)
- Notification templates and theming
- Analytics and usage tracking
- Rate limiting and spam protection

### Integration Opportunities
- Slack/Teams integration
- SMS notifications for critical alerts
- WebRTC for real-time collaboration
- Progressive Web App (PWA) features
- Service Worker for offline notifications