#!/usr/bin/env node

/**
 * Import Batch Validation Script
 * Runs comprehensive checks after each import batch to ensure code quality
 * and build integrity remain intact.
 *
 * Usage: npm run validate:imports
 */

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Execute a command and return the result
 */
function runCommand(command, description) {
  console.log(`\n${colors.cyan}▶ ${description}${colors.reset}`);
  console.log(`${colors.cyan}  Command: ${command}${colors.reset}`);

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log(`${colors.green}  ✓ Success${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    console.log(`${colors.red}  ✗ Failed${colors.reset}`);
    if (error.stdout) {
      console.log(`${colors.yellow}  Output:${colors.reset}\n${error.stdout}`);
    }
    if (error.stderr) {
      console.log(`${colors.red}  Error:${colors.reset}\n${error.stderr}`);
    }
    return { success: false, error: error.message, output: error.stdout };
  }
}

/**
 * Check if critical files exist
 */
function validateProjectStructure() {
  console.log(
    `\n${colors.cyan}${colors.bold}Validating Project Structure${colors.reset}`
  );
  console.log(`${colors.cyan}━`.repeat(50) + colors.reset);

  const criticalPaths = [
    'package.json',
    'src/',
    'api/',
    'public/',
    'test/',
    'vite.config.js',
    '.eslintrc.cjs',
  ];

  let allValid = true;

  criticalPaths.forEach((path) => {
    const fullPath = join(process.cwd(), path);
    const exists = existsSync(fullPath);

    if (exists) {
      const stats = statSync(fullPath);
      const type = stats.isDirectory() ? 'directory' : 'file';
      console.log(
        `  ${colors.green}✓${colors.reset} ${path} (${type}) ${colors.cyan}exists${colors.reset}`
      );
    } else {
      console.log(
        `  ${colors.red}✗${colors.reset} ${path} ${colors.red}MISSING${colors.reset}`
      );
      allValid = false;
    }
  });

  return allValid;
}

/**
 * Main validation workflow
 */
function main() {
  console.log(
    `\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════╗`
  );
  console.log(`║   Import Batch Validation Workflow             ║`);
  console.log(
    `╚════════════════════════════════════════════════╝${colors.reset}\n`
  );

  const results = {
    structure: false,
    install: false,
    format: false,
    lint: false,
    test: false,
    build: false,
  };

  // Step 1: Validate project structure
  results.structure = validateProjectStructure();
  if (!results.structure) {
    console.log(
      `\n${colors.red}${colors.bold}❌ Project structure validation failed${colors.reset}`
    );
    process.exit(1);
  }

  // Step 2: Install/update dependencies
  const installResult = runCommand('npm install', 'Installing dependencies');
  results.install = installResult.success;
  if (!results.install) {
    console.log(
      `\n${colors.red}${colors.bold}❌ Dependency installation failed${colors.reset}`
    );
    process.exit(1);
  }

  // Step 3: Format check
  const formatResult = runCommand(
    'npm run format:check',
    'Checking code formatting'
  );
  results.format = formatResult.success;

  // Step 4: Lint
  const lintResult = runCommand('npm run lint', 'Running linter');
  results.lint = lintResult.success;

  // Step 5: Test
  const testResult = runCommand('npm test', 'Running tests');
  results.test = testResult.success;

  // Step 6: Build
  const buildResult = runCommand('npm run build', 'Building project');
  results.build = buildResult.success;

  // Summary
  console.log(`\n${colors.cyan}${colors.bold}━`.repeat(50) + colors.reset);
  console.log(`${colors.bold}Validation Summary:${colors.reset}`);
  console.log(`${colors.cyan}━`.repeat(50) + colors.reset);

  const checks = [
    { name: 'Project Structure', result: results.structure },
    { name: 'Dependencies Install', result: results.install },
    { name: 'Format Check', result: results.format },
    { name: 'Lint', result: results.lint },
    { name: 'Tests', result: results.test },
    { name: 'Build', result: results.build },
  ];

  let allPassed = true;
  checks.forEach(({ name, result }) => {
    const icon = result ? '✓' : '✗';
    const color = result ? colors.green : colors.red;
    const status = result ? 'PASSED' : 'FAILED';
    console.log(
      `  ${color}${icon}${colors.reset} ${name}: ${color}${status}${colors.reset}`
    );
    if (!result) allPassed = false;
  });

  console.log(`${colors.cyan}━`.repeat(50) + colors.reset);

  if (allPassed) {
    console.log(
      `\n${colors.green}${colors.bold}✅ All validation checks passed!${colors.reset}`
    );
    console.log(
      `${colors.green}The codebase is ready for deployment.${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.red}${colors.bold}❌ Some validation checks failed${colors.reset}`
    );
    console.log(
      `${colors.red}Please fix the issues above before proceeding.${colors.reset}\n`
    );
    process.exit(1);
  }
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(
      `${colors.red}${colors.bold}Fatal error:${colors.reset}`,
      error
    );
    process.exit(1);
  }
}

export { validateProjectStructure, runCommand };
