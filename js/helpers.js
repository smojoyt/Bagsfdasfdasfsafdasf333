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



window.productRatings = {};

async function loadProductRatings() {
    const endpoint = "https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314/latest";
    const headers = {
        "X-Master-Key": "$2a$10$J46OeqIxDrySG761m72SB.jzEHkOGTFlf4tblSOMrzdUS81uiqEzm"
    };

    try {
        const res = await fetch(endpoint, { headers });
        const data = await res.json();
        const reviews = data?.record?.reviews || [];

        const ratings = {};
        reviews.forEach(r => {
            const pid = r.productId.trim().toUpperCase();
            if (!ratings[pid]) ratings[pid] = { total: 0, count: 0 };
            ratings[pid].total += Number(r.rating) || 0;
            ratings[pid].count += 1;
        });

        Object.entries(ratings).forEach(([productId, { total, count }]) => {
            window.productRatings[productId] = {
                averageRating: total / count,
                reviewCount: count
            };
        });

        console.log("✅ Product ratings loaded:", window.productRatings);
    } catch (err) {
        console.error("❌ Failed to load product ratings:", err);
    }
}



(async () => {
    await loadProductRatings();
    await loadProductData(); // whatever loads and calls renderCatalogCard()
})();





// Apply promotion.json discounts
window.applyPromotionsToProducts = function (products, promotions) {
    const now = new Date();
    const updated = structuredClone(products);

    for (const key in updated) {
        const product = updated[key];

            for (const promo of promotions) {
      // ❗ Only item-level promos should change product.sale_price
      if (promo.type !== "fixed" && promo.type !== "percent") continue;

      const matchesCategory = product.category === promo.category;
      const matchesPrice = promo.condition?.maxPrice ? product.price <= promo.condition.maxPrice : true;
      const matchesID = promo.condition?.product_ids ? promo.condition.product_ids.includes(product.product_id) : true;
      const isWithinDateRange = (!promo.startDate || now >= new Date(promo.startDate)) &&
        (!promo.endDate || now <= new Date(promo.endDate));
      const alreadyDiscounted = product.sale_price !== undefined && product.sale_price < product.price;

      if (matchesCategory && matchesPrice && matchesID && isWithinDateRange) {
        if (!promo.stackable && alreadyDiscounted) continue;

        product.sale_price = promo.type === "fixed"
          ? Math.max(0, product.price - promo.amount)
          : +(product.price * (1 - promo.amount / 100)).toFixed(2);
      }
    }



        // ✅ Tag product as "onsale" if sale_price exists and is lower than base price
        if (product.sale_price && product.sale_price < product.price) {
            product.tags = product.tags || [];
            if (!product.tags.includes("onsale")) {
                product.tags.push("onsale");
            }
        }
    }

    return updated;
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

async function renderCatalogCard(p) {
    // 🧾 Basic info
    const productId = (p.product_id || p.id || "").trim().toUpperCase();
    const productName = p.name || "Unnamed";
    const image = p.catalogImage || p.image || "";
    const regular = +p.price || 0;
    const sale = +p.sale_price || regular;
    const isOnSale = sale < regular;
    const tagClasses = [...(p.tags || []).map(t => t.toLowerCase()), ...(p.tags?.includes("Outofstock") ? [] : ["instock"])].join(" ");

    // 🏷️ Tags
    const tagBadges = `
        ${p.tags?.includes("Bestseller") ? `<span class="text-xs text-white bg-green-400 px-2 py-0.5 rounded-full font-bold">Bestseller</span>` : ""}
        ${p.tags?.includes("Outofstock") ? `<span class="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Out of Stock</span>` : ""}
    `;

    // 🎨 Swatches (if variants)
    let swatchHTML = "";
    const variants = p.custom1Options?.split("|").map(v => v.trim()).filter(Boolean) || [];
    if (variants.length > 1) {
        const shown = variants.slice(0, 3);
        const more = variants.length - shown.length;
        swatchHTML = `
            <div class="absolute bottom-2 left-2 flex gap-1 items-center">
                ${shown.map(color => {
            const safeClass = window.getColorClass?.(color) || "bg-gray-200";
            return `<span title="${color}" class="w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${safeClass}"></span>`;
        }).join("")}
                ${more > 0 ? `<span class="text-xs bg-gray-600 text-white px-1 rounded-full">+${more}</span>` : ""}
            </div>`;
    }

    // ⭐ Rating
    const ratingData = window.productRatings?.[productId];
    const averageRating = Math.round(ratingData?.averageRating || 0);
    const reviewCount = ratingData?.reviewCount || 0;
    const stars = "★".repeat(averageRating) + "☆".repeat(5 - averageRating);
    const ratingHTML = reviewCount > 0
        ? `<div class="text-yellow-500 text-sm mt-1"><span>${stars}</span><span class="text-gray-600 ml-1">(${reviewCount})</span></div>`
        : "";

    // 💬 Bundle Text (optional fetch)
    let bundleText = "";
    try {
        const res = await fetch("/products/bundles.json");
        const bundles = await res.json();
        const match = bundles.find(b => b.subCategory === p.subCategory && b.carttxt);
        if (match) {
            bundleText = `<span class="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-semibold uppercase">${match.carttxt}</span>`;
        }
    } catch (e) {
        console.warn("Bundle fetch failed:", e);
    }

    // 💰 Price
    const priceHTML = isOnSale
        ? `<div class="mt-2 text-sm text-green-700 font-semibold">
                Now <span class="text-xl font-bold">$${sale.toFixed(2)}</span>
                <span class="text-sm text-gray-500 line-through ml-2">$${regular.toFixed(2)}</span>
           </div>`
        : `<div class="mt-1 text-lg font-bold text-gray-800">$${regular.toFixed(2)}</div>`;

    // 🧱 Final HTML
    return `
        <div class="p-2 item ${p.category} ${tagClasses}"  
            data-name="${productName.toLowerCase()}" 
            data-price="${sale}" 
            data-discount="${isOnSale ? Math.round((regular - sale) / regular * 100) : 0}">

            <a href="${p.url}" class="block transition overflow-hidden">
                <div class="relative flex items-center justify-center">
                    <img src="${image}" alt="${productName}" class="shadow-sm hover:shadow-lg rounded-xl max-h-72 w-auto object-contain mx-auto">
                    ${swatchHTML}
                </div>

                <div class="min-h-[100px] max-w-[288px] p-2">
                    
                    <h2 class="text-base sm:text-lg md:text-xl font-bold text-gray-800 leading-snug break-words">${productName}</h2>
                    <div class="flex flex-wrap gap-1 mb-1">${tagBadges}${bundleText}</div>
                    ${ratingHTML}
                    ${priceHTML}
                </div>
            </a>
        </div>
    `;
}




async function loadAllReviews() {
    const url = "https://drive.google.com/uc?export=download&id=1gXl4MX0sQboICfNePWtcY27Ktwnu5jbS";
    try {
        const res = await fetch(url);
        const reviews = await res.json();
        return reviews;
    } catch (err) {
        console.error("Failed to load reviews:", err);
        return {};
    }
}

function formatShortName(name = "") {
    if (!name) return "Anonymous";
    const parts = name.trim().split(" ");
    const first = parts[0];
    const lastInitial = parts[1]?.charAt(0).toUpperCase();
    return lastInitial ? `${capitalize(first)} ${lastInitial}.` : capitalize(first);
}

function capitalize(str = "") {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

window.renderCatalogCard = renderCatalogCard;
window.renderColorDots = renderColorDots;
window.applyPromotionsToProducts = applyPromotionsToProducts;
window.formatShortName = formatShortName;
