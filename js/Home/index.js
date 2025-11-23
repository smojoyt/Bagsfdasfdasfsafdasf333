// js/Home/index.js

import { setupHeroBanner } from "./heroBanner.js";
import { setupFeaturedProducts } from "./featuredSection.js";
import { loadDynamicFeatureSection } from "./featuredHighlight.js";
import { loadBestsellerProducts } from "./bestsellerCarousel.js";
import { getHomeData } from "./homeData.js";
import { initHomeAnimations } from "./animations/all.js";
import {
  showCardGridSkeleton,
  showCarouselSkeleton,
  showSplitFeatureSkeleton,
} from "./animations/skeleton.js";

document.addEventListener("DOMContentLoaded", () => {
  // 🔄 Inject floating + hover animations
  initHomeAnimations();

  // 💀 Skeletons while data loads
  showCardGridSkeleton("featured-products", 4);
  showCarouselSkeleton("bestseller-products", 3);
  showSplitFeatureSkeleton("dynamicFeature");

  // Prime cached data & window.allProducts for global cart logic
  getHomeData()
    .then(({ products }) => {
      window.allProducts = products;
      console.log("✅ window.allProducts loaded from homeData cache");
    })
    .catch((err) => {
      console.warn("⚠️ Failed to preload Home data", err);
    });

  // Normal Home setup
  setupHeroBanner();
  setupFeaturedProducts();
  loadDynamicFeatureSection("headwear"); // or "bags", etc.
  loadBestsellerProducts();
});
