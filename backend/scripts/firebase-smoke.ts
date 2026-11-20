import { env } from '../src/config/env';
import { FirebaseStorageProvider } from '../src/storage/firebase.provider';

export async function runFirebaseSmokeTest(): Promise<boolean> {
  console.log('=== Firebase Storage Smoke Test ===');

  if (env.STORAGE_PROVIDER !== 'firebase') {
    console.log(`Current STORAGE_PROVIDER is '${env.STORAGE_PROVIDER}'.`);
    console.log('Real Firebase: NOT verified (using local/mock provider).');
    console.log('To run smoke test against live Firebase, provide credentials in .env and set STORAGE_PROVIDER=firebase.');
    return false;
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_STORAGE_BUCKET) {
    console.error('Missing Firebase credentials. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET are set.');
    return false;
  }

  console.log(`Connecting to Firebase Storage bucket: ${env.FIREBASE_STORAGE_BUCKET} (Project: ${env.FIREBASE_PROJECT_ID})...`);

  try {
    const provider = new FirebaseStorageProvider();
    const testPath = `system/smoke-test-${Date.now()}.txt`;
    const testPayload = Buffer.from('MemoryBridge Firebase Storage smoke test verification probe');

    console.log(`1. Generating signed upload target for ${testPath}...`);
    const uploadTarget = await provider.createUploadTarget({
      storagePath: testPath,
      contentType: 'text/plain',
      maxSizeBytes: 1024,
      ttlSeconds: 300
    });
    console.log(`   Signed Upload URL generated successfully.`);

    console.log(`2. Generating signed read URL for ${testPath}...`);
    const readUrl = await provider.createReadUrl(testPath, 300);
    console.log(`   Signed Read URL generated successfully.`);

    console.log(`3. Deleting smoke test object ${testPath}...`);
    await provider.deleteObject(testPath);
    console.log(`   Deletion completed.`);

    console.log('=== Real Firebase Smoke Test: PASSED ===');
    return true;
  } catch (err: any) {
    console.error('Firebase smoke test failed with error:', err.message);
    return false;
  }
}

if (process.argv[1] && process.argv[1].includes('firebase-smoke')) {
  runFirebaseSmokeTest()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Smoke test unhandled failure:', err);
      process.exit(1);
    });
}

