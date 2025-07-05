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

        const idToCategory = {};
        const idToPrice = {};
        const idToKey = {}; // product_id → product key

        for (const key in products) {
            const prod = products[key];
            if (prod.product_id && prod.category) {
                idToCategory[prod.product_id] = prod.category;
                idToPrice[prod.product_id] = prod.price;
                idToKey[prod.product_id] = key;
            }
        }

        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            const category = idToCategory[item.id] || "";
            const productKey = idToKey[item.id] || "";
            const basePrice = idToPrice[item.id];
            for (let i = 0; i < qty; i++) {
                flatCart.push({
                    ...item,
                    qty: 1,
                    _used: false,
                    category,
                    productKey,
                    price: basePrice
                });
            }
        }

        // --- APPLY BUNDLES ---
        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;

            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                if (bundle.category && bundle.minQuantity) {
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
                } else if (bundle.requiredCategories) {
                    match = bundle.requiredCategories.map(cat =>
                        flatCart.find(i =>
                            !i._used &&
                            i.category === cat &&
                            !(bundle.excludeSkus || []).includes(i.id)
                        )
                    );
                    if (match.includes(undefined)) match = [];
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

        // --- APPLY PROMOTIONS (not used in bundles) ---
        for (const promo of promotions) {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

            if (isActive && promo.type === "percent") {
                flatCart.forEach(i => {
                    if (
                        !i._used &&
                        i.category === promo.category &&
                        (!promo.condition?.minPrice || i.price >= promo.condition.minPrice)
                    ) {
                        const discount = i.price * (promo.amount / 100);
                        i.price = parseFloat((i.price - discount).toFixed(2));
                        i.promoLabel = promo.name;
                    }
                });
            }
        }

        // --- GROUP BY FINAL PRICE + LABELS ---
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
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    cart.splice(index, 1);
    saveCart(cart);
}

function renderCart() {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    bundleDetector(cart).then(updatedCart => {
        cart = updatedCart;
        localStorage.setItem("savedCart", JSON.stringify(cart));
        updateCartCount();

        const cartItemsEl = document.getElementById("cartItems");
        const cartTotalEl = document.getElementById("cartTotal");
        const freeShippingBar = document.getElementById("freeShippingBar");
        const freeShippingProgress = document.getElementById("freeShippingProgress");
        const checkoutBtn = document.getElementById("checkoutBtn");
        const emptyMsg = document.getElementById("emptyCartMessage");

        if (!cartItemsEl || !cartTotalEl) return;

        cartItemsEl.innerHTML = "";

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

        cart.forEach((item, index) => {
            total += item.price * item.qty;
            cartItemsEl.innerHTML += `
            <div class="flex gap-4 items-start justify-between">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded border" />
                <div class="flex-1">
                    <p class="font-semibold text-sm">${item.name}</p>
                    ${item.bundleLabel ? `<p class="text-xs text-purple-600 font-semibold mt-1">📦 Bundle: ${item.bundleLabel}</p>` : ""}
                    <p class="text-xs text-gray-500">${item.variant || ""}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="decrease" data-index="${index}">−</button>
                        <span class="text-sm">${item.qty}</span>
                        <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="increase" data-index="${index}">+</button>
                        <button class="text-red-500 text-xs hover:underline ml-4 remove-btn" data-index="${index}">Remove</button>
                    </div>
                </div>
                <div class="text-right font-medium text-sm whitespace-nowrap">
                    $${(item.price * item.qty).toFixed(2)}
                </div>
            </div>
        `;
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

        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const action = btn.dataset.action;
                const index = parseInt(btn.dataset.index);
                adjustQuantity(index, action);
            });
        });

        document.querySelectorAll(".remove-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const index = parseInt(btn.dataset.index);
                removeFromCart(index);
            });
        });
    });
}

// Toggles the side cart drawer open or closed
window.toggleCart = function (show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    if (!cartEl || !overlay) return;

    const isVisible = cartEl.classList.contains("translate-x-0");

    if (show === true || (show === null && !isVisible)) {
        cartEl.classList.remove("translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");
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

    renderCart();
});
