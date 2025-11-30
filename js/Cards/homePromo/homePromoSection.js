// js/Cards/homePromo/homePromoSection.js

import { createHomePromoCard } from "./homePromoCard.js";
import { getPromotions } from "../../Promotions/index.js";


// ---------- tiny helpers ----------
function normalizeTagArray(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => String(t).toLowerCase());
}

function productMatchesCategoryOrTag(product, categoryName) {
  if (!product || !categoryName) return false;
  const needle = String(categoryName).toLowerCase();

  const cat = normalizeCategory(product.category);
  if (cat && cat.toLowerCase() === needle) return true;

  const tags = normalizeTagArray(product.tags);
  if (tags.includes(needle)) return true;

  return false;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeCategory(cat) {
  if (!cat) return null;
  if (Array.isArray(cat)) return cat[0] || null;
  return String(cat);
}

function hasStock(product) {
  // Uses variantStock; treat missing as "in stock"
  if (!product.variantStock) return true;
  const total = Object.values(product.variantStock).reduce(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );
  return total > 0;
}

function isDiscontinued(product) {
  const tags = (product.tags || []).map((t) => String(t).toLowerCase());
  return tags.includes("discontinued");
}

function isWithinDateRange(promo) {
  const now = new Date();
  const start = promo.startDate ? new Date(promo.startDate) : new Date("2000-01-01");
  const end = promo.endDate ? new Date(promo.endDate) : new Date("9999-12-31");
  return now >= start && now <= end;
}

// ---------- promo → section title ----------

function pickActivePromo(promotions) {
  const active = (promotions || []).filter((p) => {
    if (p.active === false) return false;
    if (!isWithinDateRange(p)) return false;
    return true;
  });

  if (!active.length) return null;

  // Prefer cart_bogo first, then percent/fixed, then the rest
  active.sort((a, b) => {
    const rank = (p) =>
      p.type === "cart_bogo"
        ? 0
        : p.type === "percent" || p.type === "fixed"
        ? 1
        : 2;
    return rank(a) - rank(b);
  });

  return active[0];
}

function buildSectionTitle(promo) {
  if (!promo) return "FEATURED PICKS";

  // If merchant provided a custom title, use it
  if (promo.sectionTitle) return promo.sectionTitle;

  // ----- Handle BOGO promos -----
  if (promo.type === "cart_bogo") {
    const buy = promo.buy || {};
    const get = promo.get || {};

    const minQty = buy.minQty || 1;
    const pct =
      typeof get.discountPercent === "number"
        ? get.discountPercent
        : 100;

    // Normalize category names
    const buyCat = buy.category
      ? String(buy.category).replace(/s$/i, "")
      : null;

    const getCat = get.category
      ? String(get.category).replace(/s$/i, "")
      : null;

    // If categories are missing, fallback safely
    const buyLabel = buyCat
      ? buyCat.charAt(0).toUpperCase() + buyCat.slice(1)
      : "Item";

    const getLabel = getCat
      ? getCat.charAt(0).toUpperCase() + getCat.slice(1)
      : "Item";

    // FREE
    if (pct >= 100) {
      if (buyLabel === getLabel) {
        // Example: Buy 2 Beanies, Get 1 Free
        return `BUY ${minQty} ${buyLabel.toUpperCase()}${minQty > 1 ? "S" : ""}, GET 1 FREE`;
      } else {
        // Example: Buy a Bag, Get a Charm Free
        return `BUY ${minQty} ${buyLabel.toUpperCase()}${minQty > 1 ? "S" : ""}, GET A ${getLabel.toUpperCase()} FREE`;
      }
    }

    // DISCOUNT (like Buy 1 Hat, Get 80% Off a Charm)
    const percentLabel = `${pct}% OFF`;

    if (buyLabel === getLabel) {
      return `BUY ${minQty} ${buyLabel.toUpperCase()}${minQty > 1 ? "S" : ""}, GET ${percentLabel}`;
    } else {
      return `BUY ${minQty} ${buyLabel.toUpperCase()}${minQty > 1 ? "S" : ""}, GET ${percentLabel} A ${getLabel.toUpperCase()}`;
    }
  }

  // ----- Handle Percent Promo -----
  if (promo.type === "percent" && promo.amount) {
    const cat = promo.category
      ? String(promo.category).toUpperCase()
      : "";
    return `${promo.amount}% OFF ${cat}`;
  }

  // ----- Handle Fixed Discount -----
  if (promo.type === "fixed" && promo.amount) {
    const cat = promo.category
      ? String(promo.category).toUpperCase()
      : "";
    return `$${promo.amount} OFF ${cat}`;
  }

  return "FEATURED PICKS";
}


function updateSectionTitle(sectionPromo) {
  const titleEl = document.getElementById("featured-title");
  if (!titleEl) return;
  titleEl.textContent = buildSectionTitle(sectionPromo);
}

// ---------- main render ----------

export async function renderHomePromoSection(container, maxToShow = 6) {
  if (!container) return;

  // 1) Load products
  let products = {};
  try {
    const res = await fetch("/products/products.json");
    products = await res.json();
  } catch (err) {
    console.error("❌ Failed to load products.json for home promo:", err);
    return;
  }

  // 2) Load promos & pick the one to feature
  const promos = await getPromotions();
  const sectionPromo = pickActivePromo(promos);

  updateSectionTitle(sectionPromo);

  // 3) Decide what category to show in the row
  // 3) Decide what category to show in the row
let categoryToShow = null;

if (sectionPromo) {
  if (sectionPromo.type === "cart_bogo") {
    // Prefer BUY category; fall back to GET category
    const buyCat = sectionPromo.buy?.category;
    const getCat = sectionPromo.get?.category;
    categoryToShow = buyCat || getCat || null;
  } else {
    // For non-cart_bogo promos, use top-level category if present
    categoryToShow = sectionPromo.category || null;
  }
}


  if (!categoryToShow) {
    // Fallback ordered list
    const fallback = ["Headwear", "Hats", "Charms", "Bags"];
    const allProducts = Object.values(products);

    for (const cat of fallback) {
      const hasAny = allProducts.some((p) => {
        const pc = normalizeCategory(p.category);
        return (
          pc &&
          pc.toLowerCase() === cat.toLowerCase() &&
          !isDiscontinued(p) &&
          hasStock(p)
        );
      });
      if (hasAny) {
        categoryToShow = cat;
        break;
      }
    }
  }

  // 4) Filter products
  const entries = Object.entries(products);

const filtered = shuffleArray(
  entries.filter(([_, product]) => {
    if (isDiscontinued(product)) return false;
    if (!hasStock(product)) return false;

    if (!categoryToShow) return true;

    return productMatchesCategoryOrTag(product, categoryToShow);
  })
).slice(0, maxToShow);



  if (!filtered.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-600 py-4">No featured products available right now. Please check back soon!</p>';
    return;
  }

  // 5) Render cards
  container.innerHTML = "";

  for (const [sku, product] of filtered) {
    const card = await createHomePromoCard(sku, product);
    container.appendChild(card);
  }
}

// Auto-run on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("homePromoSection");
  if (!container) return;
  renderHomePromoSection(container, 5);
});
