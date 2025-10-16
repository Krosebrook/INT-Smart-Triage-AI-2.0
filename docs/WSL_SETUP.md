# WSL Development Setup Guide

## Overview

This project is optimized for development in Windows Subsystem for Linux (WSL). This guide helps you set up your environment correctly.

## Prerequisites

- Windows 10/11 with WSL2 installed
- Node.js 18+ installed in WSL
- VS Code or Cursor IDE

## Common Issues & Solutions

### Git Hook Errors (UNC Path Issues)

**Problem:** Getting errors like:

```
'\\wsl.localhost\Ubuntu\home\...'
CMD.EXE was started with the above path as the current directory.
UNC paths are not supported.
'lint-staged' is not recognized as an internal or external command
```

**Solution:** Configure your IDE to use WSL Git instead of Windows Git.

#### For VS Code/Cursor:

1. Create `.vscode/settings.json` in your workspace (this file is gitignored):

```json
{
  "git.enabled": true,
  "git.path": "C:\\Windows\\System32\\wsl.exe",
  "git.useIntegratedAskPass": false,
  "terminal.integrated.defaultProfile.windows": "WSL"
}
```

2. Reload your IDE window
3. All git operations will now run through WSL

#### Alternative: Use WSL Terminal

You can always use the WSL terminal for git operations:

```bash
git add .
git commit -m "your message"
git push
```

## Installing Dependencies

Always install dependencies from within WSL:

```bash
npm install
```

## Running the Project

All npm scripts should be run from WSL:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
```

## Pre-commit Hooks

This project uses Husky for git hooks:

- **lint-staged**: Automatically formats and lints staged files
- **tests**: Runs test suite before commits

If you need to bypass hooks temporarily:

```bash
git commit --no-verify
```

## Troubleshooting

### Dependencies not found

```bash
# Ensure you're in the project directory
cd ~/INT-Smart-Triage-AI-2.0

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Git operations failing

```bash
# Verify you're using WSL git
which git
# Should output: /usr/bin/git

# Verify git version
git --version
```

### Node version issues

```bash
# Check Node version (should be 18+)
node --version

# If using nvm, switch versions
nvm use 18
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Then edit `.env` with your local configuration.

## Additional Resources

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [VS Code WSL Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)
- [Node Version Manager for WSL](https://github.com/nvm-sh/nvm)
