# Supabase Setup Guide

This guide provides comprehensive instructions for setting up the Supabase backend for the INT Smart Triage AI 2.0 system.

## Prerequisites Checklist
- [ ] Supabase account with project creation permissions
- [ ] Database administration knowledge
- [ ] SQL execution capabilities
- [ ] Understanding of Row Level Security (RLS) concepts

## 1. Project Creation and Basic Setup

### Create New Supabase Project
- [ ] Login to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Configure project settings:
  - [ ] Organization: Select appropriate organization
  - [ ] Name: `int-smart-triage-ai-prod` (or appropriate name)
  - [ ] Database Password: Generate strong password (save securely)
  - [ ] Region: Select region closest to users
  - [ ] Pricing Plan: Select appropriate plan based on usage requirements

### Project Configuration
- [ ] Wait for project initialization (5-10 minutes)
- [ ] Note down project details:
  - [ ] Project URL: `https://[project-id].supabase.co`
  - [ ] Public API Key (anon): For client-side operations
  - [ ] Service Role Key: For server-side operations (**KEEP SECRET**)
  - [ ] Database URL: For direct database connections

## 2. Database Schema Setup

### Core Tables Creation

Execute the following SQL commands in the Supabase SQL Editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for better data integrity
CREATE TYPE triage_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE triage_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
CREATE TYPE user_role AS ENUM ('csr', 'admin', 'manager');

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'csr',
    name TEXT NOT NULL,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Tickets table for storing triage requests
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    client_email TEXT NOT NULL,
    client_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority triage_priority NOT NULL,
    status triage_status NOT NULL DEFAULT 'new',
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT ticket_number_format CHECK (ticket_number ~ '^INT-\d{6}$')
);

-- AI responses table for storing triage results and talking points
CREATE TABLE IF NOT EXISTS public.ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    model_used TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    triage_result JSONB NOT NULL,
    talking_points TEXT[],
    knowledge_base_suggestions JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Audit log for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Setup Checklist
- [ ] All tables created successfully
- [ ] Enum types are properly defined
- [ ] Foreign key relationships are established
- [ ] Indexes are created for performance
- [ ] Check constraints are in place

## 3. Row Level Security (RLS) Configuration

### Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

```sql
-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Tickets table policies
CREATE POLICY "CSRs can view tickets assigned to them or created by them" ON public.tickets
    FOR SELECT USING (
        assigned_to::text = auth.uid()::text 
        OR created_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "CSRs can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (
        created_by::text = auth.uid()::text
    );

CREATE POLICY "CSRs can update their assigned tickets" ON public.tickets
    FOR UPDATE USING (
        assigned_to::text = auth.uid()::text 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- AI responses table policies
CREATE POLICY "Users can view AI responses for accessible tickets" ON public.ai_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE tickets.id = ai_responses.ticket_id
            AND (
                tickets.assigned_to::text = auth.uid()::text 
                OR tickets.created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id::text = auth.uid()::text 
                    AND users.role IN ('admin', 'manager')
                )
            )
        )
    );

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- System config policies (admin only)
CREATE POLICY "Admins can manage system config" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );
```

### RLS Verification Checklist
- [ ] RLS is enabled on all tables
- [ ] Users can only access their own data
- [ ] Admins have appropriate elevated access
- [ ] CSRs can only view assigned/created tickets
- [ ] AI responses follow ticket access patterns
- [ ] Audit logs are admin-only readable
- [ ] System config is admin-only manageable

## 4. Database Functions and Triggers

### Automated Timestamp Updates

```sql
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON public.tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON public.system_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Audit Trail Function

```sql
-- Function to create audit trail
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_tickets_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();
```

## 5. Initial Data Setup

### Create System Configuration

```sql
-- Insert default system configuration
INSERT INTO public.system_config (key, value, description) VALUES
('ai_model_config', '{"model": "gpt-4", "temperature": 0.3, "max_tokens": 1000}', 'OpenAI model configuration'),
('triage_thresholds', '{"high": 0.8, "medium": 0.5, "low": 0.2}', 'Confidence thresholds for triage priority'),
('rate_limits', '{"requests_per_minute": 60, "requests_per_hour": 1000}', 'API rate limiting configuration'),
('security_settings', '{"max_login_attempts": 5, "session_timeout_minutes": 480}', 'Security configuration');
```

### Create Initial Admin User (if needed)

```sql
-- This would typically be done through the authentication system
-- Example for reference only
INSERT INTO public.users (id, email, role, name, department) VALUES
(uuid_generate_v4(), 'admin@int-inc.com', 'admin', 'System Administrator', 'IT');
```

## 6. Security Verification

### Service Role Key Security Checklist
- [ ] **CRITICAL**: Service role key is never exposed in client-side code
- [ ] Service role key is stored securely in Vercel environment variables
- [ ] Service role key is only used in server-side API routes
- [ ] Service role key has restricted IP access (if applicable)
- [ ] Service role key rotation schedule is established

### Database Security Checklist
- [ ] RLS policies are properly tested
- [ ] Database password is strong and securely stored
- [ ] SSL enforcement is enabled
- [ ] Connection pooling is configured appropriately
- [ ] Database backups are enabled and tested
- [ ] Point-in-time recovery is configured

### Testing RLS Policies

```sql
-- Test queries to verify RLS is working
-- These should be run with different user contexts

-- Test user access (should only return current user)
SELECT * FROM public.users;

-- Test ticket access (should only return accessible tickets)
SELECT * FROM public.tickets;

-- Test admin access (should return all data when run as admin)
-- Run these tests with admin user context
```

## 7. Performance Optimization

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_ai_responses_ticket_id ON public.ai_responses(ticket_id);
CREATE INDEX idx_ai_responses_created_at ON public.ai_responses(created_at);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
```

### Connection Pooling Configuration
- [ ] Configure appropriate connection pool size in application
- [ ] Set connection timeout values
- [ ] Monitor connection usage in Supabase dashboard

## 8. Monitoring and Maintenance

### Database Monitoring Setup
- [ ] Enable Supabase metrics and monitoring
- [ ] Set up alerts for high CPU usage
- [ ] Set up alerts for connection pool exhaustion
- [ ] Monitor query performance
- [ ] Set up backup verification alerts

### Regular Maintenance Tasks
- [ ] Weekly RLS policy review
- [ ] Monthly performance optimization review
- [ ] Quarterly security audit
- [ ] Regular backup and recovery testing

## 9. Troubleshooting

### Common Issues

**RLS Policy Problems**
- Test policies with different user roles
- Use `SELECT current_user, session_user;` to debug authentication context
- Review policy logic for edge cases

**Performance Issues**
- Check query execution plans
- Verify indexes are being used
- Monitor connection pool usage
- Review slow query logs

**Connection Issues**
- Verify network connectivity
- Check connection string format
- Validate SSL certificate configuration
- Monitor connection pool limits

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- INT Database Team: db-admin@int-inc.com
- Emergency Contact: on-call@int-inc.com

## 10. Backup and Recovery

### Backup Configuration
- [ ] Daily automated backups enabled
- [ ] Point-in-time recovery configured
- [ ] Backup retention policy set (30 days minimum)
- [ ] Cross-region backup replication (if required)

### Recovery Procedures
- [ ] Document recovery time objectives (RTO)
- [ ] Document recovery point objectives (RPO)
- [ ] Test recovery procedures quarterly
- [ ] Maintain recovery runbook

---

**⚠️ CRITICAL SECURITY REMINDER**  
**NEVER expose the service role key in client-side code or commit it to version control. Always use it only in secure server-side environments.**

---

**Last Updated:** [Current Date]  
**Document Version:** 1.0  
**Review Schedule:** Monthly