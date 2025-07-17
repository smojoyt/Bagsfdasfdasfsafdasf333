import { initSharedUI } from "../Shared/index.js";

export function initFooter() {
  const year = document.getElementById("footer-year");
  if (year) year.textContent = new Date().getFullYear();

  // future enhancements like social icon hover, link tracking, etc.
}

document.addEventListener("DOMContentLoaded", async () => {
  await initSharedUI(); // ✅ Load and activate shared UI elements
  initFooter();         // ✅ Footer-specific enhancements
});
