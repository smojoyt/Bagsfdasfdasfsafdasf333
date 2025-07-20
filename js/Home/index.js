// Load all products globally for Add to Cart to work
if (!window.allProducts) {
  fetch("/products/products.json")
    .then(res => res.json())
    .then(data => {
      window.allProducts = data;
      console.log("✅ window.allProducts loaded");
    });
}

import { setupHeroBanner } from "./heroBanner.js";
import { setupFeaturedProducts } from './setupFeaturedProducts.js';
import { loadDynamicFeatureSection } from "./featuredHighlight.js";
import { loadBestsellerProducts } from "./bestsellerCarousel.js";

document.addEventListener("DOMContentLoaded", () => {
  setupHeroBanner();
  setupFeaturedProducts();
  loadDynamicFeatureSection("headwear"); // or "bagaccessory", etc.
    loadBestsellerProducts();
});
