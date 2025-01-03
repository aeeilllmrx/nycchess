import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "nycchess-ffc31.firebaseapp.com",
  projectId: "nycchess-ffc31",
  storageBucket: "nycchess-ffc31.firebasestorage.app",
  messagingSenderId: "346396015882",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-82MHW1DKZR"
};

export const app = initializeApp(firebaseConfig);