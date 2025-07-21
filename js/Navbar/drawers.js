import { renderCartItems } from "./cart.js";

let lastScrollY = 0;
let lastOpened = null;

export function initDrawers() {
  console.log("🚪 initDrawers() called");

  const overlay = document.getElementById("drawer-overlay");
  const menuDrawer = document.getElementById("menu-drawer");
  const cartDrawer = document.getElementById("cart-drawer");
  const openMenuBtn = document.getElementById("menu-toggle");
  const openCartBtn = document.getElementById("cart-toggle");
  const closeBtns = document.querySelectorAll(".drawer-close");

  const openDrawer = (type) => {
    lastOpened = type;
    const isMenu = type === "menu";

    // Reset transforms (hide both)
    menuDrawer.classList.add("-translate-x-full");
    cartDrawer.classList.add("translate-x-full");

    // Lock scroll
    lastScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lastScrollY}px`;
    document.body.style.width = "100%";

    // Show overlay
    overlay.classList.remove("opacity-0", "pointer-events-none");

    // Animate in
    requestAnimationFrame(() => {
      if (isMenu) {
        menuDrawer.classList.remove("-translate-x-full");
      } else {
        cartDrawer.classList.remove("translate-x-full");
        renderCartItems();
      }
    });
  };

  const closeAll = () => {
    // Slide both drawers out
    menuDrawer.classList.add("-translate-x-full");
    cartDrawer.classList.add("translate-x-full");

    // Hide overlay
    overlay.classList.add("opacity-0", "pointer-events-none");

    // Restore scroll
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, lastScrollY);
  };

  // Attach click handlers
  openMenuBtn?.addEventListener("click", () => openDrawer("menu"));
  openCartBtn?.addEventListener("click", () => openDrawer("cart"));
  overlay?.addEventListener("click", closeAll);
  closeBtns.forEach((btn) => btn.addEventListener("click", closeAll));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  // Touch swipe to close
  [menuDrawer, cartDrawer].forEach((drawer) => {
    let startX = 0;
    drawer.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    drawer.addEventListener("touchend", (e) => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 100) closeAll();
    });
  });
}
