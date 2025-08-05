// js/Shared/itemLikes.js

const LIKED_SESSION_KEY = "likedProducts";
export const likeCache = {}; // Export likeCache so it can be accessed in other files
const COOLDOWN_MS = 5000;

export async function loadLikeData(jsonUrl) {
  try {
    const res = await fetch(jsonUrl);
    const data = await res.json();

    // If products is an array of key/value pairs
    if (Array.isArray(data?.record?.products)) {
      data.record.products.forEach(entry => {
        const key = entry.key;
        const likes = entry.value?.likes ?? 0;
        likeCache[key] = likes;
      });
    }

    updateAllLikeDisplays();
  } catch (err) {
    console.error("Error loading likes:", err);
  }
}

// Function to update the display of likes on the page
function updateAllLikeDisplays() {
  document.querySelectorAll(".like-wrapper").forEach(wrapper => {
    const sku = wrapper.dataset.sku;
    const product = window.allProducts?.[sku];
    const product_id = product?.product_id;

    const countSpan = wrapper.querySelector(".like-count");

    if (product_id && likeCache[product_id] !== undefined) {
      countSpan.textContent = likeCache[product_id];
    } else {
      countSpan.textContent = 0;
    }
  });
}

// Function to initialize the like button listeners
export function initLikeListeners(webhookUrl) {
  const likeCooldowns = JSON.parse(localStorage.getItem(LIKED_SESSION_KEY)) || {};

  document.querySelectorAll(".like-wrapper").forEach(wrapper => {
    const btn = wrapper.querySelector(".like-btn");
    const count = wrapper.querySelector(".like-count");
    const sku = wrapper.dataset.sku;

    // Block click-through from like-wrapper area (heart + number)
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    // Handle the heart button specifically
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const now = Date.now();
      const lastLiked = likeCooldowns[sku] || 0;

      if (now - lastLiked < COOLDOWN_MS) {
        console.log(`⏳ Cooldown: Wait before liking ${sku} again.`);
        return;
      }

      likeCooldowns[sku] = now;
      localStorage.setItem(LIKED_SESSION_KEY, JSON.stringify(likeCooldowns));

      // Lookup product_id from window.allProducts
      const productData = window.allProducts?.[sku];
      const product_id = productData?.product_id;

      if (!product_id) {
        console.warn(`⚠️ Could not find product_id for ${sku}`);
        return;
      }

      // update visually
      const current = parseInt(count.textContent, 10) || 0;
      count.textContent = current + 1;

      // Animate heart icon to red fill
      btn.classList.remove("border", "border-gray-300", "bg-white");

      const svg = btn.querySelector("svg");
      const path = svg?.querySelector("path");

      if (path) {
        path.setAttribute("fill", "#ef4444");
        path.setAttribute("stroke", "none");

        // Add animation class
        svg.classList.add("heart-pop");

        // Remove it after animation completes to allow future re-triggers
        setTimeout(() => {
          svg.classList.remove("heart-pop");
        }, 400); // Match your animation duration
      }

      // Fire webhook to Make with correct field name
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id }),
        });
        console.log(`✅ Sent product_id: ${product_id} to Make`);
      } catch (err) {
        console.error("Error sending like webhook:", err);
      }
    });
  });
}
