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

INT Inc. provides 7 core service categories:
1. Information Security (InfoSec) - Security assessments, SOC 2 compliance, cyber insurance, managed security
2. Technology - Managed IT, email migration, SaaS migration, business insights, hosting
3. Website Design - Custom websites, e-commerce, refreshes, migrations, accessibility
4. Branding & Identity - Brand strategy, logo design, visual identity, messaging
5. Content Creation & Strategy - Content strategy, SEO copywriting, e-books, whitepapers
6. Managed Marketing - Marketing automation, HubSpot, CRM, email campaigns, inbound marketing
7. Operations - Bookkeeping, startup fundamentals, process management, AI Your BI℠

INT Tagline: "Our Purpose is Your Business"

TICKET INFORMATION:
- Customer Name: ${customerName}
- Subject: ${ticketSubject}
- Issue Description: ${issueDescription}
- Customer Tone: ${customerTone}

TASK: Provide a detailed triage analysis in valid JSON format with the following structure:

{
  "priority": "low|medium|high",
  "category": "infosec|technology|website_design|branding|content|marketing|operations|general",
  "confidence": "85%",
  "responseApproach": "Detailed response strategy based on tone and urgency, aligned with INT's professional partner approach",
  "talkingPoints": [
    "Key point 1 for CSR to emphasize (solution-focused)",
    "Key point 2 for CSR to emphasize (knowledgeable but approachable)",
    "Key point 3 for CSR to emphasize (partner mentality)"
  ],
  "knowledgeBase": [
    "KB-XXX: Relevant INT service article title",
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
- HIGH: Security breach, system down, audit deadline, startup registration urgent, angry tone, revenue impact
- MEDIUM: Website project, migration, marketing campaign setup, frustrated tone, workflow errors
- LOW: Package information, general inquiry, consultation request, calm tone

CATEGORY RULES:
- infosec: Security, SOC 2, compliance, audit, vulnerability, cyber insurance, breach, HIPAA, ISO 27001
- technology: Managed IT, helpdesk, email migration, network, server, cloud, SaaS migration, Microsoft 365, hosting, backup
- website_design: Website, web design, e-commerce, WordPress, CMS, mobile responsive, accessibility, ADA, WCAG, hosting
- branding: Brand, logo, visual identity, rebrand, collateral, brand voice, messaging, style guide
- content: Content strategy, SEO, blog, e-book, whitepaper, copywriting, thought leadership
- marketing: Marketing, HubSpot, CRM, automation, email campaign, drip campaign, Salesforce, analytics, lead generation, inbound
- operations: Bookkeeping, accounting, startup, EIN, process management, HRIS, payroll, benefits, AI Your BI, FinCEN
- general: Everything else or unclear requests

RESPONSE APPROACH: Consider customer tone and create empathetic, actionable guidance using INT's professional, partner-focused communication style.

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
