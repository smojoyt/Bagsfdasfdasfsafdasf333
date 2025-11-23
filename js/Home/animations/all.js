// js/Home/animations/all.js

// Call this once on page load (e.g. from Home/index.js)
export function initHomeAnimations() {
  injectHeroCardAnimations();
}

function injectHeroCardAnimations() {
  if (document.getElementById("home-hero-animations")) return;

  const style = document.createElement("style");
  style.id = "home-hero-animations";
  style.textContent = `
    /* Floating animations for hero cards */
    @keyframes floatMain {
      0%   { transform: translateY(0) rotate(-4deg); }
      50%  { transform: translateY(-10px) rotate(-3deg); }
      100% { transform: translateY(0) rotate(-4deg); }
    }

    @keyframes floatSmall {
      0%   { transform: translateY(0) rotate(var(--float-rotate, 6deg)); }
      50%  { transform: translateY(-6px) rotate(calc(var(--float-rotate, 6deg) + 1deg)); }
      100% { transform: translateY(0) rotate(var(--float-rotate, 6deg)); }
    }

    .floating-card-main {
      animation: floatMain 8s ease-in-out infinite;
    }

    .floating-card-small {
      animation: floatSmall 7s ease-in-out infinite;
    }

    .floating-card-delay-1 {
      animation-delay: 0.8s;
      --float-rotate: -8deg;
    }

    .floating-card-delay-2 {
      animation-delay: 1.4s;
      --float-rotate: 7deg;
    }

    /* Hover effect for the entire hero product card */
    .hero-card-hover {
      transition: transform 200ms ease-out, box-shadow 220ms ease-out;
      will-change: transform, box-shadow;
    }

    .hero-card-hover:hover {
      transform: translateY(-5px) scale(1.03);
      box-shadow: 0 22px 40px rgba(15, 23, 42, 0.28);
    }
  `;
  document.head.appendChild(style);
}
