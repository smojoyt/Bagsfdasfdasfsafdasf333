// js/Promotions/cartPromotions.js

import {
  getCartLevelPromotions,
  getActiveCartPromo,
  buildCartPromoSummary,
} from "./cartPromoConfig.js";
import {
  normalizeCart,
  computeSubtotal,
  applyCartPromotions,
} from "./cartPromoEngine.js";
import { getPromotions } from "./promotions.js";

/**
 * Main entry point used by the cart drawer & checkout.
 */
export async function getCartWithPromos(rawCart) {
  const normalized = normalizeCart(rawCart || []);
  const activePromo = await getActiveCartPromo();

  if (!activePromo) {
    return {
      cart: normalized,
      subtotal: computeSubtotal(normalized),
      activeCartPromo: null,
      bogoSuggestion: null,
    };
  }

  const { cart, subtotal, bogoSuggestion } = await applyCartPromotions(
    normalized,
    activePromo
  );

  return {
    cart,
    subtotal,
    activeCartPromo: activePromo,
    bogoSuggestion,
  };
}

/**
 * Used by hero banner + "Featured Picks" row.
 */
export async function getActiveCartPromoSummary() {
  const promo = await getActiveCartPromo();
  if (!promo) return null;
  return buildCartPromoSummary(promo);
}

/**
 * All promos (item-level + cart-level) from promotion.json
 */
export async function getAllPromotions() {
  return getPromotions();
}

/**
 * Only cart-level BOGO promos.
 */
export async function getCartPromotions() {
  return getCartLevelPromotions();
}
