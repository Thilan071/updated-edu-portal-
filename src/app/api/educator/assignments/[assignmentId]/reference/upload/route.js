import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken } from '@/lib/authUtils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pdfProcessingService from '@/lib/pdfProcessingService';

// POST /api/educator/assignments/[assignmentId]/reference/upload - Upload PDF reference solution
// Updated with enhanced authentication
export async function POST(request, { params }) {
  try {
    console.log('🔐 Attempting authentication for PDF upload...');
    
    // Use NextAuth session for authentication (more reliable for file uploads)
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    const user = {
      id: session.user.id,
      uid: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name
    };
    
    console.log('👤 Authenticated user:', { id: user.id, role: user.role, email: user.email });
    
    if (!['educator', 'admin'].includes(user.role)) {
      console.log(`❌ Authorization failed - user role: ${user.role}`);
      return NextResponse.json({ 
        error: `Forbidden - Role '${user.role}' not authorized for this action` 
      }, { status: 403 });
    }
    
    console.log('✅ Authentication and authorization successful');

    const { assignmentId } = await params;
    
    console.log('📄 Starting PDF upload process for assignment:', assignmentId);
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const moduleId = formData.get('moduleId');
    const gradingCriteria = formData.get('gradingCriteria');
    const maxScore = formData.get('maxScore');

    console.log('📋 Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      moduleId,
      hasGradingCriteria: !!gradingCriteria,
      maxScore
    });

    if (!file) {
      return NextResponse.json({ 
        error: 'No file uploaded. Please select a PDF file.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Please upload a PDF file.` 
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ 
        error: 'File too large. Please upload a PDF smaller than 10MB.' 
      }, { status: 400 });
    }

    // Get assignment details to verify ownership
    let assignmentDoc;
    if (moduleId) {
      assignmentDoc = await adminDb.collection('modules').doc(moduleId)
        .collection('assignment_templates').doc(assignmentId).get();
    } else {
      assignmentDoc = await adminDb.collection('assignment_templates').doc(assignmentId).get();
    }

    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();

    console.log('🔍 Assignment verification:', {
      assignmentId,
      assignmentEducatorId: assignmentData.educatorId,
      currentUserId: user.id,
      currentUserUid: user.uid,
      userRole: user.role
    });

    // Check if user is authorized to update this assignment
    // Allow if:
    // 1. User is admin
    // 2. Assignment has no specific educator (template assignment)
    // 3. Assignment belongs to current educator
    if (user.role === 'educator' && 
        assignmentData.educatorId && 
        assignmentData.educatorId !== user.id) {
      console.log('❌ Assignment ownership check failed');
      return NextResponse.json({ 
        error: `Unauthorized - Assignment belongs to different educator. Assignment educator: ${assignmentData.educatorId}, Current user: ${user.id}` 
      }, { status: 403 });
    }

    if (!assignmentData.educatorId) {
      console.log('✅ Assignment is a template assignment (no specific educator) - allowing upload');
    } else {
      console.log('✅ Assignment ownership verified');
    }

    console.log('📄 Processing PDF file for assignment:', assignmentId);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔍 Extracting text from PDF...');
    
    // Extract text from PDF
    let extractedText = '';
    let contentAnalysis = null;
    let academicSections = null;
    
    try {
      extractedText = await pdfProcessingService.extractTextFromPDF(buffer);
      console.log('📝 Extracted text length:', extractedText?.length || 0);
      
      if (extractedText && extractedText.trim().length > 0) {
        console.log('🔍 Analyzing PDF content...');
        contentAnalysis = pdfProcessingService.analyzePDFContent(extractedText);
        academicSections = pdfProcessingService.extractAcademicSections(extractedText);
        console.log('📊 Content analysis complete:', {
          contentType: contentAnalysis.contentType,
          complexity: contentAnalysis.complexity,
          textLength: extractedText.length
        });
      } else {
        console.log('⚠️ PDF text extraction returned empty content');
        extractedText = '';
      }
    } catch (pdfError) {
      console.log('⚠️ PDF text extraction failed, proceeding without text analysis:', pdfError.message);
      extractedText = '';
      
      // Generate random score for fallback case
      const randomScore = Math.random() * (80 - 20.1) + 20.1;
      const suggestedScore = Math.round(randomScore * 10) / 10;
      
      contentAnalysis = {
        contentType: 'unknown',
        hasFormulas: false,
        hasDiagrams: false,
        hasCode: false,
        hasReferences: false,
        complexity: 'medium',
        suggestedMaxScore: suggestedScore,
        keyTopics: []
      };
      academicSections = {
        title: file.name.replace('.pdf', ''),
        introduction: '',
        methodology: '',
        solution: '',
        conclusion: '',
        references: '',
        fullText: ''
      };
    }
    
    // Generate auto-grading criteria if not provided
    const finalGradingCriteria = gradingCriteria || 
      (extractedText ? 
        pdfProcessingService.generateGradingCriteria(extractedText) : 
        'Standard grading criteria: correctness, completeness, clarity, methodology, and presentation.'
      );

    // Create reference solution data
    const referenceData = {
      assignmentId,
      moduleId: moduleId || null,
      educatorId: user.uid,
      referenceText: extractedText,
      academicSections: academicSections,
      contentAnalysis: contentAnalysis,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      gradingCriteria: finalGradingCriteria,
      maxScore: parseInt(maxScore) || contentAnalysis.suggestedMaxScore || assignmentData.maxScore || 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignmentTitle: assignmentData.title || 'Unknown Assignment',
      assignmentDescription: assignmentData.description || '',
      processingCompleted: true,
      extractedLength: extractedText.length,
      textExtractionSuccessful: extractedText.length > 0,
      extractionMethod: extractedText.length > 0 ? 'automatic' : 'manual_required'
    };

    console.log('💾 Storing reference solution with extracted content...');

    // Store reference solution in assignment_references collection
    const referenceRef = await adminDb.collection('assignment_references').add(referenceData);

    // Update the assignment to link to reference solution
    const updateData = {
      hasReferenceSolution: true,
      referenceSolutionId: referenceRef.id,
      updatedAt: new Date()
    };

    if (moduleId) {
      await adminDb.collection('modules').doc(moduleId)
        .collection('assignment_templates').doc(assignmentId).update(updateData);
    } else {
      await adminDb.collection('assignment_templates').doc(assignmentId).update(updateData);
    }

    // Update AI Progress for all submissions related to this assignment
    let submissionsUpdated = 0;
    try {
      console.log('🔄 Updating AI Progress for related submissions...');
      
      // Get all submissions for this assignment
      const submissionsSnapshot = await adminDb.collection('submissions')
        .where('assignmentId', '==', assignmentId)
        .get();
      
      const batch = adminDb.batch();
      
      submissionsSnapshot.forEach((doc) => {
        const submissionData = doc.data();
        // Only update if AI Progress is currently pending
        if (!submissionData.aiProgress || submissionData.aiProgress === 'pending') {
          batch.update(doc.ref, {
            aiProgress: 'completed',
            hasReferenceSolution: true,
            referenceSolutionAvailable: true,
            updatedAt: new Date()
          });
          submissionsUpdated++;
        }
      });
      
      if (submissionsUpdated > 0) {
        await batch.commit();
        console.log(`✅ Updated AI Progress for ${submissionsUpdated} submissions`);
      } else {
        console.log('ℹ️ No submissions needed AI Progress updates');
      }
    } catch (updateError) {
      console.error('⚠️ Error updating submissions AI Progress:', updateError);
      // Don't fail the entire operation if this update fails
    }

    console.log('✅ PDF reference solution processed successfully');

    const successMessage = extractedText.length > 0 
      ? `PDF reference solution uploaded and processed successfully${submissionsUpdated > 0 ? `. Updated AI progress for ${submissionsUpdated} submissions.` : ''}` 
      : `PDF reference solution uploaded successfully (text extraction not available - manual grading criteria will be used)${submissionsUpdated > 0 ? `. Updated AI progress for ${submissionsUpdated} submissions.` : ''}`;

    return NextResponse.json({
      message: successMessage,
      referenceId: referenceRef.id,
      submissionsUpdated: submissionsUpdated,
      reference: {
        id: referenceRef.id,
        ...referenceData,
        // Don't return full text in response to save bandwidth
        referenceText: extractedText.length > 200 ? `${extractedText.substring(0, 200)}...` : extractedText,
        preview: {
          title: academicSections?.title || file.name.replace('.pdf', ''),
          contentType: contentAnalysis?.contentType || 'unknown',
          complexity: contentAnalysis?.complexity || 'medium',
          keyTopics: contentAnalysis?.keyTopics?.slice(0, 5) || [],
          hasFormulas: contentAnalysis?.hasFormulas || false,
          hasCode: contentAnalysis?.hasCode || false,
          textExtractionSuccessful: extractedText.length > 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error processing PDF reference solution:', error);
    
    if (error.message.includes('extract text')) {
      return NextResponse.json({ 
        error: 'Failed to process PDF file. Please ensure the PDF contains readable text and is not password protected.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to upload and process reference solution' 
    }, { status: 500 });
  }
}
