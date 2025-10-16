# INT Smart Triage AI 2.0 - MVP Roadmap (Realistic Timeline)

## 🎯 Goal: Production-Ready in 2 Weeks (20-25 hours)

### Current Status: ✅ Phase 1 Complete

- KB Modal with voting ✓
- Real-time search ✓
- CSV export ✓
- Date range picker ✓
- Analytics dashboard ✓

---

## 🚀 CRITICAL PATH TO MVP (8 Steps, ~22 hours)

### Week 1: Core Navigation & Detail View (9 hours)

#### 1. Unified Navigation Header [2h] 🔴 CRITICAL

**Why**: Users can't navigate between pages easily

**What to Build**:

- Simple header on all 4 pages (index, client-history, analytics, demo)
- Logo text + 4 nav links
- Active page highlighting
- Mobile: Stack vertically or hamburger

**Quick Implementation**:

```html
<header class="nav-header">
  <div class="nav-brand">INT Triage AI</div>
  <nav>
    <a href="/">New Triage</a>
    <a href="/client-history.html">History</a>
    <a href="/analytics.html">Analytics</a>
  </nav>
</header>
```

**Deliverable**: Copy-paste header to 4 files, add 50 lines CSS

---

#### 2. Report Detail Page [4h] 🔴 CRITICAL

**Why**: Users can't view full report details

**What to Build**:

- New page: `public/report-detail.html`
- Show all report fields in readable layout
- "Back to History" button
- "View Customer History" button
- "Export to PDF" button (print CSS)

**URL**: `/report-detail.html?id=TRIAGE-xxx`

**Database**: None (just read existing reports table)

**Deliverable**: 1 new page, ~300 lines total

---

#### 3. Link Report Cards to Detail View [1h]

**Why**: Complete the workflow

**What to Do**:

- Update client-history.html report cards
- Make entire card clickable → report-detail.html
- Add "View Details" button

**Deliverable**: Change 1 line in displayReports()

---

#### 4. Add "Recent Reports" to Home Page [2h]

**Why**: Show activity at a glance

**What to Build**:

- Widget below triage form
- Show last 5 reports created today
- Click to view detail

**Deliverable**: 1 widget on index.html, ~100 lines

---

### Week 2: Report Lifecycle (13 hours)

#### 5. Report Status Field [3h] 🔴 CRITICAL

**Why**: Track if reports are resolved

**What to Build**:

- Add status dropdown: New, In Progress, Resolved
- Status badge on report cards (colored)
- Filter by status on client-history
- Update status on detail page

**Database**:

```sql
ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'new';
CREATE INDEX idx_reports_status ON reports(status);
```

**Deliverable**: Status across all views

---

#### 6. Add Notes to Reports [3h] 🔴 CRITICAL

**Why**: CSRs need to add context

**What to Build**:

- Notes section on report-detail.html
- Add note textarea + "Save Note" button
- Display all notes with timestamp
- Simple, no rich text needed

**Database**:

```sql
CREATE TABLE report_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL,
  note TEXT NOT NULL,
  added_by TEXT DEFAULT 'CSR_USER',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Deliverable**: Notes feature on detail page

---

#### 7. Bulk Export on Client History [2h]

**Why**: Export multiple reports at once

**What to Build**:

- Checkboxes on report cards
- "Select All" button
- "Export Selected" button
- Use existing CSV export logic

**Deliverable**: Checkboxes + bulk export button

---

#### 8. Quick Stats on Client History [1h]

**Why**: Show summary at a glance

**What to Build**:

- Stats bar above results
- Count: Total, High Priority, Today
- Updates with filters

**Deliverable**: Stats bar, ~50 lines

---

## 📊 OPTIONAL: Week 3 Enhancements (10 hours)

### If Time Allows (Not MVP Blockers)

#### 9. Assignment System [4h]

- Assign report to CSR
- "My Reports" filter
- Simple team_members table

#### 10. KB Search Page [3h]

- Browse all KB articles
- Simple text search
- Click to open modal

#### 11. Better Mobile Layout [2h]

- Optimize triage form for mobile
- Stack report cards vertically
- Larger tap targets

#### 12. Loading Skeletons [1h]

- Replace spinners with skeleton screens
- Feels faster

---

## ⚡ REALISTIC TIMELINE

### Week 1 Focus (9 hours)

**Days 1-2**: Navigation + Detail View

- Navigation header everywhere (2h)
- Report detail page (4h)
- Link cards to detail (1h)
- Recent reports widget (2h)

**Deliverable**: Full navigation + detail views working

---

### Week 2 Focus (13 hours)

**Days 3-4**: Report Lifecycle

- Status field + filter (3h)
- Notes system (3h)
- Bulk export (2h)
- Quick stats (1h)

**Days 4-5**: Testing & Polish

- Test all workflows (2h)
- Fix bugs (2h)

**Deliverable**: Reports have lifecycle tracking

---

## 🎯 MVP Definition

### Must Have (Week 1-2)

✅ Navigation between all pages
✅ View full report details
✅ Track report status (new/in-progress/resolved)
✅ Add notes to reports
✅ Bulk actions
✅ Quick stats

### Nice to Have (Week 3+)

- Assignment system
- KB search page
- Mobile optimization
- Real-time notifications
- Dark mode
- PWA

---

## 📈 Why This Timeline is Realistic

### Original: 82 hours (too long)

- Included every feature
- Conservative estimates
- Too much polish

### MVP: 22 hours (just right)

- Only essential features
- Completes user workflows
- Production-ready

### Breakdown

- **Week 1**: 9 hours → Core navigation + detail view
- **Week 2**: 13 hours → Report lifecycle + testing

---

## 🚀 Quick Start

**Day 1 (4h)**

1. Add navigation header (2h)
2. Start report detail page (2h)

**Day 2 (5h)**

1. Finish report detail page (2h)
2. Link cards (1h)
3. Recent reports widget (2h)

**Day 3 (4h)**

1. Add status field (3h)
2. Test status workflow (1h)

**Day 4 (5h)**

1. Add notes system (3h)
2. Test notes (1h)
3. Bulk export (1h)

**Day 5 (4h)**

1. Quick stats (1h)
2. Full testing (2h)
3. Bug fixes (1h)

**Total: 22 hours over 5 days = MVP Done**

---

## ✅ Success Criteria

After these 8 steps, users can:

1. ✅ Navigate between all pages easily
2. ✅ View full details of any report
3. ✅ Track report status through lifecycle
4. ✅ Add notes for context
5. ✅ Export multiple reports at once
6. ✅ See quick statistics

**That's a complete, production-ready MVP.**

---

## 🎯 Recommended Approach

### Start Here (4 hours)

1. Navigation header (2h)
2. Report detail page (2h)

**Why**: These two features complete the core workflow and enable everything else.

### Then This (5 hours)

3. Link cards to detail (1h)
4. Recent reports widget (2h)
5. Status field (2h)

**Why**: Now users can track reports through their lifecycle.

### Finally This (4 hours)

6. Notes system (3h)
7. Bulk export + stats (1h)

**Why**: Adds collaboration and efficiency features.

### Testing (2 hours)

8. End-to-end testing
9. Bug fixes

---

## 💡 Why Original Timeline Was Inflated

**Included but NOT MVP**:

- ❌ Dark mode (nice-to-have)
- ❌ Keyboard shortcuts (power users only)
- ❌ Onboarding tour (can add later)
- ❌ PWA (not needed for web app)
- ❌ Real-time notifications (Phase 2)
- ❌ Advanced filters (already have filters)
- ❌ KB admin interface (can use Supabase directly)

**MVP focuses on**:

- ✅ Complete core workflows
- ✅ Essential features only
- ✅ Production-ready
- ✅ Can ship in 2 weeks

---

## 📦 What You Get

### After 22 Hours

- **4 pages**: Home, History, Analytics, Detail
- **Full workflows**: Create → View → Track → Resolve
- **Team features**: Notes, status tracking
- **Reporting**: CSV export, analytics
- **Professional**: Navigation, detail views, status badges

**Ready to launch to users.**

### Later (Phase 2)

- Assignment system
- KB management
- Mobile optimization
- Notifications
- Polish features

---

**Current Status**: Phase 1 Complete (5 steps done)
**Next**: 8 MVP steps (22 hours)
**Launch**: 2 weeks from now

**This is a realistic, achievable timeline.** 🚀
