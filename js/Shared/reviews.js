// js/Shared/reviews.js
export async function loadReviewStats(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
    const json = await res.json();
    const reviews = json?.record?.reviews || json?.reviews || [];
    if (!Array.isArray(reviews)) throw new Error("Invalid reviews payload");

    // Aggregate by productId
    const agg = reviews.reduce((acc, r) => {
      const pid = (r?.productId || r?.product_id || "").trim();
      const rate = Number(r?.rating);
      if (!pid || !Number.isFinite(rate)) return acc;
      const a = acc[pid] || (acc[pid] = { count: 0, sum: 0 });
      a.count += 1;
      a.sum += rate;
      return acc;
    }, {});

    // Update each card pill
    document.querySelectorAll(".review-wrapper").forEach(wrap => {
      const pid = (wrap.dataset.productid || wrap.dataset.sku || "").trim();
      const stats = agg[pid];

      const avgEl  = wrap.querySelector(".review-avg");
      const cntEl  = wrap.querySelector(".review-count");
      const clipEl = wrap.querySelector(".rating-clip"); // <rect> inside <clipPath>

      let avg = 0, cnt = 0;
      if (stats) {
        cnt = stats.count;
        avg = cnt ? Math.round((stats.sum / cnt) * 10) / 10 : 0;
      }

      if (avgEl) avgEl.textContent = avg.toFixed(1);
      if (cntEl) cntEl.textContent = `(${cnt})`;

      // star clip width: viewBox is 24, so width = 24 * (avg/5)
      if (clipEl) {
const w = Math.max(0, Math.min(24, (avg / 5) * 24));
clipEl.setAttribute("width", w.toFixed(2));

      }
    });
  } catch (err) {
    console.error("Review stats load failed:", err);
  }
}
