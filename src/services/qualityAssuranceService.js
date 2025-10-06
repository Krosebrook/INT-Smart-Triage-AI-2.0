import { supabase } from './supabaseClient.js';

export class QualityAssuranceService {
  constructor() {
    this.qualityCriteria = {
      tone: {
        weight: 0.25,
        keywords: {
          positive: ['thank', 'appreciate', 'glad', 'happy', 'pleasure'],
          negative: ['unfortunately', 'sorry', 'apologize'],
          professional: ['regarding', 'additionally', 'furthermore', 'therefore']
        }
      },
      completeness: {
        weight: 0.3,
        minLength: 50,
        shouldInclude: ['greeting', 'solution', 'closing']
      },
      accuracy: {
        weight: 0.25,
        checkSpelling: true,
        checkGrammar: true
      },
      personalization: {
        weight: 0.2,
        checkCustomerName: true,
        checkContext: true
      }
    };
  }

  async reviewResponse(ticketId, responseText, csrId) {
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
      throw new Error('Ticket not found');
    }

    const aiReview = await this.performAIReview(responseText, ticket);
    const manualChecks = this.performManualChecks(responseText, ticket);

    const combinedScore = this.calculateOverallScore(aiReview, manualChecks);
    const feedback = this.generateFeedback(aiReview, manualChecks);

    return {
      score: combinedScore,
      passed: combinedScore >= 0.7,
      feedback,
      aiReview,
      manualChecks
    };
  }

  async performAIReview(responseText, ticket) {
    try {
      const response = await fetch('/api/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseText,
          ticketSubject: ticket.subject,
          ticketDescription: ticket.description,
          customerName: ticket.customer?.name
        })
      });

      if (!response.ok) {
        throw new Error('AI review failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI review error:', error);
      return {
        tone_score: 0.5,
        completeness_score: 0.5,
        professionalism_score: 0.5,
        suggestions: ['AI review unavailable']
      };
    }
  }

  performManualChecks(responseText, ticket) {
    const checks = {
      hasGreeting: this.checkGreeting(responseText),
      hasClosing: this.checkClosing(responseText),
      hasCustomerName: this.checkCustomerName(responseText, ticket.customer?.name),
      meetsMinLength: responseText.length >= this.qualityCriteria.completeness.minLength,
      hasSolution: this.checkSolution(responseText),
      appropriateLength: responseText.length >= 50 && responseText.length <= 2000,
      noSpellingErrors: this.basicSpellCheck(responseText)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const score = passedChecks / totalChecks;

    return { checks, score };
  }

  checkGreeting(text) {
    const greetings = ['hi', 'hello', 'dear', 'good morning', 'good afternoon', 'thank you for'];
    return greetings.some(greeting => text.toLowerCase().includes(greeting));
  }

  checkClosing(text) {
    const closings = ['regards', 'sincerely', 'best', 'thank you', 'please let', 'feel free'];
    return closings.some(closing => text.toLowerCase().includes(closing));
  }

  checkCustomerName(text, customerName) {
    if (!customerName) return true;
    const firstName = customerName.split(' ')[0];
    return text.includes(firstName);
  }

  checkSolution(text) {
    const solutionKeywords = ['please', 'you can', 'to resolve', 'solution', 'fix', 'try', 'follow', 'steps'];
    return solutionKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  basicSpellCheck(text) {
    const commonMisspellings = {
      'recieve': 'receive',
      'seperate': 'separate',
      'occured': 'occurred',
      'accomodate': 'accommodate'
    };

    const lowerText = text.toLowerCase();
    return !Object.keys(commonMisspellings).some(mistake => lowerText.includes(mistake));
  }

  calculateOverallScore(aiReview, manualChecks) {
    const aiScore = (
      (aiReview.tone_score || 0.5) * this.qualityCriteria.tone.weight +
      (aiReview.completeness_score || 0.5) * this.qualityCriteria.completeness.weight +
      (aiReview.professionalism_score || 0.5) * this.qualityCriteria.accuracy.weight
    );

    const manualScore = manualChecks.score * this.qualityCriteria.personalization.weight;

    return Math.min(aiScore + manualScore, 1.0);
  }

  generateFeedback(aiReview, manualChecks) {
    const feedback = [];

    if (!manualChecks.checks.hasGreeting) {
      feedback.push('Consider adding a greeting to make the response more personal');
    }

    if (!manualChecks.checks.hasClosing) {
      feedback.push('Add a closing statement to end the message professionally');
    }

    if (!manualChecks.checks.hasCustomerName) {
      feedback.push('Personalize the response by using the customer\'s name');
    }

    if (!manualChecks.checks.meetsMinLength) {
      feedback.push('Response may be too brief. Provide more detail or context');
    }

    if (!manualChecks.checks.appropriateLength) {
      feedback.push('Response length should be between 50-2000 characters');
    }

    if (!manualChecks.checks.hasSolution) {
      feedback.push('Ensure you provide clear next steps or a solution');
    }

    if (!manualChecks.checks.noSpellingErrors) {
      feedback.push('Check for spelling errors in your response');
    }

    if (aiReview.suggestions) {
      feedback.push(...aiReview.suggestions);
    }

    return feedback;
  }

  async saveReview(messageId, reviewResults) {
    const { error } = await supabase
      .from('ticket_messages')
      .update({
        ai_reviewed: true,
        ai_review_score: reviewResults.score,
        ai_review_feedback: reviewResults
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  }

  async getCSRQualityMetrics(csrId, periodDays = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: messages, error } = await supabase
      .from('ticket_messages')
      .select('ai_review_score')
      .eq('sender_id', csrId)
      .eq('sender_type', 'csr')
      .eq('ai_reviewed', true)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error loading CSR metrics:', error);
      return null;
    }

    if (!messages || messages.length === 0) {
      return {
        avgScore: 0,
        totalReviewed: 0,
        passRate: 0
      };
    }

    const scores = messages
      .filter(m => m.ai_review_score !== null)
      .map(m => m.ai_review_score);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passRate = scores.filter(s => s >= 0.7).length / scores.length;

    return {
      avgScore,
      totalReviewed: messages.length,
      passRate
    };
  }

  async autoReviewMessage(messageId) {
    const { data: message, error } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        ticket:tickets(
          *,
          customer:customers(*)
        )
      `)
      .eq('id', messageId)
      .single();

    if (error || !message || message.sender_type !== 'csr') {
      return null;
    }

    const reviewResults = await this.reviewResponse(
      message.ticket_id,
      message.message,
      message.sender_id
    );

    await this.saveReview(messageId, reviewResults);

    if (!reviewResults.passed) {
      console.log(`Quality check failed for message ${messageId}:`, reviewResults.feedback);
    }

    return reviewResults;
  }
}

export const qualityAssuranceService = new QualityAssuranceService();
