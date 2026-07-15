// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6tMtVxoyWdqJ7-Ikk2cOpy4ID-1d9CIA",
  authDomain: "newlook-dc1cf.firebaseapp.com",
  projectId: "newlook-dc1cf",
  storageBucket: "newlook-dc1cf.firebasestorage.app",
  messagingSenderId: "894852844690",
  appId: "1:894852844690:web:1dcae1e94fa99c76fa2a4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
