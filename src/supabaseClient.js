// Supabase client for INT Smart Triage AI 2.0
import { createClient } from '@supabase/supabase-js';

// Support both Vite (import.meta.env) and Node.js (process.env) environments
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return process.env[key];
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  // Silently ignore errors - allows tests to run without environment variables
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Save triage report to database
export async function saveTriageReport(reportData) {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
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
            analysis: reportData.analysis,
          },
          csr_agent: reportData.csrAgent || 'Unknown',
          processed_at: new Date().toISOString(),
          status: 'new',
        },
      ])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
}

// Search reports
export async function searchReports(query, filters = {}) {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Sanitize query input to prevent SQL injection
    const sanitizedQuery = query?.trim().replace(/[%_]/g, '\\$&') || '';

    let queryBuilder = supabase.from('reports').select('*');

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
      queryBuilder = queryBuilder.ilike(
        'assigned_to',
        `%${filters.assignedTo}%`
      );
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .limit(100);

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return { success: true, data, count: data.length };
  } catch (error) {
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
        high: data.filter((r) => r.priority === 'high').length,
        medium: data.filter((r) => r.priority === 'medium').length,
        low: data.filter((r) => r.priority === 'low').length,
      },
      byCategory: {},
      byTone: {},
      recentCount: data.filter((r) => {
        const created = new Date(r.created_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return created > dayAgo;
      }).length,
    };

    // Count by category
    data.forEach((r) => {
      stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
      stats.byTone[r.customer_tone] = (stats.byTone[r.customer_tone] || 0) + 1;
    });

    return { success: true, data: stats };
  } catch (error) {
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
      updated_at: new Date().toISOString(),
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
      .insert([
        {
          report_id: reportId,
          note_text: noteText,
          csr_agent: csrAgent,
        },
      ])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
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
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', reportId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
}

export async function autoAssignReport(reportId) {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase.rpc('auto_assign_report', {
      report_id: reportId,
    });

    if (error) throw error;

    return { success: true, assignedTo: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSuggestedResponses(issueDescription, _category) {
  const keywords = issueDescription.toLowerCase();
  const suggestions = [];

  if (keywords.includes('password') || keywords.includes('login')) {
    suggestions.push({
      title: 'Password Reset',
      template:
        "I understand you're having trouble accessing your account. I'll help you reset your password right away. Please check your email for a password reset link.",
      confidence: 95,
    });
  }

  if (keywords.includes('slow') || keywords.includes('performance')) {
    suggestions.push({
      title: 'Performance Issue',
      template:
        'Thank you for reporting this performance issue. Let me help optimize your experience. Can you tell me which specific features are running slowly?',
      confidence: 88,
    });
  }

  if (keywords.includes('billing') || keywords.includes('charge')) {
    suggestions.push({
      title: 'Billing Inquiry',
      template:
        "I'll be happy to help you with your billing question. Let me review your account details and provide you with a clear explanation.",
      confidence: 92,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'General Support',
      template:
        "Thank you for contacting us. I'm here to help resolve your issue. Let me review the details and get back to you with a solution.",
      confidence: 75,
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
      relevance:
        keywords.includes('password') || keywords.includes('login') ? 95 : 20,
      url: '/kb/password-reset',
    },
    {
      id: '2',
      title: 'Understanding Billing and Subscriptions',
      category: 'Billing Question',
      relevance:
        keywords.includes('billing') || keywords.includes('charge') ? 90 : 15,
      url: '/kb/billing-guide',
    },
    {
      id: '3',
      title: 'Troubleshooting Performance Issues',
      category: 'Technical Issue',
      relevance:
        keywords.includes('slow') || keywords.includes('performance') ? 88 : 25,
      url: '/kb/performance',
    },
    {
      id: '4',
      title: 'API Integration Guide',
      category: 'Technical Issue',
      relevance:
        keywords.includes('api') || keywords.includes('integration') ? 92 : 10,
      url: '/kb/api-guide',
    },
  ];

  const filtered = mockArticles
    .filter((a) => !category || a.category === category)
    .filter((a) => a.relevance > 30)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  return { success: true, articles: filtered };
}
