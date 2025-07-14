// ✅ navbar.js
// Loads the HTML and kicks off the navbar system
import { initNavbar } from "./Navbar/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    if (!res.ok) throw new Error("Failed to fetch navbar");
    navContainer.innerHTML = await res.text();
    requestAnimationFrame(initNavbar);
  } catch (err) {
    navContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 text-center">Navbar failed to load.</div>`;
    console.error("❌ Navbar load failed:", err);
  }
});
