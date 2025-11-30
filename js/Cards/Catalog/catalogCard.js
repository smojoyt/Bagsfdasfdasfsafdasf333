import { renderColorDots } from "../../utils/variantHelpers.js";
import { initUniversalCartHandler } from "../../Cart/addToCart.js";
import { getPromotions, matchPromotion, calculateDiscountedPrice } from "../../Promotions/promotions.js";

export async function createCatalogCard(sku, product) {
  // 🔹 Promotions / pricing
  const promoList = await getPromotions();
  const activePromo = matchPromotion(product, promoList);
  const finalPrice = calculateDiscountedPrice(product, activePromo);
  const isDiscounted = typeof product.price === "number" && finalPrice < product.price;

  // 🔹 Images
  const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
  const hoverImage = product.catalogImageHover || imageUrl;

  // 🔹 ProductId for likes / tracking
  const productId =
    product.product_id || product.productId || product.productID || product.productid || sku || "";

  // 🔹 Color options (custom1Name: "Color", custom1Options: "Red | Green | Blue")
  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
      ? product.custom1Options.split(" | ")
      : [];

  // ---------- STOCK DETECTION ----------
  // 🔢 Total units in stock (sum across fields/variants)
  const { totalStock } = (() => {
    let total = 0;

    // 1) Simple numeric stock fields (if present, we trust them and bail early)
    for (const k of ["stock", "inventory", "quantity", "inStockCount"]) {
      if (typeof product[k] === "number" && Number.isFinite(product[k])) {
        total = product[k];
        return { totalStock: total };
      }
    }

    // 2) variantStock: array or object
    if (product.variantStock) {
      if (Array.isArray(product.variantStock)) {
        for (const val of product.variantStock) {
          const n = Number(val);
          if (Number.isFinite(n)) total += n;
        }
        return { totalStock: total };
      }

      if (typeof product.variantStock === "object") {
        for (const val of Object.values(product.variantStock)) {
          const n = Number(val);
          if (Number.isFinite(n)) total += n;
        }
        return { totalStock: total };
      }
    }

    // 3) variants array with .stock
    if (Array.isArray(product.variants)) {
      for (const v of product.variants) {
        const n = Number(v?.stock);
        if (Number.isFinite(n)) total += n;
      }
      return { totalStock: total };
    }

    // Unknown stock → treat as infinite (no ribbon)
    return { totalStock: Infinity };
  })();

  // 🚩 Stock flags (based ONLY on totalStock)
  const isOut =
    Number.isFinite(totalStock) && totalStock <= 0;

  // LAST ONE LEFT when exactly 1 item total
  const isLastOne =
    Number.isFinite(totalStock) &&
    !isOut &&
    totalStock === 1;

  // Limited Quantity when low stock (2–3 units)
  const showLimited =
    Number.isFinite(totalStock) &&
    !isOut &&
    !isLastOne &&
    totalStock > 0 &&
    totalStock <= 3;

  // Labels
  const limitedLabel = window.matchMedia("(max-width: 360px)").matches
    ? "Limited Qty"
    : "Limited Quantity";

  const lastOneLabel = "LAST ONE LEFT!!";

  // 🏷️ Stock badge (top-center on image)
  const badgeHTML =
    isOut || isLastOne || showLimited
      ? `
    <div class="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
      <div class="bg-black text-white uppercase whitespace-nowrap leading-none tracking-[.08em] text-[9px] sm:text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-[3px]">
        ${
          isOut
            ? "Out of Stock"
            : isLastOne
              ? lastOneLabel
              : limitedLabel
        }
      </div>
      <svg class="-mt-[1px] sm:-mt-[2px]" width="20" height="10" viewBox="0 0 22 10" aria-hidden="true">
        <path d="M0 0 L11 10 L22 0 Z" fill="black"></path>
      </svg>
    </div>
  `
      : "";

  // ---------- CARD MARKUP ----------
  const card = document.createElement("div");
  card.className =
    "catalog-card flex flex-col gap-2 w-full max-w-[30rem] text-center items-center md:items-start md:text-left";

  card.innerHTML = `
<div class="w-full">
  <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
    <div class="relative w-full aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden group image-hover-group">
      ${badgeHTML}

      <!-- Base image -->
      <img
        src="${imageUrl}"
        alt="${product.name || ""}"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${isOut ? "opacity-60" : "group-hover:opacity-0"}"
        loading="lazy"
        decoding="async"
      />

      <!-- Hover image -->
      <img
        src="${hoverImage}"
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-0 ${isOut ? "" : "group-hover:opacity-100"} transition-opacity duration-300 ease-out"
        loading="lazy"
        decoding="async"
      />

      <!-- Social/Meta Pills -->
      <div class="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2">
        <!-- Like Pill -->
        <div class="like-wrapper flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-sm"
             data-sku="${sku}" data-productid="${productId}">
          <button
            class="like-btn flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border border-gray-800 transition-all"
            aria-label="Like"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 21s-5.2-3.2-8-6.1C2 10.7 2 8.1 3.5 6.4 5 4.7 7.6 4.5 9.3 6c.4.4.7.8.9 1.2.2-.4.5-.9.9-1.2C13.6 4.5 16.2 4.7 17.7 6.4 19.2 8.1 19.2 10.7 18 14.9 17 17.8 12 21 12 21z"
                fill="none"
                stroke="#000000"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
          <span class="like-count text-sm text-black font-medium leading-none">0</span>
        </div>

        <!-- Reviews Pill -->
        <div class="review-wrapper flex items-center gap-1 px-2 py-1 bg-white rounded-full text-black">
          <svg class="rating-star w-4 h-4 text-yellow-500" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id="clip-${sku}" clipPathUnits="userSpaceOnUse">
                <rect class="rating-clip" x="0" y="0" width="0" height="24"></rect>
              </clipPath>
            </defs>
            <polygon
              clip-path="url(#clip-${sku})"
              points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
              fill="currentColor"
            ></polygon>
            <polygon
              points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></polygon>
          </svg>
          <span class="review-avg text-sm font-medium leading-none">0.0</span>
          <span class="review-count text-sm leading-none opacity-80">(0)</span>
        </div>
      </div>
    </div>
  </a>

  <div class="px-5 flex flex-col gap-2 mt-4 text-sm w-full items-center md:items-start text-center md:text-left">
    <!-- Product Name -->
    <div class="font-medium text-black uppercase w-full">
      ${product.name || ""}
    </div>

    <!-- Price -->
    <div class="text-black font-semibold w-full">
      ${
        typeof product.price === "number"
          ? isDiscounted
            ? `<span class="text-red-600 text-base">$${finalPrice.toFixed(2)}</span>
               <span class="text-gray-400 line-through text-xs ml-1">$${product.price.toFixed(2)}</span>`
            : `$${product.price.toFixed(2)}`
          : ""
      }
    </div>

    <!-- Swatches + CTA -->
    <div class="flex flex-col gap-1 w-full items-center md:items-start">
      <div class="flex flex-wrap gap-x-1 gap-y-1.5 justify-center md:justify-start swatch-group w-full ${
        isOut ? "pointer-events-none opacity-60" : ""
      }">
        ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
      </div>
      <button
        type="button"
        class="text-xs select-color-text uppercase transition-colors ${
          isOut || !colorOptions.length ? "text-gray-400 cursor-not-allowed" : "text-gray-500 cursor-not-allowed"
        }"
        data-variant=""
        ${isOut || !colorOptions.length ? "disabled" : ""}
      >
        ${
          isOut
            ? "Out of Stock"
            : colorOptions.length
              ? "Select a color to add to cart"
              : "Unavailable"
        }
      </button>
    </div>
  </div>
</div>
`;

  // ---------- INTERACTIVITY ----------

  const swatchContainer = card.querySelector(".swatch-group");
  const selectText = card.querySelector(".select-color-text");

  if (!isOut) {
    // Click on swatches
    swatchContainer?.addEventListener("click", (e) => {
      const btn = e.target.closest("button.color-dot");
      if (!btn || btn.disabled) return;

      const variant = btn.dataset.variant;
      const image = btn.dataset.image;

      // highlight swatch
      swatchContainer
        .querySelectorAll("button.color-dot")
        .forEach((dot) => dot.classList.remove("ring-2", "ring-black"));
      btn.classList.add("ring-2", "ring-black");

      // update CTA text
      if (selectText) {
        selectText.dataset.variant = variant;
        selectText.textContent = "Add to Cart";
        selectText.disabled = false;
        selectText.classList.remove("text-gray-500", "cursor-not-allowed");
        selectText.classList.add("text-black", "cursor-pointer");
      }

      // update image
      const img = card.querySelector(".image-hover-group > img");
      if (img && image) img.src = image;
    });

    // Clicking the text itself (handled by universal cart handler)
    selectText?.addEventListener("click", () => {
      const variant = selectText.dataset.variant;
      if (!variant || selectText.disabled) return;
      // actual add-to-cart behavior is wired by initUniversalCartHandler
    });
  }

  // ---------- CART WIRING ----------
  window.allProducts = window.allProducts || {};
  window.allProducts[sku] = product;
  initUniversalCartHandler({ root: card });

  return card;
}
