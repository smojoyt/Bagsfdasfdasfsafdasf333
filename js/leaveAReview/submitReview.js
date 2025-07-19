export function setupFormSubmit(storage) {
  const form = document.getElementById("reviewForm");
  const preview = document.getElementById("previewImage");
  const qualityButtons = document.querySelectorAll(".quality-btn");
  const stars = document.querySelectorAll('#starRating span');
  const status = document.getElementById("formStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const formData = new FormData(form);
    const file = formData.get("image");
    let imageUrl = "";

    if (file && file.size > 0) {
      const filename = `${Date.now()}_${file.name}`;
      const ref = storage.ref().child("reviewImages/" + filename);
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }

    const payload = {
      productId: formData.get("product"),
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      email: formData.get("email").trim(),
      rating: formData.get("rating"),
      quality: formData.get("quality"),
      reviewHeadline: formData.get("reviewHeadline"),
      reviewText: formData.get("reviewText"),
      imageUrl
    };

    const res = await fetch("https://hook.us2.make.com/wxlj4rrp6g3bqlkr3mxmfg6cq626j2qj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let result;
    try {
      result = await res.json();
    } catch {
      status.innerHTML = `We couldn't find a matching order or you’ve already submitted a review. <a href="/pages/contact" class="underline text-blue-600">Contact us</a>`;
      status.classList.replace("text-green-600", "text-red-600");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
      return;
    }

    if (result.success) {
      form.reset();
      preview.src = "";
      preview.classList.add("hidden");
      qualityButtons.forEach(b => b.classList.remove("selected"));
      stars.forEach(s => s.classList.remove("text-yellow-500"));
      document.getElementById("ratingInput").value = "";
      document.getElementById("starLabel").textContent = "";
      status.textContent = `Thank you! Your review was submitted. Coupon sent to ${payload.email}`;
      status.classList.replace("text-red-600", "text-green-600");
    } else {
      let msg = result.error || "Something went wrong.";
      if (msg.includes("already submitted")) {
        msg = "You’ve already submitted a review for this item.";
      }
      if (msg.includes("Order not found")) {
        msg = "We couldn't find a matching order.";
      }
      status.innerHTML = `${msg} <a href="/pages/contact" class="underline text-blue-600">Contact us</a>`;
      status.classList.replace("text-green-600", "text-red-600");
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Review";
  });
}
