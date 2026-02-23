// api/thawani/verify.js
// Vercel Serverless Function -- verify Thawani payment status
// Call from your success page: GET /api/thawani/verify?session_id=xxx

const thawaniBase =
  process.env.THAWANI_ENV === "prod"
    ? "https://checkout.thawani.om"
    : "https://uatcheckout.thawani.om";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id" });
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
      return res.status(502).json({ error: "Thawani verification failed" });
    }

    const data = await verifyRes.json();

    return res.status(200).json({
      status: data.data?.payment_status || "unknown",
      session: data.data,
    });
  } catch (err) {
    console.error("Thawani verify error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
}