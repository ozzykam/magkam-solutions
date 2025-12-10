import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCalculators } from '@/services/calculator-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'Calculators',
  description: 'Use our free calculators to estimate project costs and timelines',
};

export default async function CalculatorsPage() {
  const calculators = await getCalculators(); // Only get active calculators

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cost Calculatorss
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant estimates for your project. Our calculators help you understand pricing and plan your budget.
            </p>
          </div>

          {/* Calculators Grid */}
          {calculators.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Calculators Available
              </h3>
              <p className="text-gray-600">
                Check back soon for cost estimation tools.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calculators.map((calculator) => (
                <Card key={calculator.id} className="flex flex-col h-full">
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Calculator Icon */}
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Calculator Name */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {calculator.name}
                    </h2>

                    {/* Description */}
                    {calculator.description && (
                      <p className="text-gray-600 mb-4 flex-grow">
                        {calculator.description}
                      </p>
                    )}

                    {/* Header Copy */}
                    {calculator.headerCopy && (
                      <p className="text-sm text-gray-500 mb-4 flex-grow italic">
                        {calculator.headerCopy}
                      </p>
                    )}

                    {/* Rate Info */}
                    <div className="text-sm text-gray-500 mb-6">
                      Default Rate: <span className="font-semibold text-gray-700">${calculator.defaultHourlyRate}/hr</span>
                    </div>

                    {/* Action Button */}
                    <Link href={`/calculators/${calculator.slug}`} className="mt-auto">
                      <Button variant="primary" fullWidth>
                        Use Calculator
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {calculators.length > 0 && (
            <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Need a Custom Quote?
              </h3>
              <p className="text-gray-600 mb-6">
                Our calculators provide estimates. For a detailed quote tailored to your specific needs, get in touch with us.
              </p>
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
