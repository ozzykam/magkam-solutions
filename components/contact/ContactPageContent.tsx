'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { createContactMessage } from '@/services/contact-message-service';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ContactPageContent() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));

      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as StoreSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await createContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatOperatingHours = (operatingHours: StoreSettings['operatingHours']) => {
    if (!operatingHours) return null;

    const days = [
      { key: 'sunday' as const, label: 'Sunday' },
      { key: 'monday' as const, label: 'Monday' },
      { key: 'tuesday' as const, label: 'Tuesday' },
      { key: 'wednesday' as const, label: 'Wednesday' },
      { key: 'thursday' as const, label: 'Thursday' },
      { key: 'friday' as const, label: 'Friday' },
      { key: 'saturday' as const, label: 'Saturday' },
    ];

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return days.map(({ key, label }) => {
      const hours = operatingHours[key];
      if (typeof hours === 'object' && hours && 'closed' in hours && (hours as { closed: boolean }).closed) {
        return (
          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-500">Closed</span>
          </div>
        );
      }

      if (typeof hours === 'object' && hours && 'open' in hours && 'close' in hours) {
        return (
          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-600">
              {formatTime((hours as { open: string; close: string }).open)} - {formatTime((hours as { open: string; close: string }).close)}
            </span>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Have a question or feedback? We&apos;d love to hear from you. Reach out through
              the form below or use our contact information.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Your Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />

                        <Input
                          label="Your Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <Input
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <Button type="submit" variant="primary" size="lg" loading={sending} fullWidth>
                        Send Message
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                {/* Business Info */}
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-4">Contact Information</h3>

                    {settings?.email && (
                      <div className="flex items-start gap-3">
                        <EnvelopeIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <a
                            href={`mailto:${settings.email}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {settings.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings?.phone && (
                      <div className="flex items-start gap-3">
                        <PhoneIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Phone</p>
                          <a
                            href={`tel:${settings.phone}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {settings.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings?.address && (
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Address</p>
                          <p className="text-sm text-gray-600">
                            {settings.address.street}<br />
                            {settings.address.city}, {settings.address.state} {settings.address.zipCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Operating Hours */}
                {settings?.operatingHours && (
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ClockIcon className="w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-gray-900 text-lg">Operating Hours</h3>
                      </div>
                      <div className="space-y-1">
                        {formatOperatingHours(settings.operatingHours)}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
