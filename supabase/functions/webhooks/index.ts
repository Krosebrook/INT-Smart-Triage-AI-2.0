import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, data } = await req.json();

    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);

    if (webhookError) throw webhookError;

    const results = [];

    for (const webhook of webhooks || []) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Signature': await generateSignature(webhook.secret, data)
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString()
          })
        });

        results.push({
          webhookId: webhook.id,
          success: response.ok,
          status: response.status
        });

        await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            event,
            status: response.ok ? 'success' : 'failed',
            response_status: response.status
          });

      } catch (error) {
        results.push({
          webhookId: webhook.id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      webhooksSent: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateSignature(secret: string, data: any): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataStr = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataStr);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}