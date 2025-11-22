import { setupQualitySelector } from "./qualitySelector.js";
import { setupStarRating } from "./starRating.js";
import { setupImagePreview } from "./imagePreview.js";
import { setupFormSubmit } from "./submitReview.js";
import { setupProductDropdown } from "./productDropdown.js";

// ✅ Firebase config (fill these in)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "karrykraze-refiews.firebaseapp.com",
  projectId: "karrykraze-refiews",
  storageBucket: "karrykraze-refiews.appspot.com",
  messagingSenderId: "207129112203",
  appId: "1:207129112203:web:910e834e7c1bbe9158ae8e"
};
firebase.initializeApp(firebaseConfig);

/* ---------------------------
   Order Source + Masking UI
----------------------------*/
function setupOrderSourceUI() {
  const btnWebsite = document.getElementById("btnWebsite"); // KK
  const btnEtsy = document.getElementById("btnEtsy");
  const websiteLogo = document.getElementById("websiteLogo");
  const etsyLogo = document.getElementById("etsyLogo");
  const input = document.getElementById("orderIdInput");
  const source = document.getElementById("orderSource"); // hidden/select input
  const help = document.getElementById("orderHelp");

  if (!btnWebsite || !btnEtsy || !input || !source || !help) return;

  // helpers (no formatting symbols, just clean content)
  const onlyDigits = (s) => (s || "").replace(/\D/g, "");
  const onlyAlphaNum = (s) => (s || "").replace(/[^A-Za-z0-9]/g, "");

  // formatters (just clamp + strip; no # or -)
  const KK_LEN = 8;
  const ETSY_LEN = 10;

  const formatKK = (val) => onlyAlphaNum(val).slice(0, KK_LEN);
  const formatEtsy = (val) => onlyDigits(val).slice(0, ETSY_LEN);

  // active-state helpers
  const deactivate = (btn) => {
    btn.classList.remove("active");
    btn.style.backgroundColor = "#ffffff";
    btn.setAttribute("aria-pressed", "false");
  };
  const activate = (btn, bg) => {
    btn.classList.add("active");
    btn.style.backgroundColor = bg;
    btn.setAttribute("aria-pressed", "true");
  };

  // logo crossfade
  const swapLogo = (imgEl, newSrc) => {
    if (!imgEl) return;
    if (imgEl.src.endsWith(newSrc)) return;
    imgEl.classList.remove("fade-in");
    imgEl.classList.add("fade-out");
    const onLoad = () => {
      imgEl.classList.remove("fade-out");
      imgEl.classList.add("fade-in");
      imgEl.removeEventListener("load", onLoad);
    };
    imgEl.addEventListener("load", onLoad);
    requestAnimationFrame(() => (imgEl.src = newSrc));
  };

  // current formatter + length guard
  let formatter = formatKK;
  let requiredLen = KK_LEN;

  // KK (Website) mode: 8 alphanumeric (plain)
  const setKKMode = () => {
    source.value = "KarryKraze"; // <- aligns with submitReview.js
    input.placeholder = "Enter your KK Order ID (8 letters/numbers)";
    help.textContent = "Tip: Use the 8-character Order ID from your website confirmation email.";

    input.setAttribute("inputmode", "text");
    input.setAttribute("pattern", "^[A-Za-z0-9]{8}$");
    input.setAttribute("title", "Enter exactly 8 letters/numbers (no spaces or symbols).");

    formatter = formatKK;
    requiredLen = KK_LEN;

    deactivate(btnEtsy);
    activate(btnWebsite, "#fedcc1");
    // keep your logo behavior (optional to change):
    swapLogo(etsyLogo, "/imgs/Logo/Brands/Etsy.png");

    input.value = formatter(input.value);
  };

  // Etsy mode: 10 digits (plain)
  const setEtsyMode = () => {
    source.value = "Etsy"; // <- aligns with submitReview.js
    input.placeholder = "Enter your Etsy Receipt Number (10 digits)";
    help.textContent = "Tip: On Etsy, copy the 10-digit Receipt (Order) Number from Purchases & Reviews.";

    input.setAttribute("inputmode", "numeric");
    input.setAttribute("pattern", "^[0-9]{10}$");
    input.setAttribute("title", "Enter exactly 10 digits (no spaces or symbols).");

    formatter = formatEtsy;
    requiredLen = ETSY_LEN;

    deactivate(btnWebsite);
    activate(btnEtsy, "#ff7313");
    swapLogo(etsyLogo, "/imgs/Logo/Brands/Etsy2.png");

    input.value = formatter(input.value);
  };

  // live cleaning (no cursor jumps beyond end)
  const enforceMask = (e) => {
    const raw = e.target.value;
    e.target.value = formatter(raw);
    const end = e.target.value.length;
    e.target.setSelectionRange(end, end);
  };
  input.addEventListener("input", enforceMask);
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    input.value = formatter(text);
  });

  // init default: KK (website)
  setKKMode();

  // click + keyboard toggles
  btnWebsite.addEventListener("click", setKKMode);
  btnEtsy.addEventListener("click", setEtsyMode);
  [btnWebsite, btnEtsy].forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        (btn === btnWebsite ? setKKMode : setEtsyMode)();
      }
    });
  });

input.addEventListener("blur", () => {
  console.log("Current orderSource:", source.value);  // 👈 debug check

  const val = input.value.trim();

  if (source.value === "KarryKraze" || source.value === "KK") {
    const ok = /^[A-Za-z0-9]{8}$/.test(val);
    input.setCustomValidity(ok ? "" : "Please enter exactly 8 letters/numbers.");
    return;
  }

  if (source.value === "Etsy") {
    const ok = /^[0-9]{10}$/.test(val);
    input.setCustomValidity(ok ? "" : "Please enter exactly 10 digits.");
    return;
  }

  // fallback (optional)
  input.setCustomValidity("");
});


}

/* ---------------------------
   Products -> Dropdown init
----------------------------*/
async function loadProductsAndInitDropdown() {
  try {
    const res = await fetch("/products/products.json");
    const raw = await res.json();

    // normalize an image field for each product
    const products = Object.fromEntries(
      Object.entries(raw).map(([key, p]) => {
        const image =
          p.catalogImage ||
          p.image ||
          (Array.isArray(p.images) && p.images[0]) ||
          "/imgs/placeholder.png";
        return [key, { ...p, image }];
      })
    );

    setupProductDropdown(products);
  } catch (err) {
    console.error("Failed to load products for dropdown:", err);
  }
}

/* ---------------------------
   Boot
----------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  // Firebase compat is loaded via script tags in HTML
  const storage = firebase.storage();

  setupOrderSourceUI();
  setupQualitySelector();
  setupStarRating();
  setupImagePreview();
  setupFormSubmit(storage);
  loadProductsAndInitDropdown();
});
