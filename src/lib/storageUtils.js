// lib/storageUtils.js
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} path - The storage path (e.g., 'profile-images/user123.jpg')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export async function uploadFile(file, path) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Upload a base64 image to Firebase Storage
 * @param {string} base64Data - Base64 encoded image data (with data:image/... prefix)
 * @param {string} path - The storage path
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export async function uploadBase64Image(base64Data, path) {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    return await uploadFile(blob, path);
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {string} url - The download URL or storage path
 * @returns {Promise<void>}
 */
export async function deleteFile(url) {
  try {
    // Skip deletion for base64 data URLs or invalid URLs
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      console.log('Skipping deletion for non-storage URL:', url?.substring(0, 50) + '...');
      return;
    }
    
    let storageRef;
    
    if (url.startsWith('gs://') || url.startsWith('/')) {
      // It's a storage path
      storageRef = ref(storage, url);
    } else {
      // It's a download URL, extract the path
      try {
        const urlObj = new URL(url);
        console.log('Attempting to delete file with URL:', url);
        console.log('URL pathname:', urlObj.pathname);
        
        // Handle Firebase Storage URLs: /v0/b/bucket/o/path
        let pathMatch = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
        if (pathMatch) {
          let path = decodeURIComponent(pathMatch[1]);
          console.log('Extracted path:', path);
          storageRef = ref(storage, path);
        } else {
          console.log('Could not extract path from URL pathname:', urlObj.pathname);
          return;
        }
      } catch (urlError) {
        console.log('Invalid URL format:', url, urlError.message);
        return;
      }
    }
    
    await deleteObject(storageRef);
    console.log('Successfully deleted file:', url);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for delete operations to avoid breaking the flow
  }
}

/**
 * Generate a unique filename for profile images
 * @param {string} userId - The user ID
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
export function generateProfileImagePath(userId, originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpg';
  return `profile-images/${userId}_${timestamp}.${extension}`;
}

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is valid
 */
export function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload an image smaller than 5MB.');
  }
  
  return true;
}