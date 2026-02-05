"use client";
import Image from "next/image";

type ImgItem = { src: string; alt: string };
type Props = {
  images: ImgItem[];
  to: string;
};

export default function TickerItem({ images, to }: Props) {
  const isReverse = to === "0%";

  return (
    <div className="relative overflow-hidden">
      <div className="flex w-fit">
        {/* Track A */}
        <div
          className={`flex items-center mt-10 flex-shrink-0 bg-white will-change-transform ${
            isReverse ? "animate-ticker-reverse" : "animate-ticker"
          }`}
        >
          {images.map((item, i) => (
            <Image
              key={`a-${i}`}
              src={item.src}
              alt={item.alt}
              width={175}
              height={175}
              className="h-20 w-auto pr-20 py-1 object-contain"
              loading="lazy"
            />
          ))}
        </div>

        {/* Track B (duplicate for seamless loop) */}
        <div
          className={`flex items-center mt-10 flex-shrink-0 bg-white will-change-transform ${
            isReverse ? "animate-ticker-reverse" : "animate-ticker"
          }`}
          aria-hidden="true"
        >
          {images.map((item, i) => (
            <Image
              key={`b-${i}`}
              src={item.src}
              alt={item.alt}
              width={175}
              height={175}
              className="h-20 w-auto pr-20 py-1 object-contain"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
