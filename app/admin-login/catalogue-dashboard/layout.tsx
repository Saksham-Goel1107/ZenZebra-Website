'use client';

import { auth } from '@/firebase'; // import from firebase module
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace('/admin-login');
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
