// js/Home/animations/skeleton.js

// Featured grid skeleton (e.g. #featured-products)
export function showCardGridSkeleton(containerId, count = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.dataset.skeletonActive = "true";

  const cards = Array.from({ length: count })
    .map(
      () => `
        <div class="animate-pulse flex flex-col items-center text-center gap-3">
          <div class="w-full aspect-square bg-slate-200 rounded-2xl"></div>
          <div class="h-3 w-3/4 bg-slate-200 rounded-full"></div>
          <div class="h-3 w-1/2 bg-slate-200 rounded-full"></div>
        </div>
      `
    )
    .join("");

  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full">
      ${cards}
    </div>
  `;
}

// Bestseller carousel skeleton (e.g. #bestseller-products)
export function showCarouselSkeleton(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.dataset.skeletonActive = "true";

  const cards = Array.from({ length: count })
    .map(
      () => `
        <div class="animate-pulse flex-shrink-0 w-[75%] sm:w-[55%] md:w-[22rem] pr-3">
          <div class="w-full aspect-[4/3] bg-slate-200 rounded-2xl mb-3"></div>
          <div class="h-3 w-3/4 bg-slate-200 rounded-full mb-2"></div>
          <div class="h-3 w-1/3 bg-slate-200 rounded-full"></div>
        </div>
      `
    )
    .join("");

  container.innerHTML = `<div class="flex overflow-hidden">${cards}</div>`;
}

// Split feature skeleton (for #dynamicFeature)
export function showSplitFeatureSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.dataset.skeletonActive = "true";

  container.innerHTML = `
    <div class="w-full grid grid-cols-1 md:grid-cols-2 items-stretch gap-0">
      <div class="p-10 lg:px-24 flex flex-col justify-center space-y-4 bg-slate-100 animate-pulse">
        <div class="h-5 w-1/2 bg-slate-200 rounded-full"></div>
        <div class="h-5 w-3/4 bg-slate-200 rounded-full"></div>
        <div class="h-5 w-2/3 bg-slate-200 rounded-full"></div>
        <div class="h-3 w-full bg-slate-200 rounded-full mt-4"></div>
        <div class="h-3 w-5/6 bg-slate-200 rounded-full"></div>
        <div class="h-10 w-40 bg-slate-300 rounded-full mt-6"></div>
      </div>
      <div class="w-full h-[220px] sm:h-[280px] md:h-[380px] bg-slate-200 animate-pulse"></div>
    </div>
  `;
}

// Clear helper
export function clearSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.dataset.skeletonActive === "true") {
    container.innerHTML = "";
    delete container.dataset.skeletonActive;
  }
}
