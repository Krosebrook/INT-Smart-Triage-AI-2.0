// Supabase client for INT Smart Triage AI 2.0
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Database features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Save triage report to database
export async function saveTriageReport(reportData) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database save.');
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .insert([{
                report_id: reportData.reportId,
                customer_name: reportData.customerName,
                ticket_subject: reportData.ticketSubject,
                issue_description: reportData.issueDescription,
                customer_tone: reportData.customerTone,
                priority: reportData.priority,
                category: reportData.category || 'general',
                confidence_score: parseFloat(reportData.confidence),
                response_approach: reportData.responseApproach,
                talking_points: reportData.talkingPoints,
                knowledge_base_articles: reportData.knowledgeBase,
                metadata: {
                    department: reportData.department,
                    analysis: reportData.analysis
                },
                csr_agent: reportData.csrAgent || 'Unknown',
                processed_at: new Date().toISOString(),
                status: 'new'
            }])
            .select();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error saving to database:', error);
        return { success: false, error: error.message };
    }
}

// Get all reports for a specific customer
export async function getCustomerReports(customerName) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .ilike('customer_name', `%${customerName}%`)
            .order('created_at', { ascending: false });

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
        return { success: false, error: 'Database not configured' };
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
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        let queryBuilder = supabase
            .from('reports')
            .select('*');

        // Apply search query
        if (query) {
            queryBuilder = queryBuilder.or(`customer_name.ilike.%${query}%,ticket_subject.ilike.%${query}%,issue_description.ilike.%${query}%`);
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

        queryBuilder = queryBuilder.order('created_at', { ascending: false }).limit(100);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return { success: true, data, count: data.length };
    } catch (error) {
        console.error('Error searching reports:', error);
        return { success: false, error: error.message };
    }
}

// Get statistics
export async function getReportStats() {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .select('priority, category, customer_tone, created_at');

        if (error) throw error;

        // Calculate stats
        const stats = {
            total: data.length,
            byPriority: {
                high: data.filter(r => r.priority === 'high').length,
                medium: data.filter(r => r.priority === 'medium').length,
                low: data.filter(r => r.priority === 'low').length
            },
            byCategory: {},
            byTone: {},
            recentCount: data.filter(r => {
                const created = new Date(r.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return created > dayAgo;
            }).length
        };

        // Count by category
        data.forEach(r => {
            stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
            stats.byTone[r.customer_tone] = (stats.byTone[r.customer_tone] || 0) + 1;
        });

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { success: false, error: error.message };
    }
}

export async function updateReportStatus(reportId, status) {
    if (!supabase) {
        return { success: false, error: 'Database not configured' };
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
