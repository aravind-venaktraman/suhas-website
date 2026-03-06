// api/thawani/verify.js
// Vercel Serverless Function -- verify Thawani payment status
// Call from your success page: GET /api/thawani/verify?session_id=xxx

const thawaniBase =
  process.env.THAWANI_ENV === "prod"
    ? "https://checkout.thawani.om"
    : "https://uatcheckout.thawani.om";

const SESSION_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redactForLogs(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  const redacted = JSON.parse(JSON.stringify(value));
  const sensitiveKeys = [
    "api_key",
    "thawani-api-key",
    "customer_email",
    "customer_name",
    "phone",
    "email",
    "card",
    "token",
  ];

  const redact = (obj) => {
    if (!obj || typeof obj !== "object") {
      return;
    }

    Object.keys(obj).forEach((key) => {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        obj[key] = "[REDACTED]";
        return;
      }

      redact(obj[key]);
    });
  };

  redact(redacted);
  return redacted;
}

function decodeSignedState(state) {
  const secret = process.env.THAWANI_VERIFY_STATE_SECRET;
  if (!secret || !state) {
    return null;
  }

  const [payloadB64, signatureB64] = state.split(".");
  if (!payloadB64 || !signatureB64) {
    return null;
  }

  const crypto = require("crypto");
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const providedSig = Buffer.from(signatureB64);
  const expectedSigBuf = Buffer.from(expectedSig);
  if (providedSig.length !== expectedSigBuf.length) {
    return null;
  }

  const validSignature = crypto.timingSafeEqual(providedSig, expectedSigBuf);
  if (!validSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

    if (!payload?.sid || !payload?.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id, state } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id" });
  }

  if (!SESSION_ID_REGEX.test(session_id)) {
    return res.status(400).json({ error: "Invalid session_id format" });
  }

  if (state) {
    const statePayload = decodeSignedState(state);
    if (!statePayload || statePayload.sid !== session_id) {
      return res.status(400).json({ error: "Invalid verification state" });
    }
  }

  try {
    const verifyRes = await fetch(
      `${thawaniBase}/api/v1/checkout/session/${session_id}`,
      {
        headers: {
          "thawani-api-key": process.env.THAWANI_API_KEY,
        },
      }
    );

    if (!verifyRes.ok) {
      const providerError = await verifyRes.text();
      console.error("Thawani verification failed:", {
        status: verifyRes.status,
        body: providerError,
      });
      return res.status(502).json({ error: "Thawani verification failed" });
    }

    const data = await verifyRes.json();
    console.info("Thawani verification payload:", redactForLogs(data));

    const session = data.data || {};
    const status = session.payment_status || "unknown";
    const paid = status.toLowerCase() === "paid";

    return res.status(200).json({
      status,
      paid,
      amount: session.total_amount ?? null,
      currency: session.currency ?? "OMR",
      reference: session.client_reference_id ?? null,
    });
  } catch (err) {
    console.error("Thawani verify error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
}
