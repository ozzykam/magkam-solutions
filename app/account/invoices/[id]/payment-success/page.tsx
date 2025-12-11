'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Invoice } from '@/types/invoice';
import { getInvoiceById } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (params.id && user?.email) {
      loadInvoice(params.id as string);
    }
  }, [params.id, user]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);

      // Verify the invoice belongs to this user
      if (data?.client.email.toLowerCase() !== user?.email?.toLowerCase()) {
        alert('You do not have permission to view this invoice');
        router.push('/account/invoices');
        return;
      }

      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-12">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="w-20 h-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>

        {invoice && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(invoice.amountPaid)}</p>
              </div>
              {invoice.title && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-900">{invoice.title}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {sessionId && (
          <p className="text-sm text-gray-500 mb-6">
            Transaction ID: {sessionId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/account/invoices/${params.id}`}>
            <Button variant="secondary">
              View Invoice Details
            </Button>
          </Link>
          <Link href="/account/invoices">
            <Button variant="primary">
              Back to All Invoices
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          A confirmation email has been sent to {user?.email}
        </p>
      </Card>
    </div>
  );
}
