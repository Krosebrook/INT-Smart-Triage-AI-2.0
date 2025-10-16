// Advanced Ticket Assignment and Routing Engine
import { supabase } from './supabaseClient.js';

export class AssignmentEngine {
  constructor() {
    this.departments = {
      'Information Security': [
        'security',
        'compliance',
        'audit',
        'vulnerability',
      ],
      Technology: ['server', 'network', 'email', 'cloud', 'IT'],
      'Website Design': ['website', 'web', 'design', 'ecommerce'],
      Branding: ['logo', 'brand', 'identity', 'visual'],
      Content: ['content', 'writing', 'seo', 'blog'],
      Marketing: ['marketing', 'campaign', 'crm', 'hubspot'],
      Operations: ['bookkeeping', 'accounting', 'workflow', 'process'],
    };

    this.skillMatrix = {
      security_expert: ['Information Security'],
      it_specialist: ['Technology'],
      web_designer: ['Website Design'],
      brand_strategist: ['Branding'],
      content_writer: ['Content'],
      marketing_specialist: ['Marketing'],
      operations_manager: ['Operations'],
    };
  }

  async autoAssign(reportData) {
    const department = this.determineDepartment(reportData.issueDescription);
    const priority = reportData.priority;

    try {
      const availableCSRs = await this.getAvailableCSRs(department, priority);

      if (availableCSRs.length === 0) {
        return {
          success: false,
          error: 'No available CSRs',
          fallback: 'queue',
        };
      }

      const selectedCSR = this.selectBestCSR(availableCSRs, reportData);

      if (supabase) {
        await this.assignToCSR(reportData.reportId, selectedCSR);
      }

      return {
        success: true,
        assignedTo: selectedCSR.name,
        department,
        estimatedResponseTime: this.estimateResponseTime(
          priority,
          selectedCSR.workload
        ),
      };
    } catch (error) {
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  determineDepartment(issueDescription) {
    const lowerDesc = issueDescription.toLowerCase();
    let bestMatch = 'Technology';
    let maxScore = 0;

    Object.entries(this.departments).forEach(([dept, keywords]) => {
      const score = keywords.filter((kw) => lowerDesc.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = dept;
      }
    });

    return bestMatch;
  }

  async getAvailableCSRs(department = null, priority = 'medium') {
    if (!supabase) {
      return this.getMockCSRs(department);
    }

    try {
      let query = supabase
        .from('csr_profiles')
        .select('*')
        .eq('is_available', true);

      if (department) {
        query = query.contains('specialties', [department]);
      }

      const { data, error } = await query.order('current_workload', {
        ascending: true,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      
      return this.getMockCSRs(department);
    }
  }

  getMockCSRs(department) {
    const mockCSRs = [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@intinc.com',
        specialties: ['Information Security', 'Technology'],
        skill_level: 'expert',
        current_workload: 3,
        avg_resolution_time: 2.5,
        satisfaction_rating: 4.8,
        is_available: true,
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael.chen@intinc.com',
        specialties: ['Technology', 'Website Design'],
        skill_level: 'senior',
        current_workload: 5,
        avg_resolution_time: 3.2,
        satisfaction_rating: 4.6,
        is_available: true,
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@intinc.com',
        specialties: ['Marketing', 'Content'],
        skill_level: 'senior',
        current_workload: 2,
        avg_resolution_time: 2.8,
        satisfaction_rating: 4.9,
        is_available: true,
      },
    ];

    if (department) {
      return mockCSRs.filter((csr) => csr.specialties.includes(department));
    }

    return mockCSRs;
  }

  selectBestCSR(csrs, reportData) {
    const priority = reportData.priority;

    const scored = csrs.map((csr) => {
      let score = 100;

      score -= csr.current_workload * 10;

      score += csr.satisfaction_rating * 10;

      if (csr.skill_level === 'expert') score += 20;
      else if (csr.skill_level === 'senior') score += 10;

      score -= csr.avg_resolution_time * 5;

      if (priority === 'high' && csr.skill_level === 'expert') {
        score += 30;
      }

      return { csr, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored[0].csr;
  }

  async assignToCSR(reportId, csr) {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          assigned_to: csr.name,
          assigned_to_email: csr.email,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
        })
        .eq('report_id', reportId)
        .select();

      if (error) throw error;

      await supabase
        .from('csr_profiles')
        .update({
          current_workload: csr.current_workload + 1,
        })
        .eq('id', csr.id);

      await this.logAssignment(reportId, csr.name);

      return { success: true, data };
    } catch (error) {
      
      throw error;
    }
  }

  async logAssignment(reportId, csrName) {
    if (!supabase) return;

    try {
      await supabase.from('assignment_history').insert([
        {
          report_id: reportId,
          assigned_to: csrName,
          assigned_at: new Date().toISOString(),
          assignment_method: 'auto',
        },
      ]);
    } catch (error) {
      
    }
  }

  estimateResponseTime(priority, workload) {
    const baseMinutes = {
      high: 15,
      medium: 60,
      low: 240,
    };

    const base = baseMinutes[priority] || 60;
    const adjusted = base + workload * 10;

    return {
      minutes: adjusted,
      display:
        adjusted < 60
          ? `${adjusted} minutes`
          : `${Math.round(adjusted / 60)} hours`,
    };
  }

  async reassignTicket(reportId, newCSRName, reason) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('assigned_to')
        .eq('report_id', reportId)
        .single();

      if (fetchError) throw fetchError;

      const oldCSRName = report.assigned_to;

      const { data, error } = await supabase
        .from('reports')
        .update({
          assigned_to: newCSRName,
          updated_at: new Date().toISOString(),
        })
        .eq('report_id', reportId)
        .select();

      if (error) throw error;

      await supabase.from('assignment_history').insert([
        {
          report_id: reportId,
          assigned_to: newCSRName,
          assigned_from: oldCSRName,
          reassignment_reason: reason,
          assigned_at: new Date().toISOString(),
          assignment_method: 'manual',
        },
      ]);

      return { success: true, data };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  async getWorkloadDistribution() {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('csr_profiles')
        .select('name, current_workload, specialties');

      if (error) throw error;

      return {
        success: true,
        distribution: data.map((csr) => ({
          name: csr.name,
          workload: csr.current_workload,
          specialties: csr.specialties,
          capacity: Math.max(0, 10 - csr.current_workload),
        })),
      };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  async escalateTicket(reportId, escalationReason) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Validate ticket exists and current state
      const { data: existingReport, error: fetchError } = await supabase
        .from('reports')
        .select('status, priority, escalated_at')
        .eq('report_id', reportId)
        .single();

      if (fetchError) throw fetchError;

      if (existingReport.status === 'resolved') {
        return {
          success: false,
          error: 'Cannot escalate a resolved ticket',
        };
      }

      if (existingReport.escalated_at) {
        return {
          success: false,
          error: 'Ticket has already been escalated',
        };
      }

      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'escalated',
          priority: 'high',
          escalated_at: new Date().toISOString(),
          escalation_reason: escalationReason,
        })
        .eq('report_id', reportId)
        .select();

      if (error) throw error;

      const supervisors = await this.getSupervisors();
      if (supervisors.length > 0) {
        await this.assignToCSR(reportId, supervisors[0]);
      }

      return { success: true, data };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  async getSupervisors() {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('csr_profiles')
        .select('*')
        .eq('role', 'supervisor')
        .eq('is_available', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      
      return [];
    }
  }
}

export const assignmentEngine = new AssignmentEngine();
export default assignmentEngine;
