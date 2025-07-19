import { initFooter } from "./index.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("footer");
  if (!container) return;

  try {
    const res = await fetch("/page_inserts/footer.html");
    if (!res.ok) throw new Error("Failed to load footer");
    container.innerHTML = await res.text();
    requestAnimationFrame(initFooter);
  } catch (err) {
    console.error("❌ Footer load failed:", err);
  }
});
