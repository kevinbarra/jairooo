// api/send-sms.js
import twilio from "twilio";

/**
 * Función Serverless para Vercel.
 * Recibe JSON: { name, email, phone, message, lang }
 * Envía un SMS a process.env.SMS_TO usando Twilio.
 */

const ALLOWED_ORIGINS = ["*"]; // Puedes poner tu dominio: ["https://tu-dominio.vercel.app"]

export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
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

    // Construimos el texto
    const text =
      (lang === "en"
        ? `New lead from website:\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\nMessage: ${message}`
        : `Nuevo lead del sitio:\nNombre: ${name}\nEmail: ${email}\nTel: ${phone || "-"}\nMensaje: ${message}`);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM; // por ej. +12065550123 (número de Twilio)
    const toNumber   = process.env.SMS_TO;      // por ej. +1206XXXXXXX (número de tu familiar)

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      return res.status(500).json({ ok: false, error: "Missing Twilio env vars" });
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: text.slice(0, 1600), // límite seguro
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SMS error:", err);
    return res.status(500).json({ ok: false, error: "SMS failed" });
  }
}
