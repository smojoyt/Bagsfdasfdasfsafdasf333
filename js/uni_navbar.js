// 🛠️ Fixed and enhanced uni_navbar.js

// create-checkout-session.js — no change needed for splitting bundles

// uni_navbar.js — updated logic for splitting bundles and applying promos properly

// ✅ Only run once and make sure it's globally available
if (!window.allProducts) {
    fetch('/products/products.json')
        .then(res => res.json())
        .then(data => {
            window.allProducts = data;
            console.log("🌍 window.allProducts loaded:", Object.keys(data).length);
            renderCart(); // ✅ Now safe to render
        });
}


async function triggerStripeCheckout() {
    const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const finalCart = await bundleDetector(rawCart);


    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: finalCart })
    });


    const data = await res.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        alert("Checkout failed.");
    }
}

function saveCart(cart) {
    localStorage.setItem("savedCart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
}




async function bundleDetector(cart) {
    try {
        const [bundleRes, productRes, promoRes] = await Promise.all([
            fetch("/products/bundles.json"),
            fetch("/products/products.json"),
            fetch("/products/promotion.json")
        ]);

        const bundles = await bundleRes.json();
        const products = await productRes.json();
        const { promotions } = await promoRes.json();
        const now = new Date();

        const idToCategory = {}, idToSubCategory = {}, idToPrice = {}, idToKey = {};
        for (const key in products) {
            const prod = products[key];
            if (prod.product_id) {
                idToCategory[prod.product_id] = prod.category || "";
                idToSubCategory[prod.product_id] = prod.subCategory || "";
                idToPrice[prod.product_id] = prod.price;
                idToKey[prod.product_id] = key;
            }
        }

        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            const category = idToCategory[item.id] || "";
            const subCategory = idToSubCategory[item.id] || "";
            const productKey = idToKey[item.id] || "";
            const basePrice = idToPrice[item.id];
            for (let i = 0; i < qty; i++) {
                flatCart.push({
                    ...item,
                    qty: 1,
                    _used: false,
                    category,
                    subCategory,
                    productKey,
                    price: basePrice
                });
            }
        }

        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;
            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                if (bundle.subCategory && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        i.subCategory === bundle.subCategory &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.category && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        i.category === bundle.category &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.specificSkus && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        bundle.specificSkus.includes(i.productKey) &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.requiredSubCategories) {
                    let matchList = [];
                    for (const sub of bundle.requiredSubCategories) {
                        const found = flatCart.find(i =>
                            !i._used &&
                            i.subCategory === sub &&
                            !(bundle.excludeSkus || []).includes(i.id)
                        );
                        if (found) matchList.push(found);
                    }

                    if (matchList.length === bundle.requiredSubCategories.length) {
                        if (bundle.priceRule === "charmFree" && bundle.discountTarget) {
                            matchList.forEach(i => {
                                if (i.subCategory === bundle.discountTarget) {
                                    i.price = 0;
                                    i.bundleLabel = bundle.name;
                                    i._used = true;
                                }
                            });
                        } else {
                            const unit = bundle.bundlePriceTotal / matchList.length;
                            matchList.forEach(i => {
                                i.price = parseFloat(unit.toFixed(2));
                                i.bundleLabel = bundle.name;
                                i._used = true;
                            });
                        }
                        continue; // skip default match logic if already applied
                    }
                }

                if (match.length === (bundle.minQuantity || match.length) && !match.includes(undefined)) {
                    const unitPrice = bundle.bundlePriceTotal / match.length;
                    match.forEach(i => {
                        i.price = parseFloat(unitPrice.toFixed(2));
                        i.bundleLabel = bundle.name;
                        i._used = true;
                    });
                }
            }
        }

        for (const promo of promotions) {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

            if (isActive && promo.type === "percent") {
                flatCart.forEach(i => {
                    if (!i._used && i.category === promo.category && (!promo.condition?.minPrice || i.price >= promo.condition.minPrice)) {
                        const discount = i.price * (promo.amount / 100);
                        i.price = parseFloat((i.price - discount).toFixed(2));
                        i.promoLabel = promo.name;
                    }
                });
            }
        }

        flatCart.forEach(i => {
            if (!i._used) {
                i.bundleLabel = "";
                i.promoLabel = "";
            }
        });

        const grouped = {};
        flatCart.forEach(item => {
            const key = `${item.id}_${item.variant || ""}_${item.price}_${item.bundleLabel || ""}_${item.promoLabel || ""}`;
            if (!grouped[key]) grouped[key] = { ...item, qty: 1 };
            else grouped[key].qty++;
        });

        return Object.values(grouped);
    } catch (e) {
        console.error("bundleDetector failed:", e);
        return cart;
    }
}




// All other logic remains the same. Ensure renderCart() uses bundleDetector(cart) before displaying.


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}

function adjustQuantity(index, action) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    if (action === "increase") {
        cart[index].qty += 1;
    } else if (action === "decrease") {
        cart[index].qty -= 1;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
    }
    saveCart(cart);
    renderCart(); // 👈 add this to reflect changes instantly
}


function removeFromCart(id, variant) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id && item.variant === variant);
    if (index !== -1) {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }
}




function updateCartQty(id, change) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        const action = change > 0 ? "increase" : "decrease";
        adjustQuantity(index, action);
        renderCart();
    }
}




function loadBundlesAndRenderCart() {
    fetch('https://karrykraze.com/products/bundles.json')
        .then(res => {
            if (!res.ok) {
                console.error(`❌ HTTP error loading bundles.json: ${res.status}`);
                throw new Error("Network response was not ok");
            }
            return res.json();
        })
        .then(data => {
            console.log("✅ Loaded bundles:", data);
            window.bundlesData = data;
            renderCart();
        })
        .catch(err => {
            console.error("❌ Failed to load bundles.json", err);
            renderCart(); // still show cart
        });
}





// 🛠️ Full DOM-based renderCart for precise control
function renderCart() {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    bundleDetector(cart).then(updatedCart => {
        cart = updatedCart;
        localStorage.setItem("savedCart", JSON.stringify(cart));
        updateCartCount();

        const container = document.getElementById("cartItems");
        const cartTotalEl = document.getElementById("cartTotal");
        const emptyMsg = document.getElementById("emptyCartMessage");
        const checkoutBtn = document.getElementById("checkoutBtn");
        const freeShippingBar = document.getElementById("freeShippingBar");
        const freeShippingProgress = document.getElementById("freeShippingProgress");

        if (!container || !cartTotalEl) return;

        container.innerHTML = "";

        if (cart.length === 0) {
            emptyMsg?.classList.remove("hidden");
            checkoutBtn?.classList.add("hidden");
            return;
        }

        emptyMsg?.classList.add("hidden");
        checkoutBtn?.classList.remove("hidden");

        let total = 0;

        for (const item of cart) {
            const product = Object.values(window.allProducts || {}).find(p => p.product_id === item.id) || {};
            const name = item.name || product.name || "Unnamed Product";
            const image = item.image || product.image || "/imgs/placeholder.png";
            const price = parseFloat(item.price ?? item.originalPrice ?? 0);
            const originalPrice = parseFloat(item.originalPrice ?? item.price);
            const variant = item.variant || "";
            const qty = parseInt(item.qty) || 1;

            total += price * qty;

            const el = document.createElement("div");
            el.className = "w-full border-b-4 border-gray-300 pb-4 last:border-none group mb-6";

            el.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="flex flex-col justify-between h-full min-w-[6rem] max-w-[6rem] items-center gap-2">
                        <div class="relative w-full aspect-square">
                            <img src="${image}" alt="${name}" class="w-full h-full object-cover rounded" />
                            <button class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center font-bold text-xs text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all" onclick="removeFromCart('${item.id}', '${variant}')">×</button>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="text-xl uppercase font-extrabold leading-tight text-black">${name}</div>
                        <div class="text-sm font-normal text-black">${variant}</div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="flex items-center gap-2 border-4 border-gray-300 rounded-lg">
                                <button class="text-black bg-white font-bold text-xl px-2 rounded-l-lg hover:bg-black hover:text-white" onclick="updateCartQty('${item.id}', -1)">−</button>
                                <span class="text-black font-medium min-w-[24px] text-center">${qty}</span>
                                <button class="text-black bg-white font-bold text-xl px-2 rounded-r-lg hover:bg-black hover:text-white" onclick="updateCartQty('${item.id}', 1)">+</button>
                            </div>
                            <div class="text-right text-lg font-bold ml-3">
                                <span class="text-black">$${price.toFixed(2)}</span>
                                ${originalPrice > price ? `<span class="text-xs text-gray-200 line-through ml-1">$${originalPrice.toFixed(2)}</span>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(el);
        }

        cartTotalEl.textContent = `$${total.toFixed(2)}`;

        // Free shipping logic
        const goal = 25;
        const progress = Math.min((total / goal) * 100, 100);
        if (total >= goal) {
            freeShippingBar.textContent = "🎉 You’ve unlocked FREE shipping!";
            freeShippingProgress.style.width = "100%";
            freeShippingProgress.classList.replace("bg-yellow-400", "bg-green-500");
        } else {
            const diff = (goal - total).toFixed(2);
            freeShippingBar.textContent = `You're $${diff} away from free shipping!`;
            freeShippingProgress.style.width = `${progress}%`;
            freeShippingProgress.classList.replace("bg-green-500", "bg-yellow-400");
        }

        // Re-render recommendations
        if (typeof renderSidebarRecommendation === "function") {
            renderSidebarRecommendation("#sidebarRecommended", window.allProducts, cart);
        }
    });
}






function getAvailableBundlesForItem(item, cart) {
    const bundles = window.bundlesData || [];
    const applicableBundles = [];

    const itemId = item.id?.toLowerCase();
    const itemSub = item.subCategory?.toLowerCase();

    for (const bundle of bundles) {
        if (!bundle.carttxt) continue;

        let matches = false;

        const skus = bundle.specificSkus?.map(s => s.toLowerCase()) || [];
        const bundleSub = bundle.subCategory?.toLowerCase();
        const requiredSubs = bundle.requiredSubCategories?.map(s => s.toLowerCase());

        // 🔍 Match logic
        if (skus.includes(itemId)) matches = true;
        if (bundleSub && bundleSub === itemSub) matches = true;
        if (requiredSubs?.includes(itemSub)) matches = true;

        if (!matches) continue;

        // 🧮 Count how many qualifying items are already in the cart
        let matchCount = 0;
        for (const ci of cart) {
            const ciId = ci.id?.toLowerCase();
            const ciSub = ci.subCategory?.toLowerCase();

            if (skus.includes(ciId)) matchCount += ci.qty;
            else if (bundleSub && ciSub === bundleSub) matchCount += ci.qty;
            else if (requiredSubs?.includes(ciSub)) matchCount += ci.qty;
        }

        const maxAllowed = (bundle.maxUses || 1) * (bundle.minQuantity || 1);

        if (matchCount < maxAllowed) {
            applicableBundles.push(bundle);
        }
    }

    return applicableBundles;
}




window.checkBundleAvailability = async function (bundleId) {
    const [bundleRes, productRes] = await Promise.all([
        fetch("/products/bundles.json"),
        fetch("/products/products.json")
    ]);

    const bundles = await bundleRes.json();
    const products = await productRes.json();
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return false;

    // Helper to check if a product has any in-stock variant
    const hasInStockVariant = product =>
        product && Object.values(product.variantStock || {}).some(qty => qty > 0);

    // 🔁 requiredSubCategories
    if (bundle.requiredSubCategories) {
        return bundle.requiredSubCategories.every(sub =>
            Object.values(products).some(p => p.subCategory === sub && hasInStockVariant(p))
        );
    }

    // 🔁 subCategory
    if (bundle.subCategory) {
        return Object.values(products).some(p =>
            p.subCategory === bundle.subCategory && hasInStockVariant(p)
        );
    }

    // 🔁 specificSkus
    if (bundle.specificSkus) {
        return bundle.specificSkus.some(sku => hasInStockVariant(products[sku]));
    }

    return true; // fallback
};



window.applyBundle = async function (bundleId) {
    console.log("🧪 Bundle button clicked:", bundleId);

    const savedCart = JSON.parse(localStorage.getItem("savedCart")) || [];

    // Fetch bundles + products
    const [bundleRes, productRes] = await Promise.all([
        fetch("/products/bundles.json"),
        fetch("/products/products.json")
    ]);
    const bundles = await bundleRes.json();
    const products = await productRes.json();

    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return alert("Bundle not found");

    // Build maps
    const idToSubCategory = {}, idToProductKey = {}, idToVariantStock = {};
    for (const key in products) {
        const p = products[key];
        idToSubCategory[p.product_id] = p.subCategory || "";
        idToProductKey[p.product_id] = key;
        idToVariantStock[p.product_id] = p.variantStock || {};
    }

    const addToCart = [];

    // Handle requiredSubCategories logic (e.g., beanie + charm)
    if (bundle.requiredSubCategories && Array.isArray(bundle.requiredSubCategories)) {
        for (const sub of bundle.requiredSubCategories) {
            const alreadyInCart = savedCart.some(ci => ci.subCategory === sub);
            if (alreadyInCart) continue;

            const productEntry = Object.entries(products).find(([_, p]) =>
                p.subCategory === sub &&
                Object.values(p.variantStock || {}).some(stock => stock > 0)
            );

            if (productEntry) {
                const [key, product] = productEntry;
                const variant = Object.entries(product.variantStock || {}).find(
                    ([_, stock]) => stock > 0
                )?.[0];

                if (variant) {
                    addToCart.push({
                        id: product.product_id,
                        variant,
                        qty: 1,
                        name: product.name,
                        image: product.image,
                        subCategory: product.subCategory
                    });
                }
            } else {
                console.warn(`❌ No in-stock item found for subcategory "${sub}"`);
            }
        }
    }

    // Handle subCategory + minQuantity logic (e.g., 2 small charms)
    else if (bundle.subCategory && bundle.minQuantity) {
        const inCartQty = savedCart.reduce((sum, item) =>
            idToSubCategory[item.id] === bundle.subCategory ? sum + item.qty : sum, 0
        );

        const needed = bundle.minQuantity - inCartQty;
        if (needed > 0) {
            const candidates = Object.entries(products)
                .filter(([_, p]) => p.subCategory === bundle.subCategory);

            // Sort to prioritize products already in cart
            const cartIds = savedCart.map(i => i.id);
            candidates.sort(([_, a], [__, b]) => {
                const aInCart = cartIds.includes(a.product_id);
                const bInCart = cartIds.includes(b.product_id);
                return (aInCart === bInCart) ? 0 : aInCart ? -1 : 1;
            });

            let remaining = needed;

            for (const [key, product] of candidates) {
                if (remaining <= 0) break;

                const variant = Object.entries(product.variantStock || {}).find(
                    ([_, stock]) => stock > 0
                )?.[0];

                if (variant) {
                    const addQty = Math.min(remaining, product.variantStock[variant]);
                    addToCart.push({
                        id: product.product_id,
                        variant,
                        qty: addQty,
                        name: product.name,
                        image: product.image,
                        subCategory: product.subCategory
                    });
                    remaining -= addQty;
                }
            }
        }
    }

    // Handle specificSkus + minQuantity logic
    else if (bundle.specificSkus && bundle.minQuantity) {
        const inCartQty = savedCart.reduce((sum, item) =>
            bundle.specificSkus.includes(idToProductKey[item.id]) ? sum + item.qty : sum, 0
        );

        const needed = bundle.minQuantity - inCartQty;
        if (needed > 0) {
            const sku = bundle.specificSkus[0];
            const product = products[sku];
            if (product) {
                const variant = Object.entries(product.variantStock || {}).find(
                    ([_, stock]) => stock > 0
                )?.[0];

                if (variant) {
                    addToCart.push({
                        id: product.product_id,
                        variant,
                        qty: needed,
                        name: product.name,
                        image: product.image,
                        subCategory: product.subCategory
                    });
                }
            }
        }
    }

    console.log("🛒 Adding products to cart:", addToCart);

    // Add new items to savedCart
    for (const item of addToCart) {
        const existing = savedCart.find(i => i.id === item.id && i.variant === item.variant);
        if (existing) {
            existing.qty += item.qty;
        } else {
            savedCart.push(item);
        }
    }

    // 🧠 Let bundleDetector reprocess
    const updatedCart = await bundleDetector(savedCart);
    localStorage.setItem("savedCart", JSON.stringify(updatedCart));
    renderCart();
};








// Toggles the side cart drawer open or closed
window.toggleCart = function (show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    if (!cartEl || !overlay) return;

    const isVisible = cartEl.classList.contains("translate-x-0");
    const shouldShow = show !== null ? show : !isVisible;

    if (shouldShow) {
        cartEl.classList.remove("hidden", "translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");

        // Delay hiding until after transition
        setTimeout(() => {
            cartEl.classList.add("hidden");
        }, 300); // Match transition duration
    }

    renderCart?.(); // optional: refresh cart when opening
};



document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    const tryBindCheckout = () => {
        const btn = document.getElementById("checkoutBtn");
        if (btn) {
            btn.addEventListener("click", triggerStripeCheckout);
        } else {
            setTimeout(tryBindCheckout, 100);
        }
    };

    tryBindCheckout();

    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");

    cartEl?.classList.add("translate-x-full", "no-transition");
    overlay?.classList.add("hidden");

    requestAnimationFrame(() => {
        cartEl?.classList.remove("no-transition");
    });

    loadBundlesAndRenderCart();
});
