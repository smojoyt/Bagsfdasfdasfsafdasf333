export function getColorClass(colorName) {
  const colorMap = {
    pink: 'bg-pink-400', white: 'bg-white border', black: 'bg-black',
    red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
    yellow: 'bg-yellow-400', gray: 'bg-gray-500', brown: 'bg-amber-900',
    purple: 'bg-purple-500', orange: 'bg-orange-400', tan: 'bg-amber-300',
    gold: 'bg-yellow-300', silver: 'bg-gray-300', cream: 'bg-[#fdf6e3] border',
    "black/red": "bg-gradient-to-r from-black to-red-500",
    "black/white": "bg-gradient-to-r from-black to-white border",
    "pink/white": "bg-gradient-to-r from-pink-400 to-white border",
    "pink/cream": "bg-gradient-to-r from-pink-400 via-[#fdf6e3] to-[#fdf6e3] border",
    "red/blue/cream": "bg-gradient-to-r from-red-500 via-blue-500 to-[#fdf6e3] border"
  };
  return colorMap[colorName.toLowerCase()] || 'bg-gray-200';
}

// utils/variantHelpers.js
export function renderColorDots(optionsStr, stockObj = {}, imageObj = {}) {
  return optionsStr.split("|").map(opt => {
    const name = opt.trim();
    const isOut = stockObj[name] === 0;
    const image = imageObj?.[name] || "";

    if (isOut) {
      return `<button 
        type="button" 
        class="w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${getColorClass(name)} grayscale opacity-50 cursor-not-allowed block transition" 
        title="${name} (Out of Stock)" 
        disabled>
      </button>`;
    }

    return `<button 
      type="button" 
      class="w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${getColorClass(name)} hover:ring-2 hover:scale-110 transition cursor-pointer" 
      title="${name}" 
      data-color="${name}" 
      data-image="${image}">
    </button>`;
  }).join("");
}
