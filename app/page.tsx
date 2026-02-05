import BrandCounter from "@/components/brandCounter";
import Hero from "@/components/hero";
import How from "@/components/How";

import OurPromise from "@/components/promise";
import What from "@/components/what";
import Why from "@/components/why";
import Image from 'next/image'
import dynamic from "next/dynamic";
const Ticker = dynamic(() => import("@/components/Ticker"));
const Locations = dynamic(() => import("@/components/Locations"));

export const metadata = {
  title: "ZenZebra - Curated Lifestyle Where You Already Are",
  description:
    "ZenZebra brings curated lifestyle products directly into your daily spaces - offices, gyms, cafés, and malls. Try first, own after. No pressure, no guesswork, just better living by design.",
  keywords: [
    "ZenZebra",
    "lifestyle brand",
    "lifestyle integrated brand",
    "try before you buy",
    "curated experiences",
    "consumer convenience",
    "brand sampling",
    "modern retail India",
  ],
  authors: [{ name: "ZenZebra Team" }],
  openGraph: {
    title: "ZenZebra - Curated Lifestyle Where You Already Are",
    description:
      "World’s first lifestyle-integrated brand. Discover, try, and buy premium products right where you live, work, and relax.",
    url: "https://zenzebra.in",
    siteName: "ZenZebra",
    images: [
      {
        url: "/logo.png", 
        width: 1200,
        height: 630,
        alt: "ZenZebra Lifestyle Experience",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  metadataBase: new URL("https://zenzebra.in"),
}

export const viewport = {
  themeColor: "#CC2224",
}

export default function Home() {
  return (
    <main className="bg-black">
      <Hero/>
      <div className="flex justify-center lg:block">
        <Image src={'/asset-1.png'} width={1920} height={1080} className="mt-20 opacity-40 lg:opacity-100 sm:mt-0 absolute w-150" alt="blob image 1"/>
      </div>
      <What/>
      <How/>
      <div className="relative overflow-x-clip">
        <Image src={'/asset-3.png'} width={1920} height={1080} alt=""  className="hidden lg:block absolute top-[-40px] right-0 translate-x-[40%] w-[900px] opacity-50 pointer-events-none select-none"/>
      </div>
      <Why/>
      <div className='relative w-3/4 mx-auto border-t border-white/25 my-3'></div>
      <BrandCounter/>
      <Ticker/>
      <Locations/>
      <div className="flex justify-center">
        <Image src={'/asset-4.png'} width={1920} height={1080} className="absolute w-150 translate-y-[-20%] ml-10 opacity-30" alt="blob image 2"/>
      </div>
      <OurPromise/>
    </main>
  );
}
