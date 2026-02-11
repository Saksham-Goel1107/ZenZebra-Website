import ContactPage from '@/components/contact';
import { getSystemSettings } from '@/lib/admin-settings';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const siteName = settings.siteName || 'ZenZebra';

  return {
    title: `Contact | ${siteName}`,
    description: settings.siteDescription || 'Get in touch with us.',
    openGraph: {
      title: `Contact | ${siteName}`,
      description: settings.siteDescription || 'Get in touch with us.',
      images: [{ url: settings.ogImageUrl || 'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin' }],
    }
  };
}

export default async function Contact() {
  const settings = await getSystemSettings();
  return <ContactPage settings={settings} />;
}
