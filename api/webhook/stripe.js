// api/webhook/stripe.js
// Vercel Serverless Function -- Stripe webhook receiver
// Set this URL in Stripe Dashboard > Webhooks: https://yourdomain.com/api/webhook/stripe

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: Vercel needs raw body for Stripe signature verification.
// This config tells Vercel not to parse the body as JSON.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body from the request stream
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("Payment completed:", {
        amount: session.amount_total / 100,
        currency: session.currency,
        email: session.customer_email,
        tier: session.metadata?.tierId,
        donor: session.metadata?.donorName,
      });

      // TODO: write to your database
      // - Record contribution
      // - Update campaign.raised
      // - Send confirmation email via Resend/SendGrid/etc.
      break;
    }
    case "checkout.session.expired":
      console.log("Session expired:", event.data.object.id);
      break;
    default:
      break;
  }

  return res.status(200).json({ received: true });
}