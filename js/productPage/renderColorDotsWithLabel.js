import { getColorClass } from "../utils/variantHelpers.js";

export function renderColorDotsWithLabel(options, variantStock, variantImages, productId) {
  return options.map((opt) => {
    const color = opt.trim();
    const inStock = variantStock[color] > 0;
    const image = variantImages[color] || "";
    const colorClass = getColorClass(color);

    return `
      <div class="flex flex-col items-center text-xs">
<button
  class="color-dot w-8 h-8 rounded-full border hover:border-2 hover:border-black transition  ${getColorClass(color)} ${inStock ? "" : "opacity-40 cursor-not-allowed"}"
  data-variant="${color}"
  data-image="${image}"
  data-sku="${productId}"
  title="${color}"
></button>

        <span class="mt-1 text-gray-600">${color}</span>
      </div>
    `;
  }).join("");
}
