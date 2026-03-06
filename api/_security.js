const memoryWindows = new Map();

export function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

export function jsonError(res, status, code, message, details) {
  const payload = {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return res.status(status).json(payload);
}

export function enforceJsonRequest(req, res, { maxBytes }) {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    jsonError(res, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json");
    return false;
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    jsonError(res, 413, "PAYLOAD_TOO_LARGE", `Request body must be <= ${maxBytes} bytes`);
    return false;
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    jsonError(res, 400, "INVALID_JSON_BODY", "Request body must be a JSON object");
    return false;
  }

  const measuredBytes = Buffer.byteLength(JSON.stringify(req.body), "utf8");
  if (measuredBytes > maxBytes) {
    jsonError(res, 413, "PAYLOAD_TOO_LARGE", `Request body must be <= ${maxBytes} bytes`);
    return false;
  }

  return true;
}

function parseAllowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (process.env.BASE_URL) {
    configured.push(process.env.BASE_URL);
  }

  return [...new Set(configured)];
}

export function enforceBrowserOrigin(req, res) {
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  if (!originHeader && !refererHeader) {
    return true;
  }

  const allowed = parseAllowedOrigins();
  if (allowed.length === 0) {
    return true;
  }

  const candidates = [];
  if (typeof originHeader === "string" && originHeader.trim()) {
    candidates.push(originHeader);
  }
  if (typeof refererHeader === "string" && refererHeader.trim()) {
    candidates.push(refererHeader);
  }

  const isAllowed = candidates.some((value) => {
    try {
      const url = new URL(value);
      return allowed.includes(url.origin);
    } catch {
      return false;
    }
  });

  if (!isAllowed) {
    jsonError(res, 403, "FORBIDDEN_ORIGIN", "Request origin is not allowed");
    return false;
  }

  return true;
}

async function incrementLocalWindow(key, windowMs) {
  const now = Date.now();
  const start = now - windowMs;
  const samples = memoryWindows.get(key) || [];
  const retained = samples.filter((sample) => sample > start);
  retained.push(now);
  memoryWindows.set(key, retained);
  return retained.length;
}

async function incrementUpstashWindow({ key, windowMs }) {
  const baseUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  const now = Date.now();
  const start = now - windowMs;

  const commands = [
    ["ZREMRANGEBYSCORE", key, "-inf", String(start)],
    ["ZADD", key, String(now), `${now}-${Math.random().toString(36).slice(2, 8)}`],
    ["ZCARD", key],
    ["PEXPIRE", key, String(windowMs)],
  ];

  const response = await fetch(`${baseUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const cardResult = data?.[2]?.result;
  const count = Number(cardResult);
  return Number.isFinite(count) ? count : null;
}

export async function enforceRateLimit(req, res, { routeKey, maxRequests, windowMs }) {
  const ip = getClientIp(req);
  const key = `rl:${routeKey}:${ip}`;

  let count = null;
  try {
    count = await incrementUpstashWindow({ key, windowMs });
  } catch {
    count = null;
  }

  if (count === null) {
    count = await incrementLocalWindow(key, windowMs);
  }

  if (count > maxRequests) {
    const retryAfter = Math.ceil(windowMs / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    jsonError(res, 429, "RATE_LIMITED", "Too many requests", {
      limit: maxRequests,
      windowMs,
      retryAfterSeconds: retryAfter,
    });

    return { allowed: false, ip };
  }

  return { allowed: true, ip };
}

export async function verifyCaptchaToken(token, remoteIp) {
  const trimmed = String(token || "").trim();
  if (!trimmed) {
    return { ok: false, reason: "Missing captcha token" };
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: trimmed,
      remoteip: remoteIp,
    });

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();
    return {
      ok: Boolean(data?.success),
      reason: data?.["error-codes"]?.join(",") || "Turnstile verification failed",
    };
  }

  if (process.env.HCAPTCHA_SECRET_KEY) {
    const body = new URLSearchParams({
      secret: process.env.HCAPTCHA_SECRET_KEY,
      response: trimmed,
      remoteip: remoteIp,
    });

    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();
    return {
      ok: Boolean(data?.success),
      reason: data?.["error-codes"]?.join(",") || "hCaptcha verification failed",
    };
  }

  return { ok: false, reason: "Captcha provider not configured" };
}

export function logSecurityEvent(event, metadata = {}) {
  console.info(`[security:${event}]`, {
    route: metadata.route,
    ip: metadata.ip,
    status: metadata.status,
    reason: metadata.reason,
    source: metadata.source,
  });
}
