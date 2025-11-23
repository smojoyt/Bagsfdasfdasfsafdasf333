// js/Home/heroBanner.js
import { typeWriter } from "../Shared/animation.js";
import { getAllProducts, getPromotions } from "./homeData.js";

export async function setupHeroBanner() {
  const defaultBanner = {
    image: "/imgs/Banner/KK_01.jpg",
    headline: "Style That Speaks Louder",
    caption: "Discover beanies, charms, and custom pieces that turn heads.",
  };

  const videoEl = document.getElementById("hero-video");
  const imageEl = document.getElementById("hero-image");
  const headlineEl = document.getElementById("hero-headline");
  const captionEl = document.getElementById("hero-caption");

  try {
    const promotions = await getPromotions();
    const now = new Date();

    const active = promotions.find((promo) => {
      const start = new Date(promo.startDate || "2000-01-01");
      const end = new Date(promo.endDate || "9999-12-31");
      return promo.featured && now >= start && now <= end;
    });

    const media = active?.media || defaultBanner;
    const category = active?.category || null;

    // Background: video > image > default
    if (media.video && media.video.trim() !== "") {
      if (videoEl) {
        const source = videoEl.querySelector("source");
        if (source) source.src = media.video;
        videoEl.classList.remove("hidden", "opacity-0");
        videoEl.load();
      }
      if (imageEl) imageEl.classList.add("hidden");
    } else {
      if (imageEl) {
        imageEl.src = media.image || defaultBanner.image;
        imageEl.classList.remove("hidden");
      }
      if (videoEl) videoEl.classList.add("hidden");
    }

    // Text
    if (headlineEl) {
      typeWriter(headlineEl, media.headline || defaultBanner.headline, 45);
    }
    if (captionEl) {
      captionEl.textContent = media.caption || defaultBanner.caption;
    }

    await populateHeroCardsFromCategory(category);
  } catch (err) {
    console.warn("🔧 Failed to load promotions or apply banner:", err);

    if (imageEl) {
      imageEl.src = defaultBanner.image;
      imageEl.classList.remove("hidden");
    }
    if (videoEl) videoEl.classList.add("hidden");
    if (headlineEl) headlineEl.textContent = defaultBanner.headline;
    if (captionEl) captionEl.textContent = defaultBanner.caption;

    await populateHeroCardsFromCategory(null);
  }
}

async function populateHeroCardsFromCategory(category) {
  try {
    const products = await getAllProducts();

    // products is an object keyed by SKU
    const entries = Object.entries(products || {});
    if (!entries.length) {
      console.warn("Hero banner: no products available");
      return;
    }

    const filtered = entries.filter(([sku, p]) => {
      if (!p) return false;
      if (category) {
        const cat = (p.category || "").toLowerCase();
        if (cat !== category.toLowerCase()) return false;
      }
      const stock = p.variantStock || {};
      return Object.values(stock).some((qty) => qty > 0);
    });

    const pool = (filtered.length ? filtered : entries).slice();

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const [mainSku, main] = pool[0];
    const [card1Sku, card1] = pool[1] || [mainSku, main];
    const [card2Sku, card2] = pool[2] || [card1Sku, card1];

    const getImage = (p) => {
      if (!p) return "/imgs/Banner/KK_01.jpg";
      if (Array.isArray(p.thumbnails) && p.thumbnails.length) {
        return p.thumbnails[0];
      }
      if (p.catalogImage) return p.catalogImage;
      if (p.image) return p.image;
      return "/imgs/Banner/KK_01.jpg";
    };

    const getName = (p) => (p?.name ? p.name : "Featured Product");

    const mainCardEl = document.getElementById("hero-main-card");
    const mainImgEl = document.getElementById("hero-main-image");
    const mainTitleEl = document.getElementById("hero-main-title");

    const card1El = document.getElementById("hero-card-1");
    const card1ImgEl = document.getElementById("hero-card-1-image");
    const card1TitleEl = document.getElementById("hero-card-1-title");

    const card2El = document.getElementById("hero-card-2");
    const card2ImgEl = document.getElementById("hero-card-2-image");
    const card2TitleEl = document.getElementById("hero-card-2-title");

    if (mainImgEl) mainImgEl.src = getImage(main);
    if (mainTitleEl) mainTitleEl.textContent = getName(main);
    attachHeroCardBehavior(mainCardEl, mainSku);

    if (card1ImgEl) card1ImgEl.src = getImage(card1);
    if (card1TitleEl) card1TitleEl.textContent = getName(card1);
    attachHeroCardBehavior(card1El, card1Sku);

    if (card2ImgEl) card2ImgEl.src = getImage(card2);
    if (card2TitleEl) card2TitleEl.textContent = getName(card2);
    attachHeroCardBehavior(card2El, card2Sku);

    console.log("👜 Hero banner products:", {
      category,
      main: getName(main),
      card1: getName(card1),
      card2: getName(card2),
    });
  } catch (err) {
    console.warn("Hero banner: failed to populate hero cards", err);
  }
}

function attachHeroCardBehavior(wrapperEl, sku) {
  if (!wrapperEl || !sku) return;
  const url = `/pages/product.html?sku=${encodeURIComponent(sku)}`;

  // Hover effect (from animations/all.js)
  wrapperEl.classList.add("hero-card-hover");
  wrapperEl.style.cursor = "pointer";

  wrapperEl.onclick = () => {
    window.location.href = url;
  };
}
