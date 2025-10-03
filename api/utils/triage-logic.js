/**
 * Triage Logic Module
 * AI-powered triage processing with priority and response determination
 */

import {
  HIGH_PRIORITY_KEYWORDS,
  MEDIUM_PRIORITY_KEYWORDS,
  LOW_PRIORITY_KEYWORDS,
} from './constants.js';

/**
 * Determines priority level based on ticket content and customer tone
 * @param {string} fullText - Combined issue description and subject
 * @param {string} customerTone - Customer's emotional state
 * @returns {{priority: string, confidence: number}} Priority level and confidence score
 * @private
 */
function determinePriority(fullText, customerTone) {
  const text = fullText.toLowerCase();

  if (
    HIGH_PRIORITY_KEYWORDS.some((keyword) => text.includes(keyword)) ||
    customerTone === 'angry' ||
    customerTone === 'urgent'
  ) {
    return { priority: 'high', confidence: 90 };
  }

  if (
    LOW_PRIORITY_KEYWORDS.some((keyword) => text.includes(keyword)) &&
    customerTone === 'calm'
  ) {
    return { priority: 'low', confidence: 85 };
  }

  if (MEDIUM_PRIORITY_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return { priority: 'medium', confidence: 80 };
  }

  return { priority: 'medium', confidence: 75 };
}

/**
 * Generates response approach and talking points based on customer tone
 * @param {string} customerTone - Customer's emotional state
 * @returns {{responseApproach: string, talkingPoints: string[]}} Response approach and talking points
 * @private
 */
function generateResponseStrategy(customerTone) {
  const strategies = {
    angry: {
      responseApproach:
        'Immediate acknowledgment with de-escalation techniques. Focus on resolution and compensation if applicable.',
      talkingPoints: [
        'Sincerely apologize for the inconvenience caused',
        'Take immediate ownership of the issue',
        'Explain specific steps to prevent future occurrences',
        'Offer appropriate compensation or escalation to management',
      ],
    },
    frustrated: {
      responseApproach:
        'Empathetic response with clear action plan and frequent updates.',
      talkingPoints: [
        'Acknowledge their frustration and validate their concerns',
        'Provide clear timeline with milestone updates',
        'Offer alternative solutions where possible',
        'Ensure direct contact for follow-up',
      ],
    },
    confused: {
      responseApproach:
        'Patient, educational approach with step-by-step guidance.',
      talkingPoints: [
        'Break down the solution into simple, clear steps',
        'Use non-technical language where possible',
        'Provide visual aids or documentation links',
        'Offer screen-sharing or phone support if needed',
      ],
    },
    urgent: {
      responseApproach:
        'Immediate response with escalation and priority handling.',
      talkingPoints: [
        'Acknowledge the urgency and time sensitivity',
        'Escalate to appropriate technical team immediately',
        'Provide direct contact information for updates',
        'Set clear expectations for resolution timeline',
      ],
    },
    calm: {
      responseApproach: 'Standard empathetic response with technical focus.',
      talkingPoints: [
        "Acknowledge the customer's concern with empathy",
        'Explain the technical steps being taken to resolve the issue',
        'Provide a realistic timeline for resolution',
      ],
    },
  };

  return (
    strategies[customerTone] || {
      responseApproach: 'Standard empathetic response with technical focus.',
      talkingPoints: [
        "Acknowledge the customer's concern with empathy",
        'Explain the technical steps being taken to resolve the issue',
        'Provide a realistic timeline for resolution',
      ],
    }
  );
}

/**
 * Suggests relevant knowledge base articles based on issue content
 * @param {string} fullText - Combined issue description and subject
 * @returns {string[]} Knowledge base article identifiers
 * @private
 */
function suggestKnowledgeBase(fullText) {
  const text = fullText.toLowerCase();
  const knowledgeBase = [
    'KB-001: General Troubleshooting Guide',
    'KB-015: Customer Communication Best Practices',
    'KB-032: Escalation Procedures and Guidelines',
  ];

  if (text.includes('login') || text.includes('password')) {
    knowledgeBase.unshift('KB-AUTH-01: Authentication Issues Resolution');
  }

  if (text.includes('slow') || text.includes('performance')) {
    knowledgeBase.unshift('KB-PERF-01: Performance Optimization Guide');
  }

  if (text.includes('payment') || text.includes('billing')) {
    knowledgeBase.unshift('KB-BILL-01: Billing and Payment Support');
  }

  return knowledgeBase;
}

/**
 * Processes a triage request and returns recommendations
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.issueDescription - Detailed issue description
 * @param {string} ticketData.customerTone - Customer's emotional tone
 * @param {string} ticketData.ticketSubject - Ticket subject line
 * @returns {{
 *   priority: string,
 *   confidence: string,
 *   responseApproach: string,
 *   talkingPoints: string[],
 *   knowledgeBase: string[],
 *   processedAt: string
 * }} Triage results with priority, approach, and suggestions
 */
export function processTriageRequest(ticketData) {
  const { issueDescription, customerTone, ticketSubject } = ticketData;
  const fullText = `${issueDescription} ${ticketSubject}`;

  // Determine priority and confidence
  const { priority, confidence } = determinePriority(fullText, customerTone);

  // Generate response strategy
  const { responseApproach, talkingPoints } =
    generateResponseStrategy(customerTone);

  // Suggest knowledge base articles
  const knowledgeBase = suggestKnowledgeBase(fullText);

  return {
    priority,
    confidence: `${confidence}%`,
    responseApproach,
    talkingPoints,
    knowledgeBase,
    processedAt: new Date().toISOString(),
  };
}
