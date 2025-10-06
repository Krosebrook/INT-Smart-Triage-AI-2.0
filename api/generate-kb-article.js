import { sanitizeInput } from '../src/utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, description, messages } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sanitizedSubject = sanitizeInput(subject);
  const sanitizedDescription = sanitizeInput(description || '');

  try {
    const messagesSummary = messages
      ?.filter(m => m.sender_type === 'csr')
      .map(m => m.message)
      .join('\n') || '';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a knowledge base article from this support ticket:

Subject: ${sanitizedSubject}
Description: ${sanitizedDescription}
Resolution: ${messagesSummary}

Generate a comprehensive KB article in JSON format with these fields:
- title: Clear, searchable title
- content: Well-structured article content with steps/solutions (markdown format)
- category: One of: technical, billing, account, general
- tags: Array of 3-5 relevant tags

Return ONLY valid JSON, no additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const article = JSON.parse(jsonMatch[0]);

    return res.status(200).json(article);
  } catch (error) {
    console.error('KB article generation error:', error);
    return res.status(500).json({ error: 'Failed to generate article' });
  }
}
