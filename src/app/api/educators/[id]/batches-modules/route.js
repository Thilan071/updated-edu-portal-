import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators/[id]/batches-modules - Get batches and modules for filtering students
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: educatorId } = await params;
    
    // Get all batches
    const batchesSnapshot = await adminDb.collection('batches').get();
    const batchesData = [];
    
    for (const batchDoc of batchesSnapshot.docs) {
      const batchData = { id: batchDoc.id, ...batchDoc.data() };
      
      // Get the program for this batch to get its modules
      if (batchData.programId) {
        const programDoc = await adminDb.collection('programs').doc(batchData.programId).get();
        if (programDoc.exists) {
          const programData = programDoc.data();
          batchData.program = {
            id: batchDoc.data().programId,
            title: programData.title,
            moduleIds: programData.moduleIds || []
          };
          
          // Get module details
          const modules = [];
          if (programData.moduleIds && programData.moduleIds.length > 0) {
            for (const moduleId of programData.moduleIds) {
              const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
              if (moduleDoc.exists) {
                modules.push({
                  id: moduleDoc.id,
                  ...moduleDoc.data()
                });
              }
            }
          }
          batchData.modules = modules;
        }
      }
      
      // Count enrolled students in this batch
      const usersSnapshot = await adminDb.collection('users')
        .where('role', '==', 'student')
        .where('currentBatchId', '==', batchDoc.id)
        .get();
      
      batchData.currentStudents = usersSnapshot.docs.length;
      batchesData.push(batchData);
    }
    
    return NextResponse.json({ data: batchesData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching batches and modules:', error);
    return NextResponse.json({ error: 'Failed to fetch batches and modules' }, { status: 500 });
  }
}
