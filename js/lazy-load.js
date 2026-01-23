/**
 * Lazy Load - Image lazy loading with Intersection Observer
 * Also handles scroll-triggered animations for cards
 */

const LazyLoad = (function() {
  'use strict';

  let imageObserver = null;
  let cardObserver = null;

  // Default options for image lazy loading
  const imageOptions = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.01
  };

  // Default options for card animations
  const cardOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  // Handle image intersection
  function handleImageIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // Load the image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }

        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }

        // Add loaded class for fade-in effect
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });

        // Handle already-cached images
        if (img.complete) {
          img.classList.add('loaded');
        }

        // Stop observing this image
        observer.unobserve(img);
      }
    });
  }

  // Handle card intersection for animations
  function handleCardIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally stop observing after animation
        // observer.unobserve(entry.target);
      }
    });
  }

  // Initialize image lazy loading
  function initImageLazyLoad() {
    // Check for native lazy loading support
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
        img.classList.add('lazy-image');
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });
      });
      return;
    }

    // Fallback to Intersection Observer
    if ('IntersectionObserver' in window) {
      imageObserver = new IntersectionObserver(handleImageIntersection, imageOptions);

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        img.classList.add('lazy-image');
        imageObserver.observe(img);
      });
    } else {
      // Fallback for browsers without Intersection Observer
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // Initialize card animations
  function initCardAnimations() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show all cards
      document.querySelectorAll('.card, .bento-card').forEach(card => {
        card.classList.add('visible');
      });
      return;
    }

    cardObserver = new IntersectionObserver(handleCardIntersection, cardOptions);

    const cards = document.querySelectorAll('.card, .bento-card');
    cards.forEach(card => {
      cardObserver.observe(card);
    });
  }

  // Initialize reveal animations for sections
  function initRevealAnimations() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }

  // Auto-play videos when they enter viewport
  function initVideoAutoplay() {
    if (!('IntersectionObserver' in window)) return;

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay was prevented, which is fine
          });
        } else {
          video.pause();
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    });

    document.querySelectorAll('video[autoplay]').forEach(video => {
      video.muted = true; // Ensure muted for autoplay
      video.playsInline = true;
      videoObserver.observe(video);
    });
  }

  // Public API
  return {
    init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initImageLazyLoad();
          initCardAnimations();
          initRevealAnimations();
          initVideoAutoplay();
        });
      } else {
        initImageLazyLoad();
        initCardAnimations();
        initRevealAnimations();
        initVideoAutoplay();
      }
      return this;
    },

    // Manually observe a new image
    observeImage(img) {
      if (imageObserver && img.dataset.src) {
        img.classList.add('lazy-image');
        imageObserver.observe(img);
      }
    },

    // Manually observe a new card
    observeCard(card) {
      if (cardObserver) {
        cardObserver.observe(card);
      }
    },

    // Refresh observers (useful after dynamic content is added)
    refresh() {
      // Re-observe any new lazy images
      const newLazyImages = document.querySelectorAll('img[data-src]:not(.lazy-image)');
      newLazyImages.forEach(img => {
        img.classList.add('lazy-image');
        if (imageObserver) {
          imageObserver.observe(img);
        }
      });

      // Re-observe any new cards (including bento cards)
      const newCards = document.querySelectorAll('.card:not(.visible), .bento-card:not(.visible)');
      newCards.forEach(card => {
        if (cardObserver) {
          cardObserver.observe(card);
        }
      });
    },

    // Cleanup
    destroy() {
      if (imageObserver) {
        imageObserver.disconnect();
        imageObserver = null;
      }
      if (cardObserver) {
        cardObserver.disconnect();
        cardObserver = null;
      }
    }
  };
})();

// Auto-initialize
LazyLoad.init();

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoad;
}
