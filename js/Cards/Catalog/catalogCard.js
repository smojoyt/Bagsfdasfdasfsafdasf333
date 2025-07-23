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
    <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
      <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
      <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
