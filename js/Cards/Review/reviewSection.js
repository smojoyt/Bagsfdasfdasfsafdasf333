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

    // Split into image vs no-image
    const hasImg = [];
    const noImg  = [];
    for (const r of reviews) {
      const img = (r.customerImg || "").trim();
      (img ? hasImg : noImg).push(r);
    }

    // Fisher–Yates shuffle helper
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Shuffle each bucket
    shuffle(hasImg);
    shuffle(noImg);

    // Take up to 5, prioritizing image reviews
    const need = 5;
    const picked = [...hasImg.slice(0, need)];
    if (picked.length < need) {
      picked.push(...noImg.slice(0, need - picked.length));
    }

    picked.forEach((review) => {
      const card = createReviewCard(review, products);
      container.appendChild(card);
    });

    console.log(`✅ Loaded ${picked.length} reviews (images prioritized).`);
  } catch (err) {
    console.error("❌ Failed to load reviews:", err);
  }
}
