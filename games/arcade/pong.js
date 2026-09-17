window.ArcadePong = (function () {
  let ctx, canvas, raf, running = false;
  let player, ai, ball, onScore;
  let keys = {};
  let pointerY = null;
  let serveTimer = 0;

  const W = 800, H = 500;
  const PADDLE_W = 14, PADDLE_H = 90;
  const BASE_SPEED = 5.5;

  function serveBall(towards) {
    const angle = (Math.random() * 0.6 - 0.3);
    ball = {
      x: W / 2,
      y: H / 2,
      vx: BASE_SPEED * towards,
      vy: BASE_SPEED * Math.sin(angle) * 2,
    };
  }

  function reset() {
    player = { y: H / 2 - PADDLE_H / 2 };
    ai = { y: H / 2 - PADDLE_H / 2 };
    serveTimer = 0;
    serveBall(Math.random() < 0.5 ? 1 : -1);
  }

  function update() {
    if (keys.ArrowUp) player.y -= 7;
    if (keys.ArrowDown) player.y += 7;
    if (pointerY !== null) player.y += (pointerY - (player.y + PADDLE_H / 2)) * 0.25;
    player.y = Math.max(0, Math.min(H - PADDLE_H, player.y));

    const aiTarget = ball.y - PADDLE_H / 2;
    ai.y += (aiTarget - ai.y) * 0.07;
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
    if (ball.vx < 0 && ball.x - 8 < 30 + PADDLE_W && ball.x > 20 && ball.y > player.y && ball.y < player.y + PADDLE_H) {
      ball.x = 30 + PADDLE_W + 8;
      const hitPos = (ball.y - (player.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      ball.vx = Math.abs(ball.vx) * 1.05;
      ball.vy = hitPos * 6;
      onScore(1);
    }

    // ai paddle (right, x=W-30-PADDLE_W..W-30)
    if (ball.vx > 0 && ball.x + 8 > W - 30 - PADDLE_W && ball.x < W - 20 && ball.y > ai.y && ball.y < ai.y + PADDLE_H) {
      ball.x = W - 30 - PADDLE_W - 8;
      const hitPos = (ball.y - (ai.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      ball.vx = -Math.abs(ball.vx) * 1.05;
      ball.vy = hitPos * 6;
    }

    if (ball.x < -20) {
      // player scored past the AI
      onScore(2);
      serveTimer = 30;
      serveBall(-1);
    } else if (ball.x > W + 20) {
      // player missed -- no penalty, just relaunch
      serveTimer = 30;
      serveBall(1);
    }
  }

  function draw() {
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

    ctx.fillStyle = "#e3a93b";
    ctx.fillRect(30, player.y, PADDLE_W, PADDLE_H);
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
    raf = requestAnimationFrame(loop);
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
    start(canvasEl, scoreCallback) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      keys = {};
      pointerY = null;
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
