import { getCategoryKeywords } from '../config/serviceCategories.js';

/**
 * AI Triage Engine - Improved logic with better categorization
 */

export class TriageEngine {
  constructor() {
    this.priorityKeywords = {
      high: ['down', 'outage', 'critical', 'urgent', 'broken', 'not working', 'crashed', 'error 500', 'cannot access', 'system failure'],
      medium: ['slow', 'issue', 'problem', 'error', 'bug', 'glitch', 'delay', 'timeout'],
      low: ['question', 'help', 'how to', 'feature', 'enhancement', 'request', 'information']
    };
    
    // Use centralized category keywords configuration
    this.categoryKeywords = getCategoryKeywords();
  }

  processTriageRequest(ticketData) {
    const { issueDescription, customerTone, ticketSubject } = ticketData;
    const fullText = `${issueDescription} ${ticketSubject}`.toLowerCase();
    
    const priority = this.determinePriority(fullText, customerTone);
    const category = this.determineCategory(fullText);
    const confidence = this.calculateConfidence(fullText, priority, category);
    const responseApproach = this.generateResponseApproach(customerTone, priority);
    const talkingPoints = this.generateTalkingPoints(customerTone, priority, category);
    const knowledgeBase = this.suggestKnowledgeBase(category, fullText);
    
    return {
      priority,
      category,
      confidence: `${confidence}%`,
      responseApproach,
      talkingPoints,
      knowledgeBase,
      processedAt: new Date().toISOString(),
      metadata: {
        detectedKeywords: this.extractKeywords(fullText),
        sentimentScore: this.calculateSentiment(fullText, customerTone)
      }
    };
  }

  determinePriority(text, tone) {
    let score = 0;
    
    // Check for high priority keywords
    if (this.priorityKeywords.high.some(keyword => text.includes(keyword))) {
      score += 3;
    }
    
    // Check for medium priority keywords
    if (this.priorityKeywords.medium.some(keyword => text.includes(keyword))) {
      score += 2;
    }
    
    // Check for low priority keywords
    if (this.priorityKeywords.low.some(keyword => text.includes(keyword))) {
      score += 1;
    }
    
    // Adjust based on customer tone
    switch (tone) {
      case 'angry':
      case 'urgent':
        score += 3;
        break;
      case 'frustrated':
        score += 2;
        break;
      case 'confused':
        score += 1;
        break;
      case 'calm':
        // No adjustment
        break;
    }
    
    // Determine final priority
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  determineCategory(text) {
    const categoryScores = {};
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      categoryScores[category] = keywords.filter(keyword => text.includes(keyword)).length;
    }
    
    const topCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory && topCategory[1] > 0 ? topCategory[0] : 'general';
  }

  calculateConfidence(text, _priority, _category) {
    let confidence = 70; // Base confidence
    
    // Increase confidence based on keyword matches
    const totalKeywords = Object.values(this.priorityKeywords).flat().length;
    const matchedKeywords = Object.values(this.priorityKeywords).flat()
      .filter(keyword => text.includes(keyword)).length;
    
    confidence += (matchedKeywords / totalKeywords) * 20;
    
    // Adjust based on text length (more context = higher confidence)
    if (text.length > 100) confidence += 5;
    if (text.length > 300) confidence += 5;
    
    return Math.min(95, Math.max(60, Math.round(confidence)));
  }

  generateResponseApproach(tone, priority) {
    const approaches = {
      angry: {
        high: 'Immediate escalation with sincere apology and executive involvement. Focus on damage control and retention.',
        medium: 'Urgent de-escalation with empathetic acknowledgment and expedited resolution timeline.',
        low: 'Calm de-escalation with validation of concerns and clear action plan.'
      },
      frustrated: {
        high: 'Empathetic response with immediate action and frequent progress updates.',
        medium: 'Understanding approach with clear timeline and milestone communications.',
        low: 'Patient guidance with step-by-step resolution and reassurance.'
      },
      confused: {
        high: 'Clear, simple explanation with immediate technical assistance and screen sharing offer.',
        medium: 'Educational approach with visual aids and documentation links.',
        low: 'Patient, tutorial-style guidance with follow-up confirmation.'
      },
      urgent: {
        high: 'Emergency response protocol with immediate escalation and direct contact.',
        medium: 'Priority handling with accelerated timeline and management notification.',
        low: 'Prompt response with clear urgency acknowledgment and realistic timeline.'
      },
      calm: {
        high: 'Professional response with technical focus and systematic approach.',
        medium: 'Standard empathetic response with clear action plan.',
        low: 'Friendly, informative response with helpful resources.'
      }
    };
    
    return approaches[tone]?.[priority] || approaches.calm[priority];
  }

  generateTalkingPoints(tone, priority, _category) {
    const baseTalkingPoints = [
      'Acknowledge the customer\'s concern with appropriate empathy',
      'Provide clear next steps and timeline expectations',
      'Offer additional support channels if needed'
    ];
    
    const toneSpecificPoints = {
      angry: [
        'Offer sincere apology for the inconvenience',
        'Take immediate ownership without making excuses',
        'Provide compensation or escalation options'
      ],
      frustrated: [
        'Validate their frustration as understandable',
        'Explain what went wrong and how to prevent it',
        'Offer direct contact for follow-up'
      ],
      confused: [
        'Break down the solution into simple steps',
        'Use non-technical language where possible',
        'Offer screen-sharing or phone support'
      ],
      urgent: [
        'Acknowledge the time-sensitive nature',
        'Escalate to appropriate technical team',
        'Provide direct contact for real-time updates'
      ]
    };
    
    const priorityPoints = {
      high: ['Escalate to senior technical team immediately', 'Set up dedicated communication channel'],
      medium: ['Assign to experienced team member', 'Schedule follow-up within 24 hours'],
      low: ['Provide comprehensive self-service resources', 'Schedule follow-up within 48-72 hours']
    };
    
    return [
      ...baseTalkingPoints,
      ...(toneSpecificPoints[tone] || []),
      ...(priorityPoints[priority] || [])
    ];
  }

  suggestKnowledgeBase(category, text) {
    const baseArticles = [
      'KB-001: General Troubleshooting Guide',
      'KB-015: Customer Communication Best Practices'
    ];
    
    const categoryArticles = {
      authentication: ['KB-AUTH-01: Authentication Issues Resolution', 'KB-AUTH-02: Password Reset Procedures'],
      performance: ['KB-PERF-01: Performance Optimization Guide', 'KB-PERF-02: System Requirements'],
      billing: ['KB-BILL-01: Billing and Payment Support', 'KB-BILL-02: Subscription Management'],
      integration: ['KB-API-01: API Integration Guide', 'KB-API-02: Webhook Configuration'],
      ui: ['KB-UI-01: Interface Navigation Guide', 'KB-UI-02: Mobile App Support']
    };
    
    const articles = [...baseArticles];
    
    if (categoryArticles[category]) {
      articles.unshift(...categoryArticles[category]);
    }
    
    // Add escalation guide for high priority
    if (text.includes('urgent') || text.includes('critical')) {
      articles.push('KB-ESC-01: Escalation Procedures and Guidelines');
    }
    
    return articles.slice(0, 5); // Limit to 5 articles
  }

  extractKeywords(text) {
    const allKeywords = Object.values(this.priorityKeywords).flat()
      .concat(Object.values(this.categoryKeywords).flat());
    
    return allKeywords.filter(keyword => text.includes(keyword));
  }

  calculateSentiment(text, tone) {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thank'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let score = 0;
    if (positiveCount > negativeCount) score = 1;
    else if (negativeCount > positiveCount) score = -1;
    
    // Adjust based on tone
    const toneScores = { angry: -2, frustrated: -1, confused: 0, urgent: 0, calm: 1 };
    score += toneScores[tone] || 0;
    
    return Math.max(-2, Math.min(2, score));
  }
}