// lib/goalsService.js
import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Service for managing user goals in Firebase
 */
export class GoalsService {
  /**
   * Get all goals for a specific user
   * @param {string} userId - User ID
   * @returns {Array} Array of goals
   */
  static async getUserGoals(userId) {
    try {
      const goalsRef = adminDb.collection('users').doc(userId).collection('goals');
      const querySnapshot = await goalsRef.orderBy('createdAt', 'desc').get();
      
      const goals = [];
      querySnapshot.forEach((doc) => {
        goals.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        });
      });
      
      return goals;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw new Error('Failed to fetch goals');
    }
  }

  /**
   * Add a new goal for a user
   * @param {string} userId - User ID
   * @param {string} goalText - Goal description
   * @returns {Object} Created goal data
   */
  static async addGoal(userId, goalData) {
    try {
      const goalsRef = adminDb.collection('users').doc(userId).collection('goals');
      const newGoal = {
        ...goalData,
        completed: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      const docRef = await goalsRef.add(newGoal);
      
      return {
        id: docRef.id,
        ...newGoal,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding goal:', error);
      throw new Error('Failed to add goal');
    }
  }

  /**
   * Toggle goal completion status
   * @param {string} userId - User ID
   * @param {string} goalId - Goal ID
   * @returns {Object} Updated goal data
   */
  static async toggleGoalCompletion(userId, goalId) {
    try {
      const goalRef = adminDb.collection('users').doc(userId).collection('goals').doc(goalId);
      
      // First get the current goal to check its completion status
      const goalDoc = await goalRef.get();
      if (!goalDoc.exists) {
        throw new Error('Goal not found');
      }
      
      const currentCompleted = goalDoc.data().completed;
      
      await goalRef.update({
        completed: !currentCompleted,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      return {
        id: goalId,
        completed: !currentCompleted,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      throw new Error('Failed to toggle goal completion');
    }
  }

  /**
   * Delete a goal
   * @param {string} userId - User ID
   * @param {string} goalId - Goal ID
   */
  static async deleteGoal(userId, goalId) {
    try {
      const goalRef = adminDb.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.delete();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal');
    }
  }

  /**
   * Add dummy goals for a user (for testing/seeding)
   * @param {string} userId - User ID
   * @returns {Array} Array of created goals
   */
  static async addDummyGoals(userId) {
    const dummyGoals = [
      "Complete Web Technologies Chapter 4",
      "Submit Database Assignment",
      "Revise Cybersecurity Labs",
      "Finish all Programming Fundamentals exercises",
      "Review Computer Networks lecture notes",
      "Prepare for Web Technologies project presentation",
      "Practice Python coding challenges for 2 hours",
      "Read 2 articles on recent cybersecurity threats",
      "Outline next steps for Data Structures final exam",
      "Schedule a session with AI Mentor for Algorithms",
      "Complete Mobile App Development UI design for prototype",
      "Research Cloud Computing deployment strategies"
    ];

    try {
      const createdGoals = [];
      
      for (let i = 0; i < dummyGoals.length; i++) {
        const goalText = dummyGoals[i];
        const completed = Math.random() > 0.6; // Randomly mark some as completed
        
        const goalsRef = adminDb.collection('users').doc(userId).collection('goals');
        const goalData = {
          goal: goalText,
          completed: completed,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };
        
        const docRef = await goalsRef.add(goalData);
        createdGoals.push({
          id: docRef.id,
          ...goalData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return createdGoals;
    } catch (error) {
      console.error('Error adding dummy goals:', error);
      throw new Error('Failed to add dummy goals');
    }
  }
}

export default GoalsService;