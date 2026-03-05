import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/config/cors.ts";

// ========== CONFIGURATION ==========
const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") || "soporte@expensacheck.com";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

// ========== EMAIL HELPERS ==========
async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY_MISSING: Set BREVO_API_KEY in Supabase secrets");
  }

  console.log(`[Email] Sending via Brevo to ${to}`);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "ExpensaCheck", email: "noreply@expensacheck.com.ar" },
      to: [{ email: to }],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject: subject,
      htmlContent: html,
    }),
  });

  if (response.ok) return { success: true, provider: "brevo" };

  const errorData = await response.json();
  console.error(`[Email] Brevo failed:`, errorData);
  throw new Error(`BREVO_FAILED: ${JSON.stringify(errorData)}`);
}

// ========== RATE LIMITING ==========
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
}

const subjectLabels: Record<string, string> = {
  consulta: "Consulta general",
  soporte: "Soporte técnico",
  sugerencia: "Sugerencia",
  reclamo: "Reclamo",
  datos_personales: "Solicitud sobre datos personales",
  lanzamiento: "Interés en Lanzamiento",
  otro: "Otro",
};

// ========== EMAIL TEMPLATE ==========
function getEmailTemplate({ title, body, actionText, actionUrl }: { title: string; body: string; actionText?: string; actionUrl?: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #334155;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      padding: 30px;
      text-align: center;
    }
    .logo-text {
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    h1 {
      color: #0f172a;
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    p {
      color: #475569;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 50px;
      text-decoration: none;
      margin-top: 10px;
      margin-bottom: 10px;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">ExpensaCheck</div>
    </div>
    <div class="content">
      <h1>${title}</h1>
      <p>${body}</p>
      ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ""}
    </div>
    <div class="footer">
      <p style="margin: 0;">&copy; 2026 ExpensaCheck. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitKey = getRateLimitKey(req);
    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Intentá más tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, subject, message, honeypot }: ContactEmailRequest = await req.json();

    if (honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subjectLabel = subjectLabels[subject] || subject;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    console.log(`Contact request from ${safeEmail} for ${subjectLabel}`);

    // 1. Send notification to admin
    const adminHtml = getEmailTemplate({
      title: "Nuevo mensaje de contacto",
      body: `
        <strong>De:</strong> ${safeName} (<a href="mailto:${safeEmail}">${safeEmail}</a>)<br/>
        <strong>Asunto:</strong> ${subjectLabel}<br/>
        <br/>
        <strong>Mensaje:</strong><br/>
        ${safeMessage.replace(/\n/g, "<br/>")}
      `
    });

    await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[ExpensaCheck] ${subjectLabel} - ${safeName}`,
      html: adminHtml,
    });

    // 2. Send confirmation to user
    try {
      let userTitle = "¡Recibimos tu mensaje!";
      let userBody = `Hola ${safeName}, gracias por contactarnos. Hemos recibido tu consulta sobre <strong>${subjectLabel}</strong> y te responderemos a la brevedad.`;
      let actionText = undefined;
      let actionUrl = undefined;

      // Specialized content for waitlist signups
      if (subject === "lanzamiento") {
        userTitle = "¡Bienvenido a ExpensaCheck!";
        userBody = `¡Gracias por tu interés en sumarte a nuestra revolución! Te anotamos en la lista de espera para el lanzamiento oficial. Te avisaremos por este medio apenas estemos listos para que comiences a optimizar tus expensas.`;
        actionText = "Ver Novedades";
        actionUrl = "https://expensacheck.com.ar"; // Change to actual blog/social if exists
      }

      const userHtml = getEmailTemplate({
        title: userTitle,
        body: userBody,
        actionText,
        actionUrl
      });

      await sendEmail({
        to: email,
        subject: subject === "lanzamiento" ? "¡Ya estás en la lista de espera! - ExpensaCheck" : "Recibimos tu mensaje - ExpensaCheck",
        html: userHtml,
      });
    } catch (confError: any) {
      console.warn("[Email] User confirmation failed:", confError.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Email] Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Error en el servicio de correo",
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);