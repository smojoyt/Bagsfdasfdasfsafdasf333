// ✅ navbar.js
import { initNavbar } from "./index.js";
import { updateCartCount, observeCart } from "./cart.js";

// ✅ Expose globally for debugging or external calls
window.initNavbar = initNavbar;
window.updateCartCount = updateCartCount;
window.observeCart = observeCart;

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


document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    if (!res.ok) throw new Error("Failed to fetch navbar");

    navContainer.innerHTML = await res.text();

    // 🛠 Ensures new DOM is fully parsed before attaching listeners
requestAnimationFrame(() => {
  setTimeout(async () => {
    try {
      await waitForEl("#menu-toggle"); // or any reliably late-loading element
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
