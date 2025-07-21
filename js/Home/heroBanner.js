export async function setupHeroBanner() {
  const defaultBanner = {
    image: "/imgs/Banner/KK_01.jpg",
    headline: "Style That Speaks Louder",
    caption: "Discover beanies, charms, and custom pieces that turn heads.",
    button: {
      label: "Shop Now",
      url: "/pages/catalog.html"
    }
  };

  const videoEl = document.getElementById("hero-video");
  const imageEl = document.getElementById("hero-image");
  const headlineEl = document.getElementById("hero-headline");
  const captionEl = document.getElementById("hero-caption");
  const button = document.getElementById("hero-button");

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

    // Update media
    if (bannerData.video && videoEl) {
      videoEl.src = bannerData.video;
      videoEl.classList.remove("hidden");
      if (imageEl) imageEl.classList.add("hidden");
    } else if (imageEl) {
      imageEl.src = bannerData.image || defaultBanner.image;
      imageEl.classList.remove("hidden");
      if (videoEl) videoEl.classList.add("hidden");
    }

    // Update text and button
    if (headlineEl) headlineEl.textContent = bannerData.headline || defaultBanner.headline;
    if (captionEl) captionEl.textContent = bannerData.caption || defaultBanner.caption;
    if (button) {
      button.textContent = bannerData.button?.label || defaultBanner.button.label;
      button.href = bannerData.button?.url || defaultBanner.button.url;
    }

  } catch (err) {
    console.warn("🔧 Failed to load promotions or apply banner:", err);

    // Fallback in case JSON fails or fetch is blocked
    if (imageEl) {
      imageEl.src = defaultBanner.image;
      imageEl.classList.remove("hidden");
    }
    if (videoEl) videoEl.classList.add("hidden");
    if (headlineEl) headlineEl.textContent = defaultBanner.headline;
    if (captionEl) captionEl.textContent = defaultBanner.caption;
    if (button) {
      button.textContent = defaultBanner.button.label;
      button.href = defaultBanner.button.url;
    }
  }
}
