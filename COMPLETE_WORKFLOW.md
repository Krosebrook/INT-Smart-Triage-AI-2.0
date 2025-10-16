# INT Smart Triage AI 2.0 - Complete User Workflow

## Overview

This document outlines the complete end-to-end user workflow for the INT Smart Triage AI system, including full knowledge base integration, Supabase database persistence, and user journey from ticket submission to resolution.

## Current Status

### ✅ Completed

- Intelligent triage logic (client-side)
- Priority detection (HIGH/MEDIUM/LOW)
- Department routing (7 INT departments)
- Response approach generation
- Talking points generation
- Report ID generation
- Customer tone adaptation
- Build system (Vite)
- Bolt.new compatibility

### 🚧 Started

- **Knowledge Base Articles**: 3 fully populated articles created:
  - KB-SEC-001: SOC2 Compliance Overview (12 min read, comprehensive)
  - KB-SEC-002: Cyber Insurance Guide (15 min read, comprehensive)
  - KB-TECH-001: Managed IT Services (18 min read, comprehensive)

### 📋 Remaining Work

#### 1. Complete Knowledge Base (32 more articles needed)

**Information Security (2 more needed)**

- KB-SEC-003: Vulnerability Assessment Process
- KB-SEC-004: Security Awareness Training Program

**Technology (4 more needed)**

- KB-TECH-002: Email Migration (Office 365/Google Workspace)
- KB-TECH-003: Cloud Backup & Disaster Recovery
- KB-TECH-004: SaaS Application Migration
- KB-TECH-005: Network Security Best Practices

**Website Design (5 needed)**

- KB-WEB-001: Custom Website Design Process
- KB-WEB-002: E-commerce Platform Comparison (Shopify vs WooCommerce)
- KB-WEB-003: WordPress Security & Maintenance
- KB-WEB-004: Website Performance Optimization
- KB-WEB-005: Mobile-First Design Principles

**Branding (5 needed)**

- KB-BRAND-001: Brand Strategy Development
- KB-BRAND-002: Logo Design Process
- KB-BRAND-003: Visual Identity Systems
- KB-BRAND-004: Brand Guidelines Creation
- KB-BRAND-005: Rebranding Best Practices

**Content (5 needed)**

- KB-CONT-001: Content Strategy Framework
- KB-CONT-002: SEO Copywriting Best Practices
- KB-CONT-003: Blog Content Planning
- KB-CONT-004: E-book Creation Process
- KB-CONT-005: Content Calendar Management

**Marketing (5 needed)**

- KB-MARK-001: HubSpot Setup & Configuration
- KB-MARK-002: Marketing Automation Workflows
- KB-MARK-003: CRM Migration Guide
- KB-MARK-004: Email Marketing Campaign Best Practices
- KB-MARK-005: Lead Nurturing Strategies

**Operations (5 needed)**

- KB-OPS-001: Bookkeeping Services Overview
- KB-OPS-002: Process Documentation & Management
- KB-OPS-003: AI & BI Implementation Guide
- KB-OPS-004: Workflow Automation
- KB-OPS-005: Business Intelligence Dashboards

#### 2. Build Complete User Workflow

**Phase 1: Ticket Submission**

- [x] Form with customer details
- [x] Issue description
- [x] Customer tone selection
- [ ] File attachment capability
- [ ] Urgency level indicator
- [ ] Preferred contact method

**Phase 2: AI Triage Processing**

- [x] Priority detection
- [x] Department routing
- [x] Confidence scoring
- [ ] Similar ticket detection
- [ ] Estimated resolution time
- [ ] Suggested assignee

**Phase 3: Results Display**

- [x] Priority badge
- [x] Department assignment
- [x] Response approach
- [x] Talking points
- [x] KB article suggestions
- [ ] Similar past tickets
- [ ] Next action buttons

**Phase 4: KB Article Viewing**

- [ ] Click KB article link
- [ ] View full article in modal/new page
- [ ] Article rating system
- [ ] "Was this helpful?" buttons
- [ ] Related articles suggestions
- [ ] Print/export article
- [ ] Share article via email

**Phase 5: Database Persistence (Supabase)**

- [ ] Save triage report to database
- [ ] Log user actions
- [ ] Track KB article views
- [ ] Record helpful votes
- [ ] Save customer feedback
- [ ] Generate analytics data

**Phase 6: Follow-up Actions**

- [ ] Email report to CSR
- [ ] Create ticket in CRM
- [ ] Schedule follow-up reminder
- [ ] Add to CSR dashboard
- [ ] Generate performance metrics

## Complete User Journey Map

### Step 1: CSR Receives Ticket

**Tools**: Email, Phone, Chat, Web Form
**Duration**: 30 seconds

CSR receives customer inquiry through any channel and needs to determine:

- Priority level
- Which department should handle it
- How to respond appropriately
- What resources to provide

### Step 2: Enter Ticket into Triage System

**Current Implementation**: ✅ Complete
**Duration**: 1-2 minutes

CSR fills out triage form:

```
Customer Name: [Text Input]
Ticket Subject: [Text Input]
Issue Description: [Textarea - Required]
Customer Tone: [Dropdown - Required]
  - Calm
  - Confused
  - Frustrated
  - Angry
  - Urgent
```

### Step 3: AI Processes Ticket

**Current Implementation**: ✅ Complete
**Duration**: 1.5 seconds (simulated)

System analyzes:

- Keywords in description
- Customer tone
- Historical patterns
- Department expertise areas

Generates:

- Priority (HIGH/MEDIUM/LOW)
- Confidence score (75-90%)
- Department assignment
- Category classification

### Step 4: View Triage Results

**Current Implementation**: ✅ Mostly Complete
**Duration**: 2-3 minutes

CSR sees 5 result cards:

#### Card 1: Priority Assignment

```
┌─────────────────────────────────┐
│ Triage Priority                 │
│                                 │
│ [HIGH PRIORITY]  90% Confidence │
│                                 │
│ Department: Information Security│
└─────────────────────────────────┘
```

#### Card 2: Response Approach

```
┌─────────────────────────────────┐
│ Recommended Response Approach   │
│                                 │
│ Information Security will       │
│ address this high priority      │
│ issue with urgent customer      │
│ approach. Begin with sincere    │
│ empathy and acknowledgment...   │
└─────────────────────────────────┘
```

#### Card 3: Talking Points

```
┌─────────────────────────────────┐
│ Suggested Talking Points        │
│                                 │
│ • Thank you for reaching out    │
│ • This is high priority         │
│ • Our InfoSec team will assist  │
│ • I sincerely apologize...      │
└─────────────────────────────────┘
```

#### Card 4: Knowledge Base Articles (ENHANCED NEEDED)

```
┌─────────────────────────────────┐
│ Knowledge Base Articles         │
│                                 │
│ [View] KB-SEC-001: SOC2 Comp... │
│ [View] KB-SEC-002: Cyber Ins... │
│ [View] KB-SEC-003: Vulnerabi... │
│                                 │
│ [Email to Customer] [Print All] │
└─────────────────────────────────┘
```

#### Card 5: Activity Log

```
┌─────────────────────────────────┐
│ Activity Logged                 │
│                                 │
│ Report ID: TR-1705234567-ABC... │
│ Timestamp: Jan 15, 2025 2:30 PM│
│ Status: Successfully saved      │
│                                 │
│ [View in Database] [Export PDF] │
└─────────────────────────────────┘
```

### Step 5: View Knowledge Base Article (TO BE IMPLEMENTED)

**Status**: 🚧 Needs Implementation
**Duration**: 3-10 minutes

When CSR clicks "View" on a KB article:

```
┌─────────────────────────────────────────────┐
│ ←  KB-SEC-001: SOC2 Compliance Overview     │
│                                             │
│ Information Security | 12 min read          │
│ Last Updated: Jan 15, 2025                  │
│ Author: Sarah Johnson, CISO                 │
│ ⭐⭐⭐⭐⭐ 245 helpful votes                    │
│                                             │
│ [Full Article Content...]                  │
│                                             │
│ Was this helpful?  [👍 Yes] [👎 No]        │
│                                             │
│ Related Articles:                           │
│ • KB-SEC-002: Cyber Insurance Guide        │
│ • KB-SEC-003: Vulnerability Assessment      │
│                                             │
│ [Print] [Email] [Share] [Add to Favorites] │
└─────────────────────────────────────────────┘
```

### Step 6: Respond to Customer

**Status**: Manual (Outside System)
**Duration**: 5-15 minutes

CSR uses the triage information to:

1. Craft empathetic response using talking points
2. Reference KB articles in reply
3. Set appropriate expectations
4. Route to correct department
5. Create follow-up tasks

### Step 7: Track & Report (TO BE IMPLEMENTED)

**Status**: 🚧 Needs Supabase Integration
**Duration**: Automatic

System logs to Supabase:

```sql
-- reports table
INSERT INTO reports (
  report_id,
  customer_name,
  ticket_subject,
  issue_description,
  customer_tone,
  priority,
  confidence,
  department,
  category,
  csr_agent,
  created_at
);

-- kb_views table
INSERT INTO kb_views (
  report_id,
  kb_article_id,
  viewed_at
);

-- kb_feedback table
INSERT INTO kb_feedback (
  kb_article_id,
  helpful,
  feedback_text
);
```

## Supabase Database Schema

### Tables Needed

#### 1. `reports` (Primary Triage Data)

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  ticket_subject TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  customer_tone TEXT NOT NULL,
  priority TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  response_approach TEXT,
  talking_points JSONB,
  kb_articles JSONB,
  csr_agent TEXT NOT NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage all reports"
  ON reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_department ON reports(department);
CREATE INDEX idx_reports_report_id ON reports(report_id);
```

#### 2. `kb_articles` (Knowledge Base Content)

```sql
CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  read_time TEXT,
  popularity_score INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  unhelpful_votes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read, service role write)
CREATE POLICY "Anyone can view kb articles"
  ON kb_articles FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage kb articles"
  ON kb_articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_kb_articles_category ON kb_articles(category);
CREATE INDEX idx_kb_articles_department ON kb_articles(department);
CREATE INDEX idx_kb_articles_popularity ON kb_articles(popularity_score DESC);
CREATE INDEX idx_kb_articles_tags ON kb_articles USING GIN(tags);
```

#### 3. `kb_views` (Track Article Views)

```sql
CREATE TABLE kb_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL,
  kb_article_id TEXT NOT NULL,
  csr_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE kb_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage kb views"
  ON kb_views FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_kb_views_article ON kb_views(kb_article_id);
CREATE INDEX idx_kb_views_report ON kb_views(report_id);
CREATE INDEX idx_kb_views_date ON kb_views(viewed_at DESC);
```

#### 4. `kb_feedback` (Article Helpfulness)

```sql
CREATE TABLE kb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_article_id TEXT NOT NULL,
  report_id TEXT,
  helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  csr_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE kb_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage kb feedback"
  ON kb_feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_kb_feedback_article ON kb_feedback(kb_article_id);
CREATE INDEX idx_kb_feedback_helpful ON kb_feedback(helpful);
```

#### 5. `analytics` (Usage Statistics)

```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  csr_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage analytics"
  ON analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);
```

## Implementation Roadmap

### Phase 1: Complete Knowledge Base (2-3 days)

**Priority**: HIGH
**Tasks**:

1. Write remaining 32 KB articles (10-18 min read each)
2. Follow same comprehensive format as existing 3 articles
3. Include for each article:
   - Complete guide content (2,000-4,000 words)
   - Pricing information
   - Step-by-step processes
   - Common pitfalls
   - ROI calculations
   - Next steps / CTAs
   - Contact information
4. Save to `public/data/kb.json`
5. Verify JSON structure
6. Test loading in app

### Phase 2: Build KB Article Viewer (1 day)

**Priority**: HIGH
**Tasks**:

1. Create KB article modal component
2. Add markdown rendering
3. Implement "Was this helpful?" buttons
4. Add print/export functionality
5. Show related articles
6. Track view analytics
7. Style for readability

### Phase 3: Supabase Integration (2 days)

**Priority**: HIGH
**Tasks**:

1. Create Supabase tables (run SQL above)
2. Set up RLS policies
3. Create Supabase client in app
4. Implement save triage report function
5. Implement track KB views function
6. Implement KB feedback function
7. Test all database operations
8. Add error handling

### Phase 4: Enhanced Features (2-3 days)

**Priority**: MEDIUM
**Tasks**:

1. File attachment upload (Supabase Storage)
2. Email report to CSR
3. Export PDF functionality
4. CSR dashboard
5. Analytics dashboard
6. Similar ticket detection
7. Search KB articles
8. Filter by department/category

### Phase 5: Testing & Polish (1 day)

**Priority**: HIGH
**Tasks**:

1. End-to-end workflow testing
2. Load testing (100+ concurrent users)
3. KB article formatting review
4. Mobile responsiveness
5. Accessibility audit (WCAG 2.1)
6. Performance optimization
7. Documentation updates

## KB Article Template

Each article should follow this structure:

```markdown
# [Article Title]

## What is [Topic]?

[2-3 paragraph introduction explaining the topic in simple terms]

## Why Your Business Needs [Topic]

### The Statistics

- Bullet point with stat
- Bullet point with stat
- Bullet point with stat

### Business Benefits

1. **Benefit 1**: Explanation
2. **Benefit 2**: Explanation
3. **Benefit 3**: Explanation

## [Main Content Sections]

### Section 1: [Topic]

[Detailed explanation with examples]

### Section 2: [Topic]

[Detailed explanation with examples]

### Section 3: [Topic]

[Detailed explanation with examples]

## Pricing & Investment

### Package 1 ($X - $Y)

- What's included
- Best for: [description]
- Timeline: X weeks/months

### Package 2 ($X - $Y)

- What's included
- Best for: [description]
- Timeline: X weeks/months

## Implementation Process

### Step 1: [Step Name] (Week X-Y)

- Task 1
- Task 2
- Cost: $X

### Step 2: [Step Name] (Week X-Y)

- Task 1
- Task 2
- Cost: $X

## Common Pitfalls to Avoid

1. **Pitfall 1**: Explanation and how to avoid
2. **Pitfall 2**: Explanation and how to avoid
3. **Pitfall 3**: Explanation and how to avoid

## ROI / Results

[Provide concrete examples, case studies, or calculations showing return on investment]

## INT's [Service Name]

### What We Provide

1. **Service 1**: Description
2. **Service 2**: Description
3. **Service 3**: Description

### Pricing

- **Package 1**: $X,XXX
- **Package 2**: $X,XXX
- **Package 3**: $X,XXX

### Why Choose INT?

1. **Reason 1**: Explanation
2. **Reason 2**: Explanation
3. **Reason 3**: Explanation

## Next Steps

1. **Free Consultation**: [Description]
2. **Receive Proposal**: [Description]
3. **Get Started**: [Description]

**Contact Information**
Email: [department]@intinc.com
Phone: (555) 123-456X
Schedule: https://intinc.com/schedule-[service]

---

_Last Updated: [Month Year] | INT Inc. [Department] Team_
```

## Success Metrics

### User Experience

- ✅ Triage completes in <2 seconds
- ✅ Results display immediately
- 🚧 KB articles load in <1 second
- 🚧 Full workflow completes in <5 minutes
- 🚧 95%+ user satisfaction

### Technical Performance

- ✅ Build time <250ms
- ✅ Bundle size <10KB gzipped
- 🚧 Database query time <200ms
- 🚧 99.9% uptime
- 🚧 Support 100+ concurrent users

### Business Impact

- 🚧 50% reduction in triage time
- 🚧 30% increase in first-call resolution
- 🚧 25% reduction in ticket escalations
- 🚧 90%+ accurate department routing
- 🚧 80%+ CSRs find KB articles helpful

## Next Actions

1. **Complete remaining KB articles** following the template above
2. **Build KB article viewer** with modal/page component
3. **Set up Supabase database** with provided schema
4. **Integrate Supabase client** into the application
5. **Implement end-to-end workflow** from triage to database
6. **Test thoroughly** with real-world scenarios
7. **Deploy to production** on Vercel

---

## Questions & Support

For questions about completing this workflow:

- Review the 3 completed KB articles as examples
- Follow the KB article template above
- Use the Supabase schema provided
- Test each feature incrementally
- Refer to WORKING_NOW.md for current status

The foundation is solid. Complete the remaining KB articles and Supabase integration to deliver a world-class triage system!
