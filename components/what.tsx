'use client';

import { motion } from 'framer-motion';

function What() {
  return (
    <section className="relative z-10 bg-transparent py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10 drop-shadow-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-12"
        >
          Welcome to the <span className="text-[#CC2224] inline-block">Dazzle</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl leading-relaxed text-white/80 font-light space-y-8"
        >
          <p>
            <span className="text-white font-bold">ZenZebra</span> is the curated pause in your "always-on" day. We&apos;ve replaced the boring vending machine with a{" "}
            <span className="text-[#CC2224] font-bold">BreakSpot</span> designed for the curious.
          </p>

          <p>
            Whether it&apos;s an office, gym, or your favorite café, we bring the internet&apos;s most exciting brands directly into your hands.
          </p>

          <p className="text-white font-semibold text-2xl md:text-3xl py-4">
            Touch it, try it, and upgrade your day instantly.
          </p>

          <p className="text-sm md:text-base text-white/50 uppercase tracking-[0.2em] font-bold">
            No guesswork. No scrolling. Just a better lifestyle, right where you are.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#CC2224]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </section>
  );
}

export default What;
