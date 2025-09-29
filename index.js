// Main entry point for INT Smart Triage AI 2.0
import { processTriage } from './api/triage.js';

export default function main() {
  console.log('INT Smart Triage AI 2.0 - Production Ready System');
  return 'INT Smart Triage AI 2.0 - Production Ready';
}

// Export triage functionality for external use
export { processTriage };

// Make the function executable when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 INT Smart Triage AI 2.0 - Ready for production');
  console.log('📊 Features: Advanced sentiment analysis, intelligent priority scoring, persona-based responses');
  console.log('🔧 API: /api/triage endpoint available');
  console.log(main());
}
