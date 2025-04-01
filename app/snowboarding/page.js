'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SnowboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/snowboarding/levels');
  }, [router]);

  return null;
}
