/**
 * Light Theme Canvas - Dual Solar System Animation
 * Two solar systems with shooting stars
 */

const LightCanvas = (function() {
  'use strict';

  // Private state
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let isRunning = false;
  let isDarkMode = false;
  let DPR = 1;
  let W = 1;
  let H = 1;

  // Time tracking
  let lastTime = 0;
  let time = 0;

  // Universe enhancement state variables
  let galaxies = [];
  let dustLanes = [];
  let deepSkyObjects = [];
  let satellites = [];
  let meteorShower = { active: false, radiantX: 0, radiantY: 0, intensity: 0, duration: 0, elapsed: 0 };
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  let milkyWayStars = [];

  // Solar system configurations
  const config = {
    solarSystem1: {
      x: 0.18, // 18% from left (top-left)
      y: 0.28, // 28% from top
      sun: {
        baseRadius: 45,
        color: '#fcd34d',
        glowColor: 'rgba(251, 191, 36, 0.25)',
        glowRadius: 120
      },
      planets: [
        { name: 'Mercury', radius: 3, orbitRadius: 0.10, speed: 0.7, color: '#a1a1aa', opacity: 0.60, eccentricity: 0.2 },
        { name: 'Venus', radius: 5, orbitRadius: 0.16, speed: 0.5, color: '#fbbf24', opacity: 0.55, eccentricity: 0.15 },
        { name: 'Earth', radius: 6, orbitRadius: 0.24, speed: 0.35, color: '#3b82f6', opacity: 0.65, eccentricity: 0.25, moons: [
          { radius: 1.5, orbitRadius: 12, speed: 2, color: '#d1d5db' }  // Luna
        ]},
        { name: 'Mars', radius: 4, orbitRadius: 0.32, speed: 0.25, color: '#ef4444', opacity: 0.60, eccentricity: 0.3 },
        { name: 'Jupiter', radius: 12, orbitRadius: 0.45, speed: 0.12, color: '#f97316', opacity: 0.55, eccentricity: 0.2, moons: [
          { radius: 1.2, orbitRadius: 18, speed: 2.5, color: '#fcd34d' },  // Io
          { radius: 1.5, orbitRadius: 24, speed: 1.8, color: '#a3a3a3' },  // Europa
          { radius: 1, orbitRadius: 30, speed: 1.2, color: '#78716c' }     // Ganymede
        ]},
        { name: 'Saturn', radius: 10, orbitRadius: 0.60, speed: 0.08, color: '#eab308', opacity: 0.50, hasRing: true, eccentricity: 0.35, moons: [
          { radius: 2, orbitRadius: 22, speed: 1.5, color: '#fbbf24' }     // Titan
        ]}
      ],
      asteroidBelt: {
        innerRadius: 0.33,
        outerRadius: 0.44,
        count: 2500,
        minSize: 0.3,
        maxSize: 2.5,
        color: '#64748b',
        colorDark: '#e2e8f0',
        opacity: 0.6,
        speed: 0.05,
        eccentricity: 0.25
      },
      orbitOpacity: 0.14
    },
    solarSystem2: {
      x: 0.82, // 82% from left (bottom-right)
      y: 0.75, // 75% from top
      sun: {
        baseRadius: 40,
        color: '#a78bfa',
        glowColor: 'rgba(167, 139, 250, 0.2)',
        glowRadius: 100
      },
      planets: [
        { name: 'Nebula-1', radius: 3, orbitRadius: 0.08, speed: 0.8, color: '#c4b5fd', opacity: 0.60, eccentricity: 0.4 },
        { name: 'Nebula-2', radius: 4, orbitRadius: 0.14, speed: 0.6, color: '#ddd6fe', opacity: 0.55, eccentricity: 0.5, hasRing: true },
        { name: 'Nebula-3', radius: 5, orbitRadius: 0.22, speed: 0.45, color: '#f0abfc', opacity: 0.60, eccentricity: 0.55 },
        { name: 'Nebula-4', radius: 4, orbitRadius: 0.30, speed: 0.3, color: '#a5b4fc', opacity: 0.55, eccentricity: 0.45, hasRing: true, moons: [
          { radius: 1, orbitRadius: 10, speed: 2, color: '#c4b5fd' }
        ]},
        { name: 'Nebula-5', radius: 8, orbitRadius: 0.40, speed: 0.18, color: '#c7d2fe', opacity: 0.50, eccentricity: 0.5, hasRing: true, moons: [
          { radius: 1.5, orbitRadius: 16, speed: 2.2, color: '#f0abfc' },
          { radius: 1, orbitRadius: 22, speed: 1.6, color: '#a5b4fc' }
        ]}
      ],
      asteroidBelt: {
        innerRadius: 0.25,
        outerRadius: 0.48,
        count: 3500,
        minSize: 0.2,
        maxSize: 2.0,
        color: '#8b5cf6',
        colorDark: '#ddd6fe',
        opacity: 0.5,
        speed: 0.08,
        eccentricity: 0.5
      },
      orbitOpacity: 0.12
    },
    shootingStars: {
      maxActive: 5,
      spawnChance: 0.008,
      minSpeed: 350,
      maxSpeed: 700,
      minSize: 2,
      maxSize: 4,
      minLifetime: 1.0,
      maxLifetime: 2.0,
      tailSegments: 15
    },
    spaceship: {
      speed: 0.03,           // Journey progress per second (slightly slower)
      size: 24,              // Base size of spaceship
      engineGlow: 25,        // Engine glow radius (reduced)
      trailLength: 40,       // Number of trail segments
      trailFade: 0.92,       // Trail fade factor
      colors: {
        // Light mode colors
        hull: '#1e293b',
        hullMid: '#334155',
        hullLight: '#475569',
        hullAccent: '#0ea5e9',
        // Dark mode colors
        hullDark: '#cbd5e1',
        hullMidDark: '#94a3b8',
        hullLightDark: '#e2e8f0',
        hullAccentDark: '#38bdf8',
        // Engine colors
        engine: '#06b6d4',
        engineCore: '#ffffff',
        engineGlow: 'rgba(6, 182, 212, 0.6)',
        engineGlowDark: 'rgba(34, 211, 238, 0.8)',
        // Trail colors
        trail: 'rgba(6, 182, 212, 0.4)',
        trailDark: 'rgba(34, 211, 238, 0.6)',
        // Cockpit
        cockpit: '#22d3ee',
        cockpitDark: '#67e8f9',
        // Shield
        shield: 'rgba(56, 189, 248, 0.15)',
        shieldDark: 'rgba(125, 211, 252, 0.25)',
        shieldEdge: 'rgba(14, 165, 233, 0.4)',
        shieldEdgeDark: 'rgba(56, 189, 248, 0.6)'
      }
    },
    backgroundColor: '#f8fafc'
  };

  // Planet states for both systems
  let planets1 = [];
  let planets2 = [];

  // Asteroid belt states
  let asteroids1 = [];
  let asteroids2 = [];

  // Shooting stars pool
  let shootingStars = [];

  // Spaceship state
  let spaceship = {
    progress: 0,          // 0 to 1 (journey progress)
    direction: 1,         // 1 = going to system 2, -1 = returning
    x: 0,
    y: 0,
    angle: 0,
    trail: [],
    engineParticles: [],
    launched: false,      // Only fly when launched
    launchAnimation: 0,   // Launch sequence animation
    shieldPulse: 0        // Shield animation
  };

  // Initialize planet positions for a solar system
  function initPlanetsForSystem(systemConfig) {
    return systemConfig.planets.map((p, i) => ({
      ...p,
      angle: (Math.PI * 2 * i) / systemConfig.planets.length + Math.random() * 0.5,
      moons: p.moons ? p.moons.map(m => ({
        ...m,
        angle: Math.random() * Math.PI * 2
      })) : []
    }));
  }

  // Initialize all planets
  function initPlanets() {
    planets1 = initPlanetsForSystem(config.solarSystem1);
    planets2 = initPlanetsForSystem(config.solarSystem2);
  }

  // Initialize asteroid belt for a solar system
  function initAsteroidsForSystem(beltConfig) {
    const asteroids = [];
    for (let i = 0; i < beltConfig.count; i++) {
      const radiusRange = beltConfig.outerRadius - beltConfig.innerRadius;
      const orbitRadius = beltConfig.innerRadius + Math.random() * radiusRange;
      asteroids.push({
        angle: Math.random() * Math.PI * 2,
        orbitRadius: orbitRadius,
        size: beltConfig.minSize + Math.random() * (beltConfig.maxSize - beltConfig.minSize),
        speed: beltConfig.speed * (0.7 + Math.random() * 0.6),
        opacity: beltConfig.opacity * (0.5 + Math.random() * 0.5),
        eccentricity: beltConfig.eccentricity || 0
      });
    }
    return asteroids;
  }

  // Initialize all asteroids
  function initAsteroids() {
    asteroids1 = initAsteroidsForSystem(config.solarSystem1.asteroidBelt);
    asteroids2 = initAsteroidsForSystem(config.solarSystem2.asteroidBelt);
  }

  // Draw asteroid belt
  function drawAsteroidBelt(systemConfig, asteroids, dt) {
    const sunX = systemConfig.x * W;
    const sunY = systemConfig.y * H;
    const scale = Math.min(W, H);
    const beltConfig = systemConfig.asteroidBelt;
    const color = isDarkMode ? (beltConfig.colorDark || beltConfig.color) : beltConfig.color;

    for (const asteroid of asteroids) {
      // Update angle
      asteroid.angle += asteroid.speed * dt * 0.1;

      // Calculate position (with optional eccentricity)
      const a = asteroid.orbitRadius * scale;
      const e = asteroid.eccentricity || 0;
      const b = a * Math.sqrt(1 - e * e);

      const x = sunX + Math.cos(asteroid.angle) * a;
      const y = sunY + Math.sin(asteroid.angle) * b;

      // Draw asteroid
      if (isDarkMode) {
        // Glowing asteroids in dark mode
        ctx.globalAlpha = asteroid.opacity * 0.4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, asteroid.size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = asteroid.opacity * 1.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, asteroid.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = asteroid.opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, asteroid.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Initialize shooting stars pool
  function initShootingStars() {
    shootingStars = [];
    for (let i = 0; i < config.shootingStars.maxActive; i++) {
      shootingStars.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        lifetime: 0,
        maxLifetime: 1,
        trail: [],
        color: '#ffffff'
      });
    }
  }

  // Initialize spaceship
  function initSpaceship() {
    const wasLaunched = spaceship.launched || false;
    spaceship = {
      progress: 0,
      direction: 1,
      x: config.solarSystem1.x * W,
      y: config.solarSystem1.y * H,
      angle: 0,
      trail: [],
      engineParticles: [],
      launched: wasLaunched,
      launchAnimation: wasLaunched ? 1 : 0,
      shieldPulse: 0
    };
    // Pre-fill trail
    for (let i = 0; i < config.spaceship.trailLength; i++) {
      spaceship.trail.push({ x: spaceship.x, y: spaceship.y, alpha: 0 });
    }
  }

  // Get spaceship position along curved path between systems
  function getSpaceshipPosition(progress) {
    const sys1X = config.solarSystem1.x * W;
    const sys1Y = config.solarSystem1.y * H;
    const sys2X = config.solarSystem2.x * W;
    const sys2Y = config.solarSystem2.y * H;

    // Control points for bezier curve (creates a nice arc)
    const cp1X = sys1X + (sys2X - sys1X) * 0.25 + W * 0.15;
    const cp1Y = sys1Y + (sys2Y - sys1Y) * 0.25 - H * 0.2;
    const cp2X = sys1X + (sys2X - sys1X) * 0.75 - W * 0.1;
    const cp2Y = sys1Y + (sys2Y - sys1Y) * 0.75 + H * 0.15;

    // Cubic bezier calculation
    const t = progress;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * sys1X + 3 * mt2 * t * cp1X + 3 * mt * t2 * cp2X + t3 * sys2X;
    const y = mt3 * sys1Y + 3 * mt2 * t * cp1Y + 3 * mt * t2 * cp2Y + t3 * sys2Y;

    return { x, y };
  }

  // Get angle of travel (derivative of bezier)
  function getSpaceshipAngle(progress) {
    const sys1X = config.solarSystem1.x * W;
    const sys1Y = config.solarSystem1.y * H;
    const sys2X = config.solarSystem2.x * W;
    const sys2Y = config.solarSystem2.y * H;

    const cp1X = sys1X + (sys2X - sys1X) * 0.25 + W * 0.15;
    const cp1Y = sys1Y + (sys2Y - sys1Y) * 0.25 - H * 0.2;
    const cp2X = sys1X + (sys2X - sys1X) * 0.75 - W * 0.1;
    const cp2Y = sys1Y + (sys2Y - sys1Y) * 0.75 + H * 0.15;

    const t = progress;
    const mt = 1 - t;

    // Derivative of cubic bezier
    const dx = 3 * mt * mt * (cp1X - sys1X) + 6 * mt * t * (cp2X - cp1X) + 3 * t * t * (sys2X - cp2X);
    const dy = 3 * mt * mt * (cp1Y - sys1Y) + 6 * mt * t * (cp2Y - cp1Y) + 3 * t * t * (sys2Y - cp2Y);

    return Math.atan2(dy, dx);
  }

  // Update and draw spaceship
  function updateAndDrawSpaceship(dt) {
    // Only update if launched
    if (!spaceship.launched) return;

    const cfg = config.spaceship;

    // Launch animation (scale up from 0)
    if (spaceship.launchAnimation < 1) {
      spaceship.launchAnimation += dt * 2; // 0.5 second launch
      if (spaceship.launchAnimation > 1) spaceship.launchAnimation = 1;
    }

    // Update shield pulse
    spaceship.shieldPulse += dt * 3;

    // Update progress
    spaceship.progress += cfg.speed * dt * spaceship.direction;

    // Reverse direction at endpoints with a small pause effect
    if (spaceship.progress >= 1) {
      spaceship.progress = 1;
      spaceship.direction = -1;
    } else if (spaceship.progress <= 0) {
      spaceship.progress = 0;
      spaceship.direction = 1;
    }

    // Get current position and angle
    const pos = getSpaceshipPosition(spaceship.progress);
    let angle = getSpaceshipAngle(spaceship.progress);
    if (spaceship.direction === -1) {
      angle += Math.PI; // Face opposite direction when returning
    }

    spaceship.x = pos.x;
    spaceship.y = pos.y;
    spaceship.angle = angle;

    // Update trail
    spaceship.trail.pop();
    spaceship.trail.unshift({ x: pos.x, y: pos.y, alpha: 1 });

    // Update engine particles
    spawnEngineParticles();
    updateEngineParticles(dt);

    // Draw trail
    drawSpaceshipTrail();

    // Draw engine particles
    drawEngineParticles();

    // Draw the spaceship
    drawSpaceship();
  }

  // Spawn engine particles
  function spawnEngineParticles() {
    if (!spaceship.launched) return;

    const cfg = config.spaceship;
    const angle = spaceship.angle;
    const size = cfg.size * spaceship.launchAnimation;

    // Warp nacelle engines (2 side pods)
    for (let e = -1; e <= 1; e += 2) {
      const engineOffset = e * size * 0.55;
      const engineX = spaceship.x - Math.cos(angle) * size * 0.95 + Math.sin(angle) * engineOffset;
      const engineY = spaceship.y - Math.sin(angle) * size * 0.95 - Math.cos(angle) * engineOffset;

      // Cyan particles from warp nacelles
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        const speed = 120 + Math.random() * 80;
        spaceship.engineParticles.push({
          x: engineX + (Math.random() - 0.5) * size * 0.1,
          y: engineY + (Math.random() - 0.5) * size * 0.1,
          vx: -Math.cos(angle + spread) * speed,
          vy: -Math.sin(angle + spread) * speed,
          size: 2 + Math.random() * 4,
          life: 1,
          decay: 1.2 + Math.random() * 0.8,
          color: 'cyan'
        });
      }
    }

    // Central impulse engine (purple particles)
    const centralX = spaceship.x - Math.cos(angle) * size * 0.72;
    const centralY = spaceship.y - Math.sin(angle) * size * 0.72;
    for (let i = 0; i < 2; i++) {
      const spread = (Math.random() - 0.5) * 0.3;
      const speed = 100 + Math.random() * 60;
      spaceship.engineParticles.push({
        x: centralX,
        y: centralY,
        vx: -Math.cos(angle + spread) * speed,
        vy: -Math.sin(angle + spread) * speed,
        size: 1.5 + Math.random() * 2.5,
        life: 1,
        decay: 1.5 + Math.random() * 1,
        color: 'purple'
      });
    }

    // Limit particles
    if (spaceship.engineParticles.length > 250) {
      spaceship.engineParticles = spaceship.engineParticles.slice(-250);
    }
  }

  // Update engine particles
  function updateEngineParticles(dt) {
    for (let i = spaceship.engineParticles.length - 1; i >= 0; i--) {
      const p = spaceship.engineParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      p.size *= 0.98;

      if (p.life <= 0 || p.size < 0.5) {
        spaceship.engineParticles.splice(i, 1);
      }
    }
  }

  // Draw engine particles
  function drawEngineParticles() {
    for (const p of spaceship.engineParticles) {
      const alpha = p.life * 0.8;

      let glowColor, coreColor;
      if (p.color === 'purple') {
        glowColor = isDarkMode ? 'rgba(192, 132, 252, 0.6)' : 'rgba(139, 92, 246, 0.5)';
        coreColor = isDarkMode ? '#e9d5ff' : '#a78bfa';
      } else {
        glowColor = isDarkMode ? 'rgba(34, 211, 238, 0.6)' : 'rgba(6, 182, 212, 0.5)';
        coreColor = isDarkMode ? '#67e8f9' : '#22d3ee';
      }

      // Outer glow
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright center
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Draw spaceship trail
  function drawSpaceshipTrail() {
    const cfg = config.spaceship;
    const colors = cfg.colors;

    for (let i = 1; i < spaceship.trail.length; i++) {
      const t = spaceship.trail[i];
      const prev = spaceship.trail[i - 1];
      const alpha = Math.pow(cfg.trailFade, i) * 0.6;
      const width = (cfg.trailLength - i) / cfg.trailLength * cfg.size * 0.5;

      if (alpha < 0.02 || width < 0.5) continue;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = isDarkMode ? colors.trailDark : colors.trail;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Draw the spaceship itself - Advanced Starship Design
  function drawSpaceship() {
    const cfg = config.spaceship;
    const colors = cfg.colors;
    const x = spaceship.x;
    const y = spaceship.y;
    const angle = spaceship.angle;
    const baseSize = cfg.size * spaceship.launchAnimation; // Scale with launch animation
    const size = baseSize;

    if (size < 1) return; // Don't draw if too small

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const hullColor = isDarkMode ? colors.hullDark : colors.hull;
    const hullMid = isDarkMode ? colors.hullMidDark : colors.hullMid;
    const hullLight = isDarkMode ? colors.hullLightDark : colors.hullLight;
    const accentColor = isDarkMode ? colors.hullAccentDark : colors.hullAccent;

    // === SHIELD EFFECT (outer glow) ===
    const shieldPulse = 0.8 + Math.sin(spaceship.shieldPulse) * 0.2;
    const shieldGrad = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size * 1.8 * shieldPulse);
    shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    shieldGrad.addColorStop(0.7, isDarkMode ? colors.shieldDark : colors.shield);
    shieldGrad.addColorStop(0.9, isDarkMode ? colors.shieldEdgeDark : colors.shieldEdge);
    shieldGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.8 * shieldPulse, size * 1.2 * shieldPulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // === ENGINE GLOW (behind ship) ===
    for (let i = -1; i <= 1; i += 2) {
      const engineY = i * size * 0.55;
      const engineGlow = ctx.createRadialGradient(-size * 0.9, engineY, 0, -size * 0.9, engineY, cfg.engineGlow * 1.2);
      engineGlow.addColorStop(0, isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)');
      engineGlow.addColorStop(0.2, isDarkMode ? 'rgba(34, 211, 238, 0.9)' : 'rgba(6, 182, 212, 0.8)');
      engineGlow.addColorStop(0.5, isDarkMode ? 'rgba(34, 211, 238, 0.4)' : 'rgba(6, 182, 212, 0.3)');
      engineGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = engineGlow;
      ctx.beginPath();
      ctx.arc(-size * 0.9, engineY, cfg.engineGlow * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central engine glow
    const centralGlow = ctx.createRadialGradient(-size * 0.7, 0, 0, -size * 0.7, 0, cfg.engineGlow);
    centralGlow.addColorStop(0, isDarkMode ? 'rgba(167, 139, 250, 0.9)' : 'rgba(139, 92, 246, 0.7)');
    centralGlow.addColorStop(0.5, isDarkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.2)');
    centralGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = centralGlow;
    ctx.beginPath();
    ctx.arc(-size * 0.7, 0, cfg.engineGlow, 0, Math.PI * 2);
    ctx.fill();

    // === WARP NACELLES (side engine pods) ===
    for (let i = -1; i <= 1; i += 2) {
      const ny = i * size * 0.55;

      // Nacelle pylon (connecting strut)
      ctx.fillStyle = hullMid;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, i * size * 0.2);
      ctx.lineTo(-size * 0.3, ny * 0.7);
      ctx.lineTo(-size * 0.7, ny);
      ctx.lineTo(-size * 0.3, ny * 0.85);
      ctx.lineTo(-size * 0.1, i * size * 0.25);
      ctx.closePath();
      ctx.fill();

      // Nacelle body (elongated pod)
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(size * 0.1, ny);
      ctx.quadraticCurveTo(size * 0.2, ny - i * size * 0.12, -size * 0.2, ny - i * size * 0.15);
      ctx.lineTo(-size * 1.0, ny - i * size * 0.1);
      ctx.quadraticCurveTo(-size * 1.1, ny, -size * 1.0, ny + i * size * 0.1);
      ctx.lineTo(-size * 0.2, ny + i * size * 0.15);
      ctx.quadraticCurveTo(size * 0.2, ny + i * size * 0.12, size * 0.1, ny);
      ctx.closePath();
      ctx.fill();

      // Nacelle highlight strip
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(size * 0.05, ny);
      ctx.lineTo(-size * 0.9, ny - i * size * 0.02);
      ctx.lineTo(-size * 0.9, ny + i * size * 0.02);
      ctx.lineTo(size * 0.05, ny);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Bussard collector (front glowing part)
      const bussardGrad = ctx.createRadialGradient(size * 0.05, ny, 0, size * 0.05, ny, size * 0.12);
      bussardGrad.addColorStop(0, isDarkMode ? '#fca5a5' : '#ef4444');
      bussardGrad.addColorStop(0.5, isDarkMode ? 'rgba(252, 165, 165, 0.5)' : 'rgba(239, 68, 68, 0.4)');
      bussardGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = bussardGrad;
      ctx.beginPath();
      ctx.arc(size * 0.05, ny, size * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Engine exhaust port
      ctx.fillStyle = isDarkMode ? colors.engineGlowDark : colors.engineGlow;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.ellipse(-size * 0.95, ny, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-size * 0.95, ny, size * 0.04, size * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // === MAIN SAUCER SECTION ===
    // Saucer base
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.ellipse(size * 0.3, 0, size * 0.7, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Saucer upper dome
    ctx.fillStyle = hullMid;
    ctx.beginPath();
    ctx.ellipse(size * 0.3, 0, size * 0.5, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Saucer rim highlight
    ctx.strokeStyle = hullLight;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(size * 0.3, 0, size * 0.65, size * 0.32, 0, -Math.PI * 0.8, Math.PI * 0.3);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // === SECONDARY HULL (Engineering section) ===
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.15);
    ctx.lineTo(-size * 0.2, size * 0.2);
    ctx.lineTo(-size * 0.6, size * 0.18);
    ctx.lineTo(-size * 0.75, size * 0.1);
    ctx.lineTo(-size * 0.75, -size * 0.1);
    ctx.lineTo(-size * 0.6, -size * 0.18);
    ctx.lineTo(-size * 0.2, -size * 0.2);
    ctx.lineTo(size * 0.1, -size * 0.15);
    ctx.closePath();
    ctx.fill();

    // Engineering hull detail lines
    ctx.strokeStyle = hullLight;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const lx = -size * 0.25 - i * size * 0.15;
      ctx.beginPath();
      ctx.moveTo(lx, -size * 0.18);
      ctx.lineTo(lx, size * 0.18);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Deflector dish (glowing)
    const deflectorGrad = ctx.createRadialGradient(-size * 0.6, 0, 0, -size * 0.6, 0, size * 0.15);
    deflectorGrad.addColorStop(0, isDarkMode ? '#67e8f9' : '#06b6d4');
    deflectorGrad.addColorStop(0.4, isDarkMode ? 'rgba(103, 232, 249, 0.6)' : 'rgba(6, 182, 212, 0.5)');
    deflectorGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = deflectorGrad;
    ctx.beginPath();
    ctx.arc(-size * 0.6, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Central impulse engine
    ctx.fillStyle = isDarkMode ? 'rgba(167, 139, 250, 0.9)' : 'rgba(139, 92, 246, 0.8)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.72, 0, size * 0.06, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(-size * 0.72, 0, size * 0.03, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // === BRIDGE MODULE (top center) ===
    ctx.fillStyle = hullMid;
    ctx.beginPath();
    ctx.ellipse(size * 0.35, 0, size * 0.18, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bridge windows (glowing)
    const bridgeGlow = ctx.createRadialGradient(size * 0.35, 0, 0, size * 0.35, 0, size * 0.12);
    bridgeGlow.addColorStop(0, isDarkMode ? colors.cockpitDark : colors.cockpit);
    bridgeGlow.addColorStop(0.5, isDarkMode ? 'rgba(103, 232, 249, 0.5)' : 'rgba(34, 211, 238, 0.4)');
    bridgeGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = bridgeGlow;
    ctx.beginPath();
    ctx.ellipse(size * 0.35, 0, size * 0.12, size * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bridge window core
    ctx.fillStyle = isDarkMode ? '#ffffff' : colors.cockpit;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.ellipse(size * 0.35, 0, size * 0.06, size * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // === RUNNING LIGHTS ===
    const lightPulse = 0.5 + Math.sin(time * 5) * 0.5;

    // Port light (red)
    ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + lightPulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(size * 0.3, -size * 0.35, size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Starboard light (green)
    ctx.fillStyle = `rgba(34, 197, 94, ${0.6 + lightPulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(size * 0.3, size * 0.35, size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Forward light (white strobe)
    const strobePulse = Math.sin(time * 8) > 0.7 ? 1 : 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${strobePulse})`;
    ctx.beginPath();
    ctx.arc(size * 0.95, 0, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // === WARP FIELD EFFECT (when at high speed) ===
    if (isDarkMode) {
      ctx.globalAlpha = 0.15;
      const warpGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
      warpGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
      warpGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
      warpGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = warpGrad;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Spawn a shooting star (optionally from meteor shower radiant)
  function spawnShootingStar(fromShower = false) {
    // Find an inactive star
    const star = shootingStars.find(s => !s.active);
    if (!star) return;

    const ss = config.shootingStars;
    let startX, startY, angle;

    if (fromShower && meteorShower.active) {
      // Spawn from meteor shower radiant point
      startX = meteorShower.radiantX + (Math.random() - 0.5) * 50;
      startY = meteorShower.radiantY + (Math.random() - 0.5) * 50;
      // Radiate outward from radiant point
      const targetX = startX + (Math.random() - 0.5) * W;
      const targetY = startY + Math.random() * H * 0.8;
      angle = Math.atan2(targetY - startY, targetX - startX);
    } else {
      // Spawn from edges (favor top and sides)
      const edge = Math.random();

      if (edge < 0.4) {
        // Top edge
        startX = Math.random() * W;
        startY = -10;
        angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // 45-135 degrees down
      } else if (edge < 0.7) {
        // Left edge
        startX = -10;
        startY = Math.random() * H * 0.6;
        angle = -Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // -45 to 45 degrees right
      } else {
        // Right edge
        startX = W + 10;
        startY = Math.random() * H * 0.6;
        angle = Math.PI * 0.75 + Math.random() * Math.PI * 0.5; // 135-225 degrees left
      }
    }

    const speed = ss.minSpeed + Math.random() * (ss.maxSpeed - ss.minSpeed);

    // Color selection based on mode
    let color;
    if (isDarkMode) {
      // Bright colors for dark mode
      const colorRoll = Math.random();
      if (colorRoll < 0.5) {
        color = 'rgba(255, 255, 255, 0.95)'; // white
      } else if (colorRoll < 0.75) {
        color = 'rgba(200, 220, 255, 0.9)'; // blue-white
      } else {
        color = 'rgba(255, 220, 180, 0.9)'; // warm white
      }
    } else {
      // Darker colors for light background visibility
      const colorRoll = Math.random();
      if (colorRoll < 0.4) {
        color = 'rgba(100, 116, 139, 0.9)'; // slate gray
      } else if (colorRoll < 0.7) {
        color = 'rgba(71, 85, 105, 0.85)'; // darker slate
      } else {
        color = 'rgba(148, 163, 184, 0.9)'; // lighter slate
      }
    }

    star.active = true;
    star.x = startX;
    star.y = startY;
    star.vx = Math.cos(angle) * speed;
    star.vy = Math.sin(angle) * speed;
    star.size = ss.minSize + Math.random() * (ss.maxSize - ss.minSize);
    star.lifetime = 0;
    star.maxLifetime = ss.minLifetime + Math.random() * (ss.maxLifetime - ss.minLifetime);
    star.trail = [];
    star.color = color;
    star.isShowerMeteor = fromShower;

    // Pre-fill trail
    for (let i = 0; i < ss.tailSegments; i++) {
      star.trail.push({ x: startX, y: startY });
    }
  }

  // Trigger a meteor shower event
  function triggerMeteorShower() {
    if (meteorShower.active) return;

    meteorShower.active = true;
    meteorShower.radiantX = Math.random() * W * 0.6 + W * 0.2;
    meteorShower.radiantY = Math.random() * H * 0.3;
    meteorShower.intensity = 3 + Math.floor(Math.random() * 4); // 3-6 meteors
    meteorShower.duration = 2 + Math.random() * 3; // 2-5 seconds
    meteorShower.elapsed = 0;
  }

  // Update and draw shooting stars
  function updateAndDrawShootingStars(dt) {
    const ss = config.shootingStars;

    // Regular spawn chance
    if (Math.random() < ss.spawnChance) {
      spawnShootingStar(false);
    }

    // Meteor shower handling (dark mode only)
    if (isDarkMode) {
      // 0.5% chance per second to trigger shower
      if (!meteorShower.active && Math.random() < dt * 0.005) {
        triggerMeteorShower();
      }

      // Process active meteor shower
      if (meteorShower.active) {
        meteorShower.elapsed += dt;

        // Spawn shower meteors
        const spawnRate = meteorShower.intensity / meteorShower.duration;
        if (Math.random() < spawnRate * dt) {
          spawnShootingStar(true);
        }

        // End shower when duration expires
        if (meteorShower.elapsed >= meteorShower.duration) {
          meteorShower.active = false;
        }
      }
    }

    for (const star of shootingStars) {
      if (!star.active) continue;

      // Update position
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.lifetime += dt;

      // Update trail
      star.trail.pop();
      star.trail.unshift({ x: star.x, y: star.y });

      // Check if expired or off screen
      if (star.lifetime >= star.maxLifetime ||
          star.x < -50 || star.x > W + 50 ||
          star.y < -50 || star.y > H + 50) {
        star.active = false;
        continue;
      }

      // Calculate fade based on lifetime
      const lifeProgress = star.lifetime / star.maxLifetime;
      const fadeIn = Math.min(1, star.lifetime / 0.1);
      const fadeOut = 1 - Math.pow(lifeProgress, 2);
      const baseFade = fadeIn * fadeOut;

      if (isDarkMode) {
        // Bright shooting stars for dark mode
        // Draw trail with glow
        for (let i = 0; i < star.trail.length; i++) {
          const t = star.trail[i];
          const segmentFade = 1 - (i / star.trail.length);
          const alpha = baseFade * segmentFade;
          const size = star.size * segmentFade;

          if (alpha > 0.01 && size > 0.1) {
            // Outer glow
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.globalAlpha = alpha;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Bright head with enhanced glow
        ctx.globalAlpha = baseFade;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Head glow
        ctx.globalAlpha = baseFade * 0.5;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Original light mode rendering
        // Draw trail
        for (let i = 0; i < star.trail.length; i++) {
          const t = star.trail[i];
          const segmentFade = 1 - (i / star.trail.length);
          const alpha = baseFade * segmentFade * 0.7;
          const size = star.size * segmentFade;

          if (alpha > 0.01 && size > 0.1) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw bright head
        ctx.globalAlpha = baseFade * 1.0;
        ctx.fillStyle = '#475569'; // dark slate for visibility
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Glow around head
        ctx.globalAlpha = baseFade * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }
  }

  // Canvas setup
  function fitCanvas() {
    if (!canvas) return;
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.floor(window.innerWidth);
    const cssH = Math.floor(window.innerHeight);
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    W = cssW;
    H = cssH;
  }

  // Draw background
  function drawBackground() {
    if (isDarkMode) {
      // Dark space background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, W, H);

      // Enhanced nebula gradient for more atmospheric effect
      const gradient = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, W * 0.8);
      gradient.addColorStop(0, 'rgba(88, 28, 135, 0.22)');
      gradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.12)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Second nebula - enhanced
      const gradient2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.6);
      gradient2.addColorStop(0, 'rgba(157, 23, 77, 0.18)');
      gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, W, H);

      // Third nebula for extra depth
      const gradient3 = ctx.createRadialGradient(W * 0.6, H * 0.5, 0, W * 0.6, H * 0.5, W * 0.5);
      gradient3.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      gradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, W, H);

      // Subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, 'rgba(241, 245, 249, 0)');
      gradient.addColorStop(1, 'rgba(226, 232, 240, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Initialize Milky Way band stars
  function initMilkyWay() {
    milkyWayStars = [];
    if (!isDarkMode) return;

    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      // Gaussian distribution across the band
      const gaussRandom = () => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };

      // Position along the diagonal band
      const t = Math.random();
      const bandX = t * W * 1.4 - W * 0.2;
      const bandY = (1 - t) * H * 1.2 - H * 0.1;

      // Offset from center of band (Gaussian spread)
      const spreadOffset = gaussRandom() * Math.min(W, H) * 0.08;
      const angle = Math.PI * 0.25; // 45 degrees diagonal
      const offsetX = Math.sin(angle) * spreadOffset;
      const offsetY = Math.cos(angle) * spreadOffset;

      milkyWayStars.push({
        x: bandX + offsetX,
        y: bandY + offsetY,
        r: Math.random() * 0.8 + 0.3,
        alpha: Math.random() * 0.4 + 0.2,
        twinkle: Math.random() * 3 + 1
      });
    }
  }

  // Draw Milky Way band (diagonal glowing band across sky)
  function drawMilkyWay() {
    if (!isDarkMode) return;

    // Main Milky Way glow band
    const gradient = ctx.createLinearGradient(0, H, W, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(88, 60, 120, 0.04)');
    gradient.addColorStop(0.4, 'rgba(150, 130, 180, 0.06)');
    gradient.addColorStop(0.5, 'rgba(180, 170, 200, 0.08)');
    gradient.addColorStop(0.6, 'rgba(150, 130, 180, 0.06)');
    gradient.addColorStop(0.8, 'rgba(88, 60, 120, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI * 0.25); // 45 degree diagonal

    const bandWidth = Math.max(W, H) * 1.8;
    const bandHeight = Math.min(W, H) * 0.35;

    ctx.fillStyle = gradient;
    ctx.fillRect(-bandWidth / 2, -bandHeight / 2, bandWidth, bandHeight);
    ctx.restore();

    // Draw concentrated stars within the band
    for (const star of milkyWayStars) {
      const twinkle = 0.7 + 0.3 * Math.sin(time * star.twinkle);
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = '#e8e0ff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Initialize distant galaxies
  function initGalaxies() {
    galaxies = [];
    if (!isDarkMode) return;

    const galaxyCount = 2 + Math.floor(Math.random() * 2); // 2-3 galaxies
    for (let i = 0; i < galaxyCount; i++) {
      galaxies.push({
        x: Math.random() * W * 0.8 + W * 0.1,
        y: Math.random() * H * 0.6 + H * 0.1,
        size: 20 + Math.random() * 30,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        type: Math.random() > 0.5 ? 'spiral' : 'elliptical',
        opacity: 0.08 + Math.random() * 0.12,
        tilt: Math.random() * 0.6 + 0.2, // How tilted the galaxy appears
        arms: Math.floor(Math.random() * 2) + 2, // 2-3 spiral arms
        armStars: []
      });

      // Pre-generate arm stars for spiral galaxies
      if (galaxies[i].type === 'spiral') {
        for (let a = 0; a < galaxies[i].arms; a++) {
          for (let s = 0; s < 15; s++) {
            const armAngle = (a / galaxies[i].arms) * Math.PI * 2;
            const dist = s / 15;
            const spiralAngle = armAngle + dist * Math.PI * 1.5;
            const scatter = (Math.random() - 0.5) * 0.3;
            galaxies[i].armStars.push({
              angle: spiralAngle + scatter,
              dist: dist * 0.8 + 0.2 + (Math.random() - 0.5) * 0.15,
              size: Math.random() * 0.8 + 0.3,
              brightness: Math.random() * 0.5 + 0.3
            });
          }
        }
      }
    }
  }

  // Draw distant galaxies
  function drawGalaxies() {
    if (!isDarkMode) return;

    for (const galaxy of galaxies) {
      // Update rotation
      galaxy.rotation += galaxy.rotationSpeed;

      ctx.save();
      ctx.translate(galaxy.x, galaxy.y);
      ctx.rotate(galaxy.rotation);
      ctx.scale(1, galaxy.tilt); // Tilt effect

      if (galaxy.type === 'spiral') {
        // Core glow
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.3);
        coreGrad.addColorStop(0, `rgba(255, 250, 240, ${galaxy.opacity * 1.5})`);
        coreGrad.addColorStop(0.5, `rgba(255, 230, 200, ${galaxy.opacity})`);
        coreGrad.addColorStop(1, 'rgba(255, 230, 200, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, galaxy.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms with scattered stars
        for (const star of galaxy.armStars) {
          const x = Math.cos(star.angle) * galaxy.size * star.dist;
          const y = Math.sin(star.angle) * galaxy.size * star.dist;
          ctx.globalAlpha = galaxy.opacity * star.brightness;
          ctx.fillStyle = '#f0e8ff';
          ctx.beginPath();
          ctx.arc(x, y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Faint disk glow
        const diskGrad = ctx.createRadialGradient(0, 0, galaxy.size * 0.2, 0, 0, galaxy.size);
        diskGrad.addColorStop(0, `rgba(200, 180, 220, ${galaxy.opacity * 0.3})`);
        diskGrad.addColorStop(1, 'rgba(200, 180, 220, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(0, 0, galaxy.size, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Elliptical galaxy - simple elongated glow
        const ellipGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size);
        ellipGrad.addColorStop(0, `rgba(255, 240, 220, ${galaxy.opacity * 1.2})`);
        ellipGrad.addColorStop(0.3, `rgba(255, 220, 200, ${galaxy.opacity * 0.6})`);
        ellipGrad.addColorStop(0.7, `rgba(220, 200, 180, ${galaxy.opacity * 0.2})`);
        ellipGrad.addColorStop(1, 'rgba(200, 180, 160, 0)');
        ctx.fillStyle = ellipGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, galaxy.size, galaxy.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // Initialize cosmic dust lanes
  function initDustLanes() {
    dustLanes = [];
    if (!isDarkMode) return;

    const laneCount = 2 + Math.floor(Math.random() * 2); // 2-3 dust lanes
    for (let i = 0; i < laneCount; i++) {
      const turbulencePoints = [];
      const pointCount = 8 + Math.floor(Math.random() * 5);
      for (let p = 0; p < pointCount; p++) {
        turbulencePoints.push({
          offset: (Math.random() - 0.5) * 100,
          phase: Math.random() * Math.PI * 2,
          freq: Math.random() * 0.5 + 0.2
        });
      }

      dustLanes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        width: 80 + Math.random() * 120,
        height: 40 + Math.random() * 80,
        rotation: Math.random() * Math.PI * 2,
        opacity: 0.03 + Math.random() * 0.04,
        turbulence: turbulencePoints
      });
    }
  }

  // Draw cosmic dust lanes (dark nebula patches)
  function drawDustLanes() {
    if (!isDarkMode) return;

    for (const lane of dustLanes) {
      ctx.save();
      ctx.translate(lane.x, lane.y);
      ctx.rotate(lane.rotation);

      // Create organic wispy shape using turbulence
      ctx.beginPath();
      const points = lane.turbulence.length;
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        const angle = t * Math.PI * 2;
        const turbIdx = i % lane.turbulence.length;
        const turb = lane.turbulence[turbIdx];
        const wobble = Math.sin(time * turb.freq + turb.phase) * turb.offset * 0.3;

        const radiusX = lane.width / 2 + wobble;
        const radiusY = lane.height / 2 + wobble * 0.5;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Dark gradient fill (obscures background slightly)
      const dustGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(lane.width, lane.height));
      dustGrad.addColorStop(0, `rgba(0, 0, 10, ${lane.opacity})`);
      dustGrad.addColorStop(0.5, `rgba(5, 5, 20, ${lane.opacity * 0.7})`);
      dustGrad.addColorStop(1, 'rgba(10, 10, 30, 0)');
      ctx.fillStyle = dustGrad;
      ctx.fill();

      ctx.restore();
    }
  }

  // Initialize deep sky objects (nebulae)
  function initDeepSkyObjects() {
    deepSkyObjects = [];
    if (!isDarkMode) return;

    const nebulaCount = 1 + Math.floor(Math.random() * 2); // 1-2 nebulae
    for (let i = 0; i < nebulaCount; i++) {
      const centralStars = [];
      const starCount = 3 + Math.floor(Math.random() * 4); // Trapezium-like cluster
      for (let s = 0; s < starCount; s++) {
        centralStars.push({
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 15,
          size: 1 + Math.random() * 1.5,
          brightness: 0.6 + Math.random() * 0.4
        });
      }

      deepSkyObjects.push({
        x: Math.random() * W * 0.8 + W * 0.1,
        y: Math.random() * H * 0.7 + H * 0.1,
        size: 40 + Math.random() * 50,
        opacity: 0.06 + Math.random() * 0.08,
        centralStars: centralStars,
        // Colors: pink/red emission core, blue reflection outer
        emissionHue: Math.random() > 0.5 ? 'pink' : 'red',
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  // Draw deep sky objects (emission/reflection nebulae)
  function drawDeepSkyObjects() {
    if (!isDarkMode) return;

    for (const dso of deepSkyObjects) {
      const pulse = 1 + Math.sin(time * 0.3 + dso.pulsePhase) * 0.1;

      // Blue reflection nebula (outer)
      const outerGrad = ctx.createRadialGradient(
        dso.x, dso.y, dso.size * 0.3,
        dso.x, dso.y, dso.size * pulse
      );
      outerGrad.addColorStop(0, 'rgba(100, 140, 200, 0)');
      outerGrad.addColorStop(0.5, `rgba(80, 120, 180, ${dso.opacity * 0.4})`);
      outerGrad.addColorStop(0.8, `rgba(60, 100, 160, ${dso.opacity * 0.2})`);
      outerGrad.addColorStop(1, 'rgba(40, 80, 140, 0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(dso.x, dso.y, dso.size * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Pink/red emission core
      const emissionColor = dso.emissionHue === 'pink'
        ? { r: 220, g: 100, b: 140 }
        : { r: 200, g: 80, b: 80 };
      const coreGrad = ctx.createRadialGradient(
        dso.x, dso.y, 0,
        dso.x, dso.y, dso.size * 0.4 * pulse
      );
      coreGrad.addColorStop(0, `rgba(${emissionColor.r}, ${emissionColor.g}, ${emissionColor.b}, ${dso.opacity * 1.2})`);
      coreGrad.addColorStop(0.4, `rgba(${emissionColor.r}, ${emissionColor.g}, ${emissionColor.b}, ${dso.opacity * 0.6})`);
      coreGrad.addColorStop(1, `rgba(${emissionColor.r}, ${emissionColor.g}, ${emissionColor.b}, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(dso.x, dso.y, dso.size * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Central bright stars (Trapezium-like)
      for (const star of dso.centralStars) {
        ctx.globalAlpha = star.brightness;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dso.x + star.x, dso.y + star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = star.brightness * 0.4;
        ctx.beginPath();
        ctx.arc(dso.x + star.x, dso.y + star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Initialize satellites
  function initSatellites() {
    satellites = [];
  }

  // Spawn a new satellite
  function spawnSatellite() {
    if (!isDarkMode || satellites.length >= 2) return;

    const edge = Math.random();
    let startX, startY, endX, endY;

    if (edge < 0.5) {
      // Left to right
      startX = -10;
      startY = Math.random() * H * 0.7;
      endX = W + 10;
      endY = Math.random() * H * 0.7;
    } else {
      // Right to left
      startX = W + 10;
      startY = Math.random() * H * 0.7;
      endX = -10;
      endY = Math.random() * H * 0.7;
    }

    satellites.push({
      x: startX,
      y: startY,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      progress: 0,
      speed: 0.02 + Math.random() * 0.02, // Speed across screen
      size: 1 + Math.random() * 0.5,
      flarePhase: Math.random() * Math.PI * 2,
      flareFreq: Math.random() * 2 + 0.5
    });
  }

  // Update and draw satellites
  function updateSatellites(dt) {
    if (!isDarkMode) return;

    // Chance to spawn new satellite (~every 30 seconds)
    if (Math.random() < dt * 0.033) {
      spawnSatellite();
    }

    for (let i = satellites.length - 1; i >= 0; i--) {
      const sat = satellites[i];

      // Update progress
      sat.progress += sat.speed * dt;

      // Remove if completed
      if (sat.progress >= 1) {
        satellites.splice(i, 1);
        continue;
      }

      // Calculate position
      sat.x = sat.startX + (sat.endX - sat.startX) * sat.progress;
      sat.y = sat.startY + (sat.endY - sat.startY) * sat.progress;

      // Tumbling flare effect
      const flare = Math.sin(time * sat.flareFreq + sat.flarePhase);
      const brightness = 0.5 + (flare > 0.8 ? 0.5 : 0); // Occasional bright flare

      ctx.globalAlpha = brightness;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, sat.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle trail
      ctx.globalAlpha = brightness * 0.3;
      const trailX = sat.x - (sat.endX - sat.startX) * 0.01;
      const trailY = sat.y - (sat.endY - sat.startY) * 0.01;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(sat.x, sat.y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = sat.size * 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Draw aurora edge glow at bottom of screen
  function drawAuroraEdge() {
    if (!isDarkMode) return;

    // Slow hue shift
    const hueShift = time * 0.05;
    const hue1 = (180 + Math.sin(hueShift) * 30) % 360; // Cyan-green range
    const hue2 = (280 + Math.sin(hueShift + 1) * 40) % 360; // Purple-pink range

    // Create aurora gradient at bottom edge
    const auroraGrad = ctx.createLinearGradient(0, H, 0, H - H * 0.15);
    auroraGrad.addColorStop(0, `hsla(${hue1}, 70%, 50%, 0.03)`);
    auroraGrad.addColorStop(0.3, `hsla(${(hue1 + hue2) / 2}, 60%, 40%, 0.02)`);
    auroraGrad.addColorStop(0.7, `hsla(${hue2}, 50%, 30%, 0.01)`);
    auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auroraGrad;
    ctx.fillRect(0, H - H * 0.15, W, H * 0.15);

    // Add subtle wave effect
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      const waveY = H - 20 - w * 15;
      const wavePhase = time * 0.5 + w * 1.5;

      ctx.moveTo(0, waveY);
      for (let x = 0; x <= W; x += 20) {
        const y = waveY + Math.sin(x * 0.01 + wavePhase) * 5;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();

      const waveHue = hue1 + w * 20;
      ctx.fillStyle = `hsla(${waveHue}, 60%, 50%, 0.008)`;
      ctx.fill();
    }
  }

  // Draw sun for a solar system with corona, flames, vortex and surface detail
  function drawSun(systemConfig) {
    const sunX = systemConfig.x * W;
    const sunY = systemConfig.y * H;
    const sunConf = systemConfig.sun;
    const baseRadius = Math.max(25, sunConf.baseRadius * (Math.min(W, H) / 1000));
    const glowRadius = Math.max(80, sunConf.glowRadius * (Math.min(W, H) / 1000));

    // Subtle pulsing
    const pulse = 1 + Math.sin(time * 0.5) * 0.02;
    const fastPulse = 1 + Math.sin(time * 2) * 0.03;

    // Outer corona glow (largest, faintest)
    const coronaGlow = ctx.createRadialGradient(sunX, sunY, baseRadius * 0.8, sunX, sunY, glowRadius * 1.5 * pulse);
    const glowColor = sunConf.glowColor;
    coronaGlow.addColorStop(0, glowColor.replace(/[\d.]+\)$/, '0.3)'));
    coronaGlow.addColorStop(0.3, glowColor.replace(/[\d.]+\)$/, '0.15)'));
    coronaGlow.addColorStop(0.6, glowColor.replace(/[\d.]+\)$/, '0.05)'));
    coronaGlow.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = coronaGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowRadius * 1.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw large solar prominences/arcs (loop-like structures)
    const prominenceCount = 4;
    for (let i = 0; i < prominenceCount; i++) {
      const baseAngle = (i / prominenceCount) * Math.PI * 2 + time * 0.03;
      const arcHeight = baseRadius * (0.5 + Math.sin(time * 0.8 + i * 2.3) * 0.3);
      const arcWidth = baseRadius * 0.4;

      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(baseAngle);

      // Arc prominence
      const arcGrad = ctx.createRadialGradient(baseRadius, -arcHeight * 0.5, 0, baseRadius, -arcHeight * 0.5, arcHeight);
      arcGrad.addColorStop(0, glowColor.replace(/[\d.]+\)$/, '0.7)'));
      arcGrad.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/, '0.3)'));
      arcGrad.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0)'));

      ctx.globalAlpha = isDarkMode ? 0.4 : 0.25;
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = arcWidth * 0.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseRadius * 0.85, 0);
      ctx.quadraticCurveTo(
        baseRadius + arcHeight * 0.6, -arcHeight * (0.8 + Math.sin(time * 2 + i) * 0.2),
        baseRadius * 0.85, -arcWidth * 0.1
      );
      ctx.stroke();
      ctx.restore();
    }

    // Draw solar flares/prominences (flame-like)
    const flareCount = 12;
    for (let i = 0; i < flareCount; i++) {
      const flareAngle = (i / flareCount) * Math.PI * 2 + time * 0.08 + Math.sin(time * 0.5 + i) * 0.1;
      const flareLength = baseRadius * (0.3 + Math.sin(time * 1.5 + i * 1.7) * 0.2 + Math.sin(time * 3 + i * 0.7) * 0.1);
      const flareWidth = baseRadius * (0.1 + Math.sin(time * 2 + i * 2.1) * 0.03);

      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(flareAngle);

      // Flame gradient with more detail
      const flameGrad = ctx.createLinearGradient(baseRadius * 0.9, 0, baseRadius + flareLength, 0);
      flameGrad.addColorStop(0, sunConf.color);
      flameGrad.addColorStop(0.2, glowColor.replace(/[\d.]+\)$/, '0.8)'));
      flameGrad.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/, '0.4)'));
      flameGrad.addColorStop(0.8, glowColor.replace(/[\d.]+\)$/, '0.15)'));
      flameGrad.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0)'));

      ctx.globalAlpha = isDarkMode ? 0.55 : 0.4;
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(baseRadius * 0.88, -flareWidth * 0.5);
      // Wavy flame edges
      const wave1 = Math.sin(time * 4 + i) * flareWidth * 0.3;
      const wave2 = Math.cos(time * 3.5 + i * 1.3) * flareWidth * 0.25;
      ctx.bezierCurveTo(
        baseRadius + flareLength * 0.3, -flareWidth * 0.4 + wave1,
        baseRadius + flareLength * 0.6, -flareWidth * 0.2 + wave2,
        baseRadius + flareLength, 0
      );
      ctx.bezierCurveTo(
        baseRadius + flareLength * 0.6, flareWidth * 0.2 - wave2,
        baseRadius + flareLength * 0.3, flareWidth * 0.4 - wave1,
        baseRadius * 0.88, flareWidth * 0.5
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Inner corona (chromosphere) - reddish/orange layer
    const chromosphere = ctx.createRadialGradient(sunX, sunY, baseRadius * 0.85, sunX, sunY, baseRadius * 1.25 * fastPulse);
    chromosphere.addColorStop(0, sunConf.color);
    chromosphere.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/, '0.5)'));
    chromosphere.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0)'));
    ctx.globalAlpha = isDarkMode ? 0.7 : 0.55;
    ctx.fillStyle = chromosphere;
    ctx.beginPath();
    ctx.arc(sunX, sunY, baseRadius * 1.25 * fastPulse, 0, Math.PI * 2);
    ctx.fill();

    // Photosphere (visible surface) with texture effect
    const photosphere = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, baseRadius * pulse);
    photosphere.addColorStop(0, '#ffffff');
    photosphere.addColorStop(0.3, sunConf.color);
    photosphere.addColorStop(0.7, sunConf.color);
    photosphere.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0.8)'));
    ctx.globalAlpha = isDarkMode ? 0.8 : 0.72;
    ctx.fillStyle = photosphere;
    ctx.beginPath();
    ctx.arc(sunX, sunY, baseRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Surface convection cells (granulation) - creates turbulent surface look
    const cellCount = 16;
    for (let i = 0; i < cellCount; i++) {
      const cellAngle = (i / cellCount) * Math.PI * 2 + time * 0.15;
      const cellDist = baseRadius * (0.4 + (i % 3) * 0.15);
      const cellX = sunX + Math.cos(cellAngle) * cellDist;
      const cellY = sunY + Math.sin(cellAngle) * cellDist;
      const cellRadius = baseRadius * (0.08 + Math.sin(time * 2 + i * 1.5) * 0.02);

      // Bright cell center (hot rising plasma)
      const cellGrad = ctx.createRadialGradient(cellX, cellY, 0, cellX, cellY, cellRadius);
      cellGrad.addColorStop(0, '#ffffff');
      cellGrad.addColorStop(0.4, sunConf.color);
      cellGrad.addColorStop(1, glowColor.replace(/[\d.]+\)$/, '0.3)'));

      ctx.globalAlpha = isDarkMode ? 0.25 : 0.18;
      ctx.fillStyle = cellGrad;
      ctx.beginPath();
      ctx.arc(cellX, cellY, cellRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sunspots (subtle dark patches with penumbra)
    const spotCount = 4;
    for (let i = 0; i < spotCount; i++) {
      const spotAngle = (i / spotCount) * Math.PI * 2 + time * 0.03 + i * 0.5;
      const spotDist = baseRadius * (0.25 + (i % 2) * 0.2);
      const spotX = sunX + Math.cos(spotAngle) * spotDist;
      const spotY = sunY + Math.sin(spotAngle) * spotDist;
      const spotRadius = baseRadius * (0.06 + Math.sin(time * 0.5 + i) * 0.015);

      // Penumbra (lighter outer ring)
      ctx.globalAlpha = isDarkMode ? 0.12 : 0.08;
      ctx.fillStyle = '#4a2800';
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Umbra (dark center)
      ctx.globalAlpha = isDarkMode ? 0.2 : 0.12;
      ctx.fillStyle = '#1a0a00';
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bright core highlight
    ctx.globalAlpha = isDarkMode ? 0.4 : 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX - baseRadius * 0.25, sunY - baseRadius * 0.25, baseRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Additional specular highlights for 3D effect
    ctx.globalAlpha = isDarkMode ? 0.2 : 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX - baseRadius * 0.35, sunY - baseRadius * 0.1, baseRadius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // Draw orbital paths for a solar system (circular)
  function drawOrbits(systemConfig, planetList) {
    const sunX = systemConfig.x * W;
    const sunY = systemConfig.y * H;
    const scale = Math.min(W, H);

    ctx.strokeStyle = 'rgba(148, 163, 184, ' + systemConfig.orbitOpacity + ')';
    ctx.lineWidth = 1;

    for (const planet of planetList) {
      const orbitRadius = planet.orbitRadius * scale;
      ctx.beginPath();
      ctx.arc(sunX, sunY, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw orbital paths for elliptical orbits
  function drawOrbitsElliptical(systemConfig, planetList) {
    const sunX = systemConfig.x * W;
    const sunY = systemConfig.y * H;
    const scale = Math.min(W, H);

    ctx.strokeStyle = 'rgba(148, 163, 184, ' + systemConfig.orbitOpacity + ')';
    ctx.lineWidth = 1;

    for (const planet of planetList) {
      const a = planet.orbitRadius * scale; // semi-major axis
      const e = planet.eccentricity || 0;
      const b = a * Math.sqrt(1 - e * e); // semi-minor axis

      ctx.beginPath();
      ctx.ellipse(sunX, sunY, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw planets for a solar system with atmospheric layers
  function drawPlanetsForSystem(systemConfig, planetList, dt) {
    const sunX = systemConfig.x * W;
    const sunY = systemConfig.y * H;
    const scale = Math.min(W, H);

    for (const planet of planetList) {
      // Update angle
      planet.angle += planet.speed * dt * 0.1;

      // Calculate position (elliptical if eccentricity defined, else circular)
      const a = planet.orbitRadius * scale; // semi-major axis
      const e = planet.eccentricity || 0;
      const b = a * Math.sqrt(1 - e * e); // semi-minor axis

      const x = sunX + Math.cos(planet.angle) * a;
      const y = sunY + Math.sin(planet.angle) * b;
      const radius = Math.max(2, planet.radius * (scale / 800));

      // Determine atmosphere color based on planet color
      let atmosColor, atmosGlow;
      if (planet.color.includes('3b82f6') || planet.color.includes('60a5fa')) {
        // Earth-like blue - white/blue atmosphere
        atmosColor = 'rgba(147, 197, 253, 0.4)';
        atmosGlow = 'rgba(59, 130, 246, 0.2)';
      } else if (planet.color.includes('ef4444') || planet.color.includes('f97316')) {
        // Mars/gas giant - reddish/orange atmosphere
        atmosColor = 'rgba(251, 146, 60, 0.35)';
        atmosGlow = 'rgba(239, 68, 68, 0.15)';
      } else if (planet.color.includes('fbbf24') || planet.color.includes('eab308')) {
        // Venus/Saturn - yellowish atmosphere
        atmosColor = 'rgba(253, 224, 71, 0.35)';
        atmosGlow = 'rgba(234, 179, 8, 0.2)';
      } else if (planet.color.includes('a78bfa') || planet.color.includes('c4b5fd') || planet.color.includes('ddd6fe')) {
        // Purple/nebula planets - purple atmosphere
        atmosColor = 'rgba(196, 181, 253, 0.4)';
        atmosGlow = 'rgba(167, 139, 250, 0.25)';
      } else if (planet.color.includes('f0abfc')) {
        // Pink nebula planet
        atmosColor = 'rgba(240, 171, 252, 0.4)';
        atmosGlow = 'rgba(232, 121, 249, 0.2)';
      } else if (planet.color.includes('a5b4fc') || planet.color.includes('c7d2fe')) {
        // Light indigo planets
        atmosColor = 'rgba(199, 210, 254, 0.4)';
        atmosGlow = 'rgba(165, 180, 252, 0.2)';
      } else {
        // Default gray atmosphere for rocky planets
        atmosColor = 'rgba(148, 163, 184, 0.3)';
        atmosGlow = 'rgba(100, 116, 139, 0.15)';
      }

      // Outer atmosphere glow (thermosphere/exosphere)
      if (radius > 3) {
        const outerAtmos = ctx.createRadialGradient(x, y, radius * 0.9, x, y, radius * 2.2);
        outerAtmos.addColorStop(0, atmosGlow);
        outerAtmos.addColorStop(0.5, atmosGlow.replace(/[\d.]+\)$/, '0.08)'));
        outerAtmos.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = planet.opacity * (isDarkMode ? 1 : 0.7);
        ctx.fillStyle = outerAtmos;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner atmosphere (mesosphere/stratosphere glow)
      const innerAtmos = ctx.createRadialGradient(x, y, radius * 0.85, x, y, radius * 1.4);
      innerAtmos.addColorStop(0, atmosColor);
      innerAtmos.addColorStop(0.6, atmosColor.replace(/[\d.]+\)$/, '0.15)'));
      innerAtmos.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = planet.opacity * (isDarkMode ? 0.9 : 0.65);
      ctx.fillStyle = innerAtmos;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Planet surface with gradient for 3D effect
      const surfaceGrad = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 0,
        x, y, radius
      );
      surfaceGrad.addColorStop(0, '#ffffff');
      surfaceGrad.addColorStop(0.2, planet.color);
      surfaceGrad.addColorStop(0.8, planet.color);
      surfaceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

      ctx.globalAlpha = planet.opacity;
      ctx.fillStyle = surfaceGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight (sun reflection)
      ctx.globalAlpha = planet.opacity * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Draw planet ring with shadow
      if (planet.hasRing) {
        // Ring shadow on planet
        ctx.globalAlpha = planet.opacity * 0.2;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.1, radius * 0.8, radius * 0.15, 0, 0, Math.PI);
        ctx.fill();

        // Back ring (behind planet)
        ctx.strokeStyle = planet.color;
        ctx.lineWidth = radius * 0.3;
        ctx.globalAlpha = planet.opacity * 0.4;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.9, radius * 0.45, planet.angle * 0.05, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Front ring (in front of planet)
        ctx.lineWidth = radius * 0.35;
        ctx.globalAlpha = planet.opacity * 0.75;

        // Ring gradient for depth
        const ringGrad = ctx.createLinearGradient(x - radius * 2, y, x + radius * 2, y);
        ringGrad.addColorStop(0, planet.color);
        ringGrad.addColorStop(0.3, '#ffffff');
        ringGrad.addColorStop(0.5, planet.color);
        ringGrad.addColorStop(0.7, '#ffffff');
        ringGrad.addColorStop(1, planet.color);
        ctx.strokeStyle = ringGrad;

        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.9, radius * 0.45, planet.angle * 0.05, 0, Math.PI);
        ctx.stroke();

        // Inner ring detail
        ctx.lineWidth = radius * 0.15;
        ctx.globalAlpha = planet.opacity * 0.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.5, radius * 0.35, planet.angle * 0.05, 0, Math.PI);
        ctx.stroke();
      }

      // Draw moons orbiting the planet
      if (planet.moons && planet.moons.length > 0) {
        for (const moon of planet.moons) {
          // Update moon angle (orbits planet)
          moon.angle += moon.speed * dt * 0.1;

          // Calculate moon position relative to planet
          const moonX = x + Math.cos(moon.angle) * moon.orbitRadius;
          const moonY = y + Math.sin(moon.angle) * moon.orbitRadius * 0.4; // Tilted orbit

          // Draw moon orbit path (subtle)
          ctx.globalAlpha = 0.1;
          ctx.strokeStyle = moon.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.ellipse(x, y, moon.orbitRadius, moon.orbitRadius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Draw moon with 3D shading
          const moonGrad = ctx.createRadialGradient(
            moonX - moon.radius * 0.3, moonY - moon.radius * 0.3, 0,
            moonX, moonY, moon.radius
          );
          moonGrad.addColorStop(0, '#ffffff');
          moonGrad.addColorStop(0.3, moon.color);
          moonGrad.addColorStop(1, 'rgba(0,0,0,0.3)');

          ctx.globalAlpha = planet.opacity;
          ctx.fillStyle = moonGrad;
          ctx.beginPath();
          ctx.arc(moonX, moonY, moon.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }
  }

  // Draw subtle stars (very faint)
  let stars = [];

  // Star color palette based on spectral type (temperature)
  // O/B stars (hot, blue-white), A stars (white), F/G stars (yellow-white), K/M stars (orange-red)
  const starColorsByMagnitude = {
    bright: [
      '#9bb0ff',      // O-type blue
      '#aabfff',      // B-type blue-white
      '#cad7ff',      // A-type white-blue
      '#ffffff',      // White
    ],
    medium: [
      '#f8f7ff',      // A-type white
      '#fff4e8',      // F-type yellow-white
      '#ffeedd',      // G-type yellow (sun-like)
      '#ffd9b3',      // K-type orange
    ],
    dim: [
      '#ffcc99',      // K-type orange
      '#ffbb88',      // Late K-type
      '#ff9966',      // M-type red dwarf
      '#ff8855',      // Late M-type
    ]
  };

  function initStars() {
    stars = [];
    // More stars in dark mode with power-law distribution
    const count = isDarkMode
      ? Math.floor((W * H) / 3500)  // Many more stars in dark mode
      : Math.floor((W * H) / 20000); // Normal count in light mode

    for (let i = 0; i < count; i++) {
      // Power-law distribution: few bright stars, many dim ones
      // magnitude 0 = very bright, 6 = very dim (realistic astronomical scale)
      const uniformRandom = Math.random();
      const magnitude = Math.pow(uniformRandom, 0.4) * 6; // Power-law skew towards dim stars

      // Determine star properties based on magnitude
      let radius, baseAlpha, color, depthLayer;

      if (magnitude < 1.5) {
        // Very bright stars (rare)
        radius = 2.5 + (1.5 - magnitude) * 1.5;
        baseAlpha = 0.9 + (1.5 - magnitude) * 0.1;
        const colors = starColorsByMagnitude.bright;
        color = colors[Math.floor(Math.random() * colors.length)];
        depthLayer = 3; // Closest - most parallax
      } else if (magnitude < 3.5) {
        // Medium bright stars
        radius = 1.2 + (3.5 - magnitude) * 0.6;
        baseAlpha = 0.5 + (3.5 - magnitude) * 0.2;
        const colors = starColorsByMagnitude.medium;
        color = colors[Math.floor(Math.random() * colors.length)];
        depthLayer = 2; // Medium depth
      } else {
        // Dim stars (most common)
        radius = 0.4 + (6 - magnitude) * 0.3;
        baseAlpha = 0.15 + (6 - magnitude) * 0.1;
        const colors = starColorsByMagnitude.dim;
        color = colors[Math.floor(Math.random() * colors.length)];
        depthLayer = 1; // Farthest - least parallax
      }

      stars.push({
        baseX: Math.random() * W,  // Base position (for parallax)
        baseY: Math.random() * H,
        x: 0,  // Rendered position (updated with parallax)
        y: 0,
        r: radius,
        alpha: baseAlpha,
        magnitude: magnitude,
        // Multi-frequency twinkle parameters
        twinkle1: Math.random() * 2 + 0.5,
        twinkle2: Math.random() * 5 + 2,
        twinkle3: Math.random() * 0.5 + 0.1,
        twinklePhase: Math.random() * Math.PI * 2,
        color: color,
        depthLayer: depthLayer,
        // Chromatic aberration for bright stars
        chromaticShift: magnitude < 2 ? Math.random() * 0.3 : 0
      });
    }
  }

  // Update star positions with parallax effect
  function updateStarPositions() {
    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    const centerX = W / 2;
    const centerY = H / 2;
    const offsetX = (mouseX - centerX) / centerX;
    const offsetY = (mouseY - centerY) / centerY;

    for (const star of stars) {
      // Parallax based on depth layer (farther = less movement)
      const parallaxStrength = star.depthLayer * 5; // Max 15px for closest stars
      star.x = star.baseX + offsetX * parallaxStrength;
      star.y = star.baseY + offsetY * parallaxStrength;
    }
  }

  function drawStars() {
    if (isDarkMode) {
      for (const star of stars) {
        // Multi-frequency twinkle (atmospheric scintillation simulation)
        const twinkle1 = Math.sin(time * star.twinkle1 + star.twinklePhase);
        const twinkle2 = Math.sin(time * star.twinkle2 + star.twinklePhase * 1.5) * 0.5;
        const twinkle3 = Math.sin(time * star.twinkle3 + star.twinklePhase * 2) * 0.3;
        const combinedTwinkle = 0.65 + (twinkle1 + twinkle2 + twinkle3) * 0.2;

        // Brighter stars twinkle more dramatically
        const twinkleIntensity = star.magnitude < 2 ? 1.5 : (star.magnitude < 4 ? 1.2 : 1);
        const alpha = Math.min(1, star.alpha * combinedTwinkle * twinkleIntensity);

        // Chromatic aberration for bright stars (color shifts)
        let displayColor = star.color;
        if (star.chromaticShift > 0 && star.magnitude < 2) {
          const colorShift = Math.sin(time * 0.8 + star.twinklePhase) * star.chromaticShift;
          if (colorShift > 0.1) {
            displayColor = '#aaccff'; // Shift to blue
          } else if (colorShift < -0.1) {
            displayColor = '#ffddaa'; // Shift to warm
          }
        }

        // Cross-flare effect for the brightest stars (magnitude < 1)
        if (star.magnitude < 1 && alpha > 0.7) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.strokeStyle = displayColor;
          ctx.lineWidth = 0.5;
          const flareLength = star.r * 8 * (0.8 + twinkle1 * 0.2);

          // Horizontal flare
          ctx.beginPath();
          ctx.moveTo(star.x - flareLength, star.y);
          ctx.lineTo(star.x + flareLength, star.y);
          ctx.stroke();

          // Vertical flare
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - flareLength);
          ctx.lineTo(star.x, star.y + flareLength);
          ctx.stroke();

          // Diagonal flares (fainter)
          ctx.globalAlpha = alpha * 0.15;
          const diagLength = flareLength * 0.7;
          ctx.beginPath();
          ctx.moveTo(star.x - diagLength, star.y - diagLength);
          ctx.lineTo(star.x + diagLength, star.y + diagLength);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(star.x + diagLength, star.y - diagLength);
          ctx.lineTo(star.x - diagLength, star.y + diagLength);
          ctx.stroke();
        }

        // Outer glow (for brighter stars)
        if (star.magnitude < 4) {
          ctx.globalAlpha = alpha * 0.2;
          ctx.fillStyle = displayColor;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star core glow
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = displayColor;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Star center (brightest point)
        ctx.globalAlpha = alpha;
        ctx.fillStyle = displayColor;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        // White-hot center for bright stars
        if (star.magnitude < 3) {
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      ctx.fillStyle = '#94a3b8';
      for (const star of stars) {
        const alpha = star.alpha * (0.7 + 0.3 * Math.sin(time * star.twinkle1));
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(star.baseX, star.baseY, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Animation loop
  function loop(ts) {
    if (!isRunning) return;
    if (!lastTime) lastTime = ts;
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;
    time += dt;

    // Draw background
    drawBackground();

    // === Dark mode cosmic enhancements (drawn in specific order for depth) ===
    if (isDarkMode) {
      drawAuroraEdge();       // Horizon glow (behind everything)
      drawMilkyWay();         // Galaxy band
      drawDustLanes();        // Dark nebula patches
      drawGalaxies();         // Distant galaxies
      drawDeepSkyObjects();   // Nebulae
    }

    // Update star parallax positions
    if (isDarkMode) {
      updateStarPositions();
    }

    // Draw stars
    drawStars();

    // Draw satellites (dark mode only)
    if (isDarkMode) {
      updateSatellites(dt);
    }

    // Draw shooting stars / meteor showers
    updateAndDrawShootingStars(dt);

    // Draw both solar systems
    drawOrbitsElliptical(config.solarSystem1, planets1);
    drawOrbitsElliptical(config.solarSystem2, planets2);

    // Draw asteroid belts (before planets so planets appear on top)
    drawAsteroidBelt(config.solarSystem1, asteroids1, dt);
    drawAsteroidBelt(config.solarSystem2, asteroids2, dt);

    drawSun(config.solarSystem1);
    drawSun(config.solarSystem2);
    drawPlanetsForSystem(config.solarSystem1, planets1, dt);
    drawPlanetsForSystem(config.solarSystem2, planets2, dt);

    // Draw spaceship traveling between systems
    updateAndDrawSpaceship(dt);

    animationId = requestAnimationFrame(loop);
  }

  // Resize handler
  let resizeTimer = null;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isRunning) {
        fitCanvas();
        initStars();
        initShootingStars();
        initAsteroids();

        // Reinitialize cosmic elements for new dimensions
        initMilkyWay();
        initGalaxies();
        initDustLanes();
        initDeepSkyObjects();
        // Don't reset satellites - let them naturally expire

        // Reset mouse position to center
        mouseX = W / 2;
        mouseY = H / 2;
        targetMouseX = W / 2;
        targetMouseY = H / 2;

        // Reinit spaceship trail for new dimensions (preserve state)
        const savedState = {
          progress: spaceship.progress,
          direction: spaceship.direction,
          launched: spaceship.launched,
          launchAnimation: spaceship.launchAnimation,
          shieldPulse: spaceship.shieldPulse
        };
        initSpaceship();
        Object.assign(spaceship, savedState);
      }
    }, 120);
  }

  // Public API
  return {
    init(canvasId) {
      canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn('LightCanvas: Canvas element not found:', canvasId);
        return false;
      }
      ctx = canvas.getContext('2d', { alpha: false });
      window.addEventListener('resize', handleResize);

      // Mouse tracking for parallax effect
      window.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
      });

      return true;
    },

    start() {
      if (isRunning) return;
      if (!canvas) {
        console.warn('LightCanvas: Not initialized. Call init() first.');
        return;
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      isRunning = true;
      lastTime = 0;
      fitCanvas();
      initPlanets();
      initAsteroids();
      initStars();
      initShootingStars();
      initSpaceship();

      // Initialize cosmic enhancements (for dark mode)
      initMilkyWay();
      initGalaxies();
      initDustLanes();
      initDeepSkyObjects();
      initSatellites();

      // Initialize mouse position to center
      mouseX = W / 2;
      mouseY = H / 2;
      targetMouseX = W / 2;
      targetMouseY = H / 2;

      animationId = requestAnimationFrame(loop);
    },

    stop() {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },

    isRunning() {
      return isRunning;
    },

    setDarkMode(dark) {
      isDarkMode = dark;
      // Reinitialize stars and cosmic elements for different density in dark/light mode
      if (isRunning) {
        initStars();
        initMilkyWay();
        initGalaxies();
        initDustLanes();
        initDeepSkyObjects();
        initSatellites();
        // Reset meteor shower state
        meteorShower.active = false;
      }
    },

    reinitStars() {
      if (isRunning) {
        initStars();
        initMilkyWay();
        initGalaxies();
        initDustLanes();
        initDeepSkyObjects();
      }
    },

    launchSpaceship() {
      if (!spaceship.launched) {
        spaceship.launched = true;
        spaceship.launchAnimation = 0;
        spaceship.progress = 0;
        spaceship.direction = 1;
        spaceship.shieldPulse = 0;
        spaceship.trail = [];
        spaceship.engineParticles = [];
        // Pre-fill trail at starting position
        const startX = config.solarSystem1.x * W;
        const startY = config.solarSystem1.y * H;
        for (let i = 0; i < config.spaceship.trailLength; i++) {
          spaceship.trail.push({ x: startX, y: startY, alpha: 0 });
        }
      }
    },

    stopSpaceship() {
      spaceship.launched = false;
      spaceship.launchAnimation = 0;
      spaceship.progress = 0;
      spaceship.direction = 1;
      spaceship.trail = [];
      spaceship.engineParticles = [];
    },

    toggleSpaceship() {
      if (spaceship.launched) {
        // Stop the spaceship
        spaceship.launched = false;
        spaceship.launchAnimation = 0;
        spaceship.progress = 0;
        spaceship.direction = 1;
        spaceship.trail = [];
        spaceship.engineParticles = [];
        return false;
      } else {
        // Launch the spaceship
        spaceship.launched = true;
        spaceship.launchAnimation = 0;
        spaceship.progress = 0;
        spaceship.direction = 1;
        spaceship.shieldPulse = 0;
        spaceship.trail = [];
        spaceship.engineParticles = [];
        const startX = config.solarSystem1.x * W;
        const startY = config.solarSystem1.y * H;
        for (let i = 0; i < config.spaceship.trailLength; i++) {
          spaceship.trail.push({ x: startX, y: startY, alpha: 0 });
        }
        return true;
      }
    },

    isSpaceshipLaunched() {
      return spaceship.launched;
    },

    destroy() {
      this.stop();
      window.removeEventListener('resize', handleResize);
      canvas = null;
      ctx = null;
      planets1 = [];
      planets2 = [];
      asteroids1 = [];
      asteroids2 = [];
      shootingStars = [];
      stars = [];
      spaceship = { progress: 0, direction: 1, x: 0, y: 0, angle: 0, trail: [], engineParticles: [], launched: false, launchAnimation: 0, shieldPulse: 0 };

      // Clean up cosmic enhancement state
      galaxies = [];
      dustLanes = [];
      deepSkyObjects = [];
      satellites = [];
      milkyWayStars = [];
      meteorShower = { active: false, radiantX: 0, radiantY: 0, intensity: 0, duration: 0, elapsed: 0 };
      mouseX = 0;
      mouseY = 0;
      targetMouseX = 0;
      targetMouseY = 0;
    }
  };
})();

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightCanvas;
}
