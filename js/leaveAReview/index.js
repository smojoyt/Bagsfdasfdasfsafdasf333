import { setupProductDropdown } from './productDropdown.js';
import { setupStarRating } from './starRating.js';
import { setupQualitySelector } from './qualitySelector.js';
import { setupImagePreview } from './imagePreview.js';
import { setupFormSubmit } from './submitReview.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBDruyZmtNMl2-zJrYwaqUjIHniSolsdk",
  authDomain: "karrykraze-refiews.firebaseapp.com",
  projectId: "karrykraze-refiews",
  storageBucket: "karrykraze-refiews.firebasestorage.app", // ✅ add this line
  messagingSenderId: "207129112203",
  appId: "1:207129112203:web:910e834e7c1bbe9158ae8e"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage(); // ✅ this now uses the correct bucket


fetch("/products/products.json")
  .then(res => res.json())
  .then(data => {
    setupProductDropdown(data);
    setupStarRating();
    setupQualitySelector();
    setupImagePreview();
    setupFormSubmit(storage);
  });
