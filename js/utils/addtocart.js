import { getCart, saveCart, updateCartCount } from "../Navbar/cart.js";

/**
 * Adds an item to the cart or increments quantity if already exists.
 * @param {Object} item - Item object with fields: sku, name, price, image, quantity, variant
 */
export function addItemToCart(item) {
  if (!item || !item.sku || !item.name) {
    console.warn("❌ Invalid item passed to addItemToCart:", item);
    return;
  }

  const cart = getCart();
  const existing = cart.find(i => i.sku === item.sku && i.variant === item.variant);

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }

  saveCart(cart);
  updateCartCount?.();
}
