import CataloguePage from "@/components/Catalog"

export const metadata = {
  title: "Catalogue | ZenZebra",
  description:
    "Browse ZenZebra’s curated catalogues from Smartworks, Ambience mall, and The Lodhi. Discover the latest lifestyle products you can try before you buy — right where you are.",
  keywords: [
    "ZenZebra catalogue",
    "Smartworks Gurugram",
    "Ambience Mall Gurugram",
    "The Lodhi",
    "product catalogue",
  ],
  openGraph: {
    title: "Catalogue | ZenZebra",
    description:
      "Explore ZenZebra catalogues for Smartworks, Ambience Mall, and DLF Spa. Experience convenience, assurance, and value through curated lifestyle offerings.",
    url: "https://zenzebra.in/catalogue",
    siteName: "ZenZebra",
    images: [{ url: "/logo-3.png", width: 1200, height: 630, alt: "ZenZebra Catalogue" }],
    locale: "en_IN",
    type: "website",
  },
  metadataBase: new URL("https://zenzebra.in"),
  themeColor: "#CC2224",
}


export default function Catalogue(){
  return <CataloguePage/>
}


