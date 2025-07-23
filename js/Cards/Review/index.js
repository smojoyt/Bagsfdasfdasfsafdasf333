// js/Cards/Review/index.js
import { setupReviewSection } from "./reviewSection.js";
import { setupReviewModal } from "./reviewModal.js";

// ✅ Wait for cards to load, then activate modal
setupReviewSection().then(() => {
  setupReviewModal(); // ✅ Now it's safe — the modal and cards exist
});
