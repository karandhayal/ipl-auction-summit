// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCaFxdaxl7CUQS7xBGk2V90VoTAYfZEHEs",
  authDomain: "ipl-auction-6c076.firebaseapp.com",
  projectId: "ipl-auction-6c076",
  storageBucket: "ipl-auction-6c076.firebasestorage.app",
  messagingSenderId: "1092045812095",
  appId: "1:1092045812095:web:cc3fe6517511779823ea4a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);