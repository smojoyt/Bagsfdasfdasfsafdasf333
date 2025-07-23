import { createReviewCard } from "../Cards/Review/reviewCard.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("fullReviewGrid");
  if (!container) return;

  try {
    const [reviewsRes, productsRes] = await Promise.all([
      fetch("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314"),
      fetch("/products/products.json")
    ]);

    const reviews = reviewsRes.ok ? (await reviewsRes.json()).record?.reviews : [];
    const products = await productsRes.json();

    // Sort by newest (timestamp)
    const sorted = reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sorted.forEach((review) => {
      const card = createReviewCard(review, products);
      container.appendChild(card);
    });

    console.log("✅ All reviews rendered:", sorted.length);
  } catch (err) {
    console.error("❌ Failed to load full reviews:", err);
  }
});
