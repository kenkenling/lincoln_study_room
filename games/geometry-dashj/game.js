const lockedEl = document.getElementById("locked");
const gameWrapEl = document.getElementById("gameWrap");
const canvas = document.getElementById("game");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const hintEl = document.getElementById("hint");
const restartBtn = document.getElementById("restartBtn");

const unlocked = localStorage.getItem("jungleDashCompleted") === "true";
if (!unlocked) {
  lockedEl.classList.remove("hidden");
} else {
  gameWrapEl.classList.remove("hidden");
}

if (!unlocked) {
  // Locked state only; stop here.
} else {
  const ctx = canvas.getContext("2d");
  const world = {
    speed: 290,
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

  function spawnSpike() {
    const size = 24 + Math.random() * 18;
    spikes.push({
      x: canvas.width + size,
      y: groundY,
      w: size,
      h: size
    });
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
    spawnTimer = 0.7;
    hintEl.textContent = "Tap / Space / ↑ to jump";
    restartBtn.classList.add("hidden");
    scoreEl.textContent = "0";
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

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnSpike();
        spawnTimer = 0.62 + Math.random() * 0.65;
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
