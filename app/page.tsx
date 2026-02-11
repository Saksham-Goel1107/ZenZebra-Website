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
      {/* Background Scroll Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StoreScrollAnimation isBackground />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        <Hero settings={settings} />
        {/* Removed conflicting side image per request */}
        <What />
        <How />
        <Locations />
      </div>
    </main>
  );
}
