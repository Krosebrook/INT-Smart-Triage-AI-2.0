// Client-side triage logic for INT Smart Triage AI 2.0
// This allows the app to work on bolt.new without serverless functions

export function processTriageRequest(ticketData) {
  const { issueDescription, customerTone, ticketSubject, customerName } =
    ticketData;

  // Priority determination logic
  let priority = 'medium';
  let confidence = 75;
  let category = 'general';
  let department = 'Technology';

  // High priority indicators
  const highPriorityKeywords = [
    'down',
    'outage',
    'critical',
    'urgent',
    'broken',
    'not working',
    'crashed',
    'hack',
    'breach',
    'security',
    'data loss',
  ];
  const mediumPriorityKeywords = [
    'slow',
    'issue',
    'problem',
    'error',
    'bug',
    'migration',
    'update',
  ];
  const lowPriorityKeywords = [
    'question',
    'help',
    'how to',
    'feature',
    'enhancement',
    'inquiry',
  ];

  // INT service keywords for department routing
  const infoSecKeywords = [
    'security',
    'compliance',
    'soc2',
    'gdpr',
    'cyber',
    'breach',
    'vulnerability',
    'insurance',
    'audit',
  ];
  const techKeywords = [
    'server',
    'network',
    'email',
    'cloud',
    'backup',
    'it',
    'computer',
    'software',
    'saas',
    'migration',
  ];
  const webKeywords = [
    'website',
    'web design',
    'ecommerce',
    'shopify',
    'wordpress',
    'landing page',
    'hosting',
  ];
  const brandKeywords = [
    'logo',
    'brand',
    'identity',
    'design',
    'visual',
    'color',
    'typography',
  ];
  const contentKeywords = [
    'content',
    'writing',
    'seo',
    'blog',
    'copy',
    'ebook',
    'article',
  ];
  const marketingKeywords = [
    'marketing',
    'hubspot',
    'crm',
    'automation',
    'campaign',
    'email marketing',
  ];
  const operationsKeywords = [
    'bookkeeping',
    'accounting',
    'process',
    'workflow',
    'ai',
    'bi',
    'analytics',
  ];

  const description = issueDescription.toLowerCase();
  const subject = ticketSubject.toLowerCase();
  const fullText = `${description} ${subject}`;

  // Determine priority
  if (
    highPriorityKeywords.some((keyword) => fullText.includes(keyword)) ||
    customerTone === 'angry' ||
    customerTone === 'urgent'
  ) {
    priority = 'high';
    confidence = 90;
  } else if (
    lowPriorityKeywords.some((keyword) => fullText.includes(keyword)) &&
    customerTone === 'calm'
  ) {
    priority = 'low';
    confidence = 85;
  } else if (
    mediumPriorityKeywords.some((keyword) => fullText.includes(keyword))
  ) {
    priority = 'medium';
    confidence = 80;
  }

  // Determine department and category
  if (infoSecKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Information Security';
    category = 'security';
  } else if (techKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Technology';
    category = 'technical';
  } else if (webKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Website Design';
    category = 'web_design';
  } else if (brandKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Branding';
    category = 'branding';
  } else if (contentKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Content';
    category = 'content';
  } else if (marketingKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Marketing';
    category = 'marketing';
  } else if (operationsKeywords.some((keyword) => fullText.includes(keyword))) {
    department = 'Operations';
    category = 'operations';
  }

  // Generate response approach based on tone and priority
  const responseApproach = generateResponseApproach(
    customerTone,
    priority,
    department
  );

  // Generate talking points
  const talkingPoints = generateTalkingPoints(customerTone, priority, category);

  // Generate knowledge base recommendations
  const knowledgeBase = generateKBArticles(category, priority);

  // Generate report ID
  const reportId = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    priority,
    confidence: `${confidence}%`,
    category,
    department,
    responseApproach,
    talkingPoints,
    knowledgeBase,
    reportId,
    timestamp: new Date().toISOString(),
    customerName,
    ticketSubject,
    analysis: {
      sentiment: customerTone,
      keyIssues: extractKeyIssues(fullText, category),
      estimatedResolutionTime: estimateResolutionTime(priority, category),
    },
  };
}

function generateResponseApproach(tone, priority, department) {
  const toneApproaches = {
    angry: `Begin with sincere empathy and acknowledgment of frustration. Express immediate commitment to resolution. Avoid defensive language. Provide specific action steps and timeline.`,
    urgent: `Acknowledge the time-sensitive nature immediately. Provide concrete next steps and expected timeline. Assign priority status and escalate if needed.`,
    frustrated: `Show understanding and empathy. Acknowledge the inconvenience. Explain what went wrong (if known) and how you'll prevent it in future. Provide clear resolution path.`,
    confused: `Use clear, simple language without jargon. Provide step-by-step guidance. Offer additional clarification resources. Be patient and thorough in explanations.`,
    calm: `Maintain professional and helpful tone. Provide thorough information and resources. Ensure all questions are answered comprehensively.`,
  };

  const priorityAddition =
    priority === 'high'
      ? ' Escalate to senior team member if needed. Follow up within 1 hour.'
      : '';

  return `**${department} Response**: ${toneApproaches[tone] || toneApproaches['calm']}${priorityAddition}`;
}

function generateTalkingPoints(tone, priority, category) {
  const baseTalkingPoints = [
    `Thank you for reaching out to INT Inc. We're here to help.`,
    `I understand this is ${priority} priority for you, and we'll treat it as such.`,
    `Let me walk you through what we'll do to resolve this.`,
  ];

  const categoryPoints = {
    security: [
      'Your security is our top priority.',
      'We follow industry-standard security protocols including SOC2 compliance.',
      "We'll conduct a thorough security assessment and provide recommendations.",
    ],
    technical: [
      'Our technical team will investigate this thoroughly.',
      "We'll keep you updated on progress every step of the way.",
      'We have backup systems in place to prevent data loss.',
    ],
    web_design: [
      "We'll review your website design requirements in detail.",
      'Our designers will create mockups for your approval.',
      'We focus on both aesthetics and user experience.',
    ],
    branding: [
      "We'll develop a brand strategy that aligns with your vision.",
      'Our design process includes multiple revision rounds.',
      'We ensure consistency across all brand touchpoints.',
    ],
    content: [
      "We'll create content that resonates with your target audience.",
      'All content is SEO-optimized and professionally edited.',
      'We can adapt tone and style to match your brand voice.',
    ],
    marketing: [
      "We'll develop a comprehensive marketing strategy.",
      'Our campaigns are data-driven and results-focused.',
      'We provide detailed analytics and regular reporting.',
    ],
    operations: [
      "We'll streamline your operations for maximum efficiency.",
      'Our solutions are scalable and future-proof.',
      'We provide training and ongoing support.',
    ],
  };

  const tonePoints = {
    angry: [
      'I sincerely apologize for any inconvenience this has caused.',
      'Your frustration is completely understandable.',
    ],
    urgent: [
      'We recognize the time-sensitive nature of this request.',
      "I'm escalating this for immediate attention.",
    ],
    frustrated: [
      'I understand how frustrating this must be.',
      "We're committed to making this right.",
    ],
    confused: [
      'Let me clarify that for you in simple terms.',
      'Feel free to ask any follow-up questions.',
    ],
    calm: [
      'I appreciate your patience as we work through this.',
      "We're happy to provide any additional information you need.",
    ],
  };

  return [
    ...baseTalkingPoints,
    ...(categoryPoints[category] || categoryPoints['technical']).slice(0, 2),
    ...(tonePoints[tone] || tonePoints['calm']).slice(0, 1),
  ];
}

function generateKBArticles(category, priority) {
  const kbDatabase = {
    security: [
      'KB-SEC-001: SOC2 Compliance Overview',
      'KB-SEC-003: Cyber Insurance Requirements',
      'KB-SEC-005: Vulnerability Assessment Process',
      'KB-SEC-007: Security Best Practices Guide',
    ],
    technical: [
      'KB-TECH-001: Managed IT Services Overview',
      'KB-TECH-004: Email Migration Guide',
      'KB-TECH-008: SaaS Migration Checklist',
      'KB-TECH-012: Backup and Recovery Procedures',
    ],
    web_design: [
      'KB-WEB-001: Custom Website Design Process',
      'KB-WEB-003: E-commerce Setup Guide',
      'KB-WEB-006: WordPress Best Practices',
      'KB-WEB-009: Website Maintenance Plans',
    ],
    branding: [
      'KB-BRAND-001: Brand Strategy Development',
      'KB-BRAND-004: Logo Design Guidelines',
      'KB-BRAND-007: Visual Identity Systems',
      'KB-BRAND-010: Brand Consistency Guide',
    ],
    content: [
      'KB-CONT-001: Content Strategy Framework',
      'KB-CONT-003: SEO Writing Best Practices',
      'KB-CONT-006: E-book Creation Process',
      'KB-CONT-009: Content Calendar Planning',
    ],
    marketing: [
      'KB-MARK-001: HubSpot Setup Guide',
      'KB-MARK-004: Marketing Automation Workflows',
      'KB-MARK-007: CRM Migration Process',
      'KB-MARK-010: Campaign Performance Metrics',
    ],
    operations: [
      'KB-OPS-001: Bookkeeping Services Overview',
      'KB-OPS-004: Process Management Framework',
      'KB-OPS-007: AI & BI Implementation Guide',
      'KB-OPS-010: Workflow Optimization Strategies',
    ],
  };

  const articles = kbDatabase[category] || kbDatabase['technical'];
  return priority === 'high' ? articles.slice(0, 4) : articles.slice(0, 3);
}

function extractKeyIssues(text, _category) {
  // Simple keyword extraction
  const keywords = text
    .split(' ')
    .filter((word) => word.length > 5)
    .slice(0, 5);
  return keywords.join(', ');
}

function estimateResolutionTime(priority, _category) {
  const times = {
    high: '1-4 hours',
    medium: '4-24 hours',
    low: '1-3 business days',
  };
  return times[priority] || '1-2 business days';
}
