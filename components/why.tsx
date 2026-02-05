"use client";

import { motion } from "framer-motion";

const items = [
  {
    k: "01",
    title: "Convenience",
    line: "Right where you are. No detours.",
  },
  {
    k: "02",
    title: "Assurance",
    line: "Try first. Own later. No regrets",
  },
  {
    k: "03",
    title: "Value",
    line: "Lux experience. Honest prices.",
  },
];


export default function Why() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* subtle background sheen */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_80%_10%,rgba(204,34,36,0.18),transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
        >
          Smarter choices made <span className="text-[#CC2224]">Effortless</span>
        </motion.h2>

        <div className="mt-10 space-y-4">
          {items.map((it, idx) => (
            <Stripe key={it.k} idx={idx} {...it} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stripe({
  k,
  title,
  line,
  idx,
}: {
  k: string;
  title: string;
  line: string;
  idx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: idx * 0.06 }}
      whileHover={{ scale: 1.01 }}
      className="group relative overflow-hidden rounded-2xl"
    >
      {/* base */}
      <div
        className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-6 
             rounded-2xl px-6 py-6 bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10"
      >
        {/* left: key + title */}
        <div className="flex items-baseline gap-4">
          <span className="text-xs tracking-widest text-white/40">{k}</span>
          <h3 className="text-2xl sm:text-3xl font-semibold text-white">
            {title}
          </h3>
        </div>

        {/* connector (visible only on desktop/tablet) */}
        <div className="hidden sm:flex flex-1 relative items-center">
          {/* red line */}
          <span className="h-[2px] w-full bg-[#CC2224] rounded-full" />
          {/* arrow head */}
          <span
            className="absolute right-0 w-3 h-3 border-t-2 border-r-2 border-[#CC2224] rotate-45 translate-x-[4px]"
          />
        </div>

        {/* right: one-line value */}
        <p className="text-sm sm:text-base text-white/70 font-bold">{line}</p>

        {/* red underline that grows on hover */}
        <span className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-[#CC2224]/70 transition-all duration-500 group-hover:w-full" />
      </div>

      {/* sheen on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-x-10 -top-1/2 h-full rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" />
      </div>
    </motion.div>
  );
}