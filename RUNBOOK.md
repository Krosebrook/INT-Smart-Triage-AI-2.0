# INT Smart Triage AI 2.0 - Operations Runbook

This runbook provides comprehensive operational procedures for the INT Smart Triage AI 2.0 system, including incident response, monitoring, and troubleshooting.

## Quick Reference

### Emergency Contacts
- **Primary On-Call**: on-call@int-inc.com
- **DevOps Team**: devops@int-inc.com  
- **Database Admin**: db-admin@int-inc.com
- **Security Team**: security@int-inc.com

### Dashboard Links
- **Production Application**: [https://smart-triage-ai.int-inc.com](https://smart-triage-ai.int-inc.com)
- **Vercel Dashboard**: [https://vercel.com/int-inc/smart-triage-ai](https://vercel.com/int-inc/smart-triage-ai)
- **Supabase Dashboard**: [https://app.supabase.io/project/[project-id]](https://app.supabase.io)
- **OpenAI Usage Dashboard**: [https://platform.openai.com/usage](https://platform.openai.com/usage)

## Incident Response Procedures

### Severity Definitions

#### S0 - Critical (Response Time: 15 minutes)
Complete system outage affecting all users
- Application completely inaccessible
- Database connectivity lost
- Security breach detected
- Data corruption identified

#### S1 - High (Response Time: 1 hour)  
Major functionality impaired affecting most users
- AI triage functionality down
- Authentication system failing
- Significant performance degradation (>10s response times)
- Partial database outage

#### S2 - Medium (Response Time: 4 hours)
Limited functionality impaired affecting some users
- Individual feature failures
- Moderate performance issues (3-10s response times)
- Non-critical integrations down
- Isolated user access issues

### S0 - Critical Incident Response

#### Immediate Actions (0-15 minutes)
- [ ] **Acknowledge Incident**: Respond to alert within 15 minutes
- [ ] **Assess Impact**: Determine scope and user impact
- [ ] **Escalate**: Notify primary on-call and incident commander
- [ ] **Create Incident Channel**: #incident-[timestamp] in Slack
- [ ] **Begin Status Page Updates**: Post initial incident notice

#### Investigation Steps (15-30 minutes)
- [ ] **Check System Status**:
  - [ ] Verify Vercel deployment status
  - [ ] Check Supabase database connectivity
  - [ ] Validate OpenAI API status
  - [ ] Review recent deployments

- [ ] **Review Monitoring**:
  - [ ] Check error rates in Vercel dashboard
  - [ ] Review database performance metrics
  - [ ] Analyze API response times
  - [ ] Check function execution logs

#### Resolution Actions (30+ minutes)
- [ ] **Implement Fix**:
  - [ ] Apply immediate workaround if available
  - [ ] Rollback recent deployment if needed
  - [ ] Scale resources if performance issue
  - [ ] Coordinate with external service providers

- [ ] **Verify Resolution**:
  - [ ] Test critical user journeys
  - [ ] Confirm metrics return to normal
  - [ ] Validate with test transactions
  - [ ] Monitor for 30 minutes post-fix

#### Post-Incident (After Resolution)
- [ ] **Update Status Page**: Confirm resolution
- [ ] **Internal Communication**: Notify stakeholders
- [ ] **Schedule Post-Mortem**: Within 48 hours
- [ ] **Document Lessons Learned**
- [ ] **Create Follow-up Tasks**

### S1 - High Incident Response

#### Immediate Actions (0-60 minutes)
- [ ] **Acknowledge Incident**: Respond to alert within 1 hour
- [ ] **Assess Impact**: Determine affected functionality
- [ ] **Notify Team**: Alert relevant team members
- [ ] **Begin Investigation**: Start troubleshooting process

#### Investigation Checklist
- [ ] **Application Layer**:
  - [ ] Check Vercel function logs for errors
  - [ ] Review API endpoint response times
  - [ ] Validate environment variables
  - [ ] Check function timeout issues

- [ ] **Database Layer**:
  - [ ] Monitor Supabase connection pool
  - [ ] Check for slow queries
  - [ ] Verify RLS policies functioning
  - [ ] Review database error logs

- [ ] **External Services**:
  - [ ] Validate OpenAI API connectivity
  - [ ] Check third-party service status
  - [ ] Review rate limiting issues
  - [ ] Confirm API key validity

### S2 - Medium Incident Response

#### Standard Investigation Process
- [ ] **Reproduce Issue**: Attempt to replicate the problem
- [ ] **Check Logs**: Review application and system logs
- [ ] **Monitor Metrics**: Look for patterns in monitoring data
- [ ] **Test Workarounds**: Identify temporary solutions
- [ ] **Plan Fix**: Develop permanent solution
- [ ] **Schedule Deployment**: Plan fix deployment

## System Monitoring and Health Checks

### Automated Monitoring Alerts

#### Application Health
- [ ] **Response Time**: Alert if >3s average response time
- [ ] **Error Rate**: Alert if >2% error rate over 5 minutes
- [ ] **Uptime**: Alert on any downtime detection
- [ ] **Function Errors**: Alert on serverless function failures

#### Database Health  
- [ ] **Connection Pool**: Alert if >80% pool utilization
- [ ] **Query Performance**: Alert on queries >5s execution time
- [ ] **Storage Usage**: Alert if >85% storage used
- [ ] **Backup Failures**: Alert on backup job failures

#### External Dependencies
- [ ] **OpenAI API**: Monitor response times and rate limits
- [ ] **Third-party Services**: Check integration health
- [ ] **SSL Certificates**: Monitor expiration dates
- [ ] **Domain DNS**: Monitor DNS resolution

### Manual Health Check Procedures

#### Daily Health Check (5 minutes)
- [ ] **Application Access**: Verify main application loads
- [ ] **Core Functionality**: Test ticket triage feature
- [ ] **Database Connectivity**: Confirm data persistence
- [ ] **AI Integration**: Validate AI response generation
- [ ] **User Authentication**: Test login/logout flow

#### Weekly Health Check (15 minutes)
- [ ] **Performance Review**: Check response time trends
- [ ] **Error Analysis**: Review error logs and patterns
- [ ] **Resource Usage**: Monitor CPU, memory, storage
- [ ] **Security Scan**: Review access logs for anomalies
- [ ] **Backup Verification**: Confirm backup integrity

#### Monthly Health Check (30 minutes)
- [ ] **Comprehensive Testing**: Full user journey testing
- [ ] **Performance Benchmarking**: Compare against baselines
- [ ] **Security Audit**: Review access patterns and permissions
- [ ] **Dependency Updates**: Check for security updates
- [ ] **Capacity Planning**: Analyze usage growth trends

## Rollback Procedures

### Vercel Deployment Rollback

#### Immediate Rollback (2-5 minutes)
1. **Access Vercel Dashboard**
   - [ ] Navigate to project dashboard
   - [ ] Go to "Deployments" tab
   - [ ] Identify last known good deployment

2. **Execute Rollback**
   - [ ] Click on stable deployment
   - [ ] Click "Promote to Production"
   - [ ] Confirm promotion action
   - [ ] Monitor deployment progress

3. **Verify Rollback**
   - [ ] Test application functionality
   - [ ] Check error rates return to normal
   - [ ] Confirm database connectivity
   - [ ] Validate user access

#### Database Rollback (Complex - Coordinate with DBA)
1. **Assessment Phase**
   - [ ] Determine if database changes are involved
   - [ ] Identify migration rollback requirements
   - [ ] Assess data integrity implications
   - [ ] Coordinate with database administrator

2. **Execution Phase** (DBA Required)
   - [ ] Create database backup before rollback
   - [ ] Apply reverse migrations if available
   - [ ] Restore from backup if necessary
   - [ ] Verify data consistency

### Environment Variable Rollback
- [ ] **Identify Changes**: Review recent environment variable changes
- [ ] **Restore Previous Values**: Update variables to previous state
- [ ] **Trigger Redeployment**: Force redeployment with old values
- [ ] **Verify Functionality**: Test application behavior

## Troubleshooting Guide

### Common Issues and Solutions

#### "Application Not Loading" (S0/S1)
**Symptoms**: Users cannot access the application
**Investigation Steps**:
- [ ] Check Vercel deployment status
- [ ] Verify DNS resolution
- [ ] Check SSL certificate validity  
- [ ] Review CDN status
- [ ] Test from multiple locations

**Common Fixes**:
- Redeploy if deployment failed
- Clear CDN cache
- Update DNS records
- Renew SSL certificates

#### "AI Triage Not Working" (S1/S2)
**Symptoms**: Triage feature returns errors or no response
**Investigation Steps**:
- [ ] Check OpenAI API status
- [ ] Verify API key validity
- [ ] Review rate limiting
- [ ] Check request/response logs
- [ ] Validate input data format

**Common Fixes**:
- Rotate OpenAI API key
- Implement retry logic
- Adjust rate limiting
- Fix input validation

#### "Database Connection Issues" (S0/S1)
**Symptoms**: Database queries failing or timing out
**Investigation Steps**:
- [ ] Check Supabase project status
- [ ] Monitor connection pool usage
- [ ] Review query performance
- [ ] Verify RLS policies
- [ ] Check network connectivity

**Common Fixes**:
- Restart connection pool
- Optimize slow queries
- Update connection strings
- Scale database resources

#### "Slow Performance" (S2)
**Symptoms**: Application responds slowly (>3s response times)
**Investigation Steps**:
- [ ] Analyze response time metrics
- [ ] Check database query performance
- [ ] Review function execution times
- [ ] Monitor resource utilization
- [ ] Analyze network latency

**Common Fixes**:
- Optimize database queries
- Add caching layers
- Scale serverless functions
- Optimize bundle size

### Performance Baselines

#### Response Time Targets
- **Homepage Load**: <1.5 seconds
- **Triage Submission**: <3 seconds  
- **AI Response Generation**: <5 seconds
- **Database Queries**: <500ms average
- **API Endpoints**: <1 second

#### Resource Usage Targets
- **Function Memory Usage**: <256MB average
- **Database Connection Pool**: <70% utilization
- **Storage Growth**: <10% monthly
- **Bandwidth Usage**: Monitor trends

## Maintenance Procedures

### Scheduled Maintenance

#### Weekly Maintenance Window
**Time**: Sundays 2:00-4:00 AM UTC  
**Duration**: 2 hours maximum

**Standard Tasks**:
- [ ] Apply security updates
- [ ] Deploy non-critical fixes
- [ ] Perform database maintenance
- [ ] Clean up logs and temporary data
- [ ] Update monitoring configurations

#### Monthly Maintenance Window  
**Time**: First Sunday of month 2:00-6:00 AM UTC
**Duration**: 4 hours maximum

**Standard Tasks**:
- [ ] Major version updates
- [ ] Database optimization
- [ ] Security audit and updates
- [ ] Performance optimization
- [ ] Backup and recovery testing

### Emergency Maintenance
When critical security patches or urgent fixes are required:
- [ ] **Notify Stakeholders**: Minimum 1 hour notice if possible
- [ ] **Update Status Page**: Announce maintenance window
- [ ] **Coordinate Teams**: Ensure all teams are available
- [ ] **Execute Changes**: Apply fixes with rollback plan ready
- [ ] **Verify Systems**: Complete post-maintenance testing

## Capacity Planning and Scaling

### Usage Metrics to Monitor
- [ ] **Daily Active Users**: Track growth trends
- [ ] **Triage Requests**: Monitor volume and peaks
- [ ] **Database Growth**: Storage and query volume
- [ ] **API Calls**: Rate limiting and usage patterns
- [ ] **Function Executions**: Serverless usage patterns

### Scaling Triggers
- [ ] **Response Time**: >3s average for sustained period
- [ ] **Error Rate**: >5% for any significant duration
- [ ] **Resource Utilization**: >80% sustained usage
- [ ] **User Growth**: 50% increase in monthly active users

### Scaling Actions
- [ ] **Vercel**: Upgrade plan or adjust function configurations
- [ ] **Supabase**: Scale database compute and storage
- [ ] **OpenAI**: Review usage limits and upgrade as needed
- [ ] **Monitoring**: Enhance monitoring and alerting

## Security Incident Response

### Security Alert Response
- [ ] **Immediate Isolation**: Block suspicious access if confirmed threat
- [ ] **Assess Impact**: Determine scope of potential breach
- [ ] **Notify Security Team**: security@int-inc.com within 30 minutes
- [ ] **Preserve Evidence**: Maintain logs and forensic data
- [ ] **Coordinate Response**: Work with security team on remediation

### Data Breach Response
- [ ] **Contain Breach**: Immediately stop unauthorized access
- [ ] **Assess Data Impact**: Identify what data was accessed
- [ ] **Legal Notification**: Notify legal team within 1 hour
- [ ] **Customer Communication**: Prepare customer notification
- [ ] **Regulatory Compliance**: Follow data protection requirements

## Documentation and Knowledge Management

### Incident Documentation
- [ ] **Incident Reports**: Complete within 24 hours of resolution
- [ ] **Post-Mortem Reports**: Conduct within 48 hours for S0/S1
- [ ] **Action Items**: Track follow-up improvements
- [ ] **Knowledge Base Updates**: Update runbook based on learnings

### Training and Onboarding
- [ ] **New Team Member Onboarding**: System overview and access setup
- [ ] **Regular Training**: Quarterly incident response drills
- [ ] **Documentation Reviews**: Monthly runbook updates
- [ ] **Escalation Practice**: Test escalation procedures

---

**Last Updated**: [Current Date]  
**Document Version**: 1.0  
**Next Review**: [Date + 1 month]  
**Owner**: DevOps Team