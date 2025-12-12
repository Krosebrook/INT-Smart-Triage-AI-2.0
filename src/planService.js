/**
 * Plan Service
 *
 * Provides plan entitlement checking with caching support.
 *
 * @module planService
 */

import { supabase } from './supabaseClient.js';
import {
  success,
  failure,
  validationError,
  notConfigured,
} from './lib/result.js';
import { createCache } from './lib/cache.js';

// Cache for entitlement lookups (60 seconds TTL)
const entitlementCache = createCache(60000);

/**
 * Get entitlement for a user and feature.
 *
 * Checks if a user has access to a specific feature based on their plan.
 * Results are cached for 60 seconds to improve performance.
 *
 * @param {string} userId - The user ID to check
 * @param {string} featureKey - The feature key to check access for
 * @returns {Promise<{success: true, allowed: boolean}|{success: false, error: string, code: string}>} Result with allowed status
 *
 * @example
 * const result = await getEntitlement('user-123', 'advanced-analytics');
 * if (result.success && result.allowed) {
 *   // User has access to the feature
 * }
 */
export async function getEntitlement(userId, featureKey) {
  // Input validation
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return validationError('userId must be a non-empty string');
  }

  if (
    !featureKey ||
    typeof featureKey !== 'string' ||
    featureKey.trim() === ''
  ) {
    return validationError('featureKey must be a non-empty string');
  }

  // Check cache first
  const cacheKey = `entitlement:${userId}:${featureKey}`;
  const cached = entitlementCache.get(cacheKey);
  if (cached !== undefined) {
    return success({ allowed: cached });
  }

  // Database not configured
  if (!supabase) {
    return notConfigured();
  }

  try {
    // Query database for entitlement
    // This assumes a table structure like:
    // - user_plans (user_id, plan_id)
    // - plan_features (plan_id, feature_key, allowed)
    const { data, error } = await supabase
      .from('user_plans')
      .select('plan_id, plans!inner(plan_features!inner(feature_key, allowed))')
      .eq('user_id', userId)
      .eq('plans.plan_features.feature_key', featureKey)
      .single();

    if (error) {
      // If no rows found, user doesn't have access
      if (error.code === 'PGRST116') {
        const allowed = false;
        entitlementCache.set(cacheKey, allowed);
        return success({ allowed });
      }
      throw error;
    }

    // Extract allowed status from nested data
    const allowed = data?.plans?.plan_features?.[0]?.allowed ?? false;

    // Cache the result
    entitlementCache.set(cacheKey, allowed);

    return success({ allowed });
  } catch (error) {
    return failure(
      `Failed to check entitlement: ${error.message}`,
      'DATABASE_ERROR'
    );
  }
}

/**
 * Clear the entitlement cache.
 * Useful for testing or when plan changes need to be reflected immediately.
 */
export function clearEntitlementCache() {
  entitlementCache.clear();
}
