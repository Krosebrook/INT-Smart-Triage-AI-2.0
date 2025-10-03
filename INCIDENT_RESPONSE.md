# Incident Response Playbook
# INT Smart Triage AI 2.0

**Document Version:** 1.0  
**Last Updated:** January 15, 2024  
**Classification:** Internal - Critical  
**On-Call Contact:** See Section 8

---

## Table of Contents
1. [Overview](#overview)
2. [Incident Classification](#incident-classification)
3. [Response Team Structure](#response-team-structure)
4. [Incident Response Process](#incident-response-process)
5. [Common Incident Scenarios](#common-incident-scenarios)
6. [Communication Protocols](#communication-protocols)
7. [Post-Incident Activities](#post-incident-activities)
8. [Contact Information](#contact-information)

---

## 1. Overview

### Purpose
This playbook provides step-by-step procedures for responding to security incidents, service outages, and other critical issues affecting the INT Smart Triage AI 2.0 system.

### Scope
- Security incidents (data breaches, unauthorized access)
- Service outages (API unavailability, database issues)
- Performance degradation
- Data integrity issues
- Compliance violations

### Goals
- **Contain** the incident quickly
- **Eradicate** the root cause
- **Recover** normal operations
- **Document** lessons learned
- **Prevent** future occurrences

---

## 2. Incident Classification

### Severity Levels

#### P0 - Critical (15-minute response)
**Impact:** Complete service outage OR active security breach

**Examples:**
- All API endpoints returning 500 errors
- Database completely unavailable
- Active data breach or RLS bypass
- Credential compromise confirmed
- Malicious code injection detected

**Response:** Immediate page on-call engineer

**Communication:** Incident commander, executive team

---

#### P1 - High (1-hour response)
**Impact:** Major functionality impaired OR potential security issue

**Examples:**
- Triage endpoint down (health check OK)
- Database performance severely degraded (>5s response)
- RLS misconfiguration detected
- Suspicious access patterns detected
- Failed deployment blocking releases

**Response:** On-call engineer notification

**Communication:** Engineering team, management

---

#### P2 - Medium (4-hour response)
**Impact:** Minor functionality impaired OR non-critical security concern

**Examples:**
- Slow API response times (1-3s)
- Health check cache issues
- Intermittent database connectivity
- Non-critical security header missing
- Error rate spike (<5%)

**Response:** Create ticket, assign to on-call

**Communication:** Engineering team

---

#### P3 - Low (Next business day)
**Impact:** Minimal user impact OR informational security issue

**Examples:**
- Documentation outdated
- Non-critical dependency vulnerability
- UI cosmetic issues
- Warning in logs
- Feature request

**Response:** Create ticket, prioritize in backlog

**Communication:** Engineering team (optional)

---

## 3. Response Team Structure

### Roles and Responsibilities

#### Incident Commander (IC)
**Responsibilities:**
- Overall incident coordination
- Decision-making authority
- Communication with stakeholders
- Declare incident resolved

**Who:** On-call engineer or engineering lead

---

#### Technical Lead
**Responsibilities:**
- Technical investigation
- Implement fixes
- Coordinate with other engineers
- Document technical details

**Who:** Senior engineer or architect

---

#### Communications Lead
**Responsibilities:**
- Internal communication
- Stakeholder updates
- Status page updates
- Customer communication (if needed)

**Who:** Product manager or engineering manager

---

#### Security Lead (for security incidents)
**Responsibilities:**
- Security assessment
- Forensic analysis
- Compliance notification
- Security remediation

**Who:** Security engineer or CISO

---

## 4. Incident Response Process

### Phase 1: Detection and Triage (0-5 minutes)

#### Step 1: Incident Detection
**How incidents are detected:**
- Monitoring alerts (UptimeRobot, Vercel, Supabase)
- User reports (CSR tickets)
- Error logs (Vercel logs, Supabase logs)
- Health check failures
- Security alerts

#### Step 2: Initial Assessment
**Questions to answer:**
- What is the impact? (P0/P1/P2/P3)
- How many users affected?
- What functionality is impaired?
- Is this a security issue?
- When did it start?

#### Step 3: Declare Incident
**Actions:**
- [ ] Create incident ticket (GitHub Issue)
- [ ] Assign severity level
- [ ] Page appropriate responders
- [ ] Create incident Slack channel (#incident-YYYY-MM-DD-N)
- [ ] Start incident timeline documentation

**Template:**
```
INCIDENT: [Brief description]
SEVERITY: P0/P1/P2/P3
START TIME: [timestamp]
IMPACT: [user impact description]
SYSTEMS AFFECTED: [list systems]
INCIDENT COMMANDER: [name]
```

---

### Phase 2: Containment (5-30 minutes)

#### Step 1: Prevent Further Damage
**For Security Incidents:**
- [ ] Rotate compromised credentials immediately
- [ ] Block malicious IP addresses
- [ ] Disable compromised user accounts
- [ ] Enable additional logging

**For Service Outages:**
- [ ] Rollback to last known good deployment
- [ ] Scale resources if needed
- [ ] Enable maintenance mode if necessary

#### Step 2: Preserve Evidence
**Actions:**
- [ ] Export relevant logs (download, don't delete)
- [ ] Take screenshots of errors
- [ ] Document system state
- [ ] Capture database query snapshots
- [ ] Save Vercel deployment information

**Log Collection Commands:**
```bash
# Export Vercel logs
vercel logs [deployment-url] > incident-logs.txt

# Export recent Supabase logs (via dashboard)
# 1. Navigate to Supabase dashboard
# 2. Logs > Download CSV

# Check git history
git log --oneline -20
git show [commit-hash]
```

#### Step 3: Assess Scope
**Questions:**
- How many requests affected?
- What data potentially compromised?
- Which users impacted?
- What time range?

---

### Phase 3: Investigation (30 minutes - 2 hours)

#### Step 1: Root Cause Analysis
**Systematic Investigation:**

1. **Check Recent Changes**
   ```bash
   # Review recent deployments
   vercel list
   
   # Check recent commits
   git log --since="24 hours ago" --oneline
   
   # Compare current vs previous deployment
   vercel inspect [deployment-url]
   ```

2. **Examine Logs**
   ```bash
   # Vercel function logs
   vercel logs --follow
   
   # Check for error patterns
   grep -i "error" incident-logs.txt | sort | uniq -c
   
   # Check for specific endpoints
   grep "/api/triage-report" incident-logs.txt
   ```

3. **Database Investigation**
   ```sql
   -- Check database health
   SELECT 
       schemaname,
       tablename,
       n_live_tup as row_count,
       n_tup_ins as inserts,
       n_tup_upd as updates
   FROM pg_stat_user_tables
   WHERE tablename = 'reports';
   
   -- Check recent report activity
   SELECT 
       COUNT(*) as total,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour
   FROM reports;
   
   -- Check for suspicious patterns
   SELECT 
       ip_address,
       COUNT(*) as request_count
   FROM reports
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY ip_address
   ORDER BY request_count DESC
   LIMIT 10;
   ```

4. **Performance Analysis**
   ```sql
   -- Slow queries
   SELECT query, calls, mean_exec_time, max_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

#### Step 2: Identify Root Cause
**Common Root Causes:**
- Code bug in recent deployment
- Database connection pool exhausted
- RLS policy misconfiguration
- Environment variable misconfiguration
- Supabase service degradation
- Vercel function timeout
- Dependency vulnerability
- DDoS attack

#### Step 3: Document Findings
**Actions:**
- [ ] Update incident ticket with findings
- [ ] Create timeline of events
- [ ] Identify contributing factors
- [ ] Document affected systems

---

### Phase 4: Recovery (1-4 hours)

#### Step 1: Implement Fix

**For Code Issues:**
```bash
# Revert to previous deployment
vercel rollback [previous-deployment-url]

# OR deploy hotfix
git checkout -b hotfix/incident-YYYY-MM-DD
# Make fixes
git commit -m "Hotfix: [description]"
git push origin hotfix/incident-YYYY-MM-DD
vercel --prod
```

**For Configuration Issues:**
```bash
# Update environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redeploy
vercel --prod
```

**For Database Issues:**
```sql
-- Re-enable RLS if disabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Recreate policies if missing
CREATE POLICY "Deny all public access" ON reports
    FOR ALL TO public USING (false) WITH CHECK (false);

CREATE POLICY "Allow service role access" ON reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### Step 2: Verify Fix
**Verification Checklist:**
- [ ] Health check returns 200 OK
- [ ] Triage endpoint processes test request successfully
- [ ] RLS status confirmed in health check response
- [ ] Error rate returned to baseline (<0.1%)
- [ ] Response times normal (<500ms p95)
- [ ] Database queries completing successfully

**Test Commands:**
```bash
# Health check
curl -X GET https://your-app.vercel.app/api/health-check

# Triage test
curl -X POST https://your-app.vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "ticketSubject": "Test Issue",
    "issueDescription": "Testing incident recovery",
    "customerTone": "calm",
    "csrAgent": "INCIDENT_TEST"
  }'
```

#### Step 3: Restore Service
**Actions:**
- [ ] Remove maintenance mode (if enabled)
- [ ] Monitor error rates for 30 minutes
- [ ] Confirm no regression
- [ ] Update status page

---

### Phase 5: Recovery Validation (1-2 hours post-fix)

#### Monitoring Checklist
- [ ] Error rate < 0.1% for 1 hour
- [ ] Response times < 500ms p95
- [ ] No failed health checks
- [ ] Database performance normal
- [ ] No new security alerts
- [ ] User reports resolved

#### Declare Incident Resolved
**Criteria:**
- Root cause identified and fixed
- Service operating normally for 1+ hours
- No ongoing user impact
- Monitoring confirms stability

**Actions:**
- [ ] Update incident ticket status to "Resolved"
- [ ] Post resolution message in incident channel
- [ ] Notify stakeholders
- [ ] Schedule post-mortem meeting

---

## 5. Common Incident Scenarios

### Scenario 1: Complete API Outage

**Symptoms:**
- All API endpoints returning 500 errors
- Health check failing
- CSRs unable to submit tickets

**Severity:** P0

**Likely Causes:**
1. Vercel deployment failure
2. Supabase complete outage
3. Environment variables missing
4. Code bug causing crash

**Response Procedure:**

1. **Immediate Actions (0-5 min)**
   ```bash
   # Check Vercel status
   vercel list
   
   # Check most recent deployment logs
   vercel logs --follow
   
   # Check Supabase status
   # Visit: https://status.supabase.com
   ```

2. **Rollback (5-10 min)**
   ```bash
   # Identify last working deployment
   vercel list
   
   # Rollback
   vercel rollback [previous-deployment-url]
   ```

3. **Verify Recovery (10-15 min)**
   ```bash
   # Test health check
   curl https://your-app.vercel.app/api/health-check
   
   # Test triage endpoint
   curl -X POST https://your-app.vercel.app/api/triage-report \
     -H "Content-Type: application/json" \
     -d '{"customerName":"Test","ticketSubject":"Test","issueDescription":"Test","customerTone":"calm"}'
   ```

4. **Investigate Root Cause (parallel)**
   - Review code changes
   - Check environment variables
   - Examine error logs

---

### Scenario 2: RLS Bypass Detected

**Symptoms:**
- Public role able to access reports table
- Health check shows RLS disabled or misconfigured
- Security monitoring alert

**Severity:** P0 (Security Incident)

**Response Procedure:**

1. **Immediate Containment (0-2 min)**
   ```sql
   -- Immediately disable table access
   REVOKE ALL ON reports FROM public;
   
   -- Verify RLS enabled
   ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
   ```

2. **Assess Damage (2-10 min)**
   ```sql
   -- Check for unauthorized access in logs
   SELECT 
       ip_address,
       user_agent,
       COUNT(*) as access_count,
       MIN(created_at) as first_access,
       MAX(created_at) as last_access
   FROM reports
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY ip_address, user_agent
   ORDER BY access_count DESC;
   ```

3. **Restore Security (10-15 min)**
   ```sql
   -- Recreate deny-all policy
   DROP POLICY IF EXISTS "Deny all public access" ON reports;
   CREATE POLICY "Deny all public access" ON reports
       FOR ALL TO public USING (false) WITH CHECK (false);
   
   -- Verify service role policy exists
   SELECT * FROM pg_policies WHERE tablename = 'reports';
   ```

4. **Forensic Analysis (parallel)**
   - Export all access logs
   - Identify if data was exfiltrated
   - Document timeline
   - Notify security team

5. **Notification Requirements**
   - Internal: Security team, legal, executive team
   - External: May require customer notification (consult legal)
   - Regulatory: May require breach notification (GDPR, CCPA)

---

### Scenario 3: Database Performance Degradation

**Symptoms:**
- API response times >3 seconds
- Triage endpoint timing out
- Database connection errors

**Severity:** P1

**Response Procedure:**

1. **Check Database Metrics (0-5 min)**
   ```sql
   -- Check connection count
   SELECT COUNT(*) FROM pg_stat_activity;
   
   -- Check slow queries
   SELECT 
       query,
       state,
       wait_event_type,
       wait_event
   FROM pg_stat_activity
   WHERE state != 'idle'
   AND query NOT LIKE '%pg_stat_activity%';
   ```

2. **Identify Bottleneck (5-15 min)**
   ```sql
   -- Check table size
   SELECT 
       pg_size_pretty(pg_total_relation_size('reports')) as total_size,
       COUNT(*) as row_count
   FROM reports;
   
   -- Check missing indexes
   SELECT 
       schemaname,
       tablename,
       indexname
   FROM pg_indexes
   WHERE tablename = 'reports';
   ```

3. **Immediate Relief (15-30 min)**
   - Scale Supabase instance (if needed)
   - Terminate long-running queries
   - Clear connection pool
   - Add missing indexes

4. **Long-term Fix (parallel)**
   - Implement query optimization
   - Add data archival strategy
   - Implement read replicas (if needed)

---

### Scenario 4: Credential Compromise

**Symptoms:**
- Service role key detected in logs
- Unauthorized GitHub access
- Environment variable exposed

**Severity:** P0 (Security Incident)

**Response Procedure:**

1. **Immediate Rotation (0-5 min)**
   ```bash
   # Generate new Supabase service role key
   # 1. Go to Supabase dashboard
   # 2. Settings > API > Service Role Key > Rotate
   
   # Update Vercel environment variable
   vercel env rm SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   
   # Redeploy
   vercel --prod
   ```

2. **Revoke Compromised Key (5-10 min)**
   - Disable old service role key in Supabase
   - Verify new deployment using new key
   - Check for unauthorized database access

3. **Forensic Analysis (10-60 min)**
   ```sql
   -- Check for suspicious activity
   SELECT 
       created_at,
       ip_address,
       user_agent,
       csr_agent,
       customer_name
   FROM reports
   WHERE created_at > [compromise_time]
   ORDER BY created_at;
   ```

4. **Notification**
   - Security team
   - Affected users (if data accessed)
   - Regulatory bodies (if required)

---

### Scenario 5: Deployment Failure

**Symptoms:**
- Build fails on Vercel
- Tests failing in CI
- Deployment stuck

**Severity:** P2 (unless production broken)

**Response Procedure:**

1. **Check Build Logs (0-5 min)**
   ```bash
   # View deployment logs
   vercel logs [deployment-url]
   
   # Check build status
   vercel inspect [deployment-url]
   ```

2. **Identify Failure Point (5-15 min)**
   - Dependency installation failure?
   - Test failure?
   - Syntax error?
   - Configuration issue?

3. **Fix and Redeploy (15-30 min)**
   ```bash
   # Fix code locally
   npm install
   npm test
   
   # Commit fix
   git add .
   git commit -m "Fix deployment issue"
   git push
   
   # Trigger new deployment
   vercel --prod
   ```

---

## 6. Communication Protocols

### Internal Communication

#### Incident Slack Channel
**Create for P0/P1 incidents:**
```
Channel name: #incident-YYYY-MM-DD-N
Purpose: Coordinate response to [brief description]
Members: @incident-commander @technical-lead @communications-lead
```

**Channel Guidelines:**
- Pin incident summary to top
- Use threads for detailed discussions
- Post updates every 30 minutes (P0) or 1 hour (P1)
- Keep conversation focused on incident

#### Update Template
```
UPDATE [HH:MM UTC]
Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [current impact]
Action: [what we're doing]
ETA: [estimated time to resolution]
Next update: [time]
```

### External Communication

#### Status Page Updates
**For P0/P1 incidents affecting users:**

1. Initial notification (within 15 min)
   ```
   We're investigating reports of [issue]. 
   We'll provide updates every [interval].
   ```

2. Progress updates (every 30-60 min)
   ```
   Update [HH:MM]: We've identified the issue and are implementing a fix.
   ETA: [time]
   ```

3. Resolution notification
   ```
   The issue has been resolved. Service is operating normally.
   Root cause: [brief explanation]
   We apologize for the disruption.
   ```

#### Customer Communication
**When to notify customers:**
- Data breach confirmed
- Extended outage (>1 hour)
- Data loss or corruption
- Security vulnerability affecting users

**Approval required from:**
- Legal team
- Executive team
- Communications lead

---

## 7. Post-Incident Activities

### Post-Mortem Meeting (Within 48 hours)

**Attendees:**
- Incident commander
- Technical lead
- Engineering team
- Product manager
- Affected stakeholders

**Agenda:**
1. Timeline review (what happened when)
2. Root cause analysis (why it happened)
3. Impact assessment (who was affected)
4. Response evaluation (what went well/poorly)
5. Action items (how to prevent recurrence)

### Post-Mortem Document

**Template:**
```markdown
# Post-Mortem: [Incident Title]

**Date:** [YYYY-MM-DD]
**Severity:** [P0/P1/P2/P3]
**Duration:** [start] to [end] ([duration])
**Impact:** [description]

## Summary
[2-3 sentence summary]

## Timeline
[Detailed timeline with timestamps]

## Root Cause
[Technical explanation]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## Resolution
[How it was fixed]

## Impact
- Users affected: [number]
- Requests failed: [number]
- Data loss: [yes/no, details]
- Downtime: [duration]

## What Went Well
- [Positive aspect 1]
- [Positive aspect 2]

## What Went Poorly
- [Issue 1]
- [Issue 2]

## Action Items
| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| [Action 1] | [Name] | P0 | [Date] | [ ] |
| [Action 2] | [Name] | P1 | [Date] | [ ] |

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
```

### Follow-up Actions

1. **Immediate (0-7 days)**
   - Implement critical fixes
   - Update monitoring/alerting
   - Update documentation
   - Add regression tests

2. **Short-term (7-30 days)**
   - Implement process improvements
   - Training on lessons learned
   - Update runbooks

3. **Long-term (30-90 days)**
   - Architectural improvements
   - Capacity planning
   - Third-party audits

---

## 8. Contact Information

### On-Call Rotation
**Primary:** [Name] - [Phone] - [Email]  
**Secondary:** [Name] - [Phone] - [Email]  
**Escalation:** [Engineering Manager] - [Phone] - [Email]

### Key Contacts

**Engineering Team:**
- Lead Engineer: [Contact info]
- DevOps: [Contact info]
- Security: [Contact info]

**Management:**
- Engineering Manager: [Contact info]
- Product Manager: [Contact info]
- CTO: [Contact info]

**External:**
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io

### Escalation Path

```
Incident Detected
    ↓
On-Call Engineer (15 min)
    ↓
Engineering Lead (30 min)
    ↓
Engineering Manager (1 hour)
    ↓
CTO (2 hours)
    ↓
Executive Team (P0 only)
```

---

## 9. Tools and Resources

### Monitoring Dashboards
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Uptime Monitor: [URL]

### Log Access
- Vercel Logs: `vercel logs --follow`
- Supabase Logs: Dashboard > Logs

### Documentation
- Architecture: SYSTEM_ARCHITECTURE.md
- Deployment: DEPLOYMENT.md
- Security: FINAL_AUDIT_REPORT.md
- Risks: PRE_MORTEM_RISK_REPORT.md

### Runbook Commands

```bash
# Quick health check
curl https://your-app.vercel.app/api/health-check | jq

# Rollback deployment
vercel rollback [deployment-url]

# View recent deployments
vercel list

# Check environment variables
vercel env ls

# Tail logs
vercel logs --follow

# Run tests
npm test
```

---

## Appendix: Incident Response Checklist

### P0 Incident Response Checklist

**Detection & Triage (0-5 min)**
- [ ] Incident detected and confirmed
- [ ] Severity assessed as P0
- [ ] Incident ticket created
- [ ] On-call engineer paged
- [ ] Incident Slack channel created
- [ ] Initial timeline started

**Containment (5-15 min)**
- [ ] Further damage prevented
- [ ] Evidence preserved (logs, screenshots)
- [ ] Scope assessed
- [ ] Rollback initiated (if applicable)
- [ ] Status page updated

**Investigation (15-60 min)**
- [ ] Recent changes reviewed
- [ ] Logs examined
- [ ] Root cause identified
- [ ] Fix strategy determined

**Recovery (1-4 hours)**
- [ ] Fix implemented
- [ ] Verification tests passed
- [ ] Service restored
- [ ] Monitoring confirmed stability

**Resolution (4+ hours)**
- [ ] 1 hour of stable operation
- [ ] Incident declared resolved
- [ ] Stakeholders notified
- [ ] Post-mortem scheduled

**Post-Incident (48 hours)**
- [ ] Post-mortem document completed
- [ ] Action items assigned
- [ ] Documentation updated
- [ ] Lessons learned shared

---

**Document Maintained By:** Engineering Team  
**Review Schedule:** After each P0/P1 incident + quarterly  
**Last Reviewed:** January 15, 2024  
**Next Review:** April 15, 2024
