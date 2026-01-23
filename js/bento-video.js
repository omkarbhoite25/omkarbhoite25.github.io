/**
 * Bento Video - Video handling for bento grid cards
 * Autoplay videos when they enter the viewport
 */

const BentoVideo = (function() {
  'use strict';

  let videoObserver = null;

  // Initialize video lazy loading and autoplay
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  function setup() {
    const videoContainers = document.querySelectorAll('.bento-media--video');

    if (!videoContainers.length) return;

    // Set up intersection observer for autoplay
    if ('IntersectionObserver' in window) {
      videoObserver = new IntersectionObserver(handleVideoIntersection, {
        root: null,
        rootMargin: '50px 0px',
        threshold: 0.3
      });

      videoContainers.forEach(container => {
        setupVideo(container);
        videoObserver.observe(container);
      });
    } else {
      // Fallback: load and play all videos
      videoContainers.forEach(container => {
        setupVideo(container);
        loadAndPlayVideo(container);
      });
    }
  }

  // Set up video element
  function setupVideo(container) {
    const video = container.querySelector('.bento-video');
    if (!video) return;

    // Ensure video attributes for autoplay
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // Handle video events
    video.addEventListener('loadstart', function() {
      container.classList.add('loading');
    });

    video.addEventListener('canplay', function() {
      container.classList.remove('loading');
    });

    video.addEventListener('playing', function() {
      container.classList.add('playing');
      container.classList.remove('loading');
    });

    video.addEventListener('error', function() {
      container.classList.remove('loading');
      console.warn('Video failed to load:', video.currentSrc);
    });
  }

  // Handle intersection - autoplay when visible
  function handleVideoIntersection(entries) {
    entries.forEach(entry => {
      const container = entry.target;
      const video = container.querySelector('.bento-video');
      if (!video) return;

      if (entry.isIntersecting) {
        loadAndPlayVideo(container);
      } else {
        // Pause when out of view to save resources
        video.pause();
        container.classList.remove('playing');
      }
    });
  }

  // Load video sources and play
  function loadAndPlayVideo(container) {
    const video = container.querySelector('.bento-video');
    if (!video) return;

    // Load sources if not already loaded
    const sources = video.querySelectorAll('source[data-src]');
    if (sources.length > 0) {
      sources.forEach(source => {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
      });
      video.load();
    }

    // Play the video
    video.play().catch(err => {
      // Autoplay was prevented, keep poster visible
      console.log('Autoplay prevented:', err.message);
    });
  }

  // Public API
  return {
    init: init,

    // Manually refresh (useful after dynamic content)
    refresh: function() {
      const newContainers = document.querySelectorAll('.bento-media--video:not([data-video-init])');
      newContainers.forEach(container => {
        container.setAttribute('data-video-init', 'true');
        setupVideo(container);
        if (videoObserver) {
          videoObserver.observe(container);
        } else {
          loadAndPlayVideo(container);
        }
      });
    },

    // Cleanup
    destroy: function() {
      if (videoObserver) {
        videoObserver.disconnect();
        videoObserver = null;
      }
    }
  };
})();

// Auto-initialize
BentoVideo.init();

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BentoVideo;
}
