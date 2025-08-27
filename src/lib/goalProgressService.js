// lib/goalProgressService.js
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Service for managing goal progress tracking in Firebase
 */
export class GoalProgressService {
  /**
   * Save or update goal progress for a specific user and module
   * @param {string} userId - User ID
   * @param {string} moduleName - Module name
   * @param {string} goalId - Goal ID
   * @param {boolean} completed - Whether the goal is completed
   * @param {number} progress - Progress percentage (0-100)
   */
  static async updateGoalProgress(userId, moduleName, goalId, completed, progress = null) {
    try {
      const progressDocId = `${userId}_${moduleName}_${goalId}`;
      const progressRef = doc(db, 'goalProgress', progressDocId);
      
      const progressData = {
        userId,
        moduleName,
        goalId,
        completed,
        progress: progress !== null ? progress : (completed ? 100 : 0),
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date()
      };
      
      await setDoc(progressRef, progressData, { merge: true });
      return { success: true, data: progressData };
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get goal progress for a specific user and module
   * @param {string} userId - User ID
   * @param {string} moduleName - Module name
   * @returns {Object} Progress data for all goals in the module
   */
  static async getModuleProgress(userId, moduleName) {
    try {
      const userProgressRef = collection(db, 'goalProgress');
      const q = query(
        userProgressRef,
        where('userId', '==', userId),
        where('moduleName', '==', moduleName)
      );
      
      const querySnapshot = await getDocs(q);
      const moduleProgress = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        moduleProgress[data.goalId] = {
          completed: data.completed || false,
          progress: data.progress || 0,
          lastUpdated: data.lastUpdated
        };
      });
      
      return moduleProgress;
    } catch (error) {
      console.error('Error getting module progress:', error);
      return {};
    }
  }

  /**
   * Get overall progress for a module based on completed goals
   * @param {string} userId - User ID
   * @param {string} moduleName - Module name
   * @param {number} totalGoals - Total number of goals in the module
   * @returns {number} Overall progress percentage
   */
  static async calculateModuleProgress(userId, moduleName, totalGoals) {
    try {
      const progressResult = await this.getModuleProgress(userId, moduleName);
      
      if (!progressResult.success) {
        return 0;
      }
      
      const progressData = progressResult.data;
      const completedGoals = Object.values(progressData).filter(goal => goal.completed).length;
      
      return totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    } catch (error) {
      console.error('Error calculating module progress:', error);
      return 0;
    }
  }

  /**
   * Get progress for all modules for a user
   * @param {string} userId - User ID
   * @returns {Object} Progress data for all modules
   */
  static async getAllUserProgress(userId) {
    try {
      const progressQuery = query(
        collection(db, 'goalProgress'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(progressQuery);
      const allProgress = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const moduleName = data.moduleName;
        
        if (!allProgress[moduleName]) {
          allProgress[moduleName] = {};
        }
        
        allProgress[moduleName][data.goalId] = {
          completed: data.completed || false,
          progress: data.progress || 0,
          lastUpdated: data.lastUpdated
        };
      });
      
      return allProgress;
    } catch (error) {
      console.error('Error getting all user progress:', error);
      return {};
    }
  }

  /**
   * Toggle goal completion status
   * @param {string} userId - User ID
   * @param {string} moduleName - Module name
   * @param {string} goalId - Goal ID
   * @param {boolean} currentStatus - Current completion status
   * @returns {Object} Updated progress data
   */
  static async toggleGoalCompletion(userId, moduleName, goalId, currentStatus) {
    const newStatus = !currentStatus;
    return await this.updateGoalProgress(userId, moduleName, goalId, newStatus);
  }

  /**
     * Toggle goal completion status with enhanced progress calculation
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {string} goalId - Goal ID
     * @param {Object} goalData - Optional goal data for progress calculation
     * @returns {Object} Updated progress data
     */
    static async toggleGoalCompletionEnhanced(userId, moduleName, goalId, goalData = null) {
       const progressDocId = `${userId}_${moduleName}_${goalId}`;
       const progressRef = doc(db, 'goalProgress', progressDocId);
       
       try {
         const currentDoc = await getDoc(progressRef);
         const currentProgress = currentDoc.exists() ? currentDoc.data() : { completed: false, progress: 0 };
         const isCompleted = !currentProgress.completed;
         
         let progressPercentage = 0;
         if (isCompleted) {
           progressPercentage = 100;
         } else if (goalData) {
           // Calculate progress based on days if goal data is provided
           const totalDays = GoalProgressService.calculateTotalDays(
             new Date(), 
             goalData.target_completion_date
           );
           progressPercentage = GoalProgressService.calculateProgress(
             false, 
             goalData.days_remaining, 
             totalDays
           );
         }
         
         const newStatus = {
           completed: isCompleted,
           progress: progressPercentage,
           lastUpdated: new Date().toISOString(),
           userId: userId,
           moduleName: moduleName,
           goalId: goalId
         };
         
         await setDoc(progressRef, newStatus, { merge: true });
         
         return { 
           success: true, 
           data: newStatus
         };
       } catch (error) {
         console.error('Error toggling goal completion:', error);
         return { success: false, error: error.message };
       }
     }

  /**
   * Calculate progress based on completion status and days
   * @param {boolean} isCompleted - Whether the goal is completed
   * @param {number} daysRemaining - Days remaining to complete the goal
   * @param {number} totalDays - Total days allocated for the goal
   * @returns {number} Progress percentage (0-100)
   */
  static calculateProgress(isCompleted, daysRemaining, totalDays) {
    if (isCompleted) return 100;
    
    // If no total days specified, use a default calculation
    if (!totalDays || totalDays <= 0) {
      return isCompleted ? 100 : 0;
    }
    
    const daysPassed = totalDays - daysRemaining;
    const progressPercentage = Math.min((daysPassed / totalDays) * 100, 100);
    return Math.max(progressPercentage, 0);
  }
  
  /**
   * Calculate total days from start date to target date
   * @param {string|Date} startDate - Start date
   * @param {string|Date} targetDate - Target date
   * @returns {number} Total days between dates
   */
  static calculateTotalDays(startDate, targetDate) {
    const start = new Date(startDate);
    const target = new Date(targetDate);
    const diffTime = Math.abs(target - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export default GoalProgressService;