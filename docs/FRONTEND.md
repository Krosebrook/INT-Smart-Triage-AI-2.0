# Frontend Documentation - INT Smart Triage AI 2.0

**Version:** 2.0
**Last Updated:** October 16, 2025
**Author:** INT Inc. Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [HTML Pages](#html-pages)
3. [JavaScript Modules](#javascript-modules)
4. [CSS & Styling](#css--styling)
5. [PWA Components](#pwa-components)
6. [Design System](#design-system)
7. [Accessibility](#accessibility)
8. [Responsive Design](#responsive-design)
9. [User Flows](#user-flows)
10. [Best Practices](#best-practices)

---

## Overview

The INT Smart Triage AI 2.0 frontend is a modern, progressive web application (PWA) built with vanilla JavaScript, HTML5, and CSS3. It provides an intuitive interface for customer service representatives to manage ticket triage, view analytics, and access knowledge base resources.

### Key Features

- **Progressive Web App (PWA)** - Installable, offline-capable, with service worker caching
- **Dark/Light Theme** - User-preference theme system with localStorage persistence
- **Real-time Updates** - Live data synchronization via Supabase
- **Keyboard Shortcuts** - Power user features for efficient navigation
- **Interactive Onboarding** - First-time user guidance system
- **Responsive Design** - Mobile-first approach supporting all device sizes
- **Client-Side Triage** - Intelligent ticket analysis without server dependency

### Technology Stack

- **HTML5** - Semantic markup, accessible elements
- **CSS3** - CSS Variables, Flexbox, Grid, Animations
- **ES6+ JavaScript** - Modern modules, async/await, destructuring
- **Chart.js** - Data visualization for analytics
- **Tailwind CSS** - Utility-first CSS (demo page only)
- **Supabase Client** - Real-time database and authentication

---

## HTML Pages

### 1. index.html - Main Dashboard

**Path:** `/index.html`
**Purpose:** Primary CSR dashboard for creating new ticket triage reports

#### Features

- **New Triage Form** - Customer ticket submission with fields:
  - Customer Name (text input)
  - Ticket Subject (text input)
  - Issue Description (textarea)
  - Customer Tone (dropdown: calm, frustrated, angry, confused, urgent)
- **Client-Side Processing** - Real-time triage analysis without API dependency
- **Results Display** - Comprehensive triage results including:
  - Priority badge (High/Medium/Low)
  - Confidence score
  - Department routing
  - Response approach recommendations
  - Talking points
  - Knowledge base article suggestions
- **Navigation Links** - Quick access to all major sections
- **System Status Indicator** - Real-time connection status

#### User Flow

1. CSR arrives at dashboard
2. (Optional) Completes onboarding tour on first visit
3. Fills out triage form with customer details
4. Submits form for analysis
5. Reviews AI-generated recommendations
6. Takes action (view customer history, browse reports, create new triage)

#### Key UI Elements

```html
<!-- Priority Badge Example -->
<span class="priority-badge priority-high">HIGH PRIORITY</span>

<!-- Status Indicator -->
<div class="status-indicator">
  <span class="status-online">● System Online</span>
</div>
```

#### JavaScript Dependencies

- `/src/supabaseClient.js` - Database operations
- `/src/realtimeService.js` - Live updates
- `/src/sentimentAnalysis.js` - Customer tone analysis
- `/src/assignmentEngine.js` - Auto-assignment logic
- `/src/emailService.js` - Confirmation emails
- `/src/communicationHub.js` - Team notifications
- `/public/theme.js` - Theme management
- `/public/shortcuts.js` - Keyboard navigation
- `/public/onboarding.js` - User onboarding

---

### 2. login.html - Authentication Page

**Path:** `/public/login.html`
**Purpose:** User authentication and session management

#### Features

- **Supabase Authentication** - Secure email/password login
- **Error Handling** - Display authentication errors
- **Auto-redirect** - Navigates to dashboard on successful login
- **Last Login Tracking** - Updates user_profiles table
- **Theme Toggle** - Dark/light mode support
- **Gradient Background** - Purple gradient (667eea → 764ba2)

#### User Flow

1. User enters email and password
2. System validates credentials with Supabase
3. On success:
   - Updates last_login_at timestamp
   - Shows success notification
   - Redirects to main dashboard after 1 second
4. On error:
   - Displays error message
   - Keeps user on login page

#### Form Structure

```html
<form id="loginForm">
  <input type="email" id="email" required />
  <input type="password" id="password" required />
  <button type="submit">Sign In</button>
</form>
```

#### Styling Notes

- Centered card layout with shadow
- Responsive max-width: 400px
- Focus states with border-color transitions
- Gradient button with hover lift effect

---

### 3. register.html - User Registration

**Path:** `/public/register.html`
**Purpose:** New user account creation

#### Features

- **Multi-field Form**:
  - Full Name
  - Email Address
  - Password (min 6 characters)
  - Confirm Password
- **Password Validation** - Client-side password match verification
- **Supabase SignUp** - Creates authenticated user with metadata
- **User Profile Creation** - Stores full_name in user metadata
- **Auto-redirect** - Routes to dashboard after 2 seconds

#### User Flow

1. New user fills registration form
2. Client validates password match
3. Supabase creates account
4. Success notification displays
5. Automatic redirect to dashboard

#### Validation Logic

```javascript
if (password !== confirmPassword) {
  errorDiv.textContent = 'Passwords do not match';
  return;
}
```

---

### 4. demo.html - Interactive Demo

**Path:** `/public/demo.html`
**Purpose:** Standalone demo interface for testing triage functionality

#### Features

- **Tailwind CSS UI** - Modern utility-first styling
- **Mock API Simulation** - 2-second processing delay
- **Domain Selection** - Technical, Billing, General, Sales
- **Persona Loading** - Dynamic from /data/personas.json
- **Knowledge Base Integration** - Loads from /data/kb.json
- **JSON Output Display** - Formatted results in monospace font

#### Mock API Logic

```javascript
async function mockTriageAPI(payload) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    success: true,
    ticket_id: `TKT-${Date.now()}`,
    priority: determineMockPriority(payload.ticket),
    category: determineMockCategory(payload.domain),
    sentiment: determineMockSentiment(payload.ticket),
    suggested_response: generateMockResponse(payload),
    kb_articles: findRelevantKBArticles(payload.domain),
    processing_time_ms: Math.floor(Math.random() * 500) + 100,
  };
}
```

#### UI States

- **Loading** - Animated spinner with yellow background
- **Results** - Dark gray card with syntax-highlighted JSON
- **Error** - Red card with error message

---

### 5. analytics.html - Analytics Dashboard

**Path:** `/public/analytics.html`
**Purpose:** Performance metrics and reporting visualization

#### Features

- **Stat Cards Grid** - Key metrics display:
  - Total Reports
  - Avg Resolution Time
  - High Priority Count
  - Resolved This Week
- **Chart.js Visualizations**:
  - Doughnut chart: Reports by Priority
  - Bar chart: Reports by Status
  - Line chart: Trend over 30 days
- **CSR Performance Table** - Agent-level statistics
- **Real-time Data** - Loads from Supabase reports table
- **Theme Support** - Dark/light mode compatible

#### Stat Card Example

```html
<div class="stat-card">
  <div class="stat-value">247</div>
  <div class="stat-label">Total Reports</div>
  <div class="stat-change positive">+12% vs last month</div>
</div>
```

#### Chart Configuration

```javascript
new Chart(document.getElementById('priorityChart'), {
  type: 'doughnut',
  data: {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [highCount, mediumCount, lowCount],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
      },
    ],
  },
});
```

---

### 6. advanced-analytics.html - Advanced Metrics

**Path:** `/public/advanced-analytics.html`
**Purpose:** Comprehensive analytics with filtering and export capabilities

#### Features

- **Advanced Filters**:
  - Date Range (7/30/60/90 days)
  - Priority Filter
  - Department Filter
- **Export Options**:
  - CSV export
  - JSON export
  - PDF report generation (planned)
- **Chart Download** - Export charts as PNG images
- **Multiple Visualizations**:
  - Ticket Volume Over Time (line chart)
  - Priority Distribution (doughnut chart)
  - Department Workload (stacked bar chart)
  - CSR Performance Metrics (bar chart)
  - Response Time Analysis (bar chart)

#### Data Service Integration

```javascript
import {
  getTicketVolumeByDay,
  getPriorityDistribution,
  getDepartmentWorkload,
  getCSRPerformanceMetrics,
  getResponseTimeAnalysis,
  exportAnalyticsData,
} from '/src/analyticsService.js';
```

#### Export Functionality

```javascript
window.exportData = async function (format) {
  const filters = {
    priority: document.getElementById('priorityFilter').value,
    department: document.getElementById('departmentFilter').value,
  };

  const result = await exportAnalyticsData(format, filters);

  if (format === 'csv') {
    downloadFile(result.data, 'analytics-export.csv', 'text/csv');
  }
};
```

---

### 7. client-history.html - Report Search

**Path:** `/public/client-history.html`
**Purpose:** Search, filter, and browse all triage reports

#### Features

- **Quick Stats Dashboard** - Summary metrics at top
- **Advanced Search**:
  - Customer name/subject/description
  - Assigned CSR filter
  - Priority filter
  - Customer tone filter
- **Report Cards** - Rich display with:
  - Customer name and subject
  - Priority, tone, category badges
  - Status indicators (New/In Progress/Resolved)
  - Confidence score
  - Department assignment
  - Action buttons
- **Bulk Operations**:
  - Checkbox selection
  - Export selected reports to CSV
- **Skeleton Loading** - Smooth loading states
- **URL Parameters** - Direct customer/report linking

#### Search Implementation

```javascript
async function handleSearch(e) {
  e.preventDefault();

  const query = document.getElementById('searchQuery').value;
  const priority = document.getElementById('priorityFilter').value;
  const tone = document.getElementById('toneFilter').value;
  const assigned = document.getElementById('assignedFilter').value;

  const result = await searchReports(query, {
    priority: priority || undefined,
    customerTone: tone || undefined,
    assignedTo: assigned || undefined,
  });

  displayReports(result.data);
}
```

#### Badge System

```css
.priority-high {
  background: #fee2e2;
  color: #dc2626;
}
.priority-medium {
  background: #fef3c7;
  color: #d97706;
}
.priority-low {
  background: #d1fae5;
  color: #059669;
}

.tone-angry {
  background: #fecaca;
  color: #991b1b;
}
.tone-urgent {
  background: #fed7aa;
  color: #c2410c;
}
.tone-calm {
  background: #bfdbfe;
  color: #1e40af;
}
```

---

### 8. kb-search.html - Knowledge Base

**Path:** `/public/kb-search.html`
**Purpose:** Browse and search support articles

#### Features

- **Global Navigation Bar** - Dark header with site-wide links
- **Search Input** - Real-time article filtering
- **Category Filters** - All, Technical, Billing, Account, General
- **Article Cards Grid** - Responsive grid layout
- **Article Modal** - Full-screen article viewer
- **View Tracking** - Articles track views and helpful votes
- **Keyword Search** - Searches title, content, and keywords

#### Search Logic

```javascript
function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allArticles;

  if (currentCategory !== 'all') {
    filtered = filtered.filter((a) => a.category === currentCategory);
  }

  if (query) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(query)))
    );
  }

  displayArticles(filtered);
}
```

#### Article Card

```html
<div class="kb-card" onclick="openArticle('KB-001')">
  <div class="kb-category">Technical</div>
  <h3>How to Reset Your Password</h3>
  <div class="kb-description">Step-by-step guide...</div>
  <div class="kb-footer">
    <span>📖 245 views</span>
    <span>👍 89 helpful</span>
  </div>
</div>
```

---

### 9. report-detail.html - Report Viewer

**Path:** `/public/report-detail.html`
**Purpose:** Detailed view of individual triage reports with status management

#### Features

- **Global Navigation** - Consistent site header
- **Breadcrumb Navigation** - Back to client history
- **Report Header**:
  - Report ID and timestamp
  - Priority badge
  - Status selector (New/In Progress/Resolved)
  - Assignment management
- **Customer Information Grid**:
  - Customer name
  - Detected tone
  - Department
  - Confidence score
- **AI Analysis Section** - Response approach recommendations
- **Talking Points List** - Suggested conversation points
- **Knowledge Base Links** - Relevant articles
- **Case Notes System**:
  - Add notes
  - View note history
  - Delete notes
  - CSR attribution
- **Action Buttons**:
  - Export to PDF (print)
  - View customer history
  - Return to all reports

#### Status Management

```javascript
async function updateStatusButtons(currentStatus) {
  const buttons = document.querySelectorAll('.status-btn');

  buttons.forEach((btn) => {
    btn.onclick = async () => {
      const newStatus = btn.dataset.status;
      const result = await updateReportStatus(reportId, newStatus);

      if (result.success) {
        updateStatusButtons(newStatus);
        showNotification(`Status updated to ${formatStatus(newStatus)}`);
      }
    };
  });
}
```

#### Assignment System

```javascript
document.getElementById('assignBtn').onclick = async () => {
  const assignTo = document.getElementById('assignInput').value.trim();
  const result = await assignReport(reportId, assignTo);

  if (result.success) {
    updateAssignmentUI({ assigned_to: assignTo });
    showNotification(`Assigned to ${assignTo}`);
  }
};
```

#### Notes Management

```javascript
async function loadNotes() {
  const result = await getNotes(reportId);

  if (result.data.length === 0) {
    notesList.innerHTML = '<div class="notes-empty">No notes yet.</div>';
    return;
  }

  notesList.innerHTML = result.data
    .map(
      (note) => `
    <div class="note-item">
      <div class="note-header">
        <span class="note-author">${note.csr_agent}</span>
        <span class="note-date">${new Date(note.created_at).toLocaleString()}</span>
        <button class="note-delete" onclick="handleDeleteNote('${note.id}')">Delete</button>
      </div>
      <div class="note-text">${escapeHtml(note.note_text)}</div>
    </div>
  `
    )
    .join('');
}
```

---

## JavaScript Modules

### 1. triage.js - Client-Side Triage Logic

**Path:** `/public/triage.js`
**Purpose:** Process ticket triage without server dependency

#### Core Function

```javascript
export function processTriageRequest(ticketData)
```

**Parameters:**

- `ticketData` (object):
  - `issueDescription` (string)
  - `customerTone` (string)
  - `ticketSubject` (string)
  - `customerName` (string)

**Returns:**

- `success` (boolean)
- `priority` (string: high/medium/low)
- `confidence` (string percentage)
- `category` (string)
- `department` (string)
- `responseApproach` (string)
- `talkingPoints` (array of strings)
- `knowledgeBase` (array of KB article IDs)
- `reportId` (string: TR-{timestamp}-{random})
- `timestamp` (ISO string)
- `analysis` (object)

#### Priority Determination

**High Priority Triggers:**

- Keywords: down, outage, critical, urgent, broken, not working, crashed, hack, breach, security, data loss
- Customer tone: angry, urgent

**Medium Priority:**

- Keywords: slow, issue, problem, error, bug, migration, update

**Low Priority:**

- Keywords: question, help, how to, feature, enhancement, inquiry
- Customer tone: calm

#### Department Routing

| Department           | Keywords                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| Information Security | security, compliance, soc2, gdpr, cyber, breach, vulnerability, insurance, audit |
| Technology           | server, network, email, cloud, backup, it, computer, software, saas, migration   |
| Website Design       | website, web design, ecommerce, shopify, wordpress, landing page, hosting        |
| Branding             | logo, brand, identity, design, visual, color, typography                         |
| Content              | content, writing, seo, blog, copy, ebook, article                                |
| Marketing            | marketing, hubspot, crm, automation, campaign, email marketing                   |
| Operations           | bookkeeping, accounting, process, workflow, ai, bi, analytics                    |

#### Helper Functions

**generateResponseApproach(tone, priority, department)**

- Returns customized response strategy based on customer tone
- Adds escalation notes for high priority

**generateTalkingPoints(tone, priority, category)**

- Combines base talking points with category-specific points
- Adds empathy points based on customer tone

**generateKBArticles(category, priority)**

- Returns 3-4 relevant KB articles
- More articles for high priority tickets

**estimateResolutionTime(priority)**

- High: 1-4 hours
- Medium: 4-24 hours
- Low: 1-3 business days

#### Usage Example

```javascript
import { processTriageRequest } from '/public/triage.js';

const result = processTriageRequest({
  customerName: 'John Doe',
  ticketSubject: 'Email server down',
  issueDescription:
    'Our company email server is not working since this morning. This is critical.',
  customerTone: 'urgent',
});

console.log(result.priority); // 'high'
console.log(result.department); // 'Technology'
console.log(result.confidence); // '90%'
```

---

### 2. theme.js - Dark/Light Mode Management

**Path:** `/public/theme.js`
**Purpose:** User theme preference system

#### Functions

**initTheme()**

- Loads saved theme from localStorage
- Defaults to 'light' if no preference
- Updates DOM data-theme attribute
- Updates theme icon

**toggleTheme()**

- Switches between dark and light modes
- Saves preference to localStorage
- Updates icon (🌙 for light mode, ☀️ for dark mode)

**updateThemeIcon(theme)**

- Internal helper to update button icon

#### Implementation

```javascript
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}
```

#### CSS Integration

The theme system uses CSS variables defined in theme.css:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #2c3e50;
  /* ... */
}

[data-theme='dark'] {
  --bg-primary: #1a202c;
  --text-primary: #e2e8f0;
  /* ... */
}
```

#### Usage

```javascript
import { initTheme, toggleTheme } from '/public/theme.js';

// Initialize on page load
initTheme();

// Make toggleTheme globally accessible
window.toggleTheme = toggleTheme;
```

```html
<button class="theme-toggle" onclick="toggleTheme()">
  <span id="themeIcon">🌙</span>
</button>
```

---

### 3. notifications.js - Toast Notification System

**Path:** `/public/notifications.js`
**Purpose:** Non-blocking user notifications

#### Core Function

**showNotification(message, type, duration)**

**Parameters:**

- `message` (string) - Notification text
- `type` (string) - success, error, warning, info (default: success)
- `duration` (number) - Display time in ms (default: 5000)

#### Notification Queue

- Notifications are queued and displayed sequentially
- Prevents notification overlap
- Smooth slide-in/slide-out animations

#### Notification Types

| Type    | Color            | Icon |
| ------- | ---------------- | ---- |
| success | Green (#10b981)  | ✓    |
| error   | Red (#ef4444)    | ✕    |
| warning | Orange (#f59e0b) | ⚠   |
| info    | Blue (#3b82f6)   | ℹ   |

#### Helper Functions

**showSuccess(message)** - Green success notification
**showError(message)** - Red error notification
**showWarning(message)** - Orange warning notification
**showInfo(message)** - Blue info notification

#### Styling

- Fixed position top-right
- Slide animation from right
- Click to dismiss
- Auto-dismiss after duration
- Semi-transparent backdrop

#### Usage Example

```javascript
import {
  showNotification,
  showSuccess,
  showError,
} from '/public/notifications.js';

// Standard notification
showNotification('Report saved successfully!', 'success', 3000);

// Helper method
showSuccess('Login successful! Redirecting...');

// Error notification
showError('Failed to connect to database');

// Custom duration
showNotification('Processing...', 'info', 10000);
```

#### Implementation

```javascript
function displayNextNotification() {
  const { message, type, duration } = notificationQueue.shift();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.right = '-400px'; // Start off-screen

  document.body.appendChild(notification);

  // Slide in
  setTimeout(() => {
    notification.style.right = '20px';
  }, 10);

  // Auto-remove
  setTimeout(() => {
    notification.style.right = '-400px';
    setTimeout(() => {
      notification.remove();
      displayNextNotification(); // Show next in queue
    }, 300);
  }, duration);
}
```

---

### 4. onboarding.js - User Onboarding System

**Path:** `/public/onboarding.js`
**Purpose:** First-time user guidance and product tours

#### Core Function

**initOnboarding()**

- Checks if onboarding already completed (localStorage)
- Only shows on main dashboard (/ or /index.html)
- Waits 1 second before displaying
- Shows welcome modal

#### Tour Steps

1. **Create Triage Reports** - Explains triage form
2. **View Client History** - Shows client history link
3. **Browse Knowledge Base** - Points to KB search
4. **Keyboard Shortcuts** - Demonstrates shortcuts (Ctrl+K, Ctrl+N, etc.)
5. **Dark Mode** - Shows theme toggle button

#### Step Configuration

```javascript
const steps = [
  {
    title: 'Create Triage Reports',
    description: 'Fill out this form to log customer issues...',
    element: '.triage-form',
    position: 'bottom',
  },
  // ...
];
```

#### User Options

- **Skip Tour** - Dismisses onboarding, marks as completed
- **Start Tour** - Begins step-by-step walkthrough
- **Close (×)** - Exits tour at any point
- **Next** - Advances to next step
- **Finish** - Completes tour on last step

#### Overlay System

- Dark backdrop (80% opacity)
- Highlighted target element (z-index: 9999)
- Positioned tooltip
- Smooth scrolling to elements

#### Persistence

```javascript
// Mark as completed
localStorage.setItem('onboardingCompleted', 'true');

// Check completion status
if (localStorage.getItem('onboardingCompleted')) {
  return; // Skip onboarding
}
```

#### Usage

```javascript
import { initOnboarding } from '/public/onboarding.js';

document.addEventListener('DOMContentLoaded', () => {
  initOnboarding();
});
```

---

### 5. shortcuts.js - Keyboard Shortcuts

**Path:** `/public/shortcuts.js`
**Purpose:** Power user keyboard navigation

#### Supported Shortcuts

| Shortcut | Action                     |
| -------- | -------------------------- |
| Ctrl+K   | Focus search input         |
| Ctrl+N   | Navigate to new triage (/) |
| Ctrl+H   | Navigate to client history |
| Ctrl+B   | Navigate to knowledge base |
| Ctrl+/   | Show shortcuts help modal  |
| Esc      | Close all modals           |

#### Core Function

**initKeyboardShortcuts()**

- Attaches global keydown listener
- Prevents default browser actions
- Supports both Ctrl and Cmd (Mac)

#### Search Focus Logic

```javascript
function focusSearch() {
  const searchInputs = ['searchQuery', 'searchInput', 'customerName'];

  for (const id of searchInputs) {
    const input = document.getElementById(id);
    if (input) {
      input.focus();
      input.select();
      break;
    }
  }
}
```

#### Help Modal

Displays keyboard shortcuts reference:

```javascript
function showShortcutsHelp() {
  const helpModal = document.createElement('div');
  helpModal.innerHTML = `
    <div class="modal-content">
      <h2>Keyboard Shortcuts</h2>
      <div>
        <span>Focus Search</span>
        <kbd>Ctrl+K</kbd>
      </div>
      <!-- ... -->
    </div>
  `;
  document.body.appendChild(helpModal);
}
```

#### Usage

```javascript
import { initKeyboardShortcuts } from '/public/shortcuts.js';

// Initialize on page load
initKeyboardShortcuts();
```

#### Accessibility

- Keyboard shortcuts announced via help modal
- Does not interfere with native browser shortcuts
- Can be dismissed with Esc key
- Modal clickable outside to close

---

### 6. sw.js - Service Worker

**Path:** `/public/sw.js`
**Purpose:** PWA offline support and caching

#### Cache Strategy

**Static Cache (CACHE_NAME: 'int-triage-v1.0.0')**

- HTML pages
- CSS files
- JavaScript modules
- Data files (kb.json, personas.json)

**Runtime Cache (RUNTIME_CACHE)**

- Dynamically cached resources
- API responses
- User-generated content

#### Caching Strategies

**Cache-First (Local Resources)**

```javascript
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}
```

**Network-First (External Resources)**

```javascript
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

#### Lifecycle Events

**Install**

- Pre-caches static assets
- Calls skipWaiting() for immediate activation

**Activate**

- Removes old caches
- Claims all clients immediately

**Fetch**

- Intercepts network requests
- Routes to appropriate cache strategy
- Only processes GET requests

#### Push Notifications

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    requireInteraction: data.priority === 'high',
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
```

#### Background Sync

**Sync Event (sync-reports)**

- Retries failed API requests
- Syncs offline-created reports
- Cleans up cache after successful sync

#### Message Events

**SKIP_WAITING** - Forces service worker activation
**CLEAR_CACHE** - Removes all caches

#### Registration

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/public/sw.js')
    .then((reg) => console.log('Service Worker registered'))
    .catch((err) => console.error('Registration failed:', err));
}
```

---

## CSS & Styling

### theme.css - Global Styles

**Path:** `/public/theme.css`
**Purpose:** CSS variables, theme system, and shared styles

#### CSS Variables

**Light Theme (:root)**

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-gradient-start: #667eea;
  --bg-gradient-end: #764ba2;
  --text-primary: #2c3e50;
  --text-secondary: #666666;
  --text-light: #999999;
  --border-color: #e1e8ed;
  --header-bg: #2c3e50;
  --card-bg: #ffffff;
  --shadow: rgba(0, 0, 0, 0.1);
  --input-bg: #ffffff;
  --input-border: #e0e0e0;
}
```

**Dark Theme ([data-theme='dark'])**

```css
[data-theme='dark'] {
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-gradient-start: #4c51bf;
  --bg-gradient-end: #553c9a;
  --text-primary: #e2e8f0;
  --text-secondary: #cbd5e0;
  --text-light: #a0aec0;
  --border-color: #4a5568;
  --header-bg: #2d3748;
  --card-bg: #2d3748;
  --shadow: rgba(0, 0, 0, 0.3);
  --input-bg: #374151;
  --input-border: #4a5568;
}
```

#### Smooth Transitions

All color/background transitions animate:

```css
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}
```

#### Theme Toggle Button

```css
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  box-shadow: 0 4px 12px var(--shadow);
  z-index: 1000;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px var(--shadow);
}
```

#### Global Element Styling

**Body Background**

```css
body {
  background: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-end) 100%
  );
  color: var(--text-primary);
}
```

**Form Elements**

```css
input,
textarea,
select {
  background: var(--input-bg);
  border-color: var(--input-border);
  color: var(--text-primary);
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--bg-gradient-start);
}
```

**Cards and Containers**

```css
.report-card,
.kb-card {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

#### Dark Mode Specific Overrides

```css
[data-theme='dark'] .report-card:hover,
[data-theme='dark'] .kb-card:hover {
  background: #374151; /* Slightly lighter on hover */
}

[data-theme='dark'] ::placeholder {
  color: var(--text-light);
  opacity: 0.6;
}
```

---

## PWA Components

### manifest.json - App Manifest

**Path:** `/public/manifest.json`
**Purpose:** PWA configuration and metadata

#### Basic Configuration

```json
{
  "name": "INT Smart Triage AI 2.0",
  "short_name": "INT Triage",
  "description": "Intelligent Customer Service Triage System for INT Inc.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2c3e50",
  "theme_color": "#667eea",
  "orientation": "portrait-primary"
}
```

#### Icons

Multiple sizes for various devices:

- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512
- All PNG format
- Purpose: "any maskable" for adaptive icons

#### Screenshots

```json
"screenshots": [
  {
    "src": "/screenshots/desktop-screenshot.png",
    "sizes": "1280x720",
    "type": "image/png",
    "form_factor": "wide"
  },
  {
    "src": "/screenshots/mobile-screenshot.png",
    "sizes": "750x1334",
    "type": "image/png",
    "form_factor": "narrow"
  }
]
```

#### App Shortcuts

Quick actions from home screen/app drawer:

```json
"shortcuts": [
  {
    "name": "Create New Triage",
    "short_name": "New Triage",
    "url": "/",
    "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]
  },
  {
    "name": "View Analytics",
    "url": "/public/advanced-analytics.html"
  },
  {
    "name": "Client History",
    "url": "/public/client-history.html"
  }
]
```

#### Categories

```json
"categories": ["business", "productivity"]
```

#### Installation

**Desktop (Chrome/Edge)**

1. User visits site
2. Browser shows install prompt
3. User clicks "Install"
4. App opens in standalone window

**Mobile (Android)**

1. User visits site
2. "Add to Home Screen" prompt appears
3. User adds icon to home screen
4. App opens fullscreen

**iOS (Safari)**

1. User clicks share button
2. Selects "Add to Home Screen"
3. App icon added to home screen

---

## Design System

### Color Palette

#### Primary Colors

**Gradient (Brand)**

- Start: `#667eea` (Purple-blue)
- End: `#764ba2` (Deep purple)

**Neutral Colors**

- Dark: `#2c3e50` (Header background)
- Gray: `#666666` (Secondary text)
- Light Gray: `#999999` (Tertiary text)
- Border: `#e1e8ed` (Dividers)
- Background: `#f8f9fa` (Cards, sections)

#### Status Colors

**Priority Levels**

- High: `#e74c3c` (Red)
- Medium: `#f39c12` (Orange)
- Low: `#27ae60` (Green)

**Report Status**

- New: `#1e40af` (Blue)
- In Progress: `#92400e` (Brown-orange)
- Resolved: `#065f46` (Dark green)

**Tone Indicators**

- Angry: `#991b1b` (Deep red)
- Urgent: `#c2410c` (Orange-red)
- Frustrated: `#92400e` (Brown)
- Confused: `#5b21b6` (Purple)
- Calm: `#1e40af` (Blue)

**System Status**

- Success: `#10b981` (Emerald)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)
- Info: `#3b82f6` (Blue)

### Typography

**Font Families**

- Primary: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- Monospace: `'Monaco', 'Menlo', 'Ubuntu Mono', monospace` (Code/JSON display)

**Font Sizes**

- H1: 32px - 40px (Page titles)
- H2: 20px - 28px (Section headings)
- H3: 18px - 24px (Card titles)
- Body: 14px - 16px (Main text)
- Small: 12px - 13px (Meta text, labels)

**Font Weights**

- Light: 400 (Body text)
- Medium: 500 (Labels)
- Semibold: 600 (Buttons, headings)
- Bold: 700 (Stat values, emphasis)

### Spacing

**Padding/Margin Scale**

- xs: 5px
- sm: 10px
- md: 15px
- lg: 20px
- xl: 30px
- 2xl: 40px

**Common Patterns**

- Card padding: 25px - 30px
- Form group margin: 20px
- Section margin: 20px - 30px
- Button padding: 12px 24px

### Shadows

**Elevation Levels**

```css
/* Level 1 - Cards */
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

/* Level 2 - Modals */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

/* Level 3 - Dropdowns */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

/* Hover state */
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
```

### Border Radius

- Small: 4px - 5px (Badges, tags)
- Medium: 8px (Inputs, buttons)
- Large: 10px - 15px (Cards, containers)
- Pill: 20px - 25px (Status indicators)
- Circle: 50% (Avatar, theme toggle)

### Animations

**Common Transitions**

```css
/* Standard */
transition: all 0.3s ease;

/* Hover lift */
transform: translateY(-2px);
transition: transform 0.2s;

/* Button active */
transform: scale(0.95);

/* Theme toggle */
transform: scale(1.1);
```

**Loading Spinner**

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Skeleton Loading**

```css
@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

**Slide In (Notifications)**

```css
/* Start off-screen */
right: -400px;

/* Slide in */
transition: right 0.3s ease;
right: 20px;
```

---

## Accessibility

### ARIA Labels

**Interactive Elements**

```html
<button aria-label="Toggle dark mode" class="theme-toggle">
  <span id="themeIcon">🌙</span>
</button>

<input type="search" aria-label="Search reports" />
```

### Semantic HTML

**Proper Structure**

```html
<nav role="navigation">
  <a href="/" class="nav-link">Home</a>
</nav>

<main role="main">
  <article>
    <!-- Content -->
  </article>
</main>

<form role="form">
  <!-- Form fields -->
</form>
```

### Keyboard Navigation

**Focus Management**

- All interactive elements keyboard-accessible
- Tab order follows visual flow
- Focus visible with outline/border change
- Skip links for screen readers

**Focus States**

```css
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
```

### Color Contrast

**WCAG AA Compliance**

- Text contrast ratio: minimum 4.5:1
- Large text: minimum 3:1
- UI components: minimum 3:1

**High Contrast Examples**

```css
/* Good contrast */
.priority-high {
  background: #fee2e2; /* Light red */
  color: #dc2626; /* Dark red */
}

/* Error text on white */
.error {
  color: #c33; /* Dark red */
  background: #fee; /* Very light red */
}
```

### Screen Reader Support

**Descriptive Text**

```html
<span class="sr-only">Loading reports...</span>

<button>
  <span aria-hidden="true">×</span>
  <span class="sr-only">Close dialog</span>
</button>
```

**Live Regions**

```html
<div role="status" aria-live="polite" aria-atomic="true">
  <span id="resultsCount">42</span> reports found
</div>
```

### Form Accessibility

**Label Association**

```html
<label for="customerName">Customer Name</label>
<input type="text" id="customerName" name="customerName" required />
```

**Error Messages**

```html
<input
  type="email"
  id="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<span id="email-error" role="alert"> Please enter a valid email address </span>
```

**Required Fields**

```html
<label for="subject"> Subject <span aria-label="required">*</span> </label>
<input type="text" id="subject" required aria-required="true" />
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile-first approach */

/* Small devices (phones, 0-767px) */
/* Base styles */

/* Medium devices (tablets, 768px+) */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

/* Large devices (desktops, 1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

/* Extra large devices (large desktops, 1280px+) */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

### Mobile Optimizations

**Touch-Friendly Targets**

```css
@media (max-width: 768px) {
  /* Minimum 44px touch targets */
  input,
  select,
  button {
    font-size: 16px; /* Prevents zoom on iOS */
    min-height: 44px;
  }

  /* Stack forms vertically */
  .search-form {
    grid-template-columns: 1fr;
  }

  /* Full-width buttons */
  .btn {
    width: 100%;
  }
}
```

**Flexible Grids**

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

**Typography Scaling**

```css
/* Desktop */
h1 {
  font-size: 32px;
}
h2 {
  font-size: 24px;
}
p {
  font-size: 16px;
}

/* Mobile */
@media (max-width: 768px) {
  h1 {
    font-size: 24px;
  }
  h2 {
    font-size: 20px;
  }
  p {
    font-size: 14px;
  }
}
```

### Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### Responsive Images

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### Mobile Navigation

```css
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
```

### Conditional Rendering

**Hide on Mobile**

```css
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
```

**Show Only on Mobile**

```css
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
}
```

---

## User Flows

### 1. Create New Triage Report

**Steps:**

1. User lands on main dashboard (index.html)
2. (First visit) Sees onboarding tour
3. Fills triage form:
   - Customer Name
   - Ticket Subject
   - Issue Description
   - Customer Tone
4. Clicks "Analyze & Triage Ticket"
5. System processes:
   - Client-side triage analysis
   - Sentiment analysis
   - Auto-assignment
   - Database save
   - Email confirmation
   - Real-time broadcast
6. Views results:
   - Priority badge
   - Department routing
   - Response approach
   - Talking points
   - KB articles
7. Takes action:
   - View customer history
   - Browse all reports
   - Create new triage

**Success Criteria:**

- Report saved to database
- Notification shown
- Results clearly displayed
- Next actions obvious

---

### 2. Search Customer History

**Steps:**

1. User clicks "Client History" link
2. Arrives at client-history.html
3. Sees quick stats dashboard
4. Uses search filters:
   - Customer name search
   - Priority filter
   - Tone filter
   - Assigned CSR filter
5. Submits search
6. Views filtered results
7. Actions per report:
   - View details
   - View customer history
   - Select for export
8. (Optional) Export selected to CSV

**Success Criteria:**

- Search is fast (<1s)
- Results clearly organized
- Filters work correctly
- Export includes all selected

---

### 3. View Report Details

**Steps:**

1. User clicks report card or "View Details"
2. Arrives at report-detail.html?id={reportId}
3. Views comprehensive information:
   - Customer details
   - AI analysis
   - Talking points
   - KB articles
   - Case notes
4. Updates status (New → In Progress → Resolved)
5. Assigns to CSR
6. Adds case note
7. Exports to PDF (print)
8. Returns to client history

**Success Criteria:**

- All data loads correctly
- Status updates save
- Notes persist
- PDF export works

---

### 4. Browse Knowledge Base

**Steps:**

1. User clicks "Knowledge Base" link
2. Arrives at kb-search.html
3. Sees article grid
4. Uses search or category filter
5. Clicks article card
6. Modal opens with full article
7. Reads content
8. Closes modal
9. Continues browsing

**Success Criteria:**

- Search finds relevant articles
- Categories filter correctly
- Modal displays full content
- Easy to navigate

---

### 5. View Analytics

**Steps:**

1. User clicks "Analytics" or "Advanced Analytics"
2. Sees dashboard with charts
3. Reviews key metrics
4. (Advanced) Applies filters
5. (Advanced) Exports data
6. (Advanced) Downloads charts
7. Returns to main dashboard

**Success Criteria:**

- Charts render correctly
- Data is accurate
- Filters work
- Export downloads file

---

## Best Practices

### Code Organization

**Modular Structure**

- Separate concerns (HTML, CSS, JS)
- Reusable components
- Single responsibility principle
- DRY (Don't Repeat Yourself)

**File Naming**

- Kebab-case for files: `client-history.html`
- camelCase for JS variables/functions
- PascalCase for classes/components
- UPPERCASE for constants

### Performance

**Optimize Loading**

```javascript
// Lazy load heavy dependencies
const loadCharts = async () => {
  const Chart = await import('https://cdn.jsdelivr.net/npm/chart.js');
  renderCharts(Chart);
};
```

**Minimize Reflows**

```javascript
// Bad: Multiple reflows
element.style.width = '100px';
element.style.height = '100px';

// Good: Single reflow
element.style.cssText = 'width: 100px; height: 100px;';
```

**Debounce Search**

```javascript
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const handleSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

### Security

**Prevent XSS**

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Usage
element.innerHTML = `<p>${escapeHtml(userInput)}</p>`;
```

**Validate Input**

```javascript
// Client-side validation
if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  showError('Invalid email format');
  return;
}

// Sanitize before saving
const sanitized = input.trim().slice(0, 500);
```

**CSRF Protection**

```javascript
// All API calls include CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
});
```

### Error Handling

**Graceful Degradation**

```javascript
try {
  const result = await riskyOperation();
  displayResults(result);
} catch (error) {
  console.error('Operation failed:', error);
  showError('Something went wrong. Please try again.');

  // Fallback behavior
  displayCachedResults();
}
```

**User Feedback**

```javascript
// Always inform users
async function saveReport(data) {
  const notification = showNotification('Saving...', 'info', 999999);

  try {
    await api.save(data);
    notification.dismiss();
    showSuccess('Report saved successfully!');
  } catch (error) {
    notification.dismiss();
    showError(`Failed to save: ${error.message}`);
  }
}
```

### Accessibility

**Focus Management**

```javascript
function openModal(content) {
  modal.innerHTML = content;
  modal.style.display = 'block';

  // Trap focus in modal
  const firstFocusable = modal.querySelector('button, input');
  firstFocusable?.focus();

  // Return focus on close
  const previousFocus = document.activeElement;
  modal.onclose = () => previousFocus?.focus();
}
```

**Keyboard Support**

```javascript
element.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    element.click();
  }
});
```

### Testing

**Browser Compatibility**

- Test in Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Android)
- Progressive enhancement for older browsers

**Device Testing**

- Desktop (1920x1080, 1366x768)
- Tablet (768x1024, 1024x768)
- Mobile (375x667, 414x896)

**User Testing**

- First-time user experience
- Power user workflows
- Edge cases (long text, no data, errors)

---

## Conclusion

The INT Smart Triage AI 2.0 frontend provides a comprehensive, accessible, and performant interface for customer service ticket management. Built with modern web standards and progressive enhancement, it delivers a seamless experience across all devices and network conditions.

### Key Highlights

- **8 HTML pages** covering all major workflows
- **6 JavaScript modules** for modularity and reusability
- **PWA-ready** with offline support and installability
- **Fully responsive** from mobile to desktop
- **Accessible** with WCAG AA compliance
- **Theme support** for user preference
- **Real-time updates** via Supabase
- **Comprehensive analytics** with Chart.js visualizations

### Future Enhancements

- PDF export functionality (currently uses print)
- Advanced search with fuzzy matching
- Bulk actions (assign, status update)
- Customizable dashboard widgets
- Multi-language support
- Voice input for ticket creation
- Mobile app (React Native/Flutter)

---

**Document Version:** 1.0
**Last Updated:** October 16, 2025
**Maintained By:** INT Inc. Development Team
**Contact:** dev@int-inc.com
