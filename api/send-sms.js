// api/send-sms.js
// Vercel Serverless Function (Node.js, ESM)
// Requiere ENV: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, SMS_TO
// Opcional: SITE_ORIGIN (p.ej. https://jairos-flooring.vercel.app)

import twilio from "twilio";

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || "*";

export default async function handler(req, res) {
  // CORS básico / preflight
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

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM; // +12065550123 (Twilio)
    const toNumber   = process.env.SMS_TO;      // +1206XXXXXXX (familiar)

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      return res.status(500).json({ ok: false, error: "Missing Twilio env vars" });
    }

    const client = twilio(accountSid, authToken);

    // Mensaje compacto; máx ~1600 chars por seguridad
    const header = lang === "en" ? "New lead from website" : "Nuevo lead del sitio";
    const text = [
      `${header}: Jairo's Flooring`,
      `Name/Nombre: ${name}`,
      `Email: ${email}`,
      `Phone/Tel: ${phone || "-"}`,
      `Message/Mensaje: ${message}`
    ].join(" | ").slice(0, 1600);

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: text,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SMS error:", err);
    return res.status(500).json({ ok: false, error: "SMS failed" });
  }
}
