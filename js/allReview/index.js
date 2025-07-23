import { renderSummary } from "./renderSummary.js";
import { renderAllReviews } from "./renderAllReviews.js";
import { renderReviewSort } from "./renderReviewSort.js";

document.addEventListener("DOMContentLoaded", async () => {
  const renderEverything = async (productId = null) => {
    await renderSummary(productId);
    await renderAllReviews(productId);
  };

  await renderReviewSort(renderEverything);
  await renderEverything(); // initial load (All Products)
});
