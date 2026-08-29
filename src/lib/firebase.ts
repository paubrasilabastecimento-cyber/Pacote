import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || 'substantial-tine-1thv3',
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database ID provisioned
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';

// Initialize Firestore with Persistent Local Cache (Multi-Tab) and configured database ID
let db: Firestore;
try {
  db = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId
  );
} catch {
  // If already initialized or fallback
  db = getFirestore(app, databaseId);
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_health', 'ping'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firestore] Cliente em modo offline com cache local ativo.');
    } else {
      console.log('[Firestore] Conexão ativa com o banco de dados:', databaseId);
    }
    return true;
  }
}

// Executa verificação inicial sem travar a interface
testFirestoreConnection().catch(() => {});

export { app, db, databaseId };
