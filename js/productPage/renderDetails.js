// renderProductDetails.js
import { renderColorDotsWithLabel } from "./renderColorDotsWithLabel.js";
import { setupAddToCart } from "./setupAddToCart.js";

export function renderProductDetails(product, promo = null) {
  const nameEl = document.getElementById("product-name");
  const idEl = document.getElementById("product-id");
  const priceEl = document.getElementById("price-section");
  const extraSections = document.getElementById("extra-sections");
  const swatchContainer = document.getElementById("variant-swatch-container");

  if (!nameEl || !idEl || !priceEl || !extraSections || !swatchContainer) {
    console.warn("❌ Missing product detail DOM elements");
    return;
  }

  // 🧾 Name & ID
  nameEl.textContent = product.name;
  idEl.textContent = product.product_id || product.sku;

  // 💰 Price + Promotion
  const original = product.price;
  let finalPrice = original;

  if (promo) {
    if (promo.type === "percent") {
      finalPrice = original * (1 - promo.amount / 100);
    } else if (promo.type === "fixed") {
      finalPrice = original - promo.amount;
    }

    priceEl.innerHTML = `
    <p class="italic text-green-700 text-xl font-bold">
    <span class="text-3xl">$${finalPrice.toFixed(2)}</span>
      <span class="text-gray-500 line-through text-base ml-2">$${original.toFixed(2)}</span>
      </p>
      <span class="mr-2 text-sm bg-red-100 text-red-600 font-semibold px-2 py-1 rounded">
        -${promo.type === "percent" ? promo.amount + "%" : "$" + promo.amount} off
      </span>
      
    `;
  } else {
    priceEl.innerHTML = `<span class="italic text-green-700 text-2xl font-bold">$${original.toFixed(2)}</span>`;
  }

  // 🔽 Expandable Sections
  const sections = [
    { title: "Description", list: product.descriptionList },
    { title: "Sizing Info", list: product.sizingList },
    { title: "Key Details", list: product.keyDetails },
    { title: "Care Instructions", list: product.careInstructions }
  ];

  extraSections.innerHTML = sections
  .filter(s => Array.isArray(s.list) && s.list.length > 0)
  .map((s, i) => {
    const id = `section-${i}`;
    const isDefaultOpen = s.title === "Description";

    return `
      <div>
        <button data-toggle="${id}" class="w-full flex items-center justify-between px-4 text-sm uppercase font-bold text-gray-700 hover:bg-gray-50 transition">
          <span class="flex items-center gap-2">
            <span class="toggle-icon ${isDefaultOpen ? "text-red-500" : "text-gray-500"} transition-all">
              ${isDefaultOpen ? "−" : "+"}
            </span>
            ${s.title}
          </span>
        </button>
        <div id="${id}" class="toggle-content px-6 text-sm text-gray-700 ${isDefaultOpen ? "" : "hidden"}">
          <ul class="list-disc list-inside space-y-2">
            ${s.list.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }).join("");

// Toggle functionality
extraSections.querySelectorAll("button[data-toggle]").forEach(btn => {
  btn.addEventListener("click", () => {
    const content = document.getElementById(btn.dataset.toggle);
    const icon = btn.querySelector(".toggle-icon");

    const isOpen = !content.classList.contains("hidden");

    content.classList.toggle("hidden", isOpen);
    icon.textContent = isOpen ? "+" : "−";
    icon.classList.toggle("text-red-500", !isOpen);
    icon.classList.toggle("text-gray-500", isOpen);
  });
});


  // 🎨 Swatches
  const options = product.custom1Options?.split(" | ") || [];
  swatchContainer.innerHTML = renderColorDotsWithLabel(options, product.variantStock, product.variantImages, product.product_id);

  const firstAvailable = options.find(opt => product.variantStock[opt] > 0);
  const firstDot = swatchContainer.querySelector(`button[data-variant="${firstAvailable}"]`);
  if (firstDot) firstDot.classList.add("ring-4", "ring-black", "ring-offset-2");
  swatchContainer.dataset.selectedVariant = firstAvailable;

  swatchContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button.color-dot");
    if (!btn) return;

    const variant = btn.dataset.variant;
    const image = btn.dataset.image;

    swatchContainer.querySelectorAll("button.color-dot").forEach(dot =>
      dot.classList.remove("ring-4", "ring-black", "ring-offset-2")
    );
    btn.classList.add("ring-4", "ring-black", "ring-offset-2");
    swatchContainer.dataset.selectedVariant = variant;

    const preview = document.getElementById("product-img");
    if (preview && image) preview.src = image;
  });

  setupAddToCart(product);
}
