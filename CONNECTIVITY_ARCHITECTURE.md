# INT Smart Triage AI 2.0 - Connectivity & Architecture Diagram

**Version:** 1.0  
**Last Updated:** October 28, 2025  
**Purpose:** Technical connectivity architecture across all phases

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current Architecture (Phase 0)](#current-architecture-phase-0)
3. [Phase 1 Architecture Evolution](#phase-1-architecture-evolution)
4. [Phase 2 Architecture Evolution](#phase-2-architecture-evolution)
5. [Phase 3 Architecture Evolution](#phase-3-architecture-evolution)
6. [Phase 4 Architecture Evolution](#phase-4-architecture-evolution)
7. [Phase 5 Architecture Evolution](#phase-5-architecture-evolution)
8. [Integration Patterns](#integration-patterns)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [API Architecture](#api-architecture)
11. [Security Architecture](#security-architecture)
12. [Scalability Architecture](#scalability-architecture)

---

## System Overview

### High-Level Architecture Vision

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Layer                                 │
├──────────────────────────────────────────────────────────────────┤
│  CSR Dashboard  │  Customer Portal  │  Mobile App  │  Admin Panel│
└────────┬──────────────────┬─────────────────┬──────────────┬─────┘
         │                  │                 │              │
         └──────────────────┴─────────────────┴──────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │              Edge Layer (Vercel Edge)                │
         │  - CDN                                               │
         │  - API Gateway                                       │
         │  - Rate Limiting                                     │
         │  - Authentication                                    │
         └────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┴─────────────────────────────┐
         │           Application Services Layer                  │
         ├──────────────────────────────────────────────────────┤
         │  AI Services    │  Analytics  │  Routing  │  SLA     │
         │  Communication  │  Sentiment  │  KB       │  Workflow│
         └────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┴─────────────────────────────┐
         │              Integration Layer                        │
         ├──────────────────────────────────────────────────────┤
         │  OpenAI  │  Twilio  │  Salesforce  │  Zoom  │  JIRA │
         └────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┴─────────────────────────────┐
         │                Data Layer                             │
         ├──────────────────────────────────────────────────────┤
         │  Supabase    │  Redis     │  TimescaleDB  │  S3      │
         │  (Primary)   │  (Cache)   │  (Analytics)  │  (Files) │
         └──────────────────────────────────────────────────────┘
```

---

## Current Architecture (Phase 0)

### Phase 0: Foundation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Vite + Vanilla JavaScript                                  │
│  - index.html (Triage Form)                                 │
│  - client-history.html (Report History)                     │
│  - analytics.html (Analytics Dashboard)                     │
│  - KB Modal (Knowledge Base Search)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Serverless Functions                  │
├─────────────────────────────────────────────────────────────┤
│  /api/triage-report.js    - Create triage reports          │
│  /api/health-check.js     - System health                  │
│  (Future endpoints planned)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Supabase Client
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database:                                        │
│  - reports table (triage reports)                           │
│  - customers table (customer profiles)                      │
│  - kb_articles table (knowledge base)                       │
│  - analytics tables (metrics)                               │
│                                                              │
│  Real-time Subscriptions:                                   │
│  - Report updates                                           │
│  - Collaboration events                                     │
│                                                              │
│  Storage:                                                    │
│  - File attachments                                         │
│  - Report exports                                           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 0: Data Model

```
┌──────────────────┐
│     reports      │
├──────────────────┤
│ id (PK)          │
│ customer_id      │◄────────┐
│ subject          │          │
│ description      │          │
│ priority         │          │
│ sentiment        │          │
│ category         │          │
│ created_at       │          │
└──────────────────┘          │
                              │
┌──────────────────┐          │
│    customers     │          │
├──────────────────┤          │
│ id (PK)          │──────────┘
│ name             │
│ email            │
│ phone            │
│ tier             │
│ health_score     │
└──────────────────┘

┌──────────────────┐
│   kb_articles    │
├──────────────────┤
│ id (PK)          │
│ title            │
│ content          │
│ category         │
│ votes            │
│ created_at       │
└──────────────────┘
```

### Phase 0: Service Layer

```javascript
// Current Services (src/)
src/
├── assignmentEngine.js      // Basic round-robin assignment
├── analyticsService.js       // Basic analytics calculations
├── sentimentService.js       // Simple sentiment detection
├── kbService.js              // KB search and retrieval
├── emailService.js           // Email notification service
├── communicationHub.js       // Message aggregation
└── customerProfileService.js // Customer data management
```

---

## Phase 1 Architecture Evolution

### Phase 1: Intelligence & Automation Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   External AI Services                       │
├─────────────────────────────────────────────────────────────┤
│  OpenAI GPT-4 API         │  Anthropic Claude API           │
│  - Response generation    │  - Fallback AI service          │
│  - Intent recognition     │  - Multi-language support       │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              New AI Services Layer (Phase 1)                 │
├─────────────────────────────────────────────────────────────┤
│  aiResponseService.js     - GPT-4 integration               │
│  intentRecognition.js     - Customer intent analysis        │
│  categorizationService.js - Multi-label ticket categorization│
│  routingModel.js          - ML-based predictive routing     │
│  slaManager.js            - SLA tracking and alerts         │
│  workflowEngine.js        - Automation workflows            │
│  duplicateDetector.js     - Smart merge & deduplication     │
│  proactiveMonitor.js      - Issue prediction                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis Cache Layer                         │
├─────────────────────────────────────────────────────────────┤
│  - AI response caching (reduce API calls)                   │
│  - Routing predictions (sub-second latency)                 │
│  - Session management                                       │
│  - Rate limiting counters                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Twilio Voice Integration                        │
├─────────────────────────────────────────────────────────────┤
│  - Voice call transcription                                 │
│  - Speech-to-text                                           │
│  - Ticket creation from phone calls                         │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Enhanced Data Model

```
┌──────────────────┐
│     reports      │◄────────┐
├──────────────────┤         │
│ id (PK)          │         │
│ customer_id      │         │
│ subject          │         │
│ description      │         │
│ priority         │         │
│ sentiment        │         │
│ category         │         │  NEW in Phase 1
│ intent           │◄────────┼──────────┐
│ ai_confidence    │         │          │
│ assigned_to      │◄────────┤          │
│ sla_deadline     │         │          │
│ predicted_resolution│      │          │
│ created_at       │         │          │
└──────────────────┘         │          │
                             │          │
┌──────────────────┐         │          │
│  ai_responses    │         │          │
├──────────────────┤         │          │
│ id (PK)          │         │          │
│ report_id (FK)   │─────────┘          │
│ suggested_text   │                    │
│ confidence       │                    │
│ tone             │                    │
│ accepted         │                    │
│ created_at       │                    │
└──────────────────┘                    │
                                        │
┌──────────────────┐                    │
│  intent_log      │                    │
├──────────────────┤                    │
│ id (PK)          │                    │
│ report_id (FK)   │────────────────────┘
│ detected_intent  │
│ confidence       │
│ created_at       │
└──────────────────┘
```

### Phase 1: ML Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              TensorFlow.js ML Models                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Routing Model (routing-model.json):                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Input: Ticket text, priority, category, customer   │    │
│  │ Features: TF-IDF vectors, CSR stats, workload      │    │
│  │ Output: CSR assignment probabilities (0-1)         │    │
│  │ Training: Historical ticket resolutions (1000+)    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Categorization Model (categorization-model.json):          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Input: Ticket subject + description                │    │
│  │ Features: BERT embeddings, keywords                │    │
│  │ Output: Multi-label categories (billing, tech, etc)│    │
│  │ Training: Labeled tickets (500+)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Burnout Prediction (burnout-model.json):                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Input: CSR workload, response time, ticket volume  │    │
│  │ Features: Time-series patterns, sentiment          │    │
│  │ Output: Burnout risk score (0-100)                 │    │
│  │ Training: CSR metrics + feedback data              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Ticket Processing Pipeline

```
Ticket Created
     │
     ├──► Sentiment Analysis (existing)
     │    └──► sentiment score (-1 to +1)
     │
     ├──► Intent Recognition (NEW)
     │    └──► intent: refund, support, complaint, etc.
     │
     ├──► Categorization AI (NEW)
     │    └──► categories: [billing, technical, account]
     │
     ├──► Predictive Routing (NEW)
     │    └──► assigned_to: best CSR
     │         confidence: 0.87
     │
     ├──► SLA Timer Start (NEW)
     │    └──► deadline: now() + SLA_minutes
     │
     ├──► AI Response Suggestion (NEW)
     │    └──► suggested response with confidence
     │
     ├──► KB Article Suggestions (existing)
     │    └──► relevant articles ranked
     │
     ├──► Workflow Triggers (NEW)
     │    └──► automated actions based on rules
     │
     └──► Duplicate Detection (NEW)
          └──► similar tickets: [ticket-123, ticket-456]
```

---

## Phase 2 Architecture Evolution

### Phase 2: Customer-Facing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Customer Portal                            │
│               (support.intinc.com)                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js / React Application                                │
│  - Ticket submission form                                   │
│  - Ticket status tracking                                   │
│  - AI Chatbot interface                                     │
│  - KB self-service                                          │
│  - File upload                                              │
│  - CSAT survey                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ OAuth 2.0 / Supabase Auth
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Authentication                         │
├─────────────────────────────────────────────────────────────┤
│  - User registration (customers + CSRs)                     │
│  - Email/password auth                                      │
│  - OAuth providers (Google, Microsoft)                      │
│  - JWT token management                                     │
│  - Row-Level Security (RLS) policies                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Video Support Integration                       │
├─────────────────────────────────────────────────────────────┤
│  Zoom API / Microsoft Teams API                             │
│  - Instant video calls from ticket                          │
│  - Screen sharing                                           │
│  - Recording + transcription                                │
│  - Calendar scheduling                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Translation Service (Multi-Language)               │
├─────────────────────────────────────────────────────────────┤
│  Google Translate API                                       │
│  - Automatic language detection                             │
│  - Real-time translation (50+ languages)                    │
│  - CSR-side translation interface                           │
│  - Preserve original for context                            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Enhanced Data Model

```
┌──────────────────┐
│      users       │  NEW in Phase 2
├──────────────────┤
│ id (PK)          │
│ email            │
│ role             │  (customer, csr, admin)
│ customer_id (FK) │
│ preferences      │  JSON
│ language         │
│ created_at       │
└──────────┬───────┘
           │
           ▼
┌──────────────────┐
│  csat_surveys    │  NEW in Phase 2
├──────────────────┤
│ id (PK)          │
│ report_id (FK)   │
│ rating           │  1-5 stars
│ feedback         │
│ submitted_at     │
└──────────────────┘

┌──────────────────┐
│ gamification     │  NEW in Phase 2
├──────────────────┤
│ csr_id (FK)      │
│ points           │
│ badges           │  JSON array
│ level            │
│ leaderboard_rank │
└──────────────────┘

┌──────────────────┐
│ journey_events   │  NEW in Phase 2
├──────────────────┤
│ id (PK)          │
│ customer_id (FK) │
│ event_type       │
│ metadata         │  JSON
│ timestamp        │
└──────────────────┘
```

### Phase 2: Customer Journey Flow

```
Customer Journey:

1. Discovery
   ├──► Visits support.intinc.com
   ├──► Searches KB
   └──► AI Chatbot interaction
        └──► Self-service (40% deflection)
             OR
             └──► Create ticket

2. Ticket Submission
   ├──► Multi-language support
   ├──► File attachments
   ├──► Auto-categorization
   └──► Instant ticket number

3. Support Process
   ├──► Status tracking (portal)
   ├──► Real-time updates
   ├──► Video support (if needed)
   └──► CSR collaboration

4. Resolution
   ├──► Ticket marked resolved
   ├──► CSAT survey sent
   └──► Journey event logged

5. Feedback Loop
   ├──► Survey responses analyzed
   ├──► Improvement opportunities identified
   └──► KB articles updated
```

---

## Phase 3 Architecture Evolution

### Phase 3: Analytics & Insights Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            TimescaleDB (Time-Series Extension)               │
├─────────────────────────────────────────────────────────────┤
│  - Ticket metrics over time                                 │
│  - CSR performance trends                                   │
│  - Customer health score history                            │
│  - Real-time anomaly detection                              │
│  - Continuous aggregates (automatic rollups)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Elasticsearch Cluster                           │
├─────────────────────────────────────────────────────────────┤
│  - Advanced ticket search                                   │
│  - Full-text analytics                                      │
│  - Root cause pattern detection                             │
│  - Competitive intelligence indexing                        │
│  - Executive summary generation                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Data Warehouse Integration                         │
├─────────────────────────────────────────────────────────────┤
│  Snowflake / BigQuery / Redshift                            │
│  - Historical data storage (3+ years)                       │
│  - Cross-system analytics                                   │
│  - Revenue impact calculations                              │
│  - Forecasting models                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           BI Tools Integration                               │
├─────────────────────────────────────────────────────────────┤
│  Tableau / Looker / Power BI                                │
│  - Executive dashboards                                     │
│  - Custom report builder                                    │
│  - Scheduled reports                                        │
│  - Drill-down analytics                                     │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Analytics Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  Data Pipeline Architecture                  │
└─────────────────────────────────────────────────────────────┘

Real-time Data Stream:
┌──────────────┐
│ Supabase DB  │
└──────┬───────┘
       │ Change Data Capture (CDC)
       ▼
┌──────────────┐
│ Message Queue│ (RabbitMQ/Kafka)
└──────┬───────┘
       │
       ├──► TimescaleDB (time-series metrics)
       ├──► Elasticsearch (search indexing)
       ├──► Redis (real-time counters)
       └──► Data Warehouse (historical)

Batch Processing:
┌──────────────┐
│ Cron Jobs    │ (every 1 hour / daily)
└──────┬───────┘
       │
       ├──► Root cause analysis
       ├──► Forecasting model updates
       ├──► Anomaly detection
       ├──► Executive summaries
       └──► Dashboard pre-aggregation
```

### Phase 3: Analytics Service Layer

```javascript
// New Analytics Services (Phase 3)
src/analytics/
├── dashboardBuilder.js       // Custom dashboard creation
├── rootCauseEngine.js         // 5 Whys analysis, correlation
├── revenueAnalytics.js        // CLV, revenue at risk, upsell
├── competitiveIntel.js        // Competitor mentions, win/loss
├── forecastingService.js      // Time-series forecasting (ARIMA)
├── qaAutomation.js            // Auto QA scoring
├── networkAnalysis.js         // Customer relationship graphs
├── anomalyDetector.js         // Time-series anomaly detection
├── burnoutPredictor.js        // CSR burnout risk ML model
└── executiveSummary.js        // NLG for executive reports
```

---

## Phase 4 Architecture Evolution

### Phase 4: Integration & API Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Kong / AWS API Gateway / Vercel Edge                       │
│  - Authentication (API keys, OAuth 2.0)                     │
│  - Rate limiting (1000 req/hour standard)                   │
│  - Request transformation                                   │
│  - Response caching                                         │
│  - Analytics/monitoring                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├──► Public REST API
                     ├──► GraphQL API
                     └──► Webhook endpoints
```

### Phase 4: External Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            Salesforce Integration (Bi-directional)           │
├─────────────────────────────────────────────────────────────┤
│  Supabase ◄──► Salesforce API                               │
│                                                              │
│  Mappings:                                                   │
│  - Tickets ◄──► Cases                                       │
│  - Customers ◄──► Contacts                                  │
│  - Revenue ◄──► Opportunities                               │
│  - Notes ◄──► Activity History                              │
│                                                              │
│  Sync Strategy:                                              │
│  - Real-time: Critical updates (Webhook)                    │
│  - Batch: Bulk sync every 15 minutes                        │
│  - Conflict resolution: Last-write-wins + audit log         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              JIRA Integration                                │
├─────────────────────────────────────────────────────────────┤
│  - Convert tickets → JIRA issues                            │
│  - Link support tickets to bugs                             │
│  - Track resolution status                                  │
│  - Bi-directional comments sync                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         Payment Gateway Integration                          │
├─────────────────────────────────────────────────────────────┤
│  Stripe / PayPal / Chargebee                                │
│  - View billing history in ticket context                   │
│  - Process refunds from triage interface                    │
│  - Subscription management                                  │
│  - Payment status webhooks                                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Webhook Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Webhook Infrastructure                          │
└─────────────────────────────────────────────────────────────┘

Webhook Flow:
┌──────────────┐
│ Event Occurs │ (ticket.created, ticket.resolved, etc.)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Event Queue  │ (RabbitMQ)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Webhook      │
│ Dispatcher   │
└──────┬───────┘
       │
       ├──► External System 1 (HTTP POST)
       ├──► External System 2 (HTTP POST)
       └──► External System 3 (HTTP POST)
              │
              ├──► Success: Log delivery
              ├──► Failure: Retry (exponential backoff)
              └──► Dead Letter Queue (after 5 retries)

Webhook Builder UI:
- Visual trigger configuration
- Custom payload mapping
- Test webhook functionality
- Delivery logs and debugging
- Signature verification setup
```

### Phase 4: OAuth 2.0 Server

```
┌─────────────────────────────────────────────────────────────┐
│              OAuth 2.0 Authorization Flow                    │
└─────────────────────────────────────────────────────────────┘

Third-Party App Integration:
┌──────────────┐
│ External App │ wants access to INT Smart Triage API
└──────┬───────┘
       │
       ├──► 1. Redirect to OAuth consent page
       │       └──► User approves scopes (read_tickets, write_tickets)
       │
       ├──► 2. Authorization code granted
       │
       ├──► 3. Exchange code for access token
       │       └──► Access token (JWT, expires in 1 hour)
       │       └──► Refresh token (expires in 30 days)
       │
       └──► 4. API calls with Bearer token
              └──► Rate limiting per token
              └──► Scope enforcement
              └──► Token revocation capability
```

---

## Phase 5 Architecture Evolution

### Phase 5: Innovation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Augmented Reality Support                          │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (iOS/Android)                                   │
│  - ARKit (iOS) / ARCore (Android)                           │
│  - Camera feed with AR overlays                             │
│  - 3D model rendering                                       │
│  - Step-by-step AR instructions                             │
│  - Remote CSR viewing (shared AR session)                   │
│                                                              │
│  Backend:                                                    │
│  - AR asset storage (3D models in S3)                       │
│  - Real-time AR session coordination                        │
│  - Computer vision for object recognition                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Blockchain Audit Trail                              │
├─────────────────────────────────────────────────────────────┤
│  Ethereum / Hyperledger Fabric                              │
│  - Immutable ticket action log                              │
│  - Cryptographic verification                               │
│  - Smart contracts for SLA enforcement                      │
│  - Transparent compliance audit                             │
│                                                              │
│  Architecture:                                               │
│  ┌──────────────┐                                           │
│  │ Supabase DB  │────► Event ────► Blockchain Node          │
│  └──────────────┘                   (Write transaction)     │
│                                      │                       │
│  Audit Query ─────────────────────► Blockchain Read         │
│                    └──► Verify hash + timestamp             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Emotional AI Coach                                 │
├─────────────────────────────────────────────────────────────┤
│  Real-time CSR Assistance:                                  │
│  - Analyze typing patterns for stress detection             │
│  - Suggest de-escalation techniques                         │
│  - Recommend break times                                    │
│  - Provide emotional support prompts                        │
│  - Meditation/wellness reminders                            │
│                                                              │
│  ML Models:                                                  │
│  - Sentiment analysis of CSR messages                       │
│  - Stress pattern recognition (typing speed, pauses)        │
│  - Burnout risk prediction                                  │
│  - Recommended action generation                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│        Quantum-Inspired Optimization                         │
├─────────────────────────────────────────────────────────────┤
│  Optimization Problems:                                      │
│  - CSR schedule optimization (hundreds of constraints)      │
│  - Multi-ticket routing (combinatorial optimization)        │
│  - Resource allocation (max efficiency, min wait time)      │
│                                                              │
│  Implementation:                                             │
│  - Quantum annealing algorithms (D-Wave / Qiskit)           │
│  - Simulated annealing on GPU                               │
│  - Tabu search with genetic algorithms                      │
│  - QUBO (Quadratic Unconstrained Binary Optimization)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          AI Agent Swarm Intelligence                         │
├─────────────────────────────────────────────────────────────┤
│  Multi-Agent Architecture:                                   │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Researcher   │◄──►│ Coordinator  │◄──►│ Specialist   │ │
│  │ Agent        │    │ Agent        │    │ Agent        │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│        │                    │                    │          │
│        └────────────────────┴────────────────────┘          │
│                            │                                │
│                            ▼                                │
│                   ┌──────────────┐                          │
│                   │ Human CSR    │                          │
│                   │ Oversight    │                          │
│                   └──────────────┘                          │
│                                                              │
│  Agent Types:                                                │
│  - Researcher: Gathers information from KB/docs             │
│  - Analyzer: Diagnoses root cause                           │
│  - Specialist: Domain-specific knowledge (billing, tech)    │
│  - Coordinator: Orchestrates agent collaboration            │
│  - Validator: Checks solution quality before suggesting     │
│                                                              │
│  Communication: Message passing, shared memory blackboard   │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Real-time Sync (WebSocket)

```
Client ◄──WebSocket──► Supabase Real-time
  │                        │
  │                        │ Database Change
  │                        ▼
  │                    ┌────────────┐
  │◄───────────────────┤ Broadcast  │
  │   Live Update      └────────────┘
  │
  └──► UI automatically updates
```

**Use Cases:**

- Collaborative note editing
- Ticket status changes
- Real-time dashboard updates
- Live CSR activity feed

### Pattern 2: Batch Sync (Scheduled Jobs)

```
Cron Scheduler
  │
  ├──► Every 15 min: Salesforce sync
  ├──► Every 1 hour: Analytics aggregation
  ├──► Every 6 hours: ML model retraining
  └──► Every 24 hours: Report generation
```

**Use Cases:**

- CRM data synchronization
- Analytics pre-computation
- ML model updates
- Daily/weekly reports

### Pattern 3: Event-Driven (Webhooks)

```
Event Occurs (e.g., ticket.resolved)
  │
  ▼
Event Queue (RabbitMQ)
  │
  ▼
Webhook Dispatcher
  │
  ├──► External System A
  ├──► External System B
  └──► External System C
```

**Use Cases:**

- Status change notifications
- Integration with third-party tools
- Workflow automation
- Real-time alerts

### Pattern 4: API-First (REST/GraphQL)

```
Client Request
  │
  ▼
API Gateway (rate limiting, auth)
  │
  ▼
Business Logic (Vercel Functions)
  │
  ▼
Data Layer (Supabase)
  │
  ▼
Response (JSON)
```

**Use Cases:**

- Mobile app integration
- Third-party developers
- Microservices communication
- Custom integrations

---

## Data Flow Diagrams

### Diagram 1: Ticket Creation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  Ticket Creation Flow                         │
└──────────────────────────────────────────────────────────────┘

1. Customer submits ticket via portal/email/phone
       │
       ▼
2. Ticket ingestion service
       │
       ├──► Text preprocessing
       ├──► Language detection
       └──► File attachment storage
       │
       ▼
3. AI Processing Pipeline (parallel)
       │
       ├──► Sentiment Analysis
       │    └──► Score: -1 to +1
       │
       ├──► Intent Recognition
       │    └──► Intent: refund, support, complaint
       │
       ├──► Categorization
       │    └──► Categories: [billing, technical]
       │
       ├──► Duplicate Detection
       │    └──► Similar tickets: [123, 456]
       │
       └──► Priority Calculation
            └──► Priority: high/medium/low
       │
       ▼
4. Routing Decision
       │
       ├──► ML Model Prediction
       │    └──► Best CSR: John Doe (confidence: 0.87)
       │
       └──► SLA Deadline Calculation
            └──► Deadline: now() + 4 hours
       │
       ▼
5. Ticket Stored in Database
       │
       ├──► Insert into reports table
       ├──► Insert AI predictions
       └──► Insert intent log
       │
       ▼
6. Notifications Sent
       │
       ├──► Email to assigned CSR
       ├──► Push notification to mobile
       └──► Real-time dashboard update
       │
       ▼
7. AI Response Suggestion
       │
       └──► GPT-4 generates draft response
            └──► Store in ai_responses table
       │
       ▼
8. KB Article Suggestions
       │
       └──► Top 3 relevant articles
            └──► Display in CSR interface
```

### Diagram 2: Analytics Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                Analytics Data Pipeline                        │
└──────────────────────────────────────────────────────────────┘

Source Data (Supabase)
       │
       ├──► Change Data Capture (CDC)
       │
       ▼
Message Queue (Kafka/RabbitMQ)
       │
       ├──► Real-time Stream Processing
       │    │
       │    ├──► TimescaleDB (time-series metrics)
       │    │    └──► Ticket volume, response time trends
       │    │
       │    ├──► Redis (real-time counters)
       │    │    └──► Active tickets, CSR online status
       │    │
       │    └──► Elasticsearch (search index)
       │         └──► Full-text ticket search
       │
       └──► Batch Processing (hourly/daily)
            │
            ├──► Root Cause Analysis
            │    └──► Pattern detection, correlation
            │
            ├──► Forecasting Models
            │    └──► Ticket volume prediction (ARIMA)
            │
            ├──► Anomaly Detection
            │    └──► Unusual spikes, outliers
            │
            └──► Data Warehouse Sync
                 └──► Historical data storage (Snowflake)
       │
       ▼
Visualization Layer
       │
       ├──► Custom Dashboards (dashboard builder)
       ├──► Executive Summaries (auto-generated NLG)
       ├──► BI Tools (Tableau, Looker)
       └──► Real-time Monitoring (Datadog, Grafana)
```

---

## API Architecture

### API Endpoints (Phase 4+)

```
/api/v1/
  ├── tickets
  │   ├── GET    /tickets              (list tickets, paginated)
  │   ├── POST   /tickets              (create ticket)
  │   ├── GET    /tickets/:id          (get ticket details)
  │   ├── PATCH  /tickets/:id          (update ticket)
  │   ├── DELETE /tickets/:id          (delete ticket)
  │   └── POST   /tickets/:id/notes    (add note)
  │
  ├── customers
  │   ├── GET    /customers            (list customers)
  │   ├── POST   /customers            (create customer)
  │   ├── GET    /customers/:id        (get customer profile)
  │   ├── PATCH  /customers/:id        (update customer)
  │   └── GET    /customers/:id/tickets (customer ticket history)
  │
  ├── analytics
  │   ├── GET    /analytics/dashboard  (dashboard data)
  │   ├── GET    /analytics/metrics    (specific metrics)
  │   ├── GET    /analytics/forecast   (ticket volume forecast)
  │   └── GET    /analytics/reports    (pre-built reports)
  │
  ├── ai
  │   ├── POST   /ai/suggest-response  (AI response generation)
  │   ├── POST   /ai/categorize        (ticket categorization)
  │   ├── POST   /ai/route             (predictive routing)
  │   └── POST   /ai/intent            (intent recognition)
  │
  ├── webhooks
  │   ├── GET    /webhooks             (list configured webhooks)
  │   ├── POST   /webhooks             (create webhook)
  │   ├── PATCH  /webhooks/:id         (update webhook)
  │   ├── DELETE /webhooks/:id         (delete webhook)
  │   └── GET    /webhooks/:id/logs    (delivery logs)
  │
  └── integrations
      ├── salesforce
      │   ├── POST /integrations/salesforce/sync   (manual sync)
      │   └── GET  /integrations/salesforce/status (sync status)
      │
      ├── jira
      │   └── POST /integrations/jira/create-issue (create JIRA issue)
      │
      └── payment
          └── POST /integrations/payment/refund    (process refund)
```

### Authentication

```
API Key Authentication:
  Authorization: Bearer sk_live_abc123xyz

OAuth 2.0:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Scopes:
  - read:tickets      (read ticket data)
  - write:tickets     (create/update tickets)
  - read:customers    (read customer data)
  - write:customers   (create/update customers)
  - read:analytics    (access analytics data)
  - admin             (full access)
```

### Rate Limiting

```
Standard Tier:
  - 1,000 requests/hour
  - Burst: 20 requests/second

Enterprise Tier:
  - 10,000 requests/hour
  - Burst: 100 requests/second

Headers:
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 987
  X-RateLimit-Reset: 1635789600
```

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Edge Security (Vercel Edge)                        │
├─────────────────────────────────────────────────────────────┤
│ - DDoS protection                                           │
│ - WAF (Web Application Firewall)                            │
│ - TLS 1.3 encryption                                        │
│ - HTTPS enforcement                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Authentication & Authorization                     │
├─────────────────────────────────────────────────────────────┤
│ - Supabase Auth (JWT tokens)                                │
│ - OAuth 2.0 for third-party apps                            │
│ - API key management                                        │
│ - Multi-factor authentication (MFA)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Application Security                               │
├─────────────────────────────────────────────────────────────┤
│ - Input validation and sanitization                         │
│ - SQL injection prevention (parameterized queries)          │
│ - XSS protection (Content Security Policy)                  │
│ - CSRF tokens                                               │
│ - Secure session management                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Data Security                                      │
├─────────────────────────────────────────────────────────────┤
│ - Row-Level Security (RLS) policies in Supabase             │
│ - Encryption at rest (AES-256)                              │
│ - Encryption in transit (TLS 1.3)                           │
│ - PII data masking                                          │
│ - Audit logging (all data access)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Infrastructure Security                            │
├─────────────────────────────────────────────────────────────┤
│ - Network isolation (VPC)                                   │
│ - Secrets management (Vercel encrypted env vars)            │
│ - Regular security patches                                  │
│ - Vulnerability scanning                                    │
│ - Penetration testing (quarterly)                           │
└─────────────────────────────────────────────────────────────┘
```

### Compliance & Governance

- **SOC 2 Type II:** Planned for Phase 2
- **GDPR Compliance:** Customer data rights, right to erasure
- **HIPAA Compliance:** If handling healthcare-related tickets
- **ISO 27001:** Information security management
- **PCI DSS:** For payment processing (Phase 4)

---

## Scalability Architecture

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│             Vercel Serverless Functions                      │
│             (Auto-scaling, infinite concurrency)             │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Request routing
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Load Distribution                           │
├─────────────────────────────────────────────────────────────┤
│  Supabase Connection Pooling:                               │
│  - Max connections: 500                                     │
│  - Connection timeout: 30s                                  │
│                                                              │
│  Redis Cluster:                                              │
│  - 3 primary nodes + replicas                               │
│  - Automatic failover                                       │
│                                                              │
│  Read Replicas:                                              │
│  - Supabase read replicas for analytics                     │
│  - Write to primary, read from replicas                     │
└─────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                            │
└─────────────────────────────────────────────────────────────┘

Layer 1: CDN (Vercel Edge)
  - Static assets (HTML, CSS, JS)
  - Cache duration: 1 year
  - Invalidation: On deployment

Layer 2: Redis Cache
  - AI response predictions (30 min TTL)
  - KB article search results (1 hour TTL)
  - User sessions (24 hour TTL)
  - Rate limiting counters (1 hour TTL)

Layer 3: Application Cache
  - In-memory cache for frequently accessed data
  - Configuration data (1 hour TTL)
  - Feature flags (5 min TTL)

Layer 4: Database Query Cache
  - Supabase query cache
  - Materialized views for analytics
  - TimescaleDB continuous aggregates
```

### Performance Targets

| Metric                   | Target | Current | Phase   |
| ------------------------ | ------ | ------- | ------- |
| Page load time           | <2s    | <2s     | Phase 0 |
| API response time        | <500ms | TBD     | Phase 1 |
| Database query time      | <100ms | ~50ms   | Phase 0 |
| AI response generation   | <3s    | TBD     | Phase 1 |
| Real-time event delivery | <1s    | <1s     | Phase 0 |
| Dashboard refresh        | <2s    | ~3s     | Phase 3 |

---

## Monitoring & Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 Application Monitoring                       │
├─────────────────────────────────────────────────────────────┤
│  Datadog / New Relic / Sentry                               │
│  - APM (Application Performance Monitoring)                 │
│  - Error tracking and alerts                                │
│  - Log aggregation                                          │
│  - Custom metrics and dashboards                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Infrastructure Monitoring                      │
├─────────────────────────────────────────────────────────────┤
│  - Vercel Analytics (function execution, errors)            │
│  - Supabase Metrics (database performance)                  │
│  - Redis Metrics (cache hit rate, memory usage)             │
│  - Uptime monitoring (Pingdom, UptimeRobot)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Business Monitoring                         │
├─────────────────────────────────────────────────────────────┤
│  - Ticket volume (real-time)                                │
│  - SLA compliance rate                                      │
│  - Response time metrics                                    │
│  - Customer satisfaction scores                             │
│  - CSR productivity metrics                                 │
└─────────────────────────────────────────────────────────────┘
```

### Alert Thresholds

| Alert             | Threshold | Severity | Action                 |
| ----------------- | --------- | -------- | ---------------------- |
| API error rate    | >5%       | Critical | Page on-call           |
| Response time     | >2s       | High     | Investigate            |
| Database CPU      | >80%      | High     | Scale up               |
| SLA breach        | Any       | Critical | Escalate to manager    |
| Security incident | Any       | Critical | Incident response team |

---

**Document Version:** 1.0  
**Last Updated:** October 28, 2025  
**Next Review:** December 1, 2025

---

_This architecture diagram is a living document and will evolve with each phase of implementation._
