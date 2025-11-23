// js/Home/featuredHighlight.js
import { getAllProducts } from "./homeData.js";

export async function loadDynamicFeatureSection(category) {
  const products = await getAllProducts();

  const container = document.getElementById("dynamicFeature");
  if (!container) return;

  const matching = Object.values(products).filter(
    (p) =>
      (!category ||
        (p.category &&
          p.category.toLowerCase() === category.toLowerCase())) &&
      Object.values(p.variantStock || {}).some((qty) => qty > 0)
  );

  if (matching.length === 0) return;

  const categoryTextMap = {
    headwear: "Hats",
    bagaccessory: "Charms",
    bags: "Bags",
  };

  const normalizedCategory = category?.toLowerCase?.() || "";
  const categoryName =
    categoryTextMap[normalizedCategory] || category || "Styles";

  const selected =
    matching[Math.floor(Math.random() * matching.length)];

  const secondThumb =
    selected.thumbnails?.[1] ||
    selected.thumbnails?.[0] ||
    selected.image;
  const name = selected.name;

  const leftCaptions = [
    `Each ${name} from our ${categoryName} collection is crafted to express your individuality. Whether you're styling up or keeping it chill, our ${categoryName} are built to turn heads and tell your story.`,
    `Our ${categoryName} — especially the ${name} — add a bold touch to any outfit. Designed to stand out, styled to be remembered.`,
    `Make room in your rotation — the ${name} from our ${categoryName} lineup is all about bold statements and everyday ease.`,
    `Our ${categoryName} were made to do more than just look good — the ${name} proves it every time you wear it.`,
    `From detail to durability, the ${name} represents everything our ${categoryName} stand for: quality, confidence, and culture.`,
  ];

  const rightCaptions = [
    `No matter the moment, our ${categoryName} — like the ${name} — are made to move with you. Effortlessly versatile, endlessly bold, and always unapologetically you.`,
    `Our ${categoryName} are built for real life. The ${name} keeps up whether you're out all day or just vibing inside.`,
    `Comfort, style, and practicality — that’s what the ${name} delivers. It’s why our ${categoryName} stay in demand.`,
    `The ${name} is part of our mission to make ${categoryName} that actually fit your life — and your energy.`,
    `Why settle for less? Our ${categoryName}, like the ${name}, are made with intention — built to last, styled to flex.`,
  ];

  const leftText =
    leftCaptions[Math.floor(Math.random() * leftCaptions.length)];
  const rightText =
    rightCaptions[Math.floor(Math.random() * rightCaptions.length)];

  const buyUrl = selected.url || `/pages/product.html?sku=${selected.sku || ""}`;

  container.innerHTML = `
    <div class="w-full grid grid-cols-1 md:grid-cols-2 items-stretch gap-0 relative bg-[#fedcc1]">

  <div class="p-12 md:p-16 lg:p-24 flex flex-col justify-center items-start text-left space-y-2 md:space-y-8 relative z-20">
    
    <p class="text-lg font-medium text-orange-700 uppercase tracking-wider">
      Welcome to the
    </p>

    <h2 class="text-3xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 drop-shadow-sm uppercase">
      Home of the ${name}
    </h2>

    <div class="w-full space-y-8 pt-6">
      
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 bg-white/60 backdrop-blur-sm rounded-full p-3 shadow-lg ring-1 ring-black/5">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
               class="w-8 h-8 md:w-10 md:h-10 text-orange-600" stroke="currentColor">
            <path d="M13 8.92226L7.92226 3.84453C6.79623 2.71849 4.97056 2.71849 3.84453 3.84453C2.71849 4.97056 2.71849 6.79623 3.84453 7.92226L16.0777 20.1555C17.2038 21.2815 19.0294 21.2815 20.1555 20.1555C21.2815 19.0294 21.2815 17.2038 20.1555 16.0777L17.0777 13" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 10L10 6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M16.1 2.30719C16.261 1.8976 16.8385 1.8976 16.9994 2.30719L17.4298 3.40247C17.479 3.52752 17.5776 3.62651 17.7022 3.67583L18.7934 4.1078C19.2015 4.26934 19.2015 4.849 18.7934 5.01054L17.7022 5.44252C17.5776 5.49184 17.479 5.59082 17.4298 5.71587L16.9995 6.81115C16.8385 7.22074 16.261 7.22074 16.1 6.81116L15.6697 5.71587C15.6205 5.59082 15.5219 5.49184 15.3973 5.44252L14.3061 5.01054C13.898 4.849 13.898 4.26934 14.3061 4.1078L15.3973 3.67583C15.5219 3.62651 15.6205 3.52752 15.6697 3.40247L16.1 2.30719Z" />
            <path d="M19.9672 9.12945C20.1281 8.71987 20.7057 8.71987 20.8666 9.12945L21.0235 9.5288C21.0727 9.65385 21.1713 9.75284 21.2959 9.80215L21.6937 9.95965C22.1018 10.1212 22.1018 10.7009 21.6937 10.8624L21.2959 11.0199C21.1713 11.0692 21.0727 11.1682 21.0235 11.2932L20.8666 11.6926C20.7057 12.1022 20.1281 12.1022 19.9672 11.6926L19.8103 11.2932C19.7611 11.1682 19.6625 11.0692 19.5379 11.0199L19.14 10.8624C18.732 10.7009 18.732 10.1212 19.14 9.95965L19.5379 9.80215C19.6625 9.75284 19.7611 9.65385 19.8103 9.5288L19.9672 9.12945Z" />
            <path d="M5.1332 15.3072C5.29414 14.8976 5.87167 14.8976 6.03261 15.3072L6.18953 15.7065C6.23867 15.8316 6.33729 15.9306 6.46188 15.9799L6.85975 16.1374C7.26783 16.2989 7.26783 16.8786 6.85975 17.0401L6.46188 17.1976C6.33729 17.2469 6.23867 17.3459 6.18953 17.471L6.03261 17.8703C5.87167 18.2799 5.29414 18.2799 5.1332 17.8703L4.97628 17.471C4.92714 17.3459 4.82852 17.2469 4.70393 17.1976L4.30606 17.0401C3.89798 16.8786 3.89798 16.2989 4.30606 16.1374L4.70393 15.9799C4.82852 15.9306 4.92714 15.8316 4.97628 15.7065L5.1332 15.3072Z" />
          </svg>
        </div>
        <div>
          <p class="text-sm md:text-xl font-bold text-gray-900">
            ${leftText}
          </p>
          <p class="text-base text-gray-700 mt-1">
            A short, engaging blurb about why this feature is amazing.
          </p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 bg-white/60 backdrop-blur-sm rounded-full p-3 shadow-lg ring-1 ring-black/5">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
               class="w-8 h-8 md:w-10 md:h-10 text-teal-600" stroke="currentColor">
            <path d="M2.92992 12.7732C2.3588 14.4238 2.07325 15.2491 2.43835 15.7587C2.80345 16.2683 3.57742 16.1248 5.12535 15.8376L5.52582 15.7634C5.9657 15.6818 6.18563 15.641 6.39316 15.7012C6.60069 15.7614 6.77232 15.9157 7.11558 16.2245L7.42809 16.5056C8.63602 17.5922 9.79155 17.8917 9.79155 17.8917C10.3431 17.648 10.477 16.7787 10.7447 15.0401L10.814 14.5903C10.8901 14.0962 10.9281 13.8492 11.0475 13.6446C11.1669 13.4399 11.3541 13.3008 11.7286 13.0226L12.0695 12.7693C13.3871 11.7902 14.0459 11.3006 14.0217 10.6404C13.9975 9.98014 13.3063 9.58645 11.9238 8.79907L11.5662 8.59536C11.1733 8.37161 10.9769 8.25974 10.8431 8.07305C10.7094 7.88637 10.6535 7.646 10.5416 7.16529L10.4398 6.72764C10.0462 5.03598 9.84944 4.19015 9.28291 4.02582C8.71638 3.86148 8.1553 4.48747 7.03315 5.73945L6.74284 6.06335C6.42396 6.41912 6.26452 6.59701 6.06247 6.68628C5.86042 6.77556 5.63864 6.76613 5.19508 6.74725L4.79126 6.73007C3.23035 6.66365 2.4499 6.63044 2.12399 7.18912C1.79807 7.7478 2.14254 8.52837 2.83147 10.0895" stroke-width="1.5" stroke-linecap="round"></path>
            <path d="M11.9239 8.79864L15 9.65061M9.7916 17.8913L13.0651 18.8409M11.0476 13.6441L19.0252 15.9583M9.28296 4.02539L17.2606 6.33953C17.8271 6.50387 18.0239 7.34969 18.4175 9.04135L18.5193 9.479C18.6312 9.95972 18.6871 10.2001 18.8208 10.3868C18.9546 10.5734 19.151 10.6853 19.5438 10.9091M19.5438 10.9091L19.9015 11.1128C21.284 11.9002 21.9752 12.2939 21.9994 12.9541C22.0236 13.6143 21.3648 14.1039 20.0471 15.083L19.7062 15.3363C19.3318 15.6145 19.1446 15.7536 19.0252 15.9583M19.5438 10.9091L17.6388 10.3815M19.0252 15.9583C18.9058 16.1629 18.8678 16.4099 18.7917 16.904L18.7224 17.3538C18.6408 17.8835 18.5205 18.3551 18.3926 18.7549C18.1952 19.3717 18.0965 19.6801 17.7378 19.8862C17.379 20.0922 17.0322 19.9916 16.3385 19.7904" stroke-width="1.5" stroke-linecap="round"></path>
          </svg>
        </div>
        <div>
          <p class="text-sm md:text-xl font-bold text-gray-900">
            ${rightText}
          </p>
          <p class="text-base text-gray-700 mt-1">
            Another compelling benefit that makes the customer want to buy.
          </p>
        </div>
      </div>
    </div>

    <div class="pt-6">
      <a href="${buyUrl}" class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-lg font-bold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-gray-800">
        Buy Now
        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </a>
    </div>
  </div>

  <div class="w-full h-[300px] sm:h-[400px] md:h-auto overflow-hidden relative z-10 md:[clip-path:polygon(15%_0,100%_0,100%_100%,0_100%)] md:-ml-20">
    <img src="${secondThumb}" alt="${name}" class="w-full h-full object-cover object-center transition-transform duration-500 ease-in-out md:hover:scale-110">
  </div>
  
</div>
  `;
}
