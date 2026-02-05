'use client'

import { motion } from 'framer-motion'
import { Search, FlaskConical, ShoppingBag } from 'lucide-react'

export default function How() {
  return (
    <section className="relative py-20 bg-[#CC2224] text-white">
      <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-2">
        {/* Left: big message */}
        <div className="flex flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold leading-tight"
          >
            Discovery <br/><span className="text-black">To</span> Destination
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            className="mt-4 text-white/90 max-w-prose"
          >
            From discovery to decision - in spaces you already are.<br/>
            No pressure. No guesswork.
          </motion.p>
        </div>

        {/* Right: stacked step cards (white on red) */}
        <div className="grid gap-5">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="rounded-xl bg-white text-[#353535] p-5 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#CC2224]">STEP 1</div>
                <h3 className="text-lg font-semibold">Discover</h3>
                <p className="mt-1 text-sm text-[#353535]/80">
                  Find exciting products right where you are.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="rounded-xl bg-white text-[#353535] p-5 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#CC2224]">STEP 2</div>
                <h3 className="text-lg font-semibold">Try</h3>
                <p className="mt-1 text-sm text-[#353535]/80">
                  Touch and feel what fits your routine - before you decide.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.25 }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="rounded-xl bg-white text-[#353535] p-5 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#CC2224]">STEP 3</div>
                <h3 className="text-lg font-semibold">Buy</h3>
                <p className="mt-1 text-sm text-[#353535]/80">
                  At prices that feel right, no regrets.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
