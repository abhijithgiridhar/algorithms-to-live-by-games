window.ArcadePong = (function () {
  let ctx, canvas, raf, running = false;
  let player, ai, ball, onScore, onLives, lives;
  let keys = {};
  let pointerY = null;
  let serveTimer = 0;
  let rallyPoints = 0;
  let speedMult = 1;
  let hitFlash = 0;

  const W = 800, H = 500;
  const PADDLE_W = 14, PADDLE_H = 90, MIN_PADDLE_H = 42;
  const BASE_SPEED = 5.5;
  const MAX_SPEED_MULT = 2.6;

  function playerPaddleH() {
    return Math.max(MIN_PADDLE_H, PADDLE_H - (speedMult - 1) * 34);
  }

  function serveBall(towards) {
    const angle = (Math.random() * 0.6 - 0.3);
    const s = BASE_SPEED * speedMult;
    ball = {
      x: W / 2,
      y: H / 2,
      vx: s * towards,
      vy: s * Math.sin(angle) * 2,
    };
  }

  function reset(startingLives) {
    player = { y: H / 2 - PADDLE_H / 2 };
    ai = { y: H / 2 - PADDLE_H / 2 };
    serveTimer = 0;
    rallyPoints = 0;
    speedMult = 1;
    hitFlash = 0;
    lives = startingLives;
    onLives(lives);
    serveBall(Math.random() < 0.5 ? 1 : -1);
  }

  function bumpDifficulty() {
    rallyPoints += 1;
    if (rallyPoints % 3 === 0) {
      speedMult = Math.min(MAX_SPEED_MULT, speedMult + 0.18);
    }
  }

  function loseLife() {
    lives -= 1;
    hitFlash = 40;
    onLives(lives);
    if (lives <= 0) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  function update() {
    if (hitFlash > 0) hitFlash -= 1;
    const playerH = playerPaddleH();

    if (keys.ArrowUp) player.y -= 7;
    if (keys.ArrowDown) player.y += 7;
    if (pointerY !== null) player.y += (pointerY - (player.y + playerH / 2)) * 0.25;
    player.y = Math.max(0, Math.min(H - playerH, player.y));

    const aiTarget = ball.y - PADDLE_H / 2;
    const aiSpeed = 0.06 + Math.min(0.05, speedMult * 0.015);
    ai.y += (aiTarget - ai.y) * aiSpeed;
    ai.y = Math.max(0, Math.min(H - PADDLE_H, ai.y));

    if (serveTimer > 0) {
      serveTimer -= 1;
      return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y < 8) { ball.y = 8; ball.vy *= -1; }
    if (ball.y > H - 8) { ball.y = H - 8; ball.vy *= -1; }

    // player paddle (left, x=30..30+PADDLE_W)
    if (ball.vx < 0 && ball.x - 8 < 30 + PADDLE_W && ball.x > 20 && ball.y > player.y && ball.y < player.y + playerH) {
      ball.x = 30 + PADDLE_W + 8;
      const hitPos = (ball.y - (player.y + playerH / 2)) / (playerH / 2);
      const s = BASE_SPEED * speedMult;
      ball.vx = Math.abs(s);
      ball.vy = hitPos * 6 * speedMult;
      onScore(1);
      bumpDifficulty();
    }

    // ai paddle (right, x=W-30-PADDLE_W..W-30)
    if (ball.vx > 0 && ball.x + 8 > W - 30 - PADDLE_W && ball.x < W - 20 && ball.y > ai.y && ball.y < ai.y + PADDLE_H) {
      ball.x = W - 30 - PADDLE_W - 8;
      const hitPos = (ball.y - (ai.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      const s = BASE_SPEED * speedMult;
      ball.vx = -Math.abs(s);
      ball.vy = hitPos * 6 * speedMult;
    }

    if (ball.x < -20) {
      // player scored past the AI
      onScore(2);
      bumpDifficulty();
      serveTimer = 30;
      serveBall(-1);
    } else if (ball.x > W + 20) {
      // player missed -- real cost now, not a free difficulty reset
      loseLife();
      if (running) {
        serveTimer = 30;
        serveBall(1);
      }
    }
  }

  function draw() {
    const playerH = playerPaddleH();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#3a4256";
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = hitFlash > 0 && hitFlash % 8 < 4 ? "#ffffff" : "#e3a93b";
    ctx.fillRect(30, player.y, PADDLE_W, playerH);
    ctx.fillStyle = "#e35b5b";
    ctx.fillRect(W - 30 - PADDLE_W, ai.y, PADDLE_W, PADDLE_H);

    ctx.fillStyle = "#f3dfae";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function keydown(e) {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") e.preventDefault();
    keys[e.code] = true;
  }
  function keyup(e) { keys[e.code] = false; }

  function pointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = H / rect.height;
    pointerY = (e.clientY - rect.top) * scale;
  }
  function pointerLeave() { pointerY = null; }

  return {
    start(canvasEl, scoreCallback, livesCallback, initialLives) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      onLives = livesCallback;
      keys = {};
      pointerY = null;
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
