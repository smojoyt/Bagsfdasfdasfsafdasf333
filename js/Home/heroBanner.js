// js/Home/heroBanner.js
import { typeWriter } from "../Shared/animation.js";
import { getAllProducts, getPromotions } from "./homeData.js";

// ---------- Defaults ----------
const defaultBanner = {
  image: "/imgs/Banner/KK_01.jpg",
  video: "",
  headline: "Style That Speaks Louder!",
  caption: "Discover beanies, charms, and custom pieces that turn heads.",
};

// ---------- Layout loader (HTML inserts) ----------
async function loadHeroLayout(layoutType) {
  const root = document.getElementById("hero-layout-root");
  if (!root) return;

  let path;
  switch (layoutType) {
    case "bogo":
      path = "/page_inserts/hero/hero-bogo.html";
      break;
    case "percent":
      path = "/page_inserts/hero/hero-percent.html";
      break;
    default:
      path = "/page_inserts/hero/hero-default.html";
      break;
  }

  try {
    const res = await fetch(path);
    const html = await res.text();
    root.innerHTML = html;
  } catch (err) {
    console.error("Hero banner: failed to load layout", layoutType, err);
    root.innerHTML = "";
  }
}

// ---------- Generic helpers ----------
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isWithinDateRange(promo) {
  if (!promo) return false;
  const now = new Date();
  const start = promo.startDate ? new Date(promo.startDate) : new Date("2000-01-01");
  const end = promo.endDate ? new Date(promo.endDate) : new Date("9999-12-31");
  return now >= start && now <= end;
}

function pDate(d) {
  return d ? Date.parse(d) || 0 : 0;
}

// ---------- Promo selection ----------
/**
 * Pick the hero promo from the list of promotions.
 * Priority:
 *  1. active & within date
 *  2. featured flag
 *  3. cart_bogo
 *  4. percent / fixed
 *  5. newest startDate
 */
function pickHeroPromo(promotions) {
  if (!Array.isArray(promotions)) return null;

  const active = promotions.filter((p) => {
    if (p.active === false) return false;
    return isWithinDateRange(p);
  });

  if (!active.length) return null;

  active.sort((a, b) => {
    const rank = (p) => {
      if (p.featured) return 0;
      if (p.type === "cart_bogo") return 1;
      if (p.type === "percent" || p.type === "fixed") return 2;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;

    const sa = pDate(a.startDate);
    const sb = pDate(b.startDate);
    return sb - sa;
  });

  return active[0];
}

// ---------- Promo scope helpers ----------
function normalizeCategory(cat) {
  if (!cat) return null;
  if (Array.isArray(cat)) return cat[0] || null;
  return String(cat);
}

function normalizeTagArray(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => String(t).toLowerCase());
}

function productHasCategoryOrTag(product, categoryName) {
  if (!product || !categoryName) return false;
  const needle = String(categoryName).toLowerCase();

  const cat = normalizeCategory(product.category);
  if (cat && cat.toLowerCase() === needle) return true;

  if (typeof product.type === "string" && product.type.toLowerCase() === needle) {
    return true;
  }

  const tags = normalizeTagArray(product.tags);
  if (tags.includes(needle)) return true;

  return false;
}

function productIdOf(sku, product) {
  return (
    product.product_id ||
    product.productId ||
    product.id ||
    sku
  );
}

/**
 * Extracts the "scope" of a promo so UI code doesn't need to know raw structure.
 *
 * For cart_bogo:
 *  - buyScopeMode: buy.mode
 *  - getScopeMode: get.mode
 *  - primaryCategory: buy.category (if category mode)
 *  - secondaryCategory: get.category (if category mode)
 *  - buyProductIds: buy.productIds (if any)
 *  - getProductIds: get.productIds (if any)
 */
function derivePromoScope(promo) {
  let primaryCategory = null;
  let secondaryCategory = null;
  let buyProductIds = [];
  let getProductIds = [];
  let buyScopeMode = null;
  let getScopeMode = null;

  if (!promo) {
    return {
      primaryCategory,
      secondaryCategory,
      buyProductIds,
      getProductIds,
      buyScopeMode,
      getScopeMode,
    };
  }

  if (promo.type === "cart_bogo") {
    const buy = promo.buy || {};
    const get = promo.get || {};

    buyScopeMode = buy.mode || null;
    getScopeMode = get.mode || null;

    if (buy.mode === "category") {
      primaryCategory = buy.category || null;
    }

    if (get.mode === "category") {
      secondaryCategory = get.category || null;
    }

    if (Array.isArray(buy.productIds)) {
      buyProductIds = buy.productIds.map(String);
    }
    if (Array.isArray(get.productIds)) {
      getProductIds = get.productIds.map(String);
    }
  } else {
    // Simple percent/fixed promos can still have a category for UI text
    primaryCategory = promo.category || null;
  }

  return {
    primaryCategory,
    secondaryCategory,
    buyProductIds,
    getProductIds,
    buyScopeMode,
    getScopeMode,
  };
}

// ---------- Product filters ----------
function isDiscontinued(product) {
  const tags = normalizeTagArray(product.tags);
  return tags.includes("discontinued");
}

function hasStock(product) {
  const vs = product.variantStock;
  if (!vs) return true; // treat as in stock if not defined
  const total = Object.values(vs).reduce((sum, q) => sum + (Number(q) || 0), 0);
  return total > 0;
}

function pickBestImage(p) {
  if (!p) return defaultBanner.image;
  if (Array.isArray(p.thumbnails) && p.thumbnails.length) return p.thumbnails[0];
  if (p.catalogImage) return p.catalogImage;
  if (p.image) return p.image;
  return defaultBanner.image;
}

function getName(p) {
  return p?.name || "Featured Product";
}

// ---------- Hero text + media ----------
function buildHeroText(promo) {
  if (!promo) return { headline: defaultBanner.headline, caption: defaultBanner.caption };

  const media = promo.media || {};
  const { primaryCategory } = derivePromoScope(promo);
  const catLabel = primaryCategory
    ? String(primaryCategory).charAt(0).toUpperCase() + String(primaryCategory).slice(1)
    : "Styles";

  // Prefer explicit media text if present
  if (media.headline || media.caption) {
    return {
      headline: media.headline || defaultBanner.headline,
      caption: media.caption || defaultBanner.caption,
    };
  }

  // cart_bogo headline
  if (promo.type === "cart_bogo") {
    const buy = promo.buy || {};
    const get = promo.get || {};
    const minQty = buy.minQty || 1;
    const pct =
      typeof get.discountPercent === "number" ? get.discountPercent : 100;

    if (pct >= 100) {
      return {
        headline: `Buy ${minQty} Get 1 Free`,
        caption: `Add eligible ${catLabel.toLowerCase()} to your cart and your free item will apply automatically at checkout.`,
      };
    }
    return {
      headline: `Buy ${minQty} Get ${pct}% Off`,
      caption: `Mix and match eligible ${catLabel.toLowerCase()} and your discount appears at checkout.`,
    };
  }

  // Simple percent / fixed promos
  if (promo.type === "percent" && promo.amount) {
    return {
      headline: `${promo.amount}% Off ${catLabel}`,
      caption: "Limited time only. Grab your favorite styles today!",
    };
  }

  if (promo.type === "fixed" && promo.amount) {
    return {
      headline: `$${promo.amount} Off ${catLabel}`,
      caption: "Limited time only. Grab your favorite styles today!",
    };
  }

  return { headline: defaultBanner.headline, caption: defaultBanner.caption };
}

function getBannerMedia(promo) {
  if (!promo || !promo.media) return defaultBanner;
  const media = promo.media;
  return {
    image: media.image || defaultBanner.image,
    video: media.video || "",
    headline: media.headline || defaultBanner.headline,
    caption: media.caption || defaultBanner.caption,
  };
}

// ---------- Standard hero card layout (3 cards) ----------
/**
 * Standard layout: pick up to `max` products.
 * Priority:
 *  1. Products in primaryCategory
 *  2. Products in secondaryCategory
 *  3. Everything else
 *  (each bucket is shuffled so you get variety)
 */
function pickHeroProducts(products, promo, max = 3) {
  const entries = Object.entries(products || {});
  if (!entries.length) return [];

  const { primaryCategory, secondaryCategory } = derivePromoScope(promo);

  const baseList = entries.filter(([_, p]) => !isDiscontinued(p) && hasStock(p));

  const primaryCatMatches = [];
  const secondaryCatMatches = [];
  const others = [];

  for (const [sku, p] of baseList) {
    const inPrimary =
      primaryCategory && productHasCategoryOrTag(p, primaryCategory);

    const inSecondary =
      secondaryCategory && productHasCategoryOrTag(p, secondaryCategory);

    if (inPrimary) {
      primaryCatMatches.push([sku, p]);
    } else if (inSecondary) {
      secondaryCatMatches.push([sku, p]);
    } else {
      others.push([sku, p]);
    }
  }

  const primaryShuffled = shuffleArray(primaryCatMatches);
  const secondaryShuffled = shuffleArray(secondaryCatMatches);
  const othersShuffled = shuffleArray(others);

  const result = [];
  for (const bucket of [primaryShuffled, secondaryShuffled, othersShuffled]) {
    for (const entry of bucket) {
      if (result.length >= max) break;
      result.push(entry);
    }
    if (result.length >= max) break;
  }

  return result;
}

function setupStandardHeroCards(products, promo) {
  const heroProducts = pickHeroProducts(products, promo, 3);
  const [entryMain, entry1, entry2] = heroProducts;
  const [skuMain, pMain] = entryMain || [null, null];
  const [sku1, p1] = entry1 || [null, null];
  const [sku2, p2] = entry2 || [null, null];

  const mainCardEl = document.getElementById("hero-main-card");
  const mainImgEl = document.getElementById("hero-main-image");
  const mainTitleEl = document.getElementById("hero-main-title");

  const card1El = document.getElementById("hero-card-1");
  const card1ImgEl = document.getElementById("hero-card-1-image");
  const card1TitleEl = document.getElementById("hero-card-1-title");

  const card2El = document.getElementById("hero-card-2");
  const card2ImgEl = document.getElementById("hero-card-2-image");
  const card2TitleEl = document.getElementById("hero-card-2-title");

  // Make sure card1 is visible again in standard layout
  if (card1El) card1El.classList.remove("hidden");

  if (pMain && mainImgEl && mainTitleEl && mainCardEl) {
    mainImgEl.src = pickBestImage(pMain);
    mainTitleEl.textContent = getName(pMain);
    attachHeroCardBehavior(mainCardEl, skuMain);
  }

  if (p1 && card1ImgEl && card1TitleEl && card1El) {
    card1ImgEl.src = pickBestImage(p1);
    card1TitleEl.textContent = getName(p1);
    attachHeroCardBehavior(card1El, sku1);
  }

  if (p2 && card2ImgEl && card2TitleEl && card2El) {
    card2ImgEl.src = pickBestImage(p2);
    card2TitleEl.textContent = getName(p2);
    attachHeroCardBehavior(card2El, sku2);
  }
}

// ---------- BOGO hero layout (2 cards) ----------
/**
 * For cart_bogo promos, pick:
 *  - buyProduct: from buy.productIds or buy.category
 *  - getProduct: from get.productIds or get.category
 *
 * Supports:
 *  - buy category -> get category
 *  - buy category -> get product
 *  - buy product -> get product
 *  - buy product -> get category
 */
function pickBogoHeroPair(products, promo) {
  if (!promo || promo.type !== "cart_bogo") return null;

  const entries = Object.entries(products || {});
  if (!entries.length) return null;

  const {
    primaryCategory,
    secondaryCategory,
    buyProductIds,
    getProductIds,
    buyScopeMode,
    getScopeMode,
  } = derivePromoScope(promo);

  const baseList = entries.filter(([_, p]) => !isDiscontinued(p) && hasStock(p));
  if (!baseList.length) return null;

  const buyIdSet = new Set((buyProductIds || []).map(String));
  const getIdSet = new Set((getProductIds || []).map(String));

  let buyCandidates = [];
  let getCandidates = [];

  // --- BUY candidates ---
  for (const [sku, p] of baseList) {
    const pid = String(productIdOf(sku, p));

    const matchesBuyId = buyIdSet.size && buyIdSet.has(pid);
    const matchesBuyCategory =
      primaryCategory && productHasCategoryOrTag(p, primaryCategory);

    if (buyScopeMode === "product" && matchesBuyId) {
      buyCandidates.push([sku, p]);
      continue;
    }

    if (buyScopeMode === "category" && matchesBuyCategory) {
      buyCandidates.push([sku, p]);
      continue;
    }
  }

  // If nothing matched, allow any as a fallback BUY pool
  if (!buyCandidates.length) {
    buyCandidates = [...baseList];
  }

  // --- GET candidates ---
  for (const [sku, p] of baseList) {
    const pid = String(productIdOf(sku, p));

    const matchesGetId = getIdSet.size && getIdSet.has(pid);
    const matchesGetCategory =
      secondaryCategory && productHasCategoryOrTag(p, secondaryCategory);

    if (getScopeMode === "product" && matchesGetId) {
      getCandidates.push([sku, p]);
      continue;
    }

    if (getScopeMode === "category" && matchesGetCategory) {
      getCandidates.push([sku, p]);
      continue;
    }
  }

  // If no explicit GET candidates, fallback to full pool
  if (!getCandidates.length) {
    getCandidates = [...baseList];
  }

  // 🎲 Randomize within candidate pools so hero swaps around
  const buyPool = shuffleArray(buyCandidates);
  const getPool = shuffleArray(getCandidates);

  let buyEntry = buyPool[0] || null;
  let getEntry = null;

  if (buyEntry) {
    const buySku = buyEntry[0];

    // Prefer a GET item that isn't the same SKU as BUY
    getEntry = getPool.find(([sku]) => sku !== buySku) || null;

    // Extreme edge case: only one unique SKU in pool
    if (!getEntry && getPool.length > 1) {
      getEntry = getPool[1];
    }
  }

  if (!buyEntry || !getEntry) return null;

  return {
    buySku: buyEntry[0],
    buyProduct: buyEntry[1],
    getSku: getEntry[0],
    getProduct: getEntry[1],
  };
}

function setupBogoHeroCards(products, promo) {
  const pair = pickBogoHeroPair(products, promo);
  if (!pair) {
    // Fallback if we can't find a good pair
    setupStandardHeroCards(products, promo);
    return;
  }

  const { buySku, buyProduct, getSku, getProduct } = pair;

  const mainCardEl = document.getElementById("hero-main-card");
  const mainImgEl = document.getElementById("hero-main-image");
  const mainTitleEl = document.getElementById("hero-main-title");

  const card2El = document.getElementById("hero-card-2");
  const card2ImgEl = document.getElementById("hero-card-2-image");
  const card2TitleEl = document.getElementById("hero-card-2-title");

  // Buy card (left)
  if (buyProduct && mainImgEl && mainTitleEl && mainCardEl) {
    mainImgEl.src = pickBestImage(buyProduct);
    mainTitleEl.textContent = getName(buyProduct);
    attachHeroCardBehavior(mainCardEl, buySku);

    const badge = mainCardEl.querySelector("span");
    if (badge) {
      badge.textContent = "BUY THIS";
      badge.className =
        "absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full bg-slate-900 text-white text-[0.7rem] font-semibold shadow";
    }
  }

  // Free / discounted card (right)
  if (getProduct && card2ImgEl && card2TitleEl && card2El) {
    card2ImgEl.src = pickBestImage(getProduct);
    card2TitleEl.textContent = getName(getProduct);
    attachHeroCardBehavior(card2El, getSku);

    const badge2 = card2El.querySelector("span");
    const pct =
      typeof promo?.get?.discountPercent === "number"
        ? promo.get.discountPercent
        : 100;

    if (badge2) {
      badge2.textContent = pct >= 100 ? "FREE" : `${pct}% OFF`;
      badge2.className =
        "absolute top-3 left-1/2 -translate-x-1/2 inline-flex px-4 py-1 rounded-full bg-emerald-500 text-[0.65rem] font-semibold text-white shadow";
    }
  }

  // Center label under the big "+" (inside hero-bogo.html)
  const centerLabel = document.getElementById("hero-bogo-label");
  if (centerLabel) {

  }
}

// ---------- Main initializer ----------
export async function setupHeroBanner() {
  const videoEl = document.getElementById("hero-video");
  const imageEl = document.getElementById("hero-image");
  const headlineEl = document.getElementById("hero-headline");
  const captionEl = document.getElementById("hero-caption");

  if (!imageEl || !headlineEl || !captionEl) return;

  // 1) Load data
  let products = {};
  let promotions = [];
  try {
    products = await getAllProducts();
    promotions = await getPromotions();
  } catch (err) {
    console.error("Hero banner: failed to load data", err);
  }

  // 2) Pick promo + text + media
  const heroPromo = pickHeroPromo(promotions);
  const text = buildHeroText(heroPromo);
  const media = getBannerMedia(heroPromo);

  // 3) Background media
  if (videoEl) {
    const sourceEl = videoEl.querySelector("source");
    if (media.video) {
      videoEl.classList.remove("hidden");
      if (sourceEl) {
        sourceEl.src = media.video;
        videoEl.load();
      }
    } else {
      videoEl.classList.add("hidden");
    }
  }

  if (imageEl && media.image) {
    imageEl.src = media.image;
  } else if (imageEl && !imageEl.src) {
    imageEl.src = defaultBanner.image;
  }

  // 4) Headline + caption (with optional typeWriter)
  try {
    if (typeof typeWriter === "function") {
      typeWriter(headlineEl, text.headline);
    } else {
      headlineEl.textContent = text.headline;
    }
  } catch {
    headlineEl.textContent = text.headline;
  }
  captionEl.textContent = text.caption;

  // 5) Decide which layout insert to use
  let layoutType = "default";
  if (heroPromo?.type === "cart_bogo") {
    layoutType = "bogo";
  } else if (heroPromo?.type === "percent" || heroPromo?.type === "fixed") {
    layoutType = "percent";
  }

  // 6) Load HTML insert for that layout
  await loadHeroLayout(layoutType);

  // 7) Wire products into the inserted layout
  if (layoutType === "bogo") {
    setupBogoHeroCards(products, heroPromo);
  } else {
    setupStandardHeroCards(products, heroPromo);
  }
}

// ---------- Card behavior ----------
function attachHeroCardBehavior(wrapperEl, sku) {
  if (!wrapperEl || !sku) return;
  const url = `/pages/product.html?sku=${encodeURIComponent(sku)}`;
  wrapperEl.style.cursor = "pointer";
  wrapperEl.onclick = () => {
    window.location.href = url;
  };
}
