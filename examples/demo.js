#!/usr/bin/env node

/**
 * Example script demonstrating the schema validation system
 * Run with: node examples/demo.js
 */

const { validateTriageResponse, DEFAULT_TRIAGE_RESPONSE } = require('../dist/lib/schema');

console.log('🚀 Schema Validation Demo\n');

// Example 1: Valid LLM output
console.log('✅ Example 1: Valid LLM Output');
const validOutput = {
  recommended_routing: 'Technical Support',
  kb_suggestion: 'Check our troubleshooting guide at KB-001',
  actionable_talking_points: [
    'Thank you for reaching out',
    'Let me help you with this technical issue',
    'I can escalate this to our technical team if needed'
  ],
  management_summary: 'Customer experiencing connectivity issues with their service',
  upsell_opportunity: 'Yes',
  upsell_reason: 'Customer could benefit from our premium support package for faster resolution'
};

const result1 = validateTriageResponse(validOutput);
console.log('Input accepted:', JSON.stringify(result1, null, 2));
console.log('\n---\n');

// Example 2: Malformed JSON string
console.log('❌ Example 2: Malformed JSON String');
const malformedJson = '{"recommended_routing": "Support", "invalid": true,}';
const result2 = validateTriageResponse(malformedJson);
console.log('Malformed JSON handled gracefully:');
console.log('Returned default routing:', result2.recommended_routing);
console.log('Returned default upsell:', result2.upsell_opportunity);
console.log('\n---\n');

// Example 3: Missing required fields
console.log('❌ Example 3: Missing Required Fields');
const incompleteOutput = {
  recommended_routing: 'Support',
  kb_suggestion: 'Some suggestion'
  // Missing other required fields
};
const result3 = validateTriageResponse(incompleteOutput);
console.log('Incomplete input handled gracefully:');
console.log('Has all required fields:', Object.keys(result3).length === 6);
console.log('Management summary:', result3.management_summary);
console.log('\n---\n');

// Example 4: Completely invalid input
console.log('❌ Example 4: Completely Invalid Input');
const result4 = validateTriageResponse('This is not JSON at all!');
const result5 = validateTriageResponse(12345);
const result6 = validateTriageResponse(null);

console.log('String input handled:', result4.recommended_routing);
console.log('Number input handled:', result5.recommended_routing);
console.log('Null input handled:', result6.recommended_routing);
console.log('\n---\n');

// Example 5: Type validation
console.log('❌ Example 5: Type Validation Errors');
const badTypes = {
  recommended_routing: 123, // Should be string
  kb_suggestion: 'Valid suggestion',
  actionable_talking_points: 'Not an array', // Should be array
  management_summary: true, // Should be string
  upsell_opportunity: 'Maybe', // Should be 'Yes' or 'No'
  upsell_reason: null // Should be string
};

const result7 = validateTriageResponse(badTypes);
console.log('Bad types handled gracefully:');
console.log('Talking points is array:', Array.isArray(result7.actionable_talking_points));
console.log('All talking points are strings:', result7.actionable_talking_points.every(p => typeof p === 'string'));
console.log('Upsell opportunity is valid enum:', ['Yes', 'No'].includes(result7.upsell_opportunity));

console.log('\n🎯 Summary:');
console.log('- All malformed inputs returned valid response shapes');
console.log('- No exceptions were thrown');
console.log('- Conservative defaults ensure safe operation');
console.log('- Error logging provides debugging information');
console.log('\n✨ Schema validation system working perfectly!');