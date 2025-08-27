# Firebase Setup Guide for EduBoost

This guide will help you set up Firebase for the EduBoost project, replacing MongoDB.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "eduboost-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development (you can change this later)
4. Select a location for your database
5. Click "Done"

## Step 3: Set up Authentication (Optional)

1. In your Firebase project console, click on "Authentication"
2. Go to the "Sign-in method" tab
3. Enable the sign-in providers you want to use (Email/Password is recommended)

## Step 4: Set up Storage (Optional)

1. In your Firebase project console, click on "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location for your storage
5. Click "Done"

## Step 5: Get Firebase Configuration

### Web App Configuration

1. In your Firebase project console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (`</>`)
4. Register your app with a nickname (e.g., "eduboost-web")
5. Copy the configuration object

### Service Account Key (for Admin SDK)

1. In your Firebase project console, go to Project settings
2. Click on the "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file and keep it secure

## Step 6: Update Environment Variables

Update your `.env.local` file with the Firebase configuration:

```env
# Firebase Configuration (from Web App config)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- Replace all placeholder values with your actual Firebase configuration
- The `FIREBASE_PRIVATE_KEY` should include the full private key with `\n` for line breaks
- Keep your service account key secure and never commit it to version control

## Step 7: Set up Firestore Security Rules

In the Firestore console, update your security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Add more collections as needed
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Create Admin User

Run the seeding script to create an admin user:

```bash
npm run seed-admin
```

Or with custom credentials:

```bash
npm run seed-admin admin@yourdomain.com YourPassword123
```

## Step 9: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Try registering a new student account
4. Log in with your admin credentials to approve the student
5. Test the login functionality

## Firestore Collections Structure

The app uses the following Firestore collections:

### `users` Collection

Each user document contains:

```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  password: string, // hashed
  role: 'student' | 'educator' | 'admin',
  isApproved: boolean,
  studentId?: string, // optional, for students
  dob?: Date,
  telephone?: string,
  address?: object,
  photoUrl?: string,
  passwordResetToken?: string,
  passwordResetExpires?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Migration Notes

- All MongoDB/Mongoose code has been replaced with Firebase/Firestore
- User authentication now uses Firebase Admin SDK for server-side operations
- Password hashing is still handled server-side using bcryptjs
- All API routes have been updated to use the new `UserService` class

## Troubleshooting

### Common Issues

1. **"Firebase Admin SDK not initialized"**
   - Check that all environment variables are set correctly
   - Ensure the private key format is correct with proper line breaks

2. **"Permission denied" errors**
   - Update your Firestore security rules
   - Ensure the user is authenticated

3. **"Project not found"**
   - Verify the `FIREBASE_PROJECT_ID` matches your actual project ID

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)

## Security Best Practices

1. **Environment Variables**: Never commit your `.env.local` file to version control
2. **Service Account Key**: Keep your service account JSON file secure
3. **Firestore Rules**: Update security rules for production
4. **HTTPS**: Always use HTTPS in production
5. **Regular Updates**: Keep Firebase SDK updated

## Production Deployment

Before deploying to production:

1. Update Firestore security rules to be more restrictive
2. Set up proper authentication flows
3. Configure Firebase hosting or your preferred hosting platform
4. Set up monitoring and logging
5. Test all functionality thoroughly