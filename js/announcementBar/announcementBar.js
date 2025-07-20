document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("announcement-container");
  if (!container) return;

  try {
    const res = await fetch("/page_inserts/announcementBar.html");
    if (!res.ok) throw new Error("Failed to load announcement bar");
    container.innerHTML = await res.text();
  } catch (err) {
    console.error("❌ Announcement bar load failed:", err);
  }
});
