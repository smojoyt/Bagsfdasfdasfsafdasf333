// js/Shared/animation.js

/** Fade in an element */
export function fadeIn(el, {
  duration = 300,
  display = "flex" // ✅ Use "flex" instead of "block"
} = {}) {
  el.style.opacity = 0;
  el.style.display = display;
  el.style.transition = `opacity ${duration}ms ease-in-out`;
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });
}


/** Fade out an element */
export function fadeOut(el, {
  duration = 300
} = {}) {
  el.style.transition = `opacity ${duration}ms ease-in-out`;
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.display = "none";
  }, duration);
}

/** Slide in from bottom */
export function slideUpIn(el, {
  duration = 300
} = {}) {
  el.style.transform = "translateY(100%)";
  el.style.opacity = 0;
  el.style.display = "block";
  el.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
  requestAnimationFrame(() => {
    el.style.transform = "translateY(0)";
    el.style.opacity = 1;
  });
}

/** Slide out to bottom */
export function slideDownOut(el, {
  duration = 300
} = {}) {
  el.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-in`;
  el.style.transform = "translateY(100%)";
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.display = "none";
  }, duration);
}
