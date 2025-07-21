import { renderColorDots } from "../utils/variantHelpers.js";
import { initUniversalCartHandler } from "../Cart/addToCart.js";
import { getPromotions, matchPromotion, calculateDiscountedPrice } from "../Promotions/promotions.js";

export async function createTestCard(sku, product) {
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
  card.className = "product-test-card flex flex-col gap-2 w-full max-w-[20rem] text-center items-center";

  card.innerHTML = `
    <div class="w-full">
      <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
        <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
          <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
          <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </a>
      <div class="flex flex-col items-center gap-0.5 text-sm mt-4">
        <div class="font-medium text-black uppercase">${product.name}</div>
        <div class="text-black font-semibold">
          ${isDiscounted
            ? `<span class="text-red-600 text-lg">$${finalPrice.toFixed(2)}</span>
               <span class="text-gray-400 line-through text-sm ml-1">$${product.price.toFixed(2)}</span>`
            : `$${product.price.toFixed(2)}`
          }
        </div>
        <div class="flex flex-wrap justify-center gap-x-1 gap-y-1.5 mt-3 swatch-group">
          ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
        </div>
        <div class="text-xs mt-1 select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300" data-sku="${sku}">
          Select Color
        </div>
      </div>
    </div>
  `;

  // ✅ Define swatch and selectText elements
  const swatchContainer = card.querySelector(".swatch-group");
  const selectText = card.querySelector(".select-color-text");

  // 🖱️ Enable swatch click logic
  swatchContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest("button.color-dot");
    if (!btn || btn.disabled) return;

    const variant = btn.dataset.variant;
    const image = btn.dataset.image;

    swatchContainer.querySelectorAll("button.color-dot").forEach(dot =>
      dot.classList.remove("ring-2", "ring-black")
    );
    btn.classList.add("ring-2", "ring-black");

    if (selectText) {
      selectText.dataset.variant = variant;
      selectText.textContent = "Add to Cart";
      selectText.classList.remove("text-gray-500", "cursor-not-allowed");
      selectText.classList.add("text-black", "cursor-pointer");
    }

    const img = card.querySelector(".image-hover-group > img");
    if (img && image) img.src = image;
  });

  // 🔁 Register product globally
  window.allProducts = window.allProducts || {};
  window.allProducts[sku] = product;

  // 🛒 Initialize cart logic
  initUniversalCartHandler({ root: card });

  return card;
}
