// 'use client'
// import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion'
// import { useEffect, useState } from 'react'

// export default function CountUp({
//   to = 150,
//   duration = 1.2,
//   suffix = '+',
// }: { to?: number; duration?: number; suffix?: string }) {
//   const count = useMotionValue(0)
//   const [display, setDisplay] = useState(0)

//   // animate 0 -> to
//   useEffect(() => {
//     const controls = animate(count, to, { duration, ease: 'easeOut' })
//     return () => controls.stop()
//   }, [to, duration])

//   // subscribe to value changes -> update state -> re-render
//   useMotionValueEvent(count, 'change', (v) => {
//     setDisplay(Math.round(v))
//   })

//   return (
//     <span className="font-extrabold text-2xl text-[#CC2224]/80">
//       {display}{suffix}
//     </span>
//   )
// }

//the above code renders the count even when not in view , the below code takes care of viewport

'use client'

import { animate, useMotionValue, useMotionValueEvent, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
  to: number
  duration?: number
  suffix?: string
  from?: number
}

export default function CountUp({ to, duration = 1.2, suffix = '+', from = 0 }: Props) {
  const mv = useMotionValue(from)
  const [display, setDisplay] = useState(from)
  const started = useRef(false)

  // reflect motion value into React state
  useMotionValueEvent(mv, 'change', (v) => setDisplay(Math.round(v)))

  // trigger the animation once when the element enters viewport
  const start = () => {
    if (started.current) return
    started.current = true
    const controls = animate(mv, to, { duration, ease: 'easeOut' })
    // optional: return controls.stop in cleanup if you add unmount logic
  }

  return (
    <motion.span
      onViewportEnter={start}
      viewport={{ once: true, amount: 0.8 }} // start when ~80% visible
      className="font-extrabold text-2xl text-[#ff3336]"
    >
      {display}{suffix}
    </motion.span>
  )
}
