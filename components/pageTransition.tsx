// components/pageTransition.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={path}
        initial={{ opacity: 0, y: 16 }}   // enter: below & transparent
        animate={{ opacity: 1, y: 0 }}    // on screen
        exit={{ opacity: 0, y: -12 }}     // leave: up & fade
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}