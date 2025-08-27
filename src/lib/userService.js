// lib/userService.js
import { adminDb, adminAuth } from './firebaseAdmin';
import bcrypt from 'bcryptjs';

const USERS_COLLECTION = 'users';

export class UserService {
  static async createUser(userData) {
    let authUser = null;
    
    try {
      // Create Firebase Auth user first
      authUser = await adminAuth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        disabled: false,
      });

      // Hash password before saving to Firestore
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Prepare user data for Firestore (without plain password)
      const firestoreUserData = {
        ...userData,
        password: hashedPassword,
        authUid: authUser.uid, // Link to Firebase Auth user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create user document in Firestore using the Auth UID as document ID
      const userRef = adminDb.collection(USERS_COLLECTION).doc(authUser.uid);
      await userRef.set(firestoreUserData);

      return { id: authUser.uid, ...firestoreUserData };
    } catch (error) {
      console.error('Error creating user:', error);
      
      // If Firestore creation fails but Auth user was created, clean up
      if (authUser) {
        try {
          await adminAuth.deleteUser(authUser.uid);
          console.log('Cleaned up Auth user after Firestore error');
        } catch (cleanupError) {
          console.error('Error cleaning up Auth user:', cleanupError);
        }
      }
      
      // Re-throw the original error to preserve error codes
      throw error;
    }
  }

  static async findUserByEmail(email) {
    try {
      // First try to find user by email in Firebase Auth
      let authUser;
      try {
        authUser = await adminAuth.getUserByEmail(email.toLowerCase().trim());
      } catch (authError) {
        // User not found in Auth, try Firestore fallback
        const snapshot = await adminDb
          .collection(USERS_COLLECTION)
          .where('email', '==', email.toLowerCase().trim())
          .limit(1)
          .get();

        if (snapshot.empty) {
          return null;
        }

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // If found in Auth, get corresponding Firestore document
      const userDoc = await adminDb.collection(USERS_COLLECTION).doc(authUser.uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return { id: authUser.uid, ...userDoc.data() };
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findUserByStudentId(studentId) {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('studentId', '==', studentId.replace(/\s+/g, '').toUpperCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error finding user by student ID:', error);
      throw error;
    }
  }

  static async findUserById(userId) {
    try {
      const doc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      updateData.updatedAt = new Date();
      
      await adminDb.collection(USERS_COLLECTION).doc(userId).update(updateData);
      
      return await UserService.findUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async getPendingStudents() {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('role', '==', 'student')
        .where('isApproved', '==', false)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending students:', error);
      throw error;
    }
  }

  static async getPendingEducators() {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('role', '==', 'educator')
        .where('isApproved', '==', false)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending educators:', error);
      throw error;
    }
  }

  static async getAllStudents() {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('role', '==', 'student')
        .where('isApproved', '==', true)
        .get();

      const students = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.telephone || '',
          studentId: data.studentId || this.generateStudentId(),
          program: data.program || '',
          batch: data.batch || '',
          status: data.isApproved ? 'Active' : 'Inactive',
          dob: data.dob || '',
          address: data.address || '',
          photoUrl: data.photoUrl || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      // Sort by createdAt in memory to avoid composite index requirement
      return students.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toDate() - a.createdAt.toDate();
      });
    } catch (error) {
      console.error('Error getting all students:', error);
      throw error;
    }
  }

  static async getAllEducators() {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('role', '==', 'educator')
        .where('isApproved', '==', true)
        .get();

      const educators = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.telephone || '',
          employeeId: data.employeeId || `EMP${Date.now()}`,
          department: data.department || '',
          specialization: data.specialization || '',
          status: data.isApproved ? 'Active' : 'Inactive',
          dob: data.dob || '',
          address: data.address || '',
          photoUrl: data.photoUrl || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      // Sort by createdAt in memory to avoid composite index requirement
      return educators.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toDate() - a.createdAt.toDate();
      });
    } catch (error) {
      console.error('Error getting all educators:', error);
      throw error;
    }
  }

  static async rejectUser(userId) {
    try {
      // Delete the user document from Firestore
      await adminDb.collection(USERS_COLLECTION).doc(userId).delete();
      
      // Also try to delete from Firebase Auth if they exist
      try {
        const userRecord = await adminAuth.getUser(userId);
        if (userRecord) {
          await adminAuth.deleteUser(userId);
        }
      } catch (authError) {
        // User might not exist in Auth, which is fine
        console.log('User not found in Auth or already deleted:', authError.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  }

  static async approveStudent(studentId) {
    try {
      // Generate a unique student ID
      const generatedStudentId = this.generateStudentId();
      
      // Update user with approval and student ID
      await this.updateUser(studentId, { 
        isApproved: true, 
        studentId: generatedStudentId,
        updatedAt: new Date()
      });
      
      return await this.findUserById(studentId);
    } catch (error) {
      console.error('Error approving student:', error);
      throw error;
    }
  }

  static async approveEducator(educatorId) {
    try {
      // Update user with approval
      await this.updateUser(educatorId, { 
        isApproved: true,
        updatedAt: new Date()
      });
      
      return await this.findUserById(educatorId);
    } catch (error) {
      console.error('Error approving educator:', error);
      throw error;
    }
  }

  static generateStudentId() {
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EDU-${year}-${randomPart}`;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  static async setPasswordResetToken(email, token, expires) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      await this.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpires: expires
      });

      return user;
    } catch (error) {
      console.error('Error setting password reset token:', error);
      throw error;
    }
  }

  static async findUserByResetToken(token) {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('passwordResetToken', '==', token)
        .where('passwordResetExpires', '>', new Date())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  static async resetPassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.updateUser(userId, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      return await this.findUserById(userId);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      // Delete the user document from Firestore
      await adminDb.collection(USERS_COLLECTION).doc(userId).delete();
      
      // Also try to delete from Firebase Auth if they exist
      try {
        const userRecord = await adminAuth.getUser(userId);
        if (userRecord) {
          await adminAuth.deleteUser(userId);
        }
      } catch (authError) {
        // User might not exist in Auth, which is fine
        console.log('User not found in Auth or already deleted:', authError.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Export individual functions for convenience
export const createUser = UserService.createUser;
export const findUserByEmail = UserService.findUserByEmail;
export const findUserByStudentId = UserService.findUserByStudentId;
export const findUserById = UserService.findUserById;
export const updateUser = UserService.updateUser;
export const getPendingStudents = UserService.getPendingStudents;
export const getPendingEducators = UserService.getPendingEducators;
export const getAllStudents = UserService.getAllStudents;
export const getAllEducators = UserService.getAllEducators;
export const approveStudent = UserService.approveStudent;
export const approveEducator = UserService.approveEducator;
export const rejectUser = UserService.rejectUser;
export const generateStudentId = UserService.generateStudentId;
export const verifyPassword = UserService.verifyPassword;
export const setPasswordResetToken = UserService.setPasswordResetToken;
export const findUserByResetToken = UserService.findUserByResetToken;
export const resetPassword = UserService.resetPassword;
export const deleteUser = UserService.deleteUser;

export default UserService;