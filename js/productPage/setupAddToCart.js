import { updateCartCount } from "../Navbar/cart.js";

export function setupAddToCart(product) {
  const addBtn = document.getElementById("add-to-cart-btn");
  const swatchContainer = document.getElementById("variant-swatch-container");

  if (!addBtn || !product?.product_id) {
    console.warn("❌ Missing addBtn or product_id");
    return;
  }

  addBtn.addEventListener("click", () => {
    const sku = product.sku;
    const variant = swatchContainer?.dataset.selectedVariant || "Default";

    console.log("🛒 Adding to cart:", { sku, variant });

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
        image: product.variantImages?.[variant] || product.image || product.catalogImage,
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
  });
}
