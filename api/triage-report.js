import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize Supabase client
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Schema for Gemini structured output
const triageReportSchema = {
  type: "object",
  properties: {
    severity: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
      description: "Severity level of the client issue"
    },
    category: {
      type: "string",
      description: "Primary category of the issue (e.g., technical, billing, general inquiry)"
    },
    talkingPoints: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Empathetic talking points for CSR to use"
    },
    suggestedKbArticles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          relevance: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["title", "relevance"]
      },
      description: "Suggested Knowledge Base articles"
    },
    recommendedAction: {
      type: "string",
      description: "Immediate action recommendation for the CSR"
    },
    estimatedResolutionTime: {
      type: "string",
      description: "Estimated time to resolve the issue"
    }
  },
  required: ["severity", "category", "talkingPoints", "recommendedAction"]
};

// Validation function for request body
function validateRequest(body) {
  const { domain, persona, inquiry, userId } = body;
  
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: 'domain is required and must be a string' };
  }
  
  if (!persona || typeof persona !== 'string') {
    return { valid: false, error: 'persona is required and must be a string' };
  }
  
  if (!inquiry || typeof inquiry !== 'string') {
    return { valid: false, error: 'inquiry is required and must be a string' };
  }
  
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'userId is required and must be a string' };
  }
  
  return { valid: true };
}

// Background audit logging function
async function logAuditAsync(requestData, responseData, startTime) {
  if (!supabase) {
    console.log('Audit logging skipped: Supabase not configured');
    return;
  }
  
  try {
    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    
    const auditRecord = {
      user_id: requestData.userId,
      domain: requestData.domain,
      persona: requestData.persona,
      inquiry_preview: requestData.inquiry.substring(0, 200), // Store preview only for privacy
      response_severity: responseData.severity,
      response_category: responseData.category,
      processing_time_ms: processingTime,
      timestamp: startTime.toISOString(),
      success: true
    };
    
    const { error } = await supabase
      .from('triage_reports')
      .insert([auditRecord]);
    
    if (error) {
      console.error('Audit logging error:', error);
    } else {
      console.log('Audit logged successfully for user:', requestData.userId);
    }
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const startTime = new Date();
  
  try {
    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    const { domain, persona, inquiry, userId } = req.body;
    
    // Check if Gemini AI is available
    if (!genAI) {
      // Fallback response when Gemini is not configured
      const fallbackReport = {
        severity: "medium",
        category: "general_inquiry",
        talkingPoints: [
          "Thank you for contacting us. I understand your concern.",
          "I'm here to help you resolve this issue as quickly as possible.",
          "Let me gather some additional information to better assist you."
        ],
        recommendedAction: "Review the inquiry manually and follow up with appropriate resources",
        estimatedResolutionTime: "Within 24 hours"
      };
      
      // Still try to log audit even with fallback
      setImmediate(() => logAuditAsync({ domain, persona, inquiry, userId }, fallbackReport, startTime));
      
      return res.status(200).json({ 
        success: true, 
        report: fallbackReport,
        note: "Generated using fallback - AI service unavailable"
      });
    }
    
    // Prepare the prompt for Gemini
    const prompt = `
    You are an expert AI triage system for customer service. Analyze the following customer inquiry and provide a structured triage report.
    
    Customer Domain: ${domain}
    Customer Persona: ${persona}
    Customer Inquiry: ${inquiry}
    
    Please analyze this inquiry and provide:
    1. Severity assessment (low, medium, high, critical)
    2. Issue category
    3. Empathetic talking points for the CSR to use
    4. Suggested Knowledge Base articles (if applicable)
    5. Recommended immediate action
    6. Estimated resolution time
    
    Focus on being helpful, empathetic, and actionable. Consider the customer's persona and domain context.
    `;
    
    // Get the generative model with structured output
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: triageReportSchema
      }
    });
    
    // Generate the triage report
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const triageReport = JSON.parse(responseText);
    
    // Start background audit logging asynchronously
    setImmediate(() => logAuditAsync({ domain, persona, inquiry, userId }, triageReport, startTime));
    
    // Return immediate response
    return res.status(200).json({
      success: true,
      report: triageReport
    });
    
  } catch (error) {
    console.error('Triage report generation failed:', error);
    
    // Log failed attempt
    if (supabase) {
      setImmediate(async () => {
        try {
          const failedAuditRecord = {
            user_id: req.body?.userId || 'unknown',
            domain: req.body?.domain || 'unknown',
            persona: req.body?.persona || 'unknown',
            inquiry_preview: req.body?.inquiry?.substring(0, 200) || 'unknown',
            processing_time_ms: new Date().getTime() - startTime.getTime(),
            timestamp: startTime.toISOString(),
            success: false,
            error_message: error.message
          };
          
          await supabase.from('triage_reports').insert([failedAuditRecord]);
        } catch (auditError) {
          console.error('Failed to log error audit:', auditError);
        }
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error while generating triage report' 
    });
  }
}