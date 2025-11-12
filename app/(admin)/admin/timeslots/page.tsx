'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TimeSlot, formatTimeSlot, formatSlotDate, getCapacityPercentage } from '@/types/business-info';
import { bulkCreateTimeSlots, getTimeSlotsForDate, getOrCreateTimeSlot } from '@/services/business-info-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Set default to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const loadTimeSlots = useCallback(async () => {
    if (!selectedDate) return;
    try {
      setLoading(true);
      const slots = await getTimeSlotsForDate(selectedDate);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  const handleGenerateSlots = async () => {
    if (!confirm('Generate time slots for the next 7 days? This will create slots if they don\'t exist.')) {
      return;
    }

    try {
      setGenerating(true);
      const today = new Date();
      const dates: string[] = [];

      // Generate array of dates for next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      await bulkCreateTimeSlots(dates);
      await loadTimeSlots();
      alert('Time slots generated successfully!');
    } catch (error) {
      console.error('Error generating time slots:', error instanceof Error ? error.message : error);
      alert('Failed to generate time slots');
    } finally {
      setGenerating(false);
    }
  };

  const updateSlotAvailability = async (slotId: string, isAvailable: boolean) => {
    try {
      // Find the slot to get its date and startTime
      const slot = timeSlots.find(s => s.id === slotId);
      if (!slot) {
        console.error('Slot not found in state');
        return;
      }

      // Ensure the slot exists in Firestore (create if it doesn't)
      await getOrCreateTimeSlot(slot.date, slot.startTime);

      // Now update the availability
      await updateDoc(doc(db, 'timeSlots', slotId), {
        isAvailable,
        updatedAt: new Date(),
      });

      setTimeSlots(timeSlots.map(s =>
        s.id === slotId ? { ...s, isAvailable } : s
      ));
    } catch (error) {
      console.error('Error updating slot:', error instanceof Error ? error.message : error);
      alert('Failed to update slot availability');
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Slots</h1>
          <p className="text-gray-600 mt-1">Manage delivery and pickup time slots</p>
        </div>
        <Button
          variant="primary"
          onClick={handleGenerateSlots}
          loading={generating}
        >
          Generate Slots (7 days)
        </Button>
      </div>

      {/* Date Selector */}
      <Card>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {getAvailableDates().map(date => {
              const dateObj = new Date(date + 'T12:00:00'); // Noon to avoid timezone issues
              return (
                <option key={date} value={date}>
                  {formatSlotDate(date)} - {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>
      </Card>

      {/* Time Slots */}
      {timeSlots.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No time slots found for this date</p>
            <Button variant="primary" onClick={handleGenerateSlots} loading={generating}>
              Generate Time Slots
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timeSlots.map(slot => {
            const capacityPercent = getCapacityPercentage(slot);
            const ordersRemaining = slot.maxOrders - slot.currentOrders;
            const itemsRemaining = slot.maxItems - slot.currentItems;

            return (
              <Card key={slot.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTimeSlot(slot.startTime, slot.endTime)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatSlotDate(slot.date)}
                      </p>
                    </div>
                    <Badge variant={slot.isAvailable ? 'success' : 'warning'} size="sm">
                      {slot.isAvailable ? 'Available' : 'Closed'}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Orders</span>
                        <span className="font-medium text-gray-900">
                          {slot.currentOrders} / {slot.maxOrders}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            slot.currentOrders >= slot.maxOrders
                              ? 'bg-red-500'
                              : slot.currentOrders >= slot.maxOrders * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(slot.currentOrders / slot.maxOrders) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ordersRemaining} slots remaining</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Items</span>
                        <span className="font-medium text-gray-900">
                          {slot.currentItems} / {slot.maxItems}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            slot.currentItems >= slot.maxItems
                              ? 'bg-red-500'
                              : slot.currentItems >= slot.maxItems * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(slot.currentItems / slot.maxItems) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{itemsRemaining} items remaining</p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <Badge
                          variant={
                            capacityPercent >= 100
                              ? 'sale'
                              : capacityPercent >= 80
                              ? 'warning'
                              : capacityPercent >= 50
                              ? 'featured'
                              : 'success'
                          }
                          size="sm"
                        >
                          {Math.round(capacityPercent)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {slot.isAvailable ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSlotAvailability(slot.id, false)}
                        className="flex-1"
                      >
                        Close Slot
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateSlotAvailability(slot.id, true)}
                        className="flex-1"
                      >
                        Open Slot
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
