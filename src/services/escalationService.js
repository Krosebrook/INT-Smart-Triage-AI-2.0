import { supabase } from './supabaseClient.js';

export class EscalationService {
  constructor() {
    this.escalationRules = {
      sentiment: -0.6,
      urgentKeywords: ['urgent', 'critical', 'emergency', 'asap', 'immediately'],
      highValueThreshold: 50000,
      unresponsiveHours: 48
    };
  }

  async analyzeTicketForEscalation(ticketId) {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customers(*),
        messages:ticket_messages(*)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      console.error('Error loading ticket for escalation analysis:', error);
      return null;
    }

    const reasons = [];
    let shouldEscalate = false;

    if (ticket.sentiment_score !== null && ticket.sentiment_score <= this.escalationRules.sentiment) {
      reasons.push('Negative customer sentiment detected');
      shouldEscalate = true;
    }

    const hasUrgentKeywords = this.escalationRules.urgentKeywords.some(keyword =>
      ticket.subject?.toLowerCase().includes(keyword) ||
      ticket.description?.toLowerCase().includes(keyword)
    );

    if (hasUrgentKeywords && ticket.priority !== 'urgent') {
      reasons.push('Urgent language detected in ticket');
      shouldEscalate = true;
    }

    if (ticket.customer?.account_value >= this.escalationRules.highValueThreshold && ticket.priority !== 'urgent') {
      reasons.push('High-value customer requires attention');
      shouldEscalate = true;
    }

    if (ticket.customer?.at_risk) {
      reasons.push('At-risk customer account');
      shouldEscalate = true;
    }

    const createdAt = new Date(ticket.created_at);
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation >= this.escalationRules.unresponsiveHours && ticket.status === 'open') {
      reasons.push('Ticket unresponsive for over 48 hours');
      shouldEscalate = true;
    }

    const csrMessages = ticket.messages?.filter(m => m.sender_type === 'csr') || [];
    const customerMessages = ticket.messages?.filter(m => m.sender_type === 'customer') || [];

    if (customerMessages.length >= 3 && csrMessages.length === 0) {
      reasons.push('Multiple customer messages without CSR response');
      shouldEscalate = true;
    }

    return {
      shouldEscalate,
      reasons,
      ticket
    };
  }

  async findBestEscalationTarget(ticketCategory, currentAssignee) {
    const { data: seniorCSRs, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['senior_csr', 'manager'])
      .eq('availability_status', 'available')
      .neq('id', currentAssignee || '');

    if (error || !seniorCSRs || seniorCSRs.length === 0) {
      console.error('No available senior CSRs found');
      return null;
    }

    const matchingSpecialists = seniorCSRs.filter(csr =>
      csr.specializations?.includes(ticketCategory)
    );

    if (matchingSpecialists.length > 0) {
      return matchingSpecialists.sort((a, b) => {
        const aLoad = a.max_concurrent_tickets || 5;
        const bLoad = b.max_concurrent_tickets || 5;
        return bLoad - aLoad;
      })[0];
    }

    return seniorCSRs.sort((a, b) => {
      const aLoad = a.max_concurrent_tickets || 5;
      const bLoad = b.max_concurrent_tickets || 5;
      return bLoad - aLoad;
    })[0];
  }

  async createEscalation(ticketId, escalatedFrom, escalatedTo, reasons, aiDetected = false) {
    const { data, error } = await supabase
      .from('escalations')
      .insert({
        ticket_id: ticketId,
        escalated_from: escalatedFrom,
        escalated_to: escalatedTo,
        reason: reasons.join('; '),
        ai_detected: aiDetected,
        resolved: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating escalation:', error);
      throw error;
    }

    await supabase
      .from('tickets')
      .update({
        escalated: true,
        assigned_to: escalatedTo,
        priority: 'urgent'
      })
      .eq('id', ticketId);

    await this.notifyEscalation(data);

    return data;
  }

  async notifyEscalation(escalation) {
    console.log('Escalation notification:', escalation);
  }

  async autoEscalateIfNeeded(ticketId) {
    const analysis = await this.analyzeTicketForEscalation(ticketId);

    if (!analysis || !analysis.shouldEscalate) {
      return null;
    }

    const target = await this.findBestEscalationTarget(
      analysis.ticket.category,
      analysis.ticket.assigned_to
    );

    if (!target) {
      console.error('No escalation target available');
      return null;
    }

    return await this.createEscalation(
      ticketId,
      analysis.ticket.assigned_to,
      target.id,
      analysis.reasons,
      true
    );
  }

  async manualEscalate(ticketId, escalatedTo, reason) {
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user?.id) {
      throw new Error('User not authenticated');
    }

    return await this.createEscalation(
      ticketId,
      user.user.id,
      escalatedTo,
      [reason],
      false
    );
  }

  async resolveEscalation(escalationId) {
    const { error } = await supabase
      .from('escalations')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', escalationId);

    if (error) {
      console.error('Error resolving escalation:', error);
      throw error;
    }
  }

  async getActiveEscalations() {
    const { data, error } = await supabase
      .from('escalations')
      .select(`
        *,
        ticket:tickets(*),
        escalated_from_user:users!escalated_from(name, email),
        escalated_to_user:users!escalated_to(name, email)
      `)
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading escalations:', error);
      return [];
    }

    return data || [];
  }
}

export const escalationService = new EscalationService();
