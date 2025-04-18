document.addEventListener('DOMContentLoaded', function () {
    if (window.themePhotoswipe && window.themePhotoswipe.PhotoSwipe) {
        const originalInitGallery = window.themePhotoswipe.initGallery;

        window.themePhotoswipe.initGallery = function (...args) {
            // Call the original method to initialize the gallery
            originalInitGallery.apply(this, args);

            // Override the PhotoSwipe prototype to modify zoom behavior
            const pswpConstructor = window.themePhotoswipe.PhotoSwipe.default;

            const originalInit = pswpConstructor.prototype.init;
            pswpConstructor.prototype.init = function () {
                this.options.zoomEl = false;
                this.options.getDoubleTapZoom = function () { return 1; };
                this.options.maxSpreadZoom = 1;
                this.options.pinchToClose = false;

                originalInit.apply(this, arguments);
            };
        };
    }
});

document.addEventListener('DOMContentLoaded', function () {
    if (window.themePhotoswipe && window.themePhotoswipe.PhotoSwipe) {
        const originalInitGallery = window.themePhotoswipe.initGallery;

        window.themePhotoswipe.initGallery = function (...args) {
            originalInitGallery.apply(this, args);

            const pswpConstructor = window.themePhotoswipe.PhotoSwipe.default;

            const originalInit = pswpConstructor.prototype.init;
            pswpConstructor.prototype.init = function () {
                // Inject custom options here
                this.options.zoomEl = false;
                this.options.getDoubleTapZoom = () => 1;
                this.options.maxSpreadZoom = 1;
                this.options.pinchToClose = false;

                // ✅ Preload 4 slides before and after the current image
                this.options.preload = [4, 4];

                originalInit.apply(this, arguments);
            };
        };
    }
});



    document.addEventListener("DOMContentLoaded", function () {
    const carousel = document.querySelector(".carousel");

    if (carousel) {
      // Get all the product slides
      const cells = Array.from(carousel.querySelectorAll(".carousel-cell"));

      // Shuffle function (Fisher-Yates)
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
      }

      // Remove old items
      cells.forEach(cell => carousel.removeChild(cell));

      // Append shuffled items back in
      cells.forEach(cell => carousel.appendChild(cell));
    }
  });

