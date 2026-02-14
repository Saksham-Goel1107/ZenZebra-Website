'use client';

import LazyVideo from '@/components/LazyVideo';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { m } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

type HomeLocation = {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  active: boolean;
  order: number;
};

export default function Locations() {
  const [locations, setLocations] = useState<HomeLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.homeLocationsCollectionId,
          [Query.equal('active', true), Query.orderAsc('order'), Query.orderDesc('$createdAt')],
        );
        const list: HomeLocation[] = response.documents.map((doc: any) => ({
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          mediaUrl: doc.mediaUrl,
          mediaType: doc.mediaType,
          active: doc.active,
          order: doc.order || 0,
        }));
        setLocations(list);
      } catch (error) {
        console.error('Error fetching home locations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (loading) {
    return (
      <section className="relative py-24 px-6 min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CC2224]/20 border-t-[#CC2224] rounded-full animate-spin" />
      </section>
    );
  }

  // If no locations are found, we can show a placeholder or nothing
  if (locations.length === 0) return null;

  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <m.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center text-4xl sm:text-5xl font-bold text-[#f5f5f5]"
        >
          Spotted in the <span className="text-[#CC2224]">Wild</span>
        </m.h2>

        {/* Carousel */}
        <div className="mt-12">
          <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 }, // ≥ sm
              1024: { slidesPerView: 3, spaceBetween: 28 }, // ≥ lg
            }}
          >
            {locations.map((loc, index) => (
              <SwiperSlide key={loc.id}>
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden h-full flex flex-col"
                >
                  <div className="relative aspect-[3/4] bg-black">
                    {loc.mediaType === 'video' ? (
                      <LazyVideo
                        src={loc.mediaUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={loc.mediaUrl}
                        alt={loc.title}
                        width={600}
                        height={800}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{loc.title}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#353535]/70 line-clamp-3">{loc.description}</p>
                  </div>
                </m.div>
              </SwiperSlide>
            ))}

            {/* coming soon card - only show if few locations */}
            {locations.length < 3 && (
              <SwiperSlide>
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden h-full"
                >
                  <div className="relative aspect-[3/4] bg-black">
                    <Image
                      src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698593a40025156f230b/view?project=698585dc0014c943f45e&mode=admin"
                      alt="coming soon"
                      width={600}
                      height={800}
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>More locations loading...</span>
                    </div>
                    <p className="mt-2 text-sm text-[#353535]/70">
                      Stay tuned as we expand to more spaces near you.
                    </p>
                  </div>
                </m.div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
