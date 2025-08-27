// lib/moduleService.js
import { adminDb } from './firebaseAdmin';

const MODULES_COLLECTION = 'modules';
const COURSES_COLLECTION = 'programs';
const BATCHES_COLLECTION = 'batches';
const ASSESSMENTS_COLLECTION = 'assessments';
const STUDENT_PROGRESS_COLLECTION = 'student_progress';
const ENROLLMENTS_COLLECTION = 'enrollments';

export class ModuleService {
  // Module CRUD operations
  static async createModule(moduleData) {
    try {
      const moduleRef = adminDb.collection(MODULES_COLLECTION).doc();
      const module = {
        ...moduleData,
        id: moduleRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await moduleRef.set(module);
      return module;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  static async getModules() {
    try {
      const snapshot = await adminDb.collection(MODULES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  static async getModuleById(moduleId) {
    try {
      const doc = await adminDb.collection(MODULES_COLLECTION).doc(moduleId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  }

  static async updateModule(moduleId, updateData) {
    try {
      const moduleRef = adminDb.collection(MODULES_COLLECTION).doc(moduleId);
      await moduleRef.update({
        ...updateData,
        updatedAt: new Date(),
      });
      return await this.getModuleById(moduleId);
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  static async deleteModule(moduleId) {
    try {
      await adminDb.collection(MODULES_COLLECTION).doc(moduleId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  // Course CRUD operations
  static async createCourse(courseData) {
    try {
      const courseRef = adminDb.collection(COURSES_COLLECTION).doc();
      const course = {
        ...courseData,
        id: courseRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await courseRef.set(course);
      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  static async getCourses() {
    try {
      const snapshot = await adminDb.collection(COURSES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  static async getCourseById(courseId) {
    try {
      const doc = await adminDb.collection(COURSES_COLLECTION).doc(courseId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  static async getCoursesByEducator(educatorId) {
    try {
      const snapshot = await adminDb.collection(COURSES_COLLECTION)
        .where('educatorId', '==', educatorId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching educator courses:', error);
      throw error;
    }
  }

  static async updateCourse(courseId, updateData) {
    try {
      const courseRef = adminDb.collection(COURSES_COLLECTION).doc(courseId);
      await courseRef.update({
        ...updateData,
        updatedAt: new Date(),
      });
      return await this.getCourseById(courseId);
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  static async deleteCourse(courseId) {
    try {
      await adminDb.collection(COURSES_COLLECTION).doc(courseId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // Assessment CRUD operations
  static async createAssessment(assessmentData) {
    try {
      const assessmentRef = adminDb.collection(ASSESSMENTS_COLLECTION).doc();
      const assessment = {
        ...assessmentData,
        id: assessmentRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await assessmentRef.set(assessment);
      return assessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  static async getAssessmentsByModule(moduleId) {
    try {
      const snapshot = await adminDb.collection(ASSESSMENTS_COLLECTION)
        .where('moduleId', '==', moduleId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching module assessments:', error);
      throw error;
    }
  }

  static async getAssessmentsByEducator(educatorId) {
    try {
      const snapshot = await adminDb.collection(ASSESSMENTS_COLLECTION)
        .where('educatorId', '==', educatorId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching educator assessments:', error);
      throw error;
    }
  }

  static async updateAssessment(assessmentId, updateData) {
    try {
      const assessmentRef = adminDb.collection(ASSESSMENTS_COLLECTION).doc(assessmentId);
      await assessmentRef.update({
        ...updateData,
        updatedAt: new Date(),
      });
      return await this.getAssessmentById(assessmentId);
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  static async getAssessmentById(assessmentId) {
    try {
      const doc = await adminDb.collection(ASSESSMENTS_COLLECTION).doc(assessmentId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching assessment:', error);
      throw error;
    }
  }

  // Student Progress operations
  static async recordStudentProgress(progressData) {
    try {
      const progressRef = adminDb.collection(STUDENT_PROGRESS_COLLECTION).doc();
      const progress = {
        ...progressData,
        id: progressRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await progressRef.set(progress);
      return progress;
    } catch (error) {
      console.error('Error recording student progress:', error);
      throw error;
    }
  }

  static async getStudentProgress(studentId, moduleId = null) {
    try {
      let query = adminDb.collection(STUDENT_PROGRESS_COLLECTION)
        .where('studentId', '==', studentId);
      
      if (moduleId) {
        query = query.where('moduleId', '==', moduleId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw error;
    }
  }

  static async updateStudentProgress(progressId, updateData) {
    try {
      const progressRef = adminDb.collection(STUDENT_PROGRESS_COLLECTION).doc(progressId);
      await progressRef.update({
        ...updateData,
        updatedAt: new Date(),
      });
      return await this.getProgressById(progressId);
    } catch (error) {
      console.error('Error updating student progress:', error);
      throw error;
    }
  }

  static async getProgressById(progressId) {
    try {
      const doc = await adminDb.collection(STUDENT_PROGRESS_COLLECTION).doc(progressId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  }

  // Module completion calculation
  static async calculateModuleCompletion(studentId, moduleId) {
    try {
      const assessments = await this.getAssessmentsByModule(moduleId);
      const progress = await this.getStudentProgress(studentId, moduleId);
      
      let totalScore = 0;
      let completedAssessments = 0;
      let examScore = 0;
      let practicalScore = 0;
      
      for (const assessment of assessments) {
        const studentProgress = progress.find(p => p.assessmentId === assessment.id);
        if (studentProgress && studentProgress.score !== null) {
          completedAssessments++;
          totalScore += studentProgress.score;
          
          if (assessment.type === 'exam') {
            examScore += studentProgress.score;
          } else if (assessment.type === 'practical') {
            practicalScore += studentProgress.score;
          }
        }
      }
      
      const totalPossibleScore = assessments.length * 100; // Assuming 100% per assessment
      const overallPercentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 200 : 0; // 200% total possible
      const isCompleted = overallPercentage >= 70; // 70% pass mark
      
      return {
        totalScore,
        overallPercentage,
        examScore,
        practicalScore,
        completedAssessments,
        totalAssessments: assessments.length,
        isCompleted,
        passMarkMet: overallPercentage >= 70
      };
    } catch (error) {
      console.error('Error calculating module completion:', error);
      throw error;
    }
  }

  // Enrollment operations
  static async enrollStudent(studentId, courseId, batchId = null) {
    try {
      // Create enrollment in subcollection
      const enrollmentRef = adminDb.collection('users').doc(studentId).collection('enrollments').doc();
      const enrollment = {
        courseId,
        batchId,
        enrolledAt: new Date(),
        status: 'active',
        id: enrollmentRef.id
      };
      
      await enrollmentRef.set(enrollment);
      
      // Update user document with batch information if batchId is provided
      if (batchId) {
        const userRef = adminDb.collection('users').doc(studentId);
        const batchDetails = await this.getBatchById(batchId);
        
        await userRef.update({
          currentBatchId: batchId,
          currentBatchName: batchDetails?.name || '',
          currentBatchDetails: {
            id: batchId,
            name: batchDetails?.name || '',
            academicYear: batchDetails?.academicYear || '',
            startDate: batchDetails?.startDate || null,
            endDate: batchDetails?.endDate || null,
            instructor: batchDetails?.instructor || ''
          },
          updatedAt: new Date()
        });
      }
      
      return enrollment;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }

  static async getStudentEnrollments(studentId) {
    try {
      // Validate studentId
      if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
        console.error('Invalid studentId provided:', studentId);
        return [];
      }

      const snapshot = await adminDb.collection('users').doc(studentId).collection('enrollments')
        .where('status', '==', 'active')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      throw error;
    }
  }

  static async getCourseEnrollments(courseId) {
    try {
      // Get all users first
      const usersSnapshot = await adminDb.collection('users').get();
      const enrollments = [];
      
      // Query each user's enrollments subcollection
      for (const userDoc of usersSnapshot.docs) {
        const userEnrollments = await adminDb.collection('users').doc(userDoc.id).collection('enrollments')
          .where('courseId', '==', courseId)
          .where('status', '==', 'active')
          .get();
        
        userEnrollments.docs.forEach(doc => {
          enrollments.push({ 
            id: doc.id, 
            studentId: userDoc.id,
            ...doc.data() 
          });
        });
      }
      
      return enrollments;
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  // Batch CRUD operations
  static async createBatch(batchData) {
    try {
      const batchRef = adminDb.collection(BATCHES_COLLECTION).doc();
      const batch = {
        ...batchData,
        id: batchRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await batchRef.set(batch);
      return batch;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  static async getBatches() {
    try {
      const snapshot = await adminDb.collection(BATCHES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  static async getBatchById(batchId) {
    try {
      const doc = await adminDb.collection(BATCHES_COLLECTION).doc(batchId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching batch:', error);
      throw error;
    }
  }

  static async updateBatch(batchId, updateData) {
    try {
      const batchRef = adminDb.collection(BATCHES_COLLECTION).doc(batchId);
      const updatedBatch = {
        ...updateData,
        updatedAt: new Date(),
      };
      await batchRef.update(updatedBatch);
      return { id: batchId, ...updatedBatch };
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }

  static async deleteBatch(batchId) {
    try {
      await adminDb.collection(BATCHES_COLLECTION).doc(batchId).delete();
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }

  // Assignment Template operations (sub-collection within modules)
  static async createAssignmentTemplate(moduleId, assignmentData) {
    try {
      const assignmentRef = adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc();
      
      const assignment = {
        ...assignmentData,
        id: assignmentRef.id,
        moduleId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false, // Templates start as inactive
        activatedAt: null,
        dueDate: null
      };
      
      await assignmentRef.set(assignment);
      return assignment;
    } catch (error) {
      console.error('Error creating assignment template:', error);
      throw error;
    }
  }

  static async getAssignmentTemplates(moduleId) {
    try {
      const snapshot = await adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching assignment templates:', error);
      throw error;
    }
  }

  static async activateAssignment(moduleId, assignmentId, dueDate, educatorId) {
    try {
      const assignmentRef = adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc(assignmentId);
      
      const updateData = {
        isActive: true,
        activatedAt: new Date(),
        dueDate: new Date(dueDate),
        updatedAt: new Date()
      };
      
      // Only add activatedBy if educatorId is provided
      if (educatorId) {
        updateData.activatedBy = educatorId;
      }
      
      await assignmentRef.update(updateData);
      
      return await this.getAssignmentTemplateById(moduleId, assignmentId);
    } catch (error) {
      console.error('Error activating assignment:', error);
      throw error;
    }
  }

  static async deactivateAssignment(moduleId, assignmentId) {
    try {
      const assignmentRef = adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc(assignmentId);
      
      await assignmentRef.update({
        isActive: false,
        dueDate: null,
        updatedAt: new Date()
      });
      
      return await this.getAssignmentTemplateById(moduleId, assignmentId);
    } catch (error) {
      console.error('Error deactivating assignment:', error);
      throw error;
    }
  }

  static async getAssignmentTemplateById(moduleId, assignmentId) {
    try {
      const doc = await adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc(assignmentId)
        .get();
      
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching assignment template:', error);
      throw error;
    }
  }

  static async getActiveAssignmentsByStudent(studentId) {
    try {
      // Get student's enrolled courses
      const enrollments = await this.getStudentEnrollments(studentId);
      const activeAssignments = [];
      
      for (const enrollment of enrollments) {
        if (enrollment.courseId) {
          // Get the course/program details to access modules
          const courseDoc = await adminDb.collection(COURSES_COLLECTION).doc(enrollment.courseId).get();
          if (courseDoc.exists) {
            const courseData = courseDoc.data();
            if (courseData.moduleIds && Array.isArray(courseData.moduleIds)) {
              // Get each module and its assignments
              for (const moduleId of courseData.moduleIds) {
                const moduleDoc = await adminDb.collection(MODULES_COLLECTION).doc(moduleId).get();
                if (moduleDoc.exists) {
                  const moduleData = moduleDoc.data();
                  const assignments = await this.getAssignmentTemplates(moduleId);
                  const activeModuleAssignments = assignments
                    .filter(a => a.isActive)
                    .map(assignment => ({
                      ...assignment,
                      moduleId: moduleId,
                      moduleName: moduleData.title || moduleData.name
                    }));
                  activeAssignments.push(...activeModuleAssignments);
                }
              }
            }
          }
        }
      }
      
      return activeAssignments;
    } catch (error) {
      console.error('Error fetching active assignments for student:', error);
      throw error;
    }
  }

  static async updateAssignmentTemplate(moduleId, assignmentId, updateData) {
    try {
      const assignmentRef = adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc(assignmentId);
      
      await assignmentRef.update({
        ...updateData,
        updatedAt: new Date()
      });
      
      return await this.getAssignmentTemplateById(moduleId, assignmentId);
    } catch (error) {
      console.error('Error updating assignment template:', error);
      throw error;
    }
  }

  static async deleteAssignmentTemplate(moduleId, assignmentId) {
    try {
      await adminDb.collection(MODULES_COLLECTION)
        .doc(moduleId)
        .collection('assignment_templates')
        .doc(assignmentId)
        .delete();
      return true;
    } catch (error) {
      console.error('Error deleting assignment template:', error);
      throw error;
    }
  }

  // Student Self-Assessment operations
  static async getStudentSelfAssessment(studentId, moduleId, assignmentId) {
    try {
      const selfAssessmentRef = adminDb.collection('student_self_assessments')
        .where('studentId', '==', studentId)
        .where('moduleId', '==', moduleId)
        .where('assignmentId', '==', assignmentId)
        .limit(1);
      
      const snapshot = await selfAssessmentRef.get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching student self-assessment:', error);
      throw error;
    }
  }

  static async updateStudentSelfAssessment(selfAssessmentData) {
    try {
      const { studentId, moduleId, assignmentId } = selfAssessmentData;
      
      // Check if self-assessment already exists
      const existingAssessment = await this.getStudentSelfAssessment(studentId, moduleId, assignmentId);
      
      // Ensure fileUrl is included in the data structure
      const assessmentData = {
        ...selfAssessmentData,
        fileUrl: selfAssessmentData.fileUrl || ''
      };
      
      if (existingAssessment) {
        // Update existing self-assessment
        const assessmentRef = adminDb.collection('student_self_assessments').doc(existingAssessment.id);
        await assessmentRef.update({
          ...assessmentData,
          updatedAt: new Date()
        });
        
        return await this.getStudentSelfAssessment(studentId, moduleId, assignmentId);
      } else {
        // Create new self-assessment
        const assessmentRef = adminDb.collection('student_self_assessments').doc();
        const assessment = {
          ...assessmentData,
          id: assessmentRef.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await assessmentRef.set(assessment);
        return assessment;
      }
    } catch (error) {
      console.error('Error updating student self-assessment:', error);
      throw error;
    }
  }

  /**
   * Save AI assessment result
   * @param {Object} aiAssessmentData - AI assessment data
   */
  static async saveAIAssessment(aiAssessmentData) {
    try {
      const assessmentRef = adminDb.collection('ai_assessments').doc();
      const assessment = {
        ...aiAssessmentData,
        id: assessmentRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await assessmentRef.set(assessment);
      return { success: true, id: assessmentRef.id };
    } catch (error) {
      console.error('Error saving AI assessment:', error);
      throw error;
    }
  }

  /**
   * Get AI assessment for a student
   * @param {string} studentId - Student ID
   * @param {string} moduleId - Module ID
   * @param {string} assignmentId - Assignment ID
   */
  static async getAIAssessment(studentId, moduleId, assignmentId) {
    try {
      const snapshot = await adminDb.collection('ai_assessments')
        .where('studentId', '==', studentId)
        .where('moduleId', '==', moduleId)
        .where('assignmentId', '==', assignmentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting AI assessment:', error);
      throw error;
    }
  }

  /**
   * Get assignment template by ID
   * @param {string} assignmentId - Assignment template ID
   */
  static async getAssignmentTemplate(assignmentId) {
    try {
      const doc = await adminDb.collection('assignment_templates').doc(assignmentId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting assignment template:', error);
      throw error;
    }
  }
}

export default ModuleService;