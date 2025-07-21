import { initSharedUI } from "../Shared/index.js";

export function initAnnouncementBar() {
  const container = document.getElementById("announcement-container");
  if (!container) return;

  fetch("/page_inserts/announcementbar.html")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load announcement bar");
      return res.text();
    })
    .then(html => {
      container.innerHTML = html;
      console.log("✅ Announcement bar loaded");
    })
    .catch(err => {
      console.error("❌ Announcement bar load failed:", err);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initSharedUI();       // 🔁 Shared UI setup (e.g., scroll locks, overlays)
  initAnnouncementBar();      // 📢 Inject the announcement bar
});