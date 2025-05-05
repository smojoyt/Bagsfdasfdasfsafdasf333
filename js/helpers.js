// helpers.js

// Full HTML layout for product detail pages
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
        </div>`;
    } else {
        return `<p class="italic text-2xl font-semibold">$${regular.toFixed(2)}</p>`;
    }
}

// Compact layout for carousels or previews
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
        </div>`;
    } else {
        return `<div class="text-sm text-gray-600">$${regular.toFixed(2)}</div>`;
    }
}
