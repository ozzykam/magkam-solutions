'use client';

import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length - uploadingImages.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types
    const validFiles = filesToUpload.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`${file.name} is too large. Maximum 5MB per image.`);
        return false;
      }
      return true;
    });

    // Start uploading
    validFiles.forEach(file => uploadImage(file));
  };

  const uploadImage = async (file: File) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `products/${uploadId}_${file.name}`;
    const storageRef = ref(storage, fileName);

    // Add to uploading list
    const newUpload: UploadingImage = {
      id: uploadId,
      file,
      progress: 0,
    };
    setUploadingImages(prev => [...prev, newUpload]);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Update progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingImages(prev =>
            prev.map(img =>
              img.id === uploadId ? { ...img, progress } : img
            )
          );
        },
        (error) => {
          // Handle error
          console.error('Upload error:', error);
          setUploadingImages(prev =>
            prev.map(img =>
              img.id === uploadId ? { ...img, error: error.message } : img
            )
          );
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Add to images array
          onChange([...images, downloadURL]);

          // Remove from uploading list
          setUploadingImages(prev => prev.filter(img => img.id !== uploadId));
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingImages(prev =>
        prev.map(img =>
          img.id === uploadId ? { ...img, error: 'Upload failed' } : img
        )
      );
    }
  };

  const handleDelete = async (imageUrl: string, index: number) => {
    if (!confirm('Delete this image?')) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/o/')[1]?.split('?')[0];
      if (urlParts) {
        const filePath = decodeURIComponent(urlParts);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }

      // Remove from images array
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image. You can still remove it from the list.');
      // Remove from list even if Firebase delete fails
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    }
  };

  const handleSetFeatured = (index: number) => {
    // Move selected image to the front
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onChange(newImages);
  };

  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-gray-600">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Click to upload
            </button>
            {' or drag and drop'}
          </div>

          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to 5MB ({images.length}/{maxImages} images)
          </p>
        </div>
      </div>

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-2">
          {uploadingImages.map(upload => (
            <div key={upload.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {upload.error ? (
                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 text-xl">✕</span>
                    </div>
                  ) : (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  {upload.error ? (
                    <p className="text-xs text-red-600">{upload.error}</p>
                  ) : (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(upload.progress)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Images (first image is featured)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <Image
                    width={200}
                    height={200}
                    src={imageUrl}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                    }}
                    onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  />
                </div>

                {/* Featured Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="featured" size="sm">Featured</Badge>
                  </div>
                )}

                {/* Actions Overlay - Only visible on hover */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity rounded-lg pointer-events-none"></div>
                <div className="absolute inset-0 rounded-lg flex items-center justify-center gap-2 pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 pointer-events-auto">
                    {/* Move Left */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveLeft(index)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move left"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    {/* Set as Featured */}
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(index)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Set as featured"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    )}

                    {/* Move Right */}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveRight(index)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move right"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(imageUrl, index)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && uploadingImages.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
