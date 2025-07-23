// js/Cards/Review/reviewModal.js

export function setupReviewModal() {
  const modal = document.getElementById("review-modal");
  const closeBtn = document.getElementById("close-review-modal");
  const modalBody = document.getElementById("review-modal-body");

  if (!modal || !closeBtn || !modalBody) {
    console.warn("⚠️ Review modal elements not found in DOM.");
    return;
  }

  const escapeHTML = (str = "") =>
    str.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");

  // Open modal on Read More click
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".read-more-btn");
    if (!btn) return;

    let data;
    try {
      data = JSON.parse(btn.dataset.review);
    } catch (err) {
      console.warn("❌ Failed to parse review data:", err);
      return;
    }

    modalBody.innerHTML = `
      <div class="mb-2 text-xs text-gray-500">${escapeHTML(data.date)}</div>
      <h2 class="text-lg font-bold text-gray-900 mb-2">${escapeHTML(data.headline)}</h2>

      <div class="text-yellow-400 mb-3 text-base">
        ${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}
      </div>

      <p class="text-gray-700 text-sm mb-4 whitespace-pre-line">
        ${escapeHTML(data.text)}
      </p>

      ${data.customerImg ? `
        <img src="${data.customerImg}" alt="Customer photo"
          class="w-full max-h-64 object-cover border border-gray-300 mb-4" />
      ` : ""}

      <div class="flex items-center gap-2 mt-4">
        <img src="${data.productImage}" alt="${escapeHTML(data.productName)}"
          class="w-6 h-6 object-cover border border-gray-300" />
        <span class="text-xs text-gray-600">${escapeHTML(data.productName)}</span>
      </div>

      <div class="mt-2 text-sm text-gray-900 font-medium">
        ${escapeHTML(data.name || "")}${escapeHTML(data.lastInitial || "")}
      </div>
    `;

    modal.classList.remove("hidden");
  });

  // Close modal on button click
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

    // Swipe-to-close gesture
  let touchStartY = 0;

  modal.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  });

  modal.addEventListener("touchend", (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchEndY - touchStartY;

    if (distance > 100) {
      // Downward swipe
      modal.classList.add("hidden");
    }
  });

}
