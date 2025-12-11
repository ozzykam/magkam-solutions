'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <LoadingSpinner size="lg" />
    </div>
  );
}
