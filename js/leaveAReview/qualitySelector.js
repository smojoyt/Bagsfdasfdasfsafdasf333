export function setupQualitySelector() {
  const buttons = document.querySelectorAll(".quality-btn");
  const input = document.getElementById("qualityInput");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => {
        b.classList.remove(
          "bg-black", "text-white", "ring-2", "ring-black"
        );
        b.classList.add("bg-gray-200", "text-gray-700");
      });

      btn.classList.remove("bg-gray-200", "text-gray-700");
      btn.classList.add("bg-black", "text-white", "ring-2", "ring-black");

      input.value = btn.dataset.quality;
    });
  });
}
