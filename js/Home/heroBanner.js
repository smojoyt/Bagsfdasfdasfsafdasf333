import { typeWriter } from "../Shared/animation.js";



export async function setupHeroBanner() {
  const defaultBanner = {
    image: "/imgs/Banner/KK_01.jpg",
    headline: "Style That Speaks Louder",
    caption: "Discover beanies, charms, and custom pieces that turn heads."
  };

  const videoEl = document.getElementById("hero-video");
  const imageEl = document.getElementById("hero-image");
  const headlineEl = document.getElementById("hero-headline");
  const captionEl = document.getElementById("hero-caption");

  try {
    const res = await fetch("/products/promotion.json");
    const { promotions } = await res.json();

    const now = new Date();

    const activeFeatured = promotions.find(promo => {
      const start = new Date(promo.startDate || "2000-01-01");
      const end = new Date(promo.endDate || "9999-12-31");
      return promo.featured && now >= start && now <= end;
    });

    const bannerData = activeFeatured?.media || defaultBanner;

    // 🎥 Update media
    if (bannerData.video && videoEl) {
      videoEl.src = bannerData.video;
      videoEl.classList.remove("hidden");
      if (imageEl) imageEl.classList.add("hidden");
    } else if (imageEl) {
      imageEl.src = bannerData.image || defaultBanner.image;
      imageEl.classList.remove("hidden");
      if (videoEl) videoEl.classList.add("hidden");
    }

    // 🖊️ Update text
    if (headlineEl) {
const headline = bannerData.headline || defaultBanner.headline;
typeWriter(headlineEl, headline, 45); // ✅ cleaner



}

    if (captionEl) captionEl.textContent = bannerData.caption || defaultBanner.caption;

  } catch (err) {
    console.warn("🔧 Failed to load promotions or apply banner:", err);

    // ⛑️ Fallback content
    if (imageEl) {
      imageEl.src = defaultBanner.image;
      imageEl.classList.remove("hidden");
    }
    if (videoEl) videoEl.classList.add("hidden");
    if (headlineEl) headlineEl.textContent = defaultBanner.headline;
    if (captionEl) captionEl.textContent = defaultBanner.caption;
  }
}
