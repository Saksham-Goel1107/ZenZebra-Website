import { Providers } from '@/components/Providers';
import PublicLayout from '@/components/PublicLayout';
import { Toaster } from '@/components/ui/sonner';
import { getSystemSettings } from '@/lib/admin-settings';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();

  return {
    title: settings.siteName || 'ZenZebra - Curated Lifestyle Where You Already Are',
    description: settings.siteDescription ||
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
      title: settings.siteName || 'ZenZebra - Curated Lifestyle Where You Already Are',
      description: settings.siteDescription ||
        'World’s first lifestyle-integrated brand. Discover, try, and buy premium products right where you live, work, and relax.',
      url: 'https://zenzebra.in',
      siteName: 'ZenZebra',
      images: [
        {
          url: settings.ogImageUrl || 'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985926d0013323cc0ca/view?project=698585dc0014c943f45e&mode=admin',
          width: 1200,
          height: 630,
          alt: `${settings.siteName || 'ZenZebra'} Experience`,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    metadataBase: new URL('https://zenzebra.in'),
  };
}

export const viewport = {
  themeColor: '#CC2224',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSystemSettings();
  const gaId = settings.googleAnalyticsId || 'G-GM4Q02DG8S';

  return (
    <html lang="en">
      <body className={`${montserrat.className} bg-black`}>
        <Analytics />
        <SpeedInsights />
        <Providers>
          <PublicLayout settings={settings}>
            {children}
          </PublicLayout>
          <Toaster />
        </Providers>
        {/* Google tag (gtag.js) */}
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
        {/* Schema.org markup for Google+ */}
        <Script id="schema-org" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "${settings.siteName || 'ZenZebra'}",
              "url": "https://zenzebra.in",
              "logo": "${settings.logoUrl || 'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin'}",
              "sameAs": [
                "${settings.socialInstagram || 'https://www.instagram.com/zenzebraindia/'}",
                "${settings.socialLinkedIn || 'https://www.linkedin.com/company/zenzebraindia/'}"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "${settings.supportPhone || '+91-9910605187'}",
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
            gtag('config', '${gaId}');
          `}
        </Script>
      </body>
    </html>
  );
}
