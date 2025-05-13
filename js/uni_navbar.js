async function triggerStripeCheckout() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }) // ✅ Correct key
    });

    const data = await res.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        alert("Checkout failed.");
    }
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

function renderCart() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const cartItemsEl = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    let total = 0;

    cartItemsEl.innerHTML = "";

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        cartItemsEl.innerHTML += `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-sm text-gray-500">${item.variant || ""}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="decrease" data-index="${index}">−</button>
                        <span class="text-sm">${item.qty}</span>
                        <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="increase" data-index="${index}">+</button>
                        <button class="text-red-500 text-xs hover:underline ml-4 remove-btn" data-index="${index}">Remove</button>
                    </div>
                </div>
                <div class="text-right font-medium">
                    $${(item.price * item.qty).toFixed(2)}
                </div>
            </div>
        `;
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;

    // Attach quantity buttons
    document.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.getAttribute("data-index"));
            const action = e.target.getAttribute("data-action");
            adjustQuantity(index, action);
        });
    });

    // Attach remove buttons
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.getAttribute("data-index"));
            removeFromCart(index);
        });
    });
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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    // Wait for checkoutBtn if injected later
    const tryBindCheckout = () => {
        const btn = document.getElementById("checkoutBtn");
        if (btn) {
            btn.addEventListener("click", triggerStripeCheckout);
        } else {
            setTimeout(tryBindCheckout, 100);
        }
    };

    tryBindCheckout();
});
