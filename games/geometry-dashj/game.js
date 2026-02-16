const gameWrapEl = document.getElementById("gameWrap");
const canvas = document.getElementById("game");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const hintEl = document.getElementById("hint");
const restartBtn = document.getElementById("restartBtn");

if (gameWrapEl) gameWrapEl.classList.remove("hidden");
{
  const ctx = canvas.getContext("2d");
  const world = {
    baseSpeed: 360,
    speed: 360,
    gravity: 2100,
    jumpPower: 780,
    score: 0,
    best: Number(localStorage.getItem("dashjBest") || 0),
    over: false,
    started: false
  };

  const player = {
    x: 120,
    y: 0,
    vy: 0,
    w: 30,
    h: 30
  };

  const groundY = canvas.height - 60;
  const spikes = [];
  let spawnTimer = 0;
  let last = performance.now();

  function resetPlayer() {
    player.y = groundY - player.h;
    player.vy = 0;
  }

  function spawnSpike(offsetX = 0, sizeOverride = null) {
    const size = sizeOverride ?? 24 + Math.random() * 20;
    spikes.push({
      x: canvas.width + size + offsetX,
      y: groundY,
      w: size,
      h: size
    });
  }

  function spawnPattern() {
    const size = 24 + Math.random() * 18;
    const roll = Math.random();

    // Much harder: many doubles/triples as score rises.
    if (roll < 0.45) {
      spawnSpike(0, size);
      return;
    }
    if (roll < 0.82) {
      const gap = 35 + Math.random() * 18;
      spawnSpike(0, size);
      spawnSpike(gap, 20 + Math.random() * 16);
      return;
    }
    const gap1 = 30 + Math.random() * 14;
    const gap2 = gap1 + 28 + Math.random() * 16;
    spawnSpike(0, size);
    spawnSpike(gap1, 18 + Math.random() * 14);
    spawnSpike(gap2, 18 + Math.random() * 14);
  }

  function rectHit(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y &&
      a.y + a.h > b.y - b.h
    );
  }

  function jump() {
    if (world.over) return;
    const onGround = player.y >= groundY - player.h - 1;
    if (onGround) {
      player.vy = -world.jumpPower;
      world.started = true;
    }
  }

  function endGame() {
    world.over = true;
    world.best = Math.max(world.best, Math.floor(world.score));
    localStorage.setItem("dashjBest", String(world.best));
    bestEl.textContent = String(world.best);
    hintEl.textContent = "Crashed! Try again.";
    restartBtn.classList.remove("hidden");
  }

  function restart() {
    spikes.length = 0;
    world.score = 0;
    world.over = false;
    world.started = false;
    spawnTimer = 0.45;
    hintEl.textContent = "Tap / Space / ↑ to jump";
    restartBtn.classList.add("hidden");
    scoreEl.textContent = "0";
    world.speed = world.baseSpeed;
    resetPlayer();
  }

  function drawSpike(spike) {
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y);
    ctx.lineTo(spike.x + spike.w * 0.5, spike.y - spike.h);
    ctx.lineTo(spike.x + spike.w, spike.y);
    ctx.closePath();
    ctx.fillStyle = "#e03131";
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#74c0fc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#37b24d";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    ctx.fillStyle = "#8d5524";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    for (const spike of spikes) drawSpike(spike);
  }

  function update(dt) {
    if (world.over) return;

    if (world.started) {
      world.score += dt * 10;
      scoreEl.textContent = String(Math.floor(world.score));
      world.speed = world.baseSpeed + Math.min(220, world.score * 1.9);

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnPattern();
        const pressure = Math.min(0.2, world.score * 0.0015);
        spawnTimer = 0.4 + Math.random() * 0.42 - pressure;
      }

      for (let i = spikes.length - 1; i >= 0; i -= 1) {
        spikes[i].x -= world.speed * dt;
        if (spikes[i].x + spikes[i].w < -20) spikes.splice(i, 1);
      }
    }

    player.vy += world.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0;
    }

    for (const spike of spikes) {
      if (rectHit(player, spike)) {
        endGame();
        break;
      }
    }
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === " " || key === "arrowup" || key === "w") {
      e.preventDefault();
      jump();
    }
  });

  canvas.addEventListener("pointerdown", () => jump());
  restartBtn.addEventListener("click", restart);
  bestEl.textContent = String(world.best);
  resetPlayer();
  requestAnimationFrame(loop);
}
