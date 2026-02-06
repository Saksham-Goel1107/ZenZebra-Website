'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <Image
          src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858dc800346082cb4e/view?project=698585dc0014c943f45e&mode=admin"
          width={1000}
          height={1000}
          alt="Girl with Specs"
          className="absolute top-[-20%] left-[-10%] w-[600px] opacity-20 blur-3xl animate-pulse"
        />
        <Image
          src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858dc800346082cb4e/view?project=698585dc0014c943f45e&mode=admin"
          width={1000}
          height={1000}
          alt="Girl with Specs"
          className="absolute bottom-[-20%] right-[-10%] w-[600px] opacity-20 blur-3xl"
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[150px] md:text-[200px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#CC2224] to-black/50 select-none"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl md:text-4xl font-bold mb-6"
        >
          Lost in the wild?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white/60 text-lg mb-10"
        >
          The page you're looking for seems to have wandered off. <br className="hidden md:block" />
          Let's get you back to where better living happens.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#CC2224] text-white font-medium hover:bg-[#b01d1f] transition-all transform hover:scale-105 shadow-lg shadow-red-900/20"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
