'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator } from '@/types/calculator';
import {
  getCalculators,
  deleteCalculator,
  toggleCalculatorStatus,
} from '@/services/calculator-service';
import { Button, Card, LoadingSpinner, Modal } from '@/components/ui';

/**
 * Admin Calculators Management Page
 *
 * This page allows admins to:
 * - View all calculators
 * - Create new calculators
 * - Edit existing calculators
 * - Delete calculators
 * - Toggle calculator active/inactive status
 */
export default function CalculatorsAdminPage() {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [calculatorToDelete, setCalculatorToDelete] = useState<Calculator | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Load all calculators when component mounts
   */
  useEffect(() => {
    loadCalculators();
  }, []);

  /**
   * Fetch all calculators from Firestore
   */
  const loadCalculators = async () => {
    try {
      setLoading(true);
      const data = await getCalculators(false); // Get all calculators (not just active)
      setCalculators(data);
    } catch (error) {
      console.error('Error loading calculators:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle toggling calculator active status
   * @param calculator - The calculator to toggle
   */
  const handleToggleStatus = async (calculator: Calculator) => {
    try {
      await toggleCalculatorStatus(calculator.id, !calculator.isActive);
      // Update local state to reflect the change immediately
      setCalculators(calculators.map(c =>
        c.id === calculator.id ? { ...c, isActive: !c.isActive } : c
      ));
    } catch (error) {
      console.error('Error toggling calculator status:', error);
      alert('Failed to update calculator status');
    }
  };

  /**
   * Open delete confirmation modal
   * @param calculator - The calculator to delete
   */
  const openDeleteModal = (calculator: Calculator) => {
    setCalculatorToDelete(calculator);
    setDeleteModalOpen(true);
  };

  /**
   * Handle calculator deletion
   */
  const handleDelete = async () => {
    if (!calculatorToDelete) return;

    try {
      setDeleting(true);
      await deleteCalculator(calculatorToDelete.id);
      // Remove from local state
      setCalculators(calculators.filter(c => c.id !== calculatorToDelete.id));
      setDeleteModalOpen(false);
      setCalculatorToDelete(null);
    } catch (error) {
      console.error('Error deleting calculator:', error);
      alert('Failed to delete calculator');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Calculators</h1>
          <p className="text-gray-600 mt-2">
            Manage cost calculators for your services
          </p>
        </div>
        <Link href="/admin/calculators/new">
          <Button>+ New Calculator</Button>
        </Link>
      </div>

      {/* Calculators List */}
      {calculators.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">No calculators yet</p>
          <Link href="/admin/calculators/new">
            <Button>Create Your First Calculator</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {calculators.map((calculator) => (
            <Card key={calculator.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{calculator.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        calculator.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {calculator.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {calculator.description && (
                    <p className="text-gray-600 mb-3">{calculator.description}</p>
                  )}

                  <div className="flex gap-6 text-sm text-gray-500">
                    <span>
                      Slug: <code className="bg-gray-100 px-2 py-1 rounded">{calculator.slug}</code>
                    </span>
                    <span>
                      Default Rate: ${calculator.defaultHourlyRate}/hr
                    </span>
                    <span>
                      {calculator.steps.length} step{calculator.steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <Link href={`/calculators/${calculator.slug}`} target="_blank">
                    <Button variant="secondary" size="sm">
                      Preview
                    </Button>
                  </Link>

                  <Link href={`/admin/calculators/${calculator.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleStatus(calculator)}
                  >
                    {calculator.isActive ? 'Deactivate' : 'Activate'}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openDeleteModal(calculator)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Delete Calculator"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <strong>{calculatorToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. All calculator submissions will still be
            preserved, but users will no longer be able to access this calculator.
          </p>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Calculator'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
