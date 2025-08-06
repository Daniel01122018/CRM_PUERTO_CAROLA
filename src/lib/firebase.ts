// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYFqq5d5A-0uRpAsDh13jFeiuARuXDX3U",
  authDomain: "el-puerto-de-carola-crm.firebaseapp.com",
  projectId: "el-puerto-de-carola-crm",
  storageBucket: "el-puerto-de-carola-crm.firebasestorage.app",
  messagingSenderId: "863402545896",
  appId: "1:863402545896:web:9db2295bdd445378406f5d",
  measurementId: "G-2YHV4MT7MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
