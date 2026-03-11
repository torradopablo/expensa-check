import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify MercadoPago webhook signature
async function verifyWebhookSignature(
  req: Request,
  body: string
): Promise<boolean> {
  const WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

  // If no secret is configured, log warning but allow (for backwards compatibility during setup)
  if (!WEBHOOK_SECRET) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not configured - signature verification skipped");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    console.error("Missing signature headers", { xSignature: !!xSignature, xRequestId: !!xRequestId });
    return false;
  }

  // Parse the x-signature header (format: ts=TIMESTAMP,v1=HASH)
  const signatureParts = xSignature.split(",");
  const tsMatch = signatureParts.find(p => p.startsWith("ts="));
  const v1Match = signatureParts.find(p => p.startsWith("v1="));

  if (!tsMatch || !v1Match) {
    console.error("Invalid signature format");
    return false;
  }

  const ts = tsMatch.replace("ts=", "");
  const receivedHash = v1Match.replace("v1=", "");

  // Check timestamp to prevent replay attacks (allow 5 minutes tolerance)
  const timestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old or in future", { timestamp, now });
    return false;
  }

  // Get data.id from URL params for signature
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  // Build the manifest string as per MercadoPago docs
  // manifest = id:{data.id};request-id:{x-request-id};ts:{ts};
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Create HMAC-SHA256 hash
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computedHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = computedHash === receivedHash;
  if (!isValid) {
    console.error("Webhook signature mismatch", { manifest, receivedHash, computedHash });
  }

  return isValid;
}

// Track processed webhook IDs to prevent replay attacks (in-memory, resets on function restart)
const processedWebhooks = new Set<string>();
const MAX_PROCESSED_WEBHOOKS = 10000;

function isWebhookProcessed(id: string): boolean {
  return processedWebhooks.has(id);
}

function markWebhookProcessed(id: string): void {
  if (processedWebhooks.size >= MAX_PROCESSED_WEBHOOKS) {
    // Clear oldest entries (simple approach - clear half)
    const entries = Array.from(processedWebhooks);
    entries.slice(0, MAX_PROCESSED_WEBHOOKS / 2).forEach(e => processedWebhooks.delete(e));
  }
  processedWebhooks.add(id);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body for signature verification
    const bodyText = await req.text();

    // Log webhook attempt for security monitoring
    console.log("Webhook attempt:", {
      method: req.method,
      hasXSignature: !!req.headers.get("x-signature"),
      hasXRequestId: !!req.headers.get("x-request-id"),
      url: req.url,
    });

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(req, bodyText);
    if (!isValidSignature) {
      console.error("Invalid webhook signature - rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mercado Pago sends notifications as query params for IPN
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    // Parse body for webhook notifications
    let body: any = {};
    if (req.method === "POST" && bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        // Body might be empty for some webhook types
      }
    }

    const notificationType = topic || body.type || body.action;
    const resourceId = id || body.data?.id;

    console.log("Webhook received:", { notificationType, resourceId, body });

    // We only care about payment notifications
    if (!notificationType || !resourceId) {
      return new Response(
        JSON.stringify({ message: "Notification received but no action needed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate/replay attacks
    const webhookKey = `${notificationType}:${resourceId}`;
    if (isWebhookProcessed(webhookKey)) {
      console.log("Duplicate webhook detected, skipping:", webhookKey);
      return new Response(
        JSON.stringify({ message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Mercado Pago Access Token
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN || MERCADOPAGO_ACCESS_TOKEN.trim() === "") {
      console.error("[mercadopago-webhook] CRITICAL: MERCADOPAGO_ACCESS_TOKEN not configured or empty");
      return new Response(
        JSON.stringify({ error: "Configuration error: Missing MP token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for webhook processing
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle different notification types
    if (notificationType === "payment" || notificationType === "payment.created" || notificationType === "payment.updated") {
      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${resourceId}`,
        {
          headers: {
            Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error("Error fetching payment:", errorText);
        return new Response(
          JSON.stringify({ error: "Error fetching payment details" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
      });

      const analysisId = payment.external_reference;

      if (!analysisId) {
        console.log("No external_reference found in payment");
        markWebhookProcessed(webhookKey);
        return new Response(
          JSON.stringify({ message: "No analysis ID found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate analysisId format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(analysisId)) {
        console.error("Invalid analysisId format:", analysisId);
        return new Response(
          JSON.stringify({ error: "Invalid analysis ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Map Mercado Pago status to our status
      let newStatus: string;
      switch (payment.status) {
        case "approved":
          newStatus = "paid";
          break;
        case "pending":
        case "in_process":
          newStatus = "pending_payment";
          break;
        case "rejected":
        case "cancelled":
          newStatus = "payment_failed";
          break;
        default:
          newStatus = "pending_payment";
      }

      console.log(`Analysis ${analysisId} updated to status: ${newStatus}`);

      // Fetch the current state from DB to avoid overwriting 'completed' or 'processing'
      const { data: currentAnalysis, error: fetchStateError } = await supabase
        .from("expense_analyses")
        .select("status")
        .eq("id", analysisId)
        .single();

      let finalStatusToSet = newStatus;
      if (!fetchStateError && currentAnalysis) {
        if (currentAnalysis.status === "completed" || currentAnalysis.status === "processing") {
          console.log(`Analysis ${analysisId} is already ${currentAnalysis.status}, skipping status overwrite to ${newStatus}`);
          finalStatusToSet = currentAnalysis.status; // Keep existing status
        }
      }

      // Update the status in the database
      const { error: updateError } = await supabase
        .from("expense_analyses")
        .update({
          status: finalStatusToSet,
          payment_id: payment.id.toString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", analysisId);

      if (updateError) {
        console.error("Error updating expense analysis status:", updateError);
        return new Response(
          JSON.stringify({ error: "Error updating database" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch user_id for audit logging
      const { data: analysisData } = await supabase
        .from("expense_analyses")
        .select("user_id")
        .eq("id", analysisId)
        .single();

      // Record in payment_audits table
      const { error: auditError } = await supabase
        .from("payment_audits")
        .insert({
          analysis_id: analysisId,
          user_id: analysisData?.user_id || "00000000-0000-0000-0000-000000000000", // Fallback if not found
          mp_payment_id: payment.id.toString(),
          amount: payment.transaction_amount,
          status: payment.status,
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id,
          raw_response: payment
        });

      if (auditError) {
        console.error("Audit logging error:", auditError);
      }

      markWebhookProcessed(webhookKey);

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For merchant_order notifications
    if (notificationType === "merchant_order") {
      const orderResponse = await fetch(
        `https://api.mercadopago.com/merchant_orders/${resourceId}`,
        {
          headers: {
            Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (orderResponse.ok) {
        const order = await orderResponse.json();
        console.log("Merchant order:", order.id, "status:", order.status);

        // Validate external_reference format
        if (order.status === "closed" && order.external_reference) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(order.external_reference)) {
            // Check current status before overwriting
            const { data: currentAnalysis } = await supabase
              .from("expense_analyses")
              .select("status")
              .eq("id", order.external_reference)
              .single();

            if (!currentAnalysis || (currentAnalysis.status !== "completed" && currentAnalysis.status !== "processing")) {
              const { error } = await supabase
                .from("expense_analyses")
                .update({ status: "paid" })
                .eq("id", order.external_reference);

              if (error) {
                console.error("Error updating from merchant order:", error);
              }
            } else {
              console.log(`Merchant order skips update, analysis is already ${currentAnalysis.status}`);
            }
          } else {
            console.error("Invalid external_reference format in merchant order:", order.external_reference);
          }
        }
      }
      markWebhookProcessed(webhookKey);
    }

    return new Response(
      JSON.stringify({ message: "Webhook processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
