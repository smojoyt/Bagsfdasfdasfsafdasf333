export function createReviewCard(review, products) {
  const name = review["first name"] || "Anonymous";
  const lastInitial = review["last name"] ? ` ${review["last name"].trim().charAt(0)}.` : "";
  const rating = parseInt(review.rating) || 0;
  const date = review.timestamp || "";
  const headline = review.reviewHeadline || "";
  const text = review.reviewText || "";
  const productId = review.productId;
  const customerImg = review.customerImg || null;

  // Normalize source (case-insensitive -> Title Case keys below)
  const sourceRaw = (review.source ?? "").toString().trim();
  const sourceKey = /depop/i.test(sourceRaw) ? "Depop"
                  : /karrykraze|kk/i.test(sourceRaw) ? "KarryKraze"
                  : /etsy/i.test(sourceRaw) ? "Etsy"
                  : sourceRaw || "Unknown";

  const product = Object.values(products).find(p => p.product_id === productId);
  const productName = product?.name || "Product";
  const productImage = product?.catalogImage || "/imgs/placeholder.jpg";

  const previewCharLimit = 214;
  const isLong = text.length > previewCharLimit;

  const escapeHTML = (str = "") =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const escapedText = escapeHTML(text);

  const previewText = isLong
    ? `${escapeHTML(text.slice(0, previewCharLimit))}... <span class="read-more-btn text-blue-600 underline cursor-pointer" data-review='${JSON.stringify({
        name,
        lastInitial,
        headline,
        text,
        date,
        rating,
        customerImg,
        productName,
        productImage
      })}'>Read More</span>`
    : escapedText;

  // Source-specific logos, badge backgrounds, and card border colors
  const sourceStyles = {
    Etsy: {
      img: "imgs/Logo/Brands/Etsy2.png",
      // badge bg white so the orange logo is visible; top-right rounded; with border
      badgeClasses: "bg-[#ff7313] rounded-tr-md border flex items-center",
      borderColor: "#FF7313"
    },
    KarryKraze: {
      img: "imgs/Logo/short/SL_0607.png",
      // badge bg cream (#fedcc1) per your request
      badgeClasses: "bg-[#fedcc1] rounded-tr-md border flex items-center",
      borderColor: "#fedcc1"
    },
    Depop: {
      img: "imgs/Logo/Brands/Depop.png",
      // badge bg black and border black per your request
      badgeClasses: "bg-black rounded-tr-md border flex items-center",
      borderColor: "#000000"
    },
    Unknown: {
      img: null,
      badgeClasses: "bg-gray-300 rounded-tr-md border flex items-center",
      borderColor: "#d1d5db"
    }
  };
  const style = sourceStyles[sourceKey] || sourceStyles.Unknown;

  // Wrapper holds badge + card (badge directly above; no margin)
  const cardWrapper = document.createElement("div");
  cardWrapper.className = "flex flex-col items-start";

  // Badge above card with image
  const badge = document.createElement("div");
  badge.className = `px-10 py-1 ${style.badgeClasses}`;
  badge.style.borderColor = style.borderColor;

  if (style.img) {
    const logo = document.createElement("img");
    logo.src = style.img;
    logo.alt = sourceKey;
    logo.className = "h-5 object-contain";
    badge.appendChild(logo);
  } else {
    // Fallback text if no logo
    const lbl = document.createElement("span");
    lbl.textContent = sourceKey;
    lbl.className = "text-xs font-semibold text-gray-800";
    badge.appendChild(lbl);
  }

  // Review card (border color matches source)
  const card = document.createElement("div");
  card.className = "w-[21rem] h-[20rem] flex flex-col bg-white shadow-sm overflow-hidden border-4";
  card.style.borderColor = style.borderColor;

  card.innerHTML = `
    <!-- Scrollable Content -->
    <div class="flex-1 flex flex-col justify-normal p-4 overflow-auto">

      <!-- Reviewer Info -->
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2 flex-wrap text-sm font-semibold text-gray-900">
          <span class="flex items-center gap-1">
            ${escapeHTML(name)}${escapeHTML(lastInitial)}
            <!-- Verified check -->
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027ZM16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z" />
            </svg>
          </span>
          <span class="text-xs text-blue-600 font-medium">Verified Buyer</span>
        </div>
        <div class="text-xs text-gray-500">${escapeHTML(date)}</div>
      </div>

      <!-- Rating -->
      <div class="text-yellow-400 text-4xl leading-none mb-2">
        ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
      </div>

      <!-- Headline -->
      <div class="text-xl font-bold text-gray-900 mb-1 uppercase">${escapeHTML(headline)}</div>

      <!-- Review Body Text -->
      <p class="text-sm text-gray-700 mb-3 whitespace-pre-line" data-full="${escapeHTML(text)}">
        ${previewText}
      </p>

      ${customerImg ? `
        <div class="mt-3">
          <img src="${customerImg}" alt="Customer photo" class="w-full max-h-40 object-cover border border-gray-300" />
        </div>
      ` : ""}

    </div>

    <!-- Sticky Product Info -->
    <div class="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white sticky bottom-0">
      <img src="${productImage}" alt="${escapeHTML(productName)}" class="w-6 h-6 object-cover border border-gray-300" />
      <span class="text-xs text-gray-600">${escapeHTML(productName)}</span>
    </div>
  `;

  // Assemble
  cardWrapper.appendChild(badge);
  cardWrapper.appendChild(card);

  return cardWrapper;
}
