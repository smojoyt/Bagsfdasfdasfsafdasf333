import { getCart, saveCart } from "../Navbar/cart.js";

export function setupAddToCart(product) {
  const addBtn = document.getElementById("add-to-cart-btn");
  const swatchContainer = document.getElementById("variant-swatch-container");

  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const variant = swatchContainer?.dataset.selectedVariant || "Default";

const item = {
  sku: product.product_id || product.sku,
  name: product.name,
  price: product.price,
  image: product.variantImages?.[variant] || product.image || product.catalogImage,
  quantity: 1,
  variant: variant
};

    const cart = getCart();
    const existing = cart.find(i => i.sku === item.sku && i.variant === item.variant);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push(item);
    }

    saveCart(cart);
    console.log("✅ Added to cart:", item);
  });
}
