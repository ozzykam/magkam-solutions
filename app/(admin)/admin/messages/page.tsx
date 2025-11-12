'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ContactMessage } from '@/types/contact-message';
import {
  getAllContactMessages,
  markMessageAsRead,
  markMessageAsUnread,
  archiveMessage,
  unarchiveMessage,
  deleteContactMessage,
} from '@/services/contact-message-service';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ArchiveBoxIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('unread');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const allMessages = await getAllContactMessages();
      setMessages(allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowModal(true);

    // Mark as read if unread
    if (!message.isRead && user?.uid) {
      await markMessageAsRead(message.id, user.uid);
      await loadMessages();
    }
  };

  const handleToggleRead = async (messageId: string, isRead: boolean) => {
    try {
      // Optimistically update local state first for immediate UI feedback
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                isRead: isRead,
                readAt: isRead ? (new Date() as unknown as ContactMessage['readAt']) : undefined,
                readBy: isRead ? user?.uid : undefined,
              }
            : msg
        )
      );

      // Then update in Firestore
      if (isRead && user?.uid) {
        await markMessageAsRead(messageId, user.uid);
      } else {
        await markMessageAsUnread(messageId);
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
      // Reload messages on error to sync with Firestore
      await loadMessages();
    }
  };

  const handleToggleArchive = async (messageId: string, isArchived: boolean) => {
    try {
      if (isArchived) {
        await archiveMessage(messageId);
      } else {
        await unarchiveMessage(messageId);
      }
      await loadMessages();
      setShowModal(false);
    } catch (error) {
      console.error('Error toggling archive status:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteContactMessage(messageId);
      await loadMessages();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const filteredMessages = messages
    .filter(message => {
      if (filter === 'unread') return !message.isRead && !message.isArchived;
      if (filter === 'archived') return message.isArchived;
      return !message.isArchived; // 'all' shows non-archived
    })
    .sort((a, b) => {
      // Only sort unread first when in "All Messages" tab
      if (filter === 'all' && a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1; // Unread (false) comes before read (true)
      }
      // Otherwise just sort by date (newest first)
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });

  const unreadCount = messages.filter(m => !m.isRead && !m.isArchived).length;
  const archivedCount = messages.filter(m => m.isArchived).length;

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date | string);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-600 mt-1">View and manage customer inquiries</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Messages ({messages.length - archivedCount})
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'archived'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Archived ({archivedCount})
        </button>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <EnvelopeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filter === 'unread' && 'No unread messages'}
              {filter === 'archived' && 'No archived messages'}
              {filter === 'all' && 'No messages yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map(message => (
            <Card key={message.id} hover>
              <div
                onClick={() => handleViewMessage(message)}
                className={`p-4 cursor-pointer transition-colors ${
                  !message.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {message.isRead ? (
                        <EnvelopeOpenIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <EnvelopeIcon className="w-5 h-5 text-primary-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {message.name}
                        </h3>
                        {!message.isRead && (
                          <Badge variant="primary" size="sm">New</Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-1">
                        {message.email}
                      </p>

                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {message.subject}
                      </p>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(message.id, !message.isRead);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                      title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {message.isRead ? (
                        <EnvelopeOpenIcon className="w-5 h-5" />
                      ) : (
                        <EnvelopeIcon className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArchive(message.id, !message.isArchived);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                      title={message.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <ArchiveBoxIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Message Details"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">From</label>
              <p className="text-gray-900">{selectedMessage.name}</p>
              <p className="text-sm text-gray-600">{selectedMessage.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <p className="text-gray-900">{selectedMessage.subject}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Received</label>
              <p className="text-sm text-gray-600">{formatDate(selectedMessage.createdAt)}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleToggleArchive(selectedMessage.id, !selectedMessage.isArchived)}
                fullWidth
              >
                {selectedMessage.isArchived ? 'Unarchive' : 'Archive'}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDelete(selectedMessage.id)}
                fullWidth
              >
                Delete
              </Button>

              <Button
                variant="primary"
                onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                fullWidth
              >
                Reply via Email
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
