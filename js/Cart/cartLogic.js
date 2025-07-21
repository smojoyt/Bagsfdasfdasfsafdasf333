const STORAGE_KEY = "savedCart";

export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("⚠️ Failed to parse savedCart:", err);
    return [];
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("❌ Failed to save cart:", err);
  }
}

/**
 * Adds or updates an item in the cart
 * @returns {"added" | "updated" | "invalid"} action status
 */
export function addToCart({ sku, variant, name, price, image, quantity = 1 }) {
  if (!sku || !variant || quantity <= 0) {
    console.warn("❌ Invalid cart item:", { sku, variant, quantity });
    return "invalid";
  }

  const cart = getCart();
  const cleanSku = sku.trim();
  const cleanVariant = variant.trim();

  const found = cart.find(item => item.sku === cleanSku && item.variant === cleanVariant);

  if (found) {
    found.quantity += quantity;
    saveCart(cart);
    return "updated";
  }

  cart.push({
    sku: cleanSku,
    variant: cleanVariant,
    name,
    price,
    image,
    quantity,
  });

  saveCart(cart);
  return "added";
}
