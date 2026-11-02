const FEEDBACK_MS = 650;
const INPUT_GRACE_MS = 300; // ignores the second half of a double-tap that started the stage

const forgeEls = {
  setup: document.getElementById("forgeSetup"),
  runPanel: document.getElementById("forgeRun"),
  result: document.getElementById("forgeResult"),
  tierPicker: document.getElementById("tierPicker"),
  materialList: document.getElementById("materialList"),
  materialEmpty: document.getElementById("materialEmpty"),
  materialCount: document.getElementById("materialCount"),
  fill: document.getElementById("fillBtn"),
  clear: document.getElementById("clearBtn"),
  previewArt: document.getElementById("previewArt"),
  previewStats: document.getElementById("previewStats"),
  start: document.getElementById("startForgeBtn"),
  steps: document.getElementById("forgeSteps"),
  stageTitle: document.getElementById("stageTitle"),
  stageHint: document.getElementById("stageHint"),
  arena: document.getElementById("forgeArena"),
  feedback: document.getElementById("forgeFeedback"),
  action: document.getElementById("forgeAction"),
  resultTitle: document.getElementById("resultTitle"),
  resultCard: document.getElementById("resultCard"),
  again: document.getElementById("forgeAgainBtn"),
  toArmory: document.getElementById("toArmoryBtn"),
};

const selection = { tier: 0, materials: {} };
const materialRows = new Map();
let run = null; // the live minigame stage; scores already earned live in state.forge
let windowAway = false;

/* Setup: choose a size and metals */

function renderTierPicker() {
  forgeEls.tierPicker.innerHTML = "";
  SWORD_TIERS.forEach((tier, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tier-option";
    b.setAttribute("aria-pressed", String(i === selection.tier));
    b.innerHTML =
      swordSVG(i, "#a8b2bb") +
      '<strong></strong><span class="tier-line"></span><span class="tier-line"></span>';
    b.querySelector("strong").textContent = tier.name;
    const lines = b.querySelectorAll(".tier-line");
    lines[0].textContent = tier.min + "–" + tier.max + " metals";
    lines[1].textContent = (tier.swingMs / 1000).toFixed(1) + "s per swing";
    b.addEventListener("click", () => selectTier(i));
    forgeEls.tierPicker.appendChild(b);
  });
}

function selectTier(i) {
  selection.tier = i;
  // Dropping to a smaller sword hands back the commonest metals first
  const max = SWORD_TIERS[i].max;
  const names = Object.keys(selection.materials).sort((a, b) => METAL_BY_NAME.get(a).rank - METAL_BY_NAME.get(b).rank);
  for (const name of names) {
    while (materialTotal(selection.materials) > max && selection.materials[name] > 0) selection.materials[name]--;
  }
  renderTierPicker();
  renderSelection();
}

function renderMaterials() {
  forgeEls.materialList.innerHTML = "";
  materialRows.clear();
  const owned = METALS.filter((m) => state.metals[m.name] > 0).reverse();
  forgeEls.materialEmpty.hidden = owned.length > 0;
  owned.forEach((metal) => {
    const row = document.createElement("li");
    row.className = "material-row";
    row.style.setProperty("--metal", metal.color);
    row.style.setProperty("--tier", TIERS[metal.tier].color);
    row.innerHTML =
      '<span class="swatch"></span>' +
      '<span class="material-info"><span class="material-name"></span><span class="material-odds"></span></span>' +
      '<span class="stepper"><button type="button" class="step" data-delta="-1">−</button>' +
      '<span class="step-value"></span><button type="button" class="step" data-delta="1">+</button></span>';
    row.querySelector(".material-name").textContent = metal.name;
    row.querySelector(".material-odds").textContent = TIERS[metal.tier].name + " · " + formatOdds(metal.oneIn);
    const [minus, plus] = row.querySelectorAll(".step");
    minus.setAttribute("aria-label", "Use one less " + metal.name);
    plus.setAttribute("aria-label", "Use one more " + metal.name);
    minus.addEventListener("click", () => adjustMaterial(metal, -1));
    plus.addEventListener("click", () => adjustMaterial(metal, 1));
    materialRows.set(metal.name, { value: row.querySelector(".step-value"), minus, plus });
    forgeEls.materialList.appendChild(row);
  });
}

function adjustMaterial(metal, delta) {
  const used = selection.materials[metal.name] || 0;
  const next = used + delta;
  if (next < 0 || next > (state.metals[metal.name] || 0)) return;
  if (delta > 0 && materialTotal(selection.materials) >= SWORD_TIERS[selection.tier].max) return;
  selection.materials[metal.name] = next;
  renderSelection();
}

function renderSelection() {
  const tier = SWORD_TIERS[selection.tier];
  const total = materialTotal(selection.materials);
  const full = total >= tier.max;
  materialRows.forEach((row, name) => {
    const used = selection.materials[name] || 0;
    const owned = state.metals[name] || 0;
    row.value.textContent = used + " / " + formatNumber(owned);
    row.minus.disabled = used <= 0;
    row.plus.disabled = full || used >= owned;
  });
  forgeEls.materialCount.textContent = total + " selected, needs " + tier.min + "–" + tier.max;
  forgeEls.clear.disabled = total === 0;

  const ready = total >= tier.min && total <= tier.max;
  const dominant = dominantMetal(selection.materials);
  forgeEls.previewArt.innerHTML = swordSVG(selection.tier, dominant ? dominant.color : "#a8b2bb");
  forgeEls.start.disabled = !ready;
  if (!ready) {
    forgeEls.previewStats.innerHTML = '<p class="preview-note"></p>';
    forgeEls.previewStats.firstChild.textContent =
      "Add " + (tier.min - total) + " more metal" + (tier.min - total === 1 ? "" : "s") + " to forge a " + tier.name + ".";
    return;
  }
  const low = swordStats(selection.tier, selection.materials, 0);
  const high = swordStats(selection.tier, selection.materials, 100);
  forgeEls.previewStats.innerHTML = statList([
    ["Damage", formatNumber(low.damage) + " – " + formatNumber(high.damage)],
    ["Swing", (tier.swingMs / 1000).toFixed(1) + "s"],
    ["Worth", formatNumber(low.worth) + " – " + formatNumber(high.worth)],
  ]);
}

function fillWithCommon() {
  const max = SWORD_TIERS[selection.tier].max;
  for (const metal of METALS) {
    if (metal.tier > 1) break; // Rare and above are only ever spent on purpose
    let used = selection.materials[metal.name] || 0;
    const owned = state.metals[metal.name] || 0;
    while (used < owned && materialTotal(selection.materials) < max) {
      used++;
      selection.materials[metal.name] = used;
    }
  }
  renderSelection();
}

function showForgeSetup() {
  forgeEls.setup.hidden = false;
  forgeEls.runPanel.hidden = true;
  forgeEls.result.hidden = true;
  renderMaterials();
  renderSelection();
}

/* The three minigame stages */

function forgeStage(f) {
  if (f.heat === null) return "heat";
  if (f.strikes.length < SWORD_TIERS[f.tier].strikes) return "hammer";
  if (f.quench === null) return "quench";
  return "done";
}

function startForge() {
  const tier = SWORD_TIERS[selection.tier];
  const total = materialTotal(selection.materials);
  if (total < tier.min || total > tier.max) return;
  const materials = {};
  for (const [name, count] of Object.entries(selection.materials)) {
    if (count <= 0) continue;
    if (count > (state.metals[name] || 0)) return;
    materials[name] = count;
  }
  for (const [name, count] of Object.entries(materials)) {
    state.metals[name] -= count;
    renderTile(METAL_BY_NAME.get(name));
  }
  // Saved after every input, and `live` marks a strike or hold in progress,
  // so reloading can't undo a bad score
  state.forge = { tier: selection.tier, materials, heat: null, strikes: [], quench: null, live: false };
  selection.materials = {};
  save();
  beginRun();
}

function beginRun() {
  setTabsLocked(true);
  forgeEls.setup.hidden = true;
  forgeEls.result.hidden = true;
  forgeEls.runPanel.hidden = false;
  window.scrollTo(0, 0);
  enterStage();
}

// A reload during a strike or hold counts as missing it
function settleInterruptedInput(f) {
  if (!f.live) return;
  f.live = false;
  if (forgeStage(f) === "hammer") f.strikes.push(0);
  else if (forgeStage(f) === "quench") f.quench = 0;
  save();
}

function clearRun() {
  if (!run) return;
  clearTimeout(run.timer);
  cancelAnimationFrame(run.raf);
}

function enterStage() {
  clearRun();
  const f = state.forge;
  const stage = forgeStage(f);
  if (stage === "done") {
    run = null;
    finishForge();
    return;
  }
  const now = performance.now();
  run = { stage, speed: SWORD_TIERS[f.tier].speed, start: now, readyAt: now + INPUT_GRACE_MS, target: 0, holdStart: null, holdPointer: null, locked: false, paused: false, timer: 0, raf: 0 };
  forgeEls.feedback.textContent = "";
  forgeEls.feedback.className = "forge-feedback";
  renderSteps();
  if (stage === "heat") enterHeat();
  else if (stage === "hammer") enterHammer();
  else enterQuench();
}

function renderSteps() {
  const f = state.forge;
  const total = SWORD_TIERS[f.tier].strikes;
  const avg = f.strikes.length ? Math.floor(f.strikes.reduce((s, n) => s + n, 0) / f.strikes.length) : null;
  const steps = [
    ["Heat", f.heat === null ? "" : f.heat + "%", run.stage === "heat"],
    ["Hammer " + f.strikes.length + "/" + total, avg === null ? "" : avg + "%", run.stage === "hammer"],
    ["Quench", f.quench === null ? "" : f.quench + "%", run.stage === "quench"],
  ];
  forgeEls.steps.innerHTML = "";
  steps.forEach(([label, score, active]) => {
    const li = document.createElement("li");
    li.className = active ? "active" : "";
    li.textContent = label + (score ? " · " + score : "");
    forgeEls.steps.appendChild(li);
  });
}

function setStageText(title, hint, action) {
  forgeEls.stageTitle.textContent = title;
  forgeEls.stageHint.textContent = hint;
  forgeEls.action.textContent = action;
}

function trackMarkup(kind, target, zone, perfect) {
  const band = (half) => `left:${(target - half) * 100}%;width:${half * 200}%`;
  return (
    `<div class="track ${kind}"><div class="track-zone" style="${band(zone)}"></div>` +
    `<div class="track-perfect" style="${band(perfect)}"></div>` +
    (kind === "quench-track" ? '<div class="track-fill" id="trackFill"></div>' : "") +
    '<div class="needle" id="needle"></div></div>'
  );
}

function animateStage(draw) {
  const owner = run;
  const loop = () => {
    if (run !== owner || owner.locked) return;
    draw(performance.now());
    owner.raf = requestAnimationFrame(loop);
  };
  loop();
}

function enterHeat() {
  run.target = 0.2 + Math.random() * 0.6;
  setStageText("Heat the metal", "Stop the needle on the bright line.", "Stop");
  forgeEls.arena.innerHTML = trackMarkup("heat-track", run.target, 0.12, HEAT_PERFECT);
  const needle = document.getElementById("needle");
  animateStage((now) => {
    needle.style.left = heatPosition(now - run.start, run.speed) * 100 + "%";
  });
}

function enterHammer() {
  const speed = run.speed;
  setStageText("Hammer the blade", "Strike as the shrinking ring meets the circle.", "Strike");
  forgeEls.arena.innerHTML =
    '<div class="anvil"><div class="ring-target"></div><div class="ring" id="ring"></div>' +
    swordSVG(state.forge.tier, dominantMetal(state.forge.materials).color) + "</div>";
  if (windowAway) {
    pauseStrike();
    return;
  }
  const ring = document.getElementById("ring");
  const ringMs = hammerRingMs(speed);
  animateStage((now) => {
    const left = 1 - (now - run.start) / ringMs;
    ring.style.transform = "scale(" + (1 + Math.max(0, left)) + ")";
  });
  state.forge.live = true;
  save();
  run.timer = setTimeout(() => commitScore(0), ringMs + hammerLateMs(speed));
}

function pauseStrike() {
  clearRun();
  run.paused = true;
  state.forge.live = false;
  save();
  forgeEls.stageHint.textContent = "Paused. Come back to the game to carry on.";
}

// Leaving before the strike is due replays it. Leaving after it was due can no longer
// be perfect, so it counts as missed, or leaving would be a free retry.
function forgeAway() {
  windowAway = true;
  forgeRelease();
  if (!run || run.locked || run.paused || run.stage !== "hammer") return;
  const lastPerfectMs = hammerRingMs(run.speed) + HAMMER_PERFECT_MS / run.speed;
  if (performance.now() - run.start > lastPerfectMs) commitScore(0);
  else pauseStrike();
}

function forgeBack() {
  windowAway = false;
  if (run && run.paused) enterStage();
}

function enterQuench() {
  run.target = 0.5 + Math.random() * 0.35;
  setStageText("Quench the blade", "Hold to lower it in, and let go on the bright line. It speeds up, and going past the end ruins it.", "Hold");
  forgeEls.arena.innerHTML = trackMarkup("quench-track", run.target, 0.1, QUENCH_PERFECT);
}

function forgePress(pointerId) {
  if (!run || run.locked || run.paused) return;
  const now = performance.now();
  if (now < run.readyAt) return;
  if (run.stage === "heat") {
    document.getElementById("needle").style.left = heatPosition(now - run.start, run.speed) * 100 + "%";
    commitScore(scoreHeat(now - run.start, run.target, run.speed));
  } else if (run.stage === "hammer") {
    commitScore(scoreHammer(now - run.start, run.speed));
  } else if (run.holdStart === null) {
    run.holdStart = now;
    run.holdPointer = pointerId;
    state.forge.live = true;
    save();
    run.timer = setTimeout(() => commitScore(0), quenchFillMs(run.speed));
    const needle = document.getElementById("needle");
    const fill = document.getElementById("trackFill");
    animateStage((t) => {
      const percent = Math.min(1, quenchLevel(t - run.holdStart, run.speed)) * 100 + "%";
      needle.style.left = percent;
      fill.style.width = percent;
    });
  }
}

function forgeRelease() {
  if (!run || run.locked || run.stage !== "quench" || run.holdStart === null) return;
  commitScore(scoreQuench(performance.now() - run.holdStart, run.target, run.speed));
}

function commitScore(score) {
  const f = state.forge;
  clearRun();
  run.locked = true;
  f.live = false;
  if (run.stage === "heat") f.heat = score;
  else if (run.stage === "hammer") f.strikes.push(score);
  else f.quench = score;
  save();
  renderSteps();
  const label = score === 100 ? "Perfect!" : score >= 80 ? "Great" : score >= 50 ? "Good" : score > 0 ? "Rough" : "Miss";
  forgeEls.feedback.textContent = label + " · " + score + "%";
  forgeEls.feedback.className = "forge-feedback" + (score === 100 ? " perfect" : score === 0 ? " miss" : "");
  run.timer = setTimeout(enterStage, FEEDBACK_MS);
}

function finishForge() {
  const f = state.forge;
  const sword = buildSword(++state.swordSeq, f.tier, f.materials, { heat: f.heat, strikes: f.strikes, quench: f.quench });
  state.swords.push(sword);
  if (state.equipped === null) state.equipped = sword.id;
  state.forge = null;
  save();
  setTabsLocked(false);
  forgeEls.runPanel.hidden = true;
  forgeEls.result.hidden = false;
  forgeEls.result.classList.toggle("infinity-result", sword.infinity);
  forgeEls.resultTitle.textContent = sword.infinity ? "The Infinity Blade is yours" : "Sword forged";
  forgeEls.resultCard.innerHTML = "";
  forgeEls.resultCard.appendChild(swordCard(sword, false));
}

/* Input */

forgeEls.action.addEventListener("pointerdown", (e) => {
  if (e.button === 0) forgePress(e.pointerId);
});
// Only the finger or button holding the quench can let go of it
function forgePointerRelease(e) {
  if (run && run.holdPointer === e.pointerId) forgeRelease();
}
window.addEventListener("pointerup", forgePointerRelease);
window.addEventListener("pointercancel", forgePointerRelease);
window.addEventListener("blur", forgeAway);
window.addEventListener("focus", forgeBack);
forgeEls.action.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  if (!run || (e.code !== "Space" && e.code !== "Enter")) return;
  e.preventDefault();
  if (!e.repeat) forgePress(null);
});
document.addEventListener("keyup", (e) => {
  if ((e.code === "Space" || e.code === "Enter") && run && run.holdPointer === null) forgeRelease();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) forgeAway();
  else forgeBack();
});

forgeEls.fill.addEventListener("click", fillWithCommon);
forgeEls.clear.addEventListener("click", () => {
  selection.materials = {};
  renderSelection();
});
forgeEls.start.addEventListener("click", startForge);
forgeEls.again.addEventListener("click", showForgeSetup);
forgeEls.toArmory.addEventListener("click", () => showView("armory"));

renderTierPicker();
showView(state.forge ? "forge" : "roll");
if (state.forge) {
  settleInterruptedInput(state.forge);
  beginRun();
}
