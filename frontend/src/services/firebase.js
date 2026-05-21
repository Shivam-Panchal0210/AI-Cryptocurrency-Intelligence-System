import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBnEA16SRmQhJM3AmM_sEWuHmxx1k5FtmY",
  authDomain:        "crypto-ai-ef945.firebaseapp.com",
  projectId:         "crypto-ai-ef945",
  storageBucket:     "crypto-ai-ef945.firebasestorage.app",
  messagingSenderId: "354984895966",
  appId:             "1:354984895966:web:ccf028c434db57c355a94f",
  measurementId:     "G-ZNKPZWBL1T",
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();

// ── Auth actions ──────────────────────────────────────────────────────────────
export const loginWithGoogle = () => signInWithPopup(auth, provider);

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
};

export const logout = () => signOut(auth);

export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);