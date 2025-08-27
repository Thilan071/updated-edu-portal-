// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/userService';
import { uploadBase64Image, generateProfileImagePath } from '@/lib/storageUtils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, dob, telephone, address, photoUrl, role } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate role
    if (!['student', 'educator'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'student' or 'educator'" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(String(email).toLowerCase().trim());
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create new user first
    const newUser = await createUser({
      firstName,
      lastName,
      email: String(email).toLowerCase().trim(),
      password,
      dob: dob ? new Date(dob) : null,
      telephone,
      address,
      photoUrl: null, // Will be updated after image upload
      role, // Use the selected role
      isApproved: false, // Both students and educators need admin approval
    });

    // Handle profile image upload if provided (after user creation)
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      try {
        const imagePath = generateProfileImagePath(newUser.id, 'profile.jpg');
        const profileImageUrl = await uploadBase64Image(photoUrl, imagePath);
        
        // Update user with the image URL
        const { updateUser } = await import('@/lib/userService');
        await updateUser(newUser.id, { photoUrl: profileImageUrl });
        
        // Update the newUser object for the response
        newUser.photoUrl = profileImageUrl;
      } catch (imageError) {
        console.error('Error uploading profile image:', imageError);
        // Continue with registration even if image upload fails
      }
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          isApproved: newUser.isApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: "This email address is already registered. Please use a different email or try logging in." },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: "Password is too weak. Please choose a stronger password." },
        { status: 400 }
      );
    }
    
    // Generic error for other cases
    return NextResponse.json(
      { error: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
}
