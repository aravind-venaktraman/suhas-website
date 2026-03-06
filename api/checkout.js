// api/checkout.js
// Vercel Serverless Function -- handles Stripe, Thawani, and UPI checkout
// Deploy: just push to Vercel. It auto-detects /api/*.js as serverless functions.

import Stripe from "stripe";
import {
  enforceBrowserOrigin,
  enforceJsonRequest,
  enforceRateLimit,
  jsonError,
  logSecurityEvent,
} from "./_security.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const thawaniBase =
  process.env.THAWANI_ENV === "prod"
    ? "https://checkout.thawani.om"
    : "https://uatcheckout.thawani.om";

const CHECKOUT_BODY_LIMIT_BYTES = 12 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  if (!enforceJsonRequest(req, res, { maxBytes: CHECKOUT_BODY_LIMIT_BYTES })) {
    return;
  }

  if (!enforceBrowserOrigin(req, res)) {
    return;
  }

  const rateLimit = await enforceRateLimit(req, res, {
    routeKey: "checkout",
    maxRequests: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    logSecurityEvent("rate_limited", {
      route: "checkout",
      ip: rateLimit.ip,
      status: 429,
    });
    return;
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
      return jsonError(res, 400, "INVALID_AMOUNT", "Invalid amount");
    }

    const base = process.env.BASE_URL || "https://yourdomain.com";
    const successUrl = `${base}/contribute/success?tier=${tierId || "custom"}&amount=${amount}`;
    const cancelUrl = `${base}/contribute/cancel`;
    const productName = tierName
      ? `Fractals — ${tierName} Tier`
      : "Fractals — Custom Contribution";

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
              unit_amount: Math.round(amount * 100),
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

      return res.status(200).json({ ok: true, checkoutUrl: session.url });
    }

    if (paymentMethod === "thawani") {
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
        logSecurityEvent("provider_error", {
          route: "checkout",
          ip: rateLimit.ip,
          status: thawaniRes.status,
          reason: "thawani_session_creation_failed",
        });
        return jsonError(res, 502, "THAWANI_ERROR", "Thawani session creation failed");
      }

      const thawaniData = await thawaniRes.json();

      if (!thawaniData.success || !thawaniData.data?.session_id) {
        logSecurityEvent("provider_error", {
          route: "checkout",
          ip: rateLimit.ip,
          status: 502,
          reason: "thawani_missing_session",
        });
        return jsonError(res, 502, "THAWANI_ERROR", "No session from Thawani");
      }

      const sid = thawaniData.data.session_id;
      const checkoutUrl = `${thawaniBase}/pay/${sid}?key=${process.env.THAWANI_PUBLISHABLE_KEY}`;

      return res.status(200).json({ ok: true, checkoutUrl });
    }

    if (paymentMethod === "upi") {
      const upiLink = [
        `upi://pay?pa=${encodeURIComponent(process.env.UPI_PAYEE_VPA)}`,
        `pn=${encodeURIComponent(process.env.UPI_PAYEE_NAME)}`,
        `am=${amount}`,
        "cu=INR",
        `tn=${encodeURIComponent(productName)}`,
      ].join("&");

      return res.status(200).json({
        ok: true,
        upiLink,
        payeeVpa: process.env.UPI_PAYEE_VPA,
      });
    }

    return jsonError(res, 400, "INVALID_PAYMENT_METHOD", `Unknown paymentMethod: ${paymentMethod}`);
  } catch (err) {
    logSecurityEvent("handler_error", {
      route: "checkout",
      ip: "unknown",
      status: 500,
      reason: err?.name || "internal_error",
    });
    return jsonError(res, 500, "INTERNAL_ERROR", "Internal server error");
  }
}
