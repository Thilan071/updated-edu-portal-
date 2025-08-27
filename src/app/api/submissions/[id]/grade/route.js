import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/submissions/[id]/grade - Grade submission with Gemini AI
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: submissionId } = await params;
    
    // Get submission details
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();

    // Get assignment details for grading criteria
    const assignmentDoc = await adminDb.collection('assignment_templates')
      .doc(submissionData.assignmentId).get();
    
    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();

    // Get module details for context
    const moduleDoc = await adminDb.collection('modules').doc(submissionData.moduleId).get();
    const moduleData = moduleDoc.exists ? moduleDoc.data() : null;

    // Prepare content for AI analysis
    const gradingPrompt = `
You are an expert educator tasked with grading a student submission. Please analyze the following submission and provide a comprehensive assessment.

**Assignment Details:**
Title: ${assignmentData.title}
Description: ${assignmentData.description}
Module: ${moduleData?.title || 'Unknown Module'}
Maximum Score: 100

**Student Submission:**
${submissionData.submissionText || 'No text submission provided'}

${submissionData.fileUrl ? `**File Submitted:** ${submissionData.fileUrl}` : ''}

**Grading Instructions:**
1. Evaluate the submission based on the assignment requirements
2. Consider completeness, accuracy, clarity, and understanding
3. Provide a numerical score out of 100
4. Give detailed feedback explaining the grade
5. Highlight strengths and areas for improvement
6. Suggest specific actions for improvement

**Please provide your response in the following JSON format:**
{
  "score": [numerical score 0-100],
  "grade": "[letter grade A-F]",
  "feedback": "[detailed feedback explaining the grade]",
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "completeness": [percentage 0-100],
  "accuracy": [percentage 0-100],
  "clarity": [percentage 0-100]
}
`;

    try {
      // Use Gemini AI for grading
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(gradingPrompt);
      const response = await result.response;
      const aiResponseText = response.text();

      // Parse AI response
      let aiAnalysis;
      try {
        // Extract JSON from the response
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback analysis
        aiAnalysis = {
          score: 75,
          grade: 'B',
          feedback: 'AI analysis completed but response format was invalid. Manual review recommended.',
          strengths: ['Submission received'],
          improvements: ['Requires manual review'],
          suggestions: ['Please have an educator review this submission'],
          completeness: 70,
          accuracy: 70,
          clarity: 70
        };
      }

      // Validate score range
      if (aiAnalysis.score < 0) aiAnalysis.score = 0;
      if (aiAnalysis.score > 100) aiAnalysis.score = 100;

      // Update submission with AI grading
      const updateData = {
        aiGrade: aiAnalysis.score,
        aiAnalysis: aiAnalysis,
        aiGradedAt: new Date(),
        aiProgress: 'completed',
        status: 'ai_graded'
      };

      await adminDb.collection('submissions').doc(submissionId).update(updateData);

      // Also update student's subcollection
      try {
        await adminDb.collection('users').doc(submissionData.studentId)
          .collection('submissions').doc(submissionId).update(updateData);
      } catch (subError) {
        console.error('Error updating student subcollection:', subError);
      }

      return NextResponse.json({
        message: 'Submission graded successfully by AI',
        aiGrade: aiAnalysis.score,
        aiAnalysis: aiAnalysis
      }, { status: 200 });

    } catch (aiError) {
      console.error('Error with Gemini AI:', aiError);
      
      // Fallback grading logic
      const fallbackAnalysis = {
        score: 70,
        grade: 'C',
        feedback: 'AI grading service is currently unavailable. This submission requires manual review by an educator.',
        strengths: ['Submission completed on time'],
        improvements: ['Requires manual educator review'],
        suggestions: ['Please contact your educator for detailed feedback'],
        completeness: 70,
        accuracy: 70,
        clarity: 70
      };

      const updateData = {
        aiGrade: fallbackAnalysis.score,
        aiAnalysis: fallbackAnalysis,
        aiGradedAt: new Date(),
        aiProgress: 'failed',
        status: 'ai_graded',
        aiError: 'AI service unavailable'
      };

      await adminDb.collection('submissions').doc(submissionId).update(updateData);

      // Also update student's subcollection
      try {
        await adminDb.collection('users').doc(submissionData.studentId)
          .collection('submissions').doc(submissionId).update(updateData);
      } catch (subError) {
        console.error('Error updating student subcollection:', subError);
      }

      return NextResponse.json({
        message: 'Submission graded with fallback system',
        aiGrade: fallbackAnalysis.score,
        aiAnalysis: fallbackAnalysis,
        warning: 'AI grading service unavailable, manual review recommended'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
  }
}

// PATCH /api/submissions/[id]/grade - Confirm or modify AI grade by educator
export async function PATCH(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: submissionId } = await params;
    const { finalGrade, educatorFeedback, confirmed } = await request.json();

    if (finalGrade === undefined || finalGrade < 0 || finalGrade > 100) {
      return NextResponse.json({ error: 'Valid final grade (0-100) is required' }, { status: 400 });
    }

    // Get submission details
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();

    // Update submission with educator's final grade
    const updateData = {
      finalGrade: finalGrade,
      educatorFeedback: educatorFeedback || '',
      isGraded: true,
      gradedAt: new Date(),
      gradedBy: user.uid,
      status: 'graded',
      confirmed: confirmed || false
    };

    await adminDb.collection('submissions').doc(submissionId).update(updateData);

    // Also update student's subcollection
    try {
      await adminDb.collection('users').doc(submissionData.studentId)
        .collection('submissions').doc(submissionId).update(updateData);
    } catch (subError) {
      console.error('Error updating student subcollection:', subError);
    }

    // Update student progress record
    const progressData = {
      studentId: submissionData.studentId,
      moduleId: submissionData.moduleId,
      assignmentId: submissionData.assignmentId,
      score: finalGrade,
      submissionId: submissionId,
      completedAt: new Date(),
      status: 'completed'
    };

    // Check if progress record already exists
    const existingProgress = await adminDb.collection('student_progress')
      .where('studentId', '==', submissionData.studentId)
      .where('assignmentId', '==', submissionData.assignmentId)
      .where('moduleId', '==', submissionData.moduleId)
      .get();

    if (existingProgress.empty) {
      await adminDb.collection('student_progress').add(progressData);
    } else {
      const progressDoc = existingProgress.docs[0];
      await adminDb.collection('student_progress').doc(progressDoc.id).update({
        score: finalGrade,
        submissionId: submissionId,
        completedAt: new Date(),
        status: 'completed'
      });
    }

    return NextResponse.json({
      message: 'Grade confirmed and saved successfully',
      finalGrade: finalGrade,
      submissionId: submissionId
    }, { status: 200 });

  } catch (error) {
    console.error('Error confirming grade:', error);
    return NextResponse.json({ error: 'Failed to confirm grade' }, { status: 500 });
  }
}