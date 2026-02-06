"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { m } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";
import LazyVideo from "@/components/LazyVideo";

export default function Locations() {
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <m.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
            {/* Slide 1 */}
            <SwiperSlide>
              <m.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-black">
                  <LazyVideo
                    src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858ed90020b5b5266f/view?project=698585dc0014c943f45e&mode=admin"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Awfis, Ambience Mall - Gurugram</span>
                  </div>
                  <p className="mt-2 text-sm text-[#353535]/70">
                    Discover top brands and try them before you buy inside
                    Ambience Mall.
                  </p>
                </div>
              </m.div>
            </SwiperSlide>

            {/* Slide 2 */}
            <SwiperSlide>
              <m.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-black">
                  <LazyVideo
                    src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698593b4000346adc43d/view?project=698585dc0014c943f45e&mode=admin"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Smartworks - Gurugram</span>
                  </div>
                  <p className="mt-2 text-sm text-[#353535]/70">
                    Experience ZenZebra at the heart of Gurugram’s professional
                    spaces.
                  </p>
                </div>
              </m.div>
            </SwiperSlide>

            {/* Slide 3 */}
            <SwiperSlide>
              <m.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-black">
                  <LazyVideo
                    src="https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69859035002d1561907e/view?project=698585dc0014c943f45e&mode=admin"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>The Lodhi - New Delhi</span>
                  </div>
                  <p className="mt-2 text-sm text-[#353535]/70">
                    A luxurious experience meets better living - right where you
                    unwind.
                  </p>
                </div>
              </m.div>
            </SwiperSlide>

            {/* coming soon card */}
            <SwiperSlide>
              <m.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="rounded-xl bg-white text-[#353535] shadow-xl overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-black">
                  <Image src={'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698593a40025156f230b/view?project=698585dc0014c943f45e&mode=admin'} alt="coming soon" width={600} height={800} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[#CC2224] font-semibold text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>More locations loading...</span>
                  </div>
                  <p className="mt-2 text-sm text-[#353535]/70">
                    <br/>
                    <br/>
                  </p>
                </div>
              </m.div>
            </SwiperSlide>

          </Swiper>
        </div>
      </div>
    </section>
  );
}
