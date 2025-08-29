import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import ModuleService from '@/lib/moduleService';
import { uploadPDF } from '@/lib/fileUpload';

// POST /api/modules/[id]/assignment-templates/[assignmentId]/activate - Activate assignment with due date and optional PDF
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { id: moduleId, assignmentId } = await params;
    
    // Check if request contains file upload (FormData) or regular JSON
    const contentType = request.headers.get('content-type');
    let dueDate;
    let pdfInfo = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      dueDate = formData.get('dueDate');
      const pdfFile = formData.get('pdfFile');
      
      if (pdfFile && pdfFile.size > 0) {
        const uploadResult = await uploadPDF(pdfFile, 'assessments');
        if (uploadResult.success) {
          pdfInfo = {
            filePath: uploadResult.filePath, // Firebase Storage download URL
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            storagePath: uploadResult.storagePath, // For deletion purposes
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.uid
          };
        } else {
          return NextResponse.json({ error: uploadResult.error }, { status: 400 });
        }
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      dueDate = body.dueDate;
    }
    
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }
    
    const assignmentTemplate = await ModuleService.activateAssignment(moduleId, assignmentId, dueDate, user.uid, pdfInfo);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Assignment activated successfully',
      assignmentTemplate 
    }, { status: 200 });
  } catch (error) {
    console.error('Error activating assignment:', error);
    return NextResponse.json({ error: 'Failed to activate assignment' }, { status: 500 });
  }
}

// DELETE /api/modules/[id]/assignment-templates/[assignmentId]/activate - Deactivate assignment
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    
    const assignmentTemplate = await ModuleService.deactivateAssignment(moduleId, assignmentId);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Assignment deactivated successfully',
      assignmentTemplate 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deactivating assignment:', error);
    return NextResponse.json({ error: 'Failed to deactivate assignment' }, { status: 500 });
  }
}