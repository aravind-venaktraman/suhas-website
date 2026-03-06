import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import {
  enforceBrowserOrigin,
  enforceJsonRequest,
  enforceRateLimit,
  getClientIp,
  jsonError,
  logSecurityEvent,
  verifyCaptchaToken,
} from "./_security.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_BODY_LIMIT_BYTES = 4 * 1024;

function hashEmailForLog(email) {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  if (!enforceJsonRequest(req, res, { maxBytes: SIGNUP_BODY_LIMIT_BYTES })) {
    return;
  }

  if (!enforceBrowserOrigin(req, res)) {
    return;
  }

  const rateLimit = await enforceRateLimit(req, res, {
    routeKey: "email-signup",
    maxRequests: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    logSecurityEvent("rate_limited", {
      route: "email-signup",
      ip: rateLimit.ip,
      status: 429,
    });
    return;
  }

  const { email, source = "unknown", captchaToken } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return jsonError(res, 400, "INVALID_EMAIL", "Invalid email");
  }

  const ip = getClientIp(req);
  const captchaVerification = await verifyCaptchaToken(captchaToken, ip);
  if (!captchaVerification.ok) {
    logSecurityEvent("captcha_rejected", {
      route: "email-signup",
      ip,
      status: 403,
      reason: captchaVerification.reason,
    });
    return jsonError(res, 403, "CAPTCHA_FAILED", "Captcha verification failed");
  }

  const safeSource = String(source).replaceAll(",", "-").slice(0, 80);
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp},${normalizedEmail},${safeSource}\n`;

  try {
    const dir = path.join(process.cwd(), ".tmp");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "email-signups.csv"), logLine, "utf8");

    if (process.env.RESEND_API_KEY && process.env.EMAIL_COLLECTION_TO) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_COLLECTION_FROM || "Suhas Website <onboarding@resend.dev>",
        to: process.env.EMAIL_COLLECTION_TO,
        subject: `New signup from ${safeSource}`,
        text: `Email: ${normalizedEmail}\nSource: ${safeSource}\nTime: ${timestamp}`,
      });
    }

    logSecurityEvent("email_signup_captured", {
      route: "email-signup",
      ip,
      status: 200,
      source: safeSource,
      reason: `emailHash:${hashEmailForLog(normalizedEmail)}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    logSecurityEvent("handler_error", {
      route: "email-signup",
      ip,
      status: 500,
      reason: err?.name || "signup_write_failed",
    });
    return jsonError(res, 500, "SIGNUP_SAVE_FAILED", "Unable to save email right now");
  }
}
