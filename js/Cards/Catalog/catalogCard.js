import { renderColorDots } from "../../utils/variantHelpers.js";
import { initUniversalCartHandler } from "../../Cart/addToCart.js";
import { getPromotions, matchPromotion, calculateDiscountedPrice } from "../../Promotions/promotions.js";

export async function createCatalogCard(sku, product) {
  const promoList = await getPromotions();
  const activePromo = matchPromotion(product, promoList);
  const finalPrice = calculateDiscountedPrice(product, activePromo);
  const isDiscounted = finalPrice < product.price;

  const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
  const hoverImage = product.catalogImageHover || imageUrl;

  const productId =
    product.product_id || product.productId || product.productID || product.productid || "";

  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
      ? product.custom1Options.split(" | ")
      : [];

  // ---------- Total stock detection ----------
const totalStock = (() => {
  for (const k of ["stock", "inventory", "quantity", "inStockCount"]) {
    if (typeof product[k] === "number" && isFinite(product[k])) return product[k];
  }
  if (product.variantStock) {
    if (Array.isArray(product.variantStock)) {
      return product.variantStock.reduce((sum, n) => sum + (Number.isFinite(+n) ? +n : 0), 0);
    }
    if (typeof product.variantStock === "object") {
      return Object.values(product.variantStock).reduce(
        (sum, n) => sum + (Number.isFinite(+n) ? +n : 0),
        0
      );
    }
  }
  if (Array.isArray(product.variants)) {
    return product.variants.reduce(
      (sum, v) => sum + (Number.isFinite(+v?.stock) ? +v.stock : 0),
      0
    );
  }
  return Infinity; // unknown => don't show any ribbon
})();

const isOut = Number.isFinite(totalStock) && totalStock <= 0;
const showLimited = !isOut && Number.isFinite(totalStock) && totalStock <= 3;

// pick a shorter label on very small screens so it never wraps
const limitedLabel =
  (typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 360px)").matches)
    ? "Limited Qty"
    : "Limited Quantity";

const badgeHTML = isOut
  ? `
    <div class="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
      <div class="bg-black text-white uppercase whitespace-nowrap leading-none tracking-[.02em] text-[9px] sm:text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-[3px]">
        Out of Stock
      </div>
      <svg class="-mt-[1px] sm:-mt-[2px]" width="20" height="10" viewBox="0 0 22 10" aria-hidden="true">
        <path d="M0 0 L11 10 L22 0 Z" fill="black"></path>
      </svg>
    </div>
  `
  : showLimited
    ? `
    <div class="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
      <div class="bg-black text-white uppercase whitespace-nowrap leading-none tracking-[.02em] text-[9px] sm:text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-[3px]">
        ${limitedLabel}
      </div>
      <svg class="-mt-[1px] sm:-mt-[2px]" width="20" height="10" viewBox="0 0 22 10" aria-hidden="true">
        <path d="M0 0 L11 10 L22 0 Z" fill="black"></path>
      </svg>
    </div>
  `
    : "";


  const card = document.createElement("div");
  card.className = "home-promo-card flex flex-col gap-2 w-full max-w-[30rem] text-center items-center";

  card.innerHTML = `
<div class="w-full">
  <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
    <div class="relative w-full aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden group image-hover-group">
      ${badgeHTML}

      <!-- Base image -->
      <img
        src="${imageUrl}"
        alt="${product.name || ''}"
        class="absolute inset-0 w-full h-full object-cover block transition-opacity duration-300 ease-out ${isOut ? 'opacity-60' : 'group-hover:opacity-0'}"
        loading="lazy" decoding="async"
      />
      <!-- Hover image -->
      <img
        src="${hoverImage}"
        alt=""
        class="absolute inset-0 w-full h-full object-cover block ${isOut ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 ease-out"
        loading="lazy" decoding="async"
      />

      <!-- Social/Meta Pills -->
      <div class="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2">
        <!-- Like Pill -->
        <div class="like-wrapper flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-sm"
             data-sku="${sku}" data-productid="${productId}">
          <button class="like-btn flex items-center justify-center w-3 h-3 md:w-7 md:h-7 rounded-full transition-all" aria-label="Like">
            <svg class="w-5 h-5" viewBox="-1.6 -1.6 19.20 19.20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="1.5">
              <path d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"
                    fill="none" stroke="#000000" stroke-width="1.5" />
            </svg>
          </button>
          <span class="like-count text-sm text-black font-medium leading-none">0</span>
        </div>

        <!-- Reviews Pill -->
        <div class="review-wrapper flex items-center gap-1 px-2 py-1 bg-white rounded-full text-black"
             data-sku="${sku}"
             data-productid="${product.product_id || product.productId || sku}">
          <svg class="rating-star w-4 h-4 text-yellow-500" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id="clip-${sku}" clipPathUnits="userSpaceOnUse">
                <rect class="rating-clip" x="0" y="0" width="0" height="24"></rect>
              </clipPath>
            </defs>
            <polygon clip-path="url(#clip-${sku})"
                     points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
                     fill="currentColor"></polygon>
            <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
                     fill="none" stroke="currentColor" stroke-width="1.5"
                     stroke-linecap="round" stroke-linejoin="round"></polygon>
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
      ${product.name}
    </div>

    <!-- Price -->
    <div class="text-black font-semibold w-full">
      ${
        isDiscounted
          ? `<span class="text-red-600 text-base">$${finalPrice.toFixed(2)}</span>
             <span class="text-gray-400 line-through text-xs ml-1">$${product.price.toFixed(2)}</span>`
          : `$${product.price.toFixed(2)}`
      }
    </div>

    <!-- Swatches -->
    <div class="flex flex-wrap gap-x-1 gap-y-1.5 justify-center md:justify-start swatch-group w-full ${isOut ? 'pointer-events-none opacity-60' : ''}">
      ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
    </div>

    <!-- CTA Button -->
    <div class="w-full flex justify-center md:justify-start">
      <button
        class="text-xs select-color-text uppercase transition-all duration-300 ${isOut ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 cursor-not-allowed'}"
        data-sku="${sku}"
        ${isOut ? 'disabled aria-disabled="true"' : 'disabled'}
      >
        ${isOut ? 'Out of Stock' : 'Select Color'}
      </button>
    </div>

  </div>
</div>
`;

  // Swatches/CTA only act if not out
  const swatchContainer = card.querySelector(".swatch-group");
  const selectText = card.querySelector(".select-color-text");

  if (!isOut) {
    swatchContainer?.addEventListener("click", (e) => {
      const btn = e.target.closest("button.color-dot");
      if (!btn || btn.disabled) return;

      const variant = btn.dataset.variant;
      const image = btn.dataset.image;

      // highlight swatch
      swatchContainer.querySelectorAll("button.color-dot").forEach(dot =>
        dot.classList.remove("ring-2", "ring-black")
      );
      btn.classList.add("ring-2", "ring-black");

      // update CTA button
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

    selectText?.addEventListener("click", () => {
      const variant = selectText.dataset.variant;
      if (!variant || selectText.disabled) return;
    });
  }

  // Register + wire cart
  window.allProducts = window.allProducts || {};
  window.allProducts[sku] = product;
  initUniversalCartHandler({ root: card });

  return card;
}
