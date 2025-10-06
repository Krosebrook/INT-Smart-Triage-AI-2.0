export class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.isConfigured = !!this.apiKey;
  }

  async generateTriageAnalysis(ticketData) {
    if (!this.isConfigured) {
      throw new Error('Gemini API key not configured');
    }

    const { customerName, ticketSubject, issueDescription, customerTone } = ticketData;

    const prompt = this.buildTriagePrompt(customerName, ticketSubject, issueDescription, customerTone);

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      return this.parseTriageResponse(generatedText);

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate triage analysis: ${error.message}`);
    }
  }

  buildTriagePrompt(customerName, ticketSubject, issueDescription, customerTone) {
    return `You are an expert Customer Success AI assistant for INT Inc. Analyze this customer support ticket and provide a comprehensive triage report.

TICKET INFORMATION:
- Customer Name: ${customerName}
- Subject: ${ticketSubject}
- Issue Description: ${issueDescription}
- Customer Tone: ${customerTone}

TASK: Provide a detailed triage analysis in valid JSON format with the following structure:

{
  "priority": "low|medium|high",
  "category": "authentication|performance|billing|integration|ui|general",
  "confidence": "85%",
  "responseApproach": "Detailed response strategy based on tone and urgency",
  "talkingPoints": [
    "Key point 1 for CSR to emphasize",
    "Key point 2 for CSR to emphasize",
    "Key point 3 for CSR to emphasize"
  ],
  "knowledgeBase": [
    "KB-XXX: Relevant article title",
    "KB-YYY: Another relevant article"
  ],
  "kbArticleDraft": "# Knowledge Base Article Draft\\n\\n## Issue Summary\\n[Comprehensive article content based on the ticket]\\n\\n## Resolution Steps\\n1. Step 1\\n2. Step 2\\n\\n## Prevention\\nHow to avoid this issue in the future",
  "managementSummary": "Brief executive summary of the issue, priority, and recommended action for management escalation",
  "crmForwardingData": {
    "customerSegment": "enterprise|mid-market|smb",
    "accountHealth": "excellent|good|at-risk|critical",
    "upsellOpportunity": true|false,
    "churnRisk": "none|low|medium|high",
    "recommendedFollowUp": "Description of recommended follow-up actions"
  }
}

PRIORITIZATION RULES:
- HIGH: System down, data loss, security breach, angry tone, revenue impact
- MEDIUM: Degraded performance, errors affecting workflows, frustrated tone
- LOW: Questions, feature requests, general inquiries, calm tone

CATEGORY RULES:
- authentication: Login, password, access, credentials, 2FA
- performance: Slow, loading, timeout, lag, speed
- billing: Payment, invoice, subscription, charges, refund
- integration: API, webhook, sync, connection, third-party
- ui: Interface, button, display, mobile, responsive
- general: Everything else

RESPONSE APPROACH: Consider customer tone and create empathetic, actionable guidance.

TALKING POINTS: Provide 3-5 key points the CSR should emphasize in their response.

KNOWLEDGE BASE ARTICLES: Suggest relevant KB article IDs and titles.

KB ARTICLE DRAFT: Write a comprehensive knowledge base article that could be published to help other customers with similar issues.

MANAGEMENT SUMMARY: Provide a brief executive summary suitable for management escalation or reporting.

CRM FORWARDING DATA: Analyze customer health and opportunity indicators for CRM integration.

Respond ONLY with valid JSON. Do not include markdown code blocks or any text outside the JSON structure.`;
  }

  parseTriageResponse(responseText) {
    let cleanedText = responseText.trim();

    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanedText);

      if (!parsed.priority || !parsed.category || !parsed.confidence) {
        throw new Error('Missing required fields in LLM response');
      }

      if (!Array.isArray(parsed.talkingPoints) || !Array.isArray(parsed.knowledgeBase)) {
        throw new Error('Invalid array fields in LLM response');
      }

      return parsed;

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Response text:', responseText);
      throw new Error(`Invalid JSON response from Gemini: ${error.message}`);
    }
  }

  async generateKBArticle(ticketData, triageResults) {
    if (!this.isConfigured) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Based on this customer support ticket, write a comprehensive Knowledge Base article that would help other customers with similar issues.

TICKET INFORMATION:
Subject: ${ticketData.ticketSubject}
Issue: ${ticketData.issueDescription}
Category: ${triageResults.category}
Priority: ${triageResults.priority}

Write a complete KB article in Markdown format with:
1. Clear title
2. Issue summary
3. Step-by-step resolution
4. Prevention tips
5. Related resources

Format the article professionally and make it ready for publication.`;

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      console.error('KB article generation error:', error);
      return null;
    }
  }
}
