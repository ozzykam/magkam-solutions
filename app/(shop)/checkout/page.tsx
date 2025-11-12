'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FulfillmentTypeSelector from '@/components/checkout/FulfillmentTypeSelector';
import AddressSelector from '@/components/checkout/AddressSelector';
import PickupLocation from '@/components/checkout/PickupLocation';
import OrderReview from '@/components/checkout/OrderReview';
import TimeSlotSelector from '@/components/checkout/TimeSlotSelector';
import PaymentForm from '@/components/checkout/PaymentForm';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastContainer';
import { FulfillmentType, OrderStatus, PaymentStatus, OrderItem } from '@/types/order';
import { Address } from '@/types/user';
import { createOrder } from '@/services/order-service';
import { reserveTimeSlot } from '@/services/business-info-service';
import { getStripe } from '@/lib/stripe/client';
import Textarea from '@/components/ui/Textarea';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { isWithinDeliveryRange, geocodeAddress } from '@/lib/utils/geocoding';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type CheckoutStep = 'fulfillment' | 'details' | 'review' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, isLoading: cartLoading } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('fulfillment');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(FulfillmentType.DELIVERY);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | undefined>();
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; startTime: string } | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPaymentIntent, setLoadingPaymentIntent] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [deliveryValidation, setDeliveryValidation] = useState<{
    isValid: boolean;
    distance?: number;
    maxRadius?: number;
    message?: string;
  } | null>(null);

  // Redirect if cart is empty or not authenticated (only after both have finished loading)
  useEffect(() => {
    // Wait for both auth and cart to finish loading
    if (authLoading || cartLoading) {
      return;
    }

    // Check authentication first
    if (!isAuthenticated) {
      toast?.error('Please sign in to continue with checkout');
      router.push('/login?redirect=/checkout');
      return;
    }

    // Then check cart (but not if payment was just completed)
    if (cart.itemCount === 0 && !paymentCompleted) {
      toast?.error('Your cart is empty');
      router.push('/cart');
    }
  }, [authLoading, cartLoading, isAuthenticated, cart.itemCount, router, toast, paymentCompleted]);

  // Validate delivery address when it changes
  useEffect(() => {
    const validateDeliveryAddress = async () => {
      if (fulfillmentType !== FulfillmentType.DELIVERY || !deliveryAddress) {
        setDeliveryValidation(null);
        return;
      }

      try {
        setIsValidatingAddress(true);
        setDeliveryValidation(null);

        // Get store settings
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        const settings = settingsDoc.data() as StoreSettings | undefined;

        // Check if delivery is enabled
        if (settings?.deliveryEnabled === false) {
          setDeliveryValidation({
            isValid: false,
            message: 'Delivery service is currently unavailable',
          });
          return;
        }

        // Check if store location is configured
        if (!settings?.storeLocation) {
          setDeliveryValidation({
            isValid: true, // Allow checkout to continue even if not configured
            message: 'Unable to verify delivery range (store location not configured)',
          });
          return;
        }

        // Check if delivery radius is configured
        if (!settings?.deliveryRadius) {
          setDeliveryValidation({
            isValid: true, // Allow checkout to continue
            message: 'Delivery radius not configured',
          });
          return;
        }

        // Check if address has coordinates
        let addressCoords = deliveryAddress.coordinates;

        // If coordinates don't exist, try to geocode the address
        if (!addressCoords) {
          const coords = await geocodeAddress(deliveryAddress);
          if (coords) {
            addressCoords = coords;
          }
        }

        // If we still don't have coordinates, allow checkout but warn
        if (!addressCoords) {
          setDeliveryValidation({
            isValid: true, // Allow checkout to continue
            message: 'Unable to verify delivery range (address could not be geocoded)',
          });
          return;
        }

        // Calculate distance and check if within range
        const validation = isWithinDeliveryRange(
          addressCoords,
          settings.storeLocation,
          settings.deliveryRadius
        );

        if (validation.isInRange) {
          setDeliveryValidation({
            isValid: true,
            distance: validation.distance,
            maxRadius: settings.deliveryRadius,
            message: `✓ Address is within delivery range (${validation.distance} miles from store)`,
          });
        } else {
          setDeliveryValidation({
            isValid: false,
            distance: validation.distance,
            maxRadius: settings.deliveryRadius,
            message: `Address is outside delivery range. Maximum delivery distance is ${settings.deliveryRadius} miles. This address is ${validation.distance} miles from store.`,
          });
        }
      } catch (error) {
        console.error('Error validating delivery address:', error);
        setDeliveryValidation({
          isValid: true, // Allow checkout to continue on error
          message: 'Unable to verify delivery range',
        });
      } finally {
        setIsValidatingAddress(false);
      }
    };

    validateDeliveryAddress();
  }, [deliveryAddress, fulfillmentType]);

  const TAX_RATE = 0.08; // 8%
  const deliveryFee = fulfillmentType === FulfillmentType.DELIVERY && cart.subtotal < 50 ? 5.99 : 0;
  const tax = Math.round(cart.subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((cart.subtotal + deliveryFee + tax) * 100) / 100;

  const handleNextStep = () => {
    if (currentStep === 'fulfillment') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (fulfillmentType === FulfillmentType.DELIVERY && !deliveryAddress) {
        toast?.error('Please enter your delivery address');
        return;
      }
      if (fulfillmentType === FulfillmentType.DELIVERY && deliveryValidation && !deliveryValidation.isValid) {
        toast?.error('Delivery address is outside our delivery range');
        return;
      }
      if (!selectedTimeSlot) {
        toast?.error('Please select a time slot for your order');
        return;
      }
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      handleProceedToPayment();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('fulfillment');
    } else if (currentStep === 'review') {
      setCurrentStep('details');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      toast?.error('Please sign in to place an order');
      return;
    }

    setIsProcessing(true);
    setLoadingPaymentIntent(true);

    try {
      // Reserve time slot first
      if (selectedTimeSlot) {
        await reserveTimeSlot(
          selectedTimeSlot.date,
          selectedTimeSlot.startTime,
          cart.itemCount
        );
      }

      // Calculate end time (assuming 1-hour slots, this should match the slot from selector)
      const endTime = selectedTimeSlot ? (() => {
        const [hours, minutes] = selectedTimeSlot.startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      })() : undefined;

      // Create order in pending payment status - build clean object without undefined values
      const orderData: Record<string, unknown> = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        items: cart.items.map(item => {
          const orderItem: Partial<OrderItem> = {
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productImage: item.image,
            vendorId: item.vendorId,
            vendorName: item.vendorName,
            price: item.salePrice ?? item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          };

          // Only add optional fields if they have values
          if (item.productSku) orderItem.productSku = item.productSku;
          if (item.unit) orderItem.unit = item.unit;

          return orderItem as OrderItem;
        }),
        subtotal: cart.subtotal,
        tax,
        deliveryFee,
        discount: 0,
        total,
        fulfillmentType,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };

      // Only add optional fields if they have values
      if (fulfillmentType === FulfillmentType.DELIVERY && deliveryAddress) {
        orderData.deliveryAddress = deliveryAddress;
      }
      if (fulfillmentType === FulfillmentType.PICKUP) {
        orderData.pickupLocation = 'Local Market - Main Store';
      }
      if (customerNotes) {
        orderData.customerNotes = customerNotes;
      }
      if (selectedTimeSlot?.date) {
        orderData.timeSlotDate = selectedTimeSlot.date;
      }
      if (selectedTimeSlot?.startTime) {
        orderData.timeSlotStartTime = selectedTimeSlot.startTime;
      }
      if (endTime) {
        orderData.timeSlotEndTime = endTime;
      }

      const order = await createOrder(orderData as Parameters<typeof createOrder>[0]);

      setCreatedOrderId(order.id);

      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(total * 100), // Convert to cents
          orderId: order.id,
          customerEmail: user.email,
          customerName: user.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);

      // Move to payment step
      setCurrentStep('payment');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast?.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
      setLoadingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Set flag to prevent "cart is empty" toast
      setPaymentCompleted(true);

      // Clear cart
      await clearCart();

      // Redirect to confirmation page
      toast?.success('Payment successful! Order confirmed.');
      router.push(`/account/orders/${createdOrderId}/confirmation`);
    } catch (error) {
      console.error('Error after payment:', error);
      router.push(`/account/orders/${createdOrderId}/confirmation`);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // User stays on payment page to retry
  };

  const getStepNumber = (step: CheckoutStep): number => {
    const steps: CheckoutStep[] = ['fulfillment', 'details', 'review', 'payment'];
    return steps.indexOf(step) + 1;
  };

  const isStepComplete = (step: CheckoutStep): boolean => {
    const currentStepNumber = getStepNumber(currentStep);
    const stepNumber = getStepNumber(step);
    return stepNumber < currentStepNumber;
  };

  // Show nothing while loading to prevent flash of content before redirect
  if (authLoading || cartLoading) {
    return null;
  }

  if (!isAuthenticated || cart.itemCount === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your order</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep === 'fulfillment' ? 'bg-primary-600 text-white' : isStepComplete('fulfillment') ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isStepComplete('fulfillment') ? '✓' : '1'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === 'fulfillment' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Fulfillment
                </span>
              </div>

              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-full ${isStepComplete('details') ? 'bg-green-600' : ''}`} />
              </div>

              {/* Step 2 */}
              <div className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep === 'details' ? 'bg-primary-600 text-white' : isStepComplete('details') ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isStepComplete('details') ? '✓' : '2'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === 'details' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Details
                </span>
              </div>

              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-full ${isStepComplete('review') ? 'bg-green-600' : ''}`} />
              </div>

              {/* Step 3 */}
              <div className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep === 'review' ? 'bg-primary-600 text-white' : isStepComplete('review') ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isStepComplete('review') ? '✓' : '3'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === 'review' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Review
                </span>
              </div>

              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-full ${isStepComplete('payment') ? 'bg-green-600' : ''}`} />
              </div>

              {/* Step 4 */}
              <div className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep === 'payment' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  4
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === 'payment' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Payment
                </span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            {currentStep === 'fulfillment' && (
              <FulfillmentTypeSelector
                selected={fulfillmentType}
                onSelect={setFulfillmentType}
              />
            )}

            {currentStep === 'details' && (
              <div className="space-y-6">
                {fulfillmentType === FulfillmentType.DELIVERY ? (
                  <>
                    <AddressSelector
                      selectedAddress={deliveryAddress}
                      onAddressSelect={setDeliveryAddress}
                    />

                    {/* Delivery validation indicator */}
                    {isValidatingAddress && (
                      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-blue-800">Verifying delivery range...</span>
                      </div>
                    )}

                    {!isValidatingAddress && deliveryValidation && (
                      <div className={`flex items-start gap-3 p-4 border rounded-lg ${
                        deliveryValidation.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        {deliveryValidation.isValid ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            deliveryValidation.isValid ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {deliveryValidation.message}
                          </p>
                          {!deliveryValidation.isValid && (
                            <p className="text-xs text-red-600 mt-1">
                              Please select a different address or contact the store for assistance.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <PickupLocation />
                )}

                <div className="pt-6 border-t border-gray-200">
                  <TimeSlotSelector
                    selectedSlot={selectedTimeSlot}
                    onSelect={(date, startTime) => setSelectedTimeSlot({ date, startTime })}
                    itemCount={cart.itemCount}
                  />
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <Textarea
                    label="Order Notes (Optional)"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Add any special instructions for your order..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <OrderReview
                items={cart.items}
                subtotal={cart.subtotal}
                fulfillmentType={fulfillmentType}
                deliveryAddress={deliveryAddress}
                deliveryFee={deliveryFee}
                tax={tax}
                total={total}
                timeSlot={selectedTimeSlot ? {
                  date: selectedTimeSlot.date,
                  startTime: selectedTimeSlot.startTime,
                  endTime: (() => {
                    const [hours, minutes] = selectedTimeSlot.startTime.split(':').map(Number);
                    const endHours = (hours + 1) % 24;
                    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                  })()
                } : undefined}
              />
            )}

            {currentStep === 'payment' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>

                {loadingPaymentIntent ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : clientSecret && createdOrderId ? (
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#16a34a',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      orderId={createdOrderId}
                      amount={Math.round(total * 100)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-600">Failed to load payment form. Please try again.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {currentStep !== 'payment' && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 'fulfillment' || isProcessing}
              >
                Back
              </Button>

              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={isProcessing}
                loading={isProcessing}
              >
                {currentStep === 'review' ? 'Proceed to Payment' : 'Continue'}
              </Button>
            </div>
          )}

          {currentStep === 'payment' && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={isProcessing}
              >
                Back to Review
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
