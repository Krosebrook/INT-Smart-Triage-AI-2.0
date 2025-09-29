# INT-Smart-Triage-AI-2.0

Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security.

## 🔒 Security Features

This application implements comprehensive security hardening measures:

### Rate Limiting
- **5 requests per second per IP address**
- Returns HTTP 429 (Too Many Requests) when exceeded
- In-memory tracking with automatic cleanup

### Request Size Limiting
- **32 KB maximum request body size**
- Returns HTTP 413 (Payload Too Large) when exceeded
- Prevents resource exhaustion attacks

### Security Headers
- **Content Security Policy (CSP)**: Prevents XSS and injection attacks
- **X-Content-Type-Options: nosniff**: Prevents MIME sniffing attacks
- **X-Frame-Options: DENY**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information leakage

### OWASP API Security Top 10 Compliance
- ✅ API4:2023 Unrestricted Resource Consumption
- ✅ API8:2023 Security Misconfiguration
- ✅ API10:2023 Unsafe Consumption of APIs

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

## 📚 API Endpoints

### Health Check
```
GET /api/health
```
Returns service health status and security configuration.

### Triage Service
```
GET /api/triage
```
Returns service information and security details.

```
POST /api/triage
Content-Type: application/json

{
  "ticketContent": "Customer issue description",
  "priority": "high|medium|low"
}
```
Processes ticket triage and returns AI-generated response.

## 🧪 Testing Security Features

### Rate Limiting Test
```bash
# Test rate limiting (should show 429 after 5 requests)
for i in {1..10}; do 
  curl -w "%{http_code}\n" -s http://localhost:3000/api/health
done
```

### Body Size Limit Test
```bash
# Test body size limit (should return 413)
curl -X POST -H "Content-Type: application/json" \
  -d "$(printf '{"data":"%0*s"}' 40000 "")" \
  http://localhost:3000/api/triage
```

### Security Headers Test
```bash
# Verify security headers are present
curl -I http://localhost:3000/api/health
```

## 📖 Documentation

- [Security Documentation](./SECURITY.md) - Detailed security implementation guide
- [API Documentation](./docs/API.md) - Complete API reference (coming soon)

## 🛡️ Security Architecture

The application uses a security middleware wrapper that:
1. Validates request size before processing
2. Enforces IP-based rate limiting
3. Sets comprehensive security headers
4. Handles errors gracefully with structured responses

## 📊 Monitoring

The security features provide structured error responses for monitoring:
- **429 responses**: Rate limit violations
- **413 responses**: Oversized request attempts
- **Security headers**: Present in all responses

## 🔧 Configuration

Security settings can be customized through environment variables:
- `RATE_LIMIT_REQUESTS`: Requests per second (default: 5)
- `BODY_SIZE_LIMIT`: Maximum body size in bytes (default: 32768)
- `RATE_LIMIT_WINDOW`: Time window in milliseconds (default: 1000)

## 🚀 Deployment

This application is designed for Vercel serverless deployment:
1. Security middleware automatically applies to all endpoints
2. No additional configuration required
3. Production-ready out of the box

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   └── triage.js          # Main triage endpoint
├── lib/                   # Shared libraries
│   └── security.js        # Security middleware
├── __tests__/             # Test files
│   ├── security.test.js   # Security unit tests
│   └── integration.test.js # API integration tests
├── SECURITY.md            # Security documentation
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel configuration
└── README.md             # This file
```

## 🤝 Contributing

1. Follow security best practices
2. Run tests before submitting changes
3. Update documentation for new features
4. Ensure all security checks pass

## 📝 License

MIT License - see LICENSE file for details.
