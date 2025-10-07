export function setupStarRating() {
  const stars = document.querySelectorAll('#starRating span');
  const ratingInput = document.getElementById('ratingInput');
  const starLabel = document.getElementById('starLabel');

  // Feel free to tweak labels
  const labels = {
    1: "Terrible",
    2: "Poor",
    3: "Okay",
    4: "Good",
    5: "Great"
  };

  let selected = Number(ratingInput?.value || 0);

  function highlight(value) {
    stars.forEach(star => {
      const val = parseInt(star.dataset.star, 10);
      star.classList.toggle('text-yellow-500', val <= value);
      star.classList.toggle('text-gray-300', val > value);
      star.classList.toggle('text-gray-400', false);
    });
  }

  // Initial paint (if user navigated back)
  if (selected) {
    highlight(selected);
    if (starLabel) starLabel.textContent = labels[selected] || "";
  } else {
    highlight(0);
    if (starLabel) starLabel.textContent = "";
  }

  stars.forEach(star => {
    const value = parseInt(star.dataset.star, 10);

    star.addEventListener("mouseenter", () => {
      highlight(value);
      if (starLabel) starLabel.textContent = labels[value];
    });

    star.addEventListener("mouseleave", () => {
      highlight(selected);
      if (starLabel) starLabel.textContent = selected ? labels[selected] : "";
    });

    star.addEventListener("click", () => {
      selected = value;
      if (ratingInput) ratingInput.value = String(value);
      highlight(value);
      if (starLabel) starLabel.textContent = labels[value];

      // Clear any temporary "invalid" decoration added by submit guard
      const wrap = document.getElementById("starRating");
      wrap?.classList.remove("ring-2","ring-red-500","rounded-md");
      wrap?.setAttribute("aria-label", `Rating: ${value} stars`);
    });
  });
}
