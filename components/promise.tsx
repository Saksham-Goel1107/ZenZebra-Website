'use client'

import { motion } from 'framer-motion'

export default function OurPromise() {
  return (
    <section className="relative">
      {/* subtle brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_80%_10%,rgba(204,34,36,0.18),transparent_60%)]" />

      <div className="mx-auto max-w-5xl px-6">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl sm:text-5xl font-extrabold tracking-tight text-white"
        >
          Our <span className="text-[#CC2224]">Promise</span>
        </motion.h2>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-4 text-center text-white text-lg"
        >
          The joy of finding yourself - together.
        </motion.p>

        {/* Body copy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 space-y-3 text-center text-white"
        >
          <p>We promise joy without effort.</p>
          <p>
            We promise that shopping can be both personal and social, that taste doesn’t have to be
            expensive, and that discovery doesn’t have to be digital.
          </p>
          <p className="text-white">At ZenZebra, you’ll always find:</p>
        </motion.div>

        {/* Three bullets */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            "Something you didn’t know you wanted.",
            "Something that feels uniquely yours.",
            "Something you’ll want to share.",
          ].map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="relative rounded-2xl bg-white/[0.05] backdrop-blur-xl ring-1 ring-white/10
                         px-5 py-4 text-white hover:bg-white/[0.07] transition"
            >
              <span className="absolute left-4 top-4 block h-2 w-2 rounded-full bg-[#CC2224]" />
              <p className="pl-6 text-sm sm:text-base text-white/85">{item}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}