// api/checkout.js
// Vercel Serverless Function -- handles Stripe, Thawani, and UPI checkout
// Deploy: just push to Vercel. It auto-detects /api/*.js as serverless functions.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const thawaniBase =
  process.env.THAWANI_ENV === "prod"
    ? "https://checkout.thawani.om"
    : "https://uatcheckout.thawani.om";

const TIER_PRICING = {
  supporter: {
    amount: 5,
    currency: "USD",
    displayName: "Supporter",
    paymentMethods: ["card", "thawani", "upi"],
  },
  patron: {
    amount: 25,
    currency: "USD",
    displayName: "Patron",
    paymentMethods: ["card", "thawani", "upi"],
  },
  producer: {
    amount: 75,
    currency: "USD",
    displayName: "Producer",
    paymentMethods: ["card", "thawani", "upi"],
  },
  executive: {
    amount: 250,
    currency: "USD",
    displayName: "Executive Producer",
    paymentMethods: ["card", "thawani", "upi"],
  },
};

const CUSTOM_DONATION_RULES = {
  minAmount: 1,
  maxAmount: 10000,
  currency: "USD",
  paymentMethods: ["card", "thawani", "upi"],
};

function resolveCheckoutPricing({ tierId, customAmount, paymentMethod }) {
  const hasTierId = typeof tierId === "string" && tierId.trim() !== "";
  const hasCustomAmount = customAmount !== undefined && customAmount !== null && customAmount !== "";

  if (hasTierId && hasCustomAmount) {
    throw new Error("Provide either tierId or customAmount, not both");
  }

  if (!hasTierId && !hasCustomAmount) {
    throw new Error("Missing pricing input: tierId or customAmount is required");
  }

  if (hasTierId) {
    const normalizedTierId = tierId.trim();
    const tier = TIER_PRICING[normalizedTierId];

    if (!tier) {
      throw new Error("Unknown tierId");
    }

    if (!tier.paymentMethods.includes(paymentMethod)) {
      throw new Error("Selected payment method is not allowed for this tier");
    }

    return {
      tierId: normalizedTierId,
      tierName: tier.displayName,
      amount: tier.amount,
      currency: tier.currency,
      isCustom: false,
    };
  }

  const parsedCustomAmount = Number(customAmount);

  if (!Number.isFinite(parsedCustomAmount)) {
    throw new Error("Custom amount must be a valid number");
  }

  if (parsedCustomAmount < CUSTOM_DONATION_RULES.minAmount || parsedCustomAmount > CUSTOM_DONATION_RULES.maxAmount) {
    throw new Error(
      `Custom amount must be between ${CUSTOM_DONATION_RULES.minAmount} and ${CUSTOM_DONATION_RULES.maxAmount}`,
    );
  }

  if (!CUSTOM_DONATION_RULES.paymentMethods.includes(paymentMethod)) {
    throw new Error("Selected payment method is not allowed for custom donations");
  }

  return {
    tierId: "custom",
    tierName: "Custom",
    amount: Number(parsedCustomAmount.toFixed(2)),
    currency: CUSTOM_DONATION_RULES.currency,
    isCustom: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      tierId,
      customAmount,
      paymentMethod,
      donorName,
      donorEmail,
    } = req.body;

    const resolvedPricing = resolveCheckoutPricing({ tierId, customAmount, paymentMethod });
    const { amount, currency, tierName } = resolvedPricing;

    const base = process.env.BASE_URL || "https://yourdomain.com";
    const successUrl = `${base}/contribute/success?tier=${resolvedPricing.tierId}&amount=${amount}`;
    const cancelUrl = `${base}/contribute/cancel`;
    const productName = resolvedPricing.isCustom
      ? "Fractals — Custom Contribution"
      : `Fractals — ${tierName} Tier`;

    const responseDetails = {
      pricing: {
        tierId: resolvedPricing.tierId,
        tierName,
        amount,
        currency,
        isCustom: resolvedPricing.isCustom,
      },
    };

    // ─── STRIPE (international cards) ───────────────────────
    if (paymentMethod === "card") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: donorEmail || undefined,
        client_reference_id: resolvedPricing.tierId,
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
          tierId: resolvedPricing.tierId,
          tierName,
          amount: amount.toString(),
          currency,
          donorName: donorName || "",
        },
      });

      return res.status(200).json({ checkoutUrl: session.url, ...responseDetails });
    }

    // ─── THAWANI (Oman) ─────────────────────────────────────
    if (paymentMethod === "thawani") {
      // Thawani amounts are in baisa (1 OMR = 1000 baisa), must be integers.
      // Adjust the multiplier if you're converting from USD to OMR.
      const unitAmount = Math.round(amount * 1000);

      const payload = {
        client_reference_id: `fractals_${resolvedPricing.tierId}_${Date.now()}`,
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
          tier_id: resolvedPricing.tierId,
          tier_name: tierName,
          amount: amount.toString(),
          currency,
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

      return res.status(200).json({ checkoutUrl, ...responseDetails });
    }

    // ─── UPI (India) ────────────────────────────────────────
    if (paymentMethod === "upi") {
      // UPI deep link -- opens the user's UPI app directly on mobile.
      // On desktop, frontend shows a QR code generated client-side.
      const upiLink = [
        `upi://pay?pa=${encodeURIComponent(process.env.UPI_PAYEE_VPA)}`,
        `pn=${encodeURIComponent(process.env.UPI_PAYEE_NAME)}`,
        `am=${amount}`,
        `cu=${encodeURIComponent(currency)}`,
        `tn=${encodeURIComponent(productName)}`,
      ].join("&");

      return res.status(200).json({
        upiLink,
        payeeVpa: process.env.UPI_PAYEE_VPA,
        ...responseDetails,
      });
    }

    return res.status(400).json({ error: `Unknown paymentMethod: ${paymentMethod}` });
  } catch (err) {
    if (err instanceof Error && (
      err.message.includes("tierId") ||
      err.message.includes("Custom amount") ||
      err.message.includes("pricing input") ||
      err.message.includes("payment method")
    )) {
      return res.status(400).json({ error: err.message });
    }

    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
