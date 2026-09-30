'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCalculatorById } from '@/services/calculator-service';
import type { Calculator } from '@/types/calculator';
import ServiceCalculator from '@/components/calculators/ServiceCalculator';
import { LoadingSpinner } from '@/components/ui';

export default function CalculatorPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [calculator, setCalculator] = useState<Calculator | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getCalculatorById(id).then(setCalculator).finally(() => setLoading(false));
  }, [id]);
  return <div className="space-y-6">
    <Link href={`/admin/calculators/${id}/edit`} className="text-primary-600">Back to editor</Link>
    <p className="rounded-lg bg-amber-50 p-4 text-amber-900">Admin preview. This works while the feature is disabled and does not save leads or send messages.</p>
    {loading ? <LoadingSpinner /> : calculator ? <ServiceCalculator key={calculator.id} calculator={calculator} preview /> : <p>Calculator could not be loaded.</p>}
  </div>;
}
