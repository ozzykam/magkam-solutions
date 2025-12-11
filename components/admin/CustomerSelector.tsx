'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, UserRole } from '@/types';
import Input from '@/components/ui/Input';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface ClientInfo {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CustomerSelectorProps {
  onSelectCustomer: (customerId: string | null, customerData: ClientInfo) => void;
  initialData?: ClientInfo;
}

export default function CustomerSelector({ onSelectCustomer, initialData }: CustomerSelectorProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [customers, setCustomers] = useState<User[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Client info form (for new customer or editing existing)
  const [clientInfo, setClientInfo] = useState<ClientInfo>(
    initialData || {
      name: '',
      email: '',
      company: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    }
  );

  useEffect(() => {
    if (mode === 'existing') {
      loadCustomers();
    }
  }, [mode]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCustomers(customers);
      setShowDropdown(false);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', UserRole.CUSTOMER)
      );
      const snapshot = await getDocs(customersQuery);
      const customersList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[];
      setCustomers(customersList);
      setFilteredCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: User) => {
    setSelectedCustomerId(customer.uid);
    setSearchTerm(customer.name);
    setShowDropdown(false);

    // Populate client info from selected customer
    // Handle both 'addresses' (array) and 'address' (map) structures
    const customerAny = customer as any;
    const defaultAddress = customer.addresses?.find(addr => addr.isDefault)
      || customer.addresses?.[0]
      || customerAny.address; // Fallback to singular 'address' map

    const customerData: ClientInfo = {
      name: customer.name,
      email: customer.email,
      company: customerAny.businessName || '', // Use businessName if available
      phone: customer.phone || '',
      address: defaultAddress ? {
        street: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zipCode: defaultAddress.zipCode || '',
      } : {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    };

    setClientInfo(customerData);
    onSelectCustomer(customer.uid, customerData);
  };

  const handleClientInfoChange = (field: string, value: string) => {
    const updatedInfo = { ...clientInfo };

    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      updatedInfo.address = {
        ...updatedInfo.address!,
        [addressField]: value,
      };
    } else {
      (updatedInfo as any)[field] = value;
    }

    setClientInfo(updatedInfo);
    onSelectCustomer(mode === 'existing' ? selectedCustomerId : null, updatedInfo);
  };

  const handleModeChange = (newMode: 'existing' | 'new') => {
    setMode(newMode);
    setSelectedCustomerId(null);
    setSearchTerm('');
    if (newMode === 'new') {
      // Reset to empty form
      const emptyInfo: ClientInfo = {
        name: '',
        email: '',
        company: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        },
      };
      setClientInfo(emptyInfo);
      onSelectCustomer(null, emptyInfo);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleModeChange('existing')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            mode === 'existing'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <MagnifyingGlassIcon className="w-5 h-5 mx-auto mb-1" />
          <span className="block text-sm font-medium">Existing Customer</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('new')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            mode === 'new'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <UserPlusIcon className="w-5 h-5 mx-auto mb-1" />
          <span className="block text-sm font-medium">New Customer</span>
        </button>
      </div>

      {/* Customer Search (Existing Mode) */}
      {mode === 'existing' && (
        <div className="relative">
          <Input
            label="Search Customers"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.uid}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                  {customer.phone && (
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="text-center py-4 text-gray-500">Loading customers...</div>
          )}
        </div>
      )}

      {/* Client Information Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Client Name"
          placeholder="John Doe"
          value={clientInfo.name}
          onChange={(e) => handleClientInfoChange('name', e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={clientInfo.email}
          onChange={(e) => handleClientInfoChange('email', e.target.value)}
          required
        />
        <Input
          label="Company (Optional)"
          placeholder="Acme Inc."
          value={clientInfo.company || ''}
          onChange={(e) => handleClientInfoChange('company', e.target.value)}
        />
        <Input
          label="Phone (Optional)"
          placeholder="+1 (555) 123-4567"
          value={clientInfo.phone || ''}
          onChange={(e) => handleClientInfoChange('phone', e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Address (Optional)</h3>
        <Input
          label="Street"
          placeholder="123 Main St"
          value={clientInfo.address?.street || ''}
          onChange={(e) => handleClientInfoChange('address.street', e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="New York"
            value={clientInfo.address?.city || ''}
            onChange={(e) => handleClientInfoChange('address.city', e.target.value)}
          />
          <Input
            label="State"
            placeholder="NY"
            value={clientInfo.address?.state || ''}
            onChange={(e) => handleClientInfoChange('address.state', e.target.value)}
          />
          <Input
            label="ZIP Code"
            placeholder="10001"
            value={clientInfo.address?.zipCode || ''}
            onChange={(e) => handleClientInfoChange('address.zipCode', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
