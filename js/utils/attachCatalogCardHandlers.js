import { updateCartCount } from "../Navbar/cart.js";

export function attachCatalogCardHandlers(container) {
  container.addEventListener("click", (e) => {
    const dot = e.target.closest("button.color-dot");
    const addBtn = e.target.closest(".select-color-text");

    // ✅ Swatch clicked
    if (dot) {
      const sku = dot.dataset.sku;
      const variant = dot.dataset.variant;
      const image = dot.dataset.image;

      const card = dot.closest(".flex.flex-col");
      const msgEl = card?.querySelector(".select-color-text");

      document.querySelectorAll(`.color-dot[data-sku="${sku}"]`).forEach(btn => {
        btn.classList.remove("ring-2", "ring-black");
      });
      dot.classList.add("ring-2", "ring-black");

      const img = document.querySelector(`a[data-sku="${sku}"] .image-hover-group > img`);
      if (img && image) img.src = image;

      if (msgEl) {
        msgEl.textContent = "Add to Cart";
        msgEl.dataset.variant = variant;
        msgEl.classList.remove("text-gray-500", "cursor-not-allowed");
        msgEl.classList.add("text-black", "cursor-pointer");
      }

      return;
    }

    // ✅ Add to Cart clicked
    if (addBtn && addBtn.textContent === "Add to Cart") {
      const sku = addBtn.dataset.sku;
      const variant = addBtn.dataset.variant;
      const product = window.allProducts?.[sku];
      if (!sku || !variant || !product) return;

      const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
      const found = cart.find(item => item.sku === sku && item.variant === variant);

      if (found) {
        found.quantity += 1;
      } else {
        cart.push({
          sku,
          variant,
          name: product.name,
          price: product.price,
          image: product.variantImages?.[variant] || product.image,
          quantity: 1,
        });
      }

      localStorage.setItem("savedCart", JSON.stringify(cart));
      updateCartCount();

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
    }
  });
}
