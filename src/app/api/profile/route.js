import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { updateUser, findUserById } from '@/lib/userService';

// PUT /api/profile - Update current user profile
export async function PUT(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    const body = await request.json();
    const { firstName, lastName, telephone, address, dob } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Prepare update data (excluding sensitive fields like email, password, role)
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    // Add optional fields if provided
    if (telephone !== undefined) {
      updateData.telephone = telephone.trim();
    }

    if (address !== undefined) {
      updateData.address = address.trim();
    }

    if (dob !== undefined) {
      updateData.dob = dob ? new Date(dob) : null;
    }

    // Update user in database
    const updatedUser = await updateUser(user.uid, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
