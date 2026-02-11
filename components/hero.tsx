'use client';
import { ParticleCanvas } from '@/hooks/particle';
import { SystemSettings } from '@/lib/admin-settings';
import { m, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

function Hero({ settings }: { settings: SystemSettings }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  // Use siteDescription if available, or fallback to default hero text
  const description = settings?.siteDescription || "Curated lifestyle, seamlessly integrated into your daily life.";

  return (
    <section className="min-h-screen relative overflow-hidden">
      <ParticleCanvas />
      <div className="max-w-7xl mx-auto px-6 pt-32 z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text content */}
          <m.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative group lg:w-1/2"
          >
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold leading-[1.15] md:leading-[1.1] bg-gradient-to-r from-white/80 via-white/50 to-white/30
                    bg-clip-text text-transparent mb-6"
            >
              {description}
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-white/80 mb-8"
            >
              Try it. Own it. On the go
            </m.p>

            <Link href={'/catalogue'}>
              <m.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                className="relative overflow-hidden px-8 py-4 rounded-full border
                       border-white/30 hover:border-white/50 transition-all cursor-pointer group"
              >
                <span className="text-white/80 hover:text-white transition-colors">
                  Explore catalogue
                </span>

                <div
                  className="absolute inset-0 bg-gradient-to-r
                                    from-red-600/20 via-red-400/10 to-red-200/5 opacity-0
                                    hover:opacity-100 transition-opacity"
                />
              </m.button>
            </Link>
          </m.div>

          {/*image card*/}
          <m.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="lg:w-1/2 relative"
            style={{ y }}
          >
            <div className="relative w-full aspect-square group">
              {/* Floating Animation */}
              <m.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-full aspect-auto
                                rounded-3xl overflow-hidden
                                border border-white/20 shadow-red-500/30 shadow-lg
                                backdrop-blur-sm"
              >
                <Image
                  src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698593ac00096766835b/view?project=698585dc0014c943f45e&mode=admin"
                  alt={`${settings?.siteName || 'Smartworks'} interior with branding`}
                  width={1920}
                  height={1080}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover scale-110 group-hover:scale-100
                                            transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t
                                        from-black/60 to-transparent"
                  aria-hidden="true"
                />
              </m.div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
