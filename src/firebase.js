// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, remove, push, onValue } from "firebase/database";
import {
  browserSessionPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";

const authInit = async () => {
  const auth = getAuth();
  await setPersistence(auth, browserSessionPersistence);

  await signInAnonymously(auth);
  const user = auth.currentUser;
  return user?.uid;
};

export { initializeApp, getDatabase, authInit, ref, remove, push, onValue };
