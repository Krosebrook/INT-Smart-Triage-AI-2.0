// Supabase client for INT Smart Triage AI 2.0
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Database features will operate in mock mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const fallbackReports = [
    {
        report_id: 'R-1001',
        customer_name: 'Acme Corporation',
        ticket_subject: 'API integration returning 500 errors',
        issue_description: 'Production environment is intermittently returning 500 errors when calling /api/users.',
        status: 'new',
        priority: 'high',
        customer_tone: 'urgent',
        category: 'technical',
        created_at: '2024-07-15T09:12:00Z',
        csr_agent: 'Sarah Johnson',
        assigned_to: 'sarah.johnson@intinc.com',
        metadata: { department: 'Engineering' },
        confidence_score: 92
    },
    {
        report_id: 'R-1002',
        customer_name: 'Acme Corporation',
        ticket_subject: 'Billing discrepancy for July invoice',
        issue_description: 'Invoice shows $5,500 but contract rate is $4,500. Need correction before payment.',
        status: 'in_progress',
        priority: 'medium',
        customer_tone: 'frustrated',
        category: 'billing',
        created_at: '2024-07-12T14:25:00Z',
        csr_agent: 'Mike Chen',
        assigned_to: 'mike.chen@intinc.com',
        metadata: { department: 'Finance' },
        confidence_score: 88
    },
    {
        report_id: 'R-1003',
        customer_name: 'TechStart Inc',
        ticket_subject: 'Add additional user seats',
        issue_description: 'Requesting 5 new enterprise seats before quarterly review.',
        status: 'waiting_customer',
        priority: 'low',
        customer_tone: 'calm',
        category: 'account',
        created_at: '2024-07-11T11:10:00Z',
        csr_agent: 'Emma Williams',
        assigned_to: 'emma.williams@intinc.com',
        metadata: { department: 'Account Management' },
        confidence_score: 76
    },
    {
        report_id: 'R-1004',
        customer_name: 'Global Enterprises',
        ticket_subject: 'Onboarding automation failing for EU accounts',
        issue_description: 'Automation script fails for EU tenants due to missing GDPR consent flag.',
        status: 'resolved',
        priority: 'high',
        customer_tone: 'confused',
        category: 'technical',
        created_at: '2024-07-09T08:45:00Z',
        resolved_at: '2024-07-10T16:30:00Z',
        csr_agent: 'Sarah Johnson',
        assigned_to: 'sarah.johnson@intinc.com',
        metadata: { department: 'Engineering' },
        confidence_score: 95
    },
    {
        report_id: 'R-1005',
        customer_name: 'Northwind Traders',
        ticket_subject: 'Security review follow-up',
        issue_description: 'Need confirmation that the SOC 2 audit findings have been remediated.',
        status: 'closed',
        priority: 'medium',
        customer_tone: 'calm',
        category: 'security',
        created_at: '2024-07-05T15:05:00Z',
        resolved_at: '2024-07-07T10:15:00Z',
        csr_agent: 'Mike Chen',
        assigned_to: 'mike.chen@intinc.com',
        metadata: { department: 'Security' },
        confidence_score: 82
    }
];

function normalizeStatusFilter(statusFilter) {
    if (!statusFilter) {
        return [];
    }

    if (Array.isArray(statusFilter)) {
        return statusFilter.filter(Boolean);
    }

    if (typeof statusFilter === 'string') {
        return statusFilter
            .split(',')
            .map(status => status.trim())
            .filter(Boolean);
    }

    return [];
}

function applyStatusFilter(queryBuilder, statuses) {
    if (!statuses || statuses.length === 0) {
        return queryBuilder;
    }

    if (statuses.length === 1) {
        return queryBuilder.eq('status', statuses[0]);
    }

    return queryBuilder.in('status', statuses);
}

function filterReportsLocally(reports, filters, sanitizedQuery, statuses) {
    return reports
        .filter(report => {
            if (sanitizedQuery) {
                const haystack = [
                    report.customer_name,
                    report.ticket_subject,
                    report.issue_description
                ]
                    .join(' ')
                    .toLowerCase();

                if (!haystack.includes(sanitizedQuery.toLowerCase())) {
                    return false;
                }
            }

            if (statuses.length > 0 && !statuses.includes(report.status)) {
                return false;
            }

            if (filters.priority && report.priority !== filters.priority) {
                return false;
            }

            if (filters.category && report.category !== filters.category) {
                return false;
            }

            if (filters.customerTone && report.customer_tone !== filters.customerTone) {
                return false;
            }

            if (filters.assignedTo) {
                const assigned = report.assigned_to || report.csr_agent || '';
                if (!assigned.toLowerCase().includes(filters.assignedTo.toLowerCase())) {
                    return false;
                }
            }

            if (filters.dateFrom && new Date(report.created_at) < new Date(filters.dateFrom)) {
                return false;
            }

            if (filters.dateTo && new Date(report.created_at) > new Date(filters.dateTo)) {
                return false;
            }

            return true;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 100);
}

// Save triage report to database via secure serverless endpoint
export async function saveTriageReport(reportData) {
    try {
        const response = await fetch('/api/report-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ report: reportData })
        });

        const payload = await response.json();

        if (!response.ok) {
            const errorMessage = payload?.message || 'Failed to submit triage report';
            console.error('Report submission failed:', payload);
            return {
                success: false,
                error: errorMessage,
                details: payload?.details || null
            };
        }

        return { success: true, data: payload };
    } catch (error) {
        console.error('Error submitting report via API:', error);
        return { success: false, error: error.message };
    }
}

// Get all reports for a specific customer
export async function getCustomerReports(customerName, options = {}) {
    const statuses = normalizeStatusFilter(options.statuses || options.status);

    if (!supabase) {
        const normalizedName = customerName?.trim().toLowerCase() || '';
        const filtered = filterReportsLocally(
            fallbackReports.filter(report =>
                !normalizedName || report.customer_name.toLowerCase().includes(normalizedName)
            ),
            {},
            '',
            statuses
        );

        return { success: true, data: filtered, count: filtered.length, source: 'mock' };
    }

    try {
        let queryBuilder = supabase
            .from('reports')
            .select('*')
            .ilike('customer_name', `%${customerName}%`)
            .order('created_at', { ascending: false });

        queryBuilder = applyStatusFilter(queryBuilder, statuses);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return { success: true, data, count: data.length };
    } catch (error) {
        console.error('Error fetching customer reports:', error);
        return { success: false, error: error.message };
    }
}

// Get a single report by report_id
export async function getReportById(reportId) {
    if (!supabase) {
        const report = fallbackReports.find(item => item.report_id === reportId);
        if (!report) {
            return { success: false, error: 'Report not found in mock dataset' };
        }

        return { success: true, data: report, source: 'mock' };
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('report_id', reportId)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching report:', error);
        return { success: false, error: error.message };
    }
}

// Search reports
export async function searchReports(query, filters = {}) {
    // Sanitize query input to prevent SQL injection
    const sanitizedQuery = query?.trim().replace(/[%_]/g, '\\$&') || '';
    const statuses = normalizeStatusFilter(filters.statuses || filters.status);

    if (!supabase) {
        const filtered = filterReportsLocally(fallbackReports, filters, sanitizedQuery, statuses);
        return { success: true, data: filtered, count: filtered.length, source: 'mock' };
    }

    try {
        let queryBuilder = supabase
            .from('reports')
            .select('*');

        // Apply search query
        if (sanitizedQuery) {
            queryBuilder = queryBuilder.or(
                `customer_name.ilike.%${sanitizedQuery}%,` +
                `ticket_subject.ilike.%${sanitizedQuery}%,` +
                `issue_description.ilike.%${sanitizedQuery}%`
            );
        }

        // Apply filters
        if (filters.priority) {
            queryBuilder = queryBuilder.eq('priority', filters.priority);
        }
        if (filters.category) {
            queryBuilder = queryBuilder.eq('category', filters.category);
        }
        if (filters.customerTone) {
            queryBuilder = queryBuilder.eq('customer_tone', filters.customerTone);
        }
        if (filters.dateFrom) {
            queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
        }
        if (filters.assignedTo) {
            queryBuilder = queryBuilder.ilike('assigned_to', `%${filters.assignedTo}%`);
        }

        queryBuilder = applyStatusFilter(queryBuilder, statuses)
            .order('created_at', { ascending: false })
            .limit(100);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return { success: true, data, count: data.length };
    } catch (error) {
        console.error('Error searching reports:', error);
        return { success: false, error: error.message };
    }
}

// Get statistics
export async function getReportStats(options = {}) {
    const statuses = normalizeStatusFilter(options.statuses || options.status);

    const computeStats = (collection) => {
        const filtered = statuses.length ? collection.filter(item => statuses.includes(item.status)) : collection;

        const stats = {
            total: filtered.length,
            byPriority: {
                high: filtered.filter(r => r.priority === 'high').length,
                medium: filtered.filter(r => r.priority === 'medium').length,
                low: filtered.filter(r => r.priority === 'low').length
            },
            byCategory: {},
            byTone: {},
            recentCount: filtered.filter(r => {
                const created = new Date(r.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return created > dayAgo;
            }).length
        };

        filtered.forEach(r => {
            stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
            stats.byTone[r.customer_tone] = (stats.byTone[r.customer_tone] || 0) + 1;
        });

        return stats;
    };

    if (!supabase) {
        return { success: true, data: computeStats(fallbackReports), source: 'mock' };
    }

    try {
        let queryBuilder = supabase
            .from('reports')
            .select('priority, category, customer_tone, created_at, status');

        queryBuilder = applyStatusFilter(queryBuilder, statuses);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return { success: true, data: computeStats(data) };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { success: false, error: error.message };
    }
}

export async function updateReportStatus(reportId, status) {
    if (!supabase) {
        const report = fallbackReports.find(item => item.report_id === reportId);
        if (!report) {
            return { success: false, error: 'Report not found in mock dataset' };
        }

        report.status = status;
        report.updated_at = new Date().toISOString();
        if (status === 'resolved') {
            report.resolved_at = new Date().toISOString();
        }

        return { success: true, data: [report], source: 'mock' };
    }

    try {
        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'resolved') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('reports')
            .update(updateData)
            .eq('report_id', reportId)
            .select();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error updating report status:', error);
        return { success: false, error: error.message };
    }
}

export async function getNotes(reportId) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('report_notes')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching notes:', error);
        return { success: false, error: error.message };
    }
}

export async function addNote(reportId, noteText, csrAgent) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('report_notes')
            .insert([{
                report_id: reportId,
                note_text: noteText,
                csr_agent: csrAgent
            }])
            .select();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error adding note:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteNote(noteId) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { error } = await supabase
            .from('report_notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting note:', error);
        return { success: false, error: error.message };
    }
}

export async function assignReport(reportId, assignedTo) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .update({
                assigned_to: assignedTo,
                assigned_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('report_id', reportId)
            .select();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error assigning report:', error);
        return { success: false, error: error.message };
    }
}

export async function getAvailableCSRs() {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('csr_profiles')
            .select('*')
            .eq('is_available', true)
            .order('current_workload', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching CSRs:', error);
        return { success: false, error: error.message };
    }
}

export async function autoAssignReport(reportId) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .rpc('auto_assign_report', { report_id: reportId });

        if (error) throw error;

        return { success: true, assignedTo: data };
    } catch (error) {
        console.error('Error auto-assigning report:', error);
        return { success: false, error: error.message };
    }
}

export async function getSuggestedResponses(issueDescription, category) {
    const keywords = issueDescription.toLowerCase();
    const suggestions = [];

    if (keywords.includes('password') || keywords.includes('login')) {
        suggestions.push({
            title: 'Password Reset',
            template: 'I understand you\'re having trouble accessing your account. I\'ll help you reset your password right away. Please check your email for a password reset link.',
            confidence: 95
        });
    }

    if (keywords.includes('slow') || keywords.includes('performance')) {
        suggestions.push({
            title: 'Performance Issue',
            template: 'Thank you for reporting this performance issue. Let me help optimize your experience. Can you tell me which specific features are running slowly?',
            confidence: 88
        });
    }

    if (keywords.includes('billing') || keywords.includes('charge')) {
        suggestions.push({
            title: 'Billing Inquiry',
            template: 'I\'ll be happy to help you with your billing question. Let me review your account details and provide you with a clear explanation.',
            confidence: 92
        });
    }

    if (suggestions.length === 0) {
        suggestions.push({
            title: 'General Support',
            template: 'Thank you for contacting us. I\'m here to help resolve your issue. Let me review the details and get back to you with a solution.',
            confidence: 75
        });
    }

    return { success: true, suggestions };
}

export async function searchKnowledgeBase(query, category) {
    if (!supabase) {
        return { success: false, articles: [] };
    }

    const keywords = query.toLowerCase();
    const mockArticles = [
        {
            id: '1',
            title: 'How to Reset Your Password',
            category: 'Account Access',
            relevance: keywords.includes('password') || keywords.includes('login') ? 95 : 20,
            url: '/kb/password-reset'
        },
        {
            id: '2',
            title: 'Understanding Billing and Subscriptions',
            category: 'Billing Question',
            relevance: keywords.includes('billing') || keywords.includes('charge') ? 90 : 15,
            url: '/kb/billing-guide'
        },
        {
            id: '3',
            title: 'Troubleshooting Performance Issues',
            category: 'Technical Issue',
            relevance: keywords.includes('slow') || keywords.includes('performance') ? 88 : 25,
            url: '/kb/performance'
        },
        {
            id: '4',
            title: 'API Integration Guide',
            category: 'Technical Issue',
            relevance: keywords.includes('api') || keywords.includes('integration') ? 92 : 10,
            url: '/kb/api-guide'
        }
    ];

    const filtered = mockArticles
        .filter(a => !category || a.category === category)
        .filter(a => a.relevance > 30)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);

    return { success: true, articles: filtered };
}
