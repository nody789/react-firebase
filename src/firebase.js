
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAqDmCwE7myjbGzgVLDRJwe3VDYls6BUOU",
  authDomain: "react-67c5f.firebaseapp.com",
  projectId: "react-67c5f",
  storageBucket: "react-67c5f.appspot.com",
  messagingSenderId: "554184784666",
  appId: "1:554184784666:web:fd71116276aa08d7310aa3",
  measurementId: "G-3E2STSQZH8"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
// 初始化 Analytics
const analytics = getAnalytics(app);
// 初始化 Auth
const auth = getAuth(app);
// 初始化 Firestore
const firestore = getFirestore(app);
const storage = getStorage(app);

// 初始化各种 Auth 提供者
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export { firestore, auth, googleProvider, facebookProvider, storage };
