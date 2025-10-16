/**
 * Customer Profile and History Management Service
 *
 * Comprehensive customer intelligence system providing:
 * - Complete ticket and interaction history
 * - Sentiment analysis and trends
 * - Customer lifetime value calculations
 * - Churn risk assessment
 * - Relationship management tools
 *
 * @module CustomerProfileService
 * @since 1.0.0
 */

import { supabase } from './supabaseClient.js';
import { sentimentAnalyzer } from './sentimentAnalysis.js';

/**
 * Service for managing customer profiles, history, and relationship intelligence.
 *
 * @class CustomerProfileService
 */
export class CustomerProfileService {
  /**
   * Get complete customer profile with analytics.
   *
   * Aggregates customer data from multiple sources:
   * - Basic profile information
   * - Ticket history
   * - Communication history
   * - Sentiment analysis
   * - Lifetime value calculations
   * - Churn risk assessment
   *
   * @async
   * @param {string} customerId - Customer unique identifier
   * @returns {Promise<Object>} Customer profile result
   * @returns {boolean} return.success - Whether profile fetch succeeded
   * @returns {Object} [return.profile] - Complete customer profile
   * @returns {string} [return.error] - Error message if fetch failed
   *
   * @example
   * const profile = await customerProfileService.getCustomerProfile('cust-123');
   * console.log(profile.profile.sentiment.overall); // 'positive'
   * console.log(profile.profile.riskScore.level); // 'low'
   */
  async getCustomerProfile(customerId) {
    if (!customerId) {
      return { success: false, error: 'Customer ID is required' };
    }

    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Fetch all customer data in parallel
      const [profile, tickets, interactions] = await Promise.all([
        this.getBasicProfile(customerId),
        this.getTicketHistory(customerId),
        this.getInteractionHistory(customerId),
      ]);

      // Calculate analytics
      const sentiment = this.calculateOverallSentiment(tickets.data || []);
      const lifetimeValue = this.calculateLifetimeValue(tickets.data || []);
      const riskScore = this.calculateChurnRisk(
        tickets.data || [],
        interactions.data || []
      );

      return {
        success: true,
        profile: {
          ...profile.data,
          tickets: tickets.data,
          interactions: interactions.data,
          sentiment,
          lifetimeValue,
          riskScore,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get basic customer profile information.
   *
   * @async
   * @private
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Profile data result
   */
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

      // Return default profile if customer doesn't exist yet
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
            created_at: new Date().toISOString(),
          },
        };
      }

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer's ticket history.
   *
   * @async
   * @private
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Ticket history result
   */
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
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer's interaction history across all channels.
   *
   * @async
   * @private
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Interaction history result
   */
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
        // Soft fail - interaction history is optional
        return { success: true, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      // Soft fail - return empty array
      return { success: true, data: [] };
    }
  }

  /**
   * Calculate overall sentiment based on ticket history.
   *
   * Analyzes recent tickets to determine customer sentiment trend.
   *
   * @param {Array<Object>} tickets - Array of ticket objects
   * @returns {Object} Sentiment analysis
   * @returns {string} return.overall - Overall sentiment (positive/neutral/negative)
   * @returns {string} return.score - Numerical sentiment score
   * @returns {string} return.trend - Trend direction (improving/stable/worsening)
   * @returns {Array} return.recentAnalyses - Recent sentiment analyses
   */
  calculateOverallSentiment(tickets) {
    if (tickets.length === 0) {
      return {
        overall: 'neutral',
        score: 0,
        trend: 'stable',
      };
    }

    const sentimentValues = {
      positive: 2,
      slightly_positive: 1,
      neutral: 0,
      slightly_negative: -1,
      negative: -2,
    };

    // Analyze recent tickets (last 10)
    const recentTickets = tickets.slice(0, 10);
    const analyses = recentTickets.map((ticket) =>
      sentimentAnalyzer.analyze(ticket.issue_description, ticket.customer_tone)
    );

    // Calculate average sentiment score
    const avgScore =
      analyses.reduce(
        (sum, a) => sum + (sentimentValues[a.sentiment] || 0),
        0
      ) / analyses.length;

    // Determine overall sentiment
    let overall = 'neutral';
    if (avgScore > 0.5) overall = 'positive';
    else if (avgScore < -0.5) overall = 'negative';

    // Analyze trend
    const trend = sentimentAnalyzer.analyzeTrend(analyses);

    return {
      overall,
      score: avgScore.toFixed(2),
      trend: trend.trend || 'stable',
      recentAnalyses: analyses.slice(0, 5),
    };
  }

  /**
   * Calculate customer lifetime value based on ticket history.
   *
   * @param {Array<Object>} tickets - Array of ticket objects
   * @returns {Object} Lifetime value analysis
   * @returns {number} return.ticketsResolved - Number of resolved tickets
   * @returns {number} return.totalTickets - Total number of tickets
   * @returns {string} return.avgTicketsPerMonth - Average tickets per month
   * @returns {string} return.estimatedValue - Estimated dollar value
   * @returns {string} return.tier - Customer tier (premium/gold/standard)
   */
  calculateLifetimeValue(tickets) {
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved'
    ).length;

    // Estimate monthly ticket rate
    const avgTicketsPerMonth = tickets.length / 12; // Assume 12-month window

    // Estimate value ($500 per resolved ticket)
    const estimatedValue = resolvedTickets * 500;

    // Determine customer tier
    let tier = 'standard';
    if (estimatedValue > 10000) tier = 'premium';
    else if (estimatedValue > 5000) tier = 'gold';

    return {
      ticketsResolved: resolvedTickets,
      totalTickets: tickets.length,
      avgTicketsPerMonth: avgTicketsPerMonth.toFixed(1),
      estimatedValue: `$${estimatedValue.toLocaleString()}`,
      tier,
    };
  }

  /**
   * Calculate churn risk score based on multiple factors.
   *
   * Risk factors:
   * - Unresolved recent tickets (+15 points each)
   * - Negative sentiment tickets (+20 points each)
   * - Slow resolution times (+25 if > 48 hours avg)
   * - No recent contact (+30 if > 60 days)
   *
   * @param {Array<Object>} tickets - Array of ticket objects
   * @param {Array<Object>} interactions - Array of interaction objects
   * @returns {Object} Churn risk analysis
   * @returns {number} return.score - Risk score (0-100)
   * @returns {string} return.level - Risk level (high/medium/low)
   * @returns {Object} return.factors - Contributing risk factors
   * @returns {Array<Object>} return.recommendations - Recommended actions
   */
  calculateChurnRisk(tickets, _interactions) {
    let riskScore = 0;

    // Filter tickets from last 30 days
    const recentTickets = tickets.filter((t) => {
      const daysSince =
        (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    // Factor 1: Unresolved tickets
    const unresolvedCount = recentTickets.filter(
      (t) => t.status !== 'resolved'
    ).length;
    riskScore += unresolvedCount * 15;

    // Factor 2: Negative sentiment tickets
    const negativeTickets = recentTickets.filter(
      (t) => t.customer_tone === 'angry' || t.customer_tone === 'frustrated'
    ).length;
    riskScore += negativeTickets * 20;

    // Factor 3: Slow resolution times
    const avgResolutionTime = this.calculateAvgResolutionTime(recentTickets);
    if (avgResolutionTime > 48) riskScore += 25;

    // Factor 4: Time since last contact
    const lastInteraction = tickets[0]?.created_at;
    if (lastInteraction) {
      const daysSinceLastContact =
        (Date.now() - new Date(lastInteraction).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceLastContact > 60) riskScore += 30;
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    return {
      score: riskScore,
      level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      factors: {
        unresolvedTickets: unresolvedCount,
        negativeInteractions: negativeTickets,
        avgResolutionTime: avgResolutionTime.toFixed(1),
        daysSinceLastContact: lastInteraction
          ? Math.floor(
              (Date.now() - new Date(lastInteraction).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      },
      recommendations: this.getChurnPreventionRecommendations(riskScore),
    };
  }

  /**
   * Calculate average resolution time for tickets.
   *
   * @private
   * @param {Array<Object>} tickets - Array of ticket objects
   * @returns {number} Average resolution time in hours
   */
  calculateAvgResolutionTime(tickets) {
    const resolved = tickets.filter(
      (t) => t.status === 'resolved' && t.resolved_at
    );

    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, t) => {
      const time =
        (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
      return sum + time;
    }, 0);

    return totalTime / resolved.length;
  }

  /**
   * Get recommended actions to prevent customer churn.
   *
   * @private
   * @param {number} riskScore - Churn risk score (0-100)
   * @returns {Array<Object>} Array of recommended actions
   */
  getChurnPreventionRecommendations(riskScore) {
    const recommendations = [];

    if (riskScore > 70) {
      recommendations.push({
        priority: 'urgent',
        action: 'Schedule immediate call with account manager',
        reason: 'High churn risk detected',
      });
      recommendations.push({
        priority: 'urgent',
        action: 'Offer service credit or discount',
        reason: 'Retention incentive needed',
      });
    } else if (riskScore > 40) {
      recommendations.push({
        priority: 'high',
        action: 'Send satisfaction survey',
        reason: 'Gather feedback on recent experiences',
      });
      recommendations.push({
        priority: 'medium',
        action: 'Review unresolved tickets',
        reason: 'Ensure all issues are being addressed',
      });
    } else {
      recommendations.push({
        priority: 'low',
        action: 'Send proactive check-in email',
        reason: 'Maintain positive relationship',
      });
    }

    return recommendations;
  }

  /**
   * Update customer profile information.
   *
   * @async
   * @param {string} customerId - Customer ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update result
   *
   * @example
   * await service.updateCustomerProfile('cust-123', {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   tags: ['vip', 'enterprise']
   * });
   */
  async updateCustomerProfile(customerId, updates) {
    if (!customerId || !updates) {
      return { success: false, error: 'Customer ID and updates are required' };
    }

    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .upsert([
          {
            customer_id: customerId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add note to customer profile.
   *
   * @async
   * @param {string} customerId - Customer ID
   * @param {string} noteText - Note content
   * @param {string} csrAgent - CSR who created the note
   * @returns {Promise<Object>} Note creation result
   *
   * @example
   * await service.addCustomerNote('cust-123', 'Customer prefers email contact', 'Sarah J.');
   */
  async addCustomerNote(customerId, noteText, csrAgent) {
    if (!customerId || !noteText || !csrAgent) {
      return { success: false, error: 'All parameters are required' };
    }

    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert([
          {
            customer_id: customerId,
            note_text: noteText,
            created_by: csrAgent,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add tag to customer profile.
   *
   * Tags are useful for categorization and filtering.
   *
   * @async
   * @param {string} customerId - Customer ID
   * @param {string} tag - Tag to add (e.g., 'vip', 'enterprise', 'at-risk')
   * @returns {Promise<Object>} Tag addition result
   *
   * @example
   * await service.addCustomerTag('cust-123', 'vip');
   */
  async addCustomerTag(customerId, tag) {
    if (!customerId || !tag) {
      return { success: false, error: 'Customer ID and tag are required' };
    }

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
          .upsert([
            {
              customer_id: customerId,
              tags: currentTags,
              updated_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        return { success: true, data };
      }

      return { success: true, message: 'Tag already exists' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find customers with similar profiles.
   *
   * Useful for understanding customer segments and applying
   * successful strategies from similar customers.
   *
   * Similarity factors:
   * - Common tags (+30%)
   * - Similar sentiment (+20%)
   * - Same tier (+30%)
   * - Similar risk score (+20%)
   *
   * @async
   * @param {string} customerId - Customer ID to compare against
   * @param {number} [limit=5] - Maximum number of similar customers to return
   * @returns {Promise<Object>} Similar customers result
   *
   * @example
   * const similar = await service.findSimilarCustomers('cust-123', 5);
   */
  async findSimilarCustomers(customerId, limit = 5) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const profile = await this.getCustomerProfile(customerId);

      if (!profile.success) {
        throw new Error('Customer profile not found');
      }

      // Fetch all other customers
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .neq('customer_id', customerId)
        .limit(50);

      if (error) throw error;

      // Calculate similarity scores
      const similar = data
        .map((customer) => ({
          customer,
          similarity: this.calculateSimilarity(profile.profile, customer),
        }))
        .filter((item) => item.similarity > 0.3) // Only include reasonably similar
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return {
        success: true,
        similarCustomers: similar.map((item) => ({
          ...item.customer,
          similarityScore: (item.similarity * 100).toFixed(1),
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate similarity score between two customers.
   *
   * @private
   * @param {Object} customer1 - First customer profile
   * @param {Object} customer2 - Second customer profile
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(customer1, customer2) {
    let score = 0;

    // Compare tags (30% weight)
    const tags1 = new Set(customer1.tags || []);
    const tags2 = new Set(customer2.tags || []);
    const commonTags = [...tags1].filter((tag) => tags2.has(tag)).length;
    score += commonTags * 0.3;

    // Compare sentiment (20% weight)
    if (customer1.sentiment?.overall === customer2.sentiment?.overall) {
      score += 0.2;
    }

    // Compare tier (30% weight)
    if (customer1.lifetimeValue?.tier === customer2.lifetimeValue?.tier) {
      score += 0.3;
    }

    // Compare risk score (20% weight)
    if (
      Math.abs(customer1.riskScore?.score - customer2.riskScore?.score) < 20
    ) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Get customer's communication preferences.
   *
   * @async
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Preferences result
   *
   * @example
   * const prefs = await service.getCommunicationPreferences('cust-123');
   * console.log(prefs.preferences.email); // true
   * console.log(prefs.preferences.preferredTime); // '09:00-17:00'
   */
  async getCommunicationPreferences(customerId) {
    // Default preferences
    const defaultPreferences = {
      email: true,
      sms: false,
      phone: true,
      preferredTime: '09:00-17:00',
      timezone: 'America/New_York',
    };

    if (!supabase) {
      return {
        success: true,
        preferences: defaultPreferences,
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
        preferences: data?.communication_preferences || defaultPreferences,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Singleton instance of the Customer Profile Service.
 *
 * @type {CustomerProfileService}
 * @example
 * import { customerProfileService } from './customerProfileService.js';
 * const profile = await customerProfileService.getCustomerProfile('cust-123');
 */
export const customerProfileService = new CustomerProfileService();

export default customerProfileService;
