# INT Smart Triage AI 2.0 - Deployment Guide

## 🚀 Quick Deployment to Vercel

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project" and import this repository
3. Vercel will automatically detect the configuration

### 2. Set Environment Variables (MANDATORY)
In your Vercel project dashboard, add these environment variables:

```bash
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Security Note**: Use the SERVICE ROLE key, NOT the anon key for secure database operations.

### 3. Supabase Database Setup
Follow the instructions in `SUPABASE_SETUP.md` to:
1. Create the `reports` table
2. Enable Row Level Security (RLS)
3. Set the mandatory "DENY ALL" policy for public access

### 4. Deploy and Test
After deployment, test these endpoints:
- `https://your-app.vercel.app/api/health-check` (should return 200 OK)
- `https://your-app.vercel.app/` (main interface)

## 📁 Project Structure

```
├── index.html              # Main web interface
├── package.json            # Node.js dependencies
├── vercel.json             # Vercel deployment configuration
├── api/
│   ├── health-check.js     # Health monitoring endpoint
│   └── triage-report.js    # Main triage processing endpoint
├── SUPABASE_SETUP.md       # Database setup instructions
└── README.md               # This file
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database access is completely blocked for public users
- **Service Role Authentication**: Only backend API can access the database
- **CORS Headers**: Properly configured for security
- **Input Validation**: All API endpoints validate input data
- **Environment Variables**: Sensitive credentials are stored securely

## 🧪 Testing

Run the test suite:
```bash
npm test
```

This validates:
- Health check endpoint functionality
- Triage report API structure
- Environment variable configuration
- Database connection simulation

## 🎯 Features

- **Instant Triage**: AI-powered ticket classification and prioritization
- **Empathetic Responses**: Pre-generated talking points for CSRs
- **Knowledge Base Integration**: Automated article suggestions
- **Secure Logging**: All activity logged to Supabase with RLS protection
- **Production Ready**: Optimized for Vercel serverless deployment

## 📊 Monitoring

The health check endpoint provides:
- System status
- Environment configuration validation
- Timestamp for monitoring
- Node.js version information

Access: `GET /api/health-check`

## 🛠️ Maintenance

- Monitor health check endpoint for system status
- Review Supabase logs for database operations
- Check Vercel function logs for any errors
- Regularly update dependencies for security

## 🎉 Ready for Production

This application is now ready for production deployment with:
✅ Secure database operations
✅ RLS protection enabled
✅ Environment variables configured
✅ API endpoints tested
✅ Frontend interface complete