import React, { useState, useEffect, useCallback } from 'react';
import { TimeSlot, formatTimeSlot, formatSlotDate, getCapacityPercentage } from '@/types/business-info';
import { getAvailableTimeSlots, getStoreSettings } from '@/services/business-info-service';
import Badge from '@/components/ui/Badge';

interface TimeSlotSelectorProps {
  selectedSlot?: { date: string; startTime: string };
  onSelect: (date: string, startTime: string) => void;
  itemCount: number;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedSlot,
  onSelect,
  itemCount,
}) => {
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate slot is still available before selecting
  const handleSlotSelect = (date: string, startTime: string) => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, hours, minutes);

    console.log('Now:', now);
    console.log('One hour from now:', oneHourFromNow);
    console.log('Slot date/time:', slotDateTime);
    console.log('Slot is after buffer?', slotDateTime.getTime() > oneHourFromNow.getTime());

    if (slotDateTime.getTime() <= oneHourFromNow.getTime()) {
      console.error('Cannot select slot - less than 1 hour from now or in the past');
      alert('This time slot is too soon or has passed. Please select a slot at least 1 hour from now.');
      return;
    }

    onSelect(date, startTime);
  };

  // Filter slots that are valid (at least 1 hour from now)
  const filterValidSlots = useCallback((slots: TimeSlot[]): TimeSlot[] => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour

    return slots.filter(slot => {
      // Parse the slot date and time properly
      const [year, month, day] = slot.date.split('-').map(Number);
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hours, minutes);

      const hasCapacity = (slot.maxItems - slot.currentItems) >= itemCount;
      const isAfterBuffer = slotDateTime.getTime() > oneHourFromNow.getTime();

      // Debug logging
      if (!isAfterBuffer) {
        console.log(`Filtering out slot: ${slot.date} ${slot.startTime} (too soon)`);
      }

      return isAfterBuffer && hasCapacity;
    });
  }, [itemCount]);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get store settings for advance booking days
        const settings = await getStoreSettings();

        // Get available slots for the next N days
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + settings.advanceBookingDays);

        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const availableSlots = await getAvailableTimeSlots(startDateStr, endDateStr);

        // Filter valid slots (1 hour buffer + enough capacity)
        const validSlots = filterValidSlots(availableSlots);

        setAllSlots(validSlots);

        // Auto-select the first available date if no date is selected
        if (validSlots.length > 0 && !selectedDate) {
          const firstDate = validSlots[0].date;
          setSelectedDate(firstDate);
        }
      } catch (err) {
        console.error('Error loading time slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, [itemCount, filterValidSlots, selectedDate]);

  // Group slots by date
  const slotsByDate = allSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const availableDates = Object.keys(slotsByDate).sort();
  const slotsForSelectedDate = selectedDate ? slotsByDate[selectedDate] || [] : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading available time slots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (allSlots.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">No available time slots</p>
              <p>All time slots are currently full. Please try again later or reduce your order size.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose when you&apos;d like to receive your order (at least 1 hour in advance)
        </p>
      </div>

      {/* Date Selector Dropdown */}
      <div>
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <select
          id="date-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {availableDates.map(date => (
            <option key={date} value={date}>
              {formatSlotDate(date)}
            </option>
          ))}
        </select>
      </div>

      {/* Time Slots for Selected Date */}
      {slotsForSelectedDate.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Time Slots
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slotsForSelectedDate.map(slot => {
                const isSelected =
                  selectedSlot?.date === slot.date &&
                  selectedSlot?.startTime === slot.startTime;
                const capacityPercent = getCapacityPercentage(slot);
                const ordersRemaining = slot.maxOrders - slot.currentOrders;

                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot.date, slot.startTime)}
                    className={`
                      relative p-3 border-2 rounded-lg text-left transition-all
                      ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {formatTimeSlot(slot.startTime, slot.endTime)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {ordersRemaining} slots left
                        </p>
                      </div>

                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Capacity indicator */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        {capacityPercent >= 80 ? (
                          <Badge variant="warning" size="sm">Almost Full</Badge>
                        ) : capacityPercent >= 50 ? (
                          <Badge variant="featured" size="sm">Filling Up</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Available</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">No available time slots for this date</p>
        </div>
      )}

      {selectedSlot && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium">Time slot selected</p>
              <p className="mt-1">
                {formatSlotDate(selectedSlot.date)} at {formatTimeSlot(selectedSlot.startTime, selectedSlot.startTime.split(':').map((n, i) => i === 0 ? String(Number(n) + 1).padStart(2, '0') : n).join(':'))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
