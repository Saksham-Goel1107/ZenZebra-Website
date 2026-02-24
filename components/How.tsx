'use client';

import { motion } from 'framer-motion';
import { Gem, RefreshCcw, Sparkles } from 'lucide-react';

export default function How() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 50 } },
  };

  return (
    <section className="relative py-20 md:py-32 px-6 overflow-hidden bg-transparent">
      {/* Background Glow - Reduced Opacity */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-[#CC2224]/5 blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        {/* Left: Heading */}
        <div className="space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="text-[#CC2224] font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
              The Experience
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9]">
              THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                CURATED
              </span>{' '}
              <br />
              APPROACH
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-white/70 max-w-md leading-relaxed"
          >
            We find the cult brands so you don't have to. Discovery happens here physically
            instantly, and right where you are.
          </motion.p>
        </div>

        {/* Right: Steps */}
        <motion.div
          className="grid gap-6 relative z-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#CC2224] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" />
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-8 flex items-start gap-6 hover:border-[#CC2224]/50 transition-colors duration-300">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#CC2224]/10 flex items-center justify-center text-[#CC2224] group-hover:bg-[#CC2224] group-hover:text-white transition-all duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#CC2224] transition-colors">
                  Fresh Drops
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Discover the latest and greatest from the brands you love. We curate the
                  excitement so you just enjoy the find.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="group relative">
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-8 flex items-start gap-6 hover:border-[#CC2224]/50 transition-colors duration-300">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#CC2224]/10 flex items-center justify-center text-[#CC2224] group-hover:bg-[#CC2224] group-hover:text-white transition-all duration-300">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#CC2224] transition-colors">
                  Fast Rotations
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  New brands, new flavors, new obsessions. Our lineup rotates fast, so there&apos;s
                  always something fresh to discover.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="group relative">
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-8 flex items-start gap-6 hover:border-[#CC2224]/50 transition-colors duration-300">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#CC2224]/10 flex items-center justify-center text-[#CC2224] group-hover:bg-[#CC2224] group-hover:text-white transition-all duration-300">
                <Gem className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#CC2224] transition-colors">
                  Chosen For You
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  No guesswork. No pressure. Just the best products by the best brands, curated
                  specifically for your space.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
