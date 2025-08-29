import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

export async function POST(request) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAPIRequest(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const adminUser = authResult.user;

    const body = await request.json();
    const {
      message,
      targetGroup, // 'students', 'educators', 'all'
      targetFilters, // object with batch, module, repeatStatus, riskLevel, etc.
      scheduleDate
    } = body;

    // Validate required fields
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!targetGroup || !['students', 'educators', 'all'].includes(targetGroup)) {
      return NextResponse.json({ error: 'Invalid target group' }, { status: 400 });
    }

    // Create notification document
    const notification = {
      message: message.trim(),
      targetGroup,
      targetFilters: targetFilters || {},
      createdAt: new Date(),
      createdBy: adminUser.uid,
      createdByName: adminUser.name || adminUser.email,
      scheduleDate: scheduleDate ? new Date(scheduleDate) : new Date(),
      status: scheduleDate ? 'scheduled' : 'sent',
      recipients: [], // Will be populated when notification is processed
      readBy: [], // Track who has read the notification
      isActive: true
    };

    // Save notification to Firebase
    const docRef = await adminDb.collection('notifications').add(notification);
    
    // If immediate notification, process recipients
    if (!scheduleDate) {
      await processNotificationRecipients(docRef.id, notification);
    }

    return NextResponse.json({
      success: true,
      notificationId: docRef.id,
      message: scheduleDate ? 'Notification scheduled successfully' : 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userType = url.searchParams.get('userType'); // 'student' or 'educator'
    const userId = url.searchParams.get('userId');
    const isAdmin = url.searchParams.get('admin') === 'true';

    if (isAdmin) {
      // Admin request - authenticate admin
      const authResult = await authenticateAPIRequest(request, ['admin']);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Return all notifications for admin view
      const snapshot = await adminDb.collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
        scheduleDate: doc.data().scheduleDate?.toDate?.() || null
      }));

      return NextResponse.json({ success: true, notifications });
    } else {
      // Student/Educator request
      if (!userType || !userId) {
        return NextResponse.json({ error: 'User type and ID required' }, { status: 400 });
      }

      // Authenticate user
      const authResult = await authenticateAPIRequest(request, [userType]);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Get notifications for this user
      const notifications = await getNotificationsForUser(userId, userType);
      
      return NextResponse.json({ success: true, notifications });
    }

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { notificationId, userId } = body;

    if (!notificationId || !userId) {
      return NextResponse.json({ error: 'Notification ID and User ID required' }, { status: 400 });
    }

    // Update the notification to mark as read by this user
    const notificationRef = adminDb.collection('notifications').doc(notificationId);
    
    await notificationRef.update({
      readBy: adminDb.FieldValue.arrayUnion(userId),
      lastReadAt: new Date()
    });

    return NextResponse.json({ success: true, message: 'Notification marked as read' });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

// Helper function to process notification recipients
async function processNotificationRecipients(notificationId, notification) {
  try {
    const recipients = [];
    
    // Get target users based on filters
    if (notification.targetGroup === 'all' || notification.targetGroup === 'students') {
      const students = await getFilteredStudents(notification.targetFilters);
      recipients.push(...students.map(s => ({ userId: s.id, userType: 'student', ...s })));
    }
    
    if (notification.targetGroup === 'all' || notification.targetGroup === 'educators') {
      const educators = await getFilteredEducators(notification.targetFilters);
      recipients.push(...educators.map(e => ({ userId: e.id, userType: 'educator', ...e })));
    }

    // Update notification with recipients
    await adminDb.collection('notifications').doc(notificationId).update({
      recipients: recipients.map(r => ({ userId: r.userId, userType: r.userType })),
      recipientCount: recipients.length,
      processedAt: new Date()
    });

    return recipients;
  } catch (error) {
    console.error('Error processing notification recipients:', error);
    throw error;
  }
}

// Helper function to get filtered students
async function getFilteredStudents(filters) {
  let query = adminDb.collection('users').where('role', '==', 'student');
  
  // Apply filters
  if (filters.batch) {
    query = query.where('batch', '==', filters.batch);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper function to get filtered educators
async function getFilteredEducators(filters) {
  let query = adminDb.collection('users').where('role', '==', 'educator');
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper function to get notifications for a specific user
async function getNotificationsForUser(userId, userType) {
  // Get notifications where user is in recipients or target group matches
  const snapshot = await adminDb.collection('notifications')
    .where('isActive', '==', true)
    .where('status', '==', 'sent')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const notifications = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if notification targets this user
    const isTargeted = 
      data.targetGroup === 'all' ||
      data.targetGroup === userType ||
      data.recipients?.some(r => r.userId === userId);
    
    if (isTargeted) {
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        scheduleDate: data.scheduleDate?.toDate?.() || null,
        isRead: data.readBy?.includes(userId) || false
      });
    }
  }
  
  return notifications;
}