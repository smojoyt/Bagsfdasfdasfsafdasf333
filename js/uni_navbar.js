async function triggerStripeCheckout() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart })
    });

    const data = await res.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        alert("Checkout failed.");
    }
}

if (typeof updateDiscountTracker !== "function") {
    function updateDiscountTracker(_) { } // no-op placeholder
}

function toggleCart(show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    const isVisible = cartEl.classList.contains("translate-x-0");

    if (show === true || (!isVisible && show === null)) {
        cartEl.classList.remove("translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");
    }

    renderCart();
}

function saveCart(cart) {
    localStorage.setItem("savedCart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
}
async function bundleDetector(cart) {
    try {
        const res = await fetch("/products/bundles.json");
        const bundles = await res.json();

        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            for (let i = 0; i < qty; i++) {
                flatCart.push({ ...item, _used: false });
            }
        }

        const getCategory = (item) => item.category || "";

        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;

            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                if (bundle.category && bundle.minQuantity) {
                    match = flatCart.filter(i => !i._used && getCategory(i) === bundle.category &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))).slice(0, bundle.minQuantity);
                } else if (bundle.requiredCategories) {
                    match = bundle.requiredCategories.map(cat =>
                        flatCart.find(i => !i._used && getCategory(i) === cat &&
                            !(bundle.excludeSkus || []).includes(i.id))
                    );
                    if (match.includes(undefined)) match = [];
                }

                if (match.length > 0 && !match.includes(undefined)) {
                    match.forEach(i => i._used = true);

                    let newPrice = null;
                    if (bundle.bundlePriceTotal) {
                        newPrice = bundle.bundlePriceTotal / match.length;
                    } else if (bundle.discountType === "flat") {
                        const flatAmount = bundle.discountAmount / match.length;
                        match.forEach(i => i.price -= flatAmount);
                    } else if (bundle.discountType === "percent") {
                        match.forEach(i => i.price *= (1 - bundle.discountPercent / 100));
                    } else if (bundle.discountType === "setPriceToZero") {
                        match.forEach(i => {
                            if (getCategory(i) === bundle.applyTo) i.price = 0;
                        });
                    }

                    match.forEach(i => {
                        if (newPrice != null) i.price = newPrice;
                        i.bundleLabel = bundle.name;
                    });
                }
            }
        }

        // Group flat cart back by item
        const grouped = {};
        for (const item of flatCart) {
            const key = `${item.id}_${item.variant || ''}_${item.bundleLabel || ''}`;
            if (!grouped[key]) {
                grouped[key] = { ...item, qty: 1 };
            } else {
                grouped[key].qty += 1;
            }
        }

        return Object.values(grouped);

    } catch (err) {
        console.error("Bundle detection failed:", err);
        return cart;
    }
}


async function renderCart() {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    // 🔍 Check for bundle deals before rendering
    cart = await bundleDetector(cart);
    saveCart(cart); // Update cart in localStorage

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

    // 🛒 Render updated cart with bundles applied
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

    // 🎁 Free shipping bar
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

    // ✅ Bind qty/remove buttons
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
}




/*
// $10 OFF $60 Progress Tracker
const discountGoal = 60;


function updateDiscountTracker(total) {
    const discountBar = document.getElementById("discountBar");
    const discountProgress = document.getElementById("discountProgress");
    const discountBarWrapper = document.getElementById("discountBarWrapper");
    const discountProgressValue = Math.min((total / discountGoal) * 100, 100);

    if (discountBar && discountProgress && discountBarWrapper) {

        if (total <= 0) {
            discountBarWrapper.classList.add("hidden");
            return;
        }

        discountBarWrapper.classList.remove("hidden");
        discountBar.classList.remove("hidden");

        if (total >= discountGoal) {
            discountBar.textContent = "🎉 You’ve unlocked $10 OFF your order!";
            discountProgress.style.width = "100%";
            discountProgress.classList.remove("bg-yellow-400");
            discountProgress.classList.add("bg-purple-600");
        } else {
            const diff = (discountGoal - total).toFixed(2);
            discountBar.textContent = `You're $${diff} away from $10 off!`;
            discountProgress.style.width = `${discountProgressValue}%`;
            discountProgress.classList.remove("bg-purple-600");
            discountProgress.classList.add("bg-yellow-400");
        }
    }
} 
*/





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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}

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
