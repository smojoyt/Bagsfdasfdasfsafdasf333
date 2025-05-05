// helpers.js

// Price formatter for compact display (used in carousels and catalog)
function getCompactPriceHTML(product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = product.tags?.includes("Onsale") && sale < regular;

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
}

// Price formatter for product page full display
function getFullPriceHTML(product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = product.tags?.includes("Onsale") && sale < regular;

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
}

// Product card renderer for catalog
function renderCatalogCard(p) {
    const tagClasses = p.tags ? p.tags.map(t => t.toLowerCase()).join(" ") : "";
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
                    <span class="bg-green-100 text-green-700 text-xs italic px-2 py-0.5 rounded">
                        You save $${(regular - sale).toFixed(2)}
                    </span>
                </div>
            </div>`
        : `<div class="text-base text-gray-800 font-medium mt-2">$${regular.toFixed(2)}</div>`;

    const tagBadges = `
        ${p.tags?.includes("Bestseller") ? `<span class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Bestseller</span>` : ""}
        ${p.tags?.includes("Outofstock") ? `<span class="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Out of Stock</span>` : ""}
        ${hasVariants ? `<span class="text-xs text-gray-500 ml-2">More colors available</span>` : ""}
    `;

    return `
    <div class="p-4 item ${p.category} ${tagClasses}" data-name="${p.name.toLowerCase()}" data-price="${p.price}">
        <a href="${p.url}" class="block bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
            <div class="bg-white aspect-[4/3] flex items-center justify-center">
                <img src="${p.image}" alt="${p.name}" class="w-full h-64 object-contain mx-auto">
            </div>
            <div class="p-4">
                <h2 class="text-sm font-semibold line-clamp-2 min-h-[2rem]">${p.name}</h2>
                ${priceBlock}
                <div class="flex flex-wrap gap-1 mt-2">
                    ${tagBadges}
                </div>
            </div>
        </a>
    </div>`;
}

