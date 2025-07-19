export function setupQualitySelector() {
  const buttons = document.querySelectorAll(".quality-btn");
  const input = document.getElementById("qualityInput");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      input.value = btn.dataset.quality;
    });
  });
}
