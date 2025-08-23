// js/allReview/renderAllReviews.js
import { renderSkeleton, clearSkeleton, updateSkeletonLabel } from "../Shared/skeleton.js";

export async function renderAllReviews(productId = null) {
  const container = document.getElementById("allReviewSection");
  if (!container) return;

  // --- Show skeleton overlay immediately ---
  renderSkeleton(container, {
    variant: "grid-card",
    count: 6,
    aspect: "aspect-[4/3]",
    overlay: true,
    label: "Loading reviews…",
    minDuration: 350,          // avoid flicker
    tone: "gray",
    rounded: "rounded-md",
    itemMaxWidth: "max-w-[28rem]"
  });

  const escapeHTML = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const sourceStyleFor = (raw) => {
    const key =
      /depop/i.test(raw) ? "Depop" :
      /karrykraze|kk|website/i.test(raw) ? "KarryKraze" :
      /etsy/i.test(raw) ? "Etsy" :
      "Unknown";

    const map = {
      Etsy: {
        key: "Etsy",
        logo: "/imgs/Logo/Brands/Etsy2.png",
        badgeBg: "#ff7313",
        borderColor: "#FF7313",
        textOnBadge: "#000000"
      },
      KarryKraze: {
        key: "KarryKraze",
        logo: "/imgs/Logo/short/SL_0607.png",
        badgeBg: "#fedcc1",
        borderColor: "#fedcc1",
        textOnBadge: "#000000"
      },
      Depop: {
        key: "Depop",
        logo: "/imgs/Logo/Brands/Depop.png",
        badgeBg: "#000000",
        borderColor: "#000000",
        textOnBadge: "#FFFFFF"
      },
      Unknown: {
        key: "Unknown",
        logo: null,
        badgeBg: "#e5e7eb",
        borderColor: "#d1d5db",
        textOnBadge: "#111827"
      }
    };
    return map[key];
  };

  const renderStars = (rating) => {
    let out = "";
    const r = Math.max(0, Math.min(5, parseInt(rating) || 0));
    for (let i = 0; i < 5; i++) {
      out += i < r
        ? `<span class="text-yellow-400 text-2xl leading-none">★</span>`
        : `<span class="text-gray-300 text-2xl leading-none">★</span>`;
    }
    return out;
  };

  try {
    // Don’t clear container yet—skeleton is overlaying it.
    const [reviewsRes, productsRes] = await Promise.all([
      fetch("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314"),
      fetch("/products/products.json")
    ]);

    // Update label once one set is back
    updateSkeletonLabel(container, "Matching products…");

    const reviewsJson = await reviewsRes.json();
    let reviews = reviewsJson.record?.reviews || [];
    const products = await productsRes.json();

    if (productId) {
      reviews = reviews.filter((r) => r.productId === productId);
    }

    // Most recent first (your original behavior)
    reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Now clear the skeleton (respects minDuration), then render content
    await clearSkeleton(container);
    container.innerHTML = "";

    for (const review of reviews) {
      const product =
        Object.values(products).find((p) => p.product_id === review.productId) || null;

      const productName = product?.name || "Unknown Product";
      const productImage = product?.catalogImage || "/imgs/placeholder.jpg";
      const productUrl   = (product && product.url) ? String(product.url) : "";

      const name = review["first name"] || "Anonymous";
      const last = review["last name"] ? ` ${review["last name"].trim()}` : "";
      const rating = parseInt(review.rating) || 0;
      const date = review.timestamp || "";
      const headline = review.reviewHeadline || "";
      const body = review.reviewText || "";
      const customerImg = (review.customerImg || "").trim();

      // Source & location
      const sourceRaw = (review.source ?? "").toString().trim();
      const s = sourceStyleFor(sourceRaw);
      const location =
        (review.location ?? review.purchaseLocation ?? "").toString().trim();

      // Helper: clickable media block (wrap image with <a> if URL exists)
      const mediaHTML = (() => {
        const innerImg = customerImg
          ? `<img src="${escapeHTML(customerImg)}" alt="Customer image"
                 class="w-full h-48 sm:h-40 object-cover border border-gray-200 rounded" />`
          : `<img src="${escapeHTML(productImage)}" alt="${escapeHTML(productName)}"
                 class="w-full h-48 sm:h-40 object-cover border border-gray-200 rounded" />`;
        if (productUrl) {
          return `<a href="${escapeHTML(productUrl)}" aria-label="View ${escapeHTML(productName)}" class="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                    ${innerImg}
                  </a>`;
        }
        return innerImg;
      })();

      // Helper: clickable product title (link if URL exists)
      const titleHTML = productUrl
        ? `<a href="${escapeHTML(productUrl)}" class="text-sm text-gray-700 mt-0.5 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500">${escapeHTML(productName)}</a>`
        : `<div class="text-sm text-gray-700 mt-0.5">${escapeHTML(productName)}</div>`;

      // Wrapper (badge + top strip + card)
      const wrapper = document.createElement("div");
      wrapper.className = "flex flex-col items-start";

      // Source badge above card (top-right rounded)
      const badge = document.createElement("div");
      badge.className = "px-10 py-1 rounded-tr-md border flex items-center";
      badge.style.backgroundColor = s.badgeBg;
      badge.style.borderColor = s.borderColor;

      if (s.logo) {
        const img = document.createElement("img");
        img.src = s.logo;
        img.alt = s.key;
        img.className = "h-4 object-contain";
        badge.appendChild(img);
      } else {
        const lbl = document.createElement("span");
        lbl.textContent = s.key;
        lbl.style.color = s.textOnBadge;
        lbl.className = "text-xs font-semibold";
        badge.appendChild(lbl);
      }

      // 1px strip to avoid top-edge “lip”
      const topStrip = document.createElement("div");
      topStrip.className = "w-full";
      topStrip.style.height = "1px";
      topStrip.style.backgroundColor = s.borderColor;

      // Card (mobile-first)
      const card = document.createElement("div");
      card.className = "w-full bg-white shadow-sm overflow-hidden border-4";
      card.style.borderColor = s.borderColor;

      // Layout: stack on mobile, side-by-side on ≥sm
      card.innerHTML = `
        <div class="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
          <!-- Left media column (clickable if product URL exists) -->
          <div class="w-full sm:w-48 sm:flex-shrink-0">
            ${mediaHTML}
          </div>

          <!-- Main content -->
          <div class="flex-1 min-w-0">
            <!-- Top row: name + date -->
            <div class="flex items-center justify-between gap-2">
              <div class="font-semibold text-gray-900 truncate">${escapeHTML(name + last)}</div>
              <div class="text-xs text-gray-500 flex-shrink-0">${escapeHTML(date)}</div>
            </div>

            <!-- Product name (clickable if product URL exists) -->
            ${titleHTML}

            <!-- Stars -->
            <div class="flex mt-1 mb-2">${renderStars(rating)}</div>

            <!-- Headline -->
            ${
              headline
                ? `<h4 class="font-semibold text-gray-900 text-base">${escapeHTML(headline)}</h4>`
                : ""
            }

            <!-- Review text -->
            <div class="text-gray-800 text-sm leading-relaxed whitespace-pre-line mt-1">
              ${escapeHTML(body)}
            </div>

            <!-- Meta row (location) -->
            <div class="mt-3 flex items-center flex-wrap gap-3">
              ${
                location
                  ? `<span class="inline-flex items-center text-xs px-2 py-1 border rounded bg-white"
                           style="border-color:${s.borderColor}">
                       <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                         <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                       </svg>
                       ${escapeHTML(location)}
                     </span>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;

      // Assemble
      wrapper.appendChild(badge);
      wrapper.appendChild(topStrip);
      wrapper.appendChild(card);

      container.appendChild(wrapper);
    }

    if (reviews.length === 0) {
      container.innerHTML = `<p class="text-sm text-gray-500 italic text-center">No reviews available for this product.</p>`;
    }
  } catch (err) {
    console.error("❌ Failed to render all reviews:", err);
    await clearSkeleton(container);
    container.innerHTML = `<p class="text-sm text-red-600 text-center">We couldn't load reviews. Please try again later.</p>`;
    return;
  }

  // Ensure skeleton is cleared if we didn’t hit the catch
  await clearSkeleton(container);
}
