'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AddressesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/addresses');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
