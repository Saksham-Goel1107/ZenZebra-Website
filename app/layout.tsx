import Footer from '@/components/Footer';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Montserrat } from 'next/font/google';
import Navbar from '../components/Navbar';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'ZenZebra - Curated Lifestyle Where You Already Are',
  description:
    'ZenZebra brings curated lifestyle products directly into your daily spaces - offices, gyms, cafés, and malls. Try first, own after. No pressure, no guesswork, just better living by design.',
  keywords: [
    'ZenZebra',
    'lifestyle brand',
    'lifestyle integrated brand',
    'try before you buy',
    'curated experiences',
    'consumer convenience',
    'brand sampling',
    'modern retail India',
  ],
  authors: [{ name: 'ZenZebra Team' }],
  openGraph: {
    title: 'ZenZebra - Curated Lifestyle Where You Already Are',
    description:
      'World’s first lifestyle-integrated brand. Discover, try, and buy premium products right where you live, work, and relax.',
    url: 'https://zenzebra.in',
    siteName: 'ZenZebra',
    images: [
      {
        url: 'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985926d0013323cc0ca/view?project=698585dc0014c943f45e&mode=admin',
        width: 1200,
        height: 630,
        alt: 'ZenZebra Lifestyle Experience',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  metadataBase: new URL('https://zenzebra.in'),
};

export const viewport = {
  themeColor: '#CC2224',
};

import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} bg-black`}>
        <Analytics />
        <SpeedInsights />
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </Providers>
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-GM4Q02DG8S" />
        {/* Schema.org markup for Google+ */}
        <Script id="schema-org" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ZenZebra",
              "url": "https://zenzebra.in",
              "logo": "https://zenzebra.inhttps://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin",
              "sameAs": [
                "https://www.instagram.com/zenzebraindia/",
                "https://www.linkedin.com/company/zenzebraindia/"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-9910605187",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": "en"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Delhi",
                "addressCountry": "IN"
              }
            }
          `}
        </Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GM4Q02DG8S');
          `}
        </Script>
      </body>
    </html>
  );
}
