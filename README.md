# INT-Smart-Triage-AI-2.0

Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security.

## Features

- 🎯 **AI-Powered Triage**: Intelligent ticket categorization and priority assignment
- 💬 **Empathetic Responses**: AI-generated talking points for customer service representatives
- 📚 **Knowledge Base Integration**: Automatic suggestion of relevant KB articles
- 🔒 **Secure Logging**: All activities logged to Supabase with full audit trail
- ⚡ **Serverless Architecture**: Built on Vercel for optimal performance and scalability

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/triage-report` - Submit new triage reports

## CI/CD Pipeline

This project implements a two-tiered CI/CD approach:

- **Offline Unit Tests**: Deterministic testing without network access (runs on all PRs)
- **Manual Integration Tests**: End-to-end testing with sandbox services (manual trigger)

📖 [Full CI/CD Documentation](docs/CI_CD_WORKFLOWS.md)

## Database Schema

The application uses PostgreSQL with the following main tables:
- `triage_reports` - Core triage data and results
- `triage_audit` - Change tracking and audit logs
- `users` - CSR and admin user management

## Security

- Sandbox credentials for testing
- No production data in CI/CD
- Network isolation for unit tests
- Secure secret management via GitHub secrets
