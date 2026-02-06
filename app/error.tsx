'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import * as Sentry from "@sentry/nextjs";
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error])

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-6">
       {/* Background Ambience */}
       <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black"></div>

      <div className="relative z-10 text-center max-w-xl mx-auto">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/10 flex items-center justify-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#CC2224" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        </motion.div>

        <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-4"
        >
            Something went wrong!
        </motion.h2>
        
        <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 mb-8"
        >
            We encountered an unexpected error. Our team has been notified.
        </motion.p>

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
            <button
                onClick={reset}
                className="px-8 py-3 rounded-full bg-[#CC2224] text-white font-medium hover:bg-[#b01d1f] transition-all transform hover:scale-105"
            >
                Try Again
            </button>
            <Link
                href="/"
                className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-all"
            >
                Go Home
            </Link>
        </motion.div>
      </div>
    </main>
  )
}
