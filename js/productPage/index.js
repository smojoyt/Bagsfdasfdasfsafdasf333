import { loadProduct } from "./loadProduct.js";
import { renderProductImages } from "./renderImages.js";
import { renderProductDetails } from "./renderDetails.js";

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadProduct();
  if (!data) return;

  const { product, activePromo } = data;

  renderProductImages(product);
  renderProductDetails(product, activePromo);
});
