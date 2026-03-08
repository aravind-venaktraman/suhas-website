import React, { useMemo, useState, useRef, useEffect } from "react";
import { Check, Lock, ArrowRight, Users, Calendar, TrendingUp } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

const syne = (w = 800) => ({ fontFamily: "'Michroma', sans-serif", fontWeight: w });
const cx = (...c) => c.filter(Boolean).join(" ");
const cur = (c) => (c === "EUR" ? "€" : c === "GBP" ? "£" : "$");
const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

function AnimatedNumber({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min((now - t0) / duration, 1);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={ref}>{prefix}{fmt(display)}</span>;
}

export default function ContributeSection({
  campaign = { goal: 15000, raised: 2340, backers: 47, daysLeft: 58, currency: "USD" },
  onCheckout,
}) {
  const c = cur(campaign.currency);
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);

  const tiers = useMemo(() => [
    {
      id: "supporter", name: "Supporter", amount: 5,
      tagline: "Buy us a studio coffee",
      perks: ["Name in liner notes", "Digital thank-you card", "Early single access"],
      backers: 23,
    },
    {
      id: "patron", name: "Patron", amount: 25,
      tagline: "Own the music first",
      perks: ["Everything in Supporter", "Pre-release digital album", "Behind-the-scenes footage", "Exclusive demo tracks"],
      backers: 14, popular: true,
    },
    {
      id: "producer", name: "Producer", amount: 75,
      tagline: "Your name on the album",
      perks: ["Everything in Patron", "Signed physical CD", "Fractals t-shirt", "Producer credit on album", "Private listening session invite"],
      backers: 8, limited: true, remaining: 42,
    },
    {
      id: "executive", name: "Executive Producer", amount: 250,
      tagline: "Shape the album",
      perks: ["Everything in Producer", "Limited edition vinyl", "1-on-1 video call with Suhas", "Vote on bonus track selection", "Executive Producer credit"],
      backers: 2, limited: true, remaining: 8,
    },
  ], []);

  const [selectedTierId, setSelectedTierId] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("thawani");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const checkoutRef = useRef(null);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || null;

  const amount = useMemo(() => {
    if (selectedTier) return selectedTier.amount;
    const v = parseFloat(customAmount);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [selectedTier, customAmount]);

  const handleCheckout = async () => {
    if (!amount || isProcessing) return;
    setIsProcessing(true);
    try {
      const payload = {
        amount, currency: campaign.currency || "USD",
        tierId: selectedTier?.id || null, tierName: selectedTier?.name || null,
        paymentMethod, donorName: donorName || null, donorEmail: donorEmail || null,
      };
      if (onCheckout) await onCheckout(payload);
      else alert("Wire onCheckout() to start a real payment flow.");
    } finally {
      setIsProcessing(false);
    }
  };

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const tierNum = (i) => String(i + 1).padStart(2, "0");

  return (
    <section id="contribute" className="relative border-t border-zinc-900 overflow-hidden">
      {/* ── Dynamic background ─────────────────────────────────────────── */}
      {/* Video bg matching the rest of the site */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay loop muted playsInline
          className="w-full h-full object-cover"
          style={{ opacity: 0.2 }}
        >
          <source src="/images/Shards_Video_Loop.webm" type="video/webm" />
        </video>
        {/* Gradient overlays for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* Animated ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div
          className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full blur-[180px]"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
            animation: "contributeGlow1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[15%] right-[10%] w-[450px] h-[450px] rounded-full blur-[160px]"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
            animation: "contributeGlow2 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[200px]"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
            animation: "contributeGlow3 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <div className="relative z-10 container mx-auto px-6 py-28 max-w-7xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-20">
          <RevealOnScroll cacheKey="contribute:kicker">
            <span className="text-cyan-400 tracking-[0.4em] text-[11px] uppercase block mb-5 font-bold">
              Support the Album
            </span>
          </RevealOnScroll>
          <RevealOnScroll cacheKey="contribute:title" delay={100}>
            <h2
              className="text-[clamp(2.5rem,8vw,5.5rem)] tracking-[-0.04em] leading-[0.9] mb-5"
              style={syne(800)}
            >
              Contribute
            </h2>
          </RevealOnScroll>
          <RevealOnScroll cacheKey="contribute:rule" delay={200}>
            <div className="w-12 h-[2px] bg-cyan-500 mx-auto mb-7" />
            <p className="text-zinc-300 max-w-lg mx-auto text-lg md:text-xl font-light leading-relaxed">
              Help fund the full-length <span className="text-white font-medium">Fractals</span> record.
              Studio time, world-class musicians, no compromises.
            </p>
          </RevealOnScroll>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <RevealOnScroll cacheKey="contribute:stats" delay={250}>
          <div className="max-w-3xl mx-auto mb-20">
            <div className="grid grid-cols-3 gap-6 sm:gap-8 mb-6">
              {[
                { icon: <TrendingUp size={18} className="text-cyan-400" />, value: <AnimatedNumber value={campaign.raised} prefix={c} />, label: "Raised" },
                { icon: <Users size={18} className="text-blue-400" />, value: <AnimatedNumber value={campaign.backers} />, label: "Backers" },
                { icon: <Calendar size={18} className="text-indigo-400" />, value: <AnimatedNumber value={campaign.daysLeft} />, label: "Days Left" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="flex items-center justify-center gap-2.5 mb-1.5">
                    {s.icon}
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white" style={syne(800)}>
                      {s.value}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-[11px] uppercase tracking-[0.2em] font-bold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2.5 bg-zinc-900/80 rounded-full overflow-hidden border border-white/[0.06] backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-[1.5s] ease-out"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #22d3ee, #3b82f6, #6366f1)",
                }}
              />
            </div>
            <div className="flex justify-between mt-2.5 text-sm">
              <span className="text-cyan-300/80 font-semibold">{Math.round(pct)}% funded</span>
              <span className="text-zinc-400">
                {c}{fmt(Math.max(campaign.goal - campaign.raised, 0))} to go
              </span>
            </div>
          </div>
        </RevealOnScroll>

        {/* ── 2-col: Tiers + Checkout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 max-w-6xl mx-auto">
          {/* LEFT: Tiers + Where Funds Go */}
          <div className="lg:col-span-7">
            <RevealOnScroll cacheKey="contribute:tiers">
              <div className="mb-8">
                <h3 className="text-2xl sm:text-3xl text-white mb-2" style={syne(700)}>
                  Choose Your Tier
                </h3>
                <p className="text-zinc-400 text-base">
                  Select a contribution level or enter a custom amount.
                </p>
              </div>

              <div className="space-y-3">
                {tiers.map((tier, idx) => {
                  const selected = tier.id === selectedTierId;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setSelectedTierId(selected ? null : tier.id);
                        setCustomAmount("");
                        if (!selected) setTimeout(scrollToCheckout, 100);
                      }}
                      className={cx(
                        "w-full text-left rounded-2xl border transition-all duration-300 group relative",
                        selected
                          ? "border-cyan-500/30 bg-cyan-500/[0.06] shadow-[0_0_50px_-12px_rgba(34,211,238,0.15)] backdrop-blur-sm"
                          : "border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.14] hover:bg-white/[0.04]"
                      )}
                    >
                      {tier.popular && (
                        <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                      )}

                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-4 sm:gap-5">
                          {/* Tier number */}
                          <div
                            className={cx(
                              "flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-colors",
                              selected
                                ? "bg-cyan-400/10 border-cyan-400/25"
                                : "bg-white/[0.03] border-white/[0.08] group-hover:border-white/[0.12]"
                            )}
                          >
                            <span
                              className={cx(
                                "text-xs font-bold tracking-wider transition-colors",
                                selected ? "text-cyan-400" : "text-zinc-500"
                              )}
                              style={syne(700)}
                            >
                              {tierNum(idx)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h4 className="text-white font-bold text-base" style={syne(700)}>
                                    {tier.name}
                                  </h4>
                                  {tier.popular && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-300">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-400 text-sm mt-0.5">{tier.tagline}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span
                                  className={cx(
                                    "text-2xl font-black tabular-nums",
                                    selected ? "text-cyan-400" : "text-zinc-100"
                                  )}
                                  style={syne(800)}
                                >
                                  {c}{tier.amount}
                                </span>
                                <div
                                  className={cx(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                    selected
                                      ? "border-cyan-400 bg-cyan-400"
                                      : "border-zinc-600 group-hover:border-zinc-400"
                                  )}
                                >
                                  {selected && <Check size={11} className="text-black" strokeWidth={3} />}
                                </div>
                              </div>
                            </div>

                            {/* Perks expand on select */}
                            <div
                              className={cx(
                                "grid transition-all duration-300 ease-out",
                                selected ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                              )}
                            >
                              <div className="overflow-hidden">
                                <div className="space-y-2.5 pb-1">
                                  {tier.perks.map((p) => (
                                    <div key={p} className="flex items-center gap-2.5">
                                      <Check size={14} className="text-cyan-400 flex-shrink-0" strokeWidth={2.5} />
                                      <span className="text-zinc-200 text-sm">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className="text-zinc-500">
                                {tier.backers} backer{tier.backers !== 1 ? "s" : ""}
                              </span>
                              {tier.limited && (
                                <>
                                  <span className="text-zinc-700">|</span>
                                  <span className="text-amber-400/80 font-semibold">
                                    {tier.remaining} remaining
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Custom amount */}
                <div
                  className={cx(
                    "rounded-2xl border p-5 sm:p-6 transition-all duration-300 backdrop-blur-sm",
                    !selectedTierId && customAmount
                      ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-500 tracking-wider" style={syne(700)}>
                        ++
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-base mb-0.5" style={syne(700)}>
                        Custom Amount
                      </h4>
                      <p className="text-zinc-400 text-sm">Any amount helps fund the project.</p>
                    </div>
                    <div className="relative flex-shrink-0 w-28 sm:w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base font-semibold">
                        {c}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedTierId(null);
                        }}
                        onFocus={() => setSelectedTierId(null)}
                        placeholder="0"
                        className="w-full rounded-xl bg-zinc-900/60 border border-white/[0.1] pl-8 pr-3 py-3 text-white text-lg font-bold placeholder:text-zinc-700 focus:outline-none focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/10 transition-all text-right"
                        style={syne(700)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Where Funds Go */}
            <RevealOnScroll cacheKey="contribute:funds" delay={100}>
              <div className="mt-14">
                <h4 className="text-sm text-zinc-400 uppercase tracking-[0.2em] font-bold mb-5">
                  Where Funds Go
                </h4>
                <div className="space-y-4">
                  {[
                    { label: "Studio & Recording", pct: 35, color: "#22d3ee" },
                    { label: "Session Musicians", pct: 25, color: "#3b82f6" },
                    { label: "Mix & Master", pct: 20, color: "#6366f1" },
                    { label: "Physical Runs", pct: 12, color: "#8b5cf6" },
                    { label: "Visuals & Video", pct: 8, color: "#a78bfa" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-300 text-sm">{b.label}</span>
                        <span className="text-white text-sm font-bold" style={syne(700)}>
                          {b.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-900/60 rounded-full overflow-hidden border border-white/[0.04]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* ── RIGHT: Checkout ────────────────────────────────────────────── */}
          <div className="lg:col-span-5" ref={checkoutRef}>
            <div className="lg:sticky lg:top-28">
              <RevealOnScroll cacheKey="contribute:checkout" delay={200}>
                <div className="rounded-2xl border border-white/[0.1] bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/50">
                  {/* Header */}
                  <div className="p-6 border-b border-white/[0.07]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl text-white" style={syne(800)}>
                          {selectedTier ? selectedTier.name : "Your Contribution"}
                        </h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          {selectedTier
                            ? selectedTier.tagline
                            : "Select a tier or enter a custom amount"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                        <Lock size={11} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Secure</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Amount */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-5 py-4 flex items-center justify-between">
                      <span className="text-zinc-400 text-base">Amount</span>
                      <span
                        className={cx(
                          "text-3xl font-black tabular-nums",
                          amount ? "text-white" : "text-zinc-700"
                        )}
                        style={syne(800)}
                      >
                        {amount ? `${c}${amount}` : `${c}0`}
                      </span>
                    </div>

                    {/* Perks */}
                    {selectedTier && (
                      <div>
                        <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-2.5 block">
                          Included
                        </span>
                        <div className="space-y-2">
                          {selectedTier.perks.map((p) => (
                            <div key={p} className="flex items-center gap-2.5">
                              <Check size={13} className="text-cyan-400 flex-shrink-0" strokeWidth={2.5} />
                              <span className="text-zinc-300 text-sm">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-white/[0.06]" />

                    {/* Payment */}
                    <div>
                      <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-2.5 block">
                        Payment Method
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "thawani", label: "Thawani", sub: "Oman" },
                          { id: "upi", label: "UPI", sub: "India" },
                          { id: "card", label: "Card", sub: "Intl." },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            className={cx(
                              "rounded-xl border px-3 py-3 text-center transition-all duration-200",
                              paymentMethod === m.id
                                ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                            )}
                          >
                            <div
                              className={cx(
                                "text-sm font-bold",
                                paymentMethod === m.id ? "text-cyan-300" : "text-zinc-200"
                              )}
                            >
                              {m.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{m.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name / Email */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-2 block">
                          Name
                        </label>
                        <input
                          type="text"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded-xl bg-zinc-900/50 border border-white/[0.08] px-3.5 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/25 focus:ring-1 focus:ring-cyan-400/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-2 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          placeholder="For rewards"
                          className="w-full rounded-xl bg-zinc-900/50 border border-white/[0.08] px-3.5 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/25 focus:ring-1 focus:ring-cyan-400/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleCheckout}
                      disabled={!amount || isProcessing}
                      className={cx(
                        "w-full py-4 rounded-xl font-bold text-base uppercase tracking-[0.1em] transition-all duration-300",
                        amount && !isProcessing
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_48px_-12px_rgba(34,211,238,0.4)] hover:shadow-[0_20px_60px_-12px_rgba(34,211,238,0.55)] active:scale-[0.98] hover:brightness-110"
                          : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/[0.05]"
                      )}
                      style={syne(800)}
                    >
                      <span className="flex items-center justify-center gap-2.5">
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : amount ? (
                          <>
                            Contribute {c}{amount} <ArrowRight size={18} />
                          </>
                        ) : (
                          "Select a tier or enter amount"
                        )}
                      </span>
                    </button>

                    {/* Trust */}
                    <div className="flex items-center justify-center gap-3 text-zinc-600 text-[10px] uppercase tracking-widest">
                      <Lock size={10} />
                      <span>Encrypted</span>
                      <span className="text-zinc-800">|</span>
                      <span>PCI-DSS</span>
                      <span className="text-zinc-800">|</span>
                      <span>CBO Licensed</span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </div>

      {/* Glow animations */}
      <style>{`
        @keyframes contributeGlow1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(60px, -40px) scale(1.15); opacity: 1; }
          66% { transform: translate(-30px, 30px) scale(0.9); opacity: 0.5; }
        }
        @keyframes contributeGlow2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-50px, -60px) scale(1.2); opacity: 0.9; }
        }
        @keyframes contributeGlow3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}