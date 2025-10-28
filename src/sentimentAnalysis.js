// AI-Powered Sentiment Analysis Engine
export class SentimentAnalyzer {
  constructor() {
    this.positiveWords = new Set([
      'good',
      'great',
      'excellent',
      'happy',
      'satisfied',
      'pleased',
      'wonderful',
      'fantastic',
      'amazing',
      'perfect',
      'love',
      'appreciate',
      'thank',
      'thanks',
      'helpful',
      'awesome',
      'brilliant',
      'outstanding',
      'exceptional',
    ]);

    this.negativeWords = new Set([
      'bad',
      'terrible',
      'horrible',
      'awful',
      'poor',
      'disappointing',
      'frustrated',
      'angry',
      'upset',
      'unhappy',
      'dissatisfied',
      'hate',
      'worst',
      'useless',
      'broken',
      'failed',
      'error',
      'problem',
      'issue',
      'unacceptable',
      'disaster',
    ]);

    this.urgencyWords = new Set([
      'urgent',
      'asap',
      'immediately',
      'critical',
      'emergency',
      'now',
      'quickly',
      'hurry',
      'right away',
      'time-sensitive',
      'deadline',
      'escalate',
    ]);

    this.frustrationIndicators = new Set([
      'again',
      'still',
      'multiple times',
      'keep',
      'keeps',
      'repeatedly',
      'every time',
      'always',
      'never',
      'nobody',
      'no one',
      'waiting',
    ]);

    this.escalationTriggers = new Set([
      'lawyer',
      'legal',
      'sue',
      'refund',
      'cancel',
      'complaint',
      'manager',
      'supervisor',
      'corporate',
      'unacceptable',
      'breach',
      'violation',
    ]);
  }

  analyze(text, customerTone = null) {
    const lowerText = text.toLowerCase();
    // Remove punctuation and split into words
    const words = lowerText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    let positiveScore = 0;
    let negativeScore = 0;
    let urgencyScore = 0;
    let frustrationScore = 0;
    let escalationRisk = 0;

    words.forEach((word) => {
      if (this.positiveWords.has(word)) positiveScore++;
      if (this.negativeWords.has(word)) negativeScore++;
      if (this.urgencyWords.has(word)) urgencyScore++;
      if (this.frustrationIndicators.has(word)) frustrationScore++;
      if (this.escalationTriggers.has(word)) escalationRisk++;
    });

    const hasCapsLock = (text.match(/[A-Z]{4,}/g) || []).length > 0;
    const hasExclamation = (text.match(/!/g) || []).length > 2;
    const hasQuestionMarks = (text.match(/\?/g) || []).length > 3;

    if (hasCapsLock) {
      negativeScore += 2;
      urgencyScore += 1;
    }

    if (hasExclamation) {
      urgencyScore += 1;
      negativeScore += 1;
    }

    if (hasQuestionMarks) {
      frustrationScore += 1;
    }

    if (customerTone === 'angry') negativeScore += 5;
    if (customerTone === 'urgent') urgencyScore += 5;
    if (customerTone === 'frustrated') frustrationScore += 5;

    const sentimentScore = positiveScore - negativeScore;
    let sentiment = 'neutral';
    let emotionalIntensity = 'moderate';

    if (sentimentScore > 3) {
      sentiment = 'positive';
      emotionalIntensity = 'low';
    } else if (sentimentScore < -3) {
      sentiment = 'negative';
      emotionalIntensity = 'high';
    } else if (Math.abs(sentimentScore) <= 1) {
      sentiment = 'neutral';
      emotionalIntensity = 'moderate';
    } else if (sentimentScore < 0) {
      sentiment = 'slightly_negative';
      emotionalIntensity = 'moderate';
    } else {
      sentiment = 'slightly_positive';
      emotionalIntensity = 'low';
    }

    const escalationProbability = Math.min(
      100,
      escalationRisk * 30 +
        negativeScore * 5 +
        frustrationScore * 10 +
        urgencyScore * 5
    );

    let recommendedAction = 'standard_response';
    if (escalationProbability > 70) {
      recommendedAction = 'immediate_supervisor_involvement';
    } else if (escalationProbability > 50) {
      recommendedAction = 'priority_handling_with_compensation';
    } else if (escalationProbability > 30) {
      recommendedAction = 'empathetic_response_with_timeline';
    }

    const deEscalationTactics = this.getDeEscalationTactics(
      sentiment,
      escalationProbability,
      frustrationScore
    );

    return {
      sentiment,
      emotionalIntensity,
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        urgency: urgencyScore,
        frustration: frustrationScore,
        overall: sentimentScore,
      },
      escalationProbability: escalationProbability.toFixed(1),
      recommendedAction,
      deEscalationTactics,
      flags: {
        capsLockDetected: hasCapsLock,
        excessiveExclamation: hasExclamation,
        multipleQuestions: hasQuestionMarks,
        escalationKeywords: escalationRisk > 0,
        repeatedIssue: frustrationScore > 2,
      },
      confidence: this.calculateConfidence(
        words.length,
        positiveScore + negativeScore
      ),
    };
  }

  getDeEscalationTactics(sentiment, escalationProb, frustrationScore) {
    const tactics = [];

    if (escalationProb > 50) {
      tactics.push({
        priority: 'high',
        tactic: 'Immediate Acknowledgment',
        script:
          "I understand this is extremely frustrating, and I sincerely apologize for the inconvenience you're experiencing.",
      });

      tactics.push({
        priority: 'high',
        tactic: 'Take Ownership',
        script:
          "This is absolutely unacceptable, and I'm taking personal responsibility for ensuring this gets resolved immediately.",
      });
    }

    if (frustrationScore > 2) {
      tactics.push({
        priority: 'high',
        tactic: 'Validate Frustration',
        script:
          "I can hear how frustrating this has been, especially having to reach out multiple times. You shouldn't have to do that.",
      });
    }

    if (sentiment === 'negative' || sentiment === 'slightly_negative') {
      tactics.push({
        priority: 'medium',
        tactic: 'Provide Clear Timeline',
        script:
          "Here's exactly what I'm going to do right now, and you can expect an update within [specific timeframe].",
      });

      tactics.push({
        priority: 'medium',
        tactic: 'Offer Direct Contact',
        script:
          "I'm going to give you my direct contact information so you can reach me immediately if you need anything else.",
      });
    }

    tactics.push({
      priority: 'low',
      tactic: 'Follow-Up Commitment',
      script:
        "I will personally follow up with you to ensure you're completely satisfied with the resolution.",
    });

    return tactics.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  calculateConfidence(wordCount, sentimentWords) {
    if (wordCount < 5) return 40;
    if (wordCount < 10) return 60;
    if (sentimentWords === 0) return 50;
    if (sentimentWords > wordCount * 0.2) return 95;
    if (sentimentWords > wordCount * 0.1) return 85;
    return 75;
  }

  predictEscalation(currentAnalysis, historicalData = []) {
    let escalationScore = parseFloat(currentAnalysis.escalationProbability);

    if (historicalData.length > 0) {
      const pastNegativeInteractions = historicalData.filter(
        (h) => h.sentiment === 'negative' || h.sentiment === 'slightly_negative'
      ).length;

      escalationScore += pastNegativeInteractions * 10;

      const recentUnresolved = historicalData.filter(
        (h) =>
          h.status !== 'resolved' &&
          Date.now() - new Date(h.created_at).getTime() > 24 * 60 * 60 * 1000
      ).length;

      escalationScore += recentUnresolved * 15;
    }

    return {
      probability: Math.min(100, escalationScore).toFixed(1),
      risk:
        escalationScore > 70 ? 'high' : escalationScore > 40 ? 'medium' : 'low',
      recommendSupervisor: escalationScore > 60,
      suggestedCompensation: escalationScore > 50,
    };
  }

  analyzeTrend(analyses) {
    if (analyses.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const sentimentValues = {
      positive: 2,
      slightly_positive: 1,
      neutral: 0,
      slightly_negative: -1,
      negative: -2,
    };

    const values = analyses.map((a) => sentimentValues[a.sentiment] || 0);
    const trend = values[values.length - 1] - values[0];

    return {
      trend: trend > 0 ? 'improving' : trend < 0 ? 'worsening' : 'stable',
      direction: trend,
      currentSentiment: analyses[analyses.length - 1].sentiment,
      historicalAverage: (
        values.reduce((a, b) => a + b, 0) / values.length
      ).toFixed(2),
      volatility: this.calculateVolatility(values),
    };
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(variance).toFixed(2);
  }

  generateResponseSuggestion(analysis) {
    const { escalationProbability } = analysis;
    const prob = parseFloat(escalationProbability);

    let opening = '';
    let tone = '';
    let closing = '';

    if (prob > 60) {
      opening =
        'I sincerely apologize for this situation and truly understand your frustration.';
      tone = 'immediate_action';
      closing = "I'm personally committed to resolving this for you right now.";
    } else if (prob > 30) {
      opening =
        'Thank you for bringing this to our attention. I understand your concern.';
      tone = 'empathetic_professional';
      closing = "I'll ensure this is resolved promptly and keep you updated.";
    } else {
      opening = "Thank you for contacting us. I'm happy to help with this.";
      tone = 'helpful_professional';
      closing = 'Please let me know if you need anything else.';
    }

    return {
      opening,
      tone,
      closing,
      urgency: prob > 60 ? 'immediate' : prob > 30 ? 'high' : 'normal',
      approvalRequired: prob >= 70,
      suggestedCompensation: prob > 50 ? 'consider_discount_or_credit' : 'none',
    };
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
export default sentimentAnalyzer;
