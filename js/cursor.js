/**
 * Space-Themed Custom Cursor
 * Cosmic dot with rotating Earth follower
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Skip on mobile screens
  if (window.innerWidth < 769) {
    return;
  }

  // Add class to body to hide default cursor
  document.body.classList.add('custom-cursor');

  // Create cursor elements
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);

  // Cursor position
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let prevMouseX = mouseX;
  let prevMouseY = mouseY;
  let ringX = mouseX;
  let ringY = mouseY;

  // Movement tracking for Earth rotation
  let isMoving = false;
  let moveTimeout = null;

  // Track mouse position
  document.addEventListener('mousemove', function(e) {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Calculate movement speed
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;
    const speed = Math.sqrt(dx * dx + dy * dy);

    // Start rotating Earth if moving
    if (speed > 1) {
      if (!isMoving) {
        isMoving = true;
        ring.classList.add('rotating');
      }

      // Clear previous timeout
      if (moveTimeout) clearTimeout(moveTimeout);

      // Stop rotating after mouse stops
      moveTimeout = setTimeout(function() {
        isMoving = false;
        ring.classList.remove('rotating');
      }, 150);
    }
  });

  // Hover effect on interactive elements
  const interactiveElements = 'a, button, input, textarea, select, [role="button"], .card, .gallery-item, .nav-link, .social-links a';

  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(interactiveElements)) {
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(interactiveElements)) {
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    }
  });

  // Click effect
  document.addEventListener('mousedown', function() {
    dot.classList.add('cursor-click');
    ring.classList.add('cursor-click');
  });

  document.addEventListener('mouseup', function() {
    dot.classList.remove('cursor-click');
    ring.classList.remove('cursor-click');
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', function() {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function() {
    dot.style.opacity = '1';
    ring.style.opacity = '0.9';
  });

  // Animation loop
  function animateCursor() {
    // Dot follows mouse exactly
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';

    // Ring (Earth) follows with delay
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';

    requestAnimationFrame(animateCursor);
  }

  animateCursor();
});
