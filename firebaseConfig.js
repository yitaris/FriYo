import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyCBTOk0C46XRVp6HsTCBQlsV-TYBYXwcz8",
    authDomain: "yitaapp.firebaseapp.com",
    databaseURL: "https://yitaapp-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "yitaapp",
    storageBucket: "yitaapp.appspot.com",
    messagingSenderId: "422420697951",
    appId: "1:422420697951:web:c4fc912426280b2b871cea"
  };

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const db = getFirestore(app);

export {db, firestore };
