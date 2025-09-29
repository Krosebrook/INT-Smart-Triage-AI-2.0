# INT Smart Triage AI 2.0 🎯

**Secure, production-ready AI Triage Tool for INT Inc. Client Success**

Instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security compliance.

## 🚀 Production Features

- **🎯 Intelligent Ticket Triage**: AI-powered priority assignment with confidence scoring
- **💬 Empathetic Response Guidelines**: Tone-aware talking points for improved customer relations
- **📚 Knowledge Base Integration**: Contextual article suggestions based on issue analysis
- **🔐 Enterprise Security**: Mandatory Row Level Security (RLS) with zero client-side database access
- **📊 Complete Audit Trail**: Comprehensive logging with IP tracking and session management
- **⚡ Serverless Architecture**: Vercel-hosted with automatic scaling and edge optimization

## 🛡️ Security Architecture

- **Mandatory RLS Enforcement**: Database access restricted to server-side operations only
- **Service Role Authentication**: Secure API-to-database communications
- **Comprehensive Security Headers**: Protection against XSS, CSRF, and clickjacking
- **Input Sanitization**: Full validation and sanitization of all user inputs
- **Environment Variable Security**: All secrets managed through Vercel's encrypted storage

## 🔧 Tech Stack

- **Frontend**: Vanilla JavaScript with modern CSS Grid/Flexbox
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL) with mandatory RLS
- **Deployment**: Vercel with CI/CD integration
- **Security**: Enterprise-grade with comprehensive audit logging

## 📁 Project Structure

```
├── index.html              # CSR Dashboard Interface
├── package.json            # Dependencies and build configuration
├── vercel.json            # Vercel deployment configuration
├── api/
│   ├── health-check.js    # System health and RLS verification
│   └── triage-report.js   # Secure triage processing and logging
├── lib/
│   ├── errorHandler.js    # Centralized error handling and validation
│   └── logger.js          # Structured logging with Winston
├── test/
│   ├── index.test.js           # Basic application tests
│   ├── test-error-handling.js  # Error handling module tests
│   └── test-api-integration.js # API endpoint integration tests
├── docs/
│   └── ERROR_HANDLING_AND_LOGGING.md # Comprehensive error handling documentation
├── supabase-setup.sql     # Database schema with RLS policies
├── DEPLOYMENT.md          # Complete production deployment guide
└── .gitignore            # Security-focused ignore patterns
```

## 🚀 Quick Start

1. **Deploy to Vercel**:
   ```bash
   git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
   cd INT-Smart-Triage-AI-2.0
   npm install
   vercel --prod
   ```

2. **Configure Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (NOT anon key)

3. **Setup Database**: Execute `supabase-setup.sql` in your Supabase SQL editor

4. **Verify Deployment**: Check `/api/health-check` endpoint returns 200 OK

## 📋 API Endpoints

### GET `/api/health-check`
System health verification with RLS status confirmation

**Response Format:**
```json
{
  "status": "healthy",
  "requestId": "uuid-v4",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "checks": {
    "api": "healthy",
    "database": "healthy", 
    "rls": "enabled"
  }
}
```

### POST `/api/triage-report`
Secure triage processing with database logging

**Request Body:**
```json
{
  "customerName": "John Doe",
  "ticketSubject": "Account Issue", 
  "issueDescription": "Cannot access account features",
  "customerTone": "frustrated",
  "csrAgent": "Agent001"
}
```

**Response Format:**
```json
{
  "status": "success",
  "requestId": "uuid-v4",
  "reportId": "report-123",
  "priority": "high",
  "confidence": "85%",
  "responseApproach": "Empathetic response...",
  "talkingPoints": ["..."],
  "knowledgeBase": ["KB-001"]
}
```

## 🛡️ Enterprise Error Handling & Logging

### Centralized Error Handling
- **Standardized Error Responses**: Consistent JSON error format across all endpoints
- **Error Type Classification**: Validation, authentication, database, and server errors
- **Security-First Design**: Sensitive information never exposed to clients
- **Request Correlation**: Unique request IDs for tracking across system boundaries

### Structured Logging
- **Winston-Based Logging**: Professional logging with multiple output formats
- **Request/Response Logging**: Complete audit trail with timing information
- **Critical Error Alerting**: 5xx errors logged with full context for investigation
- **Log Levels**: Info, warn, error, debug with appropriate filtering by environment

### Error Response Format
```json
{
  "status": "error",
  "message": "User-friendly error message",
  "requestId": "uuid-v4-correlation-id",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "details": "Additional context (development only)"
}
```

**📚 Documentation**: See `docs/ERROR_HANDLING_AND_LOGGING.md` for complete implementation details.

## 🔒 Security Compliance

✅ **Row Level Security (RLS)** - Enforced with public access denied  
✅ **Environment Variables** - Stored as Vercel secrets  
✅ **HTTPS Enforcement** - All communications encrypted  
✅ **Input Validation** - Comprehensive sanitization  
✅ **Audit Logging** - Complete request tracking  
✅ **Security Headers** - XSS, CSRF, and clickjacking protection  

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide
- **[supabase-setup.sql](./supabase-setup.sql)** - Database schema and RLS configuration

## 🎯 For CSR Teams

This tool is designed specifically for Customer Success Representatives to:
- Quickly assess ticket priority and urgency
- Receive tone-appropriate response guidance
- Access relevant Knowledge Base articles
- Maintain complete audit compliance

## 📞 Support

For technical support or security questions, refer to the deployment documentation or contact the INT Inc. technical team.

---

**Built with ❤️ for INT Inc. Customer Success** | **Security-First Design** | **Production Ready**
