export function renderProductImages(product) {
  const mainImg = document.getElementById("product-img");
  mainImg.src = product.image || "/imgs/placeholder.jpg";

  const thumbs = product.thumbnails || [];
  const thumbContainer = document.getElementById("thumbnail-row");

  thumbContainer.innerHTML = thumbs.map((url) => `
    <img src="${url}" alt="Thumbnail" 
         class="w-16 h-16 rounded border cursor-pointer hover:opacity-80 object-cover"
         data-full="${url}" />
  `).join("");

  // Click to update main image
  thumbContainer.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-full]");
    if (!img) return;

    const fullURL = img.dataset.full;
    if (fullURL) mainImg.src = fullURL;
  });
}
