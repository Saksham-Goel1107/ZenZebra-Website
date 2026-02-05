'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function ZenAtHome(){
  return(
    <main className="relative min-h-[100svh] bg-black text-white overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[40rem] w-[40rem] rounded-full bg-[#CC2224]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[36rem] w-[36rem] rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />

      {/* Content */}
      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-12 text-center shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center items-center ">
            <Image alt="zenzebra logo" src={'/logo-2.png'} width={175} height={175}></Image>
          </div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold leading-tight"
          >
            Zen At Home <span className="text-[#CC2224]">- Coming Soon</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-4 text-white/75 text-lg leading-relaxed"
          >
            Your favorite lifestyle picks, now where you live.  
            Experience the future of convenience, assurance, and value - 
            brought home by <span className="text-white font-semibold">ZenZebra</span>.
          </motion.p>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10"
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#CC2224] px-8 py-3 text-lg font-semibold tracking-wide hover:scale-105 transition-transform duration-300 ease-out"
            >
              Back to Home
            </Link>
          </motion.div>

          {/* Footer badges */}
          <div className="mt-10 flex items-center justify-center gap-4 text-xs text-white/50">
            <span>Convenience</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Assurance</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Value</span>
          </div>
        </motion.div>
      </section>
    </main>
)}