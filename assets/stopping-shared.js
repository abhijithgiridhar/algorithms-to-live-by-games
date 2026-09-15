// Shared logic for every "optimal stopping" game skin (Rishta Hunt, Secretary, ...).
// Keeps the underlying explanation, chart, and code identical no matter the theme.
// The password gate itself lives in lock-shared.js (used by every game on the site).

function stoppingShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stoppingUniqueScores(n) {
  const set = new Set();
  while (set.size < n) set.add(Math.floor(Math.random() * 98) + 1);
  return Array.from(set);
}

function renderStoppingChart(container, { round, N, chosenIdx, trueBestScore }) {
  const width = 620, height = 280;
  const marginTop = 58, marginBottom = 46;
  const chartTop = marginTop, chartBottom = height - marginBottom;
  const chartHeight = chartBottom - chartTop;
  const gap = 10;
  const barWidth = (width - gap * (N - 1)) / N;

  const lookPhase = Math.max(1, Math.floor(N / Math.E));
  const lookBestScore = Math.max(...round.slice(0, lookPhase).map((p) => p.score));
  const bandRightX = lookPhase * (barWidth + gap) - gap / 2;
  const thresholdY = chartBottom - (lookBestScore / 100) * chartHeight;

  const xFor = (i) => i * (barWidth + gap);

  let bars = "";
  round.forEach((p, i) => {
    const x = xFor(i);
    const barH = (p.score / 100) * chartHeight;
    const y = chartBottom - barH;
    const isChosen = i === chosenIdx;
    const isBest = p.score === trueBestScore;
    const fill = isChosen ? "var(--accent)" : "var(--cell)";
    const textColor = isChosen ? "var(--accent)" : "var(--ink)";

    bars += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barH, 2)}" rx="4" style="fill:${fill}" />
      <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" style="fill:${textColor}">${p.score}</text>
      ${isBest ? `<text x="${x + barWidth / 2}" y="${y - 22}" text-anchor="middle" font-size="15">👑</text>` : ""}
      <text x="${x + barWidth / 2}" y="${chartBottom + 18}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${i + 1}</text>
      ${isChosen ? `<text x="${x + barWidth / 2}" y="${chartBottom + 34}" text-anchor="middle" font-size="14">⭐</text>` : ""}
    `;
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Bar chart of all ${N} options and their scores">
      <rect x="0" y="0" width="${bandRightX}" height="${height}" style="fill:var(--cell);opacity:0.35" />
      <line x1="${bandRightX}" y1="0" x2="${bandRightX}" y2="${height}" style="stroke:var(--muted)" stroke-dasharray="4,4" />
      <text x="${bandRightX / 2}" y="14" text-anchor="middle" font-size="11" style="fill:var(--muted)">LOOKING</text>
      <text x="${(bandRightX + width) / 2}" y="14" text-anchor="middle" font-size="11" style="fill:var(--accent)">READY TO LEAP</text>
      <line x1="0" y1="${thresholdY}" x2="${width}" y2="${thresholdY}" style="stroke:var(--accent)" stroke-dasharray="3,3" opacity="0.7" />
      ${bars}
    </svg>
  `;
}

// els: { introEl, stepLookEl, stepLeapEl, whyEl, recapEl, lookPhaseInlineEl, codeBlockEl }
function renderStoppingExplainer(els, { N, chosenIdx }) {
  const lookPhase = Math.max(1, Math.floor(N / Math.E));
  const proposedOn = chosenIdx + 1;
  const randomOdds = Math.round(100 / N);

  els.introEl.textContent =
    `This game is a classic puzzle called the secretary problem: options show up one at a time, you must decide immediately, and you can never go back to one you passed on. Here's the trick that gives you the best shot at ending up with the very best one.`;

  els.stepLookEl.textContent =
    `Just look, don't leap — for the first ${lookPhase} out of ${N} options, don't commit to anything, no matter how great it seems. Just keep track of the best score you've seen.`;

  els.stepLeapEl.textContent =
    `Then leap at the first one who beats your best — once you're past that first ${lookPhase}, commit to the very next option that scores higher than everything you saw before it.`;

  els.whyEl.textContent =
    `Why stop looking at around ${lookPhase} options (roughly 37% of the way through)? That exact point gives this strategy its best odds — close to a 37% chance of ending up with the single best option out of everyone you'll meet. Compare that to just picking someone at random: only a 1-in-${N} chance (${randomOdds}%). Not a guarantee, but a huge upgrade.`;

  els.recapEl.textContent =
    `This round: you committed on option #${proposedOn}. The rule above would say — reject the first ${lookPhase} no matter what, then commit to the next one who beats all of them. Try that exact plan on your next run and see how it goes!`;

  els.lookPhaseInlineEl.textContent = `look_phase = ${lookPhase}`;

  els.codeBlockEl.textContent =
`def find_the_best_option(options, look_phase):
    best_score_seen = 0

    for i, option in enumerate(options):
        if i < look_phase:
            # just looking -- never commit yet
            best_score_seen = max(best_score_seen, option.score)
            continue

        if option.score > best_score_seen:
            return option        # commit!

    return options[-1]           # ran out -- stuck with the last one`;

  return lookPhase;
}
