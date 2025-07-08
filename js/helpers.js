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
// 🛠 FIXED: Now deducts amount instead of setting price to amount
// ✅ FINAL version — only this should be used
// ✅ Final version — returns a cloned and updated product list
window.applyPromotionsToProducts = function (products, promotions) {
    const now = new Date();
    const updated = structuredClone(products);

    for (const key in updated) {
        const product = updated[key];
        for (const promo of promotions) {
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


function renderCatalogCard(p) {
    const tagClasses = [
        ...(p.tags ? p.tags.map(t => t.toLowerCase()) : []),
        ...(p.tags?.includes("Outofstock") ? [] : ["instock"])
    ].join(" ");

    const hasVariants = p.custom1Options && p.custom1Options.split("|").length > 1;
    const regular = p.price;
    const sale = p.sale_price ?? regular;
    const isOnSale = sale < regular; // ✅ Fixed this

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
        : `<div class="mt-1 text-lg font-bold text-gray-800">$${regular.toFixed(2)}</div>`;

    const tagBadges = `
        ${p.tags?.includes("Bestseller") ? `<span class="text-xs text-white bg-green-400 px-2 py-0.5 rounded-full font-bold">Bestseller</span>` : ""}
        ${p.tags?.includes("Outofstock") ? `<span class="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Out of Stock</span>` : ""}
    `;

    return `
    <div class="p-2 item ${p.category} ${tagClasses} ${isOnSale ? "on-sale" : ""}"  
     data-name="${p.name.toLowerCase()}" 
     data-price="${sale}" 
     data-discount="${isOnSale ? Math.round(((regular - sale) / regular) * 100) : 0}">

        <a href="${p.url}" class="block transition overflow-hidden">
            <div class="relative flex items-center justify-center">
                <img src="${p.image}" alt="${p.name}" class="shadow-sm hover:shadow-lg rounded-xl max-h-72 w-auto object-contain mx-auto">
                ${hasVariants ? `
                    <div class="absolute bottom-2 left-2 flex gap-1">
                        ${renderColorDots(p.custom1Options)}
                    </div>` : ""}
            </div>

            <div class="min-h-[100px] max-w-[288px] p-2">
                <h2 class="text-base sm:text-lg md:text-xl font-bold text-gray-800 leading-snug break-words">${p.name}</h2>
                ${priceBlock}
                <div class="flex flex-wrap gap-1 mt-2">${tagBadges}</div>
            </div>
        </a>
    </div>`;
}

async function loadAllReviews() {
    const url = "https://drive.google.com/uc?export=download&id=1gXl4MX0sQboICfNePWtcY27Ktwnu5jbS";
    try {
        const res = await fetch(url);
        const reviews = await res.json();
        return reviews; // { productId: [ { name, rating, review, ... } ] }
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



// You save part
//<span class="bg-green-100 text-green-700 text-xs italic px-2 py-0.5 rounded">
//                        You save $${ (regular - sale).toFixed(2) }
//

// Export globally so other scripts (like catalog.js) can use it
window.renderCatalogCard = renderCatalogCard;

// 🔄 Render a compact recommended product card
function renderMiniProductCard(p, cart) {
    if (!p || !p.name || !p.product_id || !p.price) return "";

    // 🔐 Ensure the original key from window.allProducts is attached
    if (!p._key) {
        p._key = Object.keys(window.allProducts).find(k => window.allProducts[k].product_id === p.product_id);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "flex gap-3 items-start";

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.className = "w-16 h-16 rounded object-cover border";

    const info = document.createElement("div");
    info.className = "flex flex-col text-sm flex-1";

    const name = document.createElement("p");
    name.className = "font-bold leading-snug text-black";
    name.textContent = p.name;

    const price = document.createElement("div");
    price.innerHTML = getCompactPriceHTML(p);

    let selectedVariant = p.custom1Options?.split("|")[0]?.trim() || "";
    const swatchRow = document.createElement("div");
    swatchRow.className = "flex gap-1 mt-1";

    const colors = p.custom1Options?.split("|").map(c => c.trim()) || [];
    colors.forEach(color => {
        const dot = document.createElement("span");
        dot.className = `w-5 h-5 rounded-full border ${getColorClass(color)} cursor-pointer`;
        dot.title = color;

        dot.onclick = () => {
            selectedVariant = color;
            [...swatchRow.children].forEach(d => d.classList.remove("ring-2", "ring-black"));
            dot.classList.add("ring-2", "ring-black");
        };

        swatchRow.appendChild(dot);
    });

    const btn = document.createElement("button");
    btn.className = "mt-2 text-xs px-3 py-1 rounded-full bg-black text-white hover:bg-gray-900 font-semibold";
    btn.textContent = "Add to Cart";

    btn.onclick = () => {
        const fullProduct = window.allProducts?.[p._key];
        if (!fullProduct) {
            console.error("⚠️ Full product not found for key:", p._key);
            return;
        }

        console.log("🧪 Add to cart triggered from sidebar", {
            key: p._key,
            variant: selectedVariant,
            fullProduct
        });

        addToCart(p._key, selectedVariant, {
            id: fullProduct.product_id,
            name: fullProduct.name,
            image: fullProduct.variantImages?.[selectedVariant] || fullProduct.image,
            price: typeof fullProduct.sale_price === "number" ? fullProduct.sale_price : fullProduct.price,
            originalPrice: fullProduct.price
        });
    };



    info.appendChild(name);
    info.appendChild(price);
    if (colors.length > 1) info.appendChild(swatchRow);
    info.appendChild(btn);

    wrapper.appendChild(img);
    wrapper.appendChild(info);

    return wrapper;
}



// 🎯 Filter for eligible products not in cart
function getEligibleRecommendations(allProducts, cart) {
    const cartIds = cart.map(i => i.id);
    const categories = ["bags", "headwear", "charms"];
    const picks = [];

    for (const category of categories) {
        const eligible = Object.entries(allProducts).filter(([key, p]) =>
            p.category === category &&
            !cartIds.includes(key) &&
            !p.tags?.includes("Outofstock") &&
            p.image &&
            p.name &&
            typeof p.price === "number"
        );

        if (eligible.length > 0) {
            const [key, product] = eligible[Math.floor(Math.random() * eligible.length)];
            product._key = key; // 🔑 Save the original key
            picks.push(product);
        }
    }

    return picks;
}




window.renderSidebarRecommendation = function (containerSelector, allProducts, cart = []) {
    console.group("🧠 Recommended Render");
    console.log("Available products:", Object.keys(allProducts).length);
    console.log("Cart items:", cart.map(i => i.id));

    let recommended = getEligibleRecommendations(allProducts, cart);

    console.log("Final recommendations:", recommended.map(p => p.product_id));
    console.groupEnd();

    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-4";

    recommended.forEach(p => {
        const card = renderMiniProductCard(p, cart);
        if (card) wrapper.appendChild(card);
    });

    container.appendChild(wrapper);
};

window.addToCart = function (key, variant, itemDetails = {}) {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    const product = window.allProducts?.[key];
    const existingIndex = cart.findIndex(i => i.id === key && i.variant === variant);

    const enrichedItem = {
        id: key,
        name: itemDetails.name || product?.name || "Unnamed",
        image: itemDetails.image || product?.variantImages?.[variant] || product?.image || "/imgs/placeholder.png",
        price: itemDetails.price ?? (typeof product?.sale_price === "number" ? product.sale_price : product?.price ?? 0),
        originalPrice: itemDetails.originalPrice ?? product?.price ?? 0,
        variant,
        qty: 1
    };

    if (existingIndex !== -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push(enrichedItem);
    }

    localStorage.setItem("savedCart", JSON.stringify(cart));

    if (typeof renderCart === "function") renderCart();
    if (typeof updateCartCount === "function") updateCartCount();
};



window.renderColorDots = renderColorDots;
window.applyPromotionsToProducts = applyPromotionsToProducts;
window.formatShortName = formatShortName;
window.renderCatalogCard = renderCatalogCard;
window.renderSidebarRecommendation = renderSidebarRecommendation;
