'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getSalesDocuments,
  createSalesDocument,
  updateSalesDocument,
  deleteSalesDocument,
} from '@/services/sales-document-service';
import {
  SalesDocument,
  DocumentCategory,
  CreateSalesDocumentData,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_COLORS,
} from '@/types/sales-document';
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

// ─── File type helpers ────────────────────────────────────────────────────────

function getFileIcon(fileType: string) {
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📈';
  if (fileType.startsWith('image/')) return '🖼️';
  return '📁';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: { toDate: () => Date }): string {
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Upload state ─────────────────────────────────────────────────────────────

interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SalesDocument | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [formVersion, setFormVersion] = useState('');
  const [formTagInput, setFormTagInput] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setDocuments(await getSalesDocuments());
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = documents.filter(d => {
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.fileName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const countByCategory = Object.values(DocumentCategory).reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = documents.filter(d => d.category === cat).length;
    return acc;
  }, {});

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openModal = (doc?: SalesDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormName(doc.name);
      setFormDescription(doc.description || '');
      setFormCategory(doc.category);
      setFormVersion(doc.version || '');
      setFormTags([...doc.tags]);
      setUploadedFile({
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        storagePath: doc.storagePath,
      });
    } else {
      setEditingDoc(null);
      setFormName('');
      setFormDescription('');
      setFormCategory(DocumentCategory.OTHER);
      setFormVersion('');
      setFormTags([]);
      setUploadedFile(null);
    }
    setFormTagInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUploadedFile(null);
    setUploading(false);
  };

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('File must be under 25 MB', 'error');
      return;
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const storagePath = `uploads/users/${user.uid}/documents/${uniqueId}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    setUploading(true);
    setUploadProgress(0);

    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snap => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      err => {
        console.error('Upload error:', err);
        showToast('Upload failed', 'error');
        setUploading(false);
      },
      async () => {
        const fileUrl = await getDownloadURL(task.snapshot.ref);
        setUploadedFile({ fileUrl, fileName: file.name, fileType: file.type, fileSize: file.size, storagePath });
        setUploading(false);
        // Auto-fill name from filename if empty
        if (!formName) {
          setFormName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
        }
      }
    );

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ── Tag handling ───────────────────────────────────────────────────────────

  const addTag = () => {
    const tag = formTagInput.trim().toLowerCase();
    if (tag && !formTags.includes(tag)) {
      setFormTags(prev => [...prev, tag]);
    }
    setFormTagInput('');
  };

  const removeTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user) return;
    if (!formName.trim()) { showToast('Name is required', 'error'); return; }
    if (!uploadedFile) { showToast('Please upload a file', 'error'); return; }

    setIsSaving(true);
    try {
      const payload: CreateSalesDocumentData = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        version: formVersion.trim() || undefined,
        tags: formTags,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        storagePath: uploadedFile.storagePath,
      };

      if (editingDoc) {
        await updateSalesDocument(editingDoc.id, payload);
        showToast('Document updated', 'success');
      } else {
        await createSalesDocument(payload, user.uid);
        showToast('Document saved', 'success');
      }

      closeModal();
      loadDocuments();
    } catch (err) {
      console.error('Failed to save document:', err);
      showToast('Failed to save document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (doc: SalesDocument) => {
    if (!confirm(`Delete "${doc.name}"? This will also remove the file from storage.`)) return;
    try {
      await deleteSalesDocument(doc);
      showToast('Document deleted', 'success');
      loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      showToast('Failed to delete document', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Documents</h1>
          <p className="text-gray-600 mt-1">Manage resumes, flyers, business cards, and other sales materials</p>
        </div>
        <Button onClick={() => openModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" count={documents.length} />
        <StatCard label="Resumes" count={countByCategory[DocumentCategory.RESUME] || 0} />
        <StatCard label="Flyers" count={countByCategory[DocumentCategory.FLYER] || 0} />
        <StatCard label="Presentations" count={countByCategory[DocumentCategory.PRESENTATION] || 0} />
      </div>

      {/* Filters */}
      <Card padding="none">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, tag, or filename..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Categories</option>
            {Object.values(DocumentCategory).map(cat => (
              <option key={cat} value={cat}>{DOCUMENT_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <Card padding="none">
          <div className="p-16 text-center text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">
              {searchQuery || categoryFilter !== 'all' ? 'No documents match your filters' : 'No documents yet'}
            </p>
            <p className="text-sm mt-1">Click &quot;Upload Document&quot; to add your first sales material</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onEdit={() => openModal(doc)}
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-sm text-gray-500">{filtered.length} of {documents.length} documents</p>
      )}

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingDoc ? 'Edit Document' : 'Upload Document'}
        size="lg"
      >
        <div className="space-y-5">
          {/* File upload area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File {!editingDoc && <span className="text-red-500">*</span>}
            </label>

            {uploadedFile && !uploading ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-2xl">{getFileIcon(uploadedFile.fileType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.fileName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.fileSize)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  Replace
                </button>
              </div>
            ) : uploading ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <DocumentTextIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-primary-600">Click to select a file</p>
                <p className="text-xs text-gray-500 mt-1">PDF, Word, PowerPoint, images — up to 25 MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Aziz Kamara Resume 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as DocumentCategory)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(DocumentCategory).map(cat => (
                  <option key={cat} value={cat}>{DOCUMENT_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <Input
                value={formVersion}
                onChange={e => setFormVersion(e.target.value)}
                placeholder="e.g. v2, Jan 2024, Final"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Brief notes about this document..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={formTagInput}
                  onChange={e => setFormTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addTag} type="button">
                  Add
                </Button>
              </div>
              {formTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={closeModal} type="button">Cancel</Button>
            <Button onClick={handleSave} loading={isSaving} disabled={uploading}>
              {editingDoc ? 'Save Changes' : 'Save Document'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Document card ─────────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: SalesDocument;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card padding="none" className="flex flex-col">
      <div className="p-4 flex-1 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0 mt-0.5">{getFileIcon(doc.fileType)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 leading-tight truncate">{doc.name}</p>
            {doc.version && (
              <p className="text-xs text-gray-400 mt-0.5">{doc.version}</p>
            )}
          </div>
        </div>

        {/* Category + file size */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={DOCUMENT_CATEGORY_COLORS[doc.category] as Parameters<typeof Badge>[0]['variant']}
            size="sm"
          >
            {DOCUMENT_CATEGORY_LABELS[doc.category]}
          </Badge>
          <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
        </div>

        {/* Description */}
        {doc.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
        )}

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
            {doc.tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Filename + date */}
        <div className="text-xs text-gray-400 space-y-0.5">
          <p className="truncate" title={doc.fileName}>{doc.fileName}</p>
          <p>Added {formatDate(doc.createdAt)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Open / Preview"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
          <a
            href={doc.fileUrl}
            download={doc.fileName}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </a>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <Card padding="none">
      <div className="p-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{count}</p>
      </div>
    </Card>
  );
}
