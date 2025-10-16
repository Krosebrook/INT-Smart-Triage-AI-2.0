#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Ensures all required environment variables are set before deployment
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Define required environment variables by context
const envConfig = {
  production: {
    required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NODE_ENV'],
    optional: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'AGENT_DASH_WEBHOOK',
      'AGENT_DASH_TOKEN',
      'AUTOMATION_API_URL',
      'AUTOMATION_API_TOKEN',
      'AUTOMATION_VALIDATE_COMMAND',
      'AUTOMATION_VALIDATE_INTERVAL_MS',
    ],
  },
  development: {
    required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    optional: [
      'NODE_ENV',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'AGENT_DASH_WEBHOOK',
      'AGENT_DASH_TOKEN',
      'AUTOMATION_API_URL',
      'AUTOMATION_API_TOKEN',
      'AUTOMATION_VALIDATE_COMMAND',
      'AUTOMATION_VALIDATE_INTERVAL_MS',
    ],
  },
};

/**
 * Validates environment variables
 * @param {string} environment - The environment to validate (production/development)
 * @returns {object} Validation results
 */
function validateEnvironment(environment = 'production') {
  const config = envConfig[environment] || envConfig.production;
  const results = {
    missing: [],
    present: [],
    optional: [],
    warnings: [],
  };

  console.log(
    `\n${colors.cyan}${colors.bold}Environment Validation${colors.reset}`
  );
  console.log(`${colors.cyan}━`.repeat(50) + colors.reset);
  console.log(`Environment: ${colors.bold}${environment}${colors.reset}\n`);

  // Check required variables
  console.log(`${colors.bold}Required Variables:${colors.reset}`);
  config.required.forEach((key) => {
    const value = process.env[key];
    if (!value) {
      results.missing.push(key);
      console.log(
        `  ${colors.red}✗${colors.reset} ${key} ${colors.red}(MISSING)${colors.reset}`
      );
    } else {
      results.present.push(key);
      // Mask sensitive values
      const displayValue =
        key.includes('KEY') || key.includes('SECRET')
          ? '*'.repeat(20)
          : value.substring(0, 30) + (value.length > 30 ? '...' : '');
      console.log(
        `  ${colors.green}✓${colors.reset} ${key} ${colors.cyan}(${displayValue})${colors.reset}`
      );
    }
  });

  // Check optional variables
  if (config.optional.length > 0) {
    console.log(`\n${colors.bold}Optional Variables:${colors.reset}`);
    config.optional.forEach((key) => {
      const value = process.env[key];
      if (!value) {
        results.optional.push(key);
        console.log(
          `  ${colors.yellow}○${colors.reset} ${key} ${colors.yellow}(not set)${colors.reset}`
        );
      } else {
        const displayValue =
          key.includes('KEY') || key.includes('SECRET')
            ? '*'.repeat(20)
            : value.substring(0, 30) + (value.length > 30 ? '...' : '');
        console.log(
          `  ${colors.green}✓${colors.reset} ${key} ${colors.cyan}(${displayValue})${colors.reset}`
        );
      }
    });
  }

  // Additional validation checks
  console.log(`\n${colors.bold}Additional Checks:${colors.reset}`);

  // Check NODE_ENV value
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    results.warnings.push(`NODE_ENV has unexpected value: ${nodeEnv}`);
    console.log(
      `  ${colors.yellow}⚠${colors.reset} NODE_ENV value "${nodeEnv}" is non-standard`
    );
  } else if (nodeEnv) {
    console.log(
      `  ${colors.green}✓${colors.reset} NODE_ENV is set to "${nodeEnv}"`
    );
  }

  // Check URL formats
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    results.warnings.push('SUPABASE_URL should use HTTPS');
    console.log(
      `  ${colors.yellow}⚠${colors.reset} SUPABASE_URL should use HTTPS protocol`
    );
  } else if (supabaseUrl) {
    console.log(`  ${colors.green}✓${colors.reset} SUPABASE_URL uses HTTPS`);
  }

  // Print summary
  console.log(`\n${colors.cyan}━`.repeat(50) + colors.reset);
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(
    `  Required: ${colors.green}${results.present.length}/${config.required.length} present${colors.reset}`
  );
  if (results.missing.length > 0) {
    console.log(
      `  Missing: ${colors.red}${results.missing.length} required variables${colors.reset}`
    );
  }
  if (results.warnings.length > 0) {
    console.log(
      `  Warnings: ${colors.yellow}${results.warnings.length} issues found${colors.reset}`
    );
  }

  return results;
}

/**
 * Main execution
 */
function main() {
  const environment = process.env.NODE_ENV || 'production';
  const results = validateEnvironment(environment);

  // Exit with appropriate code
  if (results.missing.length > 0) {
    console.log(
      `\n${colors.red}${colors.bold}❌ Validation Failed${colors.reset}`
    );
    console.log(
      `${colors.red}Missing required environment variables. Please set them before deploying.${colors.reset}\n`
    );
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log(
      `\n${colors.yellow}${colors.bold}⚠️  Validation Passed with Warnings${colors.reset}`
    );
    console.log(
      `${colors.yellow}Please review the warnings above.${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.green}${colors.bold}✅ Validation Passed${colors.reset}`
    );
    console.log(
      `${colors.green}All required environment variables are set.${colors.reset}\n`
    );
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateEnvironment };
