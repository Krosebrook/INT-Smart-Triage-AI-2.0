# Disaster Recovery & Business Continuity Plan
# INT Smart Triage AI 2.0

**Document Version:** 1.0  
**Last Updated:** January 15, 2024  
**Classification:** Internal - Critical  
**Owner:** Engineering & Operations Team

---

## Table of Contents
1. [Overview](#overview)
2. [Disaster Scenarios](#disaster-scenarios)
3. [Recovery Objectives](#recovery-objectives)
4. [Recovery Procedures](#recovery-procedures)
5. [Business Continuity](#business-continuity)
6. [Testing & Validation](#testing--validation)
7. [Communication Plan](#communication-plan)
8. [Appendices](#appendices)

---

## 1. Overview

### Purpose
This Disaster Recovery and Business Continuity Plan (DR/BCP) provides procedures to restore the INT Smart Triage AI 2.0 system following a catastrophic event and ensure continuity of business operations.

### Scope
**Covered Systems:**
- Vercel-hosted API endpoints
- Supabase PostgreSQL database
- Application code and configuration
- Documentation and procedures

**Covered Scenarios:**
- Complete service provider outages (Vercel, Supabase)
- Data loss or corruption
- Security breaches
- Regional disasters
- Third-party service failures

### Key Principles
1. **Data Protection**: Customer data is the highest priority
2. **Service Availability**: Minimize downtime to CSR operations
3. **Communication**: Keep stakeholders informed
4. **Documentation**: Maintain current recovery procedures

---

## 2. Disaster Scenarios

### 2.1 Complete Vercel Outage

**Scenario:** Vercel experiences complete service outage affecting all deployments

**Probability:** Very Low (Vercel 99.99% uptime SLA)  
**Impact:** CRITICAL - Complete API unavailability  
**RTO:** 4 hours  
**RPO:** 0 (no data loss, stateless functions)

**Detection:**
- Health check monitors fail
- Vercel status page shows outage
- User reports of service unavailability

**Recovery Strategy:**
1. **Immediate (0-30 min):**
   - Monitor Vercel status page for updates
   - Activate incident response team
   - Post status update to users
   
2. **Short-term (30 min - 2 hours):**
   - If prolonged outage, prepare alternate hosting
   - Deploy to backup platform (AWS Lambda, Google Cloud Functions)
   - Update DNS if necessary

3. **Long-term (2-4 hours):**
   - Full migration to alternate platform if needed
   - Test all functionality
   - Update monitoring

**Workaround:**
- CSRs use manual triage process
- Document tickets for later processing
- Update status page with ETA

---

### 2.2 Complete Supabase Outage

**Scenario:** Supabase experiences complete database unavailability

**Probability:** Very Low (Supabase 99.9% uptime SLA)  
**Impact:** HIGH - Cannot log triage reports  
**RTO:** 2 hours  
**RPO:** 24 hours (last backup)

**Detection:**
- Health check shows database: "error"
- Triage endpoint returns 500 errors
- Supabase status page shows outage

**Recovery Strategy:**
1. **Immediate (0-30 min):**
   - Verify Supabase status page
   - Enable degraded mode (triage without logging)
   - Notify users of degraded functionality

2. **Short-term (30 min - 1 hour):**
   - Implement queue for failed requests
   - Store triage results in temporary storage
   - Monitor Supabase status

3. **Long-term (1-2 hours):**
   - If extended outage, restore from backup to new instance
   - Update connection strings
   - Replay queued requests

**Workaround:**
- API returns triage results without database logging
- Results stored in Vercel logs for manual recovery
- Re-process queued requests when database available

---

### 2.3 Complete Data Loss

**Scenario:** Database corruption or accidental deletion of all data

**Probability:** Very Low (RLS protects against accidental deletion)  
**Impact:** CRITICAL - Loss of audit trail  
**RTO:** 4 hours  
**RPO:** 24 hours (daily backups)

**Detection:**
- Empty query results
- Database size suddenly decreased
- User reports of missing data

**Recovery Strategy:**
1. **Immediate (0-15 min):**
   - Stop all write operations
   - Identify scope of data loss
   - Preserve any remaining data

2. **Assessment (15-45 min):**
   - Determine last known good backup
   - Calculate data loss window
   - Identify affected records

3. **Restoration (45 min - 3 hours):**
   ```sql
   -- Restore from Supabase backup
   -- Via Supabase Dashboard: Settings > Backup > Restore
   
   -- Verify restoration
   SELECT COUNT(*) FROM reports;
   SELECT MAX(created_at) FROM reports;
   
   -- Verify RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'reports';
   
   -- Verify indexes
   SELECT * FROM pg_indexes WHERE tablename = 'reports';
   ```

4. **Verification (3-4 hours):**
   - Test health check endpoint
   - Submit test triage request
   - Verify data integrity
   - Notify users of restored service

**Data Recovery Priority:**
1. RLS policies (security critical)
2. Recent reports (last 24 hours)
3. Historical reports (audit trail)
4. Metadata and indexes

---

### 2.4 Security Breach / Ransomware

**Scenario:** Successful attack compromising systems or encrypting data

**Probability:** Low (strong security controls)  
**Impact:** CRITICAL - Data breach, service unavailability  
**RTO:** 8 hours  
**RPO:** 24 hours

**Detection:**
- Suspicious database activity
- Unauthorized access alerts
- Unexpected encryption
- Ransom demand

**Recovery Strategy:**
1. **Containment (0-30 min):**
   - Immediately rotate ALL credentials
   - Disable compromised accounts
   - Isolate affected systems
   - Preserve evidence (logs, snapshots)

2. **Assessment (30 min - 2 hours):**
   - Identify attack vector
   - Determine scope of breach
   - Assess data compromise
   - Engage security team/forensics

3. **Eradication (2-4 hours):**
   - Remove malware/backdoors
   - Patch vulnerabilities
   - Restore from clean backups
   - Verify system integrity

4. **Recovery (4-8 hours):**
   - Deploy clean system
   - Restore data from backup
   - Implement additional security controls
   - Monitor for re-infection

5. **Post-Incident (ongoing):**
   - Forensic analysis
   - Regulatory notifications (if required)
   - Customer communications
   - Security improvements

**DO NOT:**
- ❌ Pay ransom (no guarantee of recovery)
- ❌ Restore from potentially compromised backups
- ❌ Rush recovery (ensure complete eradication)

---

### 2.5 Regional Disaster

**Scenario:** Natural disaster affects primary data center region

**Probability:** Very Low  
**Impact:** HIGH - Regional service disruption  
**RTO:** 6 hours  
**RPO:** 24 hours

**Recovery Strategy:**
1. **Immediate (0-1 hour):**
   - Verify scope of regional outage
   - Activate disaster recovery team
   - Communicate with service providers

2. **Failover (1-4 hours):**
   - Deploy to alternate region (Vercel automatic)
   - Restore database in different region
   - Update DNS/routing if needed

3. **Verification (4-6 hours):**
   - Test all functionality
   - Verify data integrity
   - Monitor performance
   - Update status page

**Geographic Redundancy:**
- Vercel: Automatic edge deployment (global)
- Supabase: Configure read replicas in multiple regions
- Backups: Store in geographically separate location

---

### 2.6 Third-Party Service Failures

**Scenario:** Dependency (npm registry, GitHub, etc.) becomes unavailable

**Probability:** Low  
**Impact:** MEDIUM - Deployment blocked, no runtime impact  
**RTO:** 2 hours  
**RPO:** 0 (no data loss)

**Affected Operations:**
- New deployments
- Dependency updates
- CI/CD pipeline

**Recovery Strategy:**
1. **Current deployment unaffected** (already built)
2. **For new deployments:**
   - Wait for service restoration
   - Use cached dependencies (npm cache)
   - Use alternative registry if available
   - Deploy from local build if critical

**Mitigation:**
- Minimize production dependencies (currently 1)
- Use lockfiles (package-lock.json)
- Cache dependencies locally
- Have rollback plan ready

---

## 3. Recovery Objectives

### 3.1 Recovery Time Objectives (RTO)

**RTO Definition:** Maximum acceptable downtime for each system

| System/Scenario | RTO | Justification |
|----------------|-----|---------------|
| Complete API Outage | 15 minutes | Critical business impact, CSRs unable to work |
| Database Outage | 2 hours | Can operate in degraded mode temporarily |
| Data Loss (restore) | 4 hours | Time to restore from backup and verify |
| Security Breach | 8 hours | Thorough investigation required |
| Regional Disaster | 6 hours | Complex failover procedures |
| Deployment Failure | 5 minutes | Quick rollback available |

### 3.2 Recovery Point Objectives (RPO)

**RPO Definition:** Maximum acceptable data loss for each scenario

| System/Scenario | RPO | Data Loss Risk |
|----------------|-----|----------------|
| API Functions | 0 | Stateless, no data loss |
| Database Backup | 24 hours | Last automated backup |
| Code Repository | 0 | Git-based, no data loss |
| Configuration | 0 | Git-based, environment vars backed up |
| Manual Data Entry | 1 hour | CSR can re-enter recent tickets |

### 3.3 Service Level Objectives

**Overall Availability Target:** 99.9% uptime
- Maximum downtime: 43.8 minutes/month
- Equivalent to: 8.76 hours/year

**Current SLAs:**
- Vercel: 99.99% uptime
- Supabase: 99.9% uptime
- Combined expected: 99.89% uptime

---

## 4. Recovery Procedures

### 4.1 Complete System Recovery

**Use Case:** Catastrophic failure requiring full system rebuild

**Prerequisites:**
- GitHub repository access
- Vercel account access
- Supabase account access (or new account)
- Environment variables backed up

**Procedure (4-6 hours):**

#### Step 1: Repository Setup (15 minutes)
```bash
# 1. Clone repository
git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# 2. Verify latest code
git log -1
git status

# 3. Install dependencies
npm install

# 4. Run tests locally
npm test
```

#### Step 2: Database Setup (1 hour)
```sql
-- 1. Create new Supabase project (if needed)
-- Via Supabase Dashboard: New Project

-- 2. Run schema setup
-- Copy contents of supabase-setup.sql to SQL Editor

-- 3. Execute schema
-- Click "Run" in Supabase SQL Editor

-- 4. Verify table creation
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 5. Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'reports';

-- 6. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'reports';

-- 7. Restore data from backup (if available)
-- Via Supabase Dashboard: Settings > Backup > Restore
```

#### Step 3: Deployment Setup (30 minutes)
```bash
# 1. Login to Vercel
vercel login

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add SUPABASE_URL
# Enter: https://xxxxx.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Enter: [service role key from Supabase]

# 4. Deploy to production
vercel --prod

# 5. Note deployment URL
# Save for monitoring configuration
```

#### Step 4: Verification (30 minutes)
```bash
# 1. Health check
HEALTH_URL="https://[your-deployment].vercel.app/api/health-check"
curl -X GET $HEALTH_URL | jq

# Expected: "status": "healthy", "rls": "enabled"

# 2. Triage test
curl -X POST https://[your-deployment].vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Recovery Test",
    "ticketSubject": "System Recovery Verification",
    "issueDescription": "Testing system after disaster recovery",
    "customerTone": "calm",
    "csrAgent": "RECOVERY_TEST"
  }' | jq

# Expected: "success": true, reportId generated

# 3. Verify database write
# Check Supabase Dashboard: Table Editor > reports
# Should see test record

# 4. Test security
# Attempt direct database access (should fail with RLS)
```

#### Step 5: Monitoring Setup (30 minutes)
```bash
# 1. Configure UptimeRobot
# - Add health check monitor
# - Set 60-second interval
# - Configure alert contacts

# 2. Update status page
# - System operational
# - Note any degraded functionality

# 3. Update documentation
# - Record new URLs
# - Update monitoring dashboards
# - Note any configuration changes
```

#### Step 6: User Communication (15 minutes)
```markdown
Subject: Service Restoration Complete

The INT Smart Triage AI system has been fully restored and is operational.

Timeline:
- Incident detected: [time]
- Recovery started: [time]
- Service restored: [time]
- Total downtime: [duration]

Changes:
- [Any changes made]

Verification:
- All functionality tested and operational
- No data loss [or: Data restored to [time]]
- All security controls verified

If you experience any issues, please contact [support email].
```

---

### 4.2 Database-Only Recovery

**Use Case:** Database failure while API is operational

**Procedure (2-3 hours):**

```sql
-- 1. Create new Supabase project (if current is unrecoverable)
-- Dashboard: New Project

-- 2. Execute schema
-- Run supabase-setup.sql

-- 3. Restore data
-- Dashboard: Settings > Backup > Restore [select backup date]

-- 4. Verify restoration
SELECT 
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(DISTINCT csr_agent) as unique_agents
FROM reports;

-- 5. Verify RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'reports';
SELECT * FROM pg_policies WHERE tablename = 'reports';

-- 6. Verify indexes
SELECT * FROM pg_indexes WHERE tablename = 'reports';
```

```bash
# 7. Update Vercel environment variable
vercel env rm SUPABASE_URL
vercel env rm SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 8. Redeploy
vercel --prod

# 9. Test
curl https://your-app.vercel.app/api/health-check | jq
```

---

### 4.3 Code-Only Recovery

**Use Case:** Code corruption or bad deployment

**Procedure (5-15 minutes):**

```bash
# Option 1: Rollback (fastest)
vercel rollback [previous-deployment-url]

# Option 2: Redeploy from git
git checkout main
git pull origin main
vercel --prod

# Option 3: Specific commit
git checkout [known-good-commit]
vercel --prod

# Verify
curl https://your-app.vercel.app/api/health-check | jq
```

---

## 5. Business Continuity

### 5.1 Degraded Mode Operations

**Scenario:** System partially unavailable but critical functions work

#### Degraded Mode 1: Database Unavailable
**Impact:** Cannot log triage reports  
**Workaround:**
- API still provides triage analysis
- Results not saved to database
- CSRs document manually
- Replay requests when database restored

**Implementation:**
```javascript
// In api/triage-report.js - already handled
try {
    await supabase.from('reports').insert([reportData]);
} catch (error) {
    // Log to Vercel logs for manual recovery
    console.error('Database unavailable, logging locally:', reportData);
    // Still return triage results to user
}
```

#### Degraded Mode 2: Slow Performance
**Impact:** High response times  
**Workaround:**
- Increase timeout limits
- Reduce non-essential processing
- Prioritize critical requests
- Add queueing if needed

#### Degraded Mode 3: Health Check Only
**Impact:** Triage endpoint down  
**Workaround:**
- CSRs use manual triage process
- Reference knowledge base articles
- Document for later analysis

---

### 5.2 Manual Fallback Procedures

**When to Use:** Complete system unavailability (>1 hour)

#### Manual Triage Process

**Step 1: Initial Assessment**
```
Priority Indicators:
- High: outage, critical, broken, angry customer, urgent
- Medium: slow, issue, error, frustrated customer
- Low: question, feature request, calm customer
```

**Step 2: Response Approach**
```
Customer Tone → Response Style:
- Angry: De-escalation, immediate ownership, compensation
- Frustrated: Empathy, clear timeline, frequent updates
- Confused: Patient education, step-by-step guidance
- Urgent: Immediate escalation, priority handling
- Calm: Standard professional response
```

**Step 3: Knowledge Base**
```
Common Articles:
- Login issues: KB-AUTH-01
- Performance: KB-PERF-01
- Billing: KB-BILL-01
- General: KB-001, KB-015, KB-032
```

**Step 4: Documentation**
```
Record in temporary spreadsheet:
- Customer name
- Issue description
- Priority assigned
- Response provided
- CSR agent
- Timestamp
```

**Step 5: System Recovery**
```
When system restored:
- Upload manual entries
- Verify data integrity
- Update audit trail
```

---

### 5.3 Alternative Service Providers

**Contingency Planning:** Maintain ability to migrate to alternatives

#### Vercel Alternatives
**Option 1: Netlify**
- Similar serverless functions
- Git-based deployment
- Migration time: 2-4 hours

**Option 2: AWS Lambda + API Gateway**
- More control, more complexity
- Migration time: 8-12 hours

**Option 3: Google Cloud Functions**
- Similar to Vercel
- Migration time: 4-6 hours

**Migration Complexity:** Low-Medium (serverless functions are portable)

#### Supabase Alternatives
**Option 1: Managed PostgreSQL (AWS RDS, GCP Cloud SQL)**
- Standard PostgreSQL
- Manual RLS setup
- Migration time: 4-8 hours

**Option 2: Self-hosted PostgreSQL**
- Full control
- Manual management required
- Migration time: 8-12 hours

**Option 3: Other PostgreSQL services (Heroku, DigitalOcean)**
- Similar to Supabase
- Migration time: 2-4 hours

**Migration Complexity:** Low (standard PostgreSQL)

---

## 6. Testing & Validation

### 6.1 Disaster Recovery Testing Schedule

#### Monthly Tests (30 minutes)
- [ ] Verify backup completion
- [ ] Test rollback procedure
- [ ] Validate monitoring alerts
- [ ] Review contact information

#### Quarterly Tests (2 hours)
- [ ] Full database restore to test instance
- [ ] Test degraded mode operations
- [ ] Verify manual fallback procedures
- [ ] Review and update DR procedures
- [ ] Test emergency communication

#### Annual Tests (1 day)
- [ ] Full DR simulation (complete recovery)
- [ ] Test alternate service providers
- [ ] Validate RTO/RPO targets
- [ ] Update DR documentation
- [ ] Train all team members

### 6.2 Test Checklist Template

```markdown
## DR Test: [Date] - [Scenario]

### Pre-Test
- [ ] Backup current production
- [ ] Schedule test window
- [ ] Notify team members
- [ ] Prepare test environment

### Test Execution
- [ ] Document start time: [time]
- [ ] Execute recovery procedures
- [ ] Note any issues or delays
- [ ] Document completion time: [time]

### Verification
- [ ] Health check passes
- [ ] Triage functionality works
- [ ] RLS properly configured
- [ ] Data integrity verified
- [ ] Performance acceptable

### Metrics
- Actual RTO: [duration]
- Target RTO: [duration]
- Met target: [Yes/No]
- Issues encountered: [list]

### Improvements
- [ ] Update procedures if needed
- [ ] Address identified gaps
- [ ] Update documentation
- [ ] Train team on changes
```

---

## 7. Communication Plan

### 7.1 Stakeholder Communication Matrix

| Stakeholder | P0 | P1 | P2 | Updates Every |
|------------|----|----|----|----|
| CSR Team | Immediate | 30 min | 1 hour | 30 min |
| Management | Immediate | 30 min | 1 hour | 1 hour |
| Executive | 15 min | 1 hour | N/A | 2 hours |
| Customers | 30 min | If prolonged | N/A | 1 hour |

### 7.2 Communication Templates

#### Initial Notification (P0)
```
Subject: URGENT: System Outage - INT Smart Triage AI

We are experiencing a complete service outage of the INT Smart Triage AI system.

Impact: All CSRs unable to process tickets via system
Start Time: [timestamp]
Estimated Duration: Investigating

Action: CSRs should use manual triage process (see procedure doc)

Next Update: [time in 30 minutes]
```

#### Progress Update
```
Subject: UPDATE: System Outage Recovery in Progress

Update as of [time]:

Status: Recovery procedures in progress
Progress: [description of what's been done]
Current Step: [what's happening now]
ETA: [estimated time to full recovery]

Next Update: [time]
```

#### Resolution Notification
```
Subject: RESOLVED: System Restored

The INT Smart Triage AI system has been fully restored.

Restoration Time: [timestamp]
Total Downtime: [duration]
Data Loss: None [or specify]

Root Cause: [brief explanation]
Actions Taken: [brief summary]

Post-mortem will be conducted within 48 hours.

Please report any issues to [contact email].
```

---

## 8. Appendices

### Appendix A: Emergency Contacts

**On-Call Engineer:** [Name, Phone, Email]  
**Backup On-Call:** [Name, Phone, Email]  
**Engineering Manager:** [Name, Phone, Email]  
**Security Team:** [Contact]  
**Executive Sponsor:** [Name, Phone]

**External Support:**
- Vercel Support: support@vercel.com, https://vercel.com/support
- Supabase Support: support@supabase.io, https://supabase.com/support

### Appendix B: Critical Information

**Repository:** https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0  
**Production URL:** https://[your-deployment].vercel.app  
**Vercel Dashboard:** https://vercel.com/dashboard  
**Supabase Dashboard:** https://app.supabase.com  

**Environment Variables Backup:**
```
SUPABASE_URL=[backed up securely]
SUPABASE_SERVICE_ROLE_KEY=[backed up securely]
```

**Backup Locations:**
- Database: Supabase automated backups (7-day retention)
- Code: GitHub repository
- Documentation: GitHub repository
- Configuration: Vercel + secure password manager

### Appendix C: Vendor SLAs

| Vendor | Service | SLA | Credits |
|--------|---------|-----|---------|
| Vercel | Hosting | 99.99% | Pro plan: credits for downtime |
| Supabase | Database | 99.9% | Pro plan: credits for downtime |
| GitHub | Repository | 99.9% | N/A (free tier) |

### Appendix D: Recovery Checklist

```markdown
## Disaster Recovery Checklist

### Immediate Response (0-15 minutes)
- [ ] Incident declared
- [ ] On-call team notified
- [ ] Initial assessment completed
- [ ] Stakeholders notified
- [ ] Incident channel created

### Containment (15-30 minutes)
- [ ] Further damage prevented
- [ ] Evidence preserved
- [ ] Workarounds communicated
- [ ] Status page updated

### Recovery (30 minutes - 4 hours)
- [ ] Backup identified
- [ ] Recovery procedures initiated
- [ ] Systems restored
- [ ] Functionality tested
- [ ] Monitoring confirmed

### Verification (ongoing)
- [ ] Health check passing
- [ ] Triage functionality working
- [ ] RLS verified
- [ ] Data integrity confirmed
- [ ] Performance normal

### Post-Recovery (24-48 hours)
- [ ] Service stable for 24 hours
- [ ] Incident resolved
- [ ] Post-mortem scheduled
- [ ] Documentation updated
- [ ] Lessons learned documented
```

### Appendix E: Recovery Time Examples

**Historical Recovery Times** (for planning purposes):
- Bad deployment rollback: 5 minutes
- Environment variable update: 10 minutes
- Database restore (100MB): 30 minutes
- Complete system rebuild: 4 hours
- Migration to new provider: 8-12 hours

---

**Document Maintained By:** Engineering & Operations Team  
**Review Schedule:** Quarterly + after each DR test  
**Last Reviewed:** January 15, 2024  
**Next Review:** April 15, 2024  
**Last DR Test:** [TBD]  
**Next DR Test:** [Schedule within 30 days]

---

**IMPORTANT:** This document contains critical recovery procedures. Ensure all team members know where to find it and review it regularly. Test procedures at least quarterly.
