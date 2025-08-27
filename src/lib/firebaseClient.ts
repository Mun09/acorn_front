// npm i firebase
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
// };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID!,
};

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);
export const auth = getAuth(app);
