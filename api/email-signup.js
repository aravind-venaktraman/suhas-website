import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, source = "unknown" } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const safeSource = String(source).replaceAll(",", "-");
  const timestamp = new Date().toISOString();

  try {
    // ── Supabase insert ──────────────────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: dbError } = await supabase
      .from("email_signups")
      .insert({ email: normalizedEmail, source: safeSource });

    if (dbError && dbError.code !== "23505") {
      // 23505 = unique_violation (duplicate email) — treat as success
      throw new Error(dbError.message);
    }

    // ── Optional Resend notification (non-fatal) ─────────────────
    if (process.env.RESEND_API_KEY && process.env.EMAIL_COLLECTION_TO) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_COLLECTION_FROM || "Suhas Website <onboarding@resend.dev>",
        to: process.env.EMAIL_COLLECTION_TO,
        subject: `New signup from ${safeSource}`,
        text: `Email: ${normalizedEmail}\nSource: ${safeSource}\nTime: ${timestamp}`,
      }).catch((resendErr) => {
        console.error("Resend notification failed (non-fatal):", resendErr);
      });
    }

    console.log("Email signup captured", { email: normalizedEmail, source: safeSource });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to store email signup", err);
    return res.status(500).json({ error: "Unable to save email right now" });
  }
}
