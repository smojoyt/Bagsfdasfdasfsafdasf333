// ✅ navbar.js
import { initNavbar } from "./index.js";
import { updateCartCount, observeCart } from "./cart.js";

// ✅ Immediately make buttons interactive before DOM loads (fallback)
const navEl = document.getElementById("main-nav");
const menuBtn = document.getElementById("menu-toggle");
const cartBtn = document.getElementById("cart-toggle");

navEl?.classList.remove("pointer-events-none");
menuBtn?.removeAttribute("disabled");
cartBtn?.removeAttribute("disabled");

// ✅ Expose for console testing
window.initNavbar = initNavbar;
window.updateCartCount = updateCartCount;
window.observeCart = observeCart;

// ✅ Utility to wait for a selector
function waitForEl(selector, maxRetries = 10, interval = 50) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      } else if (retries++ >= maxRetries) {
        clearInterval(timer);
        reject(`❌ Element ${selector} not found after ${maxRetries} retries`);
      }
    }, interval);
  });
}

// ✅ Load and inject navbar
document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    if (!res.ok) throw new Error("Failed to fetch navbar");

    navContainer.innerHTML = await res.text();

    // ✅ Now wait for the dynamic content to render
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          await waitForEl("#menu-toggle");
          // 🔧 After navbar is loaded and parsed
          document.getElementById("main-nav")?.classList.remove("pointer-events-none");
          document.getElementById("menu-toggle")?.removeAttribute("disabled");
          document.getElementById("cart-toggle")?.removeAttribute("disabled");

          initNavbar();
          updateCartCount();
          observeCart();
        } catch (err) {
          console.warn(err);
        }
      }, 0);
    });
  } catch (err) {
    navContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 text-center">Navbar failed to load.</div>`;
    console.error("❌ Navbar load failed:", err);
  }
});
