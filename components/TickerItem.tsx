'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

type ImgItem = { src: string; alt: string };
type Props = {
  images: ImgItem[];
  to: string;
};

export default function TickerItem({ images, to }: Props) {
  const isReverse = to === '0%';

  return (
    <div className="relative overflow-hidden">
      <div className="flex w-fit">
        {/* Track A */}
        <motion.div
          initial={{ x: isReverse ? '-100%' : '0%' }}
          animate={{ x: isReverse ? '0%' : '-100%' }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="flex items-center mt-10 flex-shrink-0 bg-white"
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
        </motion.div>

        {/* Track B (duplicate for seamless loop) */}
        <motion.div
          initial={{ x: isReverse ? '-100%' : '0%' }}
          animate={{ x: isReverse ? '0%' : '-100%' }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="flex items-center mt-10 flex-shrink-0 bg-white"
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
        </motion.div>
      </div>
    </div>
  );
}
