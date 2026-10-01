'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllSubmissions, updateSubmissionStatus } from '@/services/calculator-service';
import type { CalculatorSubmission } from '@/types/calculator';
import { Card, LoadingSpinner } from '@/components/ui';

export default function CalculatorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<CalculatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    getAllSubmissions().then(setSubmissions).catch(() => setError('Could not load calculator leads. Please reload to try again.')).finally(() => setLoading(false));
  }, []);
  async function changeStatus(id: string, status: CalculatorSubmission['status']) {
    setSaving(id); setError('');
    try {
      await updateSubmissionStatus(id, status);
      setSubmissions(previous => previous.map(item => item.id === id ? { ...item, status } : item));
    } catch { setError('Could not update this lead. Please try again.'); }
    finally { setSaving(null); }
  }
  return <div className="space-y-6">
    <Link href="/admin/calculators" className="text-primary-600">Back to calculators</Link>
    <h1 className="text-3xl font-bold">Calculator leads</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <LoadingSpinner /> : submissions.length === 0 ? <p>No calculator leads yet.</p> : submissions.map(submission => <Card key={submission.id} className="p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div><h2 className="font-semibold text-lg">{submission.contactInfo?.name || 'Anonymous'} · {submission.calculatorName}</h2><p>{submission.contactInfo?.email}</p><p className="text-sm text-gray-500">{submission.submittedAt?.toDate().toLocaleString()}</p></div>
        <label className="text-sm">Lead status<select className="block mt-1 border rounded p-2" value={submission.status} disabled={saving === submission.id} onChange={e => changeStatus(submission.id, e.target.value as CalculatorSubmission['status'])}>{(['pending', 'contacted', 'converted', 'archived'] as const).map(status => <option key={status} value={status}>{status}</option>)}</select></label>
      </div>
      <p className="mt-4 font-semibold">${submission.totalPrice.toLocaleString()} · {submission.totalHours} hours</p>
      {submission.packageNames?.length ? <p className="mt-2 text-sm">Package: {submission.packageNames.join(' + ')}</p> : null}
      {submission.basePrice !== undefined && <p className="text-sm">Base estimate: ${submission.basePrice.toLocaleString()} · Additions: ${(submission.additionsPrice ?? 0).toLocaleString()}</p>}
      {submission.packageServices?.length ? <p className="mt-2 text-sm">Included services: {submission.packageServices.join(', ')}</p> : null}
      {submission.pageSummaries && <div className="mt-3 text-sm"><h3 className="font-semibold">Requested pages</h3>{Object.entries(submission.pageSummaries).map(([id, summary]) => <p key={id} className="mt-1">{summary}</p>)}</div>}
      {submission.lineItems && <ul className="mt-3 text-sm space-y-1">{submission.lineItems.map((item, index) => <li key={index}>{item.label}: ${item.cost.toLocaleString()}</li>)}</ul>}
      <Link className="inline-block mt-4 text-primary-600" href="/admin/messages">Open messages</Link>
    </Card>)}
  </div>;
}
