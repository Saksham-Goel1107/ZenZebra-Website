import ContactPage from '@/components/contact';

export const metadata = {
  title: 'Contact | ZenZebra',
  description:
    'Get in touch with ZenZebra - the world’s first lifestyle-integrated brand. Whether you’re a brand, partner, or customer, reach out to our team in Delhi for collaborations and queries.',
  keywords: [
    'ZenZebra contact',
    'ZenZebra India',
    'lifestyle brand Delhi',
    'brand partnerships',
    'customer support',
  ],
  openGraph: {
    title: 'Contact | ZenZebra',
    description:
      'Reach out to ZenZebra - convenience, assurance, and value-driven experiences. Connect with our team for brand or partnership opportunities.',
    url: 'https://zenzebra.in/contact',
    siteName: 'ZenZebra',
    images: [
      {
        url: 'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin',
        width: 1200,
        height: 630,
        alt: 'ZenZebra Contact',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  metadataBase: new URL('https://zenzebra.in'),
  themeColor: '#CC2224',
};

export default function Contact() {
  return <ContactPage />;
}
