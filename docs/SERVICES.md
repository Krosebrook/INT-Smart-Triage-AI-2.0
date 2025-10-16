# Service Modules Documentation

> Comprehensive documentation for all backend service modules in the INT Smart Triage AI 2.0 system.

**Last Updated:** 2025-10-16
**Version:** 2.0
**Author:** Development Team

---

## Table of Contents

1. [Supabase Client Service](#1-supabase-client-service)
2. [Assignment Engine](#2-assignment-engine)
3. [Sentiment Analysis Service](#3-sentiment-analysis-service)
4. [Analytics Service](#4-analytics-service)
5. [Knowledge Base Service](#5-knowledge-base-service)
6. [Customer Profile Service](#6-customer-profile-service)
7. [Email Service](#7-email-service)
8. [Communication Hub](#8-communication-hub)
9. [Realtime Service](#9-realtime-service)
10. [Reporting Service](#10-reporting-service)

---

## 1. Supabase Client Service

**File:** `/src/supabaseClient.js`

### Purpose

Provides centralized database access layer for all Supabase operations. Acts as the primary interface for CRUD operations on reports, notes, assignments, and customer data.

### Key Exports

#### Main Client

```javascript
export const supabase: SupabaseClient | null
```

Singleton Supabase client instance. Returns `null` if environment variables are not configured.

#### Functions

##### `saveTriageReport(reportData)`

Save a new triage report to the database.

**Parameters:**

```javascript
{
  reportId: string,           // Unique report identifier
  customerName: string,        // Customer name
  ticketSubject: string,       // Ticket subject line
  issueDescription: string,    // Detailed issue description
  customerTone: string,        // Detected tone (neutral/frustrated/angry/urgent)
  priority: string,            // Priority level (high/medium/low)
  category: string,            // Issue category
  confidence: number,          // Confidence score (0-100)
  responseApproach: string,    // Recommended response strategy
  talkingPoints: Array<string>, // Key talking points
  knowledgeBase: Array<Object>, // Related KB articles
  department: string,          // Assigned department
  analysis: Object,            // Full sentiment analysis
  csrAgent: string            // CSR who processed the ticket
}
```

**Returns:**

```javascript
{
  success: boolean,
  data?: Object,     // Inserted report data
  error?: string     // Error message if failed
}
```

**Example:**

```javascript
import { saveTriageReport } from './supabaseClient.js';

const result = await saveTriageReport({
  reportId: 'TR-20251016-001',
  customerName: 'Acme Corp',
  ticketSubject: 'Login issues with portal',
  issueDescription: 'Users cannot access the dashboard',
  customerTone: 'frustrated',
  priority: 'high',
  category: 'Technical Issue',
  confidence: 92,
  responseApproach: 'immediate_technical_support',
  talkingPoints: ['Acknowledge urgency', 'Provide ETA'],
  knowledgeBase: [],
  department: 'Technology',
  csrAgent: 'Sarah Johnson',
});
```

##### `getCustomerReports(customerName)`

Retrieve all reports for a specific customer.

**Returns:**

```javascript
{
  success: boolean,
  data?: Array<Object>,
  count?: number,
  error?: string
}
```

##### `getReportById(reportId)`

Fetch a single report by its unique ID.

**Returns:**

```javascript
{
  success: boolean,
  data?: Object,
  error?: string
}
```

##### `searchReports(query, filters)`

Search reports with full-text search and filters.

**Parameters:**

```javascript
{
  query: string,              // Search text
  filters: {
    priority?: string,         // Filter by priority
    category?: string,         // Filter by category
    customerTone?: string,     // Filter by tone
    dateFrom?: string,         // Start date (ISO format)
    dateTo?: string,           // End date (ISO format)
    assignedTo?: string        // Filter by assigned CSR
  }
}
```

**Example:**

```javascript
const results = await searchReports('password reset', {
  priority: 'high',
  dateFrom: '2025-10-01T00:00:00Z',
  dateTo: '2025-10-16T23:59:59Z',
});
```

##### `getReportStats()`

Get aggregate statistics across all reports.

**Returns:**

```javascript
{
  success: boolean,
  data?: {
    total: number,
    byPriority: {
      high: number,
      medium: number,
      low: number
    },
    byCategory: Object,
    byTone: Object,
    recentCount: number  // Last 24 hours
  }
}
```

##### `updateReportStatus(reportId, status)`

Update the status of a report.

**Status Values:** `'new'` | `'assigned'` | `'in_progress'` | `'resolved'` | `'escalated'`

##### `getNotes(reportId)`

Get all notes for a specific report.

##### `addNote(reportId, noteText, csrAgent)`

Add a note to a report.

##### `deleteNote(noteId)`

Delete a specific note.

##### `assignReport(reportId, assignedTo)`

Manually assign a report to a CSR.

##### `getAvailableCSRs()`

Get all currently available CSR agents.

##### `autoAssignReport(reportId)`

Automatically assign a report using the database's stored procedure.

##### `getSuggestedResponses(issueDescription, category)`

Get AI-suggested response templates based on the issue.

##### `searchKnowledgeBase(query, category)`

Search the knowledge base for relevant articles.

### Dependencies

- `@supabase/supabase-js`

### Configuration

Required environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Implementation Details

- **Graceful Degradation:** All functions fail gracefully when Supabase is not configured
- **SQL Injection Protection:** Query inputs are sanitized with regex escaping
- **Timestamps:** All timestamps use ISO 8601 format
- **Result Limit:** Search queries are limited to 100 results by default

---

## 2. Assignment Engine

**File:** `/src/assignmentEngine.js`

### Purpose

Intelligent ticket routing and assignment system that automatically assigns incoming support tickets to the most appropriate CSR based on department expertise, workload, skill level, and ticket priority.

### Key Classes

#### `AssignmentEngine`

A comprehensive class for managing ticket assignments with multiple factors:

- Department-based routing
- Skill-based CSR selection
- Workload balancing
- Priority-aware assignment
- Ticket escalation

### Key Functions

##### `autoAssign(reportData)`

Automatically assign a report to the best available CSR.

**Algorithm:**

1. Determines appropriate department using keyword matching
2. Fetches available CSRs for that department
3. Scores CSRs based on:
   - Current workload (-10 points per ticket)
   - Satisfaction rating (+10 points per rating point)
   - Skill level (+20 for expert, +10 for senior)
   - Average resolution time (-5 points per hour)
   - Priority bonus (+30 for high-priority + expert)
4. Assigns to highest-scoring CSR

**Parameters:**

```javascript
{
  issueDescription: string,
  priority: string,  // 'high' | 'medium' | 'low'
  reportId: string
}
```

**Returns:**

```javascript
{
  success: boolean,
  assignedTo?: string,
  department?: string,
  estimatedResponseTime?: {
    minutes: number,
    display: string
  },
  error?: string
}
```

**Example:**

```javascript
import { assignmentEngine } from './assignmentEngine.js';

const result = await assignmentEngine.autoAssign({
  issueDescription: 'Need help securing our network infrastructure',
  priority: 'high',
  reportId: 'TR-12345',
});

console.log(result.assignedTo); // "Sarah Johnson"
console.log(result.department); // "Information Security"
```

##### `determineDepartment(issueDescription)`

Determines the best department based on keyword matching.

**Department Keywords:**

- **Information Security:** security, compliance, audit, vulnerability
- **Technology:** server, network, email, cloud, IT
- **Website Design:** website, web, design, ecommerce
- **Branding:** logo, brand, identity, visual
- **Content:** content, writing, seo, blog
- **Marketing:** marketing, campaign, crm, hubspot
- **Operations:** bookkeeping, accounting, workflow, process

**Returns:** `string` - Department name

##### `getAvailableCSRs(department, priority)`

Retrieves available CSRs filtered by department specialty.

**Returns:**

```javascript
Array<{
  id: number,
  name: string,
  email: string,
  specialties: Array<string>,
  skill_level: string,  // 'expert' | 'senior' | 'junior'
  current_workload: number,
  avg_resolution_time: number,  // hours
  satisfaction_rating: number   // 0-5
}>
```

##### `selectBestCSR(csrs, reportData)`

Applies scoring algorithm to select the best CSR.

##### `assignToCSR(reportId, csr)`

Assigns report to specific CSR and updates database.

##### `reassignTicket(reportId, newCSRName, reason)`

Reassigns a ticket to a different CSR.

**Example:**

```javascript
await assignmentEngine.reassignTicket(
  'TR-12345',
  'Emily Rodriguez',
  'Original CSR on vacation'
);
```

##### `escalateTicket(reportId, escalationReason)`

Escalates a ticket to high priority and assigns to supervisor.

**Validation:**

- Ticket must exist
- Ticket cannot already be resolved
- Ticket cannot be escalated twice

**Example:**

```javascript
const result = await assignmentEngine.escalateTicket(
  'TR-12345',
  'Customer threatening legal action'
);
```

##### `getWorkloadDistribution()`

Gets current workload across all CSRs.

**Returns:**

```javascript
{
  success: boolean,
  distribution?: Array<{
    name: string,
    workload: number,
    specialties: Array<string>,
    capacity: number  // Max 10 - current
  }>
}
```

##### `estimateResponseTime(priority, workload)`

Calculates estimated response time.

**Base Times:**

- High: 15 minutes
- Medium: 60 minutes
- Low: 240 minutes

**Adjustment:** +10 minutes per ticket in workload

### Data Structures

#### CSR Profile

```javascript
{
  id: number,
  name: string,
  email: string,
  specialties: Array<string>,
  skill_level: 'expert' | 'senior' | 'junior',
  current_workload: number,
  avg_resolution_time: number,  // hours
  satisfaction_rating: number,  // 0-5
  is_available: boolean
}
```

#### Assignment Result

```javascript
{
  success: boolean,
  assignedTo: string,
  department: string,
  estimatedResponseTime: {
    minutes: number,
    display: string  // "45 minutes" or "2 hours"
  }
}
```

### Dependencies

- `./supabaseClient.js`

### Implementation Details

- **Skill Matrix:** Maps CSR roles to department specialties
- **Mock Data:** Provides fallback data when database is unavailable
- **Audit Trail:** All assignments logged to `assignment_history` table
- **Error Handling:** Graceful fallbacks with detailed error messages

---

## 3. Sentiment Analysis Service

**File:** `/src/sentimentAnalysis.js`

### Purpose

AI-powered sentiment analysis engine that analyzes customer communications to determine emotional tone, escalation risk, and recommended response strategies.

### Key Classes

#### `SentimentAnalyzer`

### Key Functions

##### `analyze(text, customerTone)`

Performs comprehensive sentiment analysis on text.

**Analysis Factors:**

- Positive/negative word detection
- Urgency keywords
- Frustration indicators
- Escalation triggers
- CAPS LOCK usage
- Excessive punctuation (!!!, ???)
- Customer tone input

**Parameters:**

```javascript
text: string,          // Text to analyze
customerTone?: string  // Optional pre-classified tone
```

**Returns:**

```javascript
{
  sentiment: string,  // 'positive' | 'slightly_positive' | 'neutral' |
                     // 'slightly_negative' | 'negative'
  emotionalIntensity: string,  // 'low' | 'moderate' | 'high'
  scores: {
    positive: number,
    negative: number,
    urgency: number,
    frustration: number,
    overall: number  // positive - negative
  },
  escalationProbability: string,  // Percentage (0-100)
  recommendedAction: string,
  deEscalationTactics: Array<{
    priority: 'high' | 'medium' | 'low',
    tactic: string,
    script: string
  }>,
  flags: {
    capsLockDetected: boolean,
    excessiveExclamation: boolean,
    multipleQuestions: boolean,
    escalationKeywords: boolean,
    repeatedIssue: boolean
  },
  confidence: number  // 40-95%
}
```

**Example:**

```javascript
import { sentimentAnalyzer } from './sentimentAnalysis.js';

const analysis = sentimentAnalyzer.analyze(
  "I've been waiting for THREE DAYS and nobody has helped me!!!"
);

console.log(analysis.sentiment); // "negative"
console.log(analysis.escalationProbability); // "75.0"
console.log(analysis.recommendedAction); // "immediate_supervisor_involvement"
```

##### `predictEscalation(currentAnalysis, historicalData)`

Predicts escalation probability based on current and historical data.

**Historical Data Factors:**

- Past negative interactions (+10 points each)
- Recent unresolved tickets (+15 points each)

**Returns:**

```javascript
{
  probability: string,  // Percentage
  risk: 'high' | 'medium' | 'low',
  recommendSupervisor: boolean,
  suggestedCompensation: boolean
}
```

##### `analyzeTrend(analyses)`

Analyzes sentiment trend across multiple interactions.

**Parameters:**

```javascript
analyses: Array<AnalysisResult>
```

**Returns:**

```javascript
{
  trend: 'improving' | 'worsening' | 'stable' | 'insufficient_data',
  direction: number,  // Positive = improving, negative = worsening
  currentSentiment: string,
  historicalAverage: string,
  volatility: string  // Standard deviation
}
```

##### `generateResponseSuggestion(analysis)`

Generates recommended response based on sentiment analysis.

**Returns:**

```javascript
{
  opening: string,
  tone: string,  // 'immediate_action' | 'empathetic_professional' | 'helpful_professional'
  closing: string,
  urgency: 'immediate' | 'high' | 'normal',
  approvalRequired: boolean,
  suggestedCompensation: string
}
```

**Example:**

```javascript
const suggestion = sentimentAnalyzer.generateResponseSuggestion(analysis);

console.log(suggestion.opening);
// "I sincerely apologize for this situation and truly understand your frustration."
console.log(suggestion.suggestedCompensation);
// "consider_discount_or_credit"
```

### Data Structures

#### Word Sets

**Positive Words:** good, great, excellent, happy, satisfied, pleased, wonderful, fantastic, amazing, perfect, love, appreciate, thank, helpful, awesome, brilliant, outstanding, exceptional

**Negative Words:** bad, terrible, horrible, awful, poor, disappointing, frustrated, angry, upset, unhappy, dissatisfied, hate, worst, useless, broken, failed, error, problem, issue, unacceptable, disaster

**Urgency Words:** urgent, asap, immediately, critical, emergency, now, quickly, hurry, right away, time-sensitive, deadline, escalate

**Frustration Indicators:** again, still, multiple times, keep, keeps, repeatedly, every time, always, never, nobody, no one, waiting

**Escalation Triggers:** lawyer, legal, sue, refund, cancel, complaint, manager, supervisor, corporate, unacceptable, breach, violation

### Implementation Details

- **Scoring Algorithm:** Multi-factor weighted scoring system
- **Escalation Calculation:** `escalationRisk * 20 + negativeScore * 5 + frustrationScore * 10 + urgencyScore * 3`
- **Confidence Calculation:** Based on word count and sentiment word density
- **De-escalation Tactics:** Prioritized list of response strategies with scripts

### Usage Example

```javascript
// Complete workflow
const text =
  "This is the THIRD time I'm contacting support about this issue! Still not resolved!!!";

const analysis = sentimentAnalyzer.analyze(text, 'frustrated');
console.log(analysis.escalationProbability); // "85.0"

const prediction = sentimentAnalyzer.predictEscalation(
  analysis,
  historicalData
);
console.log(prediction.recommendSupervisor); // true

const suggestion = sentimentAnalyzer.generateResponseSuggestion(analysis);
console.log(suggestion.urgency); // "immediate"
```

---

## 4. Analytics Service

**File:** `/src/analyticsService.js`

### Purpose

Provides advanced analytics and reporting capabilities for ticket volume, priority distribution, department workload, CSR performance, and predictive analytics.

### Key Functions

##### `getTicketVolumeByDay(days)`

Retrieves ticket volume grouped by day.

**Parameters:**

```javascript
days: number = 30; // Number of days to look back
```

**Returns:**

```javascript
{
  success: boolean,
  data?: Array<{
    date: string,     // Localized date string
    count: number     // Number of tickets
  }>,
  error?: string
}
```

**Example:**

```javascript
import { getTicketVolumeByDay } from './analyticsService.js';

const volumeData = await getTicketVolumeByDay(7);
// Returns last 7 days of ticket volume
```

##### `getPriorityDistribution()`

Get distribution of tickets by priority level.

**Returns:**

```javascript
{
  success: boolean,
  data?: {
    counts: {
      high: number,
      medium: number,
      low: number
    },
    percentages: {
      high: string,    // "25.5"
      medium: string,  // "50.2"
      low: string      // "24.3"
    },
    total: number
  }
}
```

##### `getDepartmentWorkload()`

Get workload distribution across departments (last 7 days).

**Returns:**

```javascript
{
  success: boolean,
  data?: Array<{
    department: string,
    total: number,
    pending: number,
    resolved: number,
    utilization: string  // Percentage as string
  }>
}
```

##### `getCSRPerformanceMetrics()`

Get performance metrics for all CSRs (last 30 days).

**Returns:**

```javascript
{
  success: boolean,
  data?: Array<{
    agent: string,
    totalTickets: number,
    resolved: number,
    pending: number,
    resolutionRate: string,      // Percentage
    avgResolutionTime: string    // Hours
  }>
}
```

**Example:**

```javascript
const metrics = await getCSRPerformanceMetrics();
metrics.data.forEach((csr) => {
  console.log(`${csr.agent}: ${csr.resolutionRate}% resolution rate`);
});
```

##### `getResponseTimeAnalysis()`

Analyze response times by priority level.

**Returns:**

```javascript
{
  success: boolean,
  data?: {
    high: {
      count: number,
      avgResponseMinutes: string
    },
    medium: {
      count: number,
      avgResponseMinutes: string
    },
    low: {
      count: number,
      avgResponseMinutes: string
    }
  }
}
```

##### `getPredictiveTicketVolume()`

Predict ticket volume for next 24 hours based on historical patterns.

**Algorithm:**

1. Analyzes last 60 days of ticket data
2. Groups tickets by day-of-week and hour
3. Calculates average volume for each hour slot
4. Projects next 24 hours

**Returns:**

```javascript
{
  success: boolean,
  data?: Array<{
    hour: number,         // 0-23
    day: number,          // 0-6 (Sunday = 0)
    predictedVolume: number
  }>
}
```

##### `exportAnalyticsData(format, filters)`

Export analytics data in various formats.

**Parameters:**

```javascript
format: 'json' | 'csv',
filters: {
  startDate?: string,
  endDate?: string,
  priority?: string,
  department?: string
}
```

**Returns:**

```javascript
{
  success: boolean,
  data?: any,       // JSON object or CSV string
  format: string,
  error?: string
}
```

**Example:**

```javascript
const csvData = await exportAnalyticsData('csv', {
  startDate: '2025-10-01',
  endDate: '2025-10-16',
  priority: 'high',
});

// Download CSV
const blob = new Blob([csvData.data], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
```

### Dependencies

- `./supabaseClient.js`

### Implementation Details

- **Time Calculations:** Uses milliseconds since epoch for date math
- **Aggregation:** All aggregations performed in JavaScript (client-side)
- **CSV Conversion:** Handles nested objects and special characters
- **Default Periods:** Most functions default to 30-day lookback

---

## 5. Knowledge Base Service

**File:** `/src/knowledgeBaseService.js`

### Purpose

AI-powered knowledge base search system with semantic matching, relevance scoring, and article recommendations. Provides self-service support through intelligent article suggestions.

### Key Classes

#### `KnowledgeBaseService`

### Key Functions

##### `initialize()`

Loads knowledge base articles and builds search index.

**Process:**

1. Fetches articles from `/public/data/kb.json`
2. Builds inverted search index
3. Indexes title, category, department, tags, summary, and content

**Note:** Called automatically on first search if not initialized.

##### `search(query, options)`

Searches knowledge base with keyword and semantic matching.

**Parameters:**

```javascript
query: string,
options: {
  category?: string,      // Filter by category
  department?: string,    // Filter by department
  limit?: number,         // Max results (default: 10)
  minRelevance?: number   // Minimum relevance score (default: 0.3)
}
```

**Returns:**

```javascript
{
  success: boolean,
  query: string,
  results: Array<{
    id: string,
    title: string,
    category: string,
    department: string,
    tags: Array<string>,
    summary: string,
    content: string,
    relevance: string,  // Percentage
    url: string
  }>,
  totalResults: number
}
```

**Example:**

```javascript
import { knowledgeBaseService } from './knowledgeBaseService.js';

const results = await knowledgeBaseService.search(
  'password reset authentication',
  {
    category: 'Account Access',
    limit: 5,
    minRelevance: 0.5,
  }
);

results.results.forEach((article) => {
  console.log(`${article.title} - ${article.relevance}% relevant`);
});
```

##### `findSemanticMatches(query)`

Finds articles using semantic/synonym matching.

**Synonym Mappings:**

- security → protection, safety, compliance, audit
- hack → breach, attack, intrusion, vulnerability
- website → site, web, page, portal
- email → mail, message, correspondence
- slow → performance, speed, lag, delay
- marketing → campaign, promotion, advertising
- design → branding, visual, creative, ui

**Returns:** Array of `{index, score}` pairs

##### `getArticleById(articleId)`

Fetches a specific article and tracks view.

**Returns:**

```javascript
{
  success: boolean,
  article?: Object,
  error?: string
}
```

##### `getRelatedArticles(articleId, limit)`

Finds related articles based on category, department, and tags.

**Scoring:**

- Same category: +3 points
- Same department: +2 points
- Each common tag: +1 point

**Returns:**

```javascript
{
  success: boolean,
  articles?: Array<Object>
}
```

##### `getSuggestedArticles(issueDescription, options)`

Extracts keywords and suggests relevant articles.

**Process:**

1. Extracts keywords (removes stop words)
2. Ranks by frequency
3. Uses top 10 keywords for search

**Example:**

```javascript
const suggestions = await knowledgeBaseService.getSuggestedArticles(
  "I'm having trouble logging into my account. My password doesn't work anymore.",
  { limit: 3 }
);
```

##### `getPopularArticles(limit)`

Gets most popular articles by popularity score.

##### `getArticlesByCategory(category)`

Retrieves all articles in a specific category.

##### `getArticlesByDepartment(department)`

Retrieves all articles for a specific department.

##### `rateArticle(articleId, helpful, feedback)`

Submits user feedback on article helpfulness.

**Parameters:**

```javascript
articleId: string,
helpful: boolean,
feedback?: string  // Optional text feedback
```

##### `getSearchSuggestions(partial)`

Get autocomplete suggestions for search queries.

**Returns:**

```javascript
{
  success: boolean,
  suggestions: Array<string>  // Article titles and tags
}
```

### Data Structures

#### Article Schema

```javascript
{
  id: string,
  title: string,
  category: string,
  department: string,
  tags: Array<string>,
  summary: string,
  content: string,
  url: string,
  popularity_score: number,
  created_at: string,
  updated_at: string
}
```

### Dependencies

- `./supabaseClient.js`

### Configuration

Knowledge base articles loaded from: `/public/data/kb.json`

### Implementation Details

- **Search Index:** Inverted index using Map data structure
- **Min Word Length:** Only indexes words longer than 2 characters
- **Relevance Calculation:** `score / queryWordCount`
- **Semantic Boost:** Synonym matches contribute 0.5 points
- **View Tracking:** Increments article view count via database stored procedure

---

## 6. Customer Profile Service

**File:** `/src/customerProfileService.js`

### Purpose

Comprehensive customer intelligence system providing complete customer profiles, interaction history, sentiment analysis, lifetime value calculations, and churn risk assessment.

### Key Classes

#### `CustomerProfileService`

### Key Functions

##### `getCustomerProfile(customerId)`

Retrieves complete customer profile with analytics.

**Aggregates:**

- Basic profile information
- Ticket history
- Communication history
- Sentiment analysis
- Lifetime value
- Churn risk score

**Parameters:**

```javascript
customerId: string;
```

**Returns:**

```javascript
{
  success: boolean,
  profile?: {
    // Basic info
    customer_id: string,
    name: string,
    email: string,
    phone: string,
    company: string,
    tags: Array<string>,
    notes: string,
    created_at: string,

    // History
    tickets: Array<Object>,
    interactions: Array<Object>,

    // Analytics
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative',
      score: string,  // -2.00 to 2.00
      trend: 'improving' | 'stable' | 'worsening',
      recentAnalyses: Array<Object>
    },

    lifetimeValue: {
      ticketsResolved: number,
      totalTickets: number,
      avgTicketsPerMonth: string,
      estimatedValue: string,  // "$10,000"
      tier: 'premium' | 'gold' | 'standard'
    },

    riskScore: {
      score: number,  // 0-100
      level: 'high' | 'medium' | 'low',
      factors: {
        unresolvedTickets: number,
        negativeInteractions: number,
        avgResolutionTime: string,
        daysSinceLastContact: number
      },
      recommendations: Array<{
        priority: 'urgent' | 'high' | 'medium' | 'low',
        action: string,
        reason: string
      }>
    }
  }
}
```

**Example:**

```javascript
import { customerProfileService } from './customerProfileService.js';

const profile = await customerProfileService.getCustomerProfile('cust-12345');

if (profile.profile.riskScore.level === 'high') {
  console.log('HIGH CHURN RISK - Immediate action required');
  profile.profile.riskScore.recommendations.forEach((rec) => {
    console.log(`${rec.priority}: ${rec.action}`);
  });
}
```

##### `calculateOverallSentiment(tickets)`

Calculates sentiment based on recent ticket history.

**Process:**

1. Analyzes last 10 tickets
2. Calculates average sentiment score
3. Determines trend direction

**Sentiment Values:**

- positive: +2
- slightly_positive: +1
- neutral: 0
- slightly_negative: -1
- negative: -2

##### `calculateLifetimeValue(tickets)`

Estimates customer lifetime value.

**Calculation:**

- Base: $500 per resolved ticket
- Tiers:
  - Premium: > $10,000
  - Gold: > $5,000
  - Standard: ≤ $5,000

##### `calculateChurnRisk(tickets, interactions)`

Calculates churn risk based on multiple factors.

**Risk Factors:**

- Unresolved recent tickets: +15 points each
- Negative sentiment tickets: +20 points each
- Slow resolution times (>48h avg): +25 points
- No contact in 60+ days: +30 points

**Risk Levels:**

- High: > 70 points
- Medium: 40-70 points
- Low: < 40 points

**Example:**

```javascript
const riskScore = profile.riskScore;

if (riskScore.level === 'high') {
  // Trigger retention workflow
  await sendRetentionEmail(customerId);
  await notifyAccountManager(customerId);
}
```

##### `updateCustomerProfile(customerId, updates)`

Updates customer profile information.

**Example:**

```javascript
await customerProfileService.updateCustomerProfile('cust-12345', {
  name: 'John Doe',
  email: 'john.doe@acme.com',
  tags: ['vip', 'enterprise', 'priority-support'],
});
```

##### `addCustomerNote(customerId, noteText, csrAgent)`

Adds a note to customer profile.

##### `addCustomerTag(customerId, tag)`

Adds a tag to customer for categorization.

**Common Tags:** vip, enterprise, at-risk, champion, detractor

##### `findSimilarCustomers(customerId, limit)`

Finds customers with similar profiles.

**Similarity Factors:**

- Common tags: 30% weight
- Similar sentiment: 20% weight
- Same tier: 30% weight
- Similar risk score: 20% weight

**Example:**

```javascript
const similar = await customerProfileService.findSimilarCustomers(
  'cust-12345',
  5
);

// Apply successful strategies from similar customers
similar.similarCustomers.forEach((customer) => {
  console.log(`${customer.name} - ${customer.similarityScore}% similar`);
});
```

##### `getCommunicationPreferences(customerId)`

Retrieves customer's communication preferences.

**Returns:**

```javascript
{
  success: boolean,
  preferences: {
    email: boolean,
    sms: boolean,
    phone: boolean,
    preferredTime: string,  // "09:00-17:00"
    timezone: string        // "America/New_York"
  }
}
```

### Dependencies

- `./supabaseClient.js`
- `./sentimentAnalysis.js`

### Implementation Details

- **Parallel Queries:** Uses `Promise.all()` for efficient data fetching
- **Soft Fails:** Returns empty arrays for optional data (interactions)
- **Default Profiles:** Creates default profile if customer doesn't exist
- **Churn Prevention:** Automatic recommendation generation based on risk level

---

## 7. Email Service

**File:** `/src/emailService.js`

### Purpose

Automated email template system for customer communications with support for multiple templates, HTML generation, dynamic content injection, and email tracking.

### Key Classes

#### `EmailService`

### Email Templates

The service includes 6 pre-built templates:

1. **ticket_received** - Confirmation when ticket is created
2. **ticket_assigned** - Notification when assigned to CSR
3. **high_priority_alert** - Urgent notification for high-priority tickets
4. **resolution_confirmation** - Notification when ticket is resolved
5. **follow_up_reminder** - Follow-up check after resolution
6. **knowledge_base_articles** - Helpful resource suggestions

### Key Functions

##### `generateEmail(templateName, data)`

Generates email from template with variable substitution.

**Parameters:**

```javascript
templateName: string,
data: Object  // Key-value pairs for template variables
```

**Returns:**

```javascript
{
  subject: string,
  body: string,      // HTML body
  templateUsed: string
}
```

**Example:**

```javascript
import { emailService } from './emailService.js';

const email = emailService.generateEmail('ticket_received', {
  customerName: 'John Doe',
  reportId: 'TR-12345',
  priority: 'HIGH',
  department: 'Technology',
  ticketSubject: 'Server access issue',
  nextSteps: 'A specialist will contact you within 30 minutes',
  estimatedTime: '30 minutes',
  csrName: 'Sarah Johnson',
});

console.log(email.subject); // "Ticket #TR-12345 - We've Received Your Request"
```

##### `sendEmail(to, templateName, data, options)`

Sends email using specified template.

**Parameters:**

```javascript
to: string,             // Recipient email
templateName: string,
data: Object,
options: {
  from?: string,        // Default: 'support@intinc.com'
  replyTo?: string,
  attachments?: Array
}
```

**Returns:**

```javascript
{
  success: boolean,
  emailData: Object,
  message: string,
  trackingId: string    // Format: TRACK-{timestamp}-{random}
}
```

**Example:**

```javascript
const result = await emailService.sendEmail(
  'customer@example.com',
  'high_priority_alert',
  {
    customerName: 'Acme Corp',
    reportId: 'TR-12345',
    estimatedTime: '30 minutes',
    csrEmail: 'sarah.johnson@intinc.com',
    csrPhone: '(555) 123-4567',
    csrName: 'Sarah Johnson',
  }
);
```

##### `sendTicketConfirmation(reportData)`

Convenience method for sending ticket confirmation.

##### `sendAssignmentNotification(reportData, assignedTo)`

Sends notification when ticket is assigned.

##### `sendHighPriorityAlert(reportData, csrContact)`

Sends urgent alert for high-priority tickets.

##### `sendKnowledgeBaseArticles(reportData, articles)`

Sends helpful KB articles to customer.

**Example:**

```javascript
await emailService.sendKnowledgeBaseArticles(reportData, [
  {
    title: 'How to Reset Your Password',
    category: 'Account Access',
    readTime: '3 min',
    url: '/kb/password-reset',
  },
  {
    title: 'Two-Factor Authentication Setup',
    category: 'Security',
    readTime: '5 min',
    url: '/kb/2fa-setup',
  },
]);
```

##### `wrapInLayout(content, options)`

Wraps email content in professional HTML layout.

**Features:**

- Responsive design
- Brand colors (gradient header)
- Footer with company info
- Unsubscribe link
- Consistent styling

##### `stripHTML(html)`

Converts HTML to plain text for email text version.

##### `scheduleFollowUp(reportId, customerEmail, daysFromNow)`

Schedules a follow-up email.

**Returns:**

```javascript
{
  success: boolean,
  scheduledFor: string,  // ISO date
  reportId: string,
  customerEmail: string
}
```

##### `trackEmailOpen(trackingId)`

Tracks email open event.

##### `trackEmailClick(trackingId, linkUrl)`

Tracks link click in email.

### Template Variables

Each template accepts different variables. Common variables:

- `{customerName}` - Customer name
- `{reportId}` - Report ID
- `{priority}` - Priority level
- `{department}` - Department name
- `{ticketSubject}` - Ticket subject
- `{estimatedTime}` - Estimated response time
- `{csrName}` - CSR name
- `{csrEmail}` - CSR email
- `{csrPhone}` - CSR phone

### Implementation Details

- **Simulated Sending:** Currently simulates email sending (returns success)
- **Production Integration:** Can integrate with SendGrid, Amazon SES, Postmark
- **Tracking ID Format:** `TRACK-{timestamp}-{9-char-random}`
- **HTML Layout:** Professional responsive design with brand colors
- **Text Version:** Automatically generated from HTML

---

## 8. Communication Hub

**File:** `/src/communicationHub.js`

### Purpose

Centralized multi-channel communication system supporting email, SMS, Slack, Microsoft Teams, phone calls, and in-app chat. Provides unified interface for sending notifications and maintaining conversation history.

### Key Classes

#### `CommunicationHub`

### Supported Channels

- **Email** - Traditional email
- **SMS** - Text messages
- **Slack** - Slack workspace integration
- **Microsoft Teams** - Teams channel integration
- **Phone** - Automated phone calls
- **Chat** - In-app chat system

### Key Functions

##### `sendNotification(channel, recipient, message, options)`

Universal method for sending notifications across all channels.

**Parameters:**

```javascript
channel: 'email' | 'sms' | 'slack' | 'teams' | 'phone' | 'chat',
recipient: string,  // Email/phone/channel ID depending on channel
message: string,
options: Object     // Channel-specific options
```

**Returns:**

```javascript
{
  success: boolean,
  channel: string,
  recipient: string,
  messageId: string,
  sentAt: string,
  error?: string
}
```

**Example:**

```javascript
import { communicationHub } from './communicationHub.js';

// Send via Slack
await communicationHub.sendNotification(
  'slack',
  '#urgent-tickets',
  'High priority ticket requires immediate attention',
  { priority: 'high' }
);

// Send via SMS
await communicationHub.sendNotification(
  'sms',
  '+15551234567',
  'Urgent: Ticket TR-12345 assigned to you'
);
```

##### `sendEmail(recipient, message, options)`

Sends email notification.

##### `sendSms(phoneNumber, message, options)`

Sends SMS notification.

**Validation:**

- Phone must be in international format (+[country][number])
- Regex: `/^\+?[1-9]\d{1,14}$/`

**Returns:** Includes `segments` field (number of 160-char segments)

##### `sendSlack(channel, message, options)`

Sends Slack message.

**Options:**

```javascript
{
  username?: string,      // Bot username
  icon?: string,          // Bot icon emoji
  attachments?: Array,    // Slack attachments
  priority?: string       // Adds color coding
}
```

**Priority Colors:**

- high → 'danger' (red)
- normal → 'good' (green)

**Example:**

```javascript
await communicationHub.sendSlack(
  '#support-team',
  'New escalation: Customer threatening legal action',
  {
    priority: 'high',
    attachments: [
      {
        title: 'View Ticket',
        title_link: '/report-detail.html?id=TR-12345',
        color: 'danger',
      },
    ],
  }
);
```

##### `sendTeams(channelId, message, options)`

Sends Microsoft Teams message.

**Options:**

```javascript
{
  title?: string,         // Card title
  summary?: string,       // Card summary
  priority?: string,      // Sets theme color
  actions?: Array         // Actionable buttons
}
```

**Theme Colors:**

- high → 'FF0000' (red)
- normal → '0078D7' (blue)

**Example:**

```javascript
await communicationHub.sendTeams(
  'channel-id',
  'Critical security incident detected',
  {
    priority: 'high',
    title: '🚨 Security Alert',
    actions: [
      {
        '@type': 'OpenUri',
        name: 'View Details',
        targets: [{ uri: '/security/incident/123' }],
      },
    ],
  }
);
```

##### `sendPhone(phoneNumber, message, options)`

Initiates automated phone call.

**Returns:**

```javascript
{
  success: boolean,
  channel: 'phone',
  recipient: string,
  callId: string,
  duration: number,
  status: 'initiated',
  initiatedAt: string
}
```

##### `sendChat(userId, message, options)`

Sends in-app chat message.

**Behavior:**

- Stores message in `chat_messages` table
- Can be read by user in app
- Useful for non-urgent notifications

##### `broadcastToTeam(message, priority, excludeUsers)`

Broadcasts message across multiple channels (Slack, Teams, Email).

**Example:**

```javascript
await communicationHub.broadcastToTeam(
  'System maintenance scheduled for tonight at 11 PM',
  'normal',
  ['user-on-vacation-123']
);
```

##### `notifyHighPriorityTicket(ticketData)`

Specialized method for high-priority ticket notifications.

**Sends:**

- Slack message to #urgent-tickets
- Teams message to urgent-channel
- SMS to assigned CSR

**Parameters:**

```javascript
{
  reportId: string,
  customerName: string,
  ticketSubject: string,
  department: string,
  assignedPhone?: string
}
```

##### `getConversationHistory(reportId)`

Retrieves all communications related to a report.

**Returns:**

```javascript
{
  success: boolean,
  history?: Array<{
    channel: string,
    recipient: string,
    message: string,
    status: string,
    sent_at: string
  }>,
  count: number
}
```

##### `getChannelPreferences(userId)`

Gets user's preferred communication channels.

**Returns:**

```javascript
{
  success: boolean,
  preferences: {
    email: boolean,
    sms: boolean,
    slack: boolean,
    teams: boolean
  }
}
```

##### `updateChannelPreferences(userId, preferences)`

Updates user's channel preferences.

### Data Structures

#### Message ID Format

```
MSG-{timestamp}-{9-char-random}
```

#### Communication Log Entry

```javascript
{
  channel: string,
  recipient: string,
  report_id: string,
  message: string,      // Truncated to 500 chars
  status: string,
  sent_at: string
}
```

### Dependencies

- `./supabaseClient.js`

### Implementation Details

- **Channel Routing:** Dynamic method dispatch (`send${Channel}`)
- **Phone Validation:** International format required
- **Message Truncation:** Long messages truncated to 500 chars for logging
- **Fallback Behavior:** Returns success even if database unavailable
- **Audit Trail:** All communications logged to `communication_log`

---

## 9. Realtime Service

**File:** `/src/realtimeService.js`

### Purpose

Real-time collaboration service using Supabase Realtime for live updates, presence tracking, and ticket activity broadcasting.

### Key Classes

#### `RealtimeService`

### Key Functions

##### `subscribeToReports(callback)`

Subscribes to real-time changes on reports table.

**Triggers on:**

- INSERT (new report)
- UPDATE (status change, assignment, etc.)
- DELETE (report deleted)

**Parameters:**

```javascript
callback: (payload) => void
```

**Payload:**

```javascript
{
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  new: Object,    // New row data
  old: Object,    // Old row data (UPDATE/DELETE only)
  table: 'reports',
  schema: 'public'
}
```

**Example:**

```javascript
import { realtimeService } from './realtimeService.js';

realtimeService.subscribeToReports((payload) => {
  if (payload.eventType === 'INSERT') {
    console.log('New ticket created:', payload.new);
    // Update UI
    addTicketToList(payload.new);
  } else if (payload.eventType === 'UPDATE') {
    console.log('Ticket updated:', payload.new);
    // Update UI
    updateTicketInList(payload.new);
  }
});
```

##### `subscribeToNotes(reportId, callback)`

Subscribes to notes for a specific report.

**Example:**

```javascript
realtimeService.subscribeToNotes('TR-12345', (payload) => {
  if (payload.eventType === 'INSERT') {
    // New note added
    appendNoteToUI(payload.new);
  }
});
```

##### `trackPresence(csrName, status)`

Tracks CSR online/offline presence.

**Parameters:**

```javascript
csrName: string,
status: 'online' | 'away' | 'busy' | 'offline'
```

**Events:**

- `sync` - Presence state synchronized
- `join` - User joined
- `leave` - User left

**Example:**

```javascript
const channel = realtimeService.trackPresence('Sarah Johnson', 'online');

realtimeService.on('presence-update', (state) => {
  console.log('Online CSRs:', Object.keys(state));
  updatePresenceUI(state);
});

realtimeService.on('presence-join', ({ key, presences }) => {
  console.log(`${key} came online`);
});

realtimeService.on('presence-leave', ({ key, presences }) => {
  console.log(`${key} went offline`);
});
```

##### `broadcastTicketActivity(reportId, activity)`

Broadcasts ticket activity to all connected clients.

**Activity Types:**

- Viewing ticket
- Adding note
- Changing status
- Assigning CSR

**Example:**

```javascript
realtimeService.broadcastTicketActivity('TR-12345', {
  type: 'viewing',
  user: 'Sarah Johnson',
  timestamp: new Date().toISOString(),
});
```

##### `subscribeToTicketActivity(callback)`

Subscribes to ticket activity broadcasts.

**Example:**

```javascript
realtimeService.subscribeToTicketActivity((payload) => {
  const { reportId, activity } = payload.payload;

  if (activity.type === 'viewing') {
    showViewerIndicator(reportId, activity.user);
  }
});
```

##### `notifyCSRs(message, priority)`

Sends notification to all online CSRs.

**Parameters:**

```javascript
message: string,
priority: 'urgent' | 'high' | 'normal' | 'low'
```

##### `getOnlineCSRs()`

Gets list of currently online CSRs.

**Returns:**

```javascript
Object<string, {
  user: string,
  status: string,
  online_at: string
}>
```

##### `unsubscribe(channelName)`

Unsubscribes from a specific channel.

##### `unsubscribeAll()`

Cleans up all subscriptions.

### Event Handling

##### `on(eventName, handler)`

Registers event handler.

**Events:**

- `presence-update` - Presence state changed
- `presence-join` - User joined
- `presence-leave` - User left

##### `off(eventName, handler)`

Removes event handler.

### Dependencies

- `./supabaseClient.js`
- Supabase Realtime

### Implementation Details

- **Channel Management:** Stores channels in Map for easy cleanup
- **Presence State:** Maintains local copy of presence state
- **Custom Events:** Internal event system for presence updates
- **Graceful Degradation:** Returns null if Supabase not configured

### Usage Example

```javascript
// Complete realtime setup
import { realtimeService } from './realtimeService.js';

// Track presence
realtimeService.trackPresence('Sarah Johnson', 'online');

// Subscribe to reports
realtimeService.subscribeToReports((payload) => {
  refreshTicketList();
});

// Subscribe to activity
realtimeService.subscribeToTicketActivity((payload) => {
  showActivityNotification(payload.payload);
});

// Listen for presence changes
realtimeService.on('presence-update', (state) => {
  updateOnlineIndicators(state);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  realtimeService.unsubscribeAll();
});
```

---

## 10. Reporting Service

**File:** `/src/reportingService.js`

### Purpose

Comprehensive reporting and export system for generating executive summaries, performance reports, customer satisfaction reports, and operational metrics with support for multiple export formats.

### Key Classes

#### `ReportingService`

### Report Templates

The service includes 5 pre-built report templates:

1. **executive_summary** - High-level overview for leadership
2. **csr_performance** - Individual and team performance metrics
3. **customer_satisfaction** - CSAT scores and sentiment analysis
4. **operational_metrics** - Detailed operational statistics
5. **department_analysis** - Department-specific insights

### Key Functions

##### `generateReport(templateName, options)`

Generates a complete report from template.

**Parameters:**

```javascript
templateName: string,
options: {
  startDate?: Date,    // Default: 30 days ago
  endDate?: Date,      // Default: now
  format?: 'json' | 'csv' | 'pdf' | 'excel',
  csrAgent?: string    // Who generated the report
}
```

**Returns:**

```javascript
{
  success: boolean,
  report?: {
    metadata: {
      templateName: string,
      templateDescription: string,
      generatedAt: string,
      dateRange: {
        start: string,
        end: string
      },
      generatedBy: string
    },
    sections: Object  // Section data
  },
  format: string,
  data?: string,      // CSV/Excel/PDF data
  filename?: string
}
```

**Example:**

```javascript
import { reportingService } from './reportingService.js';

const report = await reportingService.generateReport('executive_summary', {
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-16'),
  format: 'json',
  csrAgent: 'Sarah Johnson',
});

console.log(report.report.sections.overview);
// {
//   totalTickets: 156,
//   resolved: 142,
//   pending: 14,
//   avgResolutionTime: "3.2 hours",
//   resolutionRate: "91.0"
// }
```

##### `generateCustomReport(sections, options)`

Generates custom report with specified sections.

**Available Sections:**

- overview
- priorities
- performance
- trends
- workload
- resolution_times
- satisfaction
- efficiency
- sentiment
- feedback
- volume
- response_times
- sla
- escalations

**Example:**

```javascript
const customReport = await reportingService.generateCustomReport(
  ['overview', 'performance', 'satisfaction'],
  {
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-16'),
  }
);
```

##### `exportToCSV(reportData)`

Exports report data to CSV format.

**Returns:**

```javascript
{
  success: boolean,
  data: string,      // CSV content
  format: 'csv',
  filename: string
}
```

**Example:**

```javascript
const csvReport = await reportingService.exportToCSV(report.report);

// Create download
const blob = new Blob([csvReport.data], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = csvReport.filename;
a.click();
```

##### `exportToPDF(reportData)`

Exports report to PDF (requires server-side implementation).

##### `exportToExcel(reportData)`

Exports report to Excel (requires library integration).

##### `scheduleReport(templateName, schedule, recipients)`

Schedules automatic report generation.

**Parameters:**

```javascript
templateName: string,
schedule: 'daily' | 'weekly' | 'monthly',
recipients: Array<string>  // Email addresses
```

**Returns:**

```javascript
{
  success: boolean,
  scheduleId: string,
  templateName: string,
  schedule: string,
  recipients: Array<string>,
  nextRunAt: string  // ISO date
}
```

**Example:**

```javascript
await reportingService.scheduleReport('executive_summary', 'weekly', [
  'ceo@intinc.com',
  'coo@intinc.com',
]);
```

##### `getSavedReports(limit)`

Retrieves previously generated reports.

##### `saveReport(reportData, name)`

Saves a report to database.

##### `getAvailableTemplates()`

Gets list of all available report templates.

**Returns:**

```javascript
Array<{
  id: string,
  name: string,
  description: string,
  sections: Array<string>,
  frequency: string
}>
```

### Report Sections

Each section provides specific analytics:

#### Overview Section

```javascript
{
  totalTickets: number,
  resolved: number,
  pending: number,
  avgResolutionTime: string,
  resolutionRate: string  // Percentage
}
```

#### Performance Section

```javascript
Array<{
  agent: string,
  totalTickets: number,
  resolved: number,
  pending: number,
  resolutionRate: string,
  avgResolutionTime: string
}>
```

#### Priorities Section

```javascript
{
  counts: {
    high: number,
    medium: number,
    low: number
  },
  percentages: {
    high: string,
    medium: string,
    low: string
  },
  total: number
}
```

#### Trends Section

```javascript
Array<{
  date: string,
  count: number
}>
```

#### Workload Section

```javascript
Array<{
  department: string,
  total: number,
  pending: number,
  resolved: number,
  utilization: string
}>
```

#### Satisfaction Section

```javascript
{
  overallScore: number,  // 0-5
  totalResponses: number,
  distribution: {
    5: number,  // Number of 5-star ratings
    4: number,
    3: number,
    2: number,
    1: number
  }
}
```

#### SLA Section

```javascript
{
  met: number,      // Percentage
  breached: number, // Percentage
  atRisk: number    // Count
}
```

### Dependencies

- `./supabaseClient.js`
- `./analyticsService.js`

### Implementation Details

- **Date Handling:** Defaults to 30-day lookback period
- **CSV Generation:** Handles nested objects and arrays
- **Mock Data:** Provides sample data when database unavailable
- **Schedule Calculation:** Schedules run at 9 AM in configured timezone

### Usage Example

```javascript
// Generate monthly executive summary
const report = await reportingService.generateReport('executive_summary', {
  startDate: new Date('2025-09-01'),
  endDate: new Date('2025-09-30'),
  format: 'json',
});

// Export to CSV
const csv = await reportingService.exportToCSV(report.report);

// Save for future reference
await reportingService.saveReport(report.report, 'September 2025 Summary');

// Schedule monthly reports
await reportingService.scheduleReport('executive_summary', 'monthly', [
  'leadership@intinc.com',
]);
```

---

## Common Patterns Across Services

### Error Handling

All services follow consistent error handling:

```javascript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return { success: true, data };
} catch (error) {
  console.error('Error message', error.message, { context });
  return { success: false, error: error.message };
}
```

### Return Format

Standard return format across all services:

```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

### Graceful Degradation

Services handle missing dependencies gracefully:

```javascript
if (!supabase) {
  return { success: false, error: 'Database not configured' };
}
```

### Timestamps

All timestamps use ISO 8601 format:

```javascript
new Date().toISOString(); // "2025-10-16T15:30:45.123Z"
```

### Configuration

Environment variables follow Vite convention:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Integration Examples

### Complete Ticket Workflow

```javascript
// 1. Analyze incoming ticket
import { sentimentAnalyzer } from './sentimentAnalysis.js';
const sentiment = sentimentAnalyzer.analyze(ticketDescription);

// 2. Save to database
import { saveTriageReport } from './supabaseClient.js';
const report = await saveTriageReport({
  ...ticketData,
  customerTone: sentiment.sentiment,
  priority: sentiment.escalationProbability > 70 ? 'high' : 'medium',
});

// 3. Auto-assign to CSR
import { assignmentEngine } from './assignmentEngine.js';
const assignment = await assignmentEngine.autoAssign({
  issueDescription: ticketDescription,
  priority: report.priority,
  reportId: report.reportId,
});

// 4. Send notifications
import { communicationHub } from './communicationHub.js';
await communicationHub.notifyHighPriorityTicket({
  reportId: report.reportId,
  customerName: ticketData.customerName,
  ticketSubject: ticketData.ticketSubject,
  department: assignment.department,
});

// 5. Send email to customer
import { emailService } from './emailService.js';
await emailService.sendTicketConfirmation(report);

// 6. Suggest KB articles
import { knowledgeBaseService } from './knowledgeBaseService.js';
const articles = await knowledgeBaseService.getSuggestedArticles(
  ticketDescription,
  { limit: 3 }
);

if (articles.results.length > 0) {
  await emailService.sendKnowledgeBaseArticles(report, articles.results);
}

// 7. Update customer profile
import { customerProfileService } from './customerProfileService.js';
await customerProfileService.addCustomerNote(
  customerId,
  `New ticket created: ${report.reportId}`,
  'System'
);
```

### Real-time Dashboard

```javascript
import { realtimeService } from './realtimeService.js';
import { getReportStats } from './supabaseClient.js';

// Track presence
realtimeService.trackPresence(currentUser, 'online');

// Subscribe to live updates
realtimeService.subscribeToReports((payload) => {
  if (payload.eventType === 'INSERT') {
    // New ticket - update stats
    updateDashboardStats();
    showNotification(`New ${payload.new.priority} priority ticket`);
  }
});

// Show online team members
realtimeService.on('presence-update', (state) => {
  const online = Object.keys(state);
  updateOnlineCount(online.length);
});

// Initial load
const stats = await getReportStats();
renderDashboard(stats.data);
```

### Analytics Dashboard

```javascript
import {
  getTicketVolumeByDay,
  getPriorityDistribution,
  getCSRPerformanceMetrics,
} from './analyticsService.js';

// Load all analytics
const [volume, priorities, performance] = await Promise.all([
  getTicketVolumeByDay(30),
  getPriorityDistribution(),
  getCSRPerformanceMetrics(),
]);

// Render charts
renderVolumeChart(volume.data);
renderPriorityDonut(priorities.data);
renderPerformanceTable(performance.data);
```

---

## Testing

### Unit Testing Example

```javascript
import { sentimentAnalyzer } from './sentimentAnalysis.js';

describe('SentimentAnalyzer', () => {
  test('detects negative sentiment', () => {
    const result = sentimentAnalyzer.analyze(
      "This is terrible! I'm very angry and frustrated!!!"
    );

    expect(result.sentiment).toBe('negative');
    expect(parseFloat(result.escalationProbability)).toBeGreaterThan(50);
  });

  test('detects positive sentiment', () => {
    const result = sentimentAnalyzer.analyze(
      'Great service! Thank you so much, very helpful!'
    );

    expect(result.sentiment).toBe('positive');
    expect(parseFloat(result.escalationProbability)).toBeLessThan(30);
  });
});
```

---

## Performance Considerations

### Database Queries

- **Indexing:** Ensure indexes on frequently queried columns (created_at, priority, status)
- **Limits:** Always use limits on large queries (default: 100)
- **Parallel Queries:** Use `Promise.all()` for independent queries

### Caching

- **Knowledge Base:** Loads once and caches in memory
- **Search Index:** Built on initialization, reused for all searches
- **Presence State:** Local copy maintained for quick access

### Real-time Optimization

- **Channel Management:** Reuse channels when possible
- **Unsubscribe:** Always cleanup subscriptions when component unmounts
- **Throttling:** Consider throttling high-frequency updates

---

## Security Considerations

### Input Validation

All user inputs are validated and sanitized:

```javascript
// SQL injection prevention
const sanitizedQuery = query?.trim().replace(/[%_]/g, '\\$&') || '';
```

### Authentication

- All database operations require valid Supabase JWT
- Row-level security policies enforced at database level
- API keys stored in environment variables only

### Data Privacy

- Customer data access logged
- PII handled according to privacy policies
- Communication preferences respected

---

## Migration Guide

### From Version 1.0 to 2.0

1. **Update imports:**

   ```javascript
   // Old
   import { supabase } from './src/supabase.js';

   // New
   import { supabase } from './src/supabaseClient.js';
   ```

2. **Update function calls:**

   ```javascript
   // Old
   const result = await getCustomerHistory(customerId);

   // New
   const result = await customerProfileService.getCustomerProfile(customerId);
   ```

3. **Update environment variables:**
   ```bash
   # Add VITE_ prefix
   SUPABASE_URL → VITE_SUPABASE_URL
   SUPABASE_ANON_KEY → VITE_SUPABASE_ANON_KEY
   ```

---

## Troubleshooting

### Common Issues

**Issue:** `Database not configured` error

**Solution:** Check environment variables are set correctly:

```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Issue:** Real-time updates not working

**Solution:** Ensure Supabase Realtime is enabled in project settings and channels are properly subscribed.

**Issue:** Search returns no results

**Solution:** Verify knowledge base JSON is loaded correctly and search index is built.

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Architecture Documentation](/docs/ARCHITECTURE.md)
- [API Reference](/docs/API_REFERENCE.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Maintained By:** INT Inc. Development Team
