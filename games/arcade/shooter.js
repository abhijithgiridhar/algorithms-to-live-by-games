window.ArcadeShooter = (function () {
  let ctx, canvas, raf, running = false;
  let ship, bullets, enemies, divers, fireTimer, spawnTimer, diverTimer, elapsed;
  let onScore, onLives, lives;
  let keys = {};
  let pointerX = null;
  let hitFlash = 0;
  let tuning;

  const W = 800, H = 500;

  // base: the original, easygoing version everyone plays by default.
  // hard: the "bandit challenge" tuning -- divers track and swarm harder, but
  // never so hard that a careful player is locked out of scoring entirely.
  const TUNING = {
    base: {
      diverStartTimer: 90, diverFloor: 48, diverSpawnK: 90,
      diverBaseSpeed: 2.4, diverSpeedRamp: 1800, diverSpeedCap: 2.0,
      homing: 0.02, padding: 3, pairChance: 0, pairAfter: Infinity,
    },
    hard: {
      diverStartTimer: 70, diverFloor: 40, diverSpawnK: 120,
      diverBaseSpeed: 3.0, diverSpeedRamp: 700, diverSpeedCap: 2.6,
      homing: 0.035, padding: 6, pairChance: 0.25, pairAfter: 500,
    },
  };

  function reset(startingLives) {
    ship = { x: W / 2, w: 40, h: 24 };
    bullets = [];
    enemies = [];
    divers = [];
    fireTimer = 0;
    spawnTimer = 0;
    diverTimer = tuning.diverStartTimer;
    elapsed = 0;
    hitFlash = 0;
    lives = startingLives;
    onLives(lives);
  }

  function spawnEnemy() {
    enemies.push({ x: 30 + Math.random() * (W - 60), y: -20, w: 28, h: 22, vy: 1.2 + Math.random() * 1.3 });
  }

  function spawnDiver() {
    const vy = tuning.diverBaseSpeed + Math.min(tuning.diverSpeedCap, elapsed / tuning.diverSpeedRamp);
    divers.push({ x: Math.random() * W, y: -20, w: 24, h: 24, vy });
    // once things have been going a while, sometimes send a second diver right behind the first
    if (elapsed > tuning.pairAfter && Math.random() < tuning.pairChance) {
      divers.push({ x: Math.random() * W, y: -70, w: 24, h: 24, vy });
    }
  }

  function loseLife() {
    lives -= 1;
    hitFlash = 50;
    onLives(lives);
    if (lives <= 0) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  function update() {
    elapsed += 1;
    if (hitFlash > 0) hitFlash -= 1;

    if (keys.ArrowLeft) ship.x -= 6;
    if (keys.ArrowRight) ship.x += 6;
    if (pointerX !== null) ship.x += (pointerX - ship.x) * 0.2;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));

    fireTimer -= 1;
    if (fireTimer <= 0) {
      bullets.push({ x: ship.x, y: H - 60 });
      fireTimer = 18;
    }

    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(18, 45 - elapsed / 200);
    }

    diverTimer -= 1;
    if (diverTimer <= 0) {
      spawnDiver();
      diverTimer = Math.max(tuning.diverFloor, tuning.diverSpawnK - elapsed / 120);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= 9;
      if (bullets[i].y < -10) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.vy;
      if (e.y > H + 20) {
        enemies.splice(i, 1);
        continue;
      }
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x > e.x - e.w / 2 && b.x < e.x + e.w / 2 && b.y > e.y - e.h / 2 && b.y < e.y + e.h / 2) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          onScore(1);
          break;
        }
      }
    }

    const shipTop = H - 85, shipBottom = H - 40, shipLeft = ship.x - ship.w / 2 - tuning.padding, shipRight = ship.x + ship.w / 2 + tuning.padding;
    for (let i = divers.length - 1; i >= 0; i--) {
      const d = divers[i];
      d.y += d.vy;
      // homes in on the ship's current x -- has to actually be dodged, not just outrun
      d.x += (ship.x - d.x) * tuning.homing;

      let hit = false;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x > d.x - d.w / 2 && b.x < d.x + d.w / 2 && b.y > d.y - d.h / 2 && b.y < d.y + d.h / 2) {
          bullets.splice(j, 1);
          onScore(2);
          hit = true;
          break;
        }
      }
      if (hit) { divers.splice(i, 1); continue; }

      const overlap = d.x + d.w / 2 > shipLeft && d.x - d.w / 2 < shipRight && d.y + d.h / 2 > shipTop && d.y - d.h / 2 < shipBottom;
      if (overlap && hitFlash === 0) {
        divers.splice(i, 1);
        loseLife();
        continue;
      }
      if (d.y > H + 20) divers.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = hitFlash > 0 && hitFlash % 8 < 4 ? "#ffffff" : "#e3a93b";
    ctx.beginPath();
    ctx.moveTo(ship.x, H - 70);
    ctx.lineTo(ship.x - ship.w / 2, H - 46);
    ctx.lineTo(ship.x + ship.w / 2, H - 46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f3dfae";
    bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 10));

    ctx.fillStyle = "#8fbf9d";
    enemies.forEach((e) => ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h));

    ctx.fillStyle = "#e35b5b";
    divers.forEach((d) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function keydown(e) {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") e.preventDefault();
    keys[e.code] = true;
  }
  function keyup(e) { keys[e.code] = false; }

  function pointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    pointerX = (e.clientX - rect.left) * scale;
  }
  function pointerLeave() { pointerX = null; }

  return {
    start(canvasEl, scoreCallback, livesCallback, initialLives, difficulty) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      onLives = livesCallback;
      keys = {};
      pointerX = null;
      tuning = TUNING[difficulty] || TUNING.base;
      reset(initialLives);
      running = true;
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      canvas.addEventListener("pointermove", pointerMove);
      canvas.addEventListener("pointerdown", pointerMove);
      canvas.addEventListener("pointerleave", pointerLeave);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      if (canvas) {
        canvas.removeEventListener("pointermove", pointerMove);
        canvas.removeEventListener("pointerdown", pointerMove);
        canvas.removeEventListener("pointerleave", pointerLeave);
      }
    },
  };
})();
