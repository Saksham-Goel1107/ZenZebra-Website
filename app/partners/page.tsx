import {
  CollabModel,
  ExperienceSection,
  FinalCTA,
  Hero,
  Numbers,
  ValueSection,
} from "@/components/partnersPage";
import Image from "next/image";

export const metadata = {
  title: "Partners | ZenZebra",
  description:
    "Transform your space into a BreakSpot with ZenZebra. Elevate your coworking, hotel, or café with experiential retail that drives engagement, dwell time, and belonging.",
  keywords: [
    "ZenZebra partners",
    "space partnerships",
    "coworking collaborations",
    "hotel retail concepts",
    "experiential retail India",
    "brand x space partnership",
    "BreakSpot model",
  ],
  openGraph: {
    title: "Partners | ZenZebra",
    description:
      "Partner with ZenZebra to turn everyday movement into memorable moments. Build BreakSpots inside your space — where curiosity meets culture.",
    url: "https://zenzebra.in/partners",
    siteName: "ZenZebra",
    images: [
      {
        url: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin",
        width: 1200,
        height: 630,
        alt: "ZenZebra Partners Page",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  metadataBase: new URL("https://zenzebra.in"),
  themeColor: "#CC2224",
};

export default function PartnersPage() {
  return (
    <main className="bg-black text-white relative">
      <Image
        src={
          "/https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858f000011da237d9a/view?project=698585dc0014c943f45e&mode=admin.jpg"
        }
        alt="blob image 1"
        width={1920}
        height={1080}
        className=' sm:block absolute top-0 left-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"'
      />
      <div className="relative z-10">
        <Hero />
        <ValueSection />
        <ExperienceSection />
        <Numbers />
        <CollabModel />
        <FinalCTA />
      </div>
    </main>
  );
}
