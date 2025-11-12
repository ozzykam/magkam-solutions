'use client';

import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SingleImageUploaderProps {
  image: string;
  onChange: (imageUrl: string) => void;
  folder?: string; // e.g., 'categories', 'vendors'
  label?: string;
}

export default function SingleImageUploader({
  image,
  onChange,
  folder = 'uploads',
  label = 'Image'
}: SingleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${folder}/${uploadId}_${file.name}`;
    const storageRef = ref(storage, fileName);

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Update progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          // Handle error
          console.error('Upload error:', error);
          alert(`Upload failed: ${error.message}`);
          setUploading(false);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!image || !confirm('Delete this image?')) return;

    try {
      // Extract file path from URL
      const urlParts = image.split('/o/')[1]?.split('?')[0];
      if (urlParts) {
        const filePath = decodeURIComponent(urlParts);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }

      // Clear image URL
      onChange('');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image from storage, but clearing the reference');
      // Clear even if Firebase delete fails
      onChange('');
    }
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

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Current Image Preview */}
      {image && !uploading && (
        <div className="relative inline-block">
          <Image
            width={128}
            height={128}
            src={image}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Delete image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!uploading && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="text-gray-600">
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
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
                {image ? 'Change image' : 'Upload image'}
              </button>
              {' or drag and drop'}
            </div>

            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
