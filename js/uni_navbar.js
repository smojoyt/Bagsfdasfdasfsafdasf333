// 🛠️ Fixed and enhanced uni_navbar.js

// create-checkout-session.js — no change needed for splitting bundles

// uni_navbar.js — updated logic for splitting bundles and applying promos properly

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

        const cartItemsContainer = document.getElementById("cartItems");
        const cartTotalEl = document.getElementById("cartTotal");
        const freeShippingBar = document.getElementById("freeShippingBar");
        const freeShippingProgress = document.getElementById("freeShippingProgress");
        const checkoutBtn = document.getElementById("checkoutBtn");
        const emptyMsg = document.getElementById("emptyCartMessage");

        if (!cartItemsContainer || !cartTotalEl) return;

        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            emptyMsg?.classList.remove("hidden");
            cartTotalEl.parentElement?.classList.add("hidden");
            freeShippingBar?.classList.add("hidden");
            freeShippingProgress?.parentElement?.classList.add("hidden");
            checkoutBtn?.classList.add("hidden");
            return;
        }

        emptyMsg?.classList.add("hidden");
        cartTotalEl.parentElement?.classList.remove("hidden");
        freeShippingBar?.classList.remove("hidden");
        freeShippingProgress?.parentElement?.classList.remove("hidden");
        checkoutBtn?.classList.remove("hidden");

        let total = 0;

        cart.forEach(item => {
            if (!item.originalPrice) item.originalPrice = item.price;
            total += item.price * item.qty;

            const itemEl = document.createElement("div");
            itemEl.className = "flex items-start gap-3";

            // Image + Remove
            const leftCol = document.createElement("div");
            leftCol.className = "flex flex-col justify-between h-full min-w-[6rem] max-w-[6rem] items-center gap-2";

            const imageWrapper = document.createElement("div");
            imageWrapper.className = "relative w-full aspect-square";

            const img = document.createElement("img");
            const product = Object.values(window.allProducts || {}).find(p => p.product_id === item.id);

            img.src = product?.image || item.image || "/imgs/placeholder.png";
            img.alt = product?.name || item.name || "Item";
            img.className = "w-full h-full object-cover rounded";

            const removeBtn = document.createElement("button");
            removeBtn.className = "absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center font-bold text-xs text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all";
            removeBtn.textContent = "×";
            removeBtn.onclick = () => removeFromCart(item.id, item.variant);

            imageWrapper.appendChild(img);
            imageWrapper.appendChild(removeBtn);
            leftCol.appendChild(imageWrapper);

            // Right Column
            const rightCol = document.createElement("div");
            rightCol.className = "flex-1";

            const name = document.createElement("div");
            name.className = "text-xl uppercase font-extrabold leading-tight text-black drop-shadow-lg";
            name.textContent = product?.name || item.name || "Unnamed Product";

            let bundleLabel = null;
            if (item.bundleLabel) {
                bundleLabel = document.createElement("div");
                bundleLabel.className = " w-fit bg-white py-1 px-2 uppercase text-xs text-black";
                bundleLabel.innerHTML = `Bundle: <span class="font-bold">${item.bundleLabel}</span>`;
            }

            const variant = document.createElement("div");
            variant.className = "text-sm font-normal text-black";
            variant.textContent = item.variant || "";

            const qtyRow = document.createElement("div");
            qtyRow.className = "flex items-center justify-between mt-2";

            const qtyControl = document.createElement("div");
            qtyControl.className = "flex items-center gap-2 border-4 border-gray-300 rounded-lg ";

            const minusBtn = document.createElement("button");
            minusBtn.className = "text-black bg-white font-bold text-xl px-2 rounded-l-lg hover:bg-black hover:text-white";
            minusBtn.textContent = "−";
            minusBtn.onclick = () => updateCartQty(item.id, -1);

            const qtyText = document.createElement("span");
            qtyText.className = "text-black font-medium min-w-[24px] text-center";
            qtyText.textContent = item.qty;

            const plusBtn = document.createElement("button");
            plusBtn.className = "text-black bg-white font-bold text-xl px-2 rounded-r-lg hover:bg-black hover:text-white";
            plusBtn.textContent = "+";
            plusBtn.onclick = () => updateCartQty(item.id, 1);

            qtyControl.appendChild(minusBtn);
            qtyControl.appendChild(qtyText);
            qtyControl.appendChild(plusBtn);

            const priceEl = document.createElement("div");
            priceEl.className = "text-right text-lg font-bold ml-3";
            priceEl.innerHTML = `
                <span class="text-black">$${item.price.toFixed(2)}</span>
                ${item.originalPrice > item.price ? `<span class="text-xs text-gray-200 line-through ml-1">$${item.originalPrice.toFixed(2)}</span>` : ""}
            `;

            qtyRow.appendChild(qtyControl);
            qtyRow.appendChild(priceEl);

            rightCol.appendChild(name);
            if (bundleLabel) rightCol.appendChild(bundleLabel);
            rightCol.appendChild(variant);
            rightCol.appendChild(qtyRow);

            itemEl.appendChild(leftCol);
            itemEl.appendChild(rightCol);

            const cartItemWrapper = document.createElement("div");
            cartItemWrapper.className = "w-full border-b-4 border-gray-300 pb-4 last:border-none group mb-6";
            cartItemWrapper.appendChild(itemEl);

            // BUNDLE BUTTONS W/ FLICKITY
            const eligibleBundles = getAvailableBundlesForItem(item, cart);
            if (!item.bundleLabel && eligibleBundles.length > 0) {
                const bundleWrapper = document.createElement("div");
                bundleWrapper.className = "w-full mt-2";

                const flickityContainer = document.createElement("div");
                flickityContainer.className = "bundle-carousel"; // flickity targets this
                let dragStartTime = 0;

                flickityContainer.addEventListener("pointerdown", () => {
                    dragStartTime = Date.now();
                });


                for (const b of eligibleBundles) {
                    const cell = document.createElement("div");
                    cell.className = "carousel-cell shrink-0 mr-2";

                    const btn = document.createElement("button");
                    btn.className = "min-w-[100px] px-2 py-1 bg-white text-black border-4 border-gray-300 rounded-lg text-sm uppercase font-bold hover:bg-black hover:text-white hover:border-black transition shadow-sm";
                    btn.textContent = b.carttxt;

                    // Prevent click if dragging
                    btn.addEventListener("click", (e) => {
                        const dragDuration = Date.now() - dragStartTime;
                        if (dragDuration > 150) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                        applyBundle(b.id);
                    });


                    checkBundleAvailability(b.id).then(isAvailable => {
                        if (!isAvailable) {
                            btn.disabled = true;
                            btn.classList.add("opacity-50", "cursor-not-allowed");
                            btn.title = "Bundle unavailable – out of stock";
                        }
                    });

                    cell.appendChild(btn);
                    flickityContainer.appendChild(cell);
                }

                bundleWrapper.appendChild(flickityContainer);
                cartItemWrapper.appendChild(bundleWrapper);

                // Initialize Flickity
                setTimeout(() => {
                    new Flickity(flickityContainer, {
                        cellAlign: "left",
                        contain: true,
                        pageDots: false,
                        prevNextButtons: false,
                        draggable: true,
                        freeScroll: true
                    });
                }, 0);
            }

            cartItemsContainer.appendChild(cartItemWrapper);
        });

        cartTotalEl.textContent = `$${total.toFixed(2)}`;

        const goal = 25;
        const progress = Math.min((total / goal) * 100, 100);
        if (freeShippingBar && freeShippingProgress) {
            if (total >= goal) {
                freeShippingBar.textContent = "🎉 You’ve unlocked FREE shipping!";
                freeShippingProgress.style.width = "100%";
                freeShippingProgress.classList.remove("bg-yellow-400");
                freeShippingProgress.classList.add("bg-green-500");
            } else {
                const diff = (goal - total).toFixed(2);
                freeShippingBar.textContent = `You're $${diff} away from free shipping!`;
                freeShippingProgress.style.width = `${progress}%`;
                freeShippingProgress.classList.remove("bg-green-500");
                freeShippingProgress.classList.add("bg-yellow-400");
            }
        }
        console.log("📦 Calling renderSidebarRecommendation...");
        console.log("➡️ Cart contents:", cart);
        console.log("➡️ All products available:", window.allProducts);

        if (typeof renderSidebarRecommendation === "function") {
            renderSidebarRecommendation("#sidebarRecommended", window.allProducts, cart);
        } else {
            console.warn("⚠️ renderSidebarRecommendation is not defined.");
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
