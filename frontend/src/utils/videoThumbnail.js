/**
 * Generate a thumbnail image (data URL) from a video URL at a given timestamp.
 * Works cross-origin when the video server sends CORS headers and the video
 * element uses crossOrigin="anonymous" (your Worker is configured accordingly).
 *
 * @param {string} url - Public video URL
 * @param {number} [time=0.5] - Seconds into the video to capture
 * @param {number} [maxWidth=400] - Max width of the thumbnail (keeps aspect ratio)
 * @returns {Promise<string>} Resolves to a data URL (image/jpeg)
 */
export function generateVideoThumbnail(url, time = 0.5, maxWidth = 400) {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      // Ensure CORS is enabled for canvas capture
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      // Add a cache buster to avoid cached tainted responses in some browsers
      const cacheBuster = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
      video.src = url + cacheBuster;

      const cleanup = () => {
        video.pause();
        video.removeAttribute('src');
        try { video.load(); } catch (_) {}
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video for thumbnail'));
      };

      const seekAndCapture = () => {
        const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
        const target = Math.min(Math.max(time, 0.1), Math.max(duration - 0.1, 0.5));
        const onSeeked = () => {
          try {
            const vw = video.videoWidth || 400;
            const vh = video.videoHeight || 300;
            const scale = Math.min(1, maxWidth / vw);
            const width = Math.round(vw * scale);
            const height = Math.round(vh * scale);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            cleanup();
            resolve(dataUrl);
          } catch (err) {
            cleanup();
            reject(err);
          }
        };
        video.removeEventListener('seeked', onSeeked);
        video.addEventListener('seeked', onSeeked, { once: true });
        try {
          video.currentTime = target;
        } catch (e) {
          // If currentTime throws due to readyState, wait for loadeddata
          const onLoadedData = () => {
            video.removeEventListener('loadeddata', onLoadedData);
            try { video.currentTime = target; } catch (err) { onError(); }
          };
          video.addEventListener('loadeddata', onLoadedData, { once: true });
        }
      };

      if (video.readyState >= 1) {
        seekAndCapture();
      } else {
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          seekAndCapture();
        };
        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      }

      video.addEventListener('error', onError, { once: true });
    } catch (error) {
      reject(error);
    }
  });
}

