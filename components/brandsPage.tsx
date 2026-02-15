'use client';

import { m } from 'framer-motion';
import dynamic from 'next/dynamic';
import { PartnerRequestModal } from './PartnerRequestModal';

const Ticker = dynamic(() => import('@/components/Ticker'));

/* -------------------- Hero -------------------- */
export function Hero() {
  return (
    <section className="relative overflow-hidden py-28 px-6">
      {/* brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_80%_0%,rgba(204,34,36,.18),transparent_60%)]" />
      <div className="mx-auto max-w-6xl">
        <m.h1
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight"
        >
          Where Good Taste Gets <span className="text-[#CC2224]">Discovered</span> - Offline
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-4 max-w-2xl text-white/75"
        >
          ZenZebra turns your brand into a real-world moment of discovery - inside coworking spaces,
          hotels, and cafés where people pause, touch, and share.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          viewport={{ once: true }}
          className="mt-8 flex items-center gap-3"
        >
          <PartnerRequestModal>
            <button className="rounded-full bg-[#CC2224] px-6 py-3 text-sm font-semibold hover:bg-[#b31d1f] transition text-white">
              Become a Brand Partner
            </button>
          </PartnerRequestModal>
        </m.div>
      </div>
    </section>
  );
}

/* -------------------- Why Join -------------------- */
export function WhyJoin() {
  const items = [
    {
      title: 'Emotional Reach',
      text: 'Turn impulse into emotion. Be part of stories shared over breaks - not ads.',
    },
    {
      title: 'Physical Discovery',
      text: 'Touch. Feel. Try. Be present in the real world, right where your audience is.',
    },
    {
      title: 'Smart Curation',
      text: 'Every placement is intentional - matched to location, vibe, and audience.',
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        >
          More Than Placement - <span className="text-[#CC2224]">It’s Presence</span>
        </m.h2>
        <p className="mt-3 text-white/70">
          Built for how modern consumers discover, feel, and share.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {items.map((it, i) => (
            <m.div
              key={it.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 p-6"
            >
              <h3 className="text-xl font-semibold">{it.title}</h3>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{it.text}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- Network -------------------- */
export function Network() {
  const tiles = [
    { title: 'Coworking', line: 'Smartworks, WeWork & more' },
    { title: 'Hospitality', line: 'Hotels, spas, resorts' },
    { title: 'Cafés & Lounges', line: 'High-dwell social hubs' },
    { title: 'Universities', line: 'Youthful, high-intent zones' },
  ];
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_20%_100%,rgba(204,34,36,.16),transparent_60%)]" />
      <div className="mx-auto max-w-6xl">
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        >
          One Brand, <span className="text-[#CC2224]">Many Worlds</span>
        </m.h2>
        <p className="mt-3 text-white/70">
          Place your brand inside India’s most dynamic ecosystems.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {tiles.map((t, i) => (
            <m.div
              key={t.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-lg font-semibold">{t.title}</p>
              <p className="mt-1 text-sm text-white/60">{t.line}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- What You Get -------------------- */
export function WhatYouGet() {
  const points = [
    {
      title: 'Real-world visibility',
      text: 'Show up where your audience works, unwinds, and shares - not just where they scroll.',
    },
    {
      title: 'Placement that fits',
      text: 'Data-curated by space, vibe, and income profile. Your brand belongs where it performs.',
    },
    {
      title: 'Measurable engagement',
      text: 'Trials, footfall, sentiment - beyond vanity metrics.',
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        >
          Designed for Brands <span className="text-[#CC2224]">That Get It</span>
        </m.h2>

        <div className="mt-10 space-y-4">
          {points.map((p, i) => (
            <m.div
              key={p.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 px-6 py-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="text-sm text-white/70 sm:max-w-[65%]">{p.text}</p>
              </div>
              <span className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-[#CC2224]/70 transition-all duration-500 group-hover:w-full" />
            </m.div>
          ))}
        </div>

        <p className="mt-6 text-white/55 text-sm">
          The right space, the right vibe, the right moment - every time.
        </p>
      </div>
    </section>
  );
}

/* -------------------- Brands Carousel -------------------- */
export function BrandsCarousel() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        >
          Brands That <span className="text-[#CC2224]">Dazzle</span> With Us
        </m.h2>
        <p className="mt-3 text-white/70">
          250+ curated brands - homegrown disruptors to global icons.
        </p>
        <Ticker />
      </div>
    </section>
  );
}

/* -------------------- Final CTA -------------------- */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(204,34,36,.22),transparent_60%)]" />
      <div className="mx-auto max-w-6xl">
        <m.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        >
          Join the <span className="text-[#CC2224]">Dazzle</span>
        </m.h3>
        <p className="mt-3 max-w-2xl text-white/75">
          Bring your brand where people actually feel something. Let’s co-create moments of
          discovery - together.
        </p>

        <div className="mt-8">
          <PartnerRequestModal>
            <button className="rounded-full bg-[#CC2224] px-6 py-3 text-sm font-semibold hover:bg-[#b31d1f] transition text-white">
              Apply to Partner
            </button>
          </PartnerRequestModal>
        </div>
      </div>
    </section>
  );
}
