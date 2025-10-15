// Multi-Channel Communication Hub
import { supabase } from './supabaseClient.js';

export class CommunicationHub {
    constructor() {
        this.channels = ['email', 'sms', 'slack', 'teams', 'phone', 'chat'];
        this.integrations = new Map();
    }

    async sendNotification(channel, recipient, message, options = {}) {
        const method = `send${channel.charAt(0).toUpperCase()}${channel.slice(1)}`;

        if (typeof this[method] === 'function') {
            return await this[method](recipient, message, options);
        }

        return {
            success: false,
            error: `Channel ${channel} not supported`
        };
    }

    async sendEmail(recipient, message, options = {}) {
        console.log('Sending email to:', recipient);

        return {
            success: true,
            channel: 'email',
            recipient,
            messageId: this.generateMessageId(),
            sentAt: new Date().toISOString()
        };
    }

    async sendSms(phoneNumber, message, options = {}) {
        console.log('Sending SMS to:', phoneNumber);

        if (!this.isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                error: 'Invalid phone number format'
            };
        }

        return {
            success: true,
            channel: 'sms',
            recipient: phoneNumber,
            messageId: this.generateMessageId(),
            sentAt: new Date().toISOString(),
            segments: Math.ceil(message.length / 160)
        };
    }

    async sendSlack(channel, message, options = {}) {
        console.log('Sending Slack message to:', channel);

        const payload = {
            channel: channel,
            text: message,
            username: options.username || 'INT Triage Bot',
            icon_emoji: options.icon || ':robot_face:',
            attachments: options.attachments || []
        };

        if (options.priority === 'high') {
            payload.attachments.push({
                color: 'danger',
                text: '⚠️ HIGH PRIORITY',
                footer: 'INT Smart Triage AI'
            });
        }

        return {
            success: true,
            channel: 'slack',
            recipient: channel,
            payload,
            messageId: this.generateMessageId(),
            sentAt: new Date().toISOString()
        };
    }

    async sendTeams(channelId, message, options = {}) {
        console.log('Sending Teams message to:', channelId);

        const card = {
            '@type': 'MessageCard',
            '@context': 'https://schema.org/extensions',
            summary: options.summary || 'New Triage Notification',
            themeColor: options.priority === 'high' ? 'FF0000' : '0078D7',
            title: options.title || 'INT Smart Triage AI',
            text: message,
            potentialAction: options.actions || []
        };

        return {
            success: true,
            channel: 'teams',
            recipient: channelId,
            card,
            messageId: this.generateMessageId(),
            sentAt: new Date().toISOString()
        };
    }

    async sendPhone(phoneNumber, message, options = {}) {
        console.log('Initiating phone call to:', phoneNumber);

        return {
            success: true,
            channel: 'phone',
            recipient: phoneNumber,
            callId: this.generateMessageId(),
            duration: 0,
            status: 'initiated',
            initiatedAt: new Date().toISOString()
        };
    }

    async sendChat(userId, message, options = {}) {
        console.log('Sending chat message to:', userId);

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .insert([{
                        user_id: userId,
                        message: message,
                        sender: 'system',
                        sent_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;

                return {
                    success: true,
                    channel: 'chat',
                    recipient: userId,
                    messageId: data[0].id,
                    sentAt: data[0].sent_at
                };
            } catch (error) {
                console.error('Chat send failed:', error);
                return { success: false, error: error.message };
            }
        }

        return {
            success: true,
            channel: 'chat',
            recipient: userId,
            messageId: this.generateMessageId(),
            sentAt: new Date().toISOString()
        };
    }

    async broadcastToTeam(message, priority = 'normal', excludeUsers = []) {
        console.log('Broadcasting to team:', { priority, excludeUsers });

        const channels = ['slack', 'teams', 'email'];
        const results = [];

        for (const channel of channels) {
            const result = await this.sendNotification(
                channel,
                'team-channel',
                message,
                { priority }
            );
            results.push({ channel, ...result });
        }

        return {
            success: true,
            broadcast: true,
            channels: results,
            sentAt: new Date().toISOString()
        };
    }

    async notifyHighPriorityTicket(ticketData) {
        const message = `
🚨 HIGH PRIORITY TICKET

Report ID: ${ticketData.reportId}
Customer: ${ticketData.customerName}
Subject: ${ticketData.ticketSubject}
Department: ${ticketData.department}

Immediate action required!
        `;

        const notifications = await Promise.all([
            this.sendSlack('#urgent-tickets', message, {
                priority: 'high',
                attachments: [{
                    title: 'View Ticket',
                    title_link: `/report-detail.html?id=${ticketData.reportId}`,
                    color: 'danger'
                }]
            }),
            this.sendTeams('urgent-channel', message, {
                priority: 'high',
                title: '🚨 High Priority Ticket',
                actions: [{
                    '@type': 'OpenUri',
                    name: 'View Ticket',
                    targets: [{
                        os: 'default',
                        uri: `/report-detail.html?id=${ticketData.reportId}`
                    }]
                }]
            }),
            this.sendSms(ticketData.assignedPhone || '+1234567890',
                `URGENT: Ticket ${ticketData.reportId} assigned to you. Check dashboard immediately.`)
        ]);

        return {
            success: true,
            notifications,
            ticketId: ticketData.reportId
        };
    }

    async logCommunication(channel, recipient, message, status) {
        if (!supabase) return;

        try {
            await supabase
    async logCommunication(channel, recipient, message, status, reportId = null) {
        if (!supabase) return;

        try {
            await supabase
                .from('communication_log')
                .insert([{
                    channel,
                    recipient,
                    report_id: reportId,
                    message: message.substring(0, 500),
                    status,
                    sent_at: new Date().toISOString()
                }]);
                }]);
        } catch (error) {
            console.error('Failed to log communication:', error);
        }
    }

    async getConversationHistory(reportId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('communication_log')
                .select('*')
                .eq('report_id', reportId)
                .order('sent_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                history: data,
                count: data.length
            };
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            return { success: false, error: error.message };
        }
    }

    isValidPhoneNumber(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    generateMessageId() {
        return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    async getChannelPreferences(userId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('communication_channels')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            return {
                success: true,
                preferences: data?.communication_channels || {
                    email: true,
                    sms: false,
                    slack: true,
                    teams: false
                }
            };
        } catch (error) {
            return {
                success: true,
                preferences: {
                    email: true,
                    sms: false,
                    slack: true,
                    teams: false
                }
            };
        }
    }

    async updateChannelPreferences(userId, preferences) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .upsert([{
                    user_id: userId,
                    communication_channels: preferences,
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating preferences:', error);
            return { success: false, error: error.message };
        }
    }
}

export const communicationHub = new CommunicationHub();
export default communicationHub;
