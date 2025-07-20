export function createFeaturedCard(product, sku, finalPrice, originalPrice) {
  const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";

  const priceHTML = originalPrice
    ? `<span class="line-through text-gray-400 text-sm mr-1">$${originalPrice.toFixed(2)}</span>
       <span class="text-green-700 font-bold">$${finalPrice.toFixed(2)}</span>`
    : `<span class="text-black font-bold">$${finalPrice.toFixed(2)}</span>`;

  const card = document.createElement("div");
  card.className = "flex flex-col text-center items-center max-w-xs";
  card.setAttribute("data-sku", sku);
  card.innerHTML = `
    <a href="/pages/product.html?sku=${sku}" class="block w-full">
      <img src="${imageUrl}" alt="${product.name}" class="w-full aspect-square object-cover bg-gray-100" />
    </a>
    <div class="mt-2 font-medium text-base">${product.name}</div>
    <div class="mt-1">${priceHTML}</div>
  `;
  return card;
}
