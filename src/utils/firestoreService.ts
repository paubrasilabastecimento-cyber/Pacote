import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlatformFullBackup } from './platformBackup';

const STATE_DOC_REF = doc(db, 'platform_state', 'current_data');

/**
 * Salva todo o estado da plataforma diretamente no Firebase Firestore
 */
export async function savePlatformDataToFirestore(data: PlatformFullBackup['data']): Promise<boolean> {
  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDoc(STATE_DOC_REF, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('[Firestore] Erro ao sincronizar com o Firestore:', error);
    return false;
  }
}

/**
 * Obtém todo o estado persistido no Firebase Firestore
 */
export async function loadPlatformDataFromFirestore(): Promise<PlatformFullBackup['data'] | null> {
  try {
    const snap = await getDoc(STATE_DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      return data as unknown as PlatformFullBackup['data'];
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Aviso ao buscar dados do Firestore:', error);
    return null;
  }
}

/**
 * Escuta alterações em tempo real do banco de dados na nuvem
 */
export function subscribeToPlatformDataFirestore(
  onData: (data: PlatformFullBackup['data']) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    STATE_DOC_REF,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as unknown as PlatformFullBackup['data']);
      }
    },
    (error) => {
      console.warn('[Firestore] Erro na assinatura em tempo real:', error);
      if (onError) onError(error);
    }
  );
}
