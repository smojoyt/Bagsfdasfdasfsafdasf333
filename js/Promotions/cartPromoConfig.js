// js/Promotions/cartPromoConfig.js

import { getPromotions } from "./promotions.js";

/**
 * Only cart-level promotions (BOGO style).
 */
export async function getCartLevelPromotions() {
  const promos = await getPromotions();
  return promos.filter(
    (p) =>
      p &&
      p.type === "cart_bogo" &&
      (p.active === undefined || p.active === true)
  );
}

/**
 * Get the single cart-level promo we want to apply / highlight.
 * If multiple are active, prefer one marked `featured`.
 */
export async function getActiveCartPromo() {
  const cartPromos = await getCartLevelPromotions();
  if (!cartPromos.length) return null;

  const featured = cartPromos.find((p) => p.featured);
  return featured || cartPromos[0];
}

/**
 * Build a small summary object for hero banner / featured row titles.
 */
export function buildCartPromoSummary(promo) {
  if (!promo) return null;

  const buyScope = promo.buy || {};
  const getScope = promo.get || {};

  const minQty = buyScope.minQty || 1;
  const qtyPerTrigger = getScope.qtyPerTrigger || 1;

  const discountPercent =
    typeof getScope.discountPercent === "number"
      ? getScope.discountPercent
      : 100;

  const buyLabel =
    buyScope.mode === "category"
      ? buyScope.category || "items"
      : buyScope.mode === "product"
      ? buyScope.label || "selected items"
      : "items";

  const getLabel =
    getScope.mode === "category"
      ? getScope.category || "items"
      : getScope.mode === "product"
      ? getScope.label || "selected items"
      : "items";

  let title = promo.name || "Special Offer";
  let subtitle = promo.subtitle || "";
  let shortLabel = promo.shortLabel || "";

  if (!subtitle) {
    if (discountPercent >= 100) {
      subtitle = `Buy ${minQty} ${buyLabel} & get ${qtyPerTrigger} ${getLabel.toLowerCase()} free.`;
      if (!shortLabel) shortLabel = `Free ${getLabel}`;
    } else {
      subtitle = `Buy ${minQty} ${buyLabel} & get ${qtyPerTrigger} ${getLabel.toLowerCase()} ${discountPercent}% off.`;
      if (!shortLabel) shortLabel = `${discountPercent}% off ${getLabel}`;
    }
  }

  return {
    title,
    subtitle,
    shortLabel,
    discountPercent,
    buyLabel,
    getLabel,
    buyScope,
    getScope,
  };
}
