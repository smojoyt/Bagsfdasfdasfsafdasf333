// utils/variantHelpers.js

export function getColorClass(colorName) {
  const colorMap = {
    pink: 'bg-pink-400', white: 'bg-white border', black: 'bg-black',
    red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
    yellow: 'bg-yellow-400', gray: 'bg-gray-500', brown: 'bg-amber-900',
    purple: 'bg-purple-500', orange: 'bg-orange-400', tan: 'bg-amber-300',
    gold: 'bg-yellow-300', silver: 'bg-gray-300', cream: 'bg-[#fdf6e3] border',
    ivory: 'bg-[#fffff0] border', // light ivory tone
    "black/red": "bg-gradient-to-r from-black to-red-500",
    "black/white": "bg-gradient-to-r from-black to-white border",
    "pink/white": "bg-gradient-to-r from-pink-400 to-white border",
    "pink/cream": "bg-gradient-to-r from-pink-400 via-[#fdf6e3] to-[#fdf6e3] border",
    "red/blue/cream": "bg-gradient-to-r from-red-500 via-blue-500 to-[#fdf6e3] border"
  
  };
  return colorMap[colorName.toLowerCase()] || 'bg-gray-200';
}

export function renderColorDots(options = [], stock = {}, images = {}, sku = "") {
  if (!Array.isArray(options)) return "";

  return options.map((color) => {
    const inStock = stock[color] > 0;
    const image = images[color] || "/imgs/placeholder.jpg";
    const colorClass = getColorClass(color);

    const cursorClass = inStock ? "cursor-pointer" : "cursor-not-allowed";
    const opacityClass = inStock ? "" : "opacity-30";
    const tooltip = inStock ? "" : `title="Out of Stock"`;
    const disabledAttr = inStock ? "" : "disabled";

    return `
      <button
        class="color-dot w-5 h-5 rounded-full border border-gray-300 ${colorClass} ${opacityClass} ${cursorClass}"
        data-sku="${sku}"
        data-variant="${color}"
        data-image="${image}"
        ${disabledAttr}
        ${tooltip}
      ></button>
    `;
  }).join("");
}

