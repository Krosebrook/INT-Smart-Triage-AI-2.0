# INT-Smart-Triage-AI-2.0

Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security.

## Features

- **Structured Logging**: JSON lines format with automatic sensitive data redaction
- **Optional Sentry Integration**: Error tracking and monitoring when configured
- **TypeScript**: Fully typed for development safety
- **Comprehensive Testing**: Unit tests with full coverage
- **Security-First**: Built-in data redaction policies

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```typescript
import { logger } from './lib/log';

// Log different levels
logger.info('application.started');
logger.warn('rate.limit.approaching', { currentRate: 95, limit: 100 });
logger.error('database.connection.failed', { error: 'Connection timeout' });
```

### Optional Sentry Integration

Set the `SENTRY_DSN` environment variable to enable error tracking:

```bash
export SENTRY_DSN="https://your-dsn@sentry.io/project-id"
export NODE_ENV="production"
```

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm test` - Run unit tests
- `npm run lint` - Run ESLint
- `npm run dev` - Run development example

### Testing

```bash
npm test
```

### Examples

Run the health check example:
```bash
npx tsx examples/health.ts
```

Run the triage example:
```bash
npx tsx examples/triage.ts
```

## Documentation

- [Logging Documentation](./LOGGING.md) - Comprehensive guide to structured logging
- [Examples](./examples/) - Working code examples

## Security

All sensitive data is automatically redacted from logs:
- User IDs and identifiers
- Authentication tokens and headers
- Long text content (user inquiries)
- Session information

See [LOGGING.md](./LOGGING.md) for complete redaction policies.
