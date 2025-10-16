/**
 * Main entry point for INT Smart Triage AI 2.0
 * This file is primarily used for build configurations.
 * The actual application entry point is index.html with client-side imports.
 */

export default function main() {
  return {
    name: 'INT Smart Triage AI 2.0',
    version: '1.0.0',
    status: 'operational',
    mode: process.env.NODE_ENV || 'production',
  };
}

// Make the function executable when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const info = main();
  console.log(`${info.name} v${info.version} - Status: ${info.status}`);
  console.log(`Running in ${info.mode} mode`);
}
