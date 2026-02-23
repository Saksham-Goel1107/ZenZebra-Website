'use client';
import { SystemSettings } from '@/lib/admin-settings';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/16/solid';
import { m } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import MenuItem from './MenuItem';

function Navbar({ settings }: { settings: SystemSettings }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHidden, setIsHidden] = useState(false); // Initialize to false, as logic is now in useEffect

  const navItems = [
    { label: 'Brands', href: '/brands' },
    { label: 'Partners', href: '/partners' },
    { label: 'Products', href: '/products' },
    { label: 'Zen at home', href: '/zen-at-home' },
    { label: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      setIsAtTop(currentY < 10);

      if (pathname === '/') {
        // Show at the very top, hide during tour, show again after tour (3.8vh)
        const tourEnd = window.innerHeight * 3.8;
        if (currentY <= 10) {
          setIsHidden(false);
        } else if (currentY > 10 && currentY < tourEnd) {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      } else {
        setIsHidden(currentY > lastY && currentY > 80);
      }

      lastY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  if (pathname?.startsWith('/admin-login')) return null;

  return (
    <m.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isHidden ? -100 : 0, opacity: isHidden ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'circOut' }}
      className={`fixed w-full top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
      ${isAtTop ? 'bg-transparent backdrop-blur-none border-transparent' : 'bg-[#1c1c1c]/60 backdrop-blur-3xl border-b border-white/10'}
      text-white/70`}
    >
      <div className="max-w-full px-6 py-3 ">
        <div className="flex justify-between items-center">
          <div className="flex items-center md:gap-3">
            <m.div whileHover={{ scale: 1.1 }} transition={{ duration: 1.05, ease: 'easeOut' }}>
              <Link href={'/'} aria-label={`${settings?.siteName || 'ZenZebra'} Home`}>
                <Image
                  src={
                    settings?.logoUrl ||
                    'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985926d0013323cc0ca/view?project=698585dc0014c943f45e&mode=admin'
                  }
                  width={175}
                  height={175}
                  alt={`${settings?.siteName || 'ZenZebra'} Logo`}
                  priority
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
            </m.div>
          </div>

          <div className="hidden md:flex">
            {navItems.map((item, i) => (
              <MenuItem key={item.label} index={i} href={item.href}>
                {item.label}
              </MenuItem>
            ))}
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className=" md:hidden bg-white/5 hover:bg-blue-100/10 p-2 rounded-lg transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-white/80" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-white/80" />
            )}
          </button>
        </div>
        {isMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-transparent/80 backdrop-blur-2xl md:hidden mt-4 pb-4  space-y-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-white/80 hover:text-blue-100
                rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </m.div>
        )}
      </div>
    </m.nav>
  );
}

export default Navbar;
