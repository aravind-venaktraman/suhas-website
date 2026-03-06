import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Heart,
  Lock,
  ChevronDown,
  Check,
  Music,
  ExternalLink,
  Play,
  Users,
  Clock,
  Quote,
  Disc3,
  Mic2,
  Headphones,
  ArrowRight,
  Sparkles,
  Globe,
} from 'lucide-react';

const syne = (w = 800) => ({ fontFamily: "'Michroma', sans-serif", fontWeight: w });
const dm = (w = 400) => ({ fontFamily: "'Michroma', sans-serif", fontWeight: w });
const cx = (...c) => c.filter(Boolean).join(' ');
const cur = (c) => (c === 'EUR' ? '\u20ac' : c === 'GBP' ? '\u00a3' : '$');
const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString() : '0');

/* ── Font loader ───────────────────────────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    if (!document.querySelector('link[data-suhas-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Michroma&display=swap';
      link.dataset.suhasFonts = 'true';
      document.head.appendChild(link);
    }
  }, []);
  return null;
};

/* ── Animated counter ──────────────────────────────────────────── */
function AnimNum({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min((now - t0) / 1200, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(value * ease));
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

  return (
    <span ref={ref}>
      {prefix}
      {fmt(display)}
      {suffix}
    </span>
  );
}

/* ── Reveal on scroll ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Success banner ────────────────────────────────────────────── */
const SuccessBanner = () => {
  const [params] = useSearchParams();
  const tier = params.get('tier');
  const amount = params.get('amount');
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={32} className="text-emerald-600" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl md:text-3xl text-zinc-900 mb-3 tracking-tight" style={syne(800)}>
        Thank You!
      </h2>
      <p className="text-zinc-600 text-base md:text-lg leading-relaxed" style={dm(400)}>
        {amount ? `Your $${amount} contribution` : 'Your contribution'} has been received.
        {tier && tier !== 'custom' && (
          <span className="block mt-1 text-emerald-700 font-semibold">
            Welcome to the {tier.charAt(0).toUpperCase() + tier.slice(1)} tier.
          </span>
        )}
      </p>
      <p className="text-zinc-400 text-sm mt-4" style={dm(400)}>
        Check your email for a confirmation.
      </p>
    </div>
  );
};

/* ── Cancel banner ─────────────────────────────────────────────── */
const CancelBanner = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto text-center">
    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
      <XCircle size={32} className="text-amber-600" strokeWidth={1.5} />
    </div>
    <h2 className="text-2xl md:text-3xl text-zinc-900 mb-3 tracking-tight" style={syne(800)}>
      Payment Cancelled
    </h2>
    <p className="text-zinc-600 text-base md:text-lg leading-relaxed" style={dm(400)}>
      No worries. Nothing was charged. You can try again below.
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN CONTRIBUTE PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ContributePage({ success = false, cancelled = false }) {
  const navigate = useNavigate();
  const [navShadow, setNavShadow] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const h = () => setNavShadow(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* ── Campaign data ─────────────────────────────────────────── */
  const campaign = { goal: 15000, raised: 2340, backers: 47, daysLeft: 58, currency: 'USD' };
  const c = cur(campaign.currency);
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);

  /* ── Tier data ─────────────────────────────────────────────── */
  const tiers = [
    {
      id: 'supporter', name: 'Supporter', amount: 5, emoji: '\u2615',
      tagline: 'Buy us a studio coffee',
      highlight: 'Most backers start here',
      perks: ['Name in album liner notes', 'Digital thank-you card from Suhas', 'Early access to the lead single'],
      backers: 23,
    },
    {
      id: 'patron', name: 'Patron', amount: 25, emoji: '\ud83c\udfb5',
      tagline: 'Own the music before anyone else',
      highlight: 'Best value',
      perks: ['Everything in Supporter', 'Pre-release digital album (before streaming)', 'Behind-the-scenes studio footage', 'Exclusive demo tracks with Suhas\'s commentary'],
      backers: 14, popular: true,
    },
    {
      id: 'producer', name: 'Producer', amount: 75, emoji: '\ud83c\udf9b\ufe0f',
      tagline: 'Your name. On the album. Forever.',
      highlight: 'Limited spots',
      perks: ['Everything in Patron', 'Signed physical CD (shipped worldwide)', 'Fractals t-shirt', 'Producer credit on the album', 'Invite to private online listening session'],
      backers: 8, limited: true, remaining: 42,
    },
    {
      id: 'executive', name: 'Executive Producer', amount: 250, emoji: '\ud83d\udc8e',
      tagline: 'Shape the album with Suhas',
      highlight: 'Only 8 left',
      perks: ['Everything in Producer', 'Limited edition vinyl pressing', '1-on-1 video call with Suhas', 'Vote on the bonus track selection', 'Executive Producer credit on all releases'],
      backers: 2, limited: true, remaining: 8,
    },
  ];

  /* ── Recent backers (social proof) ─────────────────────────── */
  const recentBackers = [
    { name: 'Arjun M.', tier: 'Patron', time: '2 hours ago' },
    { name: 'Sarah K.', tier: 'Supporter', time: '5 hours ago' },
    { name: 'Omar A.', tier: 'Producer', time: '1 day ago' },
    { name: 'James L.', tier: 'Patron', time: '1 day ago' },
    { name: 'Priya R.', tier: 'Supporter', time: '2 days ago' },
  ];

  /* ── State ─────────────────────────────────────────────────── */
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('thawani');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || null;
  const amount = selectedTier
    ? selectedTier.amount
    : parseFloat(customAmount) > 0
      ? parseFloat(customAmount)
      : null;

  const donateRef = useRef(null);
  const scrollToDonate = () => donateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* ── Checkout ──────────────────────────────────────────────── */
  const handleCheckout = async () => {
    if (!amount || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTier?.id || null,
          customAmount: selectedTier ? null : amount,
          paymentMethod,
          donorName: donorName || null,
          donorEmail: donorEmail || null,
        }),
      });
      if (!res.ok) {
        alert('Checkout failed. ' + (await res.text().catch(() => '')));
        return;
      }
      const data = await res.json();
      const pricingLabel = data.pricing
        ? `${data.pricing.currency} ${data.pricing.amount} (${data.pricing.tierName})`
        : null;
      if (data.checkoutUrl) {
        if (pricingLabel && !window.confirm(`You will be redirected to pay ${pricingLabel}. Continue?`)) {
          return;
        }
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.upiLink) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) window.location.href = data.upiLink;
        else {
          const summary = pricingLabel ? ` for ${pricingLabel}` : '';
          alert('Pay via UPI to: ' + data.payeeVpa + summary);
        }
        return;
      }
      alert('Unexpected response.');
    } catch { alert('Something went wrong. Please try again.'); }
    finally { setIsProcessing(false); }
  };

  const appleMusicLink = 'https://music.apple.com/us/album/fractals-single/1768715442';
  const spotifyLink = 'https://open.spotify.com/track/4Udyb9Ijofesgz8YcmrsB6';
  const instagramLink = 'https://www.instagram.com/suhas.als';

  const faqs = [
    { q: 'When will the album be released?', a: 'Late 2026. Backers at the Patron tier and above will receive early singles throughout the production process, so you will be hearing new music well before the public release.' },
    { q: 'Who is playing on the album?', a: 'Ric Fierabracci on bass and Marco Minnemann on drums, with additional collaborators to be announced as the project develops.' },
    { q: 'Can I upgrade my tier later?', a: 'Absolutely. You can return anytime to move up a tier or make an additional contribution. Every bit helps.' },
    { q: 'How are payments processed?', a: 'All payments go through secure hosted checkout: Thawani for Oman, Stripe for international cards, and UPI for India. We never see or store your card details.' },
    { q: 'I am not into jazz. Should I still contribute?', a: 'This music crosses genres. If you have ever enjoyed a film score, a Yanni concert, or a Snarky Puppy track, you will find something here. Listen to the single first and decide for yourself.' },
    { q: 'Can I contribute from outside Oman?', a: 'Yes. The Card option (powered by Stripe) works worldwide. UPI is available for India. We accept contributions from anywhere.' },
  ];

  return (
    <>
      <FontLoader />
      <div
        className="min-h-screen text-zinc-900 overflow-x-hidden"
        style={{
          fontFamily: "'Michroma', sans-serif",
          background: 'linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 40%, #FAFAF9 100%)',
        }}
      >
        {/* ── Navigation ─────────────────────────────────────── */}
        <nav
          className={cx(
            'fixed w-full z-50 transition-all duration-300 bg-[#FAFAF9]/90 backdrop-blur-md',
            navShadow && 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          )}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <div className="flex justify-between items-center h-16 md:h-[72px]">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
                className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
              >
                <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-10 md:h-12 w-auto" />
              </a>
              <div className="flex items-center gap-4 md:gap-6">
                <a href={appleMusicLink} target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-[12px] font-semibold tracking-wide" style={dm(600)}>
                  Listen <ExternalLink size={11} />
                </a>
                <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors text-[12px] font-semibold tracking-wide group" style={dm(600)}>
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Home
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div className="h-16 md:h-[72px]" />

        {/* ── Success / Cancel ─────────────────────────────── */}
        {success && <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 pb-6"><SuccessBanner /></div>}
        {cancelled && <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 pb-6"><CancelBanner /></div>}


        {/* ═══════════════════════════════════════════════════
            SECTION 1: HERO - THE PITCH
            Story-first. Music playable. CTA visible.
            ═══════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-14 pb-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">

            {/* Left col: Story (3/5) */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-cyan-600 mb-5" style={dm(700)}>
                  <Globe size={12} />
                  Independent Music Project
                </span>
                <h1 className="text-[clamp(1.75rem,4.5vw,2.75rem)] tracking-[-0.03em] leading-[1.15] text-zinc-900 mb-6" style={syne(800)}>
                  A 26-year-old pianist from Oman just got two of the greatest musicians alive to play on his debut album.
                  <span className="block text-cyan-600 mt-1">He needs your help to finish it.</span>
                </h1>
              </Reveal>

              <Reveal delay={100}>
                <p className="text-zinc-600 text-[16px] md:text-[17px] leading-[1.85] mb-5" style={dm(400)}>
                  Suhas Padav has been writing music since he was four. His debut composition,
                  Fractals, caught the attention of Grammy-nominated bassist{' '}
                  <strong className="text-zinc-800 font-semibold">Ric Fierabracci</strong>{' '}
                  (Chick Corea, Yanni, Planet X) and world-renowned drummer{' '}
                  <strong className="text-zinc-800 font-semibold">Marco Minnemann</strong>{' '}
                  (The Aristocrats, Steven Wilson, Joe Satriani).
                </p>
                <p className="text-zinc-600 text-[16px] md:text-[17px] leading-[1.85] mb-8" style={dm(400)}>
                  They are making a full-length album together. No label. No investors. Just three
                  musicians, a studio, and the people who believe this music deserves to exist.
                  That is where you come in.
                </p>
              </Reveal>

              {/* Embedded player card */}
              <Reveal delay={200}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100">
                      <img src="/images/album-art.PNG" alt="Fractals" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-zinc-900 text-[15px] font-bold" style={syne(700)}>Fractals</div>
                      <div className="text-zinc-500 text-[13px]" style={dm(400)}>Suhas Padav</div>
                      <div className="text-zinc-400 text-[11px] mt-0.5" style={dm(500)}>Listen before you decide</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={spotifyLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-700 transition-colors" style={dm(700)}>
                        <Play size={12} className="fill-current" /> Spotify
                      </a>
                      <a href={appleMusicLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 text-[11px] font-bold hover:border-zinc-400 transition-colors" style={dm(700)}>
                        <Music size={12} /> Apple
                      </a>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl px-4 py-3">
                    <p className="text-zinc-500 text-[13px] leading-relaxed italic" style={dm(400)}>
                      "The first version was a solo recording with programmed instruments. What you will hear
                      on the album is the same composition brought to life by two of the best players on the planet."
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Stats bar */}
              <Reveal delay={300}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 mb-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <div className="text-center flex-1 min-w-[80px]">
                      <div className="text-xl md:text-2xl font-black text-zinc-900" style={syne(800)}>
                        <AnimNum value={campaign.raised} prefix={c} />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5" style={dm(600)}>Raised</div>
                    </div>
                    <div className="w-px h-10 bg-zinc-100 hidden sm:block" />
                    <div className="text-center flex-1 min-w-[80px]">
                      <div className="text-xl md:text-2xl font-black text-zinc-900" style={syne(800)}>
                        <AnimNum value={campaign.backers} />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5" style={dm(600)}>Backers</div>
                    </div>
                    <div className="w-px h-10 bg-zinc-100 hidden sm:block" />
                    <div className="text-center flex-1 min-w-[80px]">
                      <div className="text-xl md:text-2xl font-black text-zinc-900" style={syne(800)}>
                        <AnimNum value={campaign.daysLeft} />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5" style={dm(600)}>Days Left</div>
                    </div>
                  </div>
                  <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-[1.5s] ease-out"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-cyan-700 text-[12px] font-semibold" style={dm(600)}>{Math.round(pct)}% of {c}{fmt(campaign.goal)}</span>
                    <span className="text-zinc-400 text-[12px]" style={dm(500)}>{c}{fmt(Math.max(campaign.goal - campaign.raised, 0))} to go</span>
                  </div>
                </div>
              </Reveal>

              {/* Recent backers (social proof) */}
              <Reveal delay={350}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={13} className="text-zinc-400" />
                  <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-bold" style={dm(700)}>Recent Backers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentBackers.map((b) => (
                    <div key={b.name} className="inline-flex items-center gap-2 bg-white border border-zinc-100 rounded-full px-3 py-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold" style={dm(700)}>
                        {b.name.charAt(0)}
                      </div>
                      <span className="text-zinc-700 text-[12px] font-medium" style={dm(500)}>{b.name}</span>
                      <span className="text-zinc-300 text-[10px]">&middot;</span>
                      <span className="text-cyan-600 text-[11px] font-semibold" style={dm(600)}>{b.tier}</span>
                      <span className="text-zinc-400 text-[10px]">{b.time}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right col: Photo + Donate card (2/5) */}
            <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-24" ref={donateRef}>
              <Reveal delay={50}>
                <div className="rounded-2xl overflow-hidden mb-5 bg-zinc-200 aspect-[4/3] relative">
                  <img src="/images/suhas.png" alt="Suhas at the piano"
                    className="w-full h-full object-cover object-top" style={{ objectPosition: '50% 20%' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                      <Disc3 size={16} className="text-cyan-600 flex-shrink-0" />
                      <div>
                        <div className="text-zinc-900 text-[12px] font-bold" style={dm(700)}>Debut album in production</div>
                        <div className="text-zinc-500 text-[10px]" style={dm(400)}>Featuring Ric Fierabracci &amp; Marco Minnemann</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* ── Donate card ─────────────────────────────── */}
              <Reveal delay={150}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-zinc-900" style={syne(700)}>
                      {selectedTier ? `${selectedTier.emoji} ${selectedTier.name}` : 'Contribute'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Lock size={11} />
                      <span className="text-[10px] uppercase tracking-wider font-bold" style={dm(700)}>Secure</span>
                    </div>
                  </div>

                  {selectedTier ? (
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-zinc-500 text-sm block" style={dm(500)}>Amount</span>
                        <button onClick={() => { setSelectedTierId(null); setCustomAmount(''); }}
                          className="text-cyan-600 text-[11px] font-semibold hover:underline mt-0.5" style={dm(600)}>
                          Change tier
                        </button>
                      </div>
                      <span className="text-2xl font-black text-zinc-900" style={syne(800)}>{c}{selectedTier.amount}</span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-1.5 block" style={dm(700)}>Custom Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">{c}</span>
                        <input type="number" min="1" step="1" value={customAmount}
                          onChange={(e) => { setCustomAmount(e.target.value); setSelectedTierId(null); }}
                          placeholder="Enter any amount"
                          className="w-full rounded-xl bg-zinc-50 border border-zinc-200 pl-9 pr-4 py-3 text-zinc-900 text-lg font-bold placeholder:text-zinc-300 placeholder:font-normal placeholder:text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                          style={syne(700)} />
                      </div>
                    </div>
                  )}

                  {selectedTier && (
                    <div className="mb-4">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold block mb-2" style={dm(700)}>What you get</span>
                      <div className="space-y-1">
                        {selectedTier.perks.map((p) => (
                          <div key={p} className="flex items-start gap-2">
                            <Check size={13} className="text-cyan-600 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                            <span className="text-zinc-600 text-[13px]" style={dm(400)}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-zinc-100 mb-4" />

                  {/* Payment method */}
                  <div className="mb-4">
                    <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-2 block" style={dm(700)}>Payment Method</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'thawani', label: 'Thawani', sub: 'Oman' },
                        { id: 'upi', label: 'UPI', sub: 'India' },
                        { id: 'card', label: 'Card', sub: 'International' },
                      ].map((m) => (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                          className={cx(
                            'rounded-xl border px-3 py-2.5 text-center transition-all',
                            paymentMethod === m.id
                              ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          )}>
                          <div className={cx('text-[13px] font-bold', paymentMethod === m.id ? 'text-cyan-700' : 'text-zinc-700')} style={dm(700)}>{m.label}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5" style={dm(400)}>{m.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Donor info */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1 block" style={dm(700)}>Name</label>
                      <input type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Optional"
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-zinc-900 text-sm placeholder:text-zinc-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all" style={dm(400)} />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1 block" style={dm(700)}>Email</label>
                      <input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="For rewards"
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-zinc-900 text-sm placeholder:text-zinc-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all" style={dm(400)} />
                    </div>
                  </div>

                  {/* CTA */}
                  <button onClick={handleCheckout} disabled={!amount || isProcessing}
                    className={cx(
                      'w-full py-4 rounded-xl font-bold text-[14px] uppercase tracking-[0.08em] transition-all duration-200 cursor-pointer',
                      amount && !isProcessing
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-200/40 hover:shadow-xl hover:shadow-cyan-200/60 active:scale-[0.98] hover:brightness-105'
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    )} style={syne(700)}>
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : amount ? (
                      <span className="flex items-center justify-center gap-2">
                        Contribute {c}{amount} <Heart size={16} className="fill-current" />
                      </span>
                    ) : (
                      'Select a tier or enter amount'
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-3 text-zinc-400 text-[10px] uppercase tracking-widest" style={dm(600)}>
                    <Lock size={9} /><span>Encrypted</span><span className="text-zinc-200">|</span><span>Secure Checkout</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION 2: THE MUSICIANS
            Visual, personal, credibility-building
            ═══════════════════════════════════════════════════ */}
        <section className="bg-white border-t border-zinc-100">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
            <Reveal>
              <span className="text-cyan-600 text-[11px] font-bold tracking-[0.2em] uppercase block mb-3" style={dm(700)}>Meet the players</span>
              <h2 className="text-2xl md:text-3xl text-zinc-900 mb-3 tracking-tight" style={syne(800)}>
                Your money goes straight to these musicians.
              </h2>
              <p className="text-zinc-500 text-[15px] mb-10 max-w-2xl" style={dm(400)}>
                No middlemen. No label overhead. Three musicians in a studio making something
                that would not exist without the people who fund it.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: 'Suhas Padav',
                  role: 'Piano & Composition',
                  img: '/images/suhas.png',
                  fallback: '🎹',
                  bio: 'Pianist and composer from Oman. Self-taught ear player since age four, conservatory-trained, writing music that lives at the intersection of jazz, progressive composition, and cinematic melody. The creative architect behind Fractals.',
                  detail: 'Wrote Fractals over six years through three lost versions',
                },
                {
                  name: 'Ric Fierabracci',
                  role: 'Bass',
                  img: '/images/ric.jpg',
                  fallback: '🎸',
                  bio: 'Grammy-nominated bassist with credits spanning Chick Corea, Jean-Luc Ponty, Yanni, and Planet X. Heard the Fractals demo, recognized something in it, and signed on within 24 hours. Stayed to help build the entire production.',
                  detail: 'Mentored the project from single to full album',
                },
                {
                  name: 'Marco Minnemann',
                  role: 'Drums',
                  img: '/images/marco.jpg',
                  fallback: '🥁',
                  bio: 'World-renowned drummer known for The Aristocrats, Steven Wilson, and Joe Satriani. Brings dynamic range, impossible independence between limbs, and a taste for knowing exactly when not to play.',
                  detail: 'Delivered his interpretation in a single session',
                },
              ].map((m, i) => (
                <Reveal key={m.name} delay={i * 100}>
                  <div className="rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all bg-white group">
                    <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                      <img src={m.img} alt={m.name}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                          const span = document.createElement('span');
                          span.className = 'text-5xl';
                          span.textContent = m.fallback;
                          e.target.parentElement.appendChild(span);
                        }} />
                      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <span className="text-zinc-900 font-bold text-[16px]" style={syne(700)}>{m.name}</span>
                        <span className="text-cyan-600 text-[10px] uppercase tracking-wider font-bold flex-shrink-0" style={dm(700)}>{m.role}</span>
                      </div>
                      <p className="text-zinc-600 text-[14px] leading-relaxed mb-3" style={dm(400)}>{m.bio}</p>
                      <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                        <Sparkles size={12} className="text-cyan-500" />
                        <span className="text-zinc-500 text-[12px] italic" style={dm(400)}>{m.detail}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION 3: TIERS
            ═══════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <Reveal>
            <span className="text-cyan-600 text-[11px] font-bold tracking-[0.2em] uppercase block mb-3" style={dm(700)}>Pick your level</span>
            <h2 className="text-2xl md:text-3xl text-zinc-900 mb-2 tracking-tight" style={syne(800)}>
              Be part of this album.
            </h2>
            <p className="text-zinc-500 text-[15px] mb-10 max-w-2xl" style={dm(400)}>
              Every tier comes with your name in the liner notes. Pick the level that feels right.
              You can also scroll up and enter any custom amount.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((tier, i) => {
              const selected = tier.id === selectedTierId;
              return (
                <Reveal key={tier.id} delay={i * 80}>
                  <button
                    onClick={() => {
                      setSelectedTierId(selected ? null : tier.id);
                      setCustomAmount('');
                      if (!selected) donateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={cx(
                      'group relative text-left rounded-2xl p-5 md:p-6 border transition-all duration-200 w-full',
                      'hover:shadow-md active:scale-[0.99]',
                      selected
                        ? 'border-cyan-400 bg-cyan-50/50 ring-1 ring-cyan-200 shadow-md shadow-cyan-100/50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    )}>
                    {tier.popular && (
                      <div className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-cyan-600 text-white">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={dm(700)}>Most Popular</span>
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="text-2xl mt-0.5">{tier.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <h4 className="text-zinc-900 font-bold text-base" style={syne(700)}>{tier.name}</h4>
                          <span className={cx('text-lg font-black tabular-nums', selected ? 'text-cyan-700' : 'text-zinc-800')} style={syne(800)}>{c}{tier.amount}</span>
                        </div>
                        <p className="text-zinc-500 text-[13px] mb-3" style={dm(400)}>{tier.tagline}</p>
                        <div className="space-y-1.5">
                          {tier.perks.map((p) => (
                            <div key={p} className="flex items-start gap-2">
                              <Check size={12} className={cx('mt-0.5 flex-shrink-0', selected ? 'text-cyan-600' : 'text-zinc-300')} strokeWidth={2.5} />
                              <span className="text-zinc-600 text-[13px] leading-relaxed" style={dm(400)}>{p}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
                          <span className="text-zinc-400 text-[11px]" style={dm(500)}>{tier.backers} backers</span>
                          {tier.limited && (
                            <span className="text-amber-600 text-[11px] font-semibold" style={dm(600)}>{tier.remaining} of {tier.remaining + tier.backers} left</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <div className={cx('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          selected ? 'border-cyan-600 bg-cyan-600' : 'border-zinc-300 group-hover:border-zinc-400')}>
                          {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION 4: WHERE THE MONEY GOES
            ═══════════════════════════════════════════════════ */}
        <section className="bg-white border-t border-zinc-100">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
            <Reveal>
              <span className="text-cyan-600 text-[11px] font-bold tracking-[0.2em] uppercase block mb-3" style={dm(700)}>Full transparency</span>
              <h2 className="text-2xl md:text-3xl text-zinc-900 mb-2 tracking-tight" style={syne(800)}>Where every dollar goes.</h2>
              <p className="text-zinc-500 text-[15px] mb-8 max-w-2xl" style={dm(400)}>
                No management fees. No marketing budget. This is a recording project, and the money
                is spent on making the recording as good as it can possibly be.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-zinc-200 bg-[#FAFAF9] p-5 md:p-6">
                <div className="space-y-4">
                  {[
                    { label: 'Studio & Recording', pct: 35, color: '#06b6d4', detail: 'Studio time, equipment rental, engineering' },
                    { label: 'Session Musicians', pct: 25, color: '#3b82f6', detail: 'Ric, Marco, and additional collaborators' },
                    { label: 'Mix & Master', pct: 20, color: '#6366f1', detail: 'Professional mixing and mastering' },
                    { label: 'Physical Production', pct: 12, color: '#8b5cf6', detail: 'Vinyl pressing, CD runs, merchandise' },
                    { label: 'Visuals & Video', pct: 8, color: '#a78bfa', detail: 'Album artwork, music videos, photography' },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-zinc-700 text-[14px]" style={dm(500)}>{b.label}</span>
                          <span className="text-zinc-400 text-[12px] ml-2 hidden sm:inline" style={dm(400)}>{b.detail}</span>
                        </div>
                        <span className="text-zinc-900 text-[14px] font-bold" style={syne(700)}>{b.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-200">
                  <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold block mb-4" style={dm(700)}>Production Timeline</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { q: 'Q1 2026', label: 'Pre-Production', active: true },
                      { q: 'Q2 2026', label: 'Recording' },
                      { q: 'Q3 2026', label: 'Mix & Master' },
                      { q: 'Q4 2026', label: 'Release' },
                    ].map((t) => (
                      <div key={t.q} className={cx('rounded-xl p-3 border text-center',
                        t.active ? 'border-cyan-300 bg-cyan-50' : 'border-zinc-200 bg-white')}>
                        <div className={cx('text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5', t.active ? 'text-cyan-600' : 'text-zinc-400')} style={dm(700)}>{t.q}</div>
                        <div className={cx('text-[12px] font-semibold', t.active ? 'text-zinc-900' : 'text-zinc-500')} style={dm(600)}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION 5: FAQ
            ═══════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <Reveal>
            <span className="text-cyan-600 text-[11px] font-bold tracking-[0.2em] uppercase block mb-3" style={dm(700)}>Before you contribute</span>
            <h2 className="text-2xl md:text-3xl text-zinc-900 mb-2 tracking-tight" style={syne(800)}>Questions</h2>
            <p className="text-zinc-500 text-[15px] mb-8" style={dm(400)}>Everything you might want to know.</p>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
              {faqs.map((f, i) => (
                <div key={f.q}>
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50/50 transition-colors">
                    <span className="text-zinc-800 text-[15px] pr-4" style={dm(500)}>{f.q}</span>
                    <ChevronDown size={16} className={cx('text-zinc-400 flex-shrink-0 transition-transform duration-300', expandedFaq === i && 'rotate-180 text-cyan-600')} />
                  </button>
                  <div className={cx('grid transition-all duration-300 ease-out',
                    expandedFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-zinc-600 text-[14px] leading-relaxed" style={dm(400)}>{f.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION 6: BOTTOM CTA
            ═══════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20 md:pb-28">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 md:p-12 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 text-center">
                <h3 className="text-2xl md:text-3xl text-white mb-4 tracking-tight" style={syne(800)}>
                  This album does not exist without you.
                </h3>
                <p className="text-zinc-400 text-[15px] md:text-[16px] leading-relaxed max-w-xl mx-auto mb-4" style={dm(400)}>
                  Every name in the liner notes represents someone who heard the music and decided it
                  should be heard by everyone else. That is what this is. An invitation to be part of
                  something that matters.
                </p>
                <p className="text-zinc-500 text-[14px] max-w-lg mx-auto mb-8" style={dm(400)}>
                  $5 puts your name on the album. $25 gets you the music before anyone else.
                  $250 gets you a seat at the table. Pick what feels right.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={scrollToDonate}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[13px] font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all active:scale-[0.98]"
                    style={syne(700)}>
                    Contribute Now <Heart size={15} className="fill-current" />
                  </button>
                  <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-white/30 text-[13px] font-bold uppercase tracking-wider transition-all"
                    style={syne(700)}>
                    <ArrowLeft size={14} /> Back to Home
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>


        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="border-t border-zinc-200 bg-white/50">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <img src="/images/suhas-productions-new-logo.PNG" alt="SUHAS" className="h-8 w-auto opacity-50" />
                <span className="text-zinc-400 text-[11px]" style={dm(500)}>&copy; 2026 Suhas Music. All Rights Reserved.</span>
              </div>
              <div className="flex items-center gap-5">
                {[
                  { href: instagramLink, label: 'Instagram' },
                  { href: appleMusicLink, label: 'Apple Music' },
                  { href: spotifyLink, label: 'Spotify' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600 transition-colors text-[11px] font-semibold" style={dm(600)}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}