import { loadProducts, loadMarketplacePrices } from './compare.js';

let productMap = {};

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchDropdown');
  const resultsList = document.getElementById('dropdownResults');
  const productImageContainer = document.getElementById('productImageContainer');
  const previewImage = document.getElementById('productImage');

  const products = await loadProducts();
  productMap = products;
  window.productMap = productMap;

  const productKeys = Object.keys(products);

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    resultsList.innerHTML = '';
    if (!term) {
      resultsList.classList.add('hidden');
      return;
    }

    const matched = productKeys.filter(key => {
      const product = productMap[key];
      return (
        product.name.toLowerCase().includes(term) ||
        product.product_id.toLowerCase().includes(term)
      );
    });

    if (matched.length === 0) {
      resultsList.classList.add('hidden');
      return;
    }

    matched.forEach(key => {
      const product = productMap[key];
      const li = document.createElement('li');
      li.className = 'flex items-center px-4 py-2 hover:bg-pink-100 cursor-pointer gap-3 text-left';
      li.innerHTML = `
        <img src="${product.catalogImage || product.image}" class="w-10 h-10 object-cover rounded" />
        <div>
          <div class="font-medium">${product.name}</div>
          <div class="text-xs text-gray-500">${product.product_id}</div>
        </div>
      `;
      li.dataset.key = key;
      resultsList.appendChild(li);
    });

    resultsList.classList.remove('hidden');
  });

  resultsList.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li || !li.dataset.key) return;

    const selectedKey = li.dataset.key;
    const selectedProduct = productMap[selectedKey];
    const productId = selectedProduct.product_id;

    resultsList.classList.add('hidden');
    searchInput.value = `${selectedProduct.name} (${productId})`;
    previewImage.src = selectedProduct.catalogImage || selectedProduct.image || '';
    productImageContainer.classList.remove('hidden');

    await fetch(`https://hook.us2.make.com/phuse8qs4ck7h69myespwj7kfbcj60s5?sku=${productId}`);
    const marketplaceData = await loadMarketplacePrices();
    showPrintOverlay(selectedProduct, marketplaceData.products?.[productId]);
  });
});

function showPrintOverlay(product, marketData) {
  const format = val => `$${Math.ceil(parseFloat(val))}`;
  const site = parseFloat(product.price);
  const etsy = parseFloat(marketData?.etsyPrice ?? 0);
  const depop = parseFloat(marketData?.depopPrice ?? 0);
  const max = Math.max(site, etsy || 0, depop || 0);
  const scale = val => `${Math.max(5, (val / max) * 100)}%`;

  const highlightStyle = 'border-2 border-yellow-300 shadow-lg';

  document.getElementById('overlayProductImage').src = product.catalogImage || product.image || '';
  document.getElementById('overlayProductName').textContent = product.name;
  document.getElementById('overlayProductId').textContent = product.product_id;

  const barSite = document.getElementById('overlayBarSite');
  const barEtsy = document.getElementById('overlayBarEtsy');
  const barDepop = document.getElementById('overlayBarDepop');

  const priceSite = document.getElementById('overlaySitePrice');
  const priceEtsy = document.getElementById('overlayEtsyPrice');
  const priceDepop = document.getElementById('overlayDepopPrice');

  priceSite.textContent = format(site);
  priceEtsy.textContent = etsy ? format(etsy) : '—';
  priceDepop.textContent = depop ? format(depop) : '—';

  priceSite.className = 'text-4xl font-bold mb-[6rem] text-center';
  priceEtsy.className = 'text-xl font-semibold mb-[6rem] text-center';
  priceDepop.className = 'text-xl font-semibold mb-[6rem] text-center';

  barSite.style.height = scale(site);
  barEtsy.style.height = etsy ? scale(etsy) : '0';
  barDepop.style.height = depop ? scale(depop) : '0';

  const lowest = Math.min(site, etsy || Infinity, depop || Infinity);
  let savingsMsg = '';
  let bestDeal = false;

// Replace with your actual calculation
const savings = Math.ceil(Math.max(etsy - site, depop - site));
const savingsBox = document.getElementById('overlaySavingsMessage');
const savingsAmountEl = document.getElementById('savingsAmount');

if (savings > 0) {
  savingsAmountEl.textContent = `$${savings}`;
  savingsBox.classList.remove('hidden');
} else {
  savingsBox.classList.add('hidden');
}




  document.getElementById('printOverlay').classList.remove('hidden');
}

window.printOverlay = function () {
  window.print();
  document.getElementById('printOverlay').classList.add('hidden');
};