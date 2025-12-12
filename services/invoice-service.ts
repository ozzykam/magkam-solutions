import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Proposal,
  Invoice,
  ProposalStatus,
  InvoiceStatus,
  LineItem,
  PaymentInfo,
  calculateSubtotal,
  calculateTaxAmount,
  calculateDiscountAmount,
  calculateTotal,
  generateProposalNumber,
  generateInvoiceNumber,
} from '@/types/invoice';

const PROPOSALS_COLLECTION = 'proposals';
const INVOICES_COLLECTION = 'invoices';
const COUNTERS_COLLECTION = 'counters';

// ============================================================================
// PROPOSALS
// ============================================================================

/**
 * Get all proposals
 */
export const getProposals = async (filters?: {
  status?: ProposalStatus;
  clientEmail?: string;
}): Promise<Proposal[]> => {
  try {
    let q;

    // Build query with filters
    if (filters?.clientEmail && filters?.status) {
      // Both email and status filters
      q = query(
        collection(db, PROPOSALS_COLLECTION),
        where('client.email', '==', filters.clientEmail),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    } else if (filters?.clientEmail) {
      // Email filter only
      q = query(
        collection(db, PROPOSALS_COLLECTION),
        where('client.email', '==', filters.clientEmail),
        orderBy('createdAt', 'desc')
      );
    } else if (filters?.status) {
      // Status filter only
      q = query(
        collection(db, PROPOSALS_COLLECTION),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    } else {
      // No filters
      q = query(collection(db, PROPOSALS_COLLECTION), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const proposals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Proposal[];

    return proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
};

/**
 * Get proposal by ID
 */
export const getProposalById = async (id: string): Promise<Proposal | null> => {
  try {
    const docRef = doc(db, PROPOSALS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Proposal;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
};

/**
 * Get proposal by proposal number
 */
export const getProposalByNumber = async (proposalNumber: string): Promise<Proposal | null> => {
  try {
    const q = query(
      collection(db, PROPOSALS_COLLECTION),
      where('proposalNumber', '==', proposalNumber)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Proposal;
  } catch (error) {
    console.error('Error fetching proposal by number:', error);
    return null;
  }
};

/**
 * Get next proposal sequence number
 */
const getNextProposalSequence = async (): Promise<number> => {
  const year = new Date().getFullYear();
  const counterDocId = `proposals_${year}`;
  const counterRef = doc(db, COUNTERS_COLLECTION, counterDocId);

  try {
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      // Initialize counter for this year
      await setDoc(counterRef, { sequence: 1, year });
      return 1;
    }

    const currentSequence = counterDoc.data().sequence || 0;
    const nextSequence = currentSequence + 1;

    // Increment counter
    await updateDoc(counterRef, { sequence: increment(1) });

    return nextSequence;
  } catch (error) {
    console.error('Error getting next proposal sequence:', error);
    // Fallback to timestamp-based number
    return Date.now() % 1000;
  }
};

/**
 * Create a new proposal
 */
export const createProposal = async (
  proposalData: Omit<Proposal, 'id' | 'proposalNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<string> => {
  try {
    const docRef = doc(collection(db, PROPOSALS_COLLECTION));
    const now = Timestamp.now();
    const year = new Date().getFullYear();
    const sequence = await getNextProposalSequence();
    const proposalNumber = generateProposalNumber(year, sequence);

    const newProposal: Proposal = {
      ...proposalData,
      id: docRef.id,
      proposalNumber,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined fields before saving to Firebase
    const cleanedProposal = Object.fromEntries(
      Object.entries(newProposal).filter(([_, v]) => v !== undefined)
    );

    await setDoc(docRef, cleanedProposal);
    return docRef.id;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
};

/**
 * Update an existing proposal
 */
export const updateProposal = async (
  id: string,
  updates: Partial<Omit<Proposal, 'id' | 'proposalNumber' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const docRef = doc(db, PROPOSALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    throw error;
  }
};

/**
 * Delete a proposal
 */
export const deleteProposal = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PROPOSALS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting proposal:', error);
    throw error;
  }
};

/**
 * Mark proposal as sent
 */
export const markProposalAsSent = async (id: string): Promise<void> => {
  await updateProposal(id, {
    status: ProposalStatus.SENT,
    sentAt: Timestamp.now(),
  });
};

/**
 * Mark proposal as viewed
 */
export const markProposalAsViewed = async (id: string): Promise<void> => {
  const proposal = await getProposalById(id);
  if (proposal && !proposal.viewedAt) {
    await updateProposal(id, {
      status: ProposalStatus.VIEWED,
      viewedAt: Timestamp.now(),
    });
  }
};

/**
 * Accept a proposal
 */
export const acceptProposal = async (id: string): Promise<void> => {
  const now = Timestamp.now();

  // Update proposal status
  await updateProposal(id, {
    status: ProposalStatus.ACCEPTED,
    respondedAt: now,
  });

  // Send email notification to admin
  try {
    // Get full proposal data
    const proposal = await getProposalById(id);

    if (proposal) {
      // Get admin email from business settings
      const { getStoreSettings } = await import('./business-info-service');
      const settings = await getStoreSettings();
      const adminEmail = settings.adminNotificationEmail || settings.email;

      if (adminEmail) {
        // Send email notification
        const { sendProposalApprovedEmail } = await import('@/lib/email/email-service');

        await sendProposalApprovedEmail(adminEmail, {
          proposalNumber: proposal.proposalNumber,
          customerName: proposal.client.name,
          customerEmail: proposal.client.email,
          customerCompany: proposal.client.company,
          lineItems: proposal.lineItems,
          subtotal: proposal.subtotal,
          taxAmount: proposal.taxAmount,
          discountAmount: proposal.discountAmount,
          total: proposal.total,
          taxLabel: proposal.taxConfig?.taxLabel,
          discountReason: proposal.discount?.reason,
          proposalTitle: proposal.title,
          acceptedAt: now.toDate().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        });

        console.log(`Proposal approval notification sent to ${adminEmail}`);
      } else {
        console.warn('No admin email configured for proposal notifications');
      }
    }
  } catch (emailError) {
    // Don't fail the proposal acceptance if email fails
    console.error('Failed to send proposal approval email:', emailError);
  }
};

/**
 * Reject a proposal
 */
export const rejectProposal = async (id: string): Promise<void> => {
  await updateProposal(id, {
    status: ProposalStatus.REJECTED,
    respondedAt: Timestamp.now(),
  });
};

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Get all invoices
 */
export const getInvoices = async (filters?: {
  status?: InvoiceStatus;
  clientEmail?: string;
}): Promise<Invoice[]> => {
  try {
    let q;

    // Build query with filters
    if (filters?.clientEmail && filters?.status) {
      // Both email and status filters
      q = query(
        collection(db, INVOICES_COLLECTION),
        where('client.email', '==', filters.clientEmail),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    } else if (filters?.clientEmail) {
      // Email filter only
      q = query(
        collection(db, INVOICES_COLLECTION),
        where('client.email', '==', filters.clientEmail),
        orderBy('createdAt', 'desc')
      );
    } else if (filters?.status) {
      // Status filter only
      q = query(
        collection(db, INVOICES_COLLECTION),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    } else {
      // No filters
      q = query(collection(db, INVOICES_COLLECTION), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];

    return invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
};

/**
 * Get invoice by invoice number
 */
export const getInvoiceByNumber = async (invoiceNumber: string): Promise<Invoice | null> => {
  try {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where('invoiceNumber', '==', invoiceNumber)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice by number:', error);
    return null;
  }
};

/**
 * Get next invoice sequence number
 */
const getNextInvoiceSequence = async (): Promise<number> => {
  const year = new Date().getFullYear();
  const counterDocId = `invoices_${year}`;
  const counterRef = doc(db, COUNTERS_COLLECTION, counterDocId);

  try {
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      // Initialize counter for this year
      await setDoc(counterRef, { sequence: 1, year });
      return 1;
    }

    const currentSequence = counterDoc.data().sequence || 0;
    const nextSequence = currentSequence + 1;

    // Increment counter
    await updateDoc(counterRef, { sequence: increment(1) });

    return nextSequence;
  } catch (error) {
    console.error('Error getting next invoice sequence:', error);
    // Fallback to timestamp-based number
    return Date.now() % 1000;
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<string> => {
  try {
    const docRef = doc(collection(db, INVOICES_COLLECTION));
    const now = Timestamp.now();
    const year = new Date().getFullYear();
    const sequence = await getNextInvoiceSequence();
    const invoiceNumber = generateInvoiceNumber(year, sequence);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: docRef.id,
      invoiceNumber,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined fields before saving to Firebase
    const cleanedInvoice = Object.fromEntries(
      Object.entries(newInvoice).filter(([_, v]) => v !== undefined)
    );

    await setDoc(docRef, cleanedInvoice);
    return docRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (
  id: string,
  updates: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

/**
 * Mark invoice as sent
 */
export const markInvoiceAsSent = async (id: string): Promise<void> => {
  await updateInvoice(id, {
    status: InvoiceStatus.SENT,
    sentAt: Timestamp.now(),
  });
};

/**
 * Mark invoice as viewed
 */
export const markInvoiceAsViewed = async (id: string): Promise<void> => {
  const invoice = await getInvoiceById(id);
  if (invoice && !invoice.viewedAt) {
    await updateInvoice(id, {
      status: InvoiceStatus.VIEWED,
      viewedAt: Timestamp.now(),
    });
  }
};

/**
 * Cancel an invoice
 * Marks the invoice as cancelled (keeps it in database for audit trail)
 */
export const cancelInvoice = async (id: string): Promise<void> => {
  await updateInvoice(id, {
    status: InvoiceStatus.CANCELLED,
    cancelledAt: Timestamp.now(),
  });
};

/**
 * Record a payment on an invoice
 */
export const recordPayment = async (
  invoiceId: string,
  userId: string,
  payment: Omit<PaymentInfo, 'paidAt'> & { paidAt?: Timestamp }
): Promise<void> => {
  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const paymentWithTimestamp: PaymentInfo = {
      ...payment,
      paidAt: payment.paidAt || Timestamp.now(),
    };

    const updatedPayments = [...invoice.payments, paymentWithTimestamp];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const amountDue = invoice.total - totalPaid;

    let newStatus: InvoiceStatus;
    if (amountDue <= 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (totalPaid > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      newStatus = invoice.status;
    }

    const updates: any = {
      payments: updatedPayments,
      amountPaid: totalPaid,
      amountDue: amountDue,
      status: newStatus,
    };

    if (amountDue <= 0) {
      updates.paidAt = Timestamp.now();
    }

    await updateInvoice(invoiceId, updates);
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Convert a proposal to an invoice
 */
export const convertProposalToInvoice = async (
  proposalId: string,
  userId: string,
  overrides?: {
    issueDate?: Timestamp;
    dueDate?: Timestamp;
    terms?: string;
  }
): Promise<string> => {
  try {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status === ProposalStatus.CONVERTED) {
      throw new Error('Proposal has already been converted to an invoice');
    }

    const now = Timestamp.now();
    const dueDate =
      overrides?.dueDate ||
      Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now

    const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'> = {
      status: InvoiceStatus.DRAFT,
      client: proposal.client,
      lineItems: proposal.lineItems,
      subtotal: proposal.subtotal,
      taxConfig: proposal.taxConfig,
      taxAmount: proposal.taxAmount,
      discount: proposal.discount,
      discountAmount: proposal.discountAmount,
      total: proposal.total,
      amountPaid: 0,
      amountDue: proposal.total,
      payments: [],
      title: proposal.title,
      description: proposal.description,
      terms: overrides?.terms || proposal.terms,
      notes: proposal.notes,
      issueDate: overrides?.issueDate || now,
      dueDate: dueDate,
      proposalId: proposal.id,
      createdBy: userId,
    };

    const invoiceId = await createInvoice(invoiceData, userId);

    // Mark proposal as converted
    await updateProposal(proposalId, {
      status: ProposalStatus.CONVERTED,
      convertedToInvoiceId: invoiceId,
    });

    return invoiceId;
  } catch (error) {
    console.error('Error converting proposal to invoice:', error);
    throw error;
  }
};

/**
 * Check and update overdue invoices
 * This should be run periodically (e.g., daily cron job)
 */
export const updateOverdueInvoices = async (): Promise<void> => {
  try {
    const invoices = await getInvoices();
    const now = new Date();

    for (const invoice of invoices) {
      if (
        (invoice.status === InvoiceStatus.SENT ||
          invoice.status === InvoiceStatus.VIEWED ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID) &&
        invoice.dueDate.toDate() < now &&
        invoice.amountDue > 0
      ) {
        await updateInvoice(invoice.id, {
          status: InvoiceStatus.OVERDUE,
        });
      }
    }
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    throw error;
  }
};

/**
 * Calculate totals for line items
 * Helper function for creating/updating proposals and invoices
 */
export const calculateTotals = (
  lineItems: LineItem[],
  taxConfig?: { taxRate: number; taxLabel: string },
  discount?: { type: 'percentage' | 'fixed'; value: number }
): {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
} => {
  const subtotal = calculateSubtotal(lineItems);
  const discountAmount = calculateDiscountAmount(subtotal, discount);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTaxAmount(taxableAmount, taxConfig);
  const total = calculateTotal(subtotal, taxAmount, discountAmount);

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
};
