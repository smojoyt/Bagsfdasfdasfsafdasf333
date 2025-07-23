export async function renderSummary(productId = null) {
  const container = document.getElementById("reviewSummarySection");
  if (!container) return;

  try {
    const res = await fetch("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314");
    const reviewsJson = await res.json();
    let reviews = reviewsJson.record?.reviews || [];

    if (productId) {
      reviews = reviews.filter(r => r.productId === productId);
    }

    const ratings = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const score = parseInt(r.rating);
      if (score >= 1 && score <= 5) ratings[score - 1]++;
    });

    const total = ratings.reduce((a, b) => a + b, 0);
    const avg = total > 0 ? (ratings.reduce((sum, val, i) => sum + (val * (i + 1)), 0) / total).toFixed(1) : "0.0";

    let barHTML = "";
    for (let i = 5; i >= 1; i--) {
      const count = ratings[i - 1];
      const percent = total > 0 ? (count / total) * 100 : 0;

      barHTML += `
        <div class="flex items-center gap-2">
          <div class="w-8 text-sm font-medium">${i}★</div>
          <div class="flex-1 h-3 bg-gray-200  overflow-hidden">
            <div class="h-3 bg-yellow-400" style="width: ${percent}%"></div>
          </div>
          <div class="text-sm w-6 text-right">${count}</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="text-center sm:text-left">
          <div class="text-4xl font-bold text-gray-900">${avg}</div>
          <div class="text-yellow-400">${renderStars(Math.round(avg))}</div>
          <div class="text-sm text-gray-600">(${total} Review${total !== 1 ? 's' : ''})</div>
        </div>
        <div class="flex-1 space-y-2 w-full max-w-none">
          ${barHTML}
        </div>
      </div>
    `;
  } catch (err) {
    console.error("❌ Failed to render summary:", err);
  }
}

function renderStars(rating) {
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < rating
      ? `<span class="text-yellow-400 text-lg">★</span>`
      : `<span class="text-gray-300 text-lg">★</span>`;
  }
  return stars;
}
