// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2_hKCLbmwwkSuXxpEHAVjFoSxUN200OU",
  authDomain: "svgwork-56f4d.firebaseapp.com",
  databaseURL: "https://svgwork-56f4d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "svgwork-56f4d",
  storageBucket: "svgwork-56f4d.firebasestorage.app",
  messagingSenderId: "366496523954",
  appId: "1:366496523954:web:66dd655928b925ad848bab" ,
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export references
const auth = firebase.auth();
const database = firebase.database();
