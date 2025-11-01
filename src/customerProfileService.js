// Customer Profile and History Management Service
import { supabase } from './supabaseClient.js';
import { sentimentAnalyzer } from './sentimentAnalysis.js';

export class CustomerProfileService {
    async getCustomerProfile(customerId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const [profile, tickets, interactions] = await Promise.all([
                this.getBasicProfile(customerId),
                this.getTicketHistory(customerId),
                this.getInteractionHistory(customerId)
            ]);

            const sentiment = this.calculateOverallSentiment(tickets.data || []);
            const lifetimeValue = this.calculateLifetimeValue(tickets.data || []);
            const riskScore = this.calculateChurnRisk(tickets.data || [], interactions.data || []);

            return {
                success: true,
                profile: {
                    ...profile.data,
                    tickets: tickets.data,
                    interactions: interactions.data,
                    sentiment,
                    lifetimeValue,
                    riskScore
                }
            };
        } catch (error) {
            console.error('Error fetching customer profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getBasicProfile(customerId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('customer_profiles')
                .select('*')
                .eq('customer_id', customerId)
                .maybeSingle();

            if (!data) {
                return {
                    success: true,
                    data: {
                        customer_id: customerId,
                        name: 'Unknown Customer',
                        email: null,
                        phone: null,
                        company: null,
                        tags: [],
                        notes: null,
                        created_at: new Date().toISOString()
                    }
                };
            }

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching basic profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getTicketHistory(customerId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .or(`customer_id.eq.${customerId},customer_name.ilike.%${customerId}%`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching ticket history:', error);
            return { success: false, error: error.message };
        }
    }

    async getInteractionHistory(customerId) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('communication_log')
                .select('*')
                .eq('customer_id', customerId)
                .order('sent_at', { ascending: false })
                .limit(50);

            if (error) {
                return { success: true, data: [] };
            }

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: true, data: [] };
        }
    }

    calculateOverallSentiment(tickets) {
        if (tickets.length === 0) {
            return {
                overall: 'neutral',
                score: 0,
                trend: 'stable'
            };
        }

        const sentimentValues = {
            'positive': 2,
            'slightly_positive': 1,
            'neutral': 0,
            'slightly_negative': -1,
            'negative': -2
        };

        const recentTickets = tickets.slice(0, 10);
        const analyses = recentTickets.map(ticket =>
            sentimentAnalyzer.analyze(ticket.issue_description, ticket.customer_tone)
        );

        const avgScore = analyses.reduce((sum, a) =>
            sum + (sentimentValues[a.sentiment] || 0), 0
        ) / analyses.length;

        let overall = 'neutral';
        if (avgScore > 0.5) overall = 'positive';
        else if (avgScore < -0.5) overall = 'negative';

        const trend = sentimentAnalyzer.analyzeTrend(analyses);

        return {
            overall,
            score: avgScore.toFixed(2),
            trend: trend.trend || 'stable',
            recentAnalyses: analyses.slice(0, 5)
        };
    }

    calculateLifetimeValue(tickets) {
        const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
        const avgTicketsPerMonth = tickets.length / 12;
        const estimatedValue = resolvedTickets * 500;

        return {
            ticketsResolved: resolvedTickets,
            totalTickets: tickets.length,
            avgTicketsPerMonth: avgTicketsPerMonth.toFixed(1),
            estimatedValue: `$${estimatedValue.toLocaleString()}`,
            tier: estimatedValue > 10000 ? 'premium' : estimatedValue > 5000 ? 'gold' : 'standard'
        };
    }

    calculateChurnRisk(tickets, interactions) {
        let riskScore = 0;

        const recentTickets = tickets.filter(t => {
            const daysSince = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 30;
        });

        const unresolvedCount = recentTickets.filter(t => t.status !== 'resolved').length;
        riskScore += unresolvedCount * 15;

        const negativeTickets = recentTickets.filter(t =>
            t.customer_tone === 'angry' || t.customer_tone === 'frustrated'
        ).length;
        riskScore += negativeTickets * 20;

        const avgResolutionTime = this.calculateAvgResolutionTime(recentTickets);
        if (avgResolutionTime > 48) riskScore += 25;

        const lastInteraction = tickets[0]?.created_at;
        if (lastInteraction) {
            const daysSinceLastContact = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastContact > 60) riskScore += 30;
        }

        riskScore = Math.min(100, riskScore);

        return {
            score: riskScore,
            level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
            factors: {
                unresolvedTickets: unresolvedCount,
                negativeInteractions: negativeTickets,
                avgResolutionTime: avgResolutionTime.toFixed(1),
                daysSinceLastContact: lastInteraction ?
                    Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)) : null
            },
            recommendations: this.getChurnPreventionRecommendations(riskScore)
        };
    }

    calculateAvgResolutionTime(tickets) {
        const resolved = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
        if (resolved.length === 0) return 0;

        const totalTime = resolved.reduce((sum, t) => {
            const time = (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            return sum + time;
        }, 0);

        return totalTime / resolved.length;
    }

    getChurnPreventionRecommendations(riskScore) {
        const recommendations = [];

        if (riskScore > 70) {
            recommendations.push({
                priority: 'urgent',
                action: 'Schedule immediate call with account manager',
                reason: 'High churn risk detected'
            });
            recommendations.push({
                priority: 'urgent',
                action: 'Offer service credit or discount',
                reason: 'Retention incentive needed'
            });
        } else if (riskScore > 40) {
            recommendations.push({
                priority: 'high',
                action: 'Send satisfaction survey',
                reason: 'Gather feedback on recent experiences'
            });
            recommendations.push({
                priority: 'medium',
                action: 'Review unresolved tickets',
                reason: 'Ensure all issues are being addressed'
            });
        } else {
            recommendations.push({
                priority: 'low',
                action: 'Send proactive check-in email',
                reason: 'Maintain positive relationship'
            });
        }

        return recommendations;
    }

    async updateCustomerProfile(customerId, updates) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('customer_profiles')
                .upsert([{
                    customer_id: customerId,
                    ...updates,
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating customer profile:', error);
            return { success: false, error: error.message };
        }
    }

    async addCustomerNote(customerId, noteText, csrAgent) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('customer_notes')
                .insert([{
                    customer_id: customerId,
                    note_text: noteText,
                    created_by: csrAgent,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error adding customer note:', error);
            return { success: false, error: error.message };
        }
    }

    async addCustomerTag(customerId, tag) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const profile = await this.getBasicProfile(customerId);
            const currentTags = profile.data?.tags || [];

            if (!currentTags.includes(tag)) {
                currentTags.push(tag);

                const { data, error } = await supabase
                    .from('customer_profiles')
                    .upsert([{
                        customer_id: customerId,
                        tags: currentTags,
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;

                return { success: true, data };
            }

            return { success: true, message: 'Tag already exists' };
        } catch (error) {
            console.error('Error adding customer tag:', error);
            return { success: false, error: error.message };
        }
    }

    async findSimilarCustomers(customerId, limit = 5) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const profile = await this.getCustomerProfile(customerId);

            if (!profile.success) {
                throw new Error('Customer profile not found');
            }

            const { data, error } = await supabase
                .from('customer_profiles')
                .select('*')
                .neq('customer_id', customerId)
                .limit(50);

            if (error) throw error;

            const similar = data
                .map(customer => ({
                    customer,
                    similarity: this.calculateSimilarity(profile.profile, customer)
                }))
                .filter(item => item.similarity > 0.3)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return {
                success: true,
                similarCustomers: similar.map(item => ({
                    ...item.customer,
                    similarityScore: (item.similarity * 100).toFixed(1)
                }))
            };
        } catch (error) {
            console.error('Error finding similar customers:', error);
            return { success: false, error: error.message };
        }
    }

    calculateSimilarity(customer1, customer2) {
        let score = 0;

        const tags1 = new Set(customer1.tags || []);
        const tags2 = new Set(customer2.tags || []);
        const commonTags = [...tags1].filter(tag => tags2.has(tag)).length;
        score += commonTags * 0.3;

        if (customer1.sentiment?.overall === customer2.sentiment?.overall) {
            score += 0.2;
        }

        if (customer1.lifetimeValue?.tier === customer2.lifetimeValue?.tier) {
            score += 0.3;
        }

        if (Math.abs(customer1.riskScore?.score - customer2.riskScore?.score) < 20) {
            score += 0.2;
        }

        return Math.min(1, score);
    }

    async getCommunicationPreferences(customerId) {
        if (!supabase) {
            return {
                success: true,
                preferences: {
                    email: true,
                    sms: false,
                    phone: true,
                    preferredTime: '09:00-17:00',
                    timezone: 'America/New_York'
                }
            };
        }

        try {
            const { data, error } = await supabase
                .from('customer_profiles')
                .select('communication_preferences')
                .eq('customer_id', customerId)
                .maybeSingle();

            if (error) throw error;

            return {
                success: true,
                preferences: data?.communication_preferences || {
                    email: true,
                    sms: false,
                    phone: true,
                    preferredTime: '09:00-17:00',
                    timezone: 'America/New_York'
                }
            };
        } catch (error) {
            console.error('Error fetching communication preferences:', error);
            return { success: false, error: error.message };
        }
    }
}

export const customerProfileService = new CustomerProfileService();
export default customerProfileService;
