# INT Smart Triage AI 2.0 - Next 20 Logical Steps

## Current Status: ✅ Core Workflow Complete
- Triage processing working
- Database integration active
- Client history view functional
- Navigation implemented

---

## Phase 1: Enhanced User Experience (Steps 1-5)

### 1. **Implement KB Article Viewer Modal**
**Priority**: HIGH
**Time**: 4 hours
**Impact**: High

**What to do:**
- Create modal component that opens when clicking KB article links
- Parse and render markdown content from kb.json
- Add "Was this helpful?" voting buttons
- Track article views in Supabase (kb_views table)
- Add print and email article buttons

**Files to create:**
- `public/kb-viewer.html` or modal component in index.html

**Database:**
```sql
CREATE TABLE kb_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT REFERENCES reports(report_id),
  kb_article_id TEXT NOT NULL,
  csr_agent TEXT,
  helpful BOOLEAN,
  viewed_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 2. **Add Real-time Search on Client History**
**Priority**: MEDIUM
**Time**: 2 hours
**Impact**: Medium

**What to do:**
- Convert search from form submit to real-time filtering
- Add debounce (300ms) to search input
- Show "Searching..." indicator
- Update results count dynamically
- Add "Clear filters" button

**Files to modify:**
- `public/client-history.html` (search form handler)

---

### 3. **Implement CSV Export Functionality**
**Priority**: MEDIUM
**Time**: 3 hours
**Impact**: Medium

**What to do:**
- Implement the "Export to CSV" button (currently placeholder)
- Generate CSV with all report fields
- Include timestamp in filename
- Add option to export filtered results only
- Show download progress for large exports

**Library to add:**
- `papaparse` or vanilla JS CSV generation

---

### 4. **Add Date Range Picker**
**Priority**: MEDIUM
**Time**: 3 hours
**Impact**: Medium

**What to do:**
- Add date range filter to client-history.html
- Include "Last 7 days", "Last 30 days", "Custom range" options
- Update search query to include date filtering
- Show selected date range in results

**UI Addition:**
```html
<div class="form-group">
  <label>Date Range</label>
  <select id="dateRange">
    <option value="all">All Time</option>
    <option value="today">Today</option>
    <option value="week">Last 7 Days</option>
    <option value="month">Last 30 Days</option>
    <option value="custom">Custom Range</option>
  </select>
</div>
```

---

### 5. **Create Analytics Dashboard**
**Priority**: MEDIUM
**Time**: 6 hours
**Impact**: High

**What to do:**
- New page: `public/analytics.html`
- Show key metrics:
  - Total reports submitted
  - Reports by priority (pie chart)
  - Reports by department (bar chart)
  - Reports by customer tone (bar chart)
  - Average confidence score
  - Most active customers
  - Busiest days/times
- Use Chart.js or similar library

**Database queries needed:**
- Aggregate stats from reports table
- Group by priority, category, tone
- Time-based analysis

---

## Phase 2: Knowledge Base Enhancement (Steps 6-10)

### 6. **Complete All 32 Remaining KB Articles**
**Priority**: HIGH
**Time**: 16-20 hours
**Impact**: High

**What to do:**
Follow the template in COMPLETE_WORKFLOW.md to write:
- 2 more Security articles (KB-SEC-003, KB-SEC-004)
- 4 more Technology articles (KB-TECH-002 through KB-TECH-005)
- 5 Website Design articles (KB-WEB-001 through KB-WEB-005)
- 5 Branding articles (KB-BRAND-001 through KB-BRAND-005)
- 5 Content articles (KB-CONT-001 through KB-CONT-005)
- 5 Marketing articles (KB-MARK-001 through KB-MARK-005)
- 5 Operations articles (KB-OPS-001 through KB-OPS-005)

**Each article should include:**
- 2,000-4,000 words
- Complete guide with sections
- Pricing information
- ROI calculations
- Step-by-step processes
- Common pitfalls
- Contact information

---

### 7. **Build KB Search Engine**
**Priority**: MEDIUM
**Time**: 4 hours
**Impact**: Medium

**What to do:**
- New page: `public/kb-search.html`
- Full-text search across all KB articles
- Filter by department
- Sort by relevance or popularity
- Show article previews
- Click to open article viewer

**Database:**
Use existing `knowledge_base_articles` table with search_vector

---

### 8. **Implement KB Article Rating System**
**Priority**: MEDIUM
**Time**: 3 hours
**Impact**: Medium

**What to do:**
- Add 5-star rating system to KB viewer
- Track ratings in database
- Show average rating on article cards
- Sort articles by rating in search results

**Database:**
```sql
CREATE TABLE kb_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_article_id TEXT NOT NULL,
  report_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 9. **Add Related Articles Suggestions**
**Priority**: LOW
**Time**: 3 hours
**Impact**: Low

**What to do:**
- In KB viewer, show "Related Articles" section
- Use tags and category to find related content
- Show 3-5 related articles
- Track clicks on related articles

**Algorithm:**
- Match by category first
- Then by shared tags
- Then by department

---

### 10. **Create KB Article Usage Analytics**
**Priority**: LOW
**Time**: 4 hours
**Impact**: Medium

**What to do:**
- Track which KB articles are most helpful
- Show "Top 10 Most Helpful Articles" on analytics page
- Track article views, ratings, and helpfulness votes
- Identify articles that need improvement (low ratings)

---

## Phase 3: User Management & Authentication (Steps 11-14)

### 11. **Implement User Authentication**
**Priority**: HIGH
**Time**: 6 hours
**Impact**: High

**What to do:**
- Add Supabase Auth (email/password)
- Create login/signup pages
- Protected routes (require login to access)
- Store actual CSR name instead of "CSR_USER"
- Link reports to authenticated users

**Pages to create:**
- `public/login.html`
- `public/signup.html`

**Database:**
Use existing `users` table with Supabase Auth

---

### 12. **Build User Profile Management**
**Priority**: MEDIUM
**Time**: 4 hours
**Impact**: Medium

**What to do:**
- New page: `public/profile.html`
- View/edit user profile
- Set specializations (departments they handle)
- Set availability status
- View personal performance stats
- Change password

**Database:**
Update existing `users` table

---

### 13. **Create Team Dashboard**
**Priority**: MEDIUM
**Time**: 5 hours
**Impact**: Medium

**What to do:**
- New page: `public/team.html`
- View all CSR agents
- See who's available/busy
- View team performance metrics
- Assign tickets to team members
- Send messages to team

**Database:**
Use existing `users` and `csr_performance` tables

---

### 14. **Implement Role-Based Access Control**
**Priority**: MEDIUM
**Time**: 4 hours
**Impact**: High

**What to do:**
- Add roles: CSR, Manager, Admin
- CSRs: Can create/view own reports
- Managers: Can view all reports, analytics
- Admins: Full access including settings
- Update RLS policies accordingly

**Database:**
```sql
-- Update RLS policies
CREATE POLICY "CSRs can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (csr_agent = auth.email());

CREATE POLICY "Managers can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );
```

---

## Phase 4: Advanced Triage Features (Steps 15-18)

### 15. **Add File Attachment Support**
**Priority**: MEDIUM
**Time**: 5 hours
**Impact**: Medium

**What to do:**
- Add file upload to triage form
- Support screenshots, PDFs, logs
- Store in Supabase Storage
- Link attachments to reports
- Display attachments in results view

**Database:**
```sql
CREATE TABLE report_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT REFERENCES reports(report_id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 16. **Implement Similar Ticket Detection**
**Priority**: MEDIUM
**Time**: 6 hours
**Impact**: High

**What to do:**
- When processing triage, search for similar past tickets
- Use text similarity on issue descriptions
- Show "Similar Past Tickets" section in results
- Include how they were resolved
- Link to previous reports

**Algorithm:**
- Use PostgreSQL full-text search
- Calculate similarity score
- Show top 3-5 matches above 70% similarity

---

### 17. **Add Priority Override Capability**
**Priority**: LOW
**Time**: 2 hours
**Impact**: Low

**What to do:**
- Allow CSR to override AI-suggested priority
- Show both AI suggestion and CSR override
- Track override reasons
- Use for AI training data

**UI Addition:**
```html
<div class="priority-override">
  <label>Override Priority:</label>
  <select>
    <option value="">Use AI Suggestion (MEDIUM)</option>
    <option value="high">Override to HIGH</option>
    <option value="medium">Keep as MEDIUM</option>
    <option value="low">Override to LOW</option>
  </select>
  <textarea placeholder="Reason for override..."></textarea>
</div>
```

---

### 18. **Create Ticket Assignment System**
**Priority**: MEDIUM
**Time**: 5 hours
**Impact**: Medium

**What to do:**
- After triage, suggest best CSR to assign
- Based on specializations, availability, workload
- Allow manual assignment override
- Send notification to assigned CSR
- Track assignment history

**Database:**
```sql
CREATE TABLE ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT REFERENCES reports(report_id),
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assignment_reason TEXT
);
```

---

## Phase 5: Communication & Notifications (Steps 19-20)

### 19. **Build Email Report Functionality**
**Priority**: MEDIUM
**Time**: 6 hours
**Impact**: Medium

**What to do:**
- Add "Email Report" button to results
- Generate professional PDF of triage report
- Email to CSR and/or customer
- Include all triage details and KB articles
- Use Supabase Edge Function + email service

**Edge Function:**
```typescript
// supabase/functions/send-triage-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { reportId, recipientEmail } = await req.json()

  // Fetch report from database
  // Generate PDF
  // Send email via SendGrid/Resend

  return new Response(JSON.stringify({ success: true }))
})
```

**Email Template:**
- Company logo
- Report summary
- Priority and department
- Talking points
- KB article links
- Contact information

---

### 20. **Implement Real-time Notifications**
**Priority**: MEDIUM
**Time**: 8 hours
**Impact**: High

**What to do:**
- Add notification bell icon to header
- Show new tickets assigned to CSR
- Show high-priority escalations
- Show when KB articles are updated
- Desktop notifications (optional)
- Use Supabase Realtime subscriptions

**Implementation:**
```javascript
// Subscribe to new reports
supabase
  .channel('new_reports')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'reports',
    filter: `assigned_to=eq.${userId}`
  }, (payload) => {
    showNotification('New ticket assigned!', payload.new)
  })
  .subscribe()
```

**UI Addition:**
```html
<div class="notification-bell">
  <button id="notificationBtn">
    🔔 <span class="badge">3</span>
  </button>
  <div class="notification-dropdown">
    <div class="notification-item">...</div>
  </div>
</div>
```

---

## Summary by Priority

### HIGH Priority (Must-Have)
1. ✅ KB Article Viewer Modal (Step 1)
2. ✅ Complete All KB Articles (Step 6)
3. ✅ User Authentication (Step 11)

### MEDIUM Priority (Should-Have)
4. ✅ Real-time Search (Step 2)
5. ✅ CSV Export (Step 3)
6. ✅ Date Range Picker (Step 4)
7. ✅ Analytics Dashboard (Step 5)
8. ✅ KB Search Engine (Step 7)
9. ✅ KB Rating System (Step 8)
10. ✅ User Profile (Step 12)
11. ✅ Team Dashboard (Step 13)
12. ✅ Role-Based Access (Step 14)
13. ✅ File Attachments (Step 15)
14. ✅ Similar Tickets (Step 16)
15. ✅ Ticket Assignment (Step 18)
16. ✅ Email Reports (Step 19)
17. ✅ Real-time Notifications (Step 20)

### LOW Priority (Nice-to-Have)
18. ✅ Related Articles (Step 9)
19. ✅ KB Usage Analytics (Step 10)
20. ✅ Priority Override (Step 17)

---

## Implementation Timeline

### Week 1: UX Enhancements
- Days 1-2: KB Article Viewer (Step 1)
- Day 3: Real-time Search (Step 2)
- Day 4: CSV Export (Step 3)
- Day 5: Date Range Picker (Step 4)

### Week 2: KB Content & Analytics
- Days 1-4: Write all KB articles (Step 6)
- Day 5: Analytics Dashboard (Step 5)

### Week 3: Authentication & Access
- Days 1-2: User Authentication (Step 11)
- Day 3: User Profile (Step 12)
- Day 4: Role-Based Access (Step 14)
- Day 5: Team Dashboard (Step 13)

### Week 4: Advanced Features
- Days 1-2: KB Search & Rating (Steps 7-8)
- Day 3: File Attachments (Step 15)
- Day 4: Similar Tickets (Step 16)
- Day 5: Ticket Assignment (Step 18)

### Week 5: Communication & Polish
- Days 1-2: Email Reports (Step 19)
- Days 3-4: Real-time Notifications (Step 20)
- Day 5: Testing & bug fixes

### Week 6: Remaining Features
- Day 1-2: Related Articles (Step 9)
- Day 3: KB Usage Analytics (Step 10)
- Day 4: Priority Override (Step 17)
- Day 5: Final testing and deployment

---

## Technical Debt & Maintenance

After completing the 20 steps, consider:

1. **Performance Optimization**
   - Implement query caching
   - Add pagination for large result sets
   - Optimize bundle size
   - Add service worker for offline support

2. **Testing**
   - Unit tests for triage logic
   - Integration tests for database operations
   - E2E tests for critical workflows
   - Load testing for concurrent users

3. **Documentation**
   - API documentation
   - User manual/help center
   - Video tutorials
   - Admin guide

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)
   - Usage analytics (Posthog/Mixpanel)
   - Uptime monitoring

5. **Security Audit**
   - Penetration testing
   - RLS policy review
   - Input validation audit
   - OWASP compliance check

---

## Success Metrics to Track

After implementing these steps, measure:

1. **User Adoption**
   - Daily active users
   - Reports created per day
   - Feature usage rates

2. **Efficiency**
   - Average triage time
   - Reports per CSR per day
   - Time saved vs manual triage

3. **Accuracy**
   - Priority override rate
   - KB article helpfulness score
   - Customer satisfaction impact

4. **System Health**
   - API response times
   - Error rates
   - Database query performance

---

**Ready to start with Step 1: KB Article Viewer Modal?** 🚀
