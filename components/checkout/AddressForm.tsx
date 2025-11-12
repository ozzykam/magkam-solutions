import React, { useState } from 'react';
import { Address } from '@/types/user';
import Input from '@/components/ui/Input';

interface AddressFormProps {
  onSubmit: (address: Address) => void;
  initialAddress?: Address;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, initialAddress }) => {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      id: '', // Will be generated when saved
      name: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const handleChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Address, string>> = {};

    if (!address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!address.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(address);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>

      <Input
        label="Recipient Name"
        value={address.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="John Doe"
        error={errors.name}
        required
      />

      <Input
        label="Street Address"
        value={address.street}
        onChange={(e) => handleChange('street', e.target.value)}
        placeholder="123 Main St"
        error={errors.street}
        required
      />

      <Input
        label="Apartment, suite, etc. (optional)"
        value={address.apartment || ''}
        onChange={(e) => handleChange('apartment', e.target.value)}
        placeholder="Apt 4B"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="City"
          value={address.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="San Francisco"
          error={errors.city}
          required
        />

        <Input
          label="State"
          value={address.state}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="CA"
          error={errors.state}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="ZIP Code"
          value={address.zipCode}
          onChange={(e) => handleChange('zipCode', e.target.value)}
          placeholder="94102"
          error={errors.zipCode}
          required
        />

        <Input
          label="Country"
          value={address.country}
          onChange={(e) => handleChange('country', e.target.value)}
          disabled
        />
      </div>

      <button
        type="submit"
        className="hidden" // Hidden submit button for form validation
      >
        Submit
      </button>
    </form>
  );
};

export default AddressForm;
