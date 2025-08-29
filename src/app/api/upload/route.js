// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { uploadPDF } from '@/lib/fileUpload';

// POST /api/upload - Handle file uploads
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    console.log('📤 Processing file upload for user:', user.uid);

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    const assignmentId = formData.get('assignmentId');
    const moduleId = formData.get('moduleId');
    const type = formData.get('type') || 'assignment-submission';

    // Validate inputs
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!assignmentId || !moduleId) {
      return NextResponse.json({
        success: false,
        error: 'assignmentId and moduleId are required'
      }, { status: 400 });
    }

    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      assignmentId,
      moduleId
    });

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 10MB'
      }, { status: 400 });
    }

    // Validate file type (allow common document types)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Only PDF, DOC, DOCX, and TXT files are allowed'
      }, { status: 400 });
    }

    try {
      // Create a organized folder structure for uploads
      const folder = `student-uploads/${user.uid}/${moduleId}/${assignmentId}`;
      
      // Upload file using the existing uploadPDF function (it works for all file types despite the name)
      const uploadResult = await uploadPDF(file, folder);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      console.log('✅ File uploaded successfully:', {
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize
      });

      return NextResponse.json({
        success: true,
        fileUrl: uploadResult.filePath,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        storagePath: uploadResult.storagePath,
        message: 'File uploaded successfully'
      }, { status: 200 });

    } catch (uploadError) {
      console.error('❌ File upload failed:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file: ' + uploadError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in upload endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during file upload'
    }, { status: 500 });
  }
}

// GET /api/upload - Get upload information
export async function GET(request) {
  return NextResponse.json({
    message: 'File Upload API',
    supportedTypes: ['PDF', 'DOC', 'DOCX', 'TXT'],
    maxSize: '10MB',
    usage: 'POST request with multipart/form-data containing file, assignmentId, and moduleId'
  });
}