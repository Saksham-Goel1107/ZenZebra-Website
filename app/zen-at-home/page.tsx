import ZenAtHome from "@/components/zenAtHome"

export const metadata = {
  title: "Zen at Home | Coming Soon | ZenZebra",
  description:
    "ZenZebra is bringing its lifestyle-integrated experience home. Discover curated essentials that redefine convenience, assurance, and value - launching soon.",
  keywords: [
    "Zen at Home",
    "ZenZebra home delivery",
    "lifestyle brand India",
    "premium essentials",
    "coming soon",
  ],
  openGraph: {
    title: "Zen at Home | Coming Soon | ZenZebra",
    description:
      "Your favorite lifestyle picks, now where you live. ZenZebra is redefining the home experience — convenience, assurance, and value delivered.",
    url: "https://zenzebra.in/zen-at-home",
    siteName: "ZenZebra",
    images: [{ url: "/logo-2.png", width: 1200, height: 630, alt: "ZenZebra Zen at Home" }],
    locale: "en_IN",
    type: "website",
  },
  metadataBase: new URL("https://zenzebra.in"),
  themeColor: "#CC2224",
}

export default function ZenAtHomeComingSoon() {
  return (
    <ZenAtHome/>
  )
}



