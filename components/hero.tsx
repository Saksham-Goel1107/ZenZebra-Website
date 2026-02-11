'use client';
import { ParticleCanvas } from '@/hooks/particle';
import { SystemSettings } from '@/lib/admin-settings';
import { m } from 'framer-motion';
import Link from 'next/link';

function Hero({ settings }: { settings: SystemSettings }) {
  // Use siteDescription if available, or fallback to default hero text
  const description = settings?.siteDescription || "Curated lifestyle, seamlessly integrated into your daily life.";

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden pt-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-background to-background z-0" />
      <ParticleCanvas />

      <div className="max-w-7xl mx-auto px-6 z-10 w-full">
        <div className="flex flex-col items-center justify-center text-center">

          {/* Main Content */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Tagline / Badge (Optional, adds a nice touch) */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium uppercase tracking-[0.2em] text-white/50 backdrop-blur-sm">
                Next Gen Catalogue
              </span>
            </m.div>

            {/* Hero Heading */}
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1]
                         bg-gradient-to-b from-white via-white/90 to-white/40
                         bg-clip-text text-transparent drop-shadow-2xl"
            >
              {description}
            </m.h1>

            {/* Subtext */}
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-white/60 font-light max-w-2xl mx-auto"
            >
              Try it. Own it. On the go.
            </m.p>

            {/* CTA Button */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="pt-4"
            >
              <Link href={'/catalogue'}>
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-5 rounded-full bg-white text-black font-bold text-lg
                             tracking-wide overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]
                             hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Catalogue
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </m.button>
              </Link>
            </m.div>
          </m.div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
