export function renderProductImages(product) {
  const mainImg = document.getElementById("product-img");
  const thumbContainer = document.getElementById("thumbnail-row");
  const mobileTrack = document.getElementById("carousel-track");

  const thumbs = product.thumbnails?.length ? product.thumbnails : [product.image];

  // 🖼️ Desktop Main Image
  if (mainImg) {
    mainImg.src = product.image || "/imgs/placeholder.jpg";
  }

  // 🖼️ Desktop Thumbnails
  if (thumbContainer) {
    thumbContainer.className = "grid grid-cols-2 gap-4 mt-4";
    thumbContainer.innerHTML = thumbs.map((url) => `
      <img src="${url}" alt="Thumbnail"
           class="w-full aspect-square cursor-pointer hover:opacity-80 object-cover"
           data-full="${url}" />
    `).join("");

    thumbContainer.addEventListener("click", (e) => {
      const img = e.target.closest("img[data-full]");
      if (img) mainImg.src = img.dataset.full;
    });
  }

  // 📱 Mobile Carousel
  if (mobileTrack) {
    mobileTrack.innerHTML = thumbs.map(url => `
      <img src="${url}"
           class="w-full aspect-square snap-start flex-shrink-0 object-cover"
           alt="Product Image" />
    `).join("");
  }
}
