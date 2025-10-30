# INT Client Success Platform - User Guide

## Quick Start

### 1. Landing Page (/)
When you open the application, you'll see a landing page with two options:
- **Client Success Portal** - Full-featured platform for CSR teams
- **AI Triage Demo** - Quick triage tool for ticket analysis

### 2. Client Success Portal

#### A. Authentication
When you first access the portal, you'll see a login screen:

**Option 1: Sign In**
- Enter any email (e.g., `user@example.com`)
- Enter any password (e.g., `password123`)
- Click "Sign In"
- If the account doesn't exist, it will be created automatically

**Option 2: Guest Mode**
- Click "Continue as Guest"
- Access the portal without creating an account
- Perfect for demos and testing

#### B. Navigation
Once logged in, you'll see:
- **Top Bar**: Shows your email, Home button, and Logout button
- **Tab Navigation**: Access 8 different modules
- **Demo Data Button**: Bottom left corner - seeds sample data

#### C. Main Features

**Dashboard Tab**
- **Live Ticket Dashboard**: Real-time ticket list with filters
- **Customer Context Panel**: Shows customer health, history, and insights
- Filters: Status, Priority, Assignment
- Click any ticket to view details

**Assignment Tab**
- Auto-route tickets based on:
  - CSR specializations
  - Current workload
  - Priority levels
  - Ticket complexity
- Manual assignment override
- Workload balancing

**Follow-Ups Tab**
- Scheduled follow-ups with customers
- Automated reminders
- Priority-based scheduling
- Status tracking

**Templates Tab**
- Pre-written response templates
- AI-powered suggestions
- Effectiveness tracking
- Category-based organization
- Edit and create new templates

**Knowledge Base Tab**
- Searchable articles
- Category filtering
- View count tracking
- Quick reference for common issues
- Link articles to tickets

**Analytics Tab**
- Sentiment analysis over time
- Ticket volume trends
- Response time metrics
- Customer satisfaction scores
- Priority distribution

**Multi-Channel Tab**
- Unified inbox for:
  - Email
  - Live Chat
  - Social Media (Twitter, Facebook)
  - Phone calls
- Conversation threading
- Channel switching

**Forecasting Tab**
- ML-based ticket volume predictions
- Staffing recommendations
- Peak time analysis
- Historical trend comparison

### 3. AI Triage Demo

#### How to Use
1. Click "AI Triage Demo" from landing page
2. Fill out the form:
   - Customer Name
   - Ticket Subject
   - Issue Description
   - Customer Tone (Calm/Frustrated/Angry)
3. Click "Analyze & Triage Ticket"
4. View results:
   - Priority Level
   - Category
   - Confidence Score
   - Response Approach
   - Talking Points
   - KB Article Suggestions

## Complete Workflow Example

### Scenario: New Urgent Ticket

**Step 1: Seed Demo Data**
1. Login to the portal (guest mode is fine)
2. Click "🔧 Seed Demo Data" button (bottom left)
3. Alert appears: "Demo data seeded! Refresh the page."
4. Refresh your browser

**Step 2: View Tickets**
1. Dashboard tab should show 10+ sample tickets
2. Look for urgent/high priority tickets (red badges)
3. Click on a ticket to open detail view

**Step 3: Customer Context**
1. Customer Context Panel loads automatically
2. View:
   - Health Score (0-100)
   - At Risk status
   - Account value
   - Open tickets count
   - Recent interactions

**Step 4: Use Templates**
1. Go to "Templates" tab
2. Filter by category (Technical, Billing, etc.)
3. Select a template
4. Preview and edit
5. Copy to clipboard

**Step 5: Assign Ticket**
1. Go to "Assignment" tab
2. System suggests best CSR based on:
   - Specialization match
   - Current workload
   - Availability
3. Confirm assignment or override

**Step 6: Schedule Follow-Up**
1. Go to "Follow-Ups" tab
2. Create new follow-up
3. Set priority and date
4. Add notes

**Step 7: Check Analytics**
1. Go to "Analytics" tab
2. View sentiment trends
3. Check response times
4. Monitor ticket volume

## Features Explained

### Real-Time Updates
- Tickets update live without refresh
- New tickets appear automatically
- Status changes reflect immediately
- Multi-user collaboration supported

### Smart Routing
- AI analyzes ticket content
- Matches to CSR skills
- Considers current workload
- Escalates critical issues

### Sentiment Analysis
- Analyzes customer tone
- Tracks sentiment over time
- Identifies at-risk customers
- Triggers escalation when needed

### Forecasting
- Predicts ticket volume 7 days ahead
- Suggests staffing levels
- Identifies peak times
- Historical comparison

### Quality Assurance
- AI reviews responses before sending
- Checks for:
  - Tone appropriateness
  - Completeness
  - Accuracy
  - Policy compliance

### Export Options
- Export tickets to CSV
- Generate PDF reports
- Export analytics data
- Custom date ranges

## Tips & Best Practices

### For CSR Managers
1. Seed demo data first to see full functionality
2. Use forecasting to plan staffing
3. Monitor analytics daily
4. Review AI suggestions but trust your team
5. Set up follow-up reminders consistently

### For CSR Agents
1. Check customer context before responding
2. Use templates for consistency
3. Update ticket status regularly
4. Add notes for team visibility
5. Escalate when needed (don't hesitate)

### For Demonstrations
1. Start with guest mode (fastest)
2. Seed demo data immediately
3. Show real-time updates (open two browser windows)
4. Highlight AI features (triage, routing, QA)
5. Export a report to show analytics

## Troubleshooting

### No Tickets Showing
- Click "Seed Demo Data" button
- Refresh page after seeding
- Check filter settings (set to "All")

### Login Issues
- Try guest mode for demos
- Any email/password works (auto-creates account)
- Clear browser cache if stuck

### Slow Loading
- First load may be slower (loading data)
- Refresh once if blank screen
- Check browser console for errors

### Data Not Updating
- Ensure internet connection
- Refresh the page
- Re-seed demo data if needed

## Navigation Summary

```
Home (/)
├── Client Success Portal (/client-success-portal.html)
│   ├── Login/Guest Screen
│   ├── Dashboard (Tickets + Customer Context)
│   ├── Assignment (Auto-routing)
│   ├── Follow-Ups (Scheduling)
│   ├── Templates (Responses)
│   ├── Knowledge Base (Articles)
│   ├── Analytics (Sentiment + Trends)
│   ├── Multi-Channel (Unified Inbox)
│   └── Forecasting (ML Predictions)
└── AI Triage Demo (/demo.html)
    └── Quick triage analysis form
```

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Search knowledge base
- **Ctrl/Cmd + T**: New ticket
- **Ctrl/Cmd + F**: Filter tickets
- **Esc**: Close modal/detail view

## API Integration

All features connect to real Supabase database:
- Real-time subscriptions active
- Row Level Security enforced
- Automatic data sync across devices
- Offline-capable (coming soon)

## Support

For issues or questions:
1. Check TROUBLESHOOTING.md
2. Review inline help tooltips
3. Contact system administrator
4. Check browser console for errors

---

**Built for INT Inc. Client Success Team**
Version 2.0 | Production Ready
