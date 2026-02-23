'use client';
import { ParticleCanvas } from '@/hooks/particle';
import { SystemSettings } from '@/lib/admin-settings';
import { m } from 'framer-motion';

function Hero({ settings }: { settings: SystemSettings }) {
  // Use siteDescription if available, or fallback to default hero text
  const description =
    settings?.siteDescription || 'Curated lifestyle, seamlessly integrated into your daily life.';

  return (
    <section id="hero-landing" className="min-h-screen relative flex items-center justify-center overflow-hidden py-32 grain">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/5 via-black to-black z-0" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent z-[1]" />
      <ParticleCanvas />

      <div className="max-w-7xl mx-auto px-6 z-10 w-full">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Main Content */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto space-y-12"
          >
            {/* Over-title */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center gap-4"
            >
              <span className="text-red-500 uppercase tracking-[0.8em] text-[10px] font-bold">ZenZebra India</span>
              <div className="h-12 w-[1px] bg-red-600/30" />
            </m.div>

            {/* Hero Heading */}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] leading-tight
                         text-white drop-shadow-2xl uppercase"
            >
              {description.split(' ').map((word, i) => (
                <m.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                  whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  className="inline-block mr-[0.3em]"
                >
                  {word === 'lifestyle,' || word === 'lifestyle' || word === 'Curated' ? <span className="font-black italic text-red-600">{word}</span> : word}
                </m.span>
              ))}
            </h1>

            {/* Subtext */}
            <m.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1.5 }}
              viewport={{ once: true }}
              className="text-sm md:text-base text-white/30 font-light max-w-2xl mx-auto uppercase tracking-[0.5em] leading-loose"
            >
              Experience • Lifestyle • Trends
            </m.p>

            {/* Visual Element */}
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 2 }}
              viewport={{ once: true }}
              className="h-[1px] w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mt-16"
            />
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
