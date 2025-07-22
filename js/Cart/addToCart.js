import { addToCart } from "./cartLogic.js";
import { updateCartCount } from "../Navbar/cart.js"; // UI-specific, so stays in Navbar

export function initUniversalCartHandler({ root = document, productData = {} }) {
  root.addEventListener("click", (e) => {
    const dot = e.target.closest("button.color-dot");
    const addBtn = e.target.closest(".select-color-text, #add-to-cart-btn");

    if (dot) {
      const { sku, variant, image } = dot.dataset;
      const card = dot.closest(".flex.flex-col");
      const msgEl = card?.querySelector(".select-color-text");

      document.querySelectorAll(`.color-dot[data-sku="${sku}"]`).forEach(btn =>
        btn.classList.remove("ring-2", "ring-black")
      );
      dot.classList.add("ring-2", "ring-black");

      const img = document.querySelector(`a[data-sku="${sku}"] .image-hover-group > img`);
      if (img && image) img.src = image;

      if (msgEl) {
        msgEl.textContent = "Add to Cart";
        msgEl.dataset.variant = variant;
        msgEl.classList.remove("text-gray-500", "cursor-not-allowed");
        msgEl.classList.add("text-black", "cursor-pointer");
      }

      const swatchContainer = document.getElementById("variant-swatch-container");
      if (swatchContainer) swatchContainer.dataset.selectedVariant = variant;

      return;
    }

    if (addBtn) {
      (async () => {
        const isCatalog = addBtn.classList.contains("select-color-text");
        const sku = addBtn.dataset.sku || productData?.sku;
        const variant =
          addBtn.dataset.variant ||
          document.getElementById("variant-swatch-container")?.dataset.selectedVariant ||
          "Default";

        const product = isCatalog ? window.allProducts?.[sku] : productData;
        if (!product || !sku || !variant) return;

        // ✅ Promo logic
        const { getPromotions, matchPromotion, calculateDiscountedPrice } = await import("../Promotions/promotions.js");
        const promotions = await getPromotions();
        const matchedPromo = matchPromotion(product, promotions);
        const discountedPrice = calculateDiscountedPrice(product, matchedPromo);

        addToCart({
          sku,
          variant,
          name: product.name,
          price: discountedPrice,       // ✅ Discounted price stored
          originalPrice: product.price, // ✅ Full price saved for display
          image: product.variantImages?.[variant] || product.image || product.catalogImage,
        });

        updateCartCount(); // update the navbar icon

        // UI feedback
        addBtn.textContent = "Added!";
        addBtn.classList.add("text-green-600");
        addBtn.style.opacity = "0.5";
        addBtn.style.transform = "scale(1.05)";

        setTimeout(() => {
          addBtn.textContent = "Add to Cart";
          addBtn.classList.remove("text-green-600");
          addBtn.style.opacity = "1";
          addBtn.style.transform = "scale(1)";
        }, 1000);
      })(); // 👈 async IIFE runs the promo logic
    }
  });
}
