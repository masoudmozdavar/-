import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if specified in config (CRITICAL as per skill)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection testing as mandated by skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore established successfully.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message?.includes('the client is offline')) {
      console.warn('[Firebase] Client is currently offline, using cached/offline persistence.');
      return false;
    }
    // Non-fatal if test collection doesn't exist yet or is forbidden by security rules
    console.log('[Firebase] Connection ping completed.');
    return true;
  }
}
