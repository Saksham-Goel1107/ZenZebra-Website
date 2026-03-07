import Hero from '@/components/hero';
import How from '@/components/How';

import StoreScrollAnimation from '@/components/StoreScrollAnimation';
import What from '@/components/what';
import { getSystemSettings } from '@/lib/admin-settings';
import dynamic from 'next/dynamic';
const Locations = dynamic(() => import('@/components/Locations'));

export default async function Home() {
  const settings = await getSystemSettings();

  return (
    <main className="bg-black">
      <Hero settings={settings} />
      <StoreScrollAnimation />

      {/* What section */}
      <What />

      {/* How section */}
      <How />

      {/* Subtle separator */}
      {/* <div className="relative max-w-4xl mx-auto">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div> */}
      {/* Locations */}
      <Locations />
    </main>
  );
}
