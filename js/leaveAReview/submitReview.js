export function setupFormSubmit(storage) {
  const form = document.getElementById("reviewForm");
  const preview = document.getElementById("previewImage");
  const qualityButtons = document.querySelectorAll(".quality-btn");
  const stars = document.querySelectorAll("#starRating span");
  const status = document.getElementById("formStatus");

  const showStatus = (msg, type = "error") => {
    status.innerHTML = msg;
    status.classList.remove("text-red-600", "text-green-600");
    status.classList.add(type === "success" ? "text-green-600" : "text-red-600");
    status.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const formData = new FormData(form);

    // --- Basic guards ---
    if (!formData.get("product")) {
      showStatus(`Please select a product.`, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
      return;
    }

    // Normalize orderSource to a canonical key
    const rawSource = (formData.get("orderSource") || "").trim();
    const sourceKey = /etsy/i.test(rawSource)
      ? "Etsy"
      : /^(kk|website)$/i.test(rawSource) || /karrykraze/i.test(rawSource)
      ? "KarryKraze"
      : rawSource || "Unknown";

    const rawOrderId = (formData.get("orderId") || "").trim();

    // --- Normalize & VALIDATE by source (NO TRUNCATION) ---
    let orderIdPlain = "";
    if (sourceKey === "Etsy") {
      // Etsy Receipt ID: digits only, exactly 10
      const cleaned = rawOrderId.replace(/\D/g, "");
      if (cleaned.length !== 10) {
        showStatus(`Etsy Receipt ID must be exactly 10 digits.`, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
        return;
      }
      orderIdPlain = cleaned;
    } else if (sourceKey === "KarryKraze") {
      // KK/KarryKraze Order ID: alphanumeric, exactly 8
      const cleaned = rawOrderId.replace(/[^A-Za-z0-9]/g, "");
      if (cleaned.length !== 8) {
        showStatus(`KarryKraze Order ID must be exactly 8 letters/numbers.`, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
        return;
      }
      orderIdPlain = cleaned;
    } else {
      // Fallback (if you add more sources later)
      const cleaned = rawOrderId.replace(/[^A-Za-z0-9]/g, "");
      if (!cleaned) {
        showStatus(`Please enter a valid Order ID.`, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
        return;
      }
      orderIdPlain = cleaned;
    }

    // --- Image upload with HEIC/HEIF conversion ---
    const file = formData.get("image");
    let imageUrl = "";
    if (file && file.size > 0) {
      try {
        let uploadBlob = file;
        let uploadType = file.type || "";
        let uploadName = file.name || `upload_${Date.now()}`;

        const looksHeic =
          /heic|heif/i.test(uploadType) || /\.hei[cf]$/i.test(uploadName);

        if (looksHeic) {
          const heic2anyFn = (window && (window.heic2any || window.heic2any?.default)) || null;
          if (!heic2anyFn) {
            showStatus(
              `It looks like you uploaded an HEIC photo, which browsers can’t display. Please convert it to JPG/PNG/WEBP and try again.`,
              "error"
            );
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
            return;
          }
          const converted = await heic2anyFn({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9
          });
          uploadBlob = converted instanceof Blob ? converted : new Blob([converted], { type: "image/jpeg" });
          uploadType = "image/jpeg";
          uploadName = uploadName.replace(/\.(heic|heif)$/i, ".jpg");
        }

        const filename = `${Date.now()}_${uploadName}`;
        const ref = storage.ref().child("reviewImages/" + filename);
        await ref.put(uploadBlob, { contentType: uploadType || "application/octet-stream" });
        imageUrl = await ref.getDownloadURL();
      } catch (err) {
        console.error("❌ Image upload/convert failed:", err);
        showStatus(`Image upload failed. Please try again or submit without an image.`, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
        return;
      }
    }

    // --- Payload (plain only) ---
    const payload = {
      productId: formData.get("product"),
      firstName: (formData.get("firstName") || "").trim(),
      lastName: (formData.get("lastName") || "").trim(),
      email: (formData.get("email") || "").trim(),
      phone: (formData.get("phone") || "").trim(),
      rating: formData.get("rating"),
      quality: formData.get("quality"),
      reviewHeadline: formData.get("reviewHeadline"),
      reviewText: formData.get("reviewText"),
      imageUrl,
      orderSource: sourceKey,   // normalized
      orderIdPlain              // full string; no truncation
    };

    // --- Send to Make webhook ---
    let result;
    try {
      const res = await fetch("https://hook.us2.make.com/wxlj4rrp6g3bqlkr3mxmfg6cq626j2qj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      result = JSON.parse(text);
    } catch (err) {
      console.error("❌ Webhook error or non-JSON response:", err);
      showStatus(
        `We couldn't validate your order at the moment. Please try again or <a href="/pages/contact.html" class="underline text-blue-600">contact us</a>.`,
        "error"
      );
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
      return;
    }

    // --- Handle response ---
    if (result?.success) {
      form.reset();
      if (preview) {
        preview.src = "";
        preview.classList.add("hidden");
      }
      qualityButtons.forEach((b) => b.classList.remove("selected"));
      stars.forEach((s) => s.classList.remove("text-yellow-500"));
      const ratingInput = document.getElementById("ratingInput");
      if (ratingInput) ratingInput.value = "";
      const starLabel = document.getElementById("starLabel");
      if (starLabel) starLabel.textContent = "";

      const coupon = result.code
        ? `Coupon: ${result.code} <br> ${result.expires ? `(expires ${result.expires})` : ""}`
        : "";
      showStatus(`Thank you! Your review was submitted.<br>${coupon}`, "success");
    } else {
      const errMsg = (result && result.error) ? String(result.error) : "Something went wrong.";
      let uiMsg = errMsg;

      if (errMsg === "Order not found. Please check your product, name, and email.") {
        uiMsg = "We couldn't find a matching order. Please confirm the product, your name, and email.";
      } else if (errMsg === "You've already submitted a review for this item.") {
        uiMsg = "You’ve already submitted a review for this item.";
      }

      showStatus(`${uiMsg} <a href="/pages/contact.html" class="underline text-blue-600">Contact us</a>`, "error");
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Review";
  });
}
