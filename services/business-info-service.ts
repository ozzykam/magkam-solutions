import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  TimeSlot,
  TimeSlotCapacity,
  StoreSettings,
  DEFAULT_STORE_SETTINGS,
  generateTimeSlotId,
  isTimeSlotFull,
} from '@/types/business-info';

const TIMESLOTS_COLLECTION = 'timeSlots';
const SETTINGS_COLLECTION = 'storeSettings';
const SETTINGS_DOC_ID = 'main';

/**
 * Get store settings (or create default if doesn't exist)
 */
export const getStoreSettings = async (): Promise<StoreSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as StoreSettings;
    }

    // Create default settings if they don't exist
    const defaultSettings: StoreSettings = {
      id: SETTINGS_DOC_ID,
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error getting store settings:', error);
    throw error;
  }
};

/**
 * Update store settings (admin only)
 */
export const updateStoreSettings = async (
  updates: Partial<Omit<StoreSettings, 'id' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};

/**
 * Generate time slots for a specific date based on store settings
 */
export const generateTimeSlotsForDate = async (date: string): Promise<TimeSlot[]> => {
  try {
    const settings = await getStoreSettings();
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay().toString();

    // Check if date is in blackout dates
    if (settings.blackoutDates.includes(date)) {
      return [];
    }

    // Check if store is closed on this day
    const hours = settings.operatingHours[dayOfWeek];
    if (!hours || hours.closed) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);

    const slotDuration = settings.slotDurationMinutes;
    let currentTime = openHour * 60 + openMinute; // Convert to minutes
    const closeTime = closeHour * 60 + closeMinute;

    while (currentTime + slotDuration <= closeTime) {
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endTime = currentTime + slotDuration;
      const endHour = Math.floor(endTime / 60);
      const endMinute = endTime % 60;

      const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      const slotId = generateTimeSlotId(date, startTimeStr);

      slots.push({
        id: slotId,
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        maxOrders: settings.maxOrdersPerHour,
        maxItems: settings.maxItemsPerHour,
        currentOrders: 0,
        currentItems: 0,
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      currentTime += slotDuration;
    }

    return slots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    throw error;
  }
};

/**
 * Get or create a time slot
 */
export const getOrCreateTimeSlot = async (date: string, startTime: string): Promise<TimeSlot> => {
  try {
    const slotId = generateTimeSlotId(date, startTime);
    const docRef = doc(db, TIMESLOTS_COLLECTION, slotId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TimeSlot;
    }

    // Generate slots for this date and find the matching one
    const slots = await generateTimeSlotsForDate(date);
    const matchingSlot = slots.find(s => s.startTime === startTime);

    if (!matchingSlot) {
      throw new Error('Invalid time slot');
    }

    // Create the slot in Firestore
    await setDoc(docRef, matchingSlot);
    return matchingSlot;
  } catch (error) {
    console.error('Error getting or creating time slot:', error);
    throw error;
  }
};

/**
 * Get available time slots for a date range
 */
export const getAvailableTimeSlots = async (
  startDate: string,
  endDate: string
): Promise<TimeSlot[]> => {
  try {
    const q = query(
      collection(db, TIMESLOTS_COLLECTION),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('isAvailable', '==', true)
    );

    const snapshot = await getDocs(q);
    const existingSlots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimeSlot[];

    // Generate slots for dates that don't have them yet
    const settings = await getStoreSettings();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allSlots: TimeSlot[] = [...existingSlots];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const hasSlots = existingSlots.some(s => s.date === dateStr);

      if (!hasSlots) {
        const generatedSlots = await generateTimeSlotsForDate(dateStr);
        allSlots.push(...generatedSlots);
      }
    }

    // Filter out past slots and full slots
    const now = new Date();
    return allSlots
      .filter(slot => {
        const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
        return slotDateTime > now && !isTimeSlotFull(slot);
      })
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

/**
 * Check capacity for a time slot
 */
export const checkTimeSlotCapacity = async (
  date: string,
  startTime: string,
  itemCount: number
): Promise<TimeSlotCapacity> => {
  try {
    const slot = await getOrCreateTimeSlot(date, startTime);

    const ordersRemaining = slot.maxOrders - slot.currentOrders;
    const itemsRemaining = slot.maxItems - slot.currentItems;
    const isAvailable = ordersRemaining > 0 && itemsRemaining >= itemCount;

    return {
      ordersRemaining,
      itemsRemaining,
      isAvailable,
    };
  } catch (error) {
    console.error('Error checking time slot capacity:', error);
    throw error;
  }
};

/**
 * Reserve a time slot (increment counters)
 * Called when an order is placed
 */
export const reserveTimeSlot = async (
  date: string,
  startTime: string,
  itemCount: number
): Promise<void> => {
  try {
    const slotId = generateTimeSlotId(date, startTime);
    const docRef = doc(db, TIMESLOTS_COLLECTION, slotId);

    // Get or create the slot
    const slot = await getOrCreateTimeSlot(date, startTime);

    // Check if there's capacity
    if (isTimeSlotFull(slot)) {
      throw new Error('Time slot is full');
    }

    if (slot.currentItems + itemCount > slot.maxItems) {
      throw new Error('Not enough item capacity in this time slot');
    }

    // Update counters
    const newOrderCount = slot.currentOrders + 1;
    const newItemCount = slot.currentItems + itemCount;
    const isNowFull = newOrderCount >= slot.maxOrders || newItemCount >= slot.maxItems;

    await updateDoc(docRef, {
      currentOrders: newOrderCount,
      currentItems: newItemCount,
      isAvailable: !isNowFull,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error reserving time slot:', error);
    throw error;
  }
};

/**
 * Release a time slot (decrement counters)
 * Called when an order is cancelled
 */
export const releaseTimeSlot = async (
  date: string,
  startTime: string,
  itemCount: number
): Promise<void> => {
  try {
    const slotId = generateTimeSlotId(date, startTime);
    const docRef = doc(db, TIMESLOTS_COLLECTION, slotId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return; // Slot doesn't exist, nothing to release
    }

    const slot = docSnap.data() as TimeSlot;

    // Update counters
    const newOrderCount = Math.max(0, slot.currentOrders - 1);
    const newItemCount = Math.max(0, slot.currentItems - itemCount);

    await updateDoc(docRef, {
      currentOrders: newOrderCount,
      currentItems: newItemCount,
      isAvailable: true, // Re-enable slot
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error releasing time slot:', error);
    throw error;
  }
};

/**
 * Get all time slots for a specific date (admin)
 */
export const getTimeSlotsForDate = async (date: string): Promise<TimeSlot[]> => {
  try {
    const q = query(
      collection(db, TIMESLOTS_COLLECTION),
      where('date', '==', date)
    );

    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimeSlot[];

    // If no slots exist for this date, generate them
    if (slots.length === 0) {
      return await generateTimeSlotsForDate(date);
    }

    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch (error) {
    console.error('Error getting time slots for date:', error);
    throw error;
  }
};

/**
 * Bulk create time slots for multiple dates (admin utility)
 */
export const bulkCreateTimeSlots = async (dates: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    let operationCount = 0;

    for (const date of dates) {
      const slots = await generateTimeSlotsForDate(date);

      for (const slot of slots) {
        const docRef = doc(db, TIMESLOTS_COLLECTION, slot.id);
        batch.set(docRef, slot);
        operationCount++;

        // Firestore batch limit is 500 operations
        if (operationCount >= 500) {
          await batch.commit();
          operationCount = 0;
        }
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error bulk creating time slots:', error);
    throw error;
  }
};
