 // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAC88vkNEk00nhfr7_VaeNDicGI9n22QlQ",
    authDomain: "quote-app-93780.firebaseapp.com",
    projectId: "quote-app-93780",
    storageBucket: "quote-app-93780.firebasestorage.app",
    messagingSenderId: "484417326692",
    appId: "1:484417326692:web:f44e11eda5bf937dd35971",
    measurementId: "G-V04YB5KG3Q"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
