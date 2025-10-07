export function setupQualitySelector() {
  const container = document.getElementById("qualityOptions");
  const input = document.getElementById("qualityInput");
  if (!container || !input) return;

  const buttons = container.querySelectorAll(".quality-btn");

  // helper: set visual state for a single button
  function activate(btn) {
    buttons.forEach(b => {
      b.classList.remove("bg-black","text-white","ring-2","ring-black");
      b.classList.add("bg-gray-200","text-gray-700");
      b.setAttribute("aria-pressed", "false");
    });

    btn.classList.remove("bg-gray-200","text-gray-700");
    btn.classList.add("bg-black","text-white","ring-2","ring-black");
    btn.setAttribute("aria-pressed", "true");
  }

  buttons.forEach(btn => {
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-pressed", "false");

    btn.addEventListener("click", () => {
      // set chosen value
      input.value = btn.dataset.quality || btn.textContent.trim();

      // visually mark the pressed one
      activate(btn);

      // Clear any temporary "invalid" decoration added by submit guard
      container.classList.remove("ring-2","ring-red-500","rounded-md","p-1");
    });

    // Keyboard support
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
}
