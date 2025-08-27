import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { uploadFile, generateProfileImagePath, deleteFile, validateImageFile } from '@/lib/storageUtils';
import { updateUser, findUserById } from '@/lib/userService';

export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;
    
    console.log('User object from auth:', user);
    console.log('User UID:', user?.uid);
    
    if (!user?.uid) {
      return NextResponse.json({ error: 'User ID not found in authentication' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate the image file
    try {
      validateImageFile(file);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    // Get current user data to check for existing profile image
    const currentUser = await findUserById(user.uid);
    
    // Generate new image path
    const imagePath = generateProfileImagePath(user.uid, file.name);
    
    // Upload new image
    const imageUrl = await uploadFile(file, imagePath);
    
    // Delete old profile image if it exists
    if (currentUser?.photoUrl) {
      try {
        await deleteFile(currentUser.photoUrl);
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Continue even if deletion fails
      }
    }
    
    // Update user profile with new image URL
    await updateUser(user.uid, { photoUrl: imageUrl });
    
    return NextResponse.json({
      message: 'Profile image updated successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}