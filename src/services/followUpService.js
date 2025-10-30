import { supabase } from './supabaseClient.js';
import { isGuestDemoMode } from './sessionState.js';
import { fetchDemoData } from './demoApiClient.js';

export class FollowUpService {
  async scheduleFollowUp(ticketId, followUpType, delayHours = 24) {
    if (isGuestDemoMode()) {
      throw new Error('Follow-up scheduling is disabled in demo mode.');
    }
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + delayHours);

    const templates = {
      check_in: 'Hi {{customer_name}}, we wanted to check in on ticket #{{ticket_number}}. How are things going? Do you need any additional assistance?',
      resolution_confirm: 'Hi {{customer_name}}, we believe we have resolved ticket #{{ticket_number}}. Can you confirm that everything is working as expected?',
      satisfaction_survey: 'Hi {{customer_name}}, thank you for your patience with ticket #{{ticket_number}}. We would love to hear your feedback on how we handled your request.'
    };

    const { data, error } = await supabase
      .from('ticket_follow_ups')
      .insert({
        ticket_id: ticketId,
        scheduled_for: scheduledFor.toISOString(),
        follow_up_type: followUpType,
        message_template: templates[followUpType] || templates.check_in,
        completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error scheduling follow-up:', error);
      throw error;
    }

    return data;
  }

  async getPendingFollowUps() {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('follow-ups');
      if (error) {
        console.error('Error loading demo follow-ups:', error);
        return [];
      }
      return data?.pending || [];
    }
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('ticket_follow_ups')
      .select(`
        *,
        ticket:tickets(
          *,
          customer:customers(name, email)
        )
      `)
      .eq('completed', false)
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error loading pending follow-ups:', error);
      return [];
    }

    return data || [];
  }

  async getUpcomingFollowUps(limit = 10) {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('follow-ups');
      if (error) {
        console.error('Error loading demo follow-ups:', error);
        return [];
      }
      const upcoming = data?.upcoming || [];
      return upcoming.slice(0, limit);
    }
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('ticket_follow_ups')
      .select(`
        *,
        ticket:tickets(
          *,
          customer:customers(name, email)
        )
      `)
      .eq('completed', false)
      .gt('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading upcoming follow-ups:', error);
      return [];
    }

    return data || [];
  }

  async executeFollowUp(followUpId) {
    if (isGuestDemoMode()) {
      throw new Error('Executing follow-ups is disabled in demo mode.');
    }
    const { data: followUp, error: fetchError } = await supabase
      .from('ticket_follow_ups')
      .select(`
        *,
        ticket:tickets(
          *,
          customer:customers(name, email)
        )
      `)
      .eq('id', followUpId)
      .single();

    if (fetchError || !followUp) {
      throw new Error('Follow-up not found');
    }

    const message = this.interpolateTemplate(
      followUp.message_template,
      {
        customer_name: followUp.ticket.customer?.name || 'Customer',
        ticket_number: followUp.ticket.ticket_number
      }
    );

    await this.sendFollowUpMessage(
      followUp.ticket.customer?.email,
      followUp.ticket.ticket_number,
      message
    );

    const { error: updateError } = await supabase
      .from('ticket_follow_ups')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', followUpId);

    if (updateError) {
      throw updateError;
    }

    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: followUp.ticket_id,
        sender_type: 'system',
        message: `Automated follow-up sent: ${followUp.follow_up_type}`,
        channel: 'email'
      });

    return { success: true, message };
  }

  async sendFollowUpMessage(email, ticketNumber, message) {
    console.log(`Sending follow-up to ${email} for ticket ${ticketNumber}:`, message);
  }

  interpolateTemplate(template, variables) {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  async cancelFollowUp(followUpId) {
    if (isGuestDemoMode()) {
      throw new Error('Canceling follow-ups is disabled in demo mode.');
    }
    const { error } = await supabase
      .from('ticket_follow_ups')
      .delete()
      .eq('id', followUpId);

    if (error) {
      console.error('Error canceling follow-up:', error);
      throw error;
    }
  }

  async autoScheduleFollowUps() {
    if (isGuestDemoMode()) {
      return;
    }
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .in('status', ['open', 'in_progress', 'waiting_customer'])
      .is('resolved_at', null);

    if (error) {
      console.error('Error loading tickets for auto-scheduling:', error);
      return;
    }

    for (const ticket of tickets || []) {
      const createdAt = new Date(ticket.created_at);
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      const { data: existingFollowUps } = await supabase
        .from('ticket_follow_ups')
        .select('id')
        .eq('ticket_id', ticket.id)
        .eq('completed', false);

      if (existingFollowUps && existingFollowUps.length > 0) {
        continue;
      }

      if (hoursSinceCreation >= 48 && ticket.status === 'open') {
        await this.scheduleFollowUp(ticket.id, 'check_in', 0);
      } else if (ticket.status === 'waiting_customer' && hoursSinceCreation >= 72) {
        await this.scheduleFollowUp(ticket.id, 'check_in', 0);
      }
    }

    const { data: resolvedTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'resolved')
      .gte('resolved_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    for (const ticket of resolvedTickets || []) {
      const { data: existingFollowUps } = await supabase
        .from('ticket_follow_ups')
        .select('id')
        .eq('ticket_id', ticket.id)
        .eq('follow_up_type', 'resolution_confirm')
        .eq('completed', false);

      if (!existingFollowUps || existingFollowUps.length === 0) {
        await this.scheduleFollowUp(ticket.id, 'resolution_confirm', 4);
      }
    }
  }

  async processPendingFollowUps() {
    const pending = await this.getPendingFollowUps();

    for (const followUp of pending) {
      try {
        await this.executeFollowUp(followUp.id);
      } catch (error) {
        console.error(`Failed to execute follow-up ${followUp.id}:`, error);
      }
    }

    return pending.length;
  }
}

export const followUpService = new FollowUpService();
