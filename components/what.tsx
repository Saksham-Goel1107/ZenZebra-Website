'use client';

import { motion } from 'framer-motion';

function What() {
  return (
    <section className="relative z-10 bg-transparent py-20 md:py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10 drop-shadow-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-12"
        >
          Welcome to the <span className="text-[#CC2224] inline-block">Breakspot</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl leading-relaxed text-white/80 font-light space-y-12"
        >
          <div className="space-y-6">
            <p>
              We have brought the internet&apos;s most wanted labels to your office doorstep.
            </p>
            <p>
              It feels less like a shop and more like your personal curated wishlist, brought to your lifestyle.
            </p>
          </div>
          <p className="text-white font-semibold text-2xl md:text-3xl pt-12 italic">
            Because your orbit deserves better
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#CC2224]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </section>
  );
}

export default What;
