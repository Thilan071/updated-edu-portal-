# How to Get Firebase Service Account Credentials

To complete the Firebase setup, you need to obtain the service account credentials for Firebase Admin SDK.

## Steps to Get Service Account Key:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/eduboost-e70da/settings/serviceaccounts/adminsdk
   - Or navigate to: Project Settings > Service Accounts

2. **Generate New Private Key**
   - Click "Generate new private key"
   - Download the JSON file

3. **Extract Required Information**
   From the downloaded JSON file, you need:
   - `client_email` (looks like: firebase-adminsdk-xxxxx@eduboost-e70da.iam.gserviceaccount.com)
   - `private_key` (starts with -----BEGIN PRIVATE KEY-----)

4. **Update .env.local**
   Replace these values in your `.env.local` file:
   ```env
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@eduboost-e70da.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   ```

   **IMPORTANT**: Copy the entire private key exactly as it appears in the JSON file, including all the random characters between the BEGIN and END lines.

## Important Notes:

- Keep the private key secure and never commit it to version control
- The private key should include the `\n` characters for line breaks
- Wrap the private key in double quotes
- **Copy the ENTIRE private key**: Make sure to copy all lines of the private key from the JSON file
- **No spaces or modifications**: Don't add spaces or modify the key content

## Troubleshooting:

### "Failed to parse private key" Error:
This error occurs when the private key format is incorrect. Common issues:

1. **Placeholder values**: Make sure you've replaced `your_service_account_email` and `your_private_key` with actual values
2. **Incomplete key**: Ensure you copied the entire private key from the JSON file
3. **Missing quotes**: The private key must be wrapped in double quotes
4. **Wrong line breaks**: Use `\n` for line breaks in the .env file

### Example of correct format:
```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@eduboost-e70da.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...rest of the key...\n-----END PRIVATE KEY-----\n"
```

## Alternative Method (Recommended for Development):

You can also place the entire service account JSON file in your project and reference it:

1. Download the service account JSON file
2. Place it in your project root (e.g., `serviceAccountKey.json`)
3. Add it to `.gitignore`
4. Update the Firebase Admin initialization to use the file path

Once you have the credentials, run:
```bash
npm run seed-admin
npm run dev
```