import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, reportId, to, subject, body } = await req.json();

    console.log(`Email notification: ${type} for report ${reportId} to ${to}`);

    const emailData = {
      type,
      reportId,
      to,
      subject: subject || `Report Notification: ${reportId}`,
      body: body || `You have a new notification for report ${reportId}`,
      sentAt: new Date().toISOString(),
      status: 'queued'
    };

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email notification queued',
      data: emailData
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});