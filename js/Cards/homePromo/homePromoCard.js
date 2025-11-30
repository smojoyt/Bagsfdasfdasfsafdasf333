import { renderColorDots } from "../../utils/variantHelpers.js";
import { initUniversalCartHandler } from "../../Cart/addToCart.js";
import {
  getPromotions,
  matchPromotion,
  calculateDiscountedPrice,
} from "../../Promotions/index.js";


export async function createHomePromoCard(sku, product) {
  const allPromos = await getPromotions();

  // 🔹 Only use item-level promos (ignore cart_bogo)
  const promoList = allPromos.filter(
    (p) => p.type === "fixed" || p.type === "percent" || !p.type
  );

  const activePromo = matchPromotion(product, promoList);
  const finalPrice = calculateDiscountedPrice(product, activePromo);
  const isDiscounted = finalPrice < product.price;

  const imageUrl =
    product.catalogImage || product.image || "/imgs/placeholder.jpg";
  const hoverImage = product.catalogImageHover || imageUrl;

  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
    ? product.custom1Options.split(" | ")
    : [];

  // ---------- Total stock detection ----------
  // ---------- Total stock detection ----------
const { totalStock } = (() => {
  let total = 0;

  // 1) Simple numeric stock fields
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

  // Unknown → no badge
  return { totalStock: Infinity };
})();

// 🚩 Stock flags
const isOut =
  Number.isFinite(totalStock) && totalStock <= 0;

const isLastOne =
  Number.isFinite(totalStock) &&
  !isOut &&
  totalStock === 1;

const showLimited =
  Number.isFinite(totalStock) &&
  !isOut &&
  !isLastOne &&
  totalStock > 0 &&
  totalStock <= 3;

// Labels
const limitedLabel =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(max-width: 360px)").matches
    ? "Limited Qty"
    : "Limited Quantity";

const lastOneLabel = "LAST ONE LEFT!!";

const badgeHTML =
  isOut || isLastOne || showLimited
    ? `
      <div class="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
        <div class="bg-black text-white uppercase whitespace-nowrap leading-none tracking-[.02em] text-[9px] sm:text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-[3px]">
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


  const card = document.createElement("div");
  card.className =
    "home-promo-card flex flex-col gap-2 w-full max-w-[22rem] text-center items-center";

  card.innerHTML = `
<div class="w-full">
  <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
    <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
      ${badgeHTML}
      <img
        src="${imageUrl}"
        alt="${product.name || ""}"
        class="w-full h-full object-cover transition-opacity duration-300 ${
          isOut ? "opacity-60" : "group-hover:opacity-0"
        } product-img"
        loading="lazy" decoding="async"
      />
      <img
        src="${hoverImage}"
        alt=""
        class="w-full h-full object-cover absolute inset-0 ${
          isOut ? "hidden" : "opacity-0 group-hover:opacity-100"
        } transition-opacity duration-300"
        loading="lazy" decoding="async"
      />
    </div>
  </a>

  <div class="px-5 flex flex-col gap-2 mt-4 text-sm w-full">
    <!-- Name + Price -->
    <div class="flex justify-between items-center w-full">
      <div class="font-medium text-black uppercase text-left">${product.name}</div>
      <div class="text-black font-semibold text-right">
        ${
          isDiscounted
            ? `<span class="text-red-600 text-base">$${finalPrice.toFixed(
                2
              )}</span>
               <span class="text-gray-400 line-through text-xs ml-1">
                 $${product.price.toFixed(2)}
               </span>`
            : `$${product.price.toFixed(2)}`
        }
      </div>
    </div>

    <!-- Swatches + CTA Button Row -->
    <div class="flex justify-between items-center w-full">
      <div class="flex flex-wrap gap-x-1 gap-y-1.5 swatch-group ${
        isOut ? "pointer-events-none opacity-60" : ""
      }">
        ${renderColorDots(
          colorOptions,
          product.variantStock,
          product.variantImages,
          sku
        )}
      </div>
      <button
        class="text-xs select-color-text uppercase transition-all duration-300 ml-2 shrink-0 ${
          isOut ? "text-gray-400 cursor-not-allowed" : "text-gray-500 cursor-not-allowed"
        }"
        data-sku="${sku}"
        ${isOut ? 'disabled aria-disabled="true"' : "disabled"}
      >
        ${isOut ? "Out of Stock" : "Select Color"}
      </button>
    </div>
  </div>
</div>
`;

  // Swatches and CTA
  const swatchContainer = card.querySelector(".swatch-group");
  const selectText = card.querySelector(".select-color-text");

  if (!isOut) {
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
      // cart handler will intercept
    });
  }

  // Register + wire cart
  window.allProducts = window.allProducts || {};
  window.allProducts[sku] = product;
  initUniversalCartHandler({ root: card });

  return card;
}
