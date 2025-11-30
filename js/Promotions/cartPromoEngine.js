// js/Promotions/cartPromoEngine.js

let productMapCache = null;
let productLoadPromise = null;

/**
 * Load products.json and build a map keyed by SKU.
 */
async function loadProductMap() {
  if (productMapCache) return productMapCache;

  if (!productLoadPromise) {
    productLoadPromise = (async () => {
      try {
        const res = await fetch("/products/products.json");
        const data = await res.json();
        const map = {};

        if (data && typeof data === "object") {
          if (Array.isArray(data)) {
            for (const p of data) {
              if (p && p.sku) map[p.sku] = p;
            }
          } else {
            for (const [sku, p] of Object.entries(data)) {
              map[sku] = { ...(p || {}), sku };
            }
          }
        }

        productMapCache = map;
      } catch (err) {
        console.error("❌ Failed to load products.json for cart promos:", err);
        productMapCache = {};
      }
      return productMapCache;
    })();
  }

  return productLoadPromise;
}

async function getProductBySku(sku) {
  const map = await loadProductMap();
  return map[sku] || null;
}

async function isMatchForScope(cartItem, scope, fallbackBuyScope = null) {
  if (!scope) return false;

  // Support "same_as_buy" by reusing buy scope
  if (scope.mode === "same_as_buy") {
    const effective = fallbackBuyScope || { mode: "any" };
    return isMatchForScope(cartItem, effective);
  }

  // "any" matches everything
  if (scope.mode === "any") return true;

  // Match specific products (by SKU / productIds)
  if (scope.mode === "product") {
    const ids = Array.isArray(scope.productIds)
      ? scope.productIds
      : scope.productIds
      ? [scope.productIds]
      : [];
    if (!ids.length) return false;

    const pidList = ids.map(String);
    const sku = String(cartItem.sku);
    if (pidList.includes(sku)) return true;

    const product = await getProductBySku(cartItem.sku);
    const pId =
      product?.product_id ||
      product?.productId ||
      product?.id ||
      cartItem.sku;

    return pidList.includes(String(pId));
  }

  // Match category/tag
  if (scope.mode === "category") {
    const product = await getProductBySku(cartItem.sku);
    if (!product) return false;

    const tag = scope.category;
    if (!tag) return false;

    const wanted = String(tag).toLowerCase();
    const tags = Array.isArray(product.tags) ? product.tags : [];
    if (tags.map((t) => t.toLowerCase()).includes(wanted)) return true;

    if (typeof product.category === "string" && product.category.toLowerCase() === wanted) return true;
    if (typeof product.type === "string" && product.type.toLowerCase() === wanted) return true;

    return false;
  }

  return false;
}

// ---------- Public helpers ----------

export function normalizeCart(rawCart) {
  if (!Array.isArray(rawCart)) return [];

  return rawCart.map((item) => {
    const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
    const price =
      typeof item.price === "number" && !Number.isNaN(item.price)
        ? item.price
        : 0;
    const originalPrice =
      typeof item.originalPrice === "number" && !Number.isNaN(item.originalPrice)
        ? item.originalPrice
        : price;

    return {
      ...item,
      quantity: qty,
      price,
      originalPrice,
    };
  });
}

export function computeSubtotal(cart) {
  return cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
}

/**
 * Apply a single cart-level BOGO promo to a normalized cart.
 * Returns:
 *   { cart, subtotal, bogoSuggestion }
 */
export async function applyCartPromotions(normalizedCart, promo) {
  if (!promo || promo.type !== "cart_bogo") {
    return {
      cart: normalizedCart,
      subtotal: computeSubtotal(normalizedCart),
      bogoSuggestion: null,
    };
  }

  const buyScope = promo.buy || {};
  const getScope = promo.get || {};

  const minBuyQty = buyScope.minQty || 1;
  const qtyPerTrigger = getScope.qtyPerTrigger || 1;
  const maxTriggers =
    typeof promo.maxTriggersPerCart === "number" && promo.maxTriggersPerCart > 0
      ? promo.maxTriggersPerCart
      : 1;
  const discountPercent =
    typeof getScope.discountPercent === "number"
      ? getScope.discountPercent
      : 100;

  const buyMatches = [];
  const getMatches = [];

  for (let index = 0; index < normalizedCart.length; index++) {
    const item = normalizedCart[index];

    if (await isMatchForScope(item, buyScope)) {
      buyMatches.push({ index, item });
    }
    // Support "same_as_buy" GET scope
    if (await isMatchForScope(item, getScope, buyScope)) {
      getMatches.push({ index, item });
    }
  }

  const totalBuyQty = buyMatches.reduce(
    (sum, entry) => sum + (entry.item.quantity || 1),
    0
  );

  // Not enough "buy" units yet → suggestion: type="buy"
  if (totalBuyQty < minBuyQty) {
    const missingQty = minBuyQty - totalBuyQty;

    return {
      cart: normalizedCart,
      subtotal: computeSubtotal(normalizedCart),
      bogoSuggestion: {
        type: "buy",
        missingQty,
        buyScope,
        getScope,
        discountPercent,
      },
    };
  }

  // Enough buys: how many triggers allowed? (capped at 1 per cart in your setup)
  const maxPossibleTriggers = Math.floor(totalBuyQty / minBuyQty);
  const triggers = Math.min(maxPossibleTriggers, maxTriggers);

  if (!getScope || qtyPerTrigger <= 0 || discountPercent <= 0) {
    return {
      cart: normalizedCart,
      subtotal: computeSubtotal(normalizedCart),
      bogoSuggestion: null,
    };
  }

  // Build reward units (use originalPrice first)
  const rewardUnits = [];
  for (const { index, item } of getMatches) {
    const qty = item.quantity || 1;
    const unitPrice = (typeof item.originalPrice === "number" ? item.originalPrice : item.price) || 0;
    for (let i = 0; i < qty; i++) {
      rewardUnits.push({ index, unitPrice });
    }
  }

  const totalGetUnitsInCart = rewardUnits.length;
  const maxRewardUnits = triggers * qtyPerTrigger;

  // BUY satisfied but GET missing → suggest GET
  if (totalGetUnitsInCart < qtyPerTrigger) {
    return {
      cart: normalizedCart,
      subtotal: computeSubtotal(normalizedCart),
      bogoSuggestion: {
        type: "get",
        missingQty: qtyPerTrigger - totalGetUnitsInCart,
        buyScope,
        getScope,
        discountPercent,
      },
    };
  }

  // Apply to cheapest reward units first if configured
  const applyToCheapest = !!promo.applyToCheapest;
  if (applyToCheapest) {
    rewardUnits.sort((a, b) => a.unitPrice - b.unitPrice);
  }
  const unitsToDiscount = rewardUnits.slice(0, maxRewardUnits);

  // Count discounted units per cart index
  const discountCountByIndex = new Map();
  for (const unit of unitsToDiscount) {
    const prev = discountCountByIndex.get(unit.index) || 0;
    discountCountByIndex.set(unit.index, prev + 1);
  }

  const resultCart = [];

  normalizedCart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const basePrice =
      (typeof item.originalPrice === "number" ? item.originalPrice : item.price) || 0;
    const discountedUnits = discountCountByIndex.get(index) || 0;
    const paidUnits = Math.max(0, qty - discountedUnits);

    if (paidUnits > 0) {
      resultCart.push({
        ...item,
        quantity: paidUnits,
        price: basePrice,             // paid lines use full unit price
        originalPrice: basePrice,
      });
    }

    if (discountedUnits > 0) {
      if (discountPercent >= 100) {
        resultCart.push({
          ...item,
          quantity: discountedUnits,
          price: 0,
          originalPrice: basePrice,
          isPromoFree: true,
          cartPromoLabels: ["BOGO"],
        });
      } else {
        const discountedPrice = Math.max(
          0,
          Math.round((basePrice * (1 - discountPercent / 100)) * 100) / 100
        );

        resultCart.push({
          ...item,
          quantity: discountedUnits,
          price: discountedPrice,
          originalPrice: basePrice,
          cartPromoLabels: ["BOGO"],
        });
      }
    }

    if (!paidUnits && !discountedUnits) {
      resultCart.push({ ...item });
    }
  });

  return {
    cart: resultCart,
    subtotal: computeSubtotal(resultCart),
    bogoSuggestion: null,
  };
}

export function __resetPromoProductCacheForDev() {
  productMapCache = null;
  productLoadPromise = null;
}
