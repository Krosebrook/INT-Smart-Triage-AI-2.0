const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Triage report endpoint
app.post('/api/triage-report', async (req, res) => {
  try {
    const {
      ticketId,
      priority,
      category,
      summary,
      suggestedResponse,
      kbArticles,
      timestamp
    } = req.body;

    // Basic validation
    if (!ticketId || !priority || !category || !summary) {
      return res.status(400).json({
        error: 'Missing required fields: ticketId, priority, category, summary'
      });
    }

    // Simulate database insert
    const triageReport = {
      id: Math.floor(Math.random() * 10000),
      ticketId,
      priority,
      category,
      summary,
      suggestedResponse: suggestedResponse || '',
      kbArticles: kbArticles || [],
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // In a real implementation, this would save to Supabase
    console.log('Triage report received:', triageReport);

    res.status(201).json({
      success: true,
      message: 'Triage report processed successfully',
      data: triageReport
    });

  } catch (error) {
    console.error('Error processing triage report:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'INT Smart Triage AI 2.0',
    description: 'Secure, production-ready AI Triage Tool for INT Inc. Client Success',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'POST /api/triage-report'
    ]
  });
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`INT Smart Triage AI server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;