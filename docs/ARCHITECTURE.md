# INT Smart Triage AI 2.0 - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Component Diagram](#component-diagram)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Security Architecture](#security-architecture)
6. [Technology Stack](#technology-stack)
7. [Design Decisions](#design-decisions)

---

## System Overview

**INT Smart Triage AI 2.0** is an intelligent customer support ticket triage system that leverages AI-powered analysis to automatically prioritize, route, and assign support tickets to the most appropriate Customer Success Representatives (CSRs). The system provides real-time analytics, sentiment analysis, and multi-channel communication capabilities.

### Key Capabilities

- **AI-Powered Triage**: Automated priority determination with confidence scoring
- **Intelligent Routing**: Department and CSR matching based on skills and workload
- **Sentiment Analysis**: Customer tone and emotion detection
- **Real-time Collaboration**: Live updates across team members
- **Multi-channel Communication**: Email, SMS, Slack, Teams, Phone, Chat
- **Advanced Analytics**: Predictive insights and performance metrics
- **Progressive Web App**: Offline capability and installable interface

---

## Architecture Patterns

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend (Vanilla JS + HTML5 + CSS3)                 │  │
│  │  - CSR Dashboard (index.html)                         │  │
│  │  - Analytics Dashboard (advanced-analytics.html)      │  │
│  │  - Client History (client-history.html)               │  │
│  │  - KB Search (kb-search.html)                         │  │
│  │  - Service Worker (PWA - sw.js)                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Serverless API (Vercel Functions)                    │  │
│  │  - POST /api/triage-report                            │  │
│  │  - GET /api/health-check                              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Business Logic Services (src/)                       │  │
│  │  - Assignment Engine                                  │  │
│  │  - Sentiment Analyzer                                 │  │
│  │  - Analytics Service                                  │  │
│  │  - Knowledge Base Service                             │  │
│  │  - Customer Profile Service                           │  │
│  │  - Communication Hub                                  │  │
│  │  - Email Service                                      │  │
│  │  - Reporting Service                                  │  │
│  │  - Realtime Service                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ Service Role Key
┌─────────────────────────────────────────────────────────────┐
│                        DATA TIER                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL + Auth + Realtime)             │  │
│  │  - Row Level Security (RLS)                           │  │
│  │  - Real-time Subscriptions                            │  │
│  │  - Edge Functions                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns Implemented

#### 1. **Service Layer Pattern**

Each domain has a dedicated service encapsulating business logic:

- `SentimentAnalyzer` - Emotion and tone analysis
- `AssignmentEngine` - Ticket routing logic
- `AnalyticsService` - Metrics and reporting
- `CustomerProfileService` - Customer relationship intelligence

**Benefits**:

- Separation of concerns
- Reusable business logic
- Easier unit testing
- Single responsibility principle

#### 2. **Singleton Pattern**

Services are instantiated once and exported as singletons:

```javascript
// Example from sentimentAnalysis.js
export const sentimentAnalyzer = new SentimentAnalyzer();
```

**Benefits**:

- Memory efficiency
- Consistent state across application
- Global access point

#### 3. **Repository Pattern**

`supabaseClient.js` acts as the data access layer:

```javascript
// CRUD operations abstracted from business logic
export const saveTriageReport = async (reportData) => {
  /* ... */
};
export const getCustomerReports = async (customerId) => {
  /* ... */
};
export const searchReports = async (filters) => {
  /* ... */
};
```

**Benefits**:

- Database logic centralized
- Easy to mock for testing
- Database implementation can be swapped

#### 4. **Observer Pattern**

Real-time subscriptions for live data updates:

```javascript
// From realtimeService.js
subscribeToReports((payload) => {
  console.log('Report updated:', payload);
  // Update UI automatically
});
```

**Benefits**:

- Real-time collaboration
- Decoupled components
- Event-driven architecture

#### 5. **Strategy Pattern**

Multiple strategies for reports and communication:

```javascript
// Report generation strategies
generateExecutiveSummary();
generateCSRPerformanceReport();
generateDepartmentAnalysis();

// Communication channel strategies
sendEmail();
sendSMS();
sendSlackMessage();
sendTeamsMessage();
```

**Benefits**:

- Flexible algorithm selection
- Open/closed principle
- Runtime behavior modification

---

## Component Diagram

### System Components and Their Interactions

```
┌──────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Dashboard  │  │  Analytics  │  │ Client Hist │             │
│  │ (index.html)│  │   (Chart.js)│  │   (History) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                 │                 │                     │
│  ┌──────▼─────────────────▼─────────────────▼──────┐            │
│  │         triage.js (Client-side Logic)            │            │
│  └──────────────────────┬───────────────────────────┘            │
│                         │                                         │
│  ┌──────────────────────▼───────────────────────────┐            │
│  │       Service Worker (sw.js) - PWA Cache          │            │
│  └──────────────────────┬───────────────────────────┘            │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS POST
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                              │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │ /api/triage-report │         │ /api/health-check  │          │
│  │  (Main Endpoint)   │         │  (Health Monitor)  │          │
│  └─────────┬──────────┘         └────────────────────┘          │
└────────────┼─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ assignmentEngine │  │ sentimentAnalyzer│                     │
│  │  - autoAssign()  │  │  - analyze()     │                     │
│  │  - selectBestCSR│  │  - detectTone()  │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │                      │                                │
│  ┌────────▼──────────────────────▼─────────┐                    │
│  │    supabaseClient (Data Access)         │                    │
│  │  - saveTriageReport()                   │                    │
│  │  - getCustomerReports()                 │                    │
│  │  - searchKnowledgeBase()                │                    │
│  └────────┬────────────────────────────────┘                    │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼ Service Role Key
┌──────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Supabase PostgreSQL Database              │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │  Tables:                                               │     │
│  │  - reports            (Main ticket data)               │     │
│  │  - report_notes       (Internal annotations)           │     │
│  │  - customer_profiles  (Customer data)                  │     │
│  │  - csr_profiles       (Team members)                   │     │
│  │  - communication_log  (Message history)                │     │
│  │  - user_preferences   (Settings)                       │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Row Level Security (RLS) Policies               │     │
│  │  - Default: DENY ALL                                   │     │
│  │  - Service Role: ALLOW ALL                             │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │           Realtime Subscriptions (WebSocket)            │     │
│  │  - Report changes (INSERT, UPDATE, DELETE)             │     │
│  │  - Note changes                                        │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │   EXTERNAL SERVICES     │
                    ├─────────────────────────┤
                    │  - Email (SMTP)         │
                    │  - SMS (Twilio)         │
                    │  - Slack API            │
                    │  - Microsoft Teams      │
                    └─────────────────────────┘
```

---

## Data Flow Architecture

### Ticket Triage Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Input                                          │
└─────────────────────────────────────────────────────────────────┘
    Customer fills form in index.html
    - Customer Name, Email, Company
    - Subject Line
    - Ticket Description
    - Priority Hint (optional)
    - Contact Preferences
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Client-side Validation (triage.js)                     │
└─────────────────────────────────────────────────────────────────┘
    - Required field validation
    - Email format validation
    - Local triage analysis (offline capability)
    - Pre-calculate confidence scores
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: API Request (POST /api/triage-report)                  │
└─────────────────────────────────────────────────────────────────┘
    Request Headers:
    - Content-Type: application/json
    - User-Agent: [browser info]

    Request Body:
    {
      "customerName": "string",
      "customerEmail": "email",
      "subject": "string",
      "description": "string",
      "priority": "low|medium|high",
      "metadata": {}
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Server-side Processing                                 │
└─────────────────────────────────────────────────────────────────┘
    A. Input Sanitization
       - XSS prevention
       - SQL injection prevention
       - Remove malicious content

    B. Sentiment Analysis (sentimentAnalyzer.analyze())
       - Calculate sentiment score (-100 to +100)
       - Detect tone (calm, frustrated, angry, confused, urgent)
       - Calculate confidence level
       - Identify urgency indicators

    C. Priority Determination
       - Analyze keywords
       - Check urgency words (urgent, asap, critical)
       - Sentiment influence
       - Customer history check
       - Confidence scoring (0-100%)

    D. Category Classification
       - Account Management
       - Billing/Payment
       - Technical Support
       - General Inquiry
       - Feature Request
       - Bug Report
       - Complaint

    E. Department Routing (assignmentEngine)
       - Keyword matching
       - InfoSec: security, compliance, SOC2, GDPR
       - Technology: server, network, cloud, backup
       - WebDesign: website, ecommerce, Shopify
       - Branding: logo, brand, visual identity
       - Content: SEO, writing, blog, content strategy
       - Marketing: HubSpot, CRM, campaign
       - Operations: bookkeeping, accounting, workflow

    F. CSR Assignment (assignmentEngine.autoAssign())
       - Skill matching
       - Workload balancing
       - Availability check
       - Priority consideration

    G. Knowledge Base Suggestions (knowledgeBaseService)
       - Full-text search in kb.json
       - Relevance scoring (>30% threshold)
       - Category filtering
       - Department-based suggestions

    H. Response Approach Generation
       - Tone-appropriate talking points
       - Suggested templates
       - Empathy phrases based on sentiment
       - Action items
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Database Persistence (supabaseClient.saveTriageReport) │
└─────────────────────────────────────────────────────────────────┘
    Supabase Service Role Key Authentication
                    ↓
    RLS Policy Check
    - Public: DENY (blocks client-side access)
    - Service Role: ALLOW
                    ↓
    Insert into `reports` table:
    {
      report_id: UUID (auto-generated)
      customer_name: string
      customer_email: string
      customer_company: string
      subject: string
      description: string
      priority: string
      confidence_score: number
      category: string
      department: string
      csr_agent: string
      sentiment_score: number
      tone: string
      suggested_kb_articles: jsonb
      talking_points: jsonb
      response_approach: string
      status: 'new'
      created_at: timestamp
      processed_at: timestamp
      updated_at: timestamp
      ip_address: string (audit)
      user_agent: string (audit)
      session_id: string (audit)
    }
                    ↓
    Database Trigger: update_updated_at_column()
    Indexes: report_id, created_at, priority, csr_agent
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Audit Logging                                          │
└─────────────────────────────────────────────────────────────────┘
    console.log({
      event: 'TRIAGE_REPORT_CREATED',
      reportId: UUID,
      timestamp: ISO8601,
      ipAddress: string,
      userAgent: string,
      priority: string,
      confidence: number
    })
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: API Response                                           │
└─────────────────────────────────────────────────────────────────┘
    HTTP 200 OK
    {
      "success": true,
      "reportId": "uuid",
      "priority": "high",
      "confidence": 87,
      "assignedTo": "Sarah Johnson",
      "department": "InfoSec",
      "estimatedResponseTime": "2 hours",
      "suggestedArticles": [
        {
          "id": "kb001",
          "title": "SOC2 Compliance Guide",
          "relevance": 0.89
        }
      ],
      "talkingPoints": [
        "Acknowledge compliance concern",
        "Confirm timeline expectations"
      ]
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: UI Update                                              │
└─────────────────────────────────────────────────────────────────┘
    - Display success message
    - Show assigned CSR
    - Show priority badge
    - Display confidence score
    - Show suggested KB articles
    - Display talking points
    - Render response approach
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Real-time Broadcast (realtimeService)                  │
└─────────────────────────────────────────────────────────────────┘
    Supabase Postgres Changes (WebSocket)
                    ↓
    All subscribed clients receive event:
    {
      eventType: 'INSERT',
      table: 'reports',
      new: { /* report data */ }
    }
                    ↓
    Connected CSR dashboards update automatically:
    - New ticket appears in queue
    - Real-time counter increments
    - Notification badge updates
    - Audio/visual alert (if enabled)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Communication (Optional)                              │
└─────────────────────────────────────────────────────────────────┘
    If high-priority ticket:
      - Send email notification to assigned CSR
      - Send Slack message to department channel
      - Send Teams notification
      - Log to communication_log table

    Customer acknowledgement:
      - Send "Ticket Received" email
      - Include report ID
      - Show estimated response time
      - Provide self-service KB links
```

### Analytics Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ Raw Data Sources                                                │
└─────────────────────────────────────────────────────────────────┘
    - reports table (all tickets)
    - report_notes table (annotations)
    - communication_log table (interactions)
    - customer_profiles table (customer data)
    - csr_profiles table (team metrics)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Analytics Service (analyticsService.js)                         │
└─────────────────────────────────────────────────────────────────┘
    A. getTicketVolumeByDay(days)
       - Query last N days
       - Group by date
       - Count tickets per day
       - Calculate trend (increase/decrease %)

    B. getPriorityDistribution()
       - Count by priority level
       - Calculate percentages
       - Compare to historical baseline

    C. getDepartmentWorkload()
       - Count tickets per department
       - Calculate average resolution time
       - Identify bottlenecks

    D. getCSRPerformanceMetrics(csrId)
       - Tickets assigned
       - Tickets resolved
       - Resolution rate (%)
       - Average handle time
       - Customer satisfaction score
       - Sentiment trend

    E. predictTicketVolume(days)
       - Linear regression on historical data
       - Seasonality adjustment
       - Confidence intervals
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Data Visualization (Chart.js)                                  │
└─────────────────────────────────────────────────────────────────┘
    - Line charts (ticket volume trends)
    - Bar charts (priority distribution)
    - Pie charts (department workload)
    - Scatter plots (CSR performance)
    - Area charts (predictive forecasting)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard Display (advanced-analytics.html)                    │
└─────────────────────────────────────────────────────────────────┘
    - Real-time metrics
    - Interactive charts
    - Drill-down capability
    - Export options (PDF, Excel, CSV)
```

---

## Security Architecture

### Multi-Layered Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: Network Security                                      │
└─────────────────────────────────────────────────────────────────┘
    - HTTPS/TLS encryption (in transit)
    - Vercel edge network
    - DDoS protection
    - Rate limiting
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: HTTP Security Headers                                 │
└─────────────────────────────────────────────────────────────────┘
    Strict-Transport-Security: max-age=31536000
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    X-XSS-Protection: 1; mode=block
    Content-Security-Policy: default-src 'self'
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: Input Validation & Sanitization                       │
└─────────────────────────────────────────────────────────────────┘
    - XSS prevention (HTML entity encoding)
    - SQL injection prevention (parameterized queries)
    - Email format validation
    - Maximum length checks
    - Allowed character validation
    - Malicious content filtering
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 4: Authentication & Authorization                        │
└─────────────────────────────────────────────────────────────────┘
    Service Role Key:
    - Only server-side API access
    - Never exposed to client
    - Stored in Vercel environment variables
    - Automatically encrypted

    Optional JWT Authentication (prepared):
    - CSR login via Supabase Auth
    - Role-based access control (RBAC)
    - Session management
    - Token refresh mechanism
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 5: Row Level Security (RLS)                              │
└─────────────────────────────────────────────────────────────────┘
    Default Policy: DENY ALL
    ┌───────────────────────────────────────────────────────────┐
    │ Role: public (anon)                                       │
    │ SELECT: DENIED                                            │
    │ INSERT: DENIED                                            │
    │ UPDATE: DENIED                                            │
    │ DELETE: DENIED                                            │
    └───────────────────────────────────────────────────────────┘

    Service Role Policy: ALLOW ALL
    ┌───────────────────────────────────────────────────────────┐
    │ Role: service_role                                        │
    │ SELECT: ALLOWED (all rows)                                │
    │ INSERT: ALLOWED (all rows)                                │
    │ UPDATE: ALLOWED (all rows)                                │
    │ DELETE: ALLOWED (all rows)                                │
    └───────────────────────────────────────────────────────────┘

    Authenticated CSR Policy (optional):
    ┌───────────────────────────────────────────────────────────┐
    │ Role: authenticated                                       │
    │ SELECT: ALLOWED (assigned tickets only)                   │
    │ UPDATE: ALLOWED (status, notes only)                      │
    │ DELETE: DENIED                                            │
    └───────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 6: Data Encryption                                       │
└─────────────────────────────────────────────────────────────────┘
    - Encryption at Rest (Supabase PostgreSQL)
    - Encryption in Transit (TLS 1.3)
    - Encrypted environment variables (Vercel)
    - No sensitive data in logs
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 7: Audit Logging                                         │
└─────────────────────────────────────────────────────────────────┘
    Logged for Every Request:
    - Timestamp (ISO 8601)
    - IP Address
    - User Agent
    - Session ID
    - Action performed
    - Request/response size
    - Response time
    - Success/failure status
```

### Security Threat Mitigation

| Threat                   | Mitigation Strategy             | Implementation                                   |
| ------------------------ | ------------------------------- | ------------------------------------------------ |
| **SQL Injection**        | Parameterized queries           | Supabase client library with prepared statements |
| **XSS**                  | Input sanitization, CSP headers | HTML entity encoding, strict CSP policy          |
| **CSRF**                 | Token validation                | Supabase session tokens, SameSite cookies        |
| **Unauthorized Access**  | RLS default deny                | Database-level policy enforcement                |
| **Man-in-the-Middle**    | TLS encryption                  | HTTPS enforced, HSTS header                      |
| **Session Hijacking**    | Secure session management       | HTTPOnly cookies, secure flag                    |
| **Brute Force**          | Rate limiting                   | Vercel edge network protection                   |
| **Data Breach**          | Encryption at rest              | Supabase encrypted storage                       |
| **Privilege Escalation** | Least privilege principle       | Service role only for API, CSR limited access    |

---

## Technology Stack

### Frontend Technologies

```
┌────────────────────────────────────────────────────────────┐
│ Presentation Layer                                         │
├────────────────────────────────────────────────────────────┤
│ • HTML5 (semantic markup)                                  │
│ • CSS3 (Grid, Flexbox, CSS Variables)                      │
│ • Vanilla JavaScript (ES6+ modules)                        │
│ • Chart.js 4.4.0 (data visualization)                      │
│ • Service Worker (PWA offline support)                     │
│ • Web Storage API (localStorage, sessionStorage)           │
│ • Fetch API (HTTP requests)                                │
│ • WebSocket (real-time updates via Supabase)               │
└────────────────────────────────────────────────────────────┘
```

### Backend Technologies

```
┌────────────────────────────────────────────────────────────┐
│ Application Layer                                          │
├────────────────────────────────────────────────────────────┤
│ • Node.js v18+ (JavaScript runtime)                        │
│ • Vercel Serverless Functions (API hosting)                │
│ • @supabase/supabase-js 2.39.2 (database client)           │
│ • undici 7.16.0 (HTTP client)                              │
│ • ES Modules (import/export)                               │
└────────────────────────────────────────────────────────────┘
```

### Database Technologies

```
┌────────────────────────────────────────────────────────────┐
│ Data Layer                                                 │
├────────────────────────────────────────────────────────────┤
│ • Supabase (PostgreSQL BaaS)                               │
│ • PostgreSQL 15+ (relational database)                     │
│ • Row Level Security (RLS)                                 │
│ • Realtime Subscriptions (Postgres changes via WebSocket)  │
│ • PostgREST (auto-generated REST API)                      │
│ • Connection pooling (PgBouncer)                           │
└────────────────────────────────────────────────────────────┘
```

### Build & Deployment Tools

```
┌────────────────────────────────────────────────────────────┐
│ Development & CI/CD                                        │
├────────────────────────────────────────────────────────────┤
│ • Vite 7.1.10 (build tool)                                 │
│ • Vercel CLI 48.2.9 (deployment)                           │
│ • ESLint 8.55.0 (code quality)                             │
│ • Prettier 3.6.2 (code formatting)                         │
│ • c8 10.1.3 (code coverage)                                │
│ • Node test runner (native testing)                        │
│ • GitHub Actions (CI/CD pipeline)                          │
│ • npm (package management)                                 │
└────────────────────────────────────────────────────────────┘
```

### External Service Integrations

```
┌────────────────────────────────────────────────────────────┐
│ Third-Party Services (Planned)                             │
├────────────────────────────────────────────────────────────┤
│ • SMTP (email notifications)                               │
│ • Twilio (SMS messaging)                                   │
│ • Slack API (team notifications)                           │
│ • Microsoft Teams (collaboration)                          │
│ • Chart.js CDN (analytics visualization)                   │
└────────────────────────────────────────────────────────────┘
```

---

## Design Decisions

### 1. **Why Vanilla JavaScript over React/Vue/Angular?**

**Decision**: Use vanilla JavaScript with ES6+ modules

**Rationale**:

- **Simplicity**: No framework learning curve for team
- **Performance**: Zero framework overhead, faster load times
- **Bundle Size**: Smaller production builds (~50KB vs 500KB+)
- **Direct Control**: No abstraction layers, full DOM control
- **PWA Compatibility**: Service Workers work seamlessly
- **Bolt.new Support**: Client-side triage works offline

**Trade-offs**:

- More boilerplate code for state management
- Manual DOM manipulation
- No built-in reactivity system

### 2. **Why Serverless Functions over Traditional Server?**

**Decision**: Vercel serverless functions for API endpoints

**Rationale**:

- **Scalability**: Auto-scales with traffic, no server management
- **Cost Efficiency**: Pay per invocation, not 24/7 server costs
- **Zero DevOps**: No server maintenance, automatic updates
- **Global CDN**: Edge network for low latency worldwide
- **CI/CD Built-in**: Git push = automatic deployment

**Trade-offs**:

- Cold start latency (mitigated with frequent calls)
- Limited execution time (10 seconds max on free tier)
- No persistent state (use database for state)

### 3. **Why Row Level Security (RLS) with Service Role?**

**Decision**: Mandatory RLS with default deny, service role for API access

**Rationale**:

- **Security First**: Database never exposed to client-side code
- **Zero Trust**: Explicit allow policies only
- **Defense in Depth**: Multiple security layers
- **Compliance Ready**: Meets SOC2, GDPR requirements
- **Prevents Client Tampering**: No direct database access

**Trade-offs**:

- Slightly more complex initial setup
- All client requests must go through API
- Cannot use Supabase client directly from frontend

### 4. **Why Supabase over Custom PostgreSQL?**

**Decision**: Supabase as Backend-as-a-Service

**Rationale**:

- **Real-time Built-in**: WebSocket subscriptions without custom code
- **Authentication Ready**: JWT-based auth system included
- **Auto-generated APIs**: PostgREST provides instant REST endpoints
- **Dashboard UI**: Database management without SQL tools
- **Free Tier**: Generous limits for MVP/testing
- **Edge Functions**: Serverless functions close to database

**Trade-offs**:

- Vendor lock-in (mitigated by standard PostgreSQL)
- Less control over database infrastructure
- Pricing scales with usage

### 5. **Why Client-side Triage Logic?**

**Decision**: Duplicate triage logic in `triage.js` and API endpoint

**Rationale**:

- **Offline Capability**: PWA works without internet
- **Instant Feedback**: Users see priority immediately
- **Reduced API Calls**: Only submit final results
- **Bolt.new Compatibility**: Runs in isolated environments
- **Graceful Degradation**: Fallback if API unavailable

**Trade-offs**:

- Code duplication (maintain two implementations)
- Potential inconsistencies if logic diverges
- Larger client bundle size

### 6. **Why Service Layer Pattern?**

**Decision**: Separate service files for each domain

**Rationale**:

- **Separation of Concerns**: Business logic isolated from API
- **Reusability**: Services used by multiple endpoints
- **Testability**: Easy to unit test individual services
- **Maintainability**: Changes localized to one service
- **Team Collaboration**: Multiple developers work on different services

**Trade-offs**:

- More files to manage
- Potential circular dependencies (avoided with care)

### 7. **Why No TypeScript?**

**Decision**: JavaScript with JSDoc comments (upcoming)

**Rationale**:

- **Simplicity**: Faster development for small team
- **No Build Complexity**: No transpilation required
- **Dynamic Typing**: Flexibility for rapid prototyping
- **JSDoc Provides Types**: Type hints without compilation

**Future Consideration**: Migrate to TypeScript as codebase grows

**Trade-offs**:

- Less compile-time safety
- Potential runtime type errors
- No IDE autocomplete for complex types

### 8. **Why Static Data Files (kb.json, personas.json)?**

**Decision**: Store knowledge base and personas in JSON files

**Rationale**:

- **Version Control**: Changes tracked in Git
- **No Database Reads**: Faster access, no query overhead
- **Easy Editing**: Non-technical team members can edit
- **Deployment Simplicity**: No database seeding required
- **Caching Friendly**: Files served from CDN

**Future Consideration**: Move to database when KB exceeds 10MB

**Trade-offs**:

- Not suitable for large datasets
- Requires redeploy for updates
- No real-time editing

---

## Future Architecture Considerations

### Planned Enhancements

1. **Microservices Migration**
   - Separate services into independent functions
   - Event-driven architecture with message queues
   - Service mesh for inter-service communication

2. **Advanced Caching**
   - Redis for hot data caching
   - CDN caching for static assets
   - Query result caching with invalidation

3. **Machine Learning Integration**
   - TensorFlow.js for client-side ML
   - Sentiment analysis model training
   - Predictive ticket routing

4. **Multi-tenancy**
   - Organization-level data isolation
   - Tenant-specific configurations
   - Shared vs dedicated database schemas

5. **GraphQL API**
   - Replace REST with GraphQL
   - Real-time subscriptions
   - Flexible data fetching

---

## Conclusion

INT Smart Triage AI 2.0 implements a modern, security-first, serverless architecture designed for scalability, maintainability, and real-time collaboration. The system leverages industry best practices including:

- **Three-tier architecture** for clear separation of concerns
- **Service layer pattern** for reusable business logic
- **Row Level Security** for database protection
- **Progressive Web App** for offline capability
- **Real-time subscriptions** for live collaboration

The architecture is designed to evolve with the product, supporting future enhancements while maintaining backward compatibility and security standards.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Maintained By**: Development Team
**Review Cycle**: Quarterly
