// Production-ready Triage API Implementation
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for frequently accessed data
let personasCache = null;
let knowledgeBaseCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load data with caching
async function loadData() {
    const now = Date.now();
    if (personasCache && knowledgeBaseCache && (now - cacheTimestamp < CACHE_TTL)) {
        return { personas: personasCache, knowledgeBase: knowledgeBaseCache };
    }

    try {
        const [personasData, kbData] = await Promise.all([
            fs.readFile(path.join(__dirname, '../data/personas.json'), 'utf8'),
            fs.readFile(path.join(__dirname, '../data/kb.json'), 'utf8')
        ]);

        personasCache = JSON.parse(personasData);
        knowledgeBaseCache = JSON.parse(kbData);
        cacheTimestamp = now;

        return { personas: personasCache, knowledgeBase: knowledgeBaseCache };
    } catch (error) {
        console.error('Failed to load data:', error); // eslint-disable-line no-console
        throw new Error('Failed to load system data');
    }
}

// Advanced sentiment analysis
function analyzeSentiment(text) {
    const positiveWords = [
        'thank', 'please', 'appreciate', 'great', 'good', 'excellent', 
        'wonderful', 'amazing', 'fantastic', 'love', 'perfect', 'happy'
    ];
    
    const negativeWords = [
        'frustrated', 'angry', 'terrible', 'awful', 'horrible', 'hate',
        'annoyed', 'disappointed', 'upset', 'furious', 'outraged', 'disgusted'
    ];
    
    const urgentWords = [
        'urgent', 'critical', 'asap', 'emergency', 'immediately', 'now',
        'quickly', 'fast', 'urgent', 'priority', 'escalate'
    ];

    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    let urgencyScore = 0;

    positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        positiveScore += (lowerText.match(regex) || []).length;
    });

    negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        negativeScore += (lowerText.match(regex) || []).length;
    });

    urgentWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        urgencyScore += (lowerText.match(regex) || []).length;
    });

    // Determine overall sentiment
    let sentiment = 'neutral';
    let confidence = 0.5;

    if (positiveScore > negativeScore) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + (positiveScore * 0.1));
    } else if (negativeScore > positiveScore) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (negativeScore * 0.1));
    }

    return {
        sentiment,
        confidence: Math.round(confidence * 100),
        scores: { positive: positiveScore, negative: negativeScore, urgency: urgencyScore }
    };
}

// Intelligent priority determination
function determinePriority(text, domain, sentimentData) {
    let priorityScore = 0;

    // Base priority by domain
    const domainPriority = {
        'technical': 2,
        'billing': 1,
        'sales': 1,
        'general': 0
    };
    priorityScore += domainPriority[domain] || 0;

    // Urgency indicators
    priorityScore += sentimentData.scores.urgency * 2;

    // Negative sentiment increases priority
    if (sentimentData.sentiment === 'negative') {
        priorityScore += sentimentData.scores.negative;
    }

    // Business impact keywords
    const businessImpactWords = [
        'production', 'outage', 'down', 'broken', 'not working', 'offline',
        'revenue', 'customer', 'clients', 'business critical'
    ];
    
    const lowerText = text.toLowerCase();
    businessImpactWords.forEach(word => {
        if (lowerText.includes(word)) {
            priorityScore += 3;
        }
    });

    // Determine final priority
    if (priorityScore >= 5) return 'critical';
    if (priorityScore >= 3) return 'high';
    if (priorityScore >= 1) return 'medium';
    return 'low';
}

// Find relevant KB articles using advanced matching
function findRelevantKBArticles(domain, text, knowledgeBase, limit = 3) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter(word => word.length > 3);
    
    return knowledgeBase
        .map(article => {
            let relevanceScore = 0;
            
            // Domain match
            if (article.category === domain) {
                relevanceScore += 10;
            }
            
            // Tag matches
            article.tags.forEach(tag => {
                if (lowerText.includes(tag)) {
                    relevanceScore += 5;
                }
            });
            
            // Title/content keyword matches
            words.forEach(word => {
                if (article.title.toLowerCase().includes(word)) {
                    relevanceScore += 3;
                }
                if (article.summary.toLowerCase().includes(word)) {
                    relevanceScore += 2;
                }
                if (article.content.toLowerCase().includes(word)) {
                    relevanceScore += 1;
                }
            });
            
            // Popularity boost
            relevanceScore += article.popularity_score * 0.1;
            
            return { ...article, relevanceScore };
        })
        .filter(article => article.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
}

// Generate persona-appropriate response
function generateResponse(ticket, domain, persona, priority, sentimentData) {
    const templates = persona.response_templates;
    let greeting = templates.greeting || 'Thank you for contacting us.';
    
    // Adjust greeting based on sentiment
    if (sentimentData.sentiment === 'negative') {
        greeting = `I sincerely apologize for the inconvenience you're experiencing. ${greeting}`;
    } else if (sentimentData.sentiment === 'positive') {
        greeting = `${greeting} I appreciate your patience.`;
    }

    // Build response body
    let responseBody = '';
    if (persona.communication_style === 'empathetic') {
        responseBody = `I understand how ${sentimentData.sentiment === 'negative' ? 'frustrating' : 'important'} this ${domain} matter is for you. `;
    } else if (persona.communication_style === 'technical') {
        responseBody = `I'll investigate this ${domain} issue thoroughly. `;
    } else if (persona.communication_style === 'formal') {
        responseBody = `I will personally ensure your ${domain} inquiry receives proper attention. `;
    } else {
        responseBody = `I'm here to help with your ${domain} request. `;
    }

    // Add urgency acknowledgment
    if (priority === 'critical' || priority === 'high') {
        responseBody += 'Given the urgency of your request, I will prioritize this immediately. ';
    }

    // Investigation statement
    const investigation = templates.investigation || 'I will investigate this matter and provide a resolution.';
    
    // Closing
    const closing = `Best regards,\n${persona.name}\n${persona.role}\n${persona.department}`;

    return `${greeting}\n\n${responseBody}\n\n${investigation}\n\n${closing}`;
}

// Main triage processing function
export async function processTriage(ticketData) {
    const startTime = Date.now();
    
    try {
        // Validate input
        if (!ticketData || !ticketData.ticket || !ticketData.domain) {
            throw new Error('Invalid ticket data: missing required fields');
        }

        // Load system data
        const { personas, knowledgeBase } = await loadData();

        // Find persona
        const persona = personas.find(p => p.id === ticketData.persona?.id);
        if (!persona) {
            throw new Error('Invalid persona specified');
        }

        // Analyze ticket content
        const sentimentData = analyzeSentiment(ticketData.ticket);
        const priority = determinePriority(ticketData.ticket, ticketData.domain, sentimentData);
        const relevantArticles = findRelevantKBArticles(ticketData.domain, ticketData.ticket, knowledgeBase);
        const suggestedResponse = generateResponse(ticketData.ticket, ticketData.domain, persona, priority, sentimentData);

        // Calculate processing metrics
        const processingTime = Date.now() - startTime;
        const wordCount = ticketData.ticket.split(/\s+/).length;
        
        // Build response
        const triageResult = {
            success: true,
            ticket_id: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            timestamp: new Date().toISOString(),
            priority,
            category: getCategoryFromDomain(ticketData.domain),
            sentiment: sentimentData.sentiment,
            sentiment_confidence: sentimentData.confidence,
            suggested_response: suggestedResponse,
            kb_articles: relevantArticles,
            persona_context: persona,
            processing_metrics: {
                processing_time_ms: processingTime,
                word_count: wordCount,
                kb_articles_matched: relevantArticles.length,
                sentiment_scores: sentimentData.scores
            },
            analytics: {
                urgency_indicators: sentimentData.scores.urgency,
                business_impact_score: calculateBusinessImpact(ticketData.ticket),
                estimated_resolution_time: estimateResolutionTime(priority, ticketData.domain, wordCount),
                escalation_recommended: shouldEscalate(priority, sentimentData, persona)
            }
        };

        return triageResult;
    } catch (error) {
        console.error('Triage processing error:', error); // eslint-disable-line no-console
        throw error;
    }
}

// Helper functions
function getCategoryFromDomain(domain) {
    const categoryMap = {
        'technical': 'Technical Issue',
        'billing': 'Billing Inquiry',
        'general': 'General Support',
        'sales': 'Sales Question'
    };
    return categoryMap[domain] || 'Uncategorized';
}

function calculateBusinessImpact(text) {
    const businessKeywords = [
        'production', 'revenue', 'customer', 'business', 'critical',
        'outage', 'downtime', 'loss', 'impact', 'urgent'
    ];
    
    let score = 0;
    businessKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
            score += 1;
        }
    });
    
    return Math.min(score * 10, 100); // Scale to 0-100
}

function estimateResolutionTime(priority, domain, wordCount) {
    const baseTime = {
        'technical': 4,
        'billing': 2,
        'general': 1,
        'sales': 0.5
    };
    
    const priorityMultiplier = {
        'critical': 0.25,
        'high': 0.5,
        'medium': 1,
        'low': 2
    };
    
    const complexityMultiplier = wordCount > 100 ? 1.5 : 1;
    
    return Math.round((baseTime[domain] || 2) * priorityMultiplier[priority] * complexityMultiplier * 100) / 100;
}

function shouldEscalate(priority, sentimentData, persona) {
    if (priority === 'critical') return true;
    if (priority === 'high' && sentimentData.sentiment === 'negative') return true;
    if (persona.escalation_threshold === 'low' && priority !== 'low') return true;
    
    return false;
}

// Export for testing
export {
    analyzeSentiment,
    determinePriority,
    findRelevantKBArticles,
    generateResponse
};