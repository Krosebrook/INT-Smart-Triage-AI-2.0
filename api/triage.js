/**
 * Ticket triage endpoint for INT Smart Triage AI 2.0
 * Serverless function that processes and triages support tickets
 * Uses Node.js 20 runtime with enhanced performance
 */

export default async function handler(req, res) {
  // Set security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests for ticket triage
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { ticket, priority, category } = req.body;

    // Validate input
    if (!ticket || typeof ticket !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Ticket content is required and must be a string'
      });
    }

    // Mock AI triage logic - in production this would integrate with actual AI services
    const triageResult = {
      ticketId: `TRG-${Date.now()}`,
      originalTicket: ticket,
      priority: priority || 'medium',
      category: category || 'general',
      
      // Simulated AI analysis results
      analysis: {
        sentiment: ticket.includes('urgent') || ticket.includes('emergency') ? 'negative' : 'neutral',
        complexity: ticket.length > 200 ? 'high' : 'medium',
        estimatedResolutionTime: ticket.includes('password') ? '15 minutes' : '2 hours',
        confidence: 0.85
      },
      
      // Suggested talking points for CSR
      talkingPoints: [
        "Thank you for contacting INT Inc. support",
        "I understand your concern and I'm here to help",
        "Let me review the details and provide you with the best solution"
      ],
      
      // Suggested knowledge base articles
      suggestedArticles: [
        {
          id: 'KB001',
          title: 'Common Account Issues Resolution Guide',
          relevanceScore: 0.78
        },
        {
          id: 'KB002', 
          title: 'Password Reset Procedures',
          relevanceScore: 0.65
        }
      ],
      
      // Processing metadata
      processedAt: new Date().toISOString(),
      processingTime: Math.random() * 200 + 50, // Simulated processing time in ms
      runtime: 'Node.js 20'
    };

    // Log to console (in production, this would log to Supabase)
    console.log('Ticket triaged:', {
      ticketId: triageResult.ticketId,
      priority: triageResult.priority,
      category: triageResult.category,
      processingTime: triageResult.processingTime
    });

    res.status(200).json(triageResult);

  } catch (error) {
    console.error('Triage processing error:', error);
    res.status(500).json({
      error: 'Processing failed',
      message: 'An error occurred while processing the ticket',
      timestamp: new Date().toISOString()
    });
  }
}