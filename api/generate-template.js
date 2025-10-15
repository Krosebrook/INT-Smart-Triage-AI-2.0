import { sanitizeInput } from '../src/utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, tone, context } = req.body;

  if (!context || !category || !tone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sanitizedContext = sanitizeInput(context);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a professional customer support response template with the following criteria:

Category: ${category}
Tone: ${tone}
Context: ${sanitizedContext}

Requirements:
- Use {{customer_name}}, {{product_name}}, and other relevant variables for dynamic content
- Keep it concise but complete (2-4 paragraphs)
- Include appropriate greeting and closing
- Match the specified tone
- Be professional and helpful
- Include placeholder variables in {{double_braces}} format

Generate only the template text, no additional commentary.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const template = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ template });
  } catch (error) {
    console.error('Template generation error:', error);
    return res.status(500).json({ error: 'Failed to generate template' });
  }
}
