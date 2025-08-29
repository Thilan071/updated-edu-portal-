// lib/fileUpload.js
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a PDF file to Firebase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} folder - The folder name (e.g., 'assessments')
 * @returns {Promise<{success: boolean, filePath?: string, fileName?: string, error?: string}>}
 */
export async function uploadPDF(file, folder = 'assessments') {
  try {
    // Validate file type
    if (!file.type.includes('pdf')) {
      return { success: false, error: 'Only PDF files are allowed' };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    // Generate unique filename with timestamp for better organization
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}-${uuidv4()}.pdf`;
    
    // Create Firebase Storage reference
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    
    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      filePath: downloadURL, // Full Firebase Storage download URL
      fileName: file.name,
      fileSize: file.size,
      storagePath: `${folder}/${uniqueFileName}` // Storage path for deletion
    };
  } catch (error) {
    console.error('Error uploading PDF to Firebase Storage:', error);
    return { success: false, error: 'Failed to upload file to Firebase Storage' };
  }
}

/**
 * Delete a PDF file from Firebase Storage
 * @param {string} storagePath - The storage path to delete (e.g., 'assessments/filename.pdf')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePDF(storagePath) {
  try {
    if (!storagePath) {
      return { success: false, error: 'Storage path is required' };
    }
    
    // Create reference to the file in Firebase Storage
    const storageRef = ref(storage, storagePath);
    
    // Delete the file
    await deleteObject(storageRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting PDF from Firebase Storage:', error);
    
    // If file doesn't exist, consider it a success
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    
    return { success: false, error: 'Failed to delete file from Firebase Storage' };
  }
}

/**
 * Check if a file exists in Firebase Storage
 * @param {string} storagePath - The storage path to check
 * @returns {Promise<boolean>}
 */
export async function fileExists(storagePath) {
  try {
    if (!storagePath) return false;
    
    const storageRef = ref(storage, storagePath);
    await getDownloadURL(storageRef);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    console.error('Error checking file existence:', error);
    return false;
  }
}