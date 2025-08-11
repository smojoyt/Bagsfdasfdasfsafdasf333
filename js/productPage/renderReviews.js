// js/productPage/renderReviews.js
import { renderSkeleton, clearSkeleton } from "../Shared/skeleton.js";

const REVIEWS_URL = "https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314/latest";

// Ensure we have a mount point right under the expandable sections
function ensureReviewsRoot() {
  let root = document.getElementById("reviews-root");
  if (root) return root;

  const extra = document.getElementById("extra-sections");
  root = document.createElement("div");
  root.id = "reviews-root";
  root.className = "mt-6";
  if (extra && extra.parentNode) {
    extra.parentNode.insertBefore(root, extra.nextSibling);
  } else {
    // Fallback: append near price section
    const info = document.getElementById("product-info");
    (info || document.body).appendChild(root);
  }
  return root;
}

// One-star partial fill (for average rating) — crisp outline + clipped fill
function starPartial(avg, size = 20) {
  const pct = Math.max(0, Math.min(100, (Number(avg) / 5) * 100));
  const clipW = (pct / 100) * 24;            // 24 = viewBox width
  const id = `starClip_${Math.random().toString(36).slice(2)}`; // unique per render

  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}"
         class="inline-block align-middle text-yellow-500" aria-hidden="true">
      <defs>
        <clipPath id="${id}" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" width="${clipW}" height="24"></rect>
        </clipPath>
      </defs>

      <!-- filled area, clipped left->right -->
      <polygon clip-path="url(#${id})"
               points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
               fill="currentColor"></polygon>

      <!-- outline on top (no fill) -->
      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
               fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round"></polygon>
    </svg>
  `;
}


// Simple 0–5 star row (per review)
function starRow(n) {
  const full = Math.max(0, Math.min(5, Number(n) || 0));
  return `<span class="text-yellow-500" aria-label="${full} out of 5 stars">` +
         "★".repeat(full) + `<span class="text-gray-300">` + "★".repeat(5 - full) + `</span></span>`;
}

function fmtDate(mdyyyy) {
  const d = new Date(mdyyyy);
  if (Number.isNaN(d.getTime())) return mdyyyy || "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtName(r) {
  const first = r?.["first name"] || r?.firstName || r?.first || "";
  const last = (r?.["last name"] || r?.lastName || r?.last || "").trim();
  const lastInitial = last ? ` ${last[0].toUpperCase()}.` : "";
  return (first || "Anonymous") + lastInitial;
}

export async function renderProductReviews(product) {
  const root = ensureReviewsRoot();

  // Inline skeleton lines while loading
  renderSkeleton(root, { variant: "lines", count: 6, minDuration: 200 });

  try {
    const res = await fetch(REVIEWS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`reviews ${res.status}`);
    const data = await res.json();
    const all = data?.record?.reviews || data?.reviews || [];
    if (!Array.isArray(all)) throw new Error("bad reviews payload");

    const pid = product.product_id || product.productId || "";
    const reviews = all.filter(r => (r?.productId || r?.product_id) === pid);

    // Aggregate
    let count = reviews.length;
    let avg = 0;
    if (count) {
      const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
      avg = Math.round((sum / count) * 10) / 10;
    }

    // Header + list shell
    const header = `
      <div class="border-t pt-6">
        <h3 class="uppercase font-bold tracking-wider text-gray-700 mb-3">Reviews</h3>
        <div class="flex items-center gap-2 mb-4">
          ${starPartial(avg)}
          <span class="text-sm font-medium">${avg.toFixed(1)}</span>
          <span class="text-sm text-gray-500">(${count})</span>
        </div>
        <div id="reviews-list" class="space-y-5"></div>
        ${count > 5 ? `
          <div class="mt-2">
            <button id="reviews-more" class="text-sm underline underline-offset-2 text-gray-600 hover:text-black">
              Show more
            </button>
          </div>` : ""}
      </div>
    `;
    root.innerHTML = header;

    const list = document.getElementById("reviews-list");
    if (!list) return;

    // Render first 5, support show more
    const renderSlice = (arr) => {
      list.innerHTML = arr.map(r => {
        const img = r.customerImg ? `
          <img src="${r.customerImg}" alt="Customer photo" loading="lazy"
               class="w-16 h-16 object-cover rounded-md border" />` : "";
        return `
          <article class="border rounded-lg p-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                ${starRow(Number(r.rating))}
                <span class="text-xs text-gray-500">${fmtDate(r.timestamp)}</span>
              </div>
              <span class="text-xs text-gray-500">${fmtName(r)}</span>
            </div>
            ${r.reviewHeadline ? `<h4 class="mt-2 font-semibold">${r.reviewHeadline}</h4>` : ""}
            <p class="mt-1 text-sm text-gray-700 leading-relaxed">${r.reviewText || ""}</p>
            ${img ? `<div class="mt-2">${img}</div>` : ""}
          </article>
        `;
      }).join("");
    };

    const INITIAL = 5;
    renderSlice(reviews.slice(0, INITIAL));

    const moreBtn = document.getElementById("reviews-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        renderSlice(reviews); // render all
        moreBtn.remove();
      });
    }
  } catch (err) {
    console.error("reviews load error:", err);
    root.innerHTML = `
      <div class="border-t pt-6">
        <h3 class="uppercase font-bold tracking-wider text-gray-700 mb-3">Reviews</h3>
        <p class="text-sm text-gray-500">Reviews are unavailable right now.</p>
      </div>
    `;
  } finally {
    await clearSkeleton(root);
  }
}
