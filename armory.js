const DUMMIES = [
  { name: "Straw Dummy", hp: 500, color: "#c9a648" },
  { name: "Oak Dummy", hp: 5000, color: "#8a5a32" },
  { name: "Iron Dummy", hp: 50000, color: "#8a8d91" },
  { name: "Adamant Dummy", hp: 500000, color: "#ff2878" },
];
const DUMMY_RESPAWN_MS = 1200;

const armoryEls = {
  picker: document.getElementById("dummyPicker"),
  swordSlot: document.getElementById("yardSword"),
  dummy: document.getElementById("yardDummy"),
  floats: document.getElementById("yardFloats"),
  hpFill: document.getElementById("hpFill"),
  hpText: document.getElementById("hpText"),
  dummyName: document.getElementById("dummyName"),
  hits: document.getElementById("yardHits"),
  dps: document.getElementById("yardDps"),
  message: document.getElementById("yardMessage"),
  swing: document.getElementById("swingBtn"),
  list: document.getElementById("swordList"),
  empty: document.getElementById("swordEmpty"),
  count: document.getElementById("swordCount"),
};

const yard = { dummyIndex: 0, hp: 0, hits: 0, dealt: 0, firstSwingAt: 0, broken: false, holding: false, nextSwingAt: 0, swingTimer: 0, hitTimer: 0, respawnTimer: 0 };

function equippedSword() {
  return state.swords.find((s) => s.id === state.equipped) || null;
}

function statList(rows) {
  return (
    '<dl class="stats">' +
    rows.map(([label, value]) => "<div><dt>" + label + "</dt><dd>" + value + "</dd></div>").join("") +
    "</dl>"
  );
}

function swordCard(sword, withActions) {
  const tier = SWORD_TIERS[sword.tier];
  const dps = sword.damage / (tier.swingMs / 1000);
  const card = document.createElement("article");
  card.className = "sword-card" + (sword.infinity ? " infinity" : "");
  card.innerHTML =
    swordSVG(sword.tier, sword.color, sword.infinity) +
    '<div class="sword-body"><h3></h3><p class="sword-quality"></p>' +
    statList([
      ["Damage", formatNumber(sword.damage)],
      ["Swing", (tier.swingMs / 1000).toFixed(1) + "s"],
      ["Per second", formatNumber(dps)],
      ["Worth", formatNumber(sword.worth)],
    ]) +
    '<p class="sword-materials"></p></div>';
  card.querySelector("h3").textContent = sword.name;
  card.querySelector(".sword-quality").textContent =
    swordQuality(sword.accuracy, sword.perfect) + " · " + (sword.perfect ? 100 : Math.min(99, Math.floor(sword.accuracy))) + "% accuracy";
  card.querySelector(".sword-materials").textContent = Object.entries(sword.materials)
    .sort((a, b) => METAL_BY_NAME.get(b[0]).rank - METAL_BY_NAME.get(a[0]).rank)
    .map(([name, count]) => count + " " + name)
    .join(", ");

  if (withActions) {
    const equipped = sword.id === state.equipped;
    const actions = document.createElement("div");
    actions.className = "sword-actions";
    const equip = document.createElement("button");
    equip.type = "button";
    equip.className = "small-btn";
    equip.textContent = equipped ? "Equipped" : "Equip";
    equip.disabled = equipped;
    equip.addEventListener("click", () => equipSword(sword.id));
    actions.appendChild(equip);
    const sell = document.createElement("button");
    sell.type = "button";
    sell.className = "small-btn";
    sell.textContent = "Sell for " + formatNumber(sword.worth);
    sell.addEventListener("click", () => sellSword(sword.id));
    actions.appendChild(sell);
    card.querySelector(".sword-body").appendChild(actions);
  }
  return card;
}

function equipSword(id) {
  state.equipped = id;
  save();
  renderArmory();
}

function sellSword(id) {
  const sword = state.swords.find((s) => s.id === id);
  if (!sword) return;
  if (sword.infinity && !confirm("Sell the Infinity Blade for " + formatNumber(sword.worth) + " coins? This can't be undone.")) return;
  const wasEquipped = sword.id === state.equipped;
  state.swords = state.swords.filter((s) => s.id !== id);
  state.coins += sword.worth;
  if (wasEquipped) state.equipped = null;
  renderCoins();
  save();
  if (wasEquipped) renderArmory();
  else renderSwordList();
}

function renderSwordList() {
  armoryEls.list.innerHTML = "";
  armoryEls.empty.hidden = state.swords.length > 0;
  armoryEls.count.textContent = state.swords.length;
  [...state.swords].reverse().forEach((sword) => armoryEls.list.appendChild(swordCard(sword, true)));
}

function renderDummyPicker() {
  armoryEls.picker.innerHTML = "";
  DUMMIES.forEach((dummy, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "small-btn";
    b.setAttribute("aria-pressed", String(i === yard.dummyIndex));
    b.textContent = dummy.name;
    b.addEventListener("click", () => {
      yard.dummyIndex = i;
      renderDummyPicker();
      resetDummy();
    });
    armoryEls.picker.appendChild(b);
  });
}

function renderYardStats() {
  const dummy = DUMMIES[yard.dummyIndex];
  armoryEls.hpFill.style.width = (yard.hp / dummy.hp) * 100 + "%";
  armoryEls.hpText.textContent = formatNumber(Math.ceil(yard.hp)) + " / " + formatNumber(dummy.hp);
  armoryEls.hits.textContent = formatNumber(yard.hits);
  const sword = equippedSword();
  const elapsed = sword && yard.hits ? performance.now() - yard.firstSwingAt + SWORD_TIERS[sword.tier].swingMs / 2 : 0;
  armoryEls.dps.textContent = elapsed ? formatNumber(yard.dealt / (elapsed / 1000)) : "0";
}

function resetDummy() {
  clearTimeout(yard.hitTimer);
  clearTimeout(yard.respawnTimer);
  const dummy = DUMMIES[yard.dummyIndex];
  yard.hp = dummy.hp;
  yard.hits = 0;
  yard.dealt = 0;
  yard.firstSwingAt = 0;
  yard.broken = false;
  armoryEls.dummy.style.setProperty("--dummy", dummy.color);
  armoryEls.dummy.classList.remove("broken");
  armoryEls.dummyName.textContent = dummy.name;
  armoryEls.message.textContent = "";
  renderYardStats();
}

function renderArmory() {
  const sword = equippedSword();
  armoryEls.swordSlot.innerHTML = sword ? swordSVG(sword.tier, sword.color, sword.infinity) : "";
  armoryEls.swordSlot.style.setProperty("--swing", (sword ? SWORD_TIERS[sword.tier].swingMs : 500) + "ms");
  armoryEls.swing.disabled = !sword;
  armoryEls.swing.textContent = sword ? "Hold to swing " + sword.name : "Forge a sword to swing";
  renderDummyPicker();
  resetDummy();
  yard.nextSwingAt = 0;
  renderSwordList();
}

function swingLoop() {
  clearTimeout(yard.swingTimer);
  const sword = equippedSword();
  if (!yard.holding || !sword) return;
  const now = performance.now();
  if (yard.broken || now < yard.nextSwingAt) {
    yard.swingTimer = setTimeout(swingLoop, Math.max(20, yard.nextSwingAt - now));
    return;
  }
  const swingMs = SWORD_TIERS[sword.tier].swingMs;
  if (!yard.firstSwingAt) yard.firstSwingAt = now;
  yard.nextSwingAt = now + swingMs;
  armoryEls.swordSlot.classList.remove("swinging");
  void armoryEls.swordSlot.offsetWidth; // restart the swing animation
  armoryEls.swordSlot.classList.add("swinging");
  yard.hitTimer = setTimeout(() => landHit(sword), swingMs / 2);
  yard.swingTimer = setTimeout(swingLoop, swingMs);
}

function landHit(sword) {
  yard.hits += 1;
  const percent = sword.infinity ? infinityPercent(yard.hits) : 0;
  const bonus = (DUMMIES[yard.dummyIndex].hp * percent) / 100;
  const dealt = Math.min(yard.hp, sword.damage + bonus);
  yard.hp -= dealt;
  yard.dealt += dealt;
  floatNumber(formatNumber(sword.damage), false);
  if (percent) floatNumber(percent + "% of max HP", true);
  armoryEls.dummy.classList.remove("struck");
  void armoryEls.dummy.offsetWidth; // restart the hit animation
  armoryEls.dummy.classList.add("struck");
  renderYardStats();
  if (yard.hp <= 0) breakDummy();
}

function breakDummy() {
  yard.broken = true;
  armoryEls.dummy.classList.add("broken");
  const seconds = (performance.now() - yard.firstSwingAt) / 1000;
  armoryEls.message.textContent = "Broken in " + seconds.toFixed(1) + "s and " + formatNumber(yard.hits) + " hits";
  const message = armoryEls.message.textContent;
  yard.respawnTimer = setTimeout(() => {
    resetDummy();
    armoryEls.message.textContent = message;
  }, DUMMY_RESPAWN_MS);
}

function floatNumber(text, special) {
  const el = document.createElement("span");
  el.className = "float-number" + (special ? " special" : "");
  el.style.left = 30 + Math.random() * 40 + "%";
  el.textContent = text;
  armoryEls.floats.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function startSwinging() {
  if (yard.holding || !equippedSword()) return;
  yard.holding = true;
  swingLoop();
}

function stopSwinging() {
  yard.holding = false;
  clearTimeout(yard.swingTimer);
}

armoryEls.swing.addEventListener("pointerdown", (e) => {
  if (e.button === 0) startSwinging();
});
armoryEls.swing.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.code !== "Enter") return;
  e.preventDefault();
  if (!e.repeat) startSwinging();
});
armoryEls.swing.addEventListener("keyup", stopSwinging);
armoryEls.swing.addEventListener("blur", stopSwinging);
armoryEls.swing.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("pointerup", stopSwinging);
window.addEventListener("pointercancel", stopSwinging);
window.addEventListener("blur", stopSwinging);
