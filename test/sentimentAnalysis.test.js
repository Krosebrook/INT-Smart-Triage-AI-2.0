/**
 * Unit tests for Sentiment Analysis
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SentimentAnalyzer } from '../src/sentimentAnalysis.js';

describe('SentimentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  describe('Constructor', () => {
    it('should initialize word sets', () => {
      assert.ok(analyzer.positiveWords instanceof Set);
      assert.ok(analyzer.negativeWords instanceof Set);
      assert.ok(analyzer.urgencyWords instanceof Set);
      assert.ok(analyzer.frustrationIndicators instanceof Set);
      assert.ok(analyzer.escalationTriggers instanceof Set);
    });

    it('should have positive words', () => {
      assert.ok(analyzer.positiveWords.has('good'));
      assert.ok(analyzer.positiveWords.has('excellent'));
      assert.ok(analyzer.positiveWords.has('thank'));
    });

    it('should have negative words', () => {
      assert.ok(analyzer.negativeWords.has('bad'));
      assert.ok(analyzer.negativeWords.has('terrible'));
      assert.ok(analyzer.negativeWords.has('frustrated'));
    });

    it('should have urgency words', () => {
      assert.ok(analyzer.urgencyWords.has('urgent'));
      assert.ok(analyzer.urgencyWords.has('asap'));
      assert.ok(analyzer.urgencyWords.has('critical'));
    });
  });

  describe('analyze()', () => {
    it('should detect positive sentiment', () => {
      const result = analyzer.analyze('Thank you for the excellent service');
      assert.ok(['positive', 'slightly_positive'].includes(result.sentiment));
      assert.ok(result.scores.positive > 0);
    });

    it('should detect negative sentiment', () => {
      const result = analyzer.analyze('This is terrible and awful');
      assert.ok(['negative', 'slightly_negative'].includes(result.sentiment));
      assert.ok(result.scores.negative > 0);
    });

    it('should detect neutral sentiment', () => {
      const result = analyzer.analyze('The system is running');
      assert.strictEqual(result.sentiment, 'neutral');
    });

    it('should detect urgency', () => {
      const result = analyzer.analyze('This is urgent and critical');
      assert.ok(result.scores.urgency > 0);
    });

    it('should detect frustration indicators', () => {
      const result = analyzer.analyze('This keeps happening again and again');
      assert.ok(result.scores.frustration > 0);
    });

    it('should detect escalation triggers', () => {
      const result = analyzer.analyze('I want to speak to your manager');
      assert.ok(parseFloat(result.escalationProbability) > 0);
    });

    it('should detect caps lock as negative indicator', () => {
      const result1 = analyzer.analyze('this is a message');
      const result2 = analyzer.analyze('THIS IS A MESSAGE');
      assert.ok(result2.scores.negative > result1.scores.negative);
      assert.ok(result2.flags.capsLockDetected);
    });

    it('should detect excessive exclamation marks', () => {
      const result = analyzer.analyze('Help!!! This is urgent!!!');
      assert.ok(result.flags.excessiveExclamation);
    });

    it('should detect multiple question marks', () => {
      const result = analyzer.analyze('Why??? How??? What???');
      assert.ok(result.flags.multipleQuestions);
    });

    it('should enhance score based on customer tone', () => {
      const result1 = analyzer.analyze('message', 'calm');
      const result2 = analyzer.analyze('message', 'angry');

      assert.ok(result2.scores.negative > result1.scores.negative);
    });

    it('should calculate escalation probability', () => {
      const result = analyzer.analyze('I want a refund and will sue');
      assert.ok(parseFloat(result.escalationProbability) > 50);
    });

    it('should recommend appropriate action', () => {
      const lowEscalation = analyzer.analyze('Can you help me?');
      const highEscalation = analyzer.analyze(
        'This is terrible! I want a refund! Speaking to my lawyer!'
      );

      assert.strictEqual(lowEscalation.recommendedAction, 'standard_response');
      assert.ok(highEscalation.recommendedAction.includes('supervisor'));
    });

    it('should provide de-escalation tactics', () => {
      const result = analyzer.analyze('This is frustrating');
      assert.ok(Array.isArray(result.deEscalationTactics));
      assert.ok(result.deEscalationTactics.length > 0);
    });

    it('should include confidence score', () => {
      const result = analyzer.analyze('This is a test message');
      assert.ok(result.confidence);
      assert.ok(result.confidence >= 0 && result.confidence <= 100);
    });
  });

  describe('getDeEscalationTactics()', () => {
    it('should provide tactics for high escalation risk', () => {
      const tactics = analyzer.getDeEscalationTactics('negative', 70, 3);
      assert.ok(tactics.length > 0);
      assert.ok(tactics.some((t) => t.priority === 'high'));
    });

    it('should sort tactics by priority', () => {
      const tactics = analyzer.getDeEscalationTactics('negative', 50, 2);
      const priorities = tactics.map((t) => t.priority);

      // High should come before low
      const highIndex = priorities.indexOf('high');
      const lowIndex = priorities.indexOf('low');
      if (highIndex >= 0 && lowIndex >= 0) {
        assert.ok(highIndex < lowIndex);
      }
    });

    it('should include tactic and script', () => {
      const tactics = analyzer.getDeEscalationTactics('negative', 60, 2);
      tactics.forEach((tactic) => {
        assert.ok(tactic.tactic);
        assert.ok(tactic.script);
        assert.ok(tactic.priority);
      });
    });
  });

  describe('calculateConfidence()', () => {
    it('should return low confidence for very short text', () => {
      const confidence = analyzer.calculateConfidence(3, 1);
      assert.ok(confidence <= 60);
    });

    it('should return medium confidence for medium text', () => {
      const confidence = analyzer.calculateConfidence(8, 2);
      assert.ok(confidence >= 60);
    });

    it('should return high confidence for long text with sentiment', () => {
      const confidence = analyzer.calculateConfidence(20, 5);
      assert.ok(confidence >= 85);
    });

    it('should return lower confidence for no sentiment words', () => {
      const confidence = analyzer.calculateConfidence(15, 0);
      assert.strictEqual(confidence, 50);
    });
  });

  describe('predictEscalation()', () => {
    it('should predict escalation based on current analysis', () => {
      const currentAnalysis = {
        escalationProbability: '40',
        sentiment: 'negative',
      };

      const prediction = analyzer.predictEscalation(currentAnalysis, []);
      assert.ok(prediction.probability);
      assert.ok(prediction.risk);
      assert.strictEqual(typeof prediction.recommendSupervisor, 'boolean');
    });

    it('should increase probability with negative history', () => {
      const currentAnalysis = { escalationProbability: '30' };
      const historicalData = [
        { sentiment: 'negative', status: 'new', created_at: new Date() },
        { sentiment: 'negative', status: 'new', created_at: new Date() },
      ];

      const prediction = analyzer.predictEscalation(
        currentAnalysis,
        historicalData
      );
      assert.ok(parseFloat(prediction.probability) > 30);
    });

    it('should recommend supervisor for high escalation', () => {
      const currentAnalysis = { escalationProbability: '70' };
      const prediction = analyzer.predictEscalation(currentAnalysis, []);
      assert.strictEqual(prediction.recommendSupervisor, true);
    });

    it('should suggest compensation for medium-high escalation', () => {
      const currentAnalysis = { escalationProbability: '60' };
      const prediction = analyzer.predictEscalation(currentAnalysis, []);
      assert.strictEqual(prediction.suggestedCompensation, true);
    });
  });

  describe('analyzeTrend()', () => {
    it('should return insufficient data for single analysis', () => {
      const trend = analyzer.analyzeTrend([{ sentiment: 'neutral' }]);
      assert.strictEqual(trend.trend, 'insufficient_data');
    });

    it('should detect improving trend', () => {
      const analyses = [
        { sentiment: 'negative' },
        { sentiment: 'neutral' },
        { sentiment: 'positive' },
      ];

      const trend = analyzer.analyzeTrend(analyses);
      assert.strictEqual(trend.trend, 'improving');
      assert.ok(trend.direction > 0);
    });

    it('should detect worsening trend', () => {
      const analyses = [
        { sentiment: 'positive' },
        { sentiment: 'neutral' },
        { sentiment: 'negative' },
      ];

      const trend = analyzer.analyzeTrend(analyses);
      assert.strictEqual(trend.trend, 'worsening');
      assert.ok(trend.direction < 0);
    });

    it('should detect stable trend', () => {
      const analyses = [
        { sentiment: 'neutral' },
        { sentiment: 'neutral' },
        { sentiment: 'neutral' },
      ];

      const trend = analyzer.analyzeTrend(analyses);
      assert.strictEqual(trend.trend, 'stable');
    });

    it('should calculate volatility', () => {
      const analyses = [
        { sentiment: 'positive' },
        { sentiment: 'negative' },
        { sentiment: 'positive' },
      ];

      const trend = analyzer.analyzeTrend(analyses);
      assert.ok(trend.volatility);
      assert.ok(parseFloat(trend.volatility) >= 0);
    });
  });

  describe('calculateVolatility()', () => {
    it('should return 0 for single value', () => {
      const volatility = analyzer.calculateVolatility([1]);
      assert.strictEqual(parseFloat(volatility), 0);
    });

    it('should return 0 for constant values', () => {
      const volatility = analyzer.calculateVolatility([1, 1, 1, 1]);
      assert.strictEqual(parseFloat(volatility), 0);
    });

    it('should calculate volatility for varying values', () => {
      const volatility = analyzer.calculateVolatility([1, -1, 1, -1]);
      assert.ok(parseFloat(volatility) > 0);
    });
  });

  describe('generateResponseSuggestion()', () => {
    it('should suggest immediate action for high escalation', () => {
      const analysis = {
        sentiment: 'negative',
        escalationProbability: '70',
        emotionalIntensity: 'high',
      };

      const suggestion = analyzer.generateResponseSuggestion(analysis);
      assert.strictEqual(suggestion.tone, 'immediate_action');
      assert.strictEqual(suggestion.urgency, 'immediate');
      assert.ok(suggestion.approvalRequired);
    });

    it('should suggest empathetic response for medium escalation', () => {
      const analysis = {
        sentiment: 'slightly_negative',
        escalationProbability: '40',
        emotionalIntensity: 'moderate',
      };

      const suggestion = analyzer.generateResponseSuggestion(analysis);
      assert.strictEqual(suggestion.tone, 'empathetic_professional');
      assert.strictEqual(suggestion.urgency, 'high');
    });

    it('should suggest standard response for low escalation', () => {
      const analysis = {
        sentiment: 'neutral',
        escalationProbability: '20',
        emotionalIntensity: 'low',
      };

      const suggestion = analyzer.generateResponseSuggestion(analysis);
      assert.strictEqual(suggestion.tone, 'helpful_professional');
      assert.strictEqual(suggestion.urgency, 'normal');
    });

    it('should include opening, tone, and closing', () => {
      const analysis = {
        sentiment: 'neutral',
        escalationProbability: '25',
        emotionalIntensity: 'low',
      };

      const suggestion = analyzer.generateResponseSuggestion(analysis);
      assert.ok(suggestion.opening);
      assert.ok(suggestion.tone);
      assert.ok(suggestion.closing);
    });

    it('should suggest compensation for medium-high escalation', () => {
      const analysis = {
        sentiment: 'negative',
        escalationProbability: '55',
        emotionalIntensity: 'high',
      };

      const suggestion = analyzer.generateResponseSuggestion(analysis);
      assert.ok(suggestion.suggestedCompensation.includes('discount'));
    });
  });
});
