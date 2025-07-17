import { fadeIn, fadeOut } from "./animation.js";

export async function initSharedUI() {
  // ✅ Inject all modals into the DOM
  const privacyRes = await fetch("/page_inserts/modals/privacy-modal.html");
  const shippingRes = await fetch("/page_inserts/modals/shipping-modal.html");
  const faqRes = await fetch("/page_inserts/modals/faq-modal.html");

  const privacyHTML = await privacyRes.text();
  const shippingHTML = await shippingRes.text();
  const faqHTML = await faqRes.text();

  document.body.insertAdjacentHTML("beforeend", privacyHTML);
  document.body.insertAdjacentHTML("beforeend", shippingHTML);
  document.body.insertAdjacentHTML("beforeend", faqHTML);

  // ✅ Setup modal logic for each modal
  setupModal({
    modalId: "privacy-modal",
    innerId: "privacy-inner",
    openSelectors: ["#privacy-link", "#open-privacy-modal"],
    closeSelectors: ["#privacy-close", "#close-privacy-modal"]
  });

  setupModal({
    modalId: "shipping-modal",
    innerId: "shipping-inner",
    openSelectors: ["#shipping-link", "#open-shipping-modal"],
    closeSelectors: ["#shipping-close", "#close-shipping-modal"]
  });

  setupModal({
    modalId: "faq-modal",
    innerId: "faq-inner",
    openSelectors: ["#faq-link", "#open-faq-modal"],
    closeSelectors: ["#faq-close", "#close-faq-modal"]
  });
}


// ✅ Shared reusable modal logic
function setupModal({ modalId, innerId, openSelectors, closeSelectors }) {
  const modal = document.getElementById(modalId);
  const innerModal = document.getElementById(innerId);
  const closeBtn = closeSelectors.map(sel => document.querySelector(sel)).find(el => el);
  const openLinks = openSelectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));

  if (!modal || !innerModal) return;

  // Open modal
  openLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      fadeIn(modal, { duration: 300 });
      fadeIn(innerModal, { duration: 300, display: "block" });
      modal.classList.remove("pointer-events-none", "hidden");
    });
  });

  // Close modal by close button
  closeBtn?.addEventListener("click", () => {
    fadeOut(innerModal, { duration: 300 });
    fadeOut(modal, { duration: 300 });
    setTimeout(() => modal.classList.add("pointer-events-none"), 300);
  });

  // Close modal by clicking backdrop
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      fadeOut(innerModal, { duration: 300 });
      fadeOut(modal, { duration: 300 });
      setTimeout(() => modal.classList.add("pointer-events-none"), 300);
    }
  });
}
