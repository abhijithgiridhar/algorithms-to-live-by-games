window.ArcadeShooter = (function () {
  let ctx, canvas, raf, running = false;
  let ship, bullets, enemies, fireTimer, spawnTimer, onScore;
  let keys = {};
  let pointerX = null;

  const W = 800, H = 500;

  function reset() {
    ship = { x: W / 2, w: 40, h: 24 };
    bullets = [];
    enemies = [];
    fireTimer = 0;
    spawnTimer = 0;
  }

  function spawnEnemy() {
    enemies.push({ x: 30 + Math.random() * (W - 60), y: -20, w: 28, h: 22, vy: 1.2 + Math.random() * 1.3 });
  }

  function update() {
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
      spawnTimer = 45 - Math.min(25, Math.random() * 20);
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
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#e3a93b";
    ctx.beginPath();
    ctx.moveTo(ship.x, H - 70);
    ctx.lineTo(ship.x - ship.w / 2, H - 46);
    ctx.lineTo(ship.x + ship.w / 2, H - 46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f3dfae";
    bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 10));

    ctx.fillStyle = "#e35b5b";
    enemies.forEach((e) => ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h));
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
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
    start(canvasEl, scoreCallback) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      keys = {};
      pointerX = null;
      reset();
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
