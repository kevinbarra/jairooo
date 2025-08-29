// api/send-sms.js
// Enviar "lead" por EMAIL vía Resend (plan gratis)
// ENV requeridas en Vercel:
//  - RESEND_API_KEY
//  - EMAIL_TO        (correo de tu familiar que recibirá los leads)
//  - EMAIL_FROM      (remitente verificado en Resend, p.ej. leads@tudominio.com)
// Opcional:
//  - SITE_ORIGIN     (p.ej. https://jairos-flooring.vercel.app) para CORS estricto

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || "*";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { name, email, phone, message, lang } = req.body || {};

    // Validación mínima
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_TO = process.env.EMAIL_TO;
    const EMAIL_FROM = process.env.EMAIL_FROM;

    if (!RESEND_API_KEY || !EMAIL_TO || !EMAIL_FROM) {
      return res.status(500).json({ ok: false, error: "Missing email env vars" });
    }

    const subject =
      lang === "en" ? "New lead – Jairo’s Flooring" : "Nuevo lead – Jairo’s Flooring";

    const html = `
      <h2 style="font-family:Arial,sans-serif;margin:0 0 12px 0;">${subject}</h2>
      <p style="font-family:Arial,sans-serif;margin:8px 0;"><b>Name/Nombre:</b> ${escapeHtml(name)}</p>
      <p style="font-family:Arial,sans-serif;margin:8px 0;"><b>Email:</b> ${escapeHtml(email)}</p>
      <p style="font-family:Arial,sans-serif;margin:8px 0;"><b>Phone/Tel:</b> ${escapeHtml(phone || "-")}</p>
      <p style="font-family:Arial,sans-serif;margin:8px 0;"><b>Message/Mensaje:</b><br>${nl2br(escapeHtml(message))}</p>
    `;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        to: EMAIL_TO,
        from: EMAIL_FROM,
        subject,
        html
      })
    });

    if (!r.ok) {
      const err = await r.text().catch(() => "");
      console.error("Resend error:", err);
      return res.status(502).json({ ok: false, error: "Email failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Email handler error:", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}

// Helpers simples de seguridad/render
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function nl2br(str = "") {
  return String(str).replaceAll(/\r?\n/g, "<br>");
}
