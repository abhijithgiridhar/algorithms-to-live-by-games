window.ArcadeDino = (function () {
  let ctx, canvas, raf, running = false;
  let dino, obstacles, groundY, speed, spawnTimer, onScore, onLives, lives;
  let tuning;

  const W = 800, H = 300;

  // base: the original, easygoing version everyone plays by default.
  // hard: the "bandit challenge" tuning -- faster, less forgiving, but still scorable.
  const TUNING = {
    base: { startSpeed: 5.0, speedRamp: 0.0015, spawnFloor: 34, spawnBase: 70, twoPackChance: 0.08 },
    hard: { startSpeed: 5.5, speedRamp: 0.002, spawnFloor: 30, spawnBase: 60, twoPackChance: 0.15 },
  };

  function reset(startingLives) {
    groundY = H - 40;
    dino = { x: 60, y: groundY - 40, w: 32, h: 40, vy: 0, jumping: false, hitFlash: 0 };
    obstacles = [];
    speed = tuning.startSpeed;
    spawnTimer = 0;
    lives = startingLives;
    onLives(lives);
  }

  function jump() {
    if (!dino.jumping) {
      dino.vy = -11;
      dino.jumping = true;
    }
  }

  function spawnObstacle() {
    const h = 24 + Math.random() * 28;
    const twoPack = Math.random() < tuning.twoPackChance;
    obstacles.push({ x: W + 10, y: groundY - h, w: 18, h, scored: false });
    if (twoPack) obstacles.push({ x: W + 50, y: groundY - h, w: 18, h, scored: false });
  }

  function loseLife() {
    lives -= 1;
    dino.hitFlash = 50;
    onLives(lives);
    if (lives <= 0) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  function update() {
    speed += tuning.speedRamp;
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(tuning.spawnFloor, tuning.spawnBase - speed * 3.5);
    }

    dino.vy += 0.6;
    dino.y += dino.vy;
    if (dino.y > groundY - dino.h) {
      dino.y = groundY - dino.h;
      dino.vy = 0;
      dino.jumping = false;
    }
    if (dino.hitFlash > 0) dino.hitFlash -= 1;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;

      const overlap = dino.x < o.x + o.w && dino.x + dino.w > o.x && dino.y < o.y + o.h && dino.y + dino.h > o.y;
      if (overlap && dino.hitFlash === 0) {
        loseLife();
        obstacles.splice(i, 1);
        continue;
      }
      if (!o.scored && o.x + o.w < dino.x) {
        o.scored = true;
        onScore(1);
      }
      if (o.x + o.w < -20) obstacles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#3a4256";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    ctx.fillStyle = dino.hitFlash > 0 && dino.hitFlash % 8 < 4 ? "#e35b5b" : "#e3a93b";
    ctx.fillRect(dino.x, dino.y, dino.w, dino.h);

    ctx.fillStyle = "#8fbf9d";
    obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.w, o.h));
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function keydown(e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  }

  return {
    start(canvasEl, scoreCallback, livesCallback, initialLives, difficulty) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      onLives = livesCallback;
      tuning = TUNING[difficulty] || TUNING.base;
      reset(initialLives);
      running = true;
      window.addEventListener("keydown", keydown);
      canvas.addEventListener("pointerdown", jump);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keydown);
      if (canvas) canvas.removeEventListener("pointerdown", jump);
    },
  };
})();
