/**
 * Advanced Ticket Assignment and Routing Engine
 *
 * This engine automatically assigns incoming support tickets to the most appropriate
 * Customer Service Representative (CSR) based on department expertise, workload,
 * skill level, and ticket priority.
 *
 * @module AssignmentEngine
 * @since 1.0.0
 */

import { supabase } from './supabaseClient.js';

/**
 * Assignment Engine for intelligent ticket routing and CSR workload management.
 *
 * Features:
 * - Department-based routing using keyword matching
 * - Skill-based CSR selection
 * - Workload balancing
 * - Priority-aware assignment
 * - Ticket reassignment and escalation
 *
 * @class AssignmentEngine
 */
export class AssignmentEngine {
  /**
   * Initialize the Assignment Engine with department keywords and skill matrix.
   *
   * @constructor
   */
  constructor() {
    /**
     * Department keyword mapping for intelligent routing.
     * Each department is mapped to an array of keywords used for categorization.
     *
     * @type {Object.<string, string[]>}
     * @private
     */
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

    /**
     * Skill matrix mapping CSR roles to their department specialties.
     * Used for matching tickets with qualified CSRs.
     *
     * @type {Object.<string, string[]>}
     * @private
     */
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

  /**
   * Automatically assign a report to the best available CSR.
   *
   * This method determines the appropriate department, finds available CSRs,
   * scores them based on multiple factors, and assigns the ticket to the
   * highest-scoring CSR.
   *
   * @async
   * @param {Object} reportData - The report/ticket data to be assigned
   * @param {string} reportData.issueDescription - Description of the issue
   * @param {string} reportData.priority - Priority level (high/medium/low)
   * @param {string} reportData.reportId - Unique report identifier
   * @returns {Promise<Object>} Assignment result
   * @returns {boolean} return.success - Whether assignment was successful
   * @returns {string} [return.assignedTo] - Name of assigned CSR
   * @returns {string} [return.department] - Assigned department
   * @returns {Object} [return.estimatedResponseTime] - Expected response time
   * @returns {string} [return.error] - Error message if assignment failed
   *
   * @example
   * const result = await assignmentEngine.autoAssign({
   *   issueDescription: "Security breach detected",
   *   priority: "high",
   *   reportId: "TR-12345"
   * });
   */
  async autoAssign(reportData) {
    // Validate input
    if (!reportData || !reportData.issueDescription) {
      return {
        success: false,
        error: 'Invalid report data: issueDescription is required',
      };
    }

    const department = this.determineDepartment(reportData.issueDescription);
    const priority = reportData.priority || 'medium';

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

  /**
   * Determine the most appropriate department for a ticket based on issue description.
   *
   * Uses keyword matching to score each department and returns the department
   * with the highest number of matching keywords.
   *
   * @param {string} issueDescription - The description of the issue
   * @returns {string} The name of the best-matching department
   *
   * @example
   * const dept = engine.determineDepartment("Need help with server backup");
   * // Returns: "Technology"
   */
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

  /**
   * Retrieve available CSRs, optionally filtered by department.
   *
   * Queries the database for CSRs who are currently available and have the
   * specified department specialty. Returns mock data if database is not available.
   *
   * @async
   * @param {string|null} [department=null] - Department specialty to filter by
   * @param {string} [priority='medium'] - Priority level (currently unused but reserved for future priority-based filtering)
   * @returns {Promise<Array<Object>>} Array of available CSR objects
   * @returns {number} return[].id - CSR unique identifier
   * @returns {string} return[].name - CSR full name
   * @returns {string} return[].email - CSR email address
   * @returns {string[]} return[].specialties - Array of department specialties
   * @returns {string} return[].skill_level - Skill level (expert/senior/junior)
   * @returns {number} return[].current_workload - Number of currently assigned tickets
   * @returns {number} return[].avg_resolution_time - Average hours to resolve tickets
   * @returns {number} return[].satisfaction_rating - Customer satisfaction rating (0-5)
   *
   * @example
   * const csrs = await engine.getAvailableCSRs('Technology', 'high');
   */
  async getAvailableCSRs(department = null, _priority = 'medium') {
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

  /**
   * Get mock CSR data for testing or fallback when database is unavailable.
   *
   * @private
   * @param {string|null} department - Department to filter CSRs by
   * @returns {Array<Object>} Array of mock CSR objects
   */
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

  /**
   * Select the best CSR from available candidates using a scoring algorithm.
   *
   * Scoring factors:
   * - Base score: 100 points
   * - Current workload: -10 points per ticket
   * - Satisfaction rating: +10 points per rating point
   * - Skill level: +20 (expert) or +10 (senior)
   * - Average resolution time: -5 points per hour
   * - High priority with expert: +30 bonus points
   *
   * @param {Array<Object>} csrs - Array of available CSR objects
   * @param {Object} reportData - Report data for context
   * @param {string} reportData.priority - Priority level of the ticket
   * @returns {Object} The highest-scoring CSR object
   *
   * @example
   * const bestCSR = engine.selectBestCSR(availableCSRs, { priority: 'high' });
   */
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

  /**
   * Assign a report to a specific CSR in the database.
   *
   * Updates the report with assignment details and increments the CSR's workload.
   * Logs the assignment to the assignment history table.
   *
   * @async
   * @param {string} reportId - Unique report identifier
   * @param {Object} csr - CSR object to assign to
   * @param {string} csr.name - CSR name
   * @param {string} csr.email - CSR email
   * @param {number} csr.id - CSR database ID
   * @param {number} csr.current_workload - Current number of assigned tickets
   * @returns {Promise<Object>} Assignment result
   * @returns {boolean} return.success - Whether assignment succeeded
   * @returns {Object} [return.data] - Updated report data
   *
   * @throws {Error} If database operation fails
   */
  async assignToCSR(reportId, csr) {
    if (!supabase) return;

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
  }

  /**
   * Log an assignment to the assignment history table for audit trail.
   *
   * @async
   * @private
   * @param {string} reportId - Unique report identifier
   * @param {string} csrName - Name of assigned CSR
   * @returns {Promise<void>}
   */
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
      // Silent fail - logging assignment failure is non-critical
    }
  }

  /**
   * Estimate response time based on priority and CSR workload.
   *
   * Base times by priority:
   * - High: 15 minutes
   * - Medium: 60 minutes
   * - Low: 240 minutes (4 hours)
   *
   * Adjusted by adding 10 minutes per ticket in CSR's workload.
   *
   * @param {string} priority - Priority level (high/medium/low)
   * @param {number} workload - Current number of tickets assigned to CSR
   * @returns {Object} Response time estimate
   * @returns {number} return.minutes - Estimated minutes to first response
   * @returns {string} return.display - Human-readable time estimate
   *
   * @example
   * const estimate = engine.estimateResponseTime('high', 3);
   * // Returns: { minutes: 45, display: "45 minutes" }
   */
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

  /**
   * Reassign a ticket from one CSR to another.
   *
   * Used for load balancing, escalation, or when a CSR requests reassignment.
   * Logs the reassignment with reason to the assignment history.
   *
   * @async
   * @param {string} reportId - Unique report identifier
   * @param {string} newCSRName - Name of the CSR to reassign to
   * @param {string} reason - Reason for reassignment
   * @returns {Promise<Object>} Reassignment result
   * @returns {boolean} return.success - Whether reassignment succeeded
   * @returns {Object} [return.data] - Updated report data
   * @returns {string} [return.error] - Error message if reassignment failed
   *
   * @example
   * const result = await engine.reassignTicket(
   *   'TR-12345',
   *   'John Smith',
   *   'Original CSR unavailable'
   * );
   */
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

  /**
   * Get current workload distribution across all CSRs.
   *
   * Useful for dashboards and load balancing decisions.
   *
   * @async
   * @returns {Promise<Object>} Workload distribution result
   * @returns {boolean} return.success - Whether query succeeded
   * @returns {Array<Object>} [return.distribution] - Array of CSR workload data
   * @returns {string} return.distribution[].name - CSR name
   * @returns {number} return.distribution[].workload - Current number of tickets
   * @returns {string[]} return.distribution[].specialties - CSR specialties
   * @returns {number} return.distribution[].capacity - Remaining capacity (max 10 - current)
   * @returns {string} [return.error] - Error message if query failed
   *
   * @example
   * const distribution = await engine.getWorkloadDistribution();
   */
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

  /**
   * Escalate a ticket to high priority and assign to a supervisor.
   *
   * Validates that the ticket exists, is not already resolved, and hasn't been
   * escalated previously. Updates priority to high, marks as escalated, and
   * reassigns to an available supervisor.
   *
   * @async
   * @param {string} reportId - Unique report identifier
   * @param {string} escalationReason - Reason for escalation
   * @returns {Promise<Object>} Escalation result
   * @returns {boolean} return.success - Whether escalation succeeded
   * @returns {Object} [return.data] - Updated report data
   * @returns {string} [return.error] - Error message if escalation failed
   *
   * @example
   * const result = await engine.escalateTicket(
   *   'TR-12345',
   *   'Customer threatening legal action'
   * );
   */
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

  /**
   * Get list of available supervisors for escalated tickets.
   *
   * @async
   * @private
   * @returns {Promise<Array<Object>>} Array of available supervisor CSR objects
   */
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

/**
 * Singleton instance of the Assignment Engine.
 *
 * @type {AssignmentEngine}
 * @example
 * import { assignmentEngine } from './assignmentEngine.js';
 * const result = await assignmentEngine.autoAssign(reportData);
 */
export const assignmentEngine = new AssignmentEngine();

export default assignmentEngine;
