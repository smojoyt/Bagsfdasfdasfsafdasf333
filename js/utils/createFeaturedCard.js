import { renderColorDots } from "./variantHelpers.js";

export function createFeaturedCard(sku, product, currentQuery = "") {
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

  const card = document.createElement("div");
  card.className =
    "mx-auto snap-start flex-shrink-0 w-[48%] sm:w-[45%] md:w-auto max-w-xs md:[&:nth-child(n+6)]:hidden";

  card.innerHTML = `
    <div class="w-full">
      <a href="/products/${sku}.html" class="block w-full" data-sku="${sku}">
        <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
          <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
          <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </a>

      <div class="flex flex-col items-left text-left mt-3 space-y-1 px-2">
        <div class="flex justify-between items-center w-full text-sm sm:text-base font-semibold text-black uppercase tracking-tight">
  <div class="text-left break-words flex-1">
    ${highlightMatch(product.name, currentQuery)}
  </div>
  <div class="text-green-700 font-bold text-right whitespace-nowrap pl-4">
    $${product.price.toFixed(2)}
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
