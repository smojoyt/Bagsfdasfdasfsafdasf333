// js/allReview/reviewCard.js

export function createFullReviewCard(review, product) {
  const card = document.createElement("div");
  card.className =
    "w-full max-w-2xl bg-white border border-gray-200  shadow p-6 flex flex-col gap-4";

  // 🧍‍♀️ Reviewer info
  const name = review.name || "Anonymous";
  const lastInitial = review.lastInitial ? ` ${review.lastInitial}.` : "";
  const fullName = `${name}${lastInitial}`;

  // 📅 Date fallback
  const date = review.timestamp || review.date || "";

  // ⭐ Render stars properly with a helper function
  const ratingStars = renderStars(review.rating || 0);

  // 🖼️ Product image fallback
  const productImage =
    product?.catalogImage || product?.image || "/imgs/placeholder.jpg";

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <span>${fullName}</span>
        <img src="/icons/verified.png" alt="Verified" class="w-4 h-4" />
        <span class="text-xs text-blue-600 font-medium">Verified Buyer</span>
      </div>
      <div class="text-xs text-gray-500">${date}</div>
    </div>

    <div class="text-yellow-400 text-lg">${ratingStars}</div>

    ${
      review.headline
        ? `<h3 class="text-md font-bold text-gray-900">${review.headline}</h3>`
        : ""
    }

    <p class="text-gray-700 text-sm whitespace-pre-line">
      ${review.reviewText || review.text || ""}
    </p>

    ${
      review.customerImg
        ? `
      <img src="${review.customerImg}" alt="Customer photo" class="w-full max-h-64 object-cover border border-gray-300" />
    `
        : ""
    }

    <div class="flex items-center gap-3 pt-2 border-t mt-4">
      <img src="${productImage}" alt="${product?.name || "Product"}" class="w-10 h-10 object-cover border border-gray-300" />
      <span class="text-sm text-gray-800 font-medium">${product?.name || "Product"}</span>
    </div>
  `;

  return card;
}

// ⭐ Helper to render star icons
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = "";

  for (let i = 0; i < 5; i++) {
    if (i < full)
      stars += `<span class="text-yellow-400 text-lg">★</span>`;
    else if (i === full && half)
      stars += `<span class="text-yellow-400 text-lg">⯪</span>`;
    else
      stars += `<span class="text-gray-300 text-lg">★</span>`;
  }

  return stars;
}
