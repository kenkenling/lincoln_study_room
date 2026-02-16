import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const canvas = document.getElementById("gameCanvas");
const statusEl = document.getElementById("status");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayTextEl = document.getElementById("overlayText");
const playAgainBtn = document.getElementById("playAgainBtn");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnJump = document.getElementById("btnJump");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9edfff);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(20, 13, 24);
camera.lookAt(20, 5, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(12, 25, 18);
scene.add(sun);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const playerSize = { w: 1, h: 1, d: 1 };
const player = new THREE.Mesh(
  new THREE.BoxGeometry(playerSize.w, playerSize.h, playerSize.d),
  new THREE.MeshLambertMaterial({ color: 0x8d5524 })
);
player.castShadow = false;
worldRoot.add(player);

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateLevel(levelIndex) {
  const rng = createRng((levelIndex + 1) * 98731);
  const levelLength = 92 + levelIndex * 2.6;
  const platforms = [{ x: levelLength * 0.5, y: -1, w: levelLength, h: 2 }];
  const trackPlatforms = [];

  let cursorX = 4.5;
  let topY = 1.3 + Math.min(levelIndex * 0.05, 1.3);
  const stepCount = 18 + Math.floor(levelIndex * 0.8);

  for (let i = 0; i < stepCount && cursorX < levelLength - 6.5; i += 1) {
    const width = THREE.MathUtils.clamp(4.8 - levelIndex * 0.07 + rng() * 2.2, 1.2, 5.6);
    const height = THREE.MathUtils.clamp(0.55 + rng() * 1.25, 0.55, 1.8);
    const gap = 1.6 + rng() * 1.45 + Math.min(levelIndex * 0.04, 1.3);
    cursorX += gap + width * 0.5;

    const verticalJitter = (rng() - 0.5) * (1.2 + Math.min(levelIndex * 0.02, 0.9)) + 0.25;
    topY = THREE.MathUtils.clamp(topY + verticalJitter, 1.2, 8.2);
    const platform = { x: cursorX, y: topY - height * 0.5, w: width, h: height };
    platforms.push(platform);
    trackPlatforms.push(platform);
    cursorX += width * 0.5;
  }

  if (trackPlatforms.length === 0 || trackPlatforms[trackPlatforms.length - 1].x < levelLength - 7) {
    const fallback = { x: levelLength - 5.5, y: Math.max(1, topY - 0.2), w: 3.3, h: 1 };
    platforms.push(fallback);
    trackPlatforms.push(fallback);
  }

  const alligators = [];
  const desiredHazards = Math.min(5 + Math.floor(levelIndex / 4), 10);
  const candidateIndices = [];
  for (let i = 1; i <= trackPlatforms.length - 2; i += 1) {
    candidateIndices.push(i);
  }
  for (let i = candidateIndices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = candidateIndices[i];
    candidateIndices[i] = candidateIndices[j];
    candidateIndices[j] = temp;
  }
  const hazardCount = Math.min(desiredHazards, candidateIndices.length);
  for (let i = 0; i < hazardCount; i += 1) {
    const platform = trackPlatforms[candidateIndices[i]];
    if (!platform) continue;
    const offsetRange = Math.max(0.5, platform.w * 0.5 - 0.65);
    const hx = platform.x + (rng() * 2 - 1) * offsetRange;
    const hy = platform.y + platform.h * 0.5 + 0.45;
    alligators.push({
      x: hx,
      y: hy,
      spawnX: hx,
      spawnY: hy,
      w: 0.95 + rng() * 0.4,
      h: 0.8,
      d: 2.2,
      chaseSpeed: 4.2 + rng() * 1.4 + Math.min(levelIndex * 0.05, 1.1),
      jumpPower: 14.5,
      jumpCooldown: 0.16 + rng() * 0.2,
      jumpTimer: 0,
      jumpsUsed: 0,
      behaviorSeed: rng() * Math.PI * 2,
      comfortDist: 1.8 + rng() * 1.6,
      intentDir: 0,
      vy: 0,
      grounded: false
    });
  }

  const checkpoints = [];
  const midPlatform = trackPlatforms[Math.floor(trackPlatforms.length * 0.45)];
  const latePlatform = trackPlatforms[Math.floor(trackPlatforms.length * 0.75)];
  if (midPlatform) {
    checkpoints.push({
      x: midPlatform.x,
      y: midPlatform.y + midPlatform.h * 0.5 + 0.75,
      w: 1,
      h: 1.5
    });
  }
  if (levelIndex >= 12 && latePlatform) {
    checkpoints.push({
      x: latePlatform.x,
      y: latePlatform.y + latePlatform.h * 0.5 + 0.75,
      w: 1,
      h: 1.5
    });
  }

  const birds = [];
  const birdCount = Math.min(3 + Math.floor(levelIndex / 4), 9);
  for (let i = 0; i < birdCount; i += 1) {
    const refPlatform = trackPlatforms[Math.floor(rng() * trackPlatforms.length)] || trackPlatforms[0];
    if (!refPlatform) continue;
    const startX = Math.max(8, refPlatform.x + 5 + rng() * 6);
    const startY = THREE.MathUtils.clamp(
      refPlatform.y + refPlatform.h * 0.5 + 2 + rng() * 2.8,
      4,
      12
    );
    birds.push({
      x: startX,
      y: startY,
      w: 0.95,
      h: 0.7,
      d: 1.6,
      speed: 3.4 + rng() * 1.6 + Math.min(levelIndex * 0.06, 1.8),
      drift: 0.55 + rng() * 0.45,
      driftRate: 1.4 + rng() * 1.2,
      phase: rng() * Math.PI * 2
    });
  }

  let bananaPlatform = trackPlatforms[Math.max(1, trackPlatforms.length - 2)] || trackPlatforms[0];
  if (levelIndex === 5 && trackPlatforms.length > 2) {
    bananaPlatform = trackPlatforms[Math.max(1, trackPlatforms.length - 3)];
  }
  const finishPlatform = trackPlatforms[trackPlatforms.length - 1] || trackPlatforms[0];

  let banana = {
    x: bananaPlatform.x,
    y: bananaPlatform.y + bananaPlatform.h * 0.5 + 1.15,
    r: 0.5
  };

  function overlapsCheckpoint(hazard) {
    for (const checkpoint of checkpoints) {
      const dx = Math.abs(hazard.x - checkpoint.x);
      const dy = Math.abs(hazard.y - checkpoint.y);
      const safeX = (hazard.w + checkpoint.w) * 0.5 + 0.45;
      const safeY = (hazard.h + checkpoint.h) * 0.5 + 0.45;
      if (dx < safeX && dy < safeY) return true;
    }
    return false;
  }

  function makeAlligatorOnPlatform(platform, sideSign = 0) {
    const offsetRange = Math.max(0.45, platform.w * 0.5 - 0.65);
    const offset =
      sideSign === 0
        ? (rng() * 2 - 1) * offsetRange
        : sideSign * Math.min(offsetRange, 0.9);
    const hx = platform.x + offset;
    const hy = platform.y + platform.h * 0.5 + 0.45;
    return {
      x: hx,
      y: hy,
      spawnX: hx,
      spawnY: hy,
      w: 0.95 + rng() * 0.4,
      h: 0.8,
      d: 2.2,
      chaseSpeed: 4.2 + rng() * 1.4 + Math.min(levelIndex * 0.05, 1.1),
      jumpPower: 14.5,
      jumpCooldown: 0.16 + rng() * 0.2,
      jumpTimer: 0,
      jumpsUsed: 0,
      behaviorSeed: rng() * Math.PI * 2,
      comfortDist: 1.8 + rng() * 1.6,
      intentDir: 0,
      vy: 0,
      grounded: false
    };
  }

  const guardPlatforms = [...trackPlatforms]
    .filter((p) => p !== finishPlatform)
    .sort((a, b) => Math.abs(a.x - bananaPlatform.x) - Math.abs(b.x - bananaPlatform.x))
    .slice(0, 6);

  function countBananaGuards() {
    let count = 0;
    for (const hazard of alligators) {
      const nearBanana = Math.abs(hazard.x - banana.x) < 5.2 && Math.abs(hazard.y - banana.y) < 3;
      if (nearBanana) count += 1;
    }
    return count;
  }

  let guardIndex = 0;
  let guardSide = -1;
  while (countBananaGuards() < 2 && guardIndex < 14) {
    const platform = guardPlatforms[guardIndex % guardPlatforms.length] || bananaPlatform;
    const guard = makeAlligatorOnPlatform(platform, guardSide);
    if (!overlapsCheckpoint(guard)) alligators.push(guard);
    guardSide *= -1;
    guardIndex += 1;
  }

  // Global safety rule: no alligator can overlap checkpoint zones.
  for (let i = alligators.length - 1; i >= 0; i -= 1) {
    if (overlapsCheckpoint(alligators[i])) alligators.splice(i, 1);
  }

  // Guarantee at least two banana guards after checkpoint filtering.
  while (countBananaGuards() < 2 && guardIndex < 22) {
    const platform = guardPlatforms[guardIndex % guardPlatforms.length] || bananaPlatform;
    const guard = makeAlligatorOnPlatform(platform, guardSide);
    if (!overlapsCheckpoint(guard)) alligators.push(guard);
    guardSide *= -1;
    guardIndex += 1;
  }

  return {
    spawn: { x: 2.4, y: 2.5 },
    levelMaxX: levelLength - 0.5,
    platforms,
    alligators,
    birds,
    checkpoints,
    banana,
    finish: {
      x: finishPlatform.x + 1.3,
      y: finishPlatform.y + finishPlatform.h * 0.5 + 0.9,
      w: 1.6,
      h: 1.6
    }
  };
}

const levels = Array.from({ length: 25 }, (_, i) => generateLevel(i));

const active = {
  platforms: [],
  alligators: [],
  birds: [],
  checkpoints: [],
  banana: null,
  finish: null
};

const keys = { left: false, right: false, jump: false, jumpQueued: false };
const playerState = {
  vx: 0,
  vy: 0,
  grounded: false,
  jumpsUsed: 0,
  checkpoint: { x: 0, y: 0 },
  currentLevel: 0,
  bananaCollected: false,
  birdsStompedThisLevel: 0,
  finishLockedTimer: 0,
  levelMaxX: 39.5,
  stillTimer: 0,
  score: 0
};

const movement = {
  speed: 7.8,
  jumpSpeed: 14.5,
  gravity: -31
};

function addBox(data, color) {
  const depth = data.d ?? 2.6;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(data.w, data.h, depth),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(data.x, data.y, 0);
  worldRoot.add(mesh);
  return {
    mesh,
    x: data.x,
    y: data.y,
    z: 0,
    w: data.w,
    h: data.h,
    d: depth,
    touched: false,
    moveMinX: data.moveMinX,
    moveMaxX: data.moveMaxX,
    moveSpeed: data.moveSpeed,
    moveDir: data.moveDir,
    spawnX: data.spawnX,
    spawnY: data.spawnY,
    chaseSpeed: data.chaseSpeed,
    jumpPower: data.jumpPower,
    jumpCooldown: data.jumpCooldown,
    jumpTimer: data.jumpTimer,
    jumpsUsed: data.jumpsUsed,
    behaviorSeed: data.behaviorSeed,
    comfortDist: data.comfortDist,
    intentDir: data.intentDir,
    vy: data.vy,
    grounded: data.grounded
  };
}

function addBanana(data) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(data.r ?? 0.5, 18, 14),
    new THREE.MeshLambertMaterial({ color: 0xffd43b })
  );
  mesh.position.set(data.x, data.y, 0);
  worldRoot.add(mesh);
  const size = (data.r ?? 0.5) * 1.9;
  return {
    mesh,
    x: data.x,
    y: data.y,
    baseY: data.y,
    z: 0,
    w: size,
    h: size,
    d: size
  };
}

function addBird(data) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(data.w ?? 0.95, data.h ?? 0.7, data.d ?? 1.6),
    new THREE.MeshLambertMaterial({ color: 0x2d6cdf })
  );
  mesh.position.set(data.x, data.y, 0);
  worldRoot.add(mesh);
  return {
    mesh,
    x: data.x,
    y: data.y,
    spawnX: data.x,
    spawnY: data.y,
    z: 0,
    w: data.w ?? 0.95,
    h: data.h ?? 0.7,
    d: data.d ?? 1.6,
    speed: data.speed ?? 2.5,
    drift: data.drift ?? 0.7,
    driftRate: data.driftRate ?? 1.8,
    phase: data.phase ?? 0
  };
}

function clearLevel() {
  const all = [
    ...active.platforms,
    ...active.alligators,
    ...active.birds,
    ...active.checkpoints,
    active.banana,
    active.finish
  ].filter(Boolean);
  for (const item of all) worldRoot.remove(item.mesh);
  active.platforms = [];
  active.alligators = [];
  active.birds = [];
  active.checkpoints = [];
  active.banana = null;
  active.finish = null;
}

function loadLevel(index) {
  clearLevel();
  playerState.currentLevel = index;
  const level = levels[index];
  active.platforms = level.platforms.map((p) => addBox(p, 0x6e6e6e));
  active.alligators = level.alligators.map((h) => addBox(h, 0x2f9e44));
  active.birds = level.birds.map((b) => addBird(b));
  active.checkpoints = level.checkpoints.map((c) => addBox(c, 0xf2c94c));
  active.banana = addBanana(level.banana);
  active.finish = addBox(level.finish, 0xffd166);
  playerState.levelMaxX = level.levelMaxX ?? 39.5;
  playerState.bananaCollected = false;
  playerState.birdsStompedThisLevel = 0;
  playerState.finishLockedTimer = 0;
  setCheckpoint(level.spawn.x, level.spawn.y);
  respawn();
  hideOverlay();
  updateStatus();
}

function setCheckpoint(x, y) {
  playerState.checkpoint.x = x;
  playerState.checkpoint.y = y;
}

function respawn() {
  player.position.set(playerState.checkpoint.x, playerState.checkpoint.y, 0);
  playerState.vx = 0;
  playerState.vy = 0;
  playerState.grounded = false;
  playerState.jumpsUsed = 0;
}

function getPlayerBoxAt(x, y) {
  return { x, y, z: 0, ...playerSize };
}

function intersects(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h &&
    Math.abs(a.z - b.z) * 2 < a.d + b.d
  );
}

function hasPlatformSupportAt(entity, x, y) {
  const footY = y - entity.h * 0.5;
  for (const p of active.platforms) {
    const top = p.y + p.h * 0.5;
    const closeToTop = Math.abs(footY - top) < 0.36;
    const insideWidth = Math.abs(x - p.x) * 2 < p.w + entity.w * 0.6;
    if (closeToTop && insideWidth) return true;
  }
  return false;
}

function updateStatus() {
  const bananaText = playerState.bananaCollected ? "Banana: collected" : "Banana: missing";
  const birdText =
    playerState.birdsStompedThisLevel > 0 ? "Bird: defeated" : "Bird: defeat 1";
  const gateText = playerState.finishLockedTimer > 0 ? " | Need banana + 1 bird" : "";
  statusEl.textContent = `Level ${playerState.currentLevel + 1} / ${levels.length} | Score: ${playerState.score} | ${bananaText} | ${birdText}${gateText}`;
}

function showOverlay(title, text) {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

function nextLevel() {
  if (playerState.currentLevel + 1 < levels.length) {
    loadLevel(playerState.currentLevel + 1);
    updateStatus();
    return;
  }
  showOverlay("🏆 You Win!", "Lincoln Wins the Golden Banana!");
}

function tickPhysics(dt) {
  if (playerState.finishLockedTimer > 0) {
    playerState.finishLockedTimer = Math.max(0, playerState.finishLockedTimer - dt);
    if (playerState.finishLockedTimer === 0) updateStatus();
  }

  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  playerState.vx = dir * movement.speed;
  if (keys.jumpQueued && (playerState.grounded || playerState.jumpsUsed < 2)) {
    playerState.vy = movement.jumpSpeed;
    playerState.grounded = false;
    playerState.jumpsUsed += 1;
  }
  keys.jumpQueued = false;

  playerState.vy += movement.gravity * dt;

  let nextX = player.position.x + playerState.vx * dt;
  let nextY = player.position.y;
  const currentY = player.position.y;

  let playerBox = getPlayerBoxAt(nextX, nextY);
  for (const p of active.platforms) {
    if (!intersects(playerBox, p)) continue;
    const verticalOverlap = Math.abs(currentY - p.y);
    const sideThreshold = (p.h + playerSize.h) * 0.5 - 0.03;
    // Prevent "direction flip" on thin platforms when standing on top.
    if (verticalOverlap >= sideThreshold) continue;
    if (playerState.vx > 0) nextX = p.x - (p.w + playerSize.w) * 0.5;
    if (playerState.vx < 0) nextX = p.x + (p.w + playerSize.w) * 0.5;
    playerBox = getPlayerBoxAt(nextX, nextY);
  }

  nextY = currentY + playerState.vy * dt;
  playerBox = getPlayerBoxAt(nextX, nextY);
  playerState.grounded = false;

  for (const p of active.platforms) {
    if (!intersects(playerBox, p)) continue;
    if (playerState.vy <= 0 && currentY >= p.y) {
      nextY = p.y + (p.h + playerSize.h) * 0.5;
      playerState.vy = 0;
      playerState.grounded = true;
      playerState.jumpsUsed = 0;
    } else if (playerState.vy > 0 && currentY < p.y) {
      nextY = p.y - (p.h + playerSize.h) * 0.5;
      playerState.vy = 0;
    }
    playerBox = getPlayerBoxAt(nextX, nextY);
  }

  if (nextY < -8) {
    respawn();
    return;
  }

  player.position.x = THREE.MathUtils.clamp(nextX, 0.5, playerState.levelMaxX);
  player.position.y = nextY;

  const box = getPlayerBoxAt(player.position.x, player.position.y);
  for (let i = active.alligators.length - 1; i >= 0; i -= 1) {
    const hazard = active.alligators[i];
    if (!intersects(box, hazard)) continue;
    const stomped =
      playerState.vy < -1.2 &&
      player.position.y > hazard.y + hazard.h * 0.25;
    if (stomped) {
      worldRoot.remove(hazard.mesh);
      active.alligators.splice(i, 1);
      playerState.score += 50;
      playerState.vy = Math.max(playerState.vy, movement.jumpSpeed * 0.4);
      updateStatus();
      continue;
    }
    respawn();
    return;
  }

  for (let i = active.birds.length - 1; i >= 0; i -= 1) {
    const bird = active.birds[i];
    if (!intersects(box, bird)) continue;
    const stomped =
      playerState.vy < -1.2 &&
      player.position.y > bird.y + bird.h * 0.25;
    if (stomped) {
      worldRoot.remove(bird.mesh);
      active.birds.splice(i, 1);
      playerState.score += 100;
      playerState.birdsStompedThisLevel += 1;
      playerState.vy = Math.max(playerState.vy, movement.jumpSpeed * 0.45);
      updateStatus();
      continue;
    }
    respawn();
    return;
  }

  for (const checkpoint of active.checkpoints) {
    if (intersects(box, checkpoint) && !checkpoint.touched) {
      checkpoint.touched = true;
      checkpoint.mesh.material.color.setHex(0x5ee173);
      setCheckpoint(checkpoint.x, checkpoint.y + 1.2);
    }
  }

  if (active.banana && intersects(box, active.banana)) {
    worldRoot.remove(active.banana.mesh);
    active.banana = null;
    playerState.bananaCollected = true;
    updateStatus();
  }

  if (intersects(box, active.finish)) {
    const canFinish = playerState.bananaCollected && playerState.birdsStompedThisLevel > 0;
    if (canFinish) {
      nextLevel();
      return;
    }
    playerState.finishLockedTimer = 1.1;
    updateStatus();
  }

  const idleInput = !keys.left && !keys.right && !keys.jump;
  const nearlyStill = Math.abs(playerState.vx) < 0.08 && Math.abs(playerState.vy) < 0.15;
  if (idleInput && nearlyStill && playerState.grounded) {
    playerState.stillTimer += dt;
  } else {
    playerState.stillTimer = 0;
  }
}

function updateAlligators(dt, nowMs) {
  const t = nowMs * 0.001;
  for (const hazard of active.alligators) {
    if (hazard.vy === undefined) hazard.vy = 0;
    if (hazard.grounded === undefined) hazard.grounded = false;
    if (hazard.jumpTimer === undefined) hazard.jumpTimer = 0;
    if (hazard.jumpsUsed === undefined) hazard.jumpsUsed = 0;
    if (hazard.stuckTimer === undefined) hazard.stuckTimer = 0;
    if (hazard.intentDir === undefined) hazard.intentDir = 0;
    if (hazard.comfortDist === undefined) hazard.comfortDist = 2.2;

    const dxToPlayer = player.position.x - hazard.x;
    const dyToPlayer = player.position.y - hazard.y;
    const seesPlayer = Math.abs(dxToPlayer) < 22 && Math.abs(dyToPlayer) < 7.5;
    const flankSign = Math.sin((hazard.behaviorSeed ?? 0) + t * 0.35) >= 0 ? 1 : -1;
    const standOffX = player.position.x - flankSign * hazard.comfortDist;
    const roamX = (hazard.spawnX ?? hazard.x) + Math.sin(t * 0.65 + (hazard.behaviorSeed ?? 0)) * 2.1;
    let desiredX = seesPlayer ? standOffX : roamX;
    let forceClimb = false;

    const onGroundFloor = hazard.grounded && hazard.y < 0.8;
    const playerAlsoOnGround = playerState.grounded && player.position.y < 1.2;
    if (onGroundFloor && !playerAlsoOnGround) {
      let bestPlatform = null;
      let bestDistance = Infinity;
      for (const p of active.platforms) {
        const top = p.y + p.h * 0.5;
        if (top <= 1.0) continue;
        const distance = Math.abs(p.x - hazard.x);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPlatform = p;
        }
      }
      if (bestPlatform) {
        desiredX = bestPlatform.x;
        forceClimb = true;
      }
    }
    const desiredDir = desiredX > hazard.x + 0.25 ? 1 : desiredX < hazard.x - 0.25 ? -1 : 0;
    const smooth = Math.min(1, dt * 7.5);
    hazard.intentDir += (desiredDir - hazard.intentDir) * smooth;

    const baseSpeed = hazard.chaseSpeed ?? 4.8;
    const speedScale = seesPlayer ? 1 : 0.55;
    const speed = baseSpeed * speedScale;
    let nextX = hazard.x + hazard.intentDir * speed * dt;
    const currentY = hazard.y;
    let nextY = currentY;
    let blockedHoriz = false;

    let hazardBox = { x: nextX, y: nextY, z: 0, w: hazard.w, h: hazard.h, d: hazard.d };
    for (const p of active.platforms) {
      if (!intersects(hazardBox, p)) continue;
      const verticalOverlap = Math.abs(currentY - p.y);
      const sideThreshold = (p.h + hazard.h) * 0.5 - 0.03;
      // Ignore floor contact so standing on a block doesn't count as horizontal blockage.
      if (verticalOverlap >= sideThreshold) continue;
      if (hazard.intentDir > 0.08) {
        nextX = p.x - (p.w + hazard.w) * 0.5;
        blockedHoriz = true;
      }
      if (hazard.intentDir < -0.08) {
        nextX = p.x + (p.w + hazard.w) * 0.5;
        blockedHoriz = true;
      }
      hazardBox = { x: nextX, y: nextY, z: 0, w: hazard.w, h: hazard.h, d: hazard.d };
    }

    // Edge safety: if standing on elevated platforms, avoid stepping into a fall.
    if (hazard.grounded && hazard.y > 1.0) {
      const hasSupportNow = hasPlatformSupportAt(hazard, hazard.x, hazard.y);
      const hasSupportNext = hasPlatformSupportAt(hazard, nextX, hazard.y);
      if (hasSupportNow && !hasSupportNext) {
        nextX = hazard.x;
        blockedHoriz = true;
      }
    }

    hazard.jumpTimer = Math.max(0, hazard.jumpTimer - dt);
    const playerIsHigher = player.position.y > hazard.y + 0.85;
    const closeToPlayer = Math.abs(dxToPlayer) < 4.1;
    const alignedForClimb = forceClimb && Math.abs(desiredX - hazard.x) < 2.4;
    const needsClimbJump = (playerIsHigher && closeToPlayer) || alignedForClimb;
    const wantsJump = blockedHoriz || needsClimbJump;
    // Jump only when needed, and only from ground for stable behavior.
    if (wantsJump && hazard.jumpTimer === 0 && hazard.grounded) {
      hazard.vy = hazard.jumpPower ?? 14.5;
      hazard.grounded = false;
      hazard.jumpTimer = Math.max(0.26, hazard.jumpCooldown ?? 0.28);
      hazard.jumpsUsed += 1;
    }

    hazard.vy += movement.gravity * dt;
    nextY = currentY + hazard.vy * dt;
    hazardBox = { x: nextX, y: nextY, z: 0, w: hazard.w, h: hazard.h, d: hazard.d };
    hazard.grounded = false;

    for (const p of active.platforms) {
      if (!intersects(hazardBox, p)) continue;
      if (hazard.vy <= 0 && currentY >= p.y) {
        nextY = p.y + (p.h + hazard.h) * 0.5;
        hazard.vy = 0;
        hazard.grounded = true;
        hazard.jumpsUsed = 0;
      } else if (hazard.vy > 0 && currentY < p.y) {
        nextY = p.y - (p.h + hazard.h) * 0.5;
        hazard.vy = 0;
      }
      hazardBox = { x: nextX, y: nextY, z: 0, w: hazard.w, h: hazard.h, d: hazard.d };
    }

    if (nextY < -10) {
      hazard.x = hazard.spawnX ?? hazard.x;
      hazard.y = hazard.spawnY ?? hazard.y;
      hazard.vy = 0;
      hazard.grounded = false;
      hazard.jumpsUsed = 0;
      hazard.stuckTimer = 0;
    } else {
      hazard.x = THREE.MathUtils.clamp(nextX, 0.5, playerState.levelMaxX);
      hazard.y = nextY;
    }

    hazard.mesh.position.x = hazard.x;
    hazard.mesh.position.y = hazard.y;
  }
}

function updateBirds(dt, nowMs) {
  const t = nowMs * 0.001;
  const playerIsIdle = playerState.stillTimer > 0.35;
  for (const bird of active.birds) {
    const targetX = playerIsIdle ? bird.spawnX : player.position.x;
    const baseTargetY = playerIsIdle ? bird.spawnY : player.position.y + 1.5;
    const targetY = THREE.MathUtils.clamp(
      baseTargetY + Math.sin(t * bird.driftRate + bird.phase) * bird.drift,
      2.5,
      13
    );
    const dx = targetX - bird.x;
    const dy = targetY - bird.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0.001) {
      const step = Math.min(distance, bird.speed * dt);
      bird.x += (dx / distance) * step;
      bird.y += (dy / distance) * step;
    }
    bird.mesh.position.x = bird.x;
    bird.mesh.position.y = bird.y;
  }
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "a" || key === "arrowleft") keys.left = true;
  if (key === "d" || key === "arrowright") keys.right = true;
  if (key === "w" || key === "arrowup" || key === " ") {
    keys.jump = true;
    if (!e.repeat) keys.jumpQueued = true;
  }
  if (key === "r") {
    loadLevel(playerState.currentLevel);
    updateStatus();
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (key === "a" || key === "arrowleft") keys.left = false;
  if (key === "d" || key === "arrowright") keys.right = false;
  if (key === "w" || key === "arrowup" || key === " ") {
    keys.jump = false;
    keys.jumpQueued = false;
  }
});

function bindTouchButton(button, onDown, onUp) {
  if (!button) return;
  const handleDown = (e) => {
    e.preventDefault();
    onDown();
  };
  const handleUp = (e) => {
    e.preventDefault();
    onUp();
  };
  button.addEventListener("pointerdown", handleDown, { passive: false });
  button.addEventListener("pointerup", handleUp, { passive: false });
  button.addEventListener("pointercancel", handleUp, { passive: false });
  button.addEventListener("pointerleave", handleUp, { passive: false });
}

bindTouchButton(
  btnLeft,
  () => {
    keys.left = true;
  },
  () => {
    keys.left = false;
  }
);

bindTouchButton(
  btnRight,
  () => {
    keys.right = true;
  },
  () => {
    keys.right = false;
  }
);

bindTouchButton(
  btnJump,
  () => {
    keys.jump = true;
    keys.jumpQueued = true;
  },
  () => {
    keys.jump = false;
  }
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

playAgainBtn.addEventListener("click", () => {
  playerState.score = 0;
  loadLevel(0);
});

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  updateAlligators(dt, now);
  updateBirds(dt, now);
  const targetCamX = THREE.MathUtils.clamp(player.position.x + 9, 20, playerState.levelMaxX - 6);
  camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 4.5);
  camera.lookAt(camera.position.x, 5, 0);
  if (active.banana) {
    active.banana.mesh.rotation.y += dt * 2.5;
    active.banana.mesh.position.y = active.banana.baseY + Math.sin(now * 0.006) * 0.15;
  }
  if (overlayEl.classList.contains("hidden")) tickPhysics(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loadLevel(0);
requestAnimationFrame(loop);
