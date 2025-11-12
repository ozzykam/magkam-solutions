import React from 'react';
import { FulfillmentType } from '@/types/order';

interface FulfillmentTypeSelectorProps {
  selected: FulfillmentType;
  onSelect: (type: FulfillmentType) => void;
}

const FulfillmentTypeSelector: React.FC<FulfillmentTypeSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Fulfillment Method</h3>
      <p className="text-sm text-gray-600">Choose how you&apos;d like to receive your order</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Delivery Option */}
        <button
          onClick={() => onSelect(FulfillmentType.DELIVERY)}
          className={`
            relative p-6 border-2 rounded-lg text-left transition-all
            ${
              selected === FulfillmentType.DELIVERY
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              ${selected === FulfillmentType.DELIVERY ? 'bg-primary-100' : 'bg-gray-100'}
            `}>
              <svg className={`w-6 h-6 ${selected === FulfillmentType.DELIVERY ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Delivery</h4>
              <p className="text-sm text-gray-600 mt-1">
                Get your order delivered to your doorstep
              </p>
              <p className="text-sm text-primary-600 font-medium mt-2">
                Free delivery on orders over $50
              </p>
            </div>
          </div>

          {selected === FulfillmentType.DELIVERY && (
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* Pickup Option */}
        <button
          onClick={() => onSelect(FulfillmentType.PICKUP)}
          className={`
            relative p-6 border-2 rounded-lg text-left transition-all
            ${
              selected === FulfillmentType.PICKUP
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              ${selected === FulfillmentType.PICKUP ? 'bg-primary-100' : 'bg-gray-100'}
            `}>
              <svg className={`w-6 h-6 ${selected === FulfillmentType.PICKUP ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Pickup</h4>
              <p className="text-sm text-gray-600 mt-1">
                Pick up your order from our store
              </p>
              <p className="text-sm text-green-600 font-medium mt-2">
                • No delivery fee 
                <br />
                • Choose your pickup time up to 7 days in advance
              </p>
            </div>
          </div>

          {selected === FulfillmentType.PICKUP && (
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default FulfillmentTypeSelector;
