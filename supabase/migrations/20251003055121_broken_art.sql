@@ .. @@
 -- Create the reports table
 CREATE TABLE IF NOT EXISTS reports (
     id BIGSERIAL PRIMARY KEY,
     report_id VARCHAR(50) UNIQUE NOT NULL,
     
     -- Ticket Information
     customer_name VARCHAR(100) NOT NULL,
     ticket_subject VARCHAR(200) NOT NULL,
     issue_description TEXT NOT NULL,
     customer_tone VARCHAR(20) NOT NULL CHECK (customer_tone IN ('calm', 'frustrated', 'angry', 'confused', 'urgent')),
     
     -- Triage Results
     priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
+    category VARCHAR(50) DEFAULT 'general',
     confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
     response_approach TEXT,
     talking_points JSONB,
     knowledge_base_articles JSONB,
+    metadata JSONB,
     
     -- Audit and Security Fields
     csr_agent VARCHAR(50) NOT NULL,
     ip_address INET,
     user_agent TEXT,
     session_id VARCHAR(100),
     
     -- Timestamps
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     processed_at TIMESTAMPTZ NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Create indexes for performance
 CREATE INDEX IF NOT EXISTS idx_reports_report_id ON reports(report_id);
 CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
 CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
+CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
 CREATE INDEX IF NOT EXISTS idx_reports_csr_agent ON reports(csr_agent);
+CREATE INDEX IF NOT EXISTS idx_reports_customer_tone ON reports(customer_tone);

@@ .. @@