import { renderColorDots } from "./variantHelpers.js";

export function createFeaturedCard(sku, product, currentQuery = "", promo = null) {
  const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
  const hoverImage = product.catalogImageHover || imageUrl;

  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
    ? product.custom1Options.split(" | ")
    : [];

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, `<span class="bg-yellow-200">$1</span>`);
  };

// ✅ Correct Price + Promotion Logic
// ✅ Determine Discount Price
let finalPrice = Number(product.price) || 0;
let originalPrice = null;

if (promo && typeof promo.amount === "number") {
  const promoCat = promo.category?.toLowerCase();
  const productCat = (Array.isArray(product.category) ? product.category[0] : product.category)?.toLowerCase();
  const now = new Date();
  const start = new Date(promo.startDate || "2000-01-01");
  const end = new Date(promo.endDate || "9999-12-31");

  const promoIsActive =
    promo.featured &&
    now >= start &&
    now <= end &&
    promoCat === productCat &&
    (!promo.condition?.minPrice || finalPrice >= promo.condition.minPrice) &&
    (!promo.condition?.maxPrice || finalPrice <= promo.condition.maxPrice);

  if (promoIsActive) {
    originalPrice = finalPrice;

    if (promo.type === "percent") {
      finalPrice = +(originalPrice * (1 - promo.amount / 100)).toFixed(2);
    } else if (promo.type === "fixed") {
      finalPrice = Math.max(0, +(originalPrice - promo.amount).toFixed(2));
    }
  }
}



  const card = document.createElement("div");
  card.className =
    "mx-auto snap-start flex-shrink-0 w-[78%] sm:w-[75%] md:w-auto max-w-xs md:[&:nth-child(n+6)]:hidden";

  card.innerHTML = `
  <div class="w-full">
    <a href="/pages/product.html?sku=${sku}" class="block w-full" data-sku="${sku}">
      <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
        <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
        <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </a>

    <div class="flex flex-col items-left text-left mt-3 space-y-1 px-2">
      <div class="flex justify-between items-center w-full text-md sm:text-base font-bold text-black uppercase tracking-tight">
        <div class="text-left break-words flex-1">${highlightMatch(product.name, currentQuery)}</div>
<div class="text-right whitespace-nowrap pl-4">
  ${
    originalPrice && finalPrice < originalPrice
      ? `<span class="line-through text-gray-400 mr-1 text-sm">$${originalPrice.toFixed(2)}</span>
         <span class="text-green-700 font-bold">$${finalPrice.toFixed(2)}</span>`
      : `<span class="text-black font-bold">$${finalPrice.toFixed(2)}</span>`
  }
</div>



      </div>

      <div class="flex justify-between items-center mt-2 gap-1 w-full">
        <div class="flex flex-wrap gap-1 swatch-group max-w-[6rem]">
          ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
        </div>
        <div class="text-right text-xs select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300" data-sku="${sku}">
          Select Color
        </div>
      </div>
    </div>
  </div>
`;


  return card;
}
