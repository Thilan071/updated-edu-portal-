require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function checkStudentCount() {
  try {
    console.log('Checking data counts...');
    
    const snapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log('Total students in users collection:', snapshot.size);
    
    const participationSnapshot = await db.collection('participation').get();
    console.log('Total participation records:', participationSnapshot.size);
    
    // Show some sample student data
    if (snapshot.size > 0) {
      console.log('\nSample students:');
      snapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name} (${data.email}) - Status: ${data.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStudentCount();
