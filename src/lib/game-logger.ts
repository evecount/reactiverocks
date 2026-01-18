import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Ensure Firebase is initialized (it might be initialized elsewhere, but good to be safe)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export type GameResultPayload = {
    user_move: string;
    ai_move: string;
    result: string;
};

export async function logGameResult(architectId: string, payload: GameResultPayload) {
    try {
        await addDoc(collection(db, 'Latent_Events'), {
            architect_id: architectId,
            payload: payload,
            timestamp: serverTimestamp()
        });
        console.log("Game result logged to Hive Mind.");
    } catch (e) {
        console.error("Failed to log game result:", e);
    }
}
