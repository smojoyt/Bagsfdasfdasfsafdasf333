// js/Shared/skeleton.js

/**
 * Skeleton renderer (inline or overlay) with a11y, dark-mode, and per-instance timing.
 *
 * Options:
 *  - variant: 'grid-card' | 'list' | 'lines'
 *  - count: number of items to render
 *  - aspect: Tailwind aspect class for cards (e.g. 'aspect-[4/5]' or 'aspect-square')
 *  - overlay: render as absolute overlay instead of replacing content
 *  - label: loading label
 *  - minDuration: keep skeleton visible at least N ms (avoids flicker on fast loads)
 *  - tone: 'gray' | 'slate' | 'zinc'  (affects background color classes)
 *  - rounded: Tailwind radius class (e.g. 'rounded-lg')
 *  - itemMaxWidth: max width class for card skeletons (e.g. 'max-w-[30rem]')
 */

const META = new WeakMap(); // container -> { start, min, overlayNode }

function resolveTarget(target) {
  return typeof target === "string" ? document.querySelector(target) : target;
}

function toneBg(tone = "gray") {
  // Background blocks: light & dark mode friendly
  switch (tone) {
    case "slate": return "bg-slate-200 dark:bg-slate-700";
    case "zinc":  return "bg-zinc-200 dark:bg-zinc-700";
    case "gray":
    default:      return "bg-gray-200 dark:bg-gray-700";
  }
}

export function renderSkeleton(target, opts = {}) {
  const {
    variant = "grid-card",
    count = 8,
    aspect = "aspect-[4/5]",
    overlay = false,
    label = "Loading items…",
    minDuration = 0,
    tone = "gray",
    rounded = "rounded-lg",
    itemMaxWidth = "max-w-[30rem]",
  } = opts;

  const el = resolveTarget(target);
  if (!el) return;

  // Mark container busy; record timing meta
  el.setAttribute("aria-busy", "true");
  META.set(el, { start: performance.now(), min: minDuration, overlayNode: null });

  // Root node for skeleton content
  let root = el;

  if (overlay) {
    // If there is an existing overlay, remove it first
    el.querySelectorAll('[data-skeleton-overlay="true"]').forEach(n => n.remove());

    // Ensure container can host absolutely-positioned overlay
    const stylePos = getComputedStyle(el).position;
    if (stylePos === "static") {
      // Add inline style so we don't rely on external classes
      el.style.position = "relative";
    }

    root = document.createElement("div");
    root.dataset.skeletonOverlay = "true";
    root.className = "absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-black/50 backdrop-blur-sm";
    el.appendChild(root);

    // keep reference to overlayNode for cleanup
    const meta = META.get(el);
    if (meta) meta.overlayNode = root;
  } else {
    // Inline mode: clear existing skeleton items/label
    el.querySelectorAll("[data-skeleton-item],[data-skeleton-label]").forEach(n => n.remove());
  }

  // --- Label (safe, no innerHTML for text) ---
  const labelRow = document.createElement("div");
  labelRow.className = "col-span-full flex items-center justify-center py-4 text-gray-600 dark:text-gray-300";
  labelRow.setAttribute("role", "status");
  labelRow.setAttribute("aria-live", "polite");
  labelRow.dataset.skeletonLabel = "true";

  const labelWrap = document.createElement("div");
  labelWrap.className = "flex items-center gap-2";

  // Spinner
  const spinner = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  spinner.setAttribute("viewBox", "0 0 24 24");
  spinner.setAttribute("fill", "none");
  spinner.classList.add("w-5", "h-5", "motion-safe:animate-spin");

  const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerCircle.setAttribute("cx", "12");
  outerCircle.setAttribute("cy", "12");
  outerCircle.setAttribute("r", "10");
  outerCircle.setAttribute("stroke", "currentColor");
  outerCircle.setAttribute("stroke-width", "4");
  outerCircle.setAttribute("opacity", ".25");

  const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arc.setAttribute("d", "M22 12a10 10 0 0 1-10 10");
  arc.setAttribute("stroke", "currentColor");
  arc.setAttribute("stroke-width", "4");

  spinner.appendChild(outerCircle);
  spinner.appendChild(arc);

  const labelSpan = document.createElement("span");
  labelSpan.className = "text-sm font-medium";
  labelSpan.textContent = label; // ✅ safe text

  labelWrap.appendChild(spinner);
  labelWrap.appendChild(labelSpan);
  labelRow.appendChild(labelWrap);
  root.appendChild(labelRow);

  // --- Items (decorative; aria-hidden) ---
  const bgClass = toneBg(tone);

  const makeCard = () => {
    const sk = document.createElement("div");
    sk.className = `motion-safe:animate-pulse w-full ${itemMaxWidth} mx-auto`;
    sk.dataset.skeletonItem = "true";
    sk.setAttribute("aria-hidden", "true");

    const imageBox = document.createElement("div");
    imageBox.className = `${bgClass} ${rounded} ${aspect}`;

    const line1 = document.createElement("div");
    line1.className = `mt-3 h-3 ${bgClass} rounded w-3/4`;

    const line2 = document.createElement("div");
    line2.className = `mt-2 h-3 ${bgClass} rounded w-1/2`;

    sk.appendChild(imageBox);
    sk.appendChild(line1);
    sk.appendChild(line2);
    return sk;
  };

  const makeLine = (w) => {
    const d = document.createElement("div");
    d.dataset.skeletonItem = "true";
    d.setAttribute("aria-hidden", "true");
    d.className = `motion-safe:animate-pulse h-3 ${bgClass} rounded my-2`;
    d.style.width = w;
    return d;
  };

  if (variant === "grid-card") {
    for (let i = 0; i < count; i++) root.appendChild(makeCard());
  } else if (variant === "list") {
    for (let i = 0; i < count; i++) root.appendChild(makeLine(`${80 - (i % 5) * 10}%`));
  } else {
    for (let i = 0; i < count; i++) root.appendChild(makeLine("100%"));
  }
}

export async function clearSkeleton(target) {
  const el = resolveTarget(target);
  if (!el) return;

  // Honor minDuration per instance
  const meta = META.get(el) || { start: 0, min: 0, overlayNode: null };
  const elapsed = performance.now() - meta.start;
  const wait = Math.max(0, meta.min - elapsed);
  if (wait) await new Promise((r) => setTimeout(r, wait));

  el.removeAttribute("aria-busy");

  // Remove overlay if present (new attribute)…
  if (meta.overlayNode && meta.overlayNode.parentNode) {
    meta.overlayNode.parentNode.removeChild(meta.overlayNode);
  }
  // …or support legacy id-based overlay from earlier versions
  const legacy = el.querySelector("#skeleton-overlay[data-skeleton-overlay='true']");
  if (legacy) legacy.remove();

  // Remove inline items/labels if you used inline mode
  el.querySelectorAll("[data-skeleton-item],[data-skeleton-label]").forEach((n) => n.remove());

  META.delete(el);
}

/**
 * Update the visible label text while the skeleton is shown.
 * If nothing is found, this is a no-op.
 */
export function updateSkeletonLabel(target, newLabel = "Loading…") {
  const el = resolveTarget(target);
  if (!el) return;
  const labelSpan = el.querySelector("[data-skeleton-label] .font-medium");
  if (labelSpan) labelSpan.textContent = newLabel;
}
