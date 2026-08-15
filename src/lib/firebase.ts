import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'armazemfacil-b2292',
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoArmazemFacilKey2026',
  authDomain: `${env.VITE_FIREBASE_PROJECT_ID || 'armazemfacil-b2292'}.firebaseapp.com`,
  storageBucket: `${env.VITE_FIREBASE_PROJECT_ID || 'armazemfacil-b2292'}.appspot.com`,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '689540615125',
  appId: env.VITE_FIREBASE_APP_ID || '1:689540615125:web:armazemfacil',
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Persistent Local Cache (Multi-Tab) as required
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // If already initialized or in fallback mode
  db = getFirestore(app);
}

export { app, db };
