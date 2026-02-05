import {
  Hero,
   WhatYouGet,
  WhyJoin,
  Network,
  BrandsCarousel,
  FinalCTA,
} from "@/components/brandsPage";
import Image from "next/image";

export const metadata = {
  title: "Brands | ZenZebra",
  description:
    "Join 250+ trend-driven brands on ZenZebra — where discovery meets belonging. Be part of curated offline experiences that make people feel something real.",
  keywords: [
    "ZenZebra brands",
    "brand collaboration",
    "experiential retail",
    "offline discovery",
    "product showcase",
    "brand partnerships",
    "lifestyle retail India",
  ],
  openGraph: {
    title: "Brands | ZenZebra",
    description:
      "Show up where discovery still feels real. Partner with ZenZebra to bring your brand to life inside real-world BreakSpots.",
    url: "https://zenzebra.in/brands",
    siteName: "ZenZebra",
    images: [
      {
        url: "/logo-2.png",
        width: 1200,
        height: 630,
        alt: "ZenZebra Brands Page",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  metadataBase: new URL("https://zenzebra.in"),
};

export const viewport = {
  themeColor: "#CC2224",
};

export default function BrandsPage() {
  return (
    <main className="bg-black text-white relative">
      <Image
        src={"/blob-1.jpg"}
        alt="blob image"
        width={1920}
        height={1080}
        className='sm:block absolute top-0 left-0 w-full h-full object-cover opacity-60 pointer-events-none select-none'
      />
      <div className="relative z-10">
        <Hero />
        <WhyJoin />
        <Network />
        <WhatYouGet />
        <BrandsCarousel />
        <FinalCTA />
      </div>
    </main>
  );
}
