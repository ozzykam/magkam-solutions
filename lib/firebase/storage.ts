import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Firebase Storage
 */
export const uploadFiles = async (
  files: File[],
  basePath: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => {
      const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
      return uploadFile(file, path);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (fileURL: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileURL);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Delete multiple files from Firebase Storage
 */
export const deleteFiles = async (fileURLs: string[]): Promise<void> => {
  try {
    const deletePromises = fileURLs.map((url) => deleteFile(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting files:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 */
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Upload an image to Firebase Storage
 * Generates a unique filename and uploads to the specified folder
 */
export const uploadImage = async (
  file: File,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${folder}/${uploadId}_${file.name}`;
    return await uploadFile(file, fileName);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
