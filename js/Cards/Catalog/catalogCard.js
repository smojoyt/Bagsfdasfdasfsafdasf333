//js/Cards/Catalog/catalogCard.js

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

  // ✅ Normalize to the real product id used by reviews JSON (e.g., "KK-1001")
  const productId =
    product.product_id ||
    product.productId ||
    product.productID ||
    product.productid ||
    "";

  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
      ? product.custom1Options.split(" | ")
      : [];

  const card = document.createElement("div");
  card.className = "home-promo-card flex flex-col gap-2 w-full max-w-[30rem] text-center items-center";

  card.innerHTML = `
<div class="w-full">
  <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
<div class="relative w-full aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden group image-hover-group">
  <!-- Base image -->
  <img
    src="${imageUrl}"
    alt="${product.name || ''}"
    class="absolute inset-0 w-full h-full object-cover block transition-opacity duration-300 ease-out group-hover:opacity-0"
    loading="lazy" decoding="async"
  />
  <!-- Hover image -->
  <img
    src="${hoverImage}"
    alt=""
    class="absolute inset-0 w-full h-full object-cover block opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
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
<div class="review-wrapper ml-auto flex items-center gap-1 px-2 py-1 bg-white rounded-full text-black
     data-sku="${sku}" data-productid="${productId}">
  <!-- Star with partial fill based on avg -->
  <span class="rating-star relative inline-block w-4 h-4" aria-hidden="true">
    <!-- outline star -->
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"></polygon>
    </svg>
    <!-- filled star, clipped by width -->
    <span class="rating-fill absolute inset-0 overflow-hidden" style="width: 0%;">
      <svg class="w-full h-full" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"></polygon>
      </svg>
    </span>
  </span>

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
    <div class="flex flex-wrap gap-x-1 gap-y-1.5 justify-center md:justify-start swatch-group w-full">
      ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
    </div>

    <!-- CTA Button -->
    <div class="w-full flex justify-center md:justify-start">
      <button
        class="text-xs select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300"
        data-sku="${sku}"
        disabled
      >
        Select Color
      </button>
    </div>

  </div>
</div>
`;

  // ✅ Swatches and button
  const swatchContainer = card.querySelector(".swatch-group");
  const selectText = card.querySelector(".select-color-text");

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

  // 🖱️ Handle "Add to Cart" click (optional direct trigger if needed)
  selectText?.addEventListener("click", () => {
    const variant = selectText.dataset.variant;
    if (!variant || selectText.disabled) return;

    // Optionally you could fire a custom event here
    // But if you're using initUniversalCartHandler, it will likely pick this up already
  });

  // 🔁 Register product globally for cart system
  window.allProducts = window.allProducts || {};
  window.allProducts[sku] = product;

  // 🛒 Wire up cart logic
  initUniversalCartHandler({ root: card });

  return card;
}
