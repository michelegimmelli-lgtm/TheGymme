const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const DEFAULT_TO_EMAIL = "thegymme83@gmail.com";
const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

const requestStore = new Map();

function json(res, status, payload) {
  res.status(status).json(payload);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === "object") {
    return req.body;
  }
  return {};
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestStore.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    requestStore.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  requestStore.set(ip, { count: entry.count + 1, start: entry.start });
  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWithResend({ from, to, replyTo, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("missing_resend_api_key");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`resend_error:${response.status}:${details}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return json(res, 429, { error: "Too many requests. Retry later." });
  }

  const body = parseBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const website = String(body.website || "").trim();

  if (website) {
    return json(res, 200, { ok: true });
  }

  if (name.length < 2 || name.length > 80) {
    return json(res, 400, { error: "Invalid name" });
  }
  if (!isValidEmail(email) || email.length > 180) {
    return json(res, 400, { error: "Invalid email" });
  }
  if (message.length < 10 || message.length > 3000) {
    return json(res, 400, { error: "Invalid message" });
  }

  const to =
    process.env.CONTACT_TO_EMAIL ||
    process.env.CONTACT_TO_MAIL ||
    DEFAULT_TO_EMAIL;
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    process.env.CONTACT_FROM_MAIL ||
    DEFAULT_FROM_EMAIL;
  if (!to || !from) {
    return json(res, 500, {
      error: "Missing CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL env vars",
      detail:
        `env_debug to_email=${Boolean(process.env.CONTACT_TO_EMAIL)} ` +
        `to_mail=${Boolean(process.env.CONTACT_TO_MAIL)} ` +
        `from_email=${Boolean(process.env.CONTACT_FROM_EMAIL)} ` +
        `from_mail=${Boolean(process.env.CONTACT_FROM_MAIL)}`,
    });
  }

  try {
    await sendWithResend({
      from,
      to,
      replyTo: email,
      subject: `Nuovo contatto da TheGymme (${name})`,
      text:
        `Nome: ${name}\n` +
        `Email: ${email}\n` +
        `IP: ${ip}\n\n` +
        "Messaggio:\n" +
        message,
    });
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return json(res, 500, {
      error: "Failed to send message",
      detail: String(error?.message || "unknown_error"),
    });
  }
};
