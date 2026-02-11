import BrandCounter from '@/components/brandCounter';
import Hero from '@/components/hero';
import How from '@/components/How';

import OurPromise from '@/components/promise';
import StoreScrollAnimation from '@/components/StoreScrollAnimation';
import What from '@/components/what';
import Why from '@/components/why';
import { getSystemSettings } from '@/lib/admin-settings';
import dynamic from 'next/dynamic';
import Image from 'next/image';
const Ticker = dynamic(() => import('@/components/Ticker'));
const Locations = dynamic(() => import('@/components/Locations'));

export default async function Home() {
  const settings = await getSystemSettings();

  return (
    <main className="bg-black">
      <Hero settings={settings} />
      <StoreScrollAnimation />
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
      <div className="relative overflow-x-clip">
        <Image
          src={
            'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858dd800031050c867/view?project=698585dc0014c943f45e&mode=admin'
          }
          width={1920}
          height={1080}
          alt="Circular Zebra Ring"
          className="hidden lg:block absolute top-[-40px] right-0 translate-x-[40%] w-[900px] opacity-50 pointer-events-none select-none"
        />
      </div>
      <Why />
      <div className="relative w-3/4 mx-auto border-t border-white/25 my-3"></div>
      <BrandCounter />
      <Ticker />
      <Locations />
      <div className="flex justify-center">
        <Image
          src={
            'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858ddf00289ed5e78a/view?project=698585dc0014c943f45e&mode=admin'
          }
          width={1920}
          height={1080}
          className="absolute w-150 translate-y-[-20%] ml-10 opacity-30"
          alt="Zebra"
        />
      </div>
      <OurPromise />
    </main>
  );
}
