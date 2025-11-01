/**
 * Common test data fixtures
 * Provides realistic test data for various entities
 */

/**
 * Sample ticket data
 */
export const sampleTicket = {
  id: 'TICKET-001',
  subject: 'Cannot login to my account',
  description:
    'I am unable to access my account. The password reset is not working.',
  priority: 'high',
  status: 'open',
  customerId: 'CUST-001',
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  customerTone: 'frustrated',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Sample customer profile
 */
export const sampleCustomer = {
  id: 'CUST-001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  company: 'Acme Corporation',
  tier: 'premium',
  accountCreated: '2023-06-15T00:00:00Z',
  totalTickets: 12,
  resolvedTickets: 10,
  averageResolutionTime: '4.5 hours',
  satisfactionScore: 4.2,
};

/**
 * Sample CSR agent data
 */
export const sampleCSR = {
  id: 'CSR-001',
  name: 'Alice Smith',
  email: 'alice.smith@int.com',
  department: 'Technology',
  skills: ['networking', 'security', 'cloud'],
  expertiseLevel: 'expert',
  currentWorkload: 3,
  availabilityStatus: 'available',
  satisfactionRating: 4.8,
};

/**
 * Sample knowledge base article
 */
export const sampleArticle = {
  id: 'KB-001',
  title: 'How to Reset Your Password',
  content: 'Follow these steps to reset your password...',
  category: 'Account Management',
  tags: ['password', 'login', 'authentication'],
  department: 'Technology',
  viewCount: 1250,
  helpfulCount: 980,
  lastUpdated: '2024-01-10T00:00:00Z',
};

/**
 * Sample triage report data
 */
export const sampleTriageReport = {
  reportId: 'TR-1705318200000-ABC123',
  priority: 'high',
  confidence: '90%',
  responseApproach: 'Immediate response with escalation and priority handling.',
  talkingPoints: [
    'Acknowledge the urgency and time sensitivity',
    'Escalate to appropriate technical team immediately',
    'Provide direct contact information for updates',
  ],
  knowledgeBase: [
    'KB-AUTH-01: Authentication Issues Resolution',
    'KB-001: General Troubleshooting Guide',
  ],
  processedAt: '2024-01-15T10:30:00Z',
};

/**
 * Sample email notification data
 */
export const sampleEmailNotification = {
  to: 'john.doe@example.com',
  subject: 'Your Support Ticket #TICKET-001',
  body: 'Thank you for contacting support...',
  priority: 'high',
  trackingId: 'TRACK-1705318200000-XYZ',
  templateType: 'ticket_confirmation',
};

/**
 * Sample analytics data
 */
export const sampleAnalytics = {
  period: 'daily',
  date: '2024-01-15',
  totalTickets: 45,
  resolvedTickets: 38,
  averageResolutionTime: '3.2 hours',
  customerSatisfaction: 4.3,
  priorityBreakdown: {
    high: 8,
    medium: 25,
    low: 12,
  },
  departmentBreakdown: {
    Technology: 20,
    'Information Security': 5,
    'Website Design': 10,
    'Client Success': 10,
  },
};

/**
 * Create a mock date for consistent testing
 */
export function createMockDate(isoString = '2024-01-15T10:30:00Z') {
  return new Date(isoString);
}

/**
 * Create a list of sample tickets
 */
export function createSampleTickets(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleTicket,
    id: `TICKET-${String(i + 1).padStart(3, '0')}`,
    subject: `Sample ticket ${i + 1}`,
    priority: ['high', 'medium', 'low'][i % 3],
  }));
}
