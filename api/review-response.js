import { sanitizeInput } from '../src/utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { response, ticketSubject, ticketDescription, customerName } = req.body;

  if (!response) {
    return res.status(400).json({ error: 'Missing response text' });
  }

  const sanitizedResponse = sanitizeInput(response);
  const sanitizedSubject = sanitizeInput(ticketSubject || '');
  const sanitizedDescription = sanitizeInput(ticketDescription || '');

  try {
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Review this customer support response for quality assurance:

Original Ticket:
Subject: ${sanitizedSubject}
Description: ${sanitizedDescription}
Customer Name: ${customerName || 'Not provided'}

CSR Response:
${sanitizedResponse}

Evaluate the response on these criteria (score each 0.0 to 1.0):
1. Tone (professional, empathetic, appropriate)
2. Completeness (addresses all issues, provides solution)
3. Professionalism (grammar, spelling, formatting)

Return JSON with:
{
  "tone_score": 0.0-1.0,
  "completeness_score": 0.0-1.0,
  "professionalism_score": 0.0-1.0,
  "suggestions": ["specific improvement suggestions"]
}

Return ONLY valid JSON, no additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!apiResponse.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await apiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const review = JSON.parse(jsonMatch[0]);

    return res.status(200).json(review);
  } catch (error) {
    console.error('Response review error:', error);
    return res.status(500).json({ error: 'Failed to review response' });
  }
}
