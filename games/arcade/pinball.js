window.ArcadePinball = (function () {
  let ctx, canvas, raf, running = false;
  let ball, bumpers, leftFlipper, rightFlipper, relaunchTimer, onScore;
  let keys = {};

  const W = 500, H = 700;
  const R = 10;

  function makeFlipper(pivotX, pivotY, length, side) {
    // side: -1 for left flipper (rests pointing down-left, swings up), +1 for right
    return {
      pivotX, pivotY, length, side,
      angle: side === -1 ? 2.5 : Math.PI - 2.5,
      restAngle: side === -1 ? 2.5 : Math.PI - 2.5,
      upAngle: side === -1 ? 1.0 : Math.PI - 1.0,
      active: false,
    };
  }

  function reset() {
    bumpers = [
      { x: W * 0.3, y: H * 0.32, r: 26 },
      { x: W * 0.7, y: H * 0.32, r: 26 },
      { x: W * 0.5, y: H * 0.48, r: 22 },
      { x: W * 0.22, y: H * 0.62, r: 18 },
      { x: W * 0.78, y: H * 0.62, r: 18 },
    ];
    leftFlipper = makeFlipper(W * 0.32, H - 90, 90, -1);
    rightFlipper = makeFlipper(W * 0.68, H - 90, 90, 1);
    relaunchTimer = 0;
    launchBall();
  }

  function launchBall() {
    ball = { x: W / 2 + (Math.random() * 40 - 20), y: 60, vx: (Math.random() - 0.5) * 2, vy: 1 };
  }

  function updateFlipper(f, active) {
    f.active = active;
    const target = active ? f.upAngle : f.restAngle;
    f.angle += (target - f.angle) * 0.35;
  }

  function flipperEndpoints(f) {
    const tipX = f.pivotX + Math.cos(f.angle) * f.length * (f.side === -1 ? 1 : -1);
    const tipY = f.pivotY - Math.sin(f.angle) * f.length;
    return { x1: f.pivotX, y1: f.pivotY, x2: tipX, y2: tipY };
  }

  function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy };
  }

  function collideFlipper(f) {
    const { x1, y1, x2, y2 } = flipperEndpoints(f);
    const cp = closestPointOnSegment(ball.x, ball.y, x1, y1, x2, y2);
    const dx = ball.x - cp.x, dy = ball.y - cp.y;
    const dist = Math.hypot(dx, dy);
    if (dist < R + 8) {
      const nx = dx / (dist || 1), ny = dy / (dist || 1);
      ball.x = cp.x + nx * (R + 8);
      const boost = f.active ? 9 : 0;
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx = nx * (speed * 0.6 + boost * (f.side === -1 ? 1 : -1) * 0.3 + 2);
      ball.vy = ny * (speed * 0.6 + boost) - boost * 0.6;
    }
  }

  function update() {
    updateFlipper(leftFlipper, !!keys.left);
    updateFlipper(rightFlipper, !!keys.right);

    if (relaunchTimer > 0) {
      relaunchTimer -= 1;
      if (relaunchTimer === 0) launchBall();
      return;
    }

    ball.vy += 0.35;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.999;

    if (ball.x < 20 + R) { ball.x = 20 + R; ball.vx *= -0.7; }
    if (ball.x > W - 20 - R) { ball.x = W - 20 - R; ball.vx *= -0.7; }
    if (ball.y < R + 10) { ball.y = R + 10; ball.vy *= -0.6; }

    bumpers.forEach((bp) => {
      const dx = ball.x - bp.x, dy = ball.y - bp.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bp.r + R) {
        const nx = dx / (dist || 1), ny = dy / (dist || 1);
        ball.x = bp.x + nx * (bp.r + R);
        const speed = Math.max(6, Math.hypot(ball.vx, ball.vy));
        ball.vx = nx * speed;
        ball.vy = ny * speed;
        onScore(2);
      }
    });

    collideFlipper(leftFlipper);
    collideFlipper(rightFlipper);

    if (ball.y > H + 30) {
      relaunchTimer = 45;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#10141c";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#3a4256";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 10, W - 40, H - 20);

    ctx.fillStyle = "#f3dfae";
    bumpers.forEach((bp) => {
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "#e3a93b";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    [leftFlipper, rightFlipper].forEach((f) => {
      const { x1, y1, x2, y2 } = flipperEndpoints(f);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    if (relaunchTimer === 0) {
      ctx.fillStyle = "#e35b5b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function keydown(e) {
    if (e.code === "KeyZ" || e.code === "ArrowLeft") { keys.left = true; e.preventDefault(); }
    if (e.code === "Slash" || e.code === "ArrowRight") { keys.right = true; e.preventDefault(); }
  }
  function keyup(e) {
    if (e.code === "KeyZ" || e.code === "ArrowLeft") keys.left = false;
    if (e.code === "Slash" || e.code === "ArrowRight") keys.right = false;
  }

  return {
    start(canvasEl, scoreCallback, controls) {
      canvas = canvasEl;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      onScore = scoreCallback;
      keys = {};
      reset();
      running = true;
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      if (controls) {
        const press = (side, val) => (e) => { e.preventDefault(); keys[side] = val; };
        controls.leftBtn.addEventListener("pointerdown", press("left", true));
        controls.leftBtn.addEventListener("pointerup", press("left", false));
        controls.leftBtn.addEventListener("pointerleave", press("left", false));
        controls.rightBtn.addEventListener("pointerdown", press("right", true));
        controls.rightBtn.addEventListener("pointerup", press("right", false));
        controls.rightBtn.addEventListener("pointerleave", press("right", false));
      }
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    },
  };
})();
