window.ArcadeFlappy = (function () {
  let ctx, canvas, raf, running = false;
  let bird, pipes, spawnTimer, elapsed, speed, gapSize;
  let onScore, onLives, lives;
  let hitFlash = 0;

  const W = 800, H = 500;
  const BIRD_X = 140, BIRD_R = 14;
  const PIPE_W = 64;
  const BASE_SPEED = 3.4;
  const BASE_GAP = 190, MIN_GAP = 118;

  function reset(startingLives) {
    bird = { y: H / 2, vy: 0 };
    pipes = [];
    spawnTimer = 0;
    elapsed = 0;
    speed = BASE_SPEED;
    gapSize = BASE_GAP;
    hitFlash = 0;
    lives = startingLives;
    onLives(lives);
  }

  function flap() {
    bird.vy = -8.2;
  }

  function spawnPipe() {
    const margin = 50;
    const gapCenter = margin + gapSize / 2 + Math.random() * (H - 2 * margin - gapSize);
    pipes.push({ x: W + PIPE_W, gapCenter, scored: false });
  }

  function loseLife() {
    lives -= 1;
    hitFlash = 45;
    bird.y = H / 2;
    bird.vy = 0;
    onLives(lives);
    if (lives <= 0) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  function update() {
    elapsed += 1;
    if (hitFlash > 0) hitFlash -= 1;

    speed = BASE_SPEED + Math.min(3.2, elapsed / 500);
    gapSize = Math.max(MIN_GAP, BASE_GAP - elapsed / 22);

    bird.vy += 0.45;
    bird.y += bird.vy;

    if (bird.y < BIRD_R) { bird.y = BIRD_R; bird.vy = 0; }
    if (bird.y > H - BIRD_R) {
      if (hitFlash === 0) loseLife();
      bird.y = H - BIRD_R;
      bird.vy = 0;
    }

    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnPipe();
      spawnTimer = Math.max(72, 130 - elapsed / 30);
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= speed;

      const withinX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
      const withinGap = bird.y - BIRD_R > p.gapCenter - gapSize / 2 && bird.y + BIRD_R < p.gapCenter + gapSize / 2;
      if (withinX && !withinGap && hitFlash === 0) {
        loseLife();
      }

      if (!p.scored && p.x + PIPE_W < BIRD_X - BIRD_R) {
        p.scored = true;
        onScore(1);
      }
      if (p.x < -PIPE_W - 10) pipes.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#8fbf9d";
    pipes.forEach((p) => {
      const gapTop = p.gapCenter - gapSize / 2;
      const gapBottom = p.gapCenter + gapSize / 2;
      ctx.fillRect(p.x, 0, PIPE_W, gapTop);
      ctx.fillRect(p.x, gapBottom, PIPE_W, H - gapBottom);
    });

    ctx.fillStyle = hitFlash > 0 && hitFlash % 8 < 4 ? "#ffffff" : "#e3a93b";
    ctx.beginPath();
    ctx.arc(BIRD_X, bird.y, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
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
      flap();
    }
  }

  return {
    start(canvasEl, scoreCallback, livesCallback, initialLives) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      onLives = livesCallback;
      reset(initialLives);
      running = true;
      window.addEventListener("keydown", keydown);
      canvas.addEventListener("pointerdown", flap);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keydown);
      if (canvas) canvas.removeEventListener("pointerdown", flap);
    },
  };
})();
