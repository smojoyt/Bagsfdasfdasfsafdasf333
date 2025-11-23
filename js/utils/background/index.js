export function injectBackgroundBlobs() {
  const blobHTML = `
    <div class="kk-background-blobs fixed inset-0 -z-10 overflow-hidden bg-cream pointer-events-none">
      
      <div class="absolute top-1/4 left-1/4 h-96 w-96
                  animate-blob-1 rounded-full bg-accent-pink
                  mix-blend-multiply opacity-70 blur-3xl
                  [animation-duration:_15s]">
      </div>
      
      <div class="absolute top-0 right-1/4 h-72 w-72
                  animate-blob-2 rounded-full bg-accent-tan
                  mix-blend-multiply opacity-60 blur-3xl
                  [animation-duration:_10s] [animation-delay:_-5s]">
      </div>

      <div class="absolute bottom-0 left-10 h-64 w-64
                  animate-blob-1 rounded-full bg-accent-gray
                  mix-blend-multiply opacity-100 blur-3xl
                  [animation-duration:_12s] [animation-delay:_-2s]">
      </div>

      <div class="absolute bottom-1/4 right-1/4 h-96 w-96
                  animate-blob-2 rounded-full bg-accent-tan
                  mix-blend-multiply opacity-50 blur-3xl
                  [animation-duration:_18s] [animation-delay:_-10s]">
      </div>

      <div class="absolute top-10 left-0 h-72 w-72
                  animate-blob-1 rounded-full bg-accent-pink
                  mix-blend-multiply opacity-70 blur-3xl
                  [animation-duration:_8s] [animation-delay:_-3s]">
      </div>

    </div>
  `;

  // Inject background if it isn't already there
  if (!document.querySelector('.kk-background-blobs')) {
    document.body.insertAdjacentHTML('afterbegin', blobHTML);
  }
}
