// lib/authUtils.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

/**
 * Verify NextAuth token from API request headers
 * @param {Request} request - The API request object
 * @returns {Object|null} - The decoded token or null if invalid
 */
export async function verifyAuthToken(request) {
  try {
    // Get token from NextAuth JWT
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return null;
    }
    
    return {
      id: token.id,
      uid: token.id, // Keep uid for backward compatibility
      email: token.email,
      role: token.role,
      name: token.name
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware function to check authentication for API routes
 * @param {Request} request - The API request object
 * @param {Array} allowedRoles - Array of roles allowed to access this endpoint
 * @returns {Object} - Object containing user data or error response
 */
export async function authenticateAPIRequest(request, allowedRoles = []) {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
      user: null
    };
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      success: false,
      error: 'Forbidden - Insufficient permissions',
      user: null
    };
  }
  
  return {
    success: true,
    error: null,
    user
  };
}