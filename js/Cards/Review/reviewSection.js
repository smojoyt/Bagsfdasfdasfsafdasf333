import { createReviewCard } from "./reviewCard.js";

export async function setupReviewSection() {
  const container = document.getElementById("reviewSection");
  if (!container) return;

  try {
    const [reviewsRes, productsRes] = await Promise.all([
      fetch("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314"),
      fetch("/products/products.json")
    ]);

    const reviewsJson = await reviewsRes.json();
    const reviews = reviewsJson.record?.reviews || [];
    const products = await productsRes.json();

    // Sort by date descending
    const sorted = reviews.sort((a, b) => {
  const [aMonth, aDay, aYear] = a.timestamp.split("/").map(Number);
  const [bMonth, bDay, bYear] = b.timestamp.split("/").map(Number);

  const aTime = new Date(aYear, aMonth - 1, aDay).getTime();
  const bTime = new Date(bYear, bMonth - 1, bDay).getTime();

  return bTime - aTime; // descending (newest first)
});

    const topFive = sorted.slice(0, 5);

    topFive.forEach((review) => {
      const card = createReviewCard(review, products);
      container.appendChild(card);
    });

    console.log("✅ Loaded latest 5 reviews.");
  } catch (err) {
    console.error("❌ Failed to load reviews:", err);
  }
}
