/**
 * ML API Client for EduBoost Educational Platform
 * Connects to the Flask ML backend for AI-powered features
 */

class MLApiClient {
  constructor() {
    this.baseURL = process.env.ML_API_URL || 'http://localhost:5000';
  }

  /**
   * Get AI-generated personalized learning goals for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Object>} Goals data with completion stats and recommendations
   */
  async getStudentGoals(studentId) {
    try {
      // Use Next.js API route as proxy to handle authentication and CORS
      const response = await fetch(`/api/ml/goals/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student goals:', error);
      throw error;
    }
  }

  /**
   * Get module-specific goals for repeat preparation
   * @param {string} studentId - The student ID
   * @param {string} moduleName - The module name to filter goals
   * @returns {Promise<Array>} Filtered goals for the specific module
   */
  async getModuleGoals(studentId, moduleName) {
    try {
      const goalsData = await this.getStudentGoals(studentId);
      
      // Filter goals for the specific module
      const moduleGoals = goalsData.goals.filter(goal => 
        goal.module_name === moduleName
      );

      return {
        goals: moduleGoals,
        completion_stats: goalsData.completion_stats,
        recommendations: goalsData.recommendations,
        student_id: studentId,
        module_name: moduleName
      };
    } catch (error) {
      console.error('Error fetching module goals:', error);
      throw error;
    }
  }

  /**
   * Get student performance analysis
   * @param {string} studentId - The student ID
   * @returns {Promise<Object>} Performance analysis data
   */
  async getStudentPerformance(studentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/students/${studentId}/performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student performance:', error);
      throw error;
    }
  }

  /**
   * Get personalized study planner
   * @param {string} studentId - The student ID
   * @returns {Promise<Object>} Personalized study planner data
   */
  async getStudentPlanner(studentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/students/${studentId}/planner`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student planner:', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   * @param {string} goalId - The goal ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<Object>} Updated goal data
   */
  async updateGoalProgress(goalId, progress) {
    try {
      const response = await fetch(`${this.baseURL}/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Make ML prediction for student performance
   * @param {Object} studentData - Student performance data
   * @returns {Promise<Object>} ML prediction results
   */
  async makePrediction(studentData) {
    try {
      const response = await fetch(`${this.baseURL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error making ML prediction:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const mlApiClient = new MLApiClient();
export default mlApiClient;