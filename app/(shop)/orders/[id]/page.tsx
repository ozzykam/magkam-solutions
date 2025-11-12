'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OrderDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    router.replace(`/account/orders/${orderId}`);
  }, [router, orderId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
