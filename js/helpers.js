// 📁 helpers.js — All shared logic across product pages and carousels

// Color mapping for swatches
window.getColorClass = function (colorName) {
    const colorMap = {
        pink: 'bg-pink-400', white: 'bg-white border', black: 'bg-black',
        red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
        yellow: 'bg-yellow-400', gray: 'bg-gray-500', brown: 'bg-amber-900',
        purple: 'bg-purple-500', orange: 'bg-orange-400', tan: 'bg-amber-300',
        gold: 'bg-yellow-300', silver: 'bg-gray-300', cream: 'bg-[#fdf6e3] border',

        // Gradients
        "black/red": "bg-gradient-to-r from-black to-red-500",
        "black/white": "bg-gradient-to-r from-black to-white border",
        "pink/white": "bg-gradient-to-r from-pink-400 to-white border",
        "pink/cream": "bg-gradient-to-r from-pink-400 via-[#fdf6e3] to-[#fdf6e3] border",
        "red/blue/cream": "bg-gradient-to-r from-red-500 via-blue-500 to-[#fdf6e3] border"
    };
    return colorMap[colorName.toLowerCase()] || 'bg-gray-200';
};

// Render color dots
window.renderColorDots = function (optionsStr, stockObj = {}) {
    return optionsStr.split("|").map(opt => {
        const name = opt.trim();
        const isOut = stockObj[name] === 0;
        if (isOut) return "";
        return `<span title="${name}" class="w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${getColorClass(name)} block"></span>`;
    }).join("");
};

// Apply promotion.json discounts
window.applyPromotions = function (products, promotions) {
    const now = new Date();
    for (const key in products) {
        const product = products[key];
        for (const promo of promotions) {
            const matchesCategory = product.category === promo.category;
            const matchesPrice = promo.condition?.maxPrice ? product.price <= promo.condition.maxPrice : true;
            const matchesID = promo.condition?.product_ids ? promo.condition.product_ids.includes(product.product_id) : true;
            const isWithinDateRange = (!promo.startDate || now >= new Date(promo.startDate)) && (!promo.endDate || now <= new Date(promo.endDate));
            const alreadyDiscounted = product.sale_price !== undefined && product.sale_price < product.price;

            if (matchesCategory && matchesPrice && matchesID && isWithinDateRange) {
                if (!promo.stackable && alreadyDiscounted) continue;
                product.sale_price = promo.type === "fixed"
                    ? promo.amount
                    : +(product.price * (1 - promo.amount / 100)).toFixed(2);
            }
        }
    }
};

// Compact price for carousel, cards, etc.
window.getCompactPriceHTML = function (product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = sale < regular;
    if (isOnSale) {
        return `
            <div class="flex flex-col items-center gap-1">
                <div class="text-red-600 font-bold text-sm">
                    $${sale.toFixed(2)}
                    <span class="text-xs text-gray-500 line-through ml-1">$${regular.toFixed(2)}</span>
                </div>
                <div class="bg-red-100 text-red-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    On Sale
                </div>
            </div>
        `;
    } else {
        return `<div class="text-sm text-gray-600">$${regular.toFixed(2)}</div>`;
    }
};

// Full price for product detail page
window.getFullPriceHTML = function (product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = sale < regular;
    if (isOnSale) {
        const saved = (regular - sale).toFixed(2);
        const percentOff = Math.round((saved / regular) * 100);
        return `
            <p class="italic text-green-700 text-xl font-bold">
                Now <span class="text-3xl">$${sale.toFixed(2)}</span>
                <span class="text-gray-500 line-through text-base ml-2">$${regular.toFixed(2)}</span>
            </p>
            <span class="mr-2 text-sm bg-red-100 text-red-600 font-semibold px-2 py-1 rounded">
                ${percentOff}% OFF
            </span>
            <div class="bg-green-100 text-green-700 text-sm font-semibold inline-block mt-1 px-2 py-1 rounded">
                You save $${saved}
            </div>
        `;
    } else {
        return `<p class="italic text-2xl font-semibold">$${regular.toFixed(2)}</p>`;
    }
};


// Product card renderer for catalog
function renderCatalogCard(p) {
    const tagClasses = [
        ...(p.tags ? p.tags.map(t => t.toLowerCase()) : []),
        ...(p.tags?.includes("Outofstock") ? [] : ["instock"])
    ].join(" ");

    const hasVariants = p.custom1Options && p.custom1Options.split("|").length > 1;
    const regular = p.price;
    const sale = p.sale_price ?? regular;
    const isOnSale = p.tags?.includes("Onsale") && sale < regular;

    const priceBlock = isOnSale
        ? `<div class="mt-2">
                <p class="text-green-700 italic font-semibold text-sm">
                    Now <span class="text-xl font-bold">$${sale.toFixed(2)}</span>
                    <span class="text-sm text-gray-500 line-through ml-2">$${regular.toFixed(2)}</span>
                </p>
                <div class="flex gap-2 mt-1">
                    <span class="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">
                        ${Math.round(((regular - sale) / regular) * 100)}% OFF
                    </span>
                    
                </div>
            </div>`
        : `<div class="text-base text-gray-800 font-medium mt-2">$${regular.toFixed(2)}</div>`;

    const tagBadges = `
    ${p.tags?.includes("Bestseller") ? `<span class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Bestseller</span>` : ""}
    ${p.tags?.includes("Outofstock") ? `<span class="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Out of Stock</span>` : ""}
`;
    // ⬆️ No more color dots here



    return `
    <div class="p-2 item ${p.category} ${tagClasses}" 
     data-name="${p.name.toLowerCase()}" 
     data-price="${p.price}" 
     data-discount="${isOnSale ? Math.round(((regular - sale) / regular) * 100) : 0}">

        <a href="${p.url}" class="block bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
            <div class="relative bg-white flex items-center justify-center">
    <img src="${p.image}" alt="${p.name}" class="max-h-72 w-auto object-contain mx-auto">
    ${hasVariants ? `
        <div class="absolute bottom-2 left-2 flex gap-1">
            ${renderColorDots(p.custom1Options)}
        </div>` : ""}
</div>

            <div class="min-h-[100px] max-w-[192px] p-2">
                                        <h2 class="text-sm sm:text-base font-semibold line-clamp-2 min-h-[2rem]">${p.name}</h2>
                                        ${priceBlock}
                                        <div class="flex flex-wrap gap-1 mt-2">${tagBadges}</div>
                                    </div>
        </a>
    </div>`;
}
// You save part
//<span class="bg-green-100 text-green-700 text-xs italic px-2 py-0.5 rounded">
//                        You save $${ (regular - sale).toFixed(2) }
//

// Export globally so other scripts (like catalog.js) can use it
window.renderCatalogCard = renderCatalogCard;
