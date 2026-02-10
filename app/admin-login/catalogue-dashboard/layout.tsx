'use client';

import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        setReady(true);
      } catch (error) {
        router.replace('/admin-login');
      }
    };
    checkAuth();
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
