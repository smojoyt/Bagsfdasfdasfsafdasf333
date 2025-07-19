export function setupStarRating() {
  const stars = document.querySelectorAll('#starRating span');
  const ratingInput = document.getElementById('ratingInput');
  const starLabel = document.getElementById('starLabel');
  const labels = { 1: "Terrible", 2: "Poor", 3: "Okay", 4: "Good", 5: "Great" };
  let selected = 0;

  function highlight(value) {
    stars.forEach(star => {
      const val = parseInt(star.dataset.star);
      star.classList.toggle('text-yellow-500', val <= value);
      star.classList.toggle('text-gray-300', val > value);
    });
  }

  stars.forEach(star => {
    const value = parseInt(star.dataset.star);
    star.addEventListener("mouseenter", () => {
      highlight(value);
      starLabel.textContent = labels[value];
    });
    star.addEventListener("mouseleave", () => {
      highlight(selected);
      starLabel.textContent = selected ? labels[selected] : "";
    });
    star.addEventListener("click", () => {
      selected = value;
      ratingInput.value = value;
      highlight(value);
      starLabel.textContent = labels[value];
    });
  });
}
