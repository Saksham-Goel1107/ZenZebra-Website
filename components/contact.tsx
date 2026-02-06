'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[40rem] w-[40rem] rounded-full bg-[#CC2224]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[36rem] w-[36rem] rounded-full bg-white/10 blur-3xl" />

      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24">
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl font-extrabold text-center"
        >
          Get in <span className="text-[#CC2224]">Touch</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 text-white/70 text-center max-w-2xl text-lg leading-relaxed"
        >
          Whether you&apos;re a brand, a partner, or just curious - we&apos;d love to hear from you.
        </motion.p>

        {/* Contact Cards */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center hover:scale-[1.02] transition-transform"
          >
            <Mail className="h-7 w-7 mx-auto text-[#CC2224] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-white/70 text-sm">
              <a href="mailto:tanmay@zenzebra.in" target="_blank" rel="noopener noreferrer">
                tanmay@zenzebra.in
              </a>
              <br />
              <a href="mailto:gurpreet@zenzebra.in" target="_blank" rel="noopener noreferrer">
                gurpreet@zenzebra.in
              </a>
            </p>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center hover:scale-[1.02] transition-transform"
          >
            <Phone className="h-7 w-7 mx-auto text-[#CC2224] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Phone</h3>
            <p className="text-white/70 text-sm">
              <a href="tel:+919910605187" target="_blank" rel="noopener noreferrer">
                +91 9910605187
              </a>
              <br />
              <a href="tel:+919958680856" target="_blank" rel="noopener noreferrer">
                +91 9958680856
              </a>
            </p>
          </motion.div>

          {/* Address */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-center hover:scale-[1.02] transition-transform"
          >
            <MapPin className="h-7 w-7 mx-auto text-[#CC2224] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Location</h3>
            <a
              href="https://maps.app.goo.gl/sBqk1sKcHpURgwW37"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-white/70 text-sm">Delhi, India</p>
            </a>
          </motion.div>
        </div>

        {/* Socials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 flex items-center justify-center gap-6"
        >
          <a
            href="https://www.instagram.com/zenzebraindia/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Instagram className="h-6 w-6 text-white hover:text-[#CC2224] transition-colors" />
          </a>
          <a
            href="https://www.linkedin.com/company/zenzebraindia/posts/?feedView=all"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Linkedin className="h-6 w-6 text-white hover:text-[#CC2224] transition-colors" />
          </a>
        </motion.div>

        {/* Footer line */}
        <div className="mt-20 border-t border-white/10 pt-6 text-xs text-white/60 text-center">
          © {new Date().getFullYear()} ZenZebra. All rights reserved.
        </div>
      </section>
    </main>
  );
}
