export function animateMenuLinks({
  selector = "#menu-links li",
  animation = "slide-left",
  delay = 100,
  duration = 500,
  easing = "ease-out",
  reverse = false,
  onScroll = false
} = {}) {
  const links = document.querySelectorAll(selector);
  if (!links.length) return;

  const animationPresets = {
    "slide-left": ["opacity-0", "-translate-x-4"],
    "slide-right": ["opacity-0", "translate-x-4"],
    "slide-down": ["opacity-0", "-translate-y-4"],
    "slide-up": ["opacity-0", "translate-y-4"],
    "fade-in": ["opacity-0"]
  };

  const baseClasses = animationPresets[animation] || animationPresets["slide-left"];
  const transitionClasses = [`transition`, `duration-[${duration}ms]`, easing];

  const applyAnimation = () => {
    links.forEach((el, i) => {
      el.classList.remove(...transitionClasses);
      el.classList.add(...baseClasses);

      setTimeout(() => {
        el.classList.add(...transitionClasses);

        if (reverse) {
          el.classList.add(...baseClasses);
        } else {
          el.classList.remove(...baseClasses);
        }
      }, i * delay);
    });
  };

  if (onScroll) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          applyAnimation();
          obs.disconnect(); // Trigger only once
        }
      });
    }, { threshold: 0.5 });

    links.forEach((el) => observer.observe(el));
  } else {
    applyAnimation();
  }
}
