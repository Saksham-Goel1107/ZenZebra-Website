'use client'
import PageTransition from "@/components/pageTransition";
import { useEffect } from "react";
import { usePathname } from 'next/navigation'

export default function Template({children}: {children: React.ReactNode}){
    const pathname = usePathname()
    useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })    //every page starts rendering from top scroll position
  }, [pathname])
    return (
        <PageTransition>{children}</PageTransition>
    )
}