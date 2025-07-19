export async function loadAnnouncementBar() {
  const container = document.getElementById("announcement-container");
  if (!container) return;

  try {
    const res = await fetch("/page_inserts/announcementBar.html");
    if (!res.ok) throw new Error("Failed to load announcement bar");

    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error("❌ Announcement bar load failed:", err);
    container.innerHTML = `<div class="bg-red-100 text-red-800 p-2 text-center">Announcement failed to load.</div>`;
  }
}

loadAnnouncementBar();
