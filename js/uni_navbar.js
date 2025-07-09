// 🌐 Load allProducts once globally and render cart
(async function initializeNavbarProductData() {
    try {
        if (window.allProducts) {
            logCart("✅ window.allProducts already loaded.");
            return;
        }

        const res = await fetch('/products/products.json');
        if (!res.ok) throw new Error(`Failed to fetch products.json — ${res.status}`);

        const data = await res.json();
        if (!data || typeof data !== "object") throw new Error("Invalid product data format");

        window.allProducts = data;
        logCart(`🌍 window.allProducts loaded (${Object.keys(data).length} products)`);

        if (typeof renderCart === "function") {
            renderCart(); // ✅ Now safe to render
        } else {
            warnCart("⚠️ renderCart is not defined yet.");
        }
    } catch (err) {
        errorCart("❌ Failed to load allProducts in uni_navbar.js:", err);
    }
})();


function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
        const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);

        const badge = document.getElementById("cart-count");
        if (badge) {
            badge.textContent = totalQty;
            logCart(`🛒 Cart count updated: ${totalQty} item(s)`);
        } else {
            warnCart("⚠️ Cart badge element not found (id: 'cart-count')");
        }
    } catch (err) {
        errorCart("❌ Failed to update cart count:", err);
    }
}



window.toggleCart = function (show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");

    if (!cartEl || !overlay) {
        warnCart("⚠️ Cart or overlay element missing");
        return;
    }

    const isVisible = cartEl.classList.contains("translate-x-0");
    const shouldShow = show !== null ? show : !isVisible;

    if (shouldShow) {
        logCart("🛍️ Opening cart drawer");
        cartEl.classList.remove("hidden", "translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        logCart("🧹 Closing cart drawer");
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");

        setTimeout(() => {
            cartEl.classList.add("hidden");
        }, 300); // ⏱️ Match transition duration
    }

    if (typeof renderCart === "function") {
        renderCart();
        logCart("🔄 Cart re-rendered after toggle");
    }
};




document.addEventListener("DOMContentLoaded", () => {
    logCart("📦 DOM fully loaded, initializing cart UI...");

    updateCartCount();

    // 🔁 Retry binding until checkout button exists
    const tryBindCheckout = () => {
        const btn = document.getElementById("checkoutBtn");
        if (btn) {
            btn.addEventListener("click", triggerStripeCheckout);
            logCart("✅ Bound triggerStripeCheckout to checkoutBtn");
        } else {
            setTimeout(tryBindCheckout, 100);
            logCart("⏳ Waiting for checkoutBtn to appear...");
        }
    };
    tryBindCheckout();

    // 🛑 Prevent drawer flicker on load
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");

    if (cartEl) {
        cartEl.classList.add("translate-x-full", "no-transition");
        requestAnimationFrame(() => {
            cartEl.classList.remove("no-transition");
            logCart("🧼 Cart drawer hidden and transitions re-enabled");
        });
    }

    if (overlay) {
        overlay.classList.add("hidden");
    }

    // 🛒 Initial cart render
    loadBundlesAndRenderCart();
});

