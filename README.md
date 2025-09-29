# INT-Smart-Triage-AI-2.0

Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security.

## Quickstart

### Prerequisites

- Node.js >= 20
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Available Scripts

| Script        | Description                      |
| ------------- | -------------------------------- |
| `pnpm dev`    | Start the development server     |
| `pnpm lint`   | Run ESLint to check code quality |
| `pnpm format` | Format code with Prettier        |
| `pnpm test`   | Run the test suite               |
| `pnpm check`  | Run both linting and tests       |

## Repository Structure

```
INT-Smart-Triage-AI-2.0/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .gitignore              # Git ignore patterns
├── index.js                # Main application entry point
├── package.json            # Node.js project configuration
├── pnpm-lock.yaml          # pnpm lockfile for reproducible installs
└── README.md               # Project documentation
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline:

- Runs on Node.js 20 with pnpm
- Installs dependencies with `--frozen-lockfile`
- Disables network access during testing for security
- Runs linting and tests to ensure code quality
