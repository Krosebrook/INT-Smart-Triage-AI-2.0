const now = Date.now();

export const demoUsers = [
  {
    id: 'demo-user-1',
    name: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    role: 'csr_senior',
    avatar_url: null,
    max_concurrent_tickets: 8,
    availability_status: 'available',
    specializations: ['incident', 'vip']
  },
  {
    id: 'demo-user-2',
    name: 'Avery Chen',
    email: 'avery.chen@example.com',
    role: 'csr_junior',
    avatar_url: null,
    max_concurrent_tickets: 5,
    availability_status: 'available',
    specializations: ['performance', 'onboarding']
  }
];

export const demoCustomers = [
  {
    id: 'demo-customer-1',
    name: 'Acme Analytics',
    email: 'success@acmeanalytics.com',
    company: 'Acme Analytics',
    health_score: 82,
    account_value: 120000,
    at_risk: false,
    contract_tier: 'Enterprise',
    contract_end_date: new Date(now + 1000 * 60 * 60 * 24 * 120).toISOString()
  },
  {
    id: 'demo-customer-2',
    name: 'Northwind Traders',
    email: 'ops@northwind.io',
    company: 'Northwind Traders',
    health_score: 56,
    account_value: 45000,
    at_risk: true,
    contract_tier: 'Growth',
    contract_end_date: new Date(now + 1000 * 60 * 60 * 24 * 45).toISOString()
  }
];

export const demoTickets = [
  {
    id: 'demo-ticket-1001',
    ticket_number: 'INT-1001',
    subject: 'Executive dashboard returns 500 error',
    description: 'Key dashboard fails to load with 500 error after latest deploy.',
    priority: 'urgent',
    status: 'open',
    channel: 'email',
    category: 'incident',
    sentiment_score: -0.4,
    created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    resolved_at: null,
    closed_at: null,
    escalated: true,
    customer_id: 'demo-customer-1',
    assigned_to: 'demo-user-1'
  },
  {
    id: 'demo-ticket-1002',
    ticket_number: 'INT-1002',
    subject: 'API latency alerts firing frequently',
    description: 'Increased latency alerts for EU region since midnight UTC.',
    priority: 'high',
    status: 'in_progress',
    channel: 'slack',
    category: 'performance',
    sentiment_score: -0.1,
    created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    resolved_at: null,
    closed_at: null,
    escalated: false,
    customer_id: 'demo-customer-2',
    assigned_to: 'demo-user-2'
  },
  {
    id: 'demo-ticket-1003',
    ticket_number: 'INT-1003',
    subject: 'Need onboarding assistance for new team',
    description: 'Customer is rolling out to 25 new agents and needs training timeline.',
    priority: 'medium',
    status: 'waiting_customer',
    channel: 'email',
    category: 'onboarding',
    sentiment_score: 0.35,
    created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    resolved_at: null,
    closed_at: null,
    escalated: false,
    customer_id: 'demo-customer-1',
    assigned_to: null
  }
];

export const demoTicketMessages = [
  {
    id: 'demo-message-1',
    ticket_id: 'demo-ticket-1001',
    sender_type: 'customer',
    sender_name: 'Elena Rivera',
    message: 'We are still seeing 500 errors across the executive dashboard views.',
    ai_reviewed: false,
    ai_review_score: null,
    channel: 'email',
    created_at: new Date(now - 1000 * 60 * 60 * 2.5).toISOString()
  },
  {
    id: 'demo-message-2',
    ticket_id: 'demo-ticket-1001',
    sender_type: 'csr',
    sender_name: 'Jordan Blake',
    message: 'Our engineering team is rolling back the change now and monitoring.',
    ai_reviewed: true,
    ai_review_score: 0.9,
    channel: 'email',
    created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'demo-message-3',
    ticket_id: 'demo-ticket-1002',
    sender_type: 'customer',
    sender_name: 'Mina Patel',
    message: 'Latency graphs are spiking between 220-240ms on average.',
    ai_reviewed: false,
    ai_review_score: null,
    channel: 'slack',
    created_at: new Date(now - 1000 * 60 * 60 * 7).toISOString()
  }
];

export const demoSentimentAnalytics = [
  {
    id: 'demo-sentiment-1',
    customer_id: 'demo-customer-1',
    avg_sentiment: 0.22,
    trend: [0.1, 0.25, 0.2, 0.28],
    period_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    period_end: new Date(now).toISOString()
  },
  {
    id: 'demo-sentiment-2',
    customer_id: 'demo-customer-2',
    avg_sentiment: -0.35,
    trend: [-0.2, -0.3, -0.4, -0.5],
    period_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    period_end: new Date(now).toISOString()
  }
];

export const demoCsrPerformance = [
  {
    id: 'demo-performance-1',
    csr_id: 'demo-user-1',
    period_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    period_end: new Date(now).toISOString(),
    resolved_tickets: 28,
    avg_response_time_minutes: 14,
    quality_score: 0.93
  },
  {
    id: 'demo-performance-2',
    csr_id: 'demo-user-2',
    period_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    period_end: new Date(now).toISOString(),
    resolved_tickets: 17,
    avg_response_time_minutes: 26,
    quality_score: 0.88
  }
];

export const demoResponseTemplates = [
  {
    id: 'demo-template-1',
    name: 'Outage Acknowledgement',
    category: 'incident',
    tone: 'professional',
    template_text: 'We are actively investigating the outage and will share updates every 30 minutes.',
    usage_count: 42,
    effectiveness_score: 0.94,
    created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    created_by: 'demo-user-1',
    created_by_user: { name: 'Jordan Blake' },
    is_ai_generated: false
  },
  {
    id: 'demo-template-2',
    name: 'Onboarding Support',
    category: 'onboarding',
    tone: 'friendly',
    template_text: 'Here is the onboarding plan for your new agents with access instructions and training links.',
    usage_count: 18,
    effectiveness_score: 0.89,
    created_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
    created_by: 'demo-user-2',
    created_by_user: { name: 'Avery Chen' },
    is_ai_generated: true
  }
];

export const demoKnowledgeBaseArticles = [
  {
    id: 'demo-article-1',
    title: 'Troubleshooting Dashboard Errors',
    category: 'Incident Response',
    tags: ['dashboard', 'errors', 'incident'],
    content: 'Step-by-step process to diagnose dashboard 500 errors including log capture guidance.',
    summary: 'Detailed playbook for resolving dashboard rendering failures after deployments.',
    view_count: 186,
    helpful_count: 32,
    not_helpful_count: 2,
    published: true,
    reading_time_minutes: 6,
    created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    author_id: 'demo-user-1',
    author: { name: 'Jordan Blake' }
  },
  {
    id: 'demo-article-2',
    title: 'EU Region Latency Playbook',
    category: 'Performance',
    tags: ['latency', 'network'],
    content: 'Playbook to analyze regional latency signals and escalate to SRE when thresholds breach.',
    summary: 'Latency troubleshooting checklist for EU customers with best practices.',
    view_count: 132,
    helpful_count: 21,
    not_helpful_count: 4,
    published: true,
    reading_time_minutes: 5,
    created_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 50).toISOString(),
    author_id: 'demo-user-2',
    author: { name: 'Avery Chen' }
  }
];

export const demoChannelMessages = [
  {
    id: 'demo-channel-msg-1',
    channel_type: 'email',
    raw_message: 'Customer cannot access dashboard since 8am UTC. Error 500 on load.',
    created_at: new Date(now - 1000 * 60 * 45).toISOString(),
    processed: false,
    ticket_id: 'demo-ticket-1001',
    customer_id: 'demo-customer-1'
  },
  {
    id: 'demo-channel-msg-2',
    channel_type: 'slack',
    raw_message: {
      subject: 'Latency alert EU region',
      body: 'Seeing 230ms+ latency since midnight. Any known issues?'
    },
    created_at: new Date(now - 1000 * 60 * 90).toISOString(),
    processed: true,
    ticket_id: 'demo-ticket-1002',
    customer_id: 'demo-customer-2'
  }
];

export const demoTicketFollowUps = [
  {
    id: 'demo-followup-1',
    ticket_id: 'demo-ticket-1003',
    follow_up_type: 'check_in',
    message_template: 'Hi {{customer_name}}, checking in on ticket #{{ticket_number}}. Do you need anything else?',
    scheduled_for: new Date(now + 1000 * 60 * 60 * 12).toISOString(),
    completed: false,
    completed_at: null
  },
  {
    id: 'demo-followup-2',
    ticket_id: 'demo-ticket-1002',
    follow_up_type: 'resolution_confirm',
    message_template: 'Hi {{customer_name}}, confirming the latency alert for ticket #{{ticket_number}} has been resolved.',
    scheduled_for: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
    completed: false,
    completed_at: null
  }
];
