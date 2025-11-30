// js/Navbar/cartState.js

// Store & read cart from localStorage
export function getCart() {
  try {
    const raw = localStorage.getItem("savedCart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("❌ Failed to parse savedCart:", err);
    return [];
  }
}

export function setCart(cart) {
  localStorage.setItem("savedCart", JSON.stringify(cart));
}

// UI helpers
export function animateQuantityChange(el) {
  if (!el) return;
  el.classList.add("scale-110");
  setTimeout(() => el.classList.remove("scale-110"), 200);
}

export function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  el.textContent = total || "0";
}

// High-level save
export function saveCart(cart) {
  setCart(cart);
  updateCartCount();
}

// Keep UI in sync when other tabs / code touch localStorage
export function observeCart(renderFn) {
  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === "savedCart") {
      updateCartCount();
      if (typeof renderFn === "function") {
        renderFn();
      }
    }
  };

  window.addEventListener("storage", (e) => {
    if (e.key === "savedCart") {
      updateCartCount();
      if (typeof renderFn === "function") {
        renderFn();
      }
    }
  });

  // initial sync
  updateCartCount();
}
