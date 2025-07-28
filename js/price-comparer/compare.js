export async function loadProducts() {
  try {
    const res = await fetch('/products/products.json');
    return await res.json();
  } catch (err) {
    console.error('❌ Failed to load local products.json:', err);
    return {};
  }
}

export async function loadMarketplacePrices() {
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/68869085f7e7a370d1eedbc3/latest', {
      headers: {
        'X-Master-Key': '$2a$10$J46OeqIxDrySG761m72SB.jzEHkOGTFlf4tblSOMrzdUS81uiqEzm'
      }
    });
    const data = await res.json();
    return data.record;
  } catch (err) {
    console.error('❌ Failed to fetch marketplace prices:', err);
    return {};
  }
}

export function updateComparisonUI(productId, sitePrice, marketData) {
  const section = document.getElementById('printSection');
  section.classList.remove('hidden');

  const format = val => `$${parseFloat(val).toFixed(2)}`;

  const site = parseFloat(sitePrice);
  const etsy = parseFloat(marketData?.etsyPrice ?? 0);
  const depop = parseFloat(marketData?.depopPrice ?? 0);

  const max = Math.max(site, etsy || 0, depop || 0);
  const scale = val => `${Math.round((val / max) * 100)}%`;

  // Set price labels
  document.getElementById('sitePrice').textContent = format(site);
  document.getElementById('etsyPrice').textContent = marketData?.etsyPrice ? format(etsy) : '—';
  document.getElementById('depopPrice').textContent = marketData?.depopPrice ? format(depop) : '—';

  // Set bar heights
  document.getElementById('barSite').style.height = scale(site);
  document.getElementById('barEtsy').style.height = etsy ? scale(etsy) : '0';
  document.getElementById('barDepop').style.height = depop ? scale(depop) : '0';

  // Set name + ID
  document.getElementById('productName').textContent = getProductName(productId);
  document.getElementById('productId').textContent = productId;
}

function getProductName(productId) {
  for (const key in window.productMap) {
    if (window.productMap[key].product_id === productId) {
      return window.productMap[key].name;
    }
  }
  return '—';
}
