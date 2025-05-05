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
    const tagClasses = product.tags ? product.tags.map(t => t.toLowerCase()).join(" ") : "";
    const moreColors = (product.custom1Options && product.custom1Options.split("|").length > 1)
        ? `<div class="text-[11px] text-gray-500 mt-1">More colors available</div>`
        : "";

    return `
    <div class="item ${product.category} ${tagClasses}" data-name="${product.name.toLowerCase()}" data-price="${product.price}">
        <a href="${product.url}" class="block bg-white shadow-sm border hover:shadow-md transition rounded-lg overflow-hidden">
            <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover" />
            <div class="p-4 text-left">
                <h2 class="text-lg font-bold">${product.name}</h2>
                ${getCompactPriceHTML(product)}
                ${product.tags?.includes("Onsale") ? '<span class="inline-block text-xs mt-1 text-red-500 bg-red-100 px-2 py-1 rounded">On Sale</span>' : ""}
                ${product.tags?.includes("Outofstock") ? '<span class="inline-block text-xs mt-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Out of Stock</span>' : ""}
                ${product.tags?.includes("Bestseller") ? '<span class="inline-block text-xs mt-1 text-green-600 bg-green-100 px-2 py-1 rounded">Bestseller</span>' : ""}
                ${moreColors}
            </div>
        </a>
    </div>`;
}
