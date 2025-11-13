'use client';
import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface LineItem {
  label: string;
  hours: number;
  cost: number;
}

interface CalculatorResultsProps {
  calculatorName: string;
  totalHours: number;
  totalPrice: number;
  lineItems: LineItem[];
  contactName: string;
}

/**
 * CalculatorResults Component
 *
 * Displays the detailed cost breakdown after user submits contact information
 * Shows:
 * - Personalized thank you message
 * - Line-by-line breakdown of selected features with hours and costs
 * - Total hours and final price
 * - Next steps messaging
 */
export default function CalculatorResults({
  calculatorName,
  totalHours,
  totalPrice,
  lineItems,
  contactName,
}: CalculatorResultsProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Message */}
      <Card className="p-8 mb-6 bg-green-50 border-green-200">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">
            Thank You, {contactName}!
          </h2>
          <p className="text-gray-700">
            Your custom estimate is ready. We&apos;ll reach out shortly to discuss your project in detail.
          </p>
        </div>
      </Card>

      {/* Estimate Breakdown */}
      <Card className="p-8">
        <h3 className="text-2xl font-bold mb-6">Your Custom {calculatorName} Estimate</h3>

        {/* Line Items */}
        <div className="space-y-4 mb-6">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-3 border-b border-gray-200"
            >
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{item.hours} hours</div>
              </div>
              <div className="text-lg font-semibold">
                ${item.cost.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-medium">Total Hours:</span>
            <span className="text-xl font-bold">{totalHours} hrs</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">Estimated Total:</span>
            <span className="text-3xl font-bold text-blue-600">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Important Note */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold mb-2">📋 Important Note</h4>
          <p className="text-sm text-gray-700">
            This is an estimated cost based on your selections. Final pricing may vary depending on
            specific project requirements, complexity, and timeline. We&apos;ll provide a detailed proposal
            after our consultation.
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-semibold text-lg mb-3">What Happens Next?</h4>
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <span>We&apos;ll review your project requirements and estimate</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <span>A member of our team will contact you within 1-2 business days</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <span>We&apos;ll schedule a consultation to discuss your project in detail</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <span>You&apos;ll receive a custom proposal with exact pricing and timeline</span>
            </li>
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Have questions? Want to get started right away?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us Directly
          </Link>
        </div>
      </Card>
    </div>
  );
}
