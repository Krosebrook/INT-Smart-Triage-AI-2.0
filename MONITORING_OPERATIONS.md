# Monitoring & Operations Guide
# INT Smart Triage AI 2.0

**Document Version:** 1.0  
**Last Updated:** January 15, 2024  
**Classification:** Internal - Operational  
**Maintained By:** DevOps & Engineering Team

---

## Table of Contents
1. [Overview](#overview)
2. [Health Monitoring](#health-monitoring)
3. [Performance Monitoring](#performance-monitoring)
4. [Security Monitoring](#security-monitoring)
5. [Alerting Configuration](#alerting-configuration)
6. [Operational Runbooks](#operational-runbooks)
7. [Backup & Recovery](#backup--recovery)
8. [Maintenance Procedures](#maintenance-procedures)

---

## 1. Overview

### Monitoring Philosophy
- **Proactive Detection**: Identify issues before users are impacted
- **Comprehensive Coverage**: Monitor all critical system components
- **Actionable Alerts**: Every alert should require action
- **Historical Tracking**: Maintain metrics for trend analysis

### Key Metrics
1. **Availability**: Uptime percentage (Target: 99.9%)
2. **Performance**: API response times (Target: <500ms p95)
3. **Reliability**: Error rate (Target: <0.1%)
4. **Security**: RLS enforcement, failed auth attempts

---

## 2. Health Monitoring

### 2.1 Endpoint Health Checks

#### Health Check Endpoint
**URL:** `https://your-app.vercel.app/api/health-check`  
**Method:** GET  
**Expected Response Time:** <100ms (cached), <500ms (uncached)  
**Check Frequency:** Every 60 seconds

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "rls": "enabled"
  },
  "security": "RLS properly enforced"
}
```

**Alert Conditions:**
- Status is not "healthy" → P1 Alert
- Response time >1s → P2 Alert
- RLS is not "enabled" → P0 Security Alert
- 3 consecutive failures → P0 Alert

**Implementation (UptimeRobot):**
```
Monitor Type: HTTP(s)
URL: https://your-app.vercel.app/api/health-check
Monitoring Interval: 60 seconds
Alert When: 
  - Keyword not found: "healthy"
  - Response time > 1000ms
  - HTTP status ≠ 200
Alert Contacts: [on-call email, Slack webhook]
```

#### Triage Endpoint Health
**URL:** `https://your-app.vercel.app/api/triage-report`  
**Method:** POST  
**Check Frequency:** Every 5 minutes

**Synthetic Test Request:**
```json
{
  "customerName": "Health Check Test",
  "ticketSubject": "Automated health check",
  "issueDescription": "This is an automated health check test request",
  "customerTone": "calm",
  "csrAgent": "HEALTH_CHECK_BOT"
}
```

**Expected Response:**
- HTTP 200 status
- Response contains "success": true
- Response contains "reportId"
- Response time <1000ms

**Alert Conditions:**
- HTTP status ≠ 200 → P0 Alert
- Response missing required fields → P1 Alert
- Response time >2s → P2 Alert

---

### 2.2 Infrastructure Health

#### Vercel Platform
**Monitor:**
- Deployment status
- Function execution count
- Function error rate
- Cold start frequency

**Dashboard:** https://vercel.com/dashboard

**Automated Checks:**
```bash
# Check deployment status
vercel list --json | jq '.[] | select(.state != "READY")'

# Check function invocations (last hour)
# Access via Vercel Dashboard > Analytics
```

**Alert Conditions:**
- Deployment failed → P1 Alert
- Function error rate >1% → P1 Alert
- No successful deployments in 24h → P2 Alert

#### Supabase Database
**Monitor:**
- Database CPU usage
- Database memory usage
- Connection count
- Query performance
- Storage usage

**Dashboard:** https://app.supabase.com/project/[project-id]

**SQL Monitoring Queries:**
```sql
-- Connection count
SELECT COUNT(*) as connections FROM pg_stat_activity;
-- Alert if >80 (80% of 100 connection limit)

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));
-- Alert if >900MB (90% of 1GB free tier)

-- Slow queries (>1s)
SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Alert Conditions:**
- CPU usage >80% for 5min → P1 Alert
- Memory usage >80% → P1 Alert
- Connection count >80 → P2 Alert
- Storage >900MB → P2 Alert

---

### 2.3 External Service Monitoring

#### Vercel Status
**URL:** https://www.vercel-status.com/  
**Check Frequency:** Manual (subscribe to updates)

**Alert:** Email notification when Vercel reports incidents

#### Supabase Status
**URL:** https://status.supabase.com/  
**Check Frequency:** Manual (subscribe to updates)

**Alert:** Email notification when Supabase reports incidents

---

## 3. Performance Monitoring

### 3.1 Response Time Monitoring

#### Target Metrics
| Endpoint | p50 | p95 | p99 | Max |
|----------|-----|-----|-----|-----|
| /api/health-check | <50ms | <120ms | <200ms | <500ms |
| /api/triage-report | <250ms | <500ms | <750ms | <1000ms |

#### Vercel Analytics
**Access:** Vercel Dashboard > Analytics

**Metrics to Monitor:**
- Average response time
- p95 response time
- p99 response time
- Requests per minute
- Error rate

**Alert Conditions:**
- p95 >1s for 5 minutes → P2 Alert
- p99 >2s for 5 minutes → P2 Alert
- Sudden spike in response time (>2x baseline) → P2 Alert

#### Custom Performance Logging
**Implementation in API functions:**
```javascript
// Add to api/triage-report.js
const startTime = Date.now();

// ... processing ...

const duration = Date.now() - startTime;
console.log(JSON.stringify({
  metric: 'api.triage.duration',
  value: duration,
  timestamp: new Date().toISOString(),
  reportId: reportId
}));

// Alert if duration > 1000ms
if (duration > 1000) {
  console.warn(`Slow request: ${duration}ms for report ${reportId}`);
}
```

---

### 3.2 Database Performance

#### Query Performance
**Monitor:**
- Average query execution time
- Slow queries (>100ms)
- Query count per second
- Index usage

**Monitoring Queries:**
```sql
-- Top 10 slowest queries
SELECT 
    substring(query, 1, 100) as query_snippet,
    calls,
    round(total_exec_time::numeric, 2) as total_time_ms,
    round(mean_exec_time::numeric, 2) as avg_time_ms,
    round(max_exec_time::numeric, 2) as max_time_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index hit rate (should be >99%)
SELECT 
    sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100 
    as index_hit_rate
FROM pg_statio_user_indexes;

-- Table bloat
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup::numeric / nullif(n_live_tup, 0) * 100, 2) as dead_tuple_percent
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY dead_tuple_percent DESC;
```

**Alert Conditions:**
- Average query time >100ms → P2 Alert
- Index hit rate <95% → P2 Alert
- Dead tuple percentage >20% → P3 Alert (run VACUUM)

---

### 3.3 Capacity Monitoring

#### API Request Volume
**Monitor:**
- Requests per minute
- Requests per hour
- Daily request count
- Peak hour traffic

**Thresholds:**
- Normal: 0-10 req/min
- Elevated: 10-50 req/min
- High: 50-100 req/min
- Critical: >100 req/min

**Alert Conditions:**
- Sustained traffic >100 req/min → P2 Alert (capacity review)
- Sudden spike (>10x baseline) → P1 Alert (possible attack)

#### Storage Growth
**Monitor:**
- Database size
- Table row count
- Storage growth rate

**Queries:**
```sql
-- Current database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as size;

-- Table size and row count
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename = 'reports';

-- Daily growth estimate
SELECT 
    COUNT(*) as reports_today,
    round(avg(octet_length(issue_description::text))) as avg_description_size,
    pg_size_pretty(
        COUNT(*) * avg(octet_length(issue_description::text))::bigint
    ) as estimated_daily_growth
FROM reports
WHERE created_at > CURRENT_DATE;
```

**Alert Conditions:**
- Database size >900MB → P2 Alert (approaching 1GB free tier limit)
- Growth rate >100MB/day → P2 Alert (capacity planning needed)

---

## 4. Security Monitoring

### 4.1 RLS Enforcement Monitoring

#### Continuous RLS Verification
**Frequency:** Every health check (60 seconds)

**Verification via Health Check:**
```javascript
// In api/health-check.js (already implemented)
const { data, error } = await supabase
    .from('reports')
    .select('count', { count: 'exact', head: true });

if (error && error.message.includes('RLS')) {
    healthData.checks.rls = 'enforced'; // Good!
} else {
    healthData.checks.rls = 'needs_verification'; // Investigate
}
```

**Alert Conditions:**
- RLS status not "enforced" or "enabled" → P0 Security Alert
- RLS policies missing → P0 Security Alert

**Manual Verification:**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';
-- Should return rowsecurity = true

-- Verify policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'reports';
-- Should return 2 policies
```

---

### 4.2 Access Pattern Monitoring

#### Suspicious Activity Detection
**Monitor:**
- Unusual request volumes from single IP
- Requests outside business hours
- Failed authentication attempts
- Unusual geographic patterns

**Queries:**
```sql
-- Top IPs by request count (last hour)
SELECT 
    ip_address,
    COUNT(*) as request_count,
    COUNT(DISTINCT csr_agent) as unique_agents,
    MIN(created_at) as first_request,
    MAX(created_at) as last_request
FROM reports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY request_count DESC
LIMIT 20;

-- Requests outside business hours (9am-6pm ET)
SELECT 
    COUNT(*) as after_hours_requests,
    COUNT(DISTINCT ip_address) as unique_ips
FROM reports
WHERE 
    created_at > NOW() - INTERVAL '24 hours'
    AND EXTRACT(hour FROM created_at AT TIME ZONE 'America/New_York') NOT BETWEEN 9 AND 18;

-- Unusual patterns
SELECT 
    csr_agent,
    COUNT(*) as request_count,
    COUNT(DISTINCT customer_name) as unique_customers,
    AVG(confidence_score) as avg_confidence
FROM reports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY csr_agent
HAVING COUNT(*) > 50  -- More than 50 requests/hour from one agent
ORDER BY request_count DESC;
```

**Alert Conditions:**
- >100 requests/hour from single IP → P1 Alert (possible abuse)
- >50% of requests outside business hours → P2 Alert (investigate)
- Same customer name repeated >10 times → P2 Alert (data quality issue)

---

### 4.3 Error Rate Monitoring

#### Application Errors
**Monitor:**
- HTTP 4xx rate (client errors)
- HTTP 5xx rate (server errors)
- Validation errors
- Database errors

**Target Error Rates:**
- HTTP 4xx: <1% (user input issues)
- HTTP 5xx: <0.1% (system issues)

**Vercel Error Tracking:**
```bash
# View recent errors
vercel logs --filter error --since 1h

# Count errors by type
vercel logs --json --since 1h | jq -r '.level' | sort | uniq -c
```

**Alert Conditions:**
- HTTP 5xx rate >0.5% for 5min → P1 Alert
- HTTP 5xx rate >1% → P0 Alert
- Error spike (>10x baseline) → P1 Alert

---

### 4.4 Security Event Logging

#### Audit Log Review
**Frequency:** Weekly

**Review Checklist:**
- [ ] No unauthorized database access attempts
- [ ] No RLS policy changes
- [ ] No environment variable changes
- [ ] No unexpected deployments
- [ ] No suspicious access patterns

**Audit Queries:**
```sql
-- Review all activity from last week
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT csr_agent) as unique_agents,
    AVG(confidence_score) as avg_confidence
FROM reports
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Identify potential data quality issues
SELECT 
    customer_name,
    COUNT(*) as occurrence_count
FROM reports
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY customer_name
HAVING COUNT(*) > 10
ORDER BY occurrence_count DESC;
```

---

## 5. Alerting Configuration

### 5.1 Alert Routing

#### Alert Channels
1. **PagerDuty / Opsgenie** - P0/P1 alerts
2. **Slack** - All alerts + status updates
3. **Email** - Digest of P2/P3 alerts
4. **SMS** - P0 alerts only

#### Alert Matrix

| Condition | Severity | Channel | Response Time |
|-----------|----------|---------|---------------|
| Complete API outage | P0 | PagerDuty + Slack + SMS | 15 minutes |
| RLS disabled/bypassed | P0 | PagerDuty + Slack + SMS | 15 minutes |
| Credential compromise | P0 | PagerDuty + Slack + SMS | 15 minutes |
| Triage endpoint down | P1 | PagerDuty + Slack | 1 hour |
| Database degraded | P1 | PagerDuty + Slack | 1 hour |
| Error rate spike | P1 | PagerDuty + Slack | 1 hour |
| Slow response times | P2 | Slack | 4 hours |
| High resource usage | P2 | Slack + Email | 4 hours |
| Storage approaching limit | P2 | Slack + Email | 4 hours |
| Documentation outdated | P3 | Email | Next business day |

---

### 5.2 Alert Configuration Examples

#### UptimeRobot Configuration
```yaml
Monitor: Health Check Endpoint
Type: HTTP(s)
URL: https://your-app.vercel.app/api/health-check
Interval: 60 seconds
Timeout: 30 seconds
Keyword: "healthy"
Alert When:
  - Down (keyword not found)
  - Response time > 1000ms
Notifications:
  - Email: oncall@yourcompany.com
  - Slack: webhook_url
  - SMS: +1-xxx-xxx-xxxx (P0 only)
```

#### Slack Webhook Alert
```javascript
// Example alert function
async function sendSlackAlert(severity, message) {
  const webhook_url = process.env.SLACK_WEBHOOK_URL;
  const color = severity === 'P0' ? '#ff0000' : 
                severity === 'P1' ? '#ff9900' : '#ffcc00';
  
  await fetch(webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color: color,
        title: `${severity} Alert: INT Smart Triage AI`,
        text: message,
        footer: 'Monitoring System',
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  });
}
```

---

### 5.3 Alert Escalation

#### Escalation Timeline
```
0 min: Alert triggered
    ↓
5 min: Oncall engineer notified (PagerDuty)
    ↓
15 min: If not acknowledged, escalate to secondary oncall
    ↓
30 min: If not resolved, escalate to engineering manager
    ↓
1 hour: If P0 not resolved, escalate to CTO
```

#### Auto-escalation Configuration
```yaml
PagerDuty Escalation Policy:
  Level 1: Primary On-Call (5 min)
  Level 2: Secondary On-Call (15 min)
  Level 3: Engineering Manager (30 min)
  Level 4: CTO (1 hour, P0 only)
```

---

## 6. Operational Runbooks

### 6.1 Daily Operations Checklist

#### Morning Checks (10 minutes)
- [ ] Review overnight alerts
- [ ] Check Vercel deployment status
- [ ] Verify health check passing
- [ ] Review error logs (>0 errors?)
- [ ] Check database performance metrics
- [ ] Review yesterday's usage stats

#### Weekly Checks (30 minutes)
- [ ] Review performance trends
- [ ] Check storage growth
- [ ] Review security audit logs
- [ ] Verify backup completion
- [ ] Check dependency updates
- [ ] Review monitoring alert accuracy

#### Monthly Checks (1 hour)
- [ ] Capacity planning review
- [ ] Security audit
- [ ] RLS policy verification
- [ ] Documentation review
- [ ] Incident post-mortem review
- [ ] Update runbooks

---

### 6.2 Common Maintenance Tasks

#### Rotate Credentials (Every 90 days)
```bash
# 1. Generate new Supabase service role key
# Via Supabase Dashboard: Settings > API > Rotate Service Role Key

# 2. Update Vercel environment variable
vercel env rm SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 3. Redeploy
vercel --prod

# 4. Verify health check
curl https://your-app.vercel.app/api/health-check | jq

# 5. Revoke old key in Supabase
```

#### Update Dependencies
```bash
# 1. Check for updates
npm outdated

# 2. Review security vulnerabilities
npm audit

# 3. Update dependencies
npm update

# 4. Test locally
npm test
vercel dev

# 5. Deploy to preview
vercel

# 6. Test preview deployment
curl https://[preview-url]/api/health-check

# 7. Deploy to production
vercel --prod
```

#### Database Maintenance (Monthly)
```sql
-- 1. Vacuum to reclaim space
VACUUM ANALYZE reports;

-- 2. Reindex for performance
REINDEX TABLE reports;

-- 3. Update statistics
ANALYZE reports;

-- 4. Check fragmentation
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as external_size
FROM pg_stat_user_tables
WHERE tablename = 'reports';
```

---

## 7. Backup & Recovery

### 7.1 Backup Strategy

#### Supabase Automated Backups
**Configuration:**
- Frequency: Daily (midnight UTC)
- Retention: 7 days (free tier) or 30 days (pro tier)
- Type: Full database backup
- Storage: Supabase managed

**Enable Backups:**
1. Go to Supabase Dashboard
2. Navigate to Settings > Backup
3. Enable automated backups
4. Configure retention period

#### Manual Backup
```bash
# Export database schema
pg_dump -h [supabase-host] \
        -U postgres \
        -d postgres \
        --schema-only \
        > schema-backup-$(date +%Y%m%d).sql

# Export data
pg_dump -h [supabase-host] \
        -U postgres \
        -d postgres \
        --data-only \
        --table=reports \
        > data-backup-$(date +%Y%m%d).sql
```

#### Code Backup
**Strategy:** Git-based (already implemented)
- All code in GitHub repository
- Git tags for releases
- Branch protection on main

---

### 7.2 Recovery Procedures

#### Database Recovery
**RPO (Recovery Point Objective):** 24 hours  
**RTO (Recovery Time Objective):** 4 hours

**Procedure:**
1. **Assess Damage**
   ```sql
   -- Check affected records
   SELECT COUNT(*) FROM reports 
   WHERE created_at > '2024-01-15 10:00:00';
   ```

2. **Restore from Backup**
   ```
   Via Supabase Dashboard:
   1. Go to Settings > Backup
   2. Select backup date
   3. Click "Restore"
   4. Confirm restoration
   ```

3. **Verify Restoration**
   ```sql
   -- Verify record count
   SELECT COUNT(*) FROM reports;
   
   -- Verify data integrity
   SELECT * FROM reports ORDER BY created_at DESC LIMIT 10;
   
   -- Verify RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'reports';
   ```

4. **Test Application**
   ```bash
   # Test health check
   curl https://your-app.vercel.app/api/health-check
   
   # Test triage endpoint
   curl -X POST https://your-app.vercel.app/api/triage-report \
     -H "Content-Type: application/json" \
     -d '{"customerName":"Test","ticketSubject":"Test","issueDescription":"Test","customerTone":"calm"}'
   ```

#### Deployment Recovery
**RTO:** 5 minutes

**Procedure:**
```bash
# 1. Identify last known good deployment
vercel list

# 2. Rollback
vercel rollback [deployment-url]

# 3. Verify
curl https://your-app.vercel.app/api/health-check
```

---

### 7.3 Disaster Recovery Testing

#### Quarterly DR Test
**Schedule:** Last Friday of each quarter

**Test Procedure:**
1. [ ] Identify test backup date
2. [ ] Create test database instance
3. [ ] Restore backup to test instance
4. [ ] Configure test environment
5. [ ] Run functional tests
6. [ ] Measure restoration time
7. [ ] Document findings
8. [ ] Update DR procedures if needed

**Success Criteria:**
- Backup restores successfully
- RLS policies intact
- All data recoverable
- Application functional
- RTO met (<4 hours)

---

## 8. Maintenance Procedures

### 8.1 Planned Maintenance

#### Maintenance Window
**Schedule:** 
- First Sunday of each month
- 2:00 AM - 6:00 AM UTC
- Expected duration: 1-2 hours

**Notification:**
- 7 days advance notice
- Status page update
- Email to stakeholders

**Maintenance Tasks:**
- Dependency updates
- Database optimization
- Performance tuning
- Security patches

#### Maintenance Checklist
```markdown
## Pre-Maintenance (1 week before)
- [ ] Schedule maintenance window
- [ ] Notify stakeholders
- [ ] Update status page
- [ ] Prepare rollback plan
- [ ] Create backup

## During Maintenance
- [ ] Set status page to "Maintenance"
- [ ] Run updates
- [ ] Run database maintenance
- [ ] Test functionality
- [ ] Monitor for issues

## Post-Maintenance
- [ ] Verify all systems operational
- [ ] Update status page to "Operational"
- [ ] Monitor for 24 hours
- [ ] Document any issues
- [ ] Send completion notice
```

---

### 8.2 Emergency Maintenance

#### When to Perform Emergency Maintenance
- Critical security vulnerability
- Data loss risk
- Complete service outage
- Regulatory compliance issue

#### Emergency Maintenance Procedure
1. **Assessment (0-15 min)**
   - Determine criticality
   - Identify affected systems
   - Estimate duration

2. **Notification (15-30 min)**
   - Post to status page
   - Email stakeholders
   - Slack notification

3. **Implementation (30 min - 4 hours)**
   - Apply fix
   - Test changes
   - Monitor stability

4. **Recovery (variable)**
   - Resume normal operations
   - Update status page
   - Post-mortem within 48 hours

---

### 8.3 Capacity Management

#### Capacity Planning Process
**Frequency:** Quarterly

**Metrics to Review:**
- Average daily request volume
- Peak request rate
- Database size growth
- Storage projections
- Cost trends

**Capacity Planning Template:**
```markdown
## Q1 2024 Capacity Review

### Current Usage
- Average requests/day: [number]
- Peak requests/minute: [number]
- Database size: [size]
- Vercel function invocations: [number]

### Growth Trends
- Request volume growth: [%] per month
- Storage growth: [MB] per month
- User growth: [%] per month

### Projections (Next 6 Months)
- Expected requests/day: [number]
- Expected peak rate: [number]
- Expected database size: [size]

### Recommendations
- [ ] Upgrade Supabase plan (if >900MB)
- [ ] Implement rate limiting
- [ ] Add caching layer
- [ ] Archive old data
- [ ] Optimize queries

### Budget Impact
- Current monthly cost: $[amount]
- Projected monthly cost: $[amount]
- Upgrade costs: $[amount]
```

---

## Appendix: Quick Reference

### Important URLs
- Health Check: https://your-app.vercel.app/api/health-check
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- GitHub Repository: https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0
- Status Page: [TBD]

### Emergency Contacts
- On-Call: [Phone]
- Engineering Lead: [Phone]
- Security Team: [Phone]
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io

### Quick Commands
```bash
# Health check
curl https://your-app.vercel.app/api/health-check | jq

# View logs
vercel logs --follow

# Rollback
vercel rollback [url]

# Run tests
npm test

# Check deployments
vercel list
```

---

**Document Maintained By:** DevOps & Engineering Team  
**Review Schedule:** Quarterly  
**Last Reviewed:** January 15, 2024  
**Next Review:** April 15, 2024
