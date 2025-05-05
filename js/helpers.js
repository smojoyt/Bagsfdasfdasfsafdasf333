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
function renderCatalogCard(product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = product.tags?.includes("Onsale") && sale < regular;
    const hasMultipleColors = product.custom1Options && product.custom1Options.split("|").length > 1;

    const priceHTML = isOnSale
        ? `
        <div class="text-red-600 font-semibold text-sm">
            $${sale.toFixed(2)}
            <span class="text-xs text-gray-500 line-through ml-2">$${regular.toFixed(2)}</span>
        </div>`
        : `<div class="text-gray-700 text-sm font-medium">$${regular.toFixed(2)}</div>`;

    const badges = [];
    if (isOnSale) badges.push('<span class="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">On Sale</span>');
    if (product.tags?.includes("Bestseller")) badges.push('<span class="bg-green-100 text-green-600 text-xs font-semibold px-2 py-0.5 rounded">Bestseller</span>');
    if (product.tags?.includes("Outofstock")) badges.push('<span class="bg-yellow-100 text-yellow-600 text-xs font-semibold px-2 py-0.5 rounded">Out of Stock</span>');
    if (hasMultipleColors) badges.push('<span class="text-gray-500 text-[11px] mt-1 block">More colors available</span>');

    return `
        <div class="item ${product.category} ${product.tags?.map(t => t.toLowerCase()).join(" ")}" data-name="${product.name.toLowerCase()}" data-price="${product.price}">
            <a href="${product.url}" class="block bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div class="bg-white w-full aspect-[4/3] overflow-hidden flex items-center justify-center">
                    <img src="${product.image}" alt="${product.name}" class="object-contain w-full h-full" />
                </div>
                <div class="p-3 flex flex-col justify-between min-h-[130px]">
                    <div class="text-sm font-semibold leading-snug line-clamp-2">${product.name}</div>
                    ${priceHTML}
                    <div class="mt-2 flex flex-wrap gap-1">
                        ${badges.join("")}
                    </div>
                </div>
            </a>
        </div>
    `;
}

