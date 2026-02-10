'use client';

import { m } from 'framer-motion';
import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin-login')) return null;

  return (
    <footer className="bg-black text-white py-16 px-6">
      <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-white/60"></div>
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
        {/* 1 — Brand & Tagline */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <Link href="/">
            <Image
              alt="ZenZebra Logo"
              src={
                'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698592c00021ba481e19/view?project=698585dc0014c943f45e&mode=admin'
              }
              height={175}
              width={175}
              sizes="(max-width: 768px) 150px, 175px"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
          <p className="mt-3 text-white/70 text-sm leading-relaxed">
            A lifestyle store for finer things in life - right where you are. Try it first, own it
            after.
          </p>
        </m.div>

        {/* 2 — Quick Links */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#CC2224] mb-3">Explore</h3>
          <ul className="space-y-2 text-white/80 text-sm">
            <li>
              <Link href="/brands" scroll>
                Integrate your brand with us
              </Link>
            </li>
            <li>
              <Link href="/partners" scroll>
                Become our channel partner
              </Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </m.div>

        {/* 3 — Contact & Socials */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#CC2224] mb-3">Get in touch</h3>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#CC2224]" />
              <span>
                {' '}
                <a href="mailto:tanmay@zenzebra.in" target="_blank" rel="noopener noreferrer">
                  tanmay@zenzebra.in
                </a>{' '}
                |{' '}
                <a href="mailto:gurpreet@zenzebra.in" target="_blank" rel="noopener noreferrer">
                  gurpreet@zenzebra.in
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#CC2224]" />
              <span>
                {' '}
                <a href="tel:+919910605187" target="_blank" rel="noopener noreferrer">
                  +91 9910605187
                </a>{' '}
                |{' '}
                <a href="tel:+919958680856" target="_blank" rel="noopener noreferrer">
                  +91 9958680856
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#CC2224]" />
              <a
                href="https://maps.app.goo.gl/sBqk1sKcHpURgwW37"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Delhi, India</span>
              </a>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <a
              href="https://www.instagram.com/zenzebraindia/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit ZenZebra Instagram"
            >
              <Instagram
                className="h-5 w-5 text-white hover:text-[#CC2224] transition-colors"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://www.linkedin.com/company/zenzebraindia/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit ZenZebra LinkedIn"
            >
              <Linkedin
                className="h-5 w-5 text-white hover:text-[#CC2224] transition-colors"
                aria-hidden="true"
              />
            </a>
          </div>
        </m.div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 border-t text-center border-white/10 mt-12 pt-6 text-white/80 text-[14px]">
        <div className="flex flex-col">
          <span>Registered Name</span>
          <span>Bohemian Curations Pvt Ltd</span>
        </div>
        <div className="flex flex-col">
          <span>CIN</span>
          <span>U46411DL2023PTC424632</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} ZenZebra. All rights reserved.
      </div>
    </footer>
  );
}
