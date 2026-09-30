import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/** Read-only: never creates settings or enables the feature after a read failure. */
export async function calculatorsEnabled(): Promise<boolean> {
  const settings = await getDoc(doc(db, 'storeSettings', 'main'));
  return settings.data()?.features?.calculators?.enabled === true;
}
