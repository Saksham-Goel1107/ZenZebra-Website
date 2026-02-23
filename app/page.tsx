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
    <main className="bg-black relative min-h-screen">
      {/* Store Tour Animation - Shown first as a full experience */}
      <StoreScrollAnimation isBackground={false} />

      {/* Main Content Flow */}
      <div className="relative z-10">
        <Hero settings={settings} />
        <What />
        <How />
        <Locations />
      </div>
    </main>
  );
}
