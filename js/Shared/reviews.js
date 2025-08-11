// js/Shared/reviews.js
export async function loadReviewStats(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
    const json = await res.json();
    const reviews = json?.record?.reviews || json?.reviews || [];
    if (!Array.isArray(reviews)) throw new Error("Invalid reviews payload");

    // Aggregate ratings by productId
    const agg = reviews.reduce((acc, r) => {
      const pid = (r?.productId || r?.product_id || "").trim();
      if (!pid) return acc;
      const rating = Number(r?.rating);
      if (!Number.isFinite(rating)) return acc;
      const o = acc[pid] || (acc[pid] = { count: 0, sum: 0 });
      o.count += 1;
      o.sum += rating;
      return acc;
    }, {});

    // Update DOM: avg text, (count), and star fill width
    document.querySelectorAll(".review-wrapper").forEach(wrap => {
      const pid = (wrap.dataset.productid || wrap.dataset.sku || "").trim();
      const stats = agg[pid];
      const avgEl = wrap.querySelector(".review-avg");
      const cntEl = wrap.querySelector(".review-count");
      const fillEl = wrap.querySelector(".rating-fill");

      let avg = 0, cnt = 0;
      if (stats) {
        cnt = stats.count;
        avg = stats.count ? Math.round((stats.sum / stats.count) * 10) / 10 : 0;
      }

      if (avgEl) avgEl.textContent = avg.toFixed(1);
      if (cntEl) cntEl.textContent = `(${cnt})`;

      // star fill percentage: 0–100 based on avg/5
      const percent = Math.max(0, Math.min(100, (avg / 5) * 100));
      if (fillEl) fillEl.style.width = `${percent}%`;
    });
  } catch (err) {
    console.error("Review stats load failed:", err);
  }
}
