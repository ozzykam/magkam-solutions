'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/orders');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
