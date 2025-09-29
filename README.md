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
├── openapi.yaml            # OpenAPI 3.0.3 specification for all APIs
├── package.json            # Dependencies and build configuration
├── vercel.json            # Vercel deployment configuration
├── api/
│   ├── health-check.js    # System health and RLS verification
│   └── triage-report.js   # Secure triage processing and logging
├── docs/
│   └── API-DOCUMENTATION.md # Complete API documentation guide
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

## 📖 API Documentation

Complete **OpenAPI/Swagger documentation** is available for all endpoints:

- **📄 Specification**: [`openapi.yaml`](./openapi.yaml) - Full OpenAPI 3.0.3 specification
- **📚 Documentation Guide**: [`docs/API-DOCUMENTATION.md`](./docs/API-DOCUMENTATION.md) - Usage instructions and benefits
- **🌐 Interactive Docs**: Open `openapi.yaml` in [Swagger Editor](https://editor.swagger.io/) for interactive testing

### Benefits for Development & QA Teams:
- **Interactive Testing**: Test all endpoints directly in Swagger UI
- **Client Code Generation**: Auto-generate SDKs in multiple languages (JavaScript, Python, Java, etc.)
- **Contract Testing**: Validate API responses against defined schemas
- **API Mocking**: Create mock servers for frontend development

## 📋 API Endpoints

### GET `/api/health-check`
System health verification with RLS status confirmation

### POST `/api/triage-report`
Secure triage processing with database logging

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
