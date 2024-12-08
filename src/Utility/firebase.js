import firebase from "firebase/compat/app";
// auth
import { getAuth } from "firebase/auth";
import "firebase/compat/firestore";
import "firebase/compat/auth";
const firebaseConfig = {
  apiKey: "AIzaSyA5aK9ZAea7p0ax9HcTFuquPl6hWoMuuVg",
  authDomain: "cloning-dd893.firebaseapp.com",
  projectId: "cloning-dd893",
  storageBucket: "cloning-dd893.firebasestorage.app",
  messagingSenderId: "888163008754",
  appId: "1:888163008754:web:c5532bbf135dfdcd05506b"
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = app.firestore();