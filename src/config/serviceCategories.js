/**
 * Centralized Service Categories Configuration
 * 
 * This file serves as the single source of truth for INT's service categories,
 * category keywords, and routing rules. Used by both the Gemini AI Service and
 * the Triage Engine to ensure consistency across the application.
 */

export const SERVICE_CATEGORIES = {
  infosec: {
    id: 'infosec',
    name: 'Information Security',
    description: 'Security assessments, SOC 2 compliance, cyber insurance, managed security',
    keywords: [
      'security', 'soc2', 'soc 2', 'compliance', 'audit', 'vulnerability', 
      'cyber insurance', 'breach', 'firewall', 'encryption', 'iso27001', 
      'iso 27001', 'hipaa'
    ]
  },
  technology: {
    id: 'technology',
    name: 'Technology',
    description: 'Managed IT, email migration, SaaS migration, business insights, hosting',
    keywords: [
      'managed it', 'helpdesk', 'email migration', 'network', 'server', 
      'cloud', 'hosting', 'saas', 'saas migration', 'microsoft365', 
      'microsoft 365', 'downtime', 'backup'
    ]
  },
  website_design: {
    id: 'website_design',
    name: 'Website Design',
    description: 'Custom websites, e-commerce, refreshes, migrations, accessibility',
    keywords: [
      'website', 'web design', 'ecommerce', 'e-commerce', 'wordpress', 
      'cms', 'mobile responsive', 'accessibility', 'ada', 'wcag', 
      'hosting', 'domain', 'ssl'
    ]
  },
  branding: {
    id: 'branding',
    name: 'Branding & Identity',
    description: 'Brand strategy, logo design, visual identity, messaging',
    keywords: [
      'brand', 'logo', 'visual identity', 'rebrand', 'design', 
      'collateral', 'brand voice', 'messaging', 'style guide'
    ]
  },
  content: {
    id: 'content',
    name: 'Content Creation & Strategy',
    description: 'Content strategy, SEO copywriting, e-books, whitepapers',
    keywords: [
      'content strategy', 'seo', 'blog', 'ebook', 'e-book', 'whitepaper', 
      'copywriting', 'website content', 'thought leadership'
    ]
  },
  marketing: {
    id: 'marketing',
    name: 'Managed Marketing',
    description: 'Marketing automation, HubSpot, CRM, email campaigns, inbound marketing',
    keywords: [
      'marketing', 'hubspot', 'crm', 'automation', 'email campaign', 
      'drip campaign', 'salesforce', 'analytics', 'lead generation', 'inbound'
    ]
  },
  operations: {
    id: 'operations',
    name: 'Operations',
    description: 'Bookkeeping, startup fundamentals, process management, AI Your BI℠',
    keywords: [
      'bookkeeping', 'accounting', 'startup', 'ein', 'process management', 
      'hris', 'payroll', 'benefits', 'ai your bi', 'analytics', 'fincen'
    ]
  },
  general: {
    id: 'general',
    name: 'General',
    description: 'Everything else or unclear requests',
    keywords: []
  }
};

/**
 * Get all category IDs for validation
 */
export function getCategoryIds() {
  return Object.keys(SERVICE_CATEGORIES);
}

/**
 * Get category keywords for triage matching
 */
export function getCategoryKeywords() {
  const keywords = {};
  for (const [id, category] of Object.entries(SERVICE_CATEGORIES)) {
    keywords[id] = category.keywords;
  }
  return keywords;
}

/**
 * Get formatted category list for AI prompts
 */
export function getCategoryListForPrompt() {
  return Object.values(SERVICE_CATEGORIES)
    .filter(cat => cat.id !== 'general')
    .map((cat, index) => `${index + 1}. ${cat.name} (${cat.id}) - ${cat.description}`)
    .join('\n');
}

/**
 * Get category rules for AI prompts
 */
export function getCategoryRulesForPrompt() {
  return Object.values(SERVICE_CATEGORIES)
    .map(cat => `- ${cat.id}: ${cat.keywords.join(', ')}`)
    .join('\n');
}

/**
 * Get valid category values for prompt
 */
export function getValidCategoryValues() {
  return getCategoryIds().join('|');
}

/**
 * INT Inc. company information
 */
export const INT_COMPANY_INFO = {
  tagline: 'Our Purpose is Your Business',
  totalCategories: 7,
  categoryIds: getCategoryIds().filter(id => id !== 'general')
};
