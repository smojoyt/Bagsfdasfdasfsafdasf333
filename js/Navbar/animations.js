export function animateMenuLinks({
  selector = "#menu-links li",
  animation = "slide-left", // 'fade-in', 'slide-down', etc.
  delay = 100,
  duration = 500,
  easing = "ease-out",
  reverse = false,
  onScroll = false
} = {}) {
  const links = document.querySelectorAll(selector);
  const baseClasses = {
    "slide-left": "opacity-0 -translate-x-4",
    "slide-right": "opacity-0 translate-x-4",
    "slide-down": "opacity-0 -translate-y-4",
    "slide-up": "opacity-0 translate-y-4",
    "fade-in": "opacity-0"
  };

  const base = baseClasses[animation] || baseClasses["slide-left"];
  const transition = `transition duration-[${duration}ms] ${easing}`;

  const applyAnimation = () => {
    links.forEach((li, i) => {
      li.classList.remove(...transition.split(" "));
      li.classList.add(...base.split(" "));

      setTimeout(() => {
        if (reverse) {
          li.classList.add(...transition.split(" "));
          li.classList.add(...base.split(" "));
        } else {
          li.classList.remove(...base.split(" "));
          li.classList.add(...transition.split(" "));
        }
      }, i * delay);
    });
  };

  if (onScroll) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          applyAnimation();
          obs.disconnect(); // only animate once
        }
      });
    }, { threshold: 0.5 });

    links.forEach((li) => observer.observe(li));
  } else {
    applyAnimation();
  }
}
