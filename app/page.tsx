import Hero from '@/components/hero';
import How from '@/components/How';

import StoreScrollAnimation from '@/components/StoreScrollAnimation';
import What from '@/components/what';
import { getSystemSettings } from '@/lib/admin-settings';
import dynamic from 'next/dynamic';
import Image from 'next/image';
const Locations = dynamic(() => import('@/components/Locations'));

export default async function Home() {
  const settings = await getSystemSettings();

  return (
    <main className="bg-black relative min-h-screen">
      {/* Background Scroll Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StoreScrollAnimation isBackground />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        <Hero settings={settings} />
        <div className="flex justify-center lg:block">
          <Image
            src={
              'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858dc800346082cb4e/view?project=698585dc0014c943f45e&mode=admin'
            }
            width={1920}
            height={1080}
            className="mt-20 opacity-40 lg:opacity-100 sm:mt-0 absolute w-150"
            alt="Girl with Specs"
          />
        </div>
        <What />
        <How />
        <Locations />
      </div>
    </main>
  );
}
