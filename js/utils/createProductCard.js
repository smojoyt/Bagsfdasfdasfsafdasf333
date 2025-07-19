import { renderColorDots } from "./variantHelpers.js";

export function createProductCard(sku, product, currentQuery = "") {
  const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
  const hoverImage = product.catalogImageHover || imageUrl;

  const colorOptions = Array.isArray(product.custom1Options)
    ? product.custom1Options
    : typeof product.custom1Options === "string"
      ? product.custom1Options.split(" | ")
      : [];

  const card = document.createElement("div");
  card.className = "flex flex-col gap-2 w-full max-w-[30rem] items-center text-center";

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, `<span class="bg-yellow-200">$1</span>`);
  };

  card.innerHTML = `
    <div class="w-full">
      <a href="/products/${sku}.html" class="block w-full" data-sku="${sku}">
        <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
          <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
          <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </a>
      <div class="flex flex-col items-center gap-0.5 text-sm mt-5">
        <div class="font-medium text-black uppercase">
          ${highlightMatch(product.name, currentQuery)}
        </div>
        <div class="text-black">$${product.price.toFixed(2)}</div>
        <div class="flex flex-wrap justify-center gap-x-1 gap-y-1.5 mt-3 swatch-group">
          ${renderColorDots(colorOptions, product.variantStock, product.variantImages, sku)}
        </div>
        <div class="text-xs mt-1 select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300" data-sku="${sku}">
          Select Color
        </div>
      </div>
    </div>
  `;

  return card;
}
