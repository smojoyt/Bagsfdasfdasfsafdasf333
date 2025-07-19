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

    // Update image/video
    const videoEl = document.getElementById("hero-video");
    const imageEl = document.getElementById("hero-image");

    if (bannerData.video) {
      videoEl.src = bannerData.video;
      videoEl.classList.remove("hidden");
    } else {
      imageEl.src = bannerData.image || defaultBanner.image;
      imageEl.classList.remove("hidden");
      videoEl.classList.add("hidden");
    }

    // Update text
    document.getElementById("hero-headline").textContent = bannerData.headline || defaultBanner.headline;
    document.getElementById("hero-caption").textContent = bannerData.caption || defaultBanner.caption;

    // Update button
    const button = document.getElementById("hero-button");
    button.textContent = bannerData.button?.label || defaultBanner.button.label;
    button.href = bannerData.button?.url || defaultBanner.button.url;

  } catch (err) {
    console.warn("🔧 Failed to load promotions or apply banner:", err);
  }
}
