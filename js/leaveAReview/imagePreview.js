export function setupImagePreview() {
  const input = document.getElementById("imageInput");
  const preview = document.getElementById("previewImage");

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    } else {
      preview.src = "";
      preview.classList.add("hidden");
    }
  });
}
