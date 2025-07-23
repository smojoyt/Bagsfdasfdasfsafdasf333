export async function renderAllReviews(productId = null) {
  const container = document.getElementById("allReviewSection");
  if (!container) return;

  try {
    container.innerHTML = ""; // clear previous

    const [reviewsRes, productsRes] = await Promise.all([
      fetch("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314"),
      fetch("/products/products.json")
    ]);

    const reviewsJson = await reviewsRes.json();
    let reviews = reviewsJson.record?.reviews || [];
    const products = await productsRes.json();

    if (productId) {
      reviews = reviews.filter(r => r.productId === productId);
    }

    reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (const review of reviews) {
      const product = Object.values(products).find(p => p.product_id === review.productId);

      const productName = product?.name || "Unknown Product";
      const productImage = product?.catalogImage || "/imgs/placeholder.jpg";
      const name = review["first name"] || "Anonymous";
      const last = review["last name"] ? ` ${review["last name"].trim()}` : "";
      const rating = parseInt(review.rating) || 0;

      const card = document.createElement("div");
      card.className = "flex gap-4 p-4 border-b";

      card.innerHTML = `
        <div class="w-16 h-16 flex-shrink-0">
          <img src="${productImage}" alt="${productName}" class="w-full h-full object-contain">
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <div class="font-bold text-gray-900">${name}${last}</div>
            <div class="text-xs text-gray-500">${review.timestamp || ""}</div>
          </div>
          <div class="text-sm text-gray-700 mb-1">${productName}</div>
          <div class="flex mb-2">${renderStars(rating)}</div>
          <h4 class="font-semibold text-gray-800">${review.reviewHeadline || ""}</h4>
          <div class="text-gray-800 text-sm leading-relaxed whitespace-pre-line">${review.reviewText || ""}</div>
        </div>
      `;

      container.appendChild(card);
    }

    if (reviews.length === 0) {
      container.innerHTML = `<p class="text-sm text-gray-500 italic text-center">No reviews available for this product.</p>`;
    }
  } catch (err) {
    console.error("❌ Failed to render all reviews:", err);
  }
}

function renderStars(rating) {
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < rating
      ? `<span class="text-yellow-400 text-sm">★</span>`
      : `<span class="text-gray-300 text-sm">★</span>`;
  }
  return stars;
}
