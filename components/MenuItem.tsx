'use client'
import { easeOut, motion } from "motion/react"
import { Children, ReactNode } from "react"

const MenuItem = ({children, href, index}: {children: React.ReactNode, href: string, index: number})=>{
    return(
        <motion.a href={href}
            initial={{opacity: 0, y: -20}}
            animate= {{opacity: 1, y: 0}}
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            transition={{
                delay: index*0.1,
                duration: 0.3,
                ease: "easeOut"
            }}
            className="inline-block px-2 py-1 overflow-hidden relative">
            <span className="hover:text-blue-100 bold">{children}</span>
        </motion.a>
    )
}

export default MenuItem