import {
  validateTriageResponse,
  TriageResponseSchema,
  DEFAULT_TRIAGE_RESPONSE,
  isValidUpsellOpportunity,
  isValidTalkingPoints,
  type TriageResponse,
} from '../lib/schema';

describe('Schema Validation', () => {
  describe('validateTriageResponse', () => {
    it('should return valid response when given correct LLM output', () => {
      const validLLMOutput = {
        recommended_routing: 'Technical Support',
        kb_suggestion: 'Check our troubleshooting guide at KB-001',
        actionable_talking_points: [
          'Thank you for reaching out',
          'Let me help you with this issue',
        ],
        management_summary: 'Customer experiencing connectivity issues',
        upsell_opportunity: 'Yes' as const,
        upsell_reason: 'Customer could benefit from premium support package',
      };

      const result = validateTriageResponse(validLLMOutput);
      expect(result).toEqual(validLLMOutput);
    });

    it('should return valid response when given JSON string input', () => {
      const validLLMOutput = {
        recommended_routing: 'Billing Support',
        kb_suggestion: 'Review billing FAQ',
        actionable_talking_points: ['I can help with billing questions'],
        management_summary: 'Billing inquiry',
        upsell_opportunity: 'No' as const,
        upsell_reason: 'No upsell opportunities identified',
      };

      const jsonString = JSON.stringify(validLLMOutput);
      const result = validateTriageResponse(jsonString);
      expect(result).toEqual(validLLMOutput);
    });

    it('should return default response for malformed JSON string', () => {
      const malformedJSON = '{"recommended_routing": "Support", "missing_fields": true,}';
      
      const result = validateTriageResponse(malformedJSON);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for invalid JSON string', () => {
      const invalidJSON = 'This is not JSON at all!';
      
      const result = validateTriageResponse(invalidJSON);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for missing required fields', () => {
      const incompleteOutput = {
        recommended_routing: 'Support',
        // Missing other required fields
      };

      const result = validateTriageResponse(incompleteOutput);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for incorrect field types', () => {
      const badTypesOutput = {
        recommended_routing: 123, // Should be string
        kb_suggestion: 'Valid suggestion',
        actionable_talking_points: 'Not an array', // Should be string[]
        management_summary: true, // Should be string
        upsell_opportunity: 'Maybe', // Should be 'Yes' or 'No'
        upsell_reason: null, // Should be string
      };

      const result = validateTriageResponse(badTypesOutput);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for invalid upsell_opportunity value', () => {
      const invalidUpsellOutput = {
        recommended_routing: 'Support',
        kb_suggestion: 'Check KB',
        actionable_talking_points: ['Help available'],
        management_summary: 'Customer inquiry',
        upsell_opportunity: 'Maybe', // Invalid enum value
        upsell_reason: 'Uncertain about upsell',
      };

      const result = validateTriageResponse(invalidUpsellOutput);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for non-string talking points', () => {
      const badTalkingPointsOutput = {
        recommended_routing: 'Support',
        kb_suggestion: 'Check KB',
        actionable_talking_points: [123, true, null], // Should be strings
        management_summary: 'Customer inquiry',
        upsell_opportunity: 'No' as const,
        upsell_reason: 'No upsell needed',
      };

      const result = validateTriageResponse(badTalkingPointsOutput);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for null input', () => {
      const result = validateTriageResponse(null);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for undefined input', () => {
      const result = validateTriageResponse(undefined);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for empty object', () => {
      const result = validateTriageResponse({});
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for array input', () => {
      const result = validateTriageResponse([1, 2, 3]);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should return default response for primitive input', () => {
      const result1 = validateTriageResponse(123);
      const result2 = validateTriageResponse(true);
      const result3 = validateTriageResponse('random string');
      
      expect(result1).toEqual(DEFAULT_TRIAGE_RESPONSE);
      expect(result2).toEqual(DEFAULT_TRIAGE_RESPONSE);
      expect(result3).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });
  });

  describe('Default Triage Response', () => {
    it('should have all required fields', () => {
      expect(() => TriageResponseSchema.parse(DEFAULT_TRIAGE_RESPONSE)).not.toThrow();
    });

    it('should have conservative, safe default values', () => {
      expect(DEFAULT_TRIAGE_RESPONSE.recommended_routing).toBe('General Support');
      expect(DEFAULT_TRIAGE_RESPONSE.upsell_opportunity).toBe('No');
      expect(DEFAULT_TRIAGE_RESPONSE.actionable_talking_points).toHaveLength(3);
      expect(DEFAULT_TRIAGE_RESPONSE.actionable_talking_points.every(point => typeof point === 'string')).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('isValidUpsellOpportunity', () => {
      it('should return true for valid values', () => {
        expect(isValidUpsellOpportunity('Yes')).toBe(true);
        expect(isValidUpsellOpportunity('No')).toBe(true);
      });

      it('should return false for invalid values', () => {
        expect(isValidUpsellOpportunity('Maybe')).toBe(false);
        expect(isValidUpsellOpportunity('yes')).toBe(false);
        expect(isValidUpsellOpportunity('NO')).toBe(false);
        expect(isValidUpsellOpportunity(true)).toBe(false);
        expect(isValidUpsellOpportunity(null)).toBe(false);
        expect(isValidUpsellOpportunity(undefined)).toBe(false);
      });
    });

    describe('isValidTalkingPoints', () => {
      it('should return true for valid string arrays', () => {
        expect(isValidTalkingPoints(['Hello', 'World'])).toBe(true);
        expect(isValidTalkingPoints([])).toBe(true);
        expect(isValidTalkingPoints(['Single item'])).toBe(true);
      });

      it('should return false for invalid arrays', () => {
        expect(isValidTalkingPoints([1, 2, 3])).toBe(false);
        expect(isValidTalkingPoints(['valid', 123, 'mixed'])).toBe(false);
        expect(isValidTalkingPoints([null, undefined])).toBe(false);
        expect(isValidTalkingPoints('not an array')).toBe(false);
        expect(isValidTalkingPoints(null)).toBe(false);
        expect(isValidTalkingPoints(undefined)).toBe(false);
      });
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle deeply nested malformed objects', () => {
      const malformedNested = {
        recommended_routing: {
          nested: {
            deeply: 'This should be a string, not an object'
          }
        },
        kb_suggestion: 'Valid',
        actionable_talking_points: ['Valid'],
        management_summary: 'Valid',
        upsell_opportunity: 'Yes' as const,
        upsell_reason: 'Valid',
      };

      const result = validateTriageResponse(malformedNested);
      expect(result).toEqual(DEFAULT_TRIAGE_RESPONSE);
    });

    it('should handle extra unexpected fields gracefully', () => {
      const outputWithExtraFields = {
        recommended_routing: 'Support',
        kb_suggestion: 'Check KB',
        actionable_talking_points: ['Help available'],
        management_summary: 'Customer inquiry',
        upsell_opportunity: 'No' as const,
        upsell_reason: 'No upsell needed',
        extra_field: 'This should be ignored',
        another_extra: 123,
      };

      const result = validateTriageResponse(outputWithExtraFields);
      
      // Should successfully parse and return the valid parts
      expect(result.recommended_routing).toBe('Support');
      expect(result.kb_suggestion).toBe('Check KB');
      expect(result.actionable_talking_points).toEqual(['Help available']);
      expect(result.management_summary).toBe('Customer inquiry');
      expect(result.upsell_opportunity).toBe('No');
      expect(result.upsell_reason).toBe('No upsell needed');
      
      // Extra fields should not be present in the result
      expect('extra_field' in result).toBe(false);
      expect('another_extra' in result).toBe(false);
    });
  });
});