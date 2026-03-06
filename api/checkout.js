// api/checkout.js
// Vercel Serverless Function -- handles Stripe, Thawani, and UPI checkout
// Deploy: just push to Vercel. It auto-detects /api/*.js as serverless functions.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const thawaniBase =
  process.env.THAWANI_ENV === "prod"
    ? "https://checkout.thawani.om"
    : "https://uatcheckout.thawani.om";

function createThawaniVerifyState(sessionId) {
  const secret = process.env.THAWANI_VERIFY_STATE_SECRET;
  if (!secret || !sessionId) {
    return null;
  }

  const crypto = require("crypto");
  const payload = {
    sid: sessionId,
    exp: Date.now() + 30 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      currency = "USD",
      tierId,
      tierName,
      paymentMethod,
      donorName,
      donorEmail,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const base = process.env.BASE_URL || "https://yourdomain.com";
    const successUrl = `${base}/contribute/success?tier=${tierId || "custom"}&amount=${amount}`;
    const cancelUrl = `${base}/contribute/cancel`;
    const productName = tierName
      ? `Fractals — ${tierName} Tier`
      : "Fractals — Custom Contribution";

    // ─── STRIPE (international cards) ───────────────────────
    if (paymentMethod === "card") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: donorEmail || undefined,
        client_reference_id: tierId || "custom",
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: productName,
                description: "Contribution to the Fractals album project",
              },
              unit_amount: Math.round(amount * 100), // cents
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tierId: tierId || "custom",
          tierName: tierName || "Custom",
          donorName: donorName || "",
        },
      });

      return res.status(200).json({ checkoutUrl: session.url });
    }

    // ─── THAWANI (Oman) ─────────────────────────────────────
    if (paymentMethod === "thawani") {
      // Thawani amounts are in baisa (1 OMR = 1000 baisa), must be integers.
      // Adjust the multiplier if you're converting from USD to OMR.
      const unitAmount = Math.round(amount * 1000);

      const payload = {
        client_reference_id: `fractals_${tierId || "custom"}_${Date.now()}`,
        mode: "payment",
        products: [
          {
            name: productName,
            quantity: 1,
            unit_amount: unitAmount,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          customer_name: donorName || "Anonymous",
          customer_email: donorEmail || "",
          order_id: `fractals_${Date.now()}`,
        },
      };

      const thawaniRes = await fetch(`${thawaniBase}/api/v1/checkout/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "thawani-api-key": process.env.THAWANI_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!thawaniRes.ok) {
        const errText = await thawaniRes.text();
        console.error("Thawani error:", thawaniRes.status, errText);
        return res.status(502).json({ error: "Thawani session creation failed" });
      }

      const thawaniData = await thawaniRes.json();

      if (!thawaniData.success || !thawaniData.data?.session_id) {
        console.error("Thawani bad response:", thawaniData);
        return res.status(502).json({ error: "No session from Thawani" });
      }

      const sid = thawaniData.data.session_id;
      const checkoutUrl = `${thawaniBase}/pay/${sid}?key=${process.env.THAWANI_PUBLISHABLE_KEY}`;
      const verifyState = createThawaniVerifyState(sid);

      return res.status(200).json({
        checkoutUrl,
        verifyState,
      });
    }

    // ─── UPI (India) ────────────────────────────────────────
    if (paymentMethod === "upi") {
      // UPI deep link -- opens the user's UPI app directly on mobile.
      // On desktop, frontend shows a QR code generated client-side.
      const upiLink = [
        `upi://pay?pa=${encodeURIComponent(process.env.UPI_PAYEE_VPA)}`,
        `pn=${encodeURIComponent(process.env.UPI_PAYEE_NAME)}`,
        `am=${amount}`,
        `cu=INR`,
        `tn=${encodeURIComponent(productName)}`,
      ].join("&");

      return res.status(200).json({
        upiLink,
        payeeVpa: process.env.UPI_PAYEE_VPA,
      });
    }

    return res.status(400).json({ error: `Unknown paymentMethod: ${paymentMethod}` });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}