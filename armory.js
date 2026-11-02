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
  sellCut: document.getElementById("sellCutNote"),
  gearList: document.getElementById("gearList"),
  gearEmpty: document.getElementById("gearEmpty"),
  potionList: document.getElementById("potionList"),
  potionEmpty: document.getElementById("potionEmpty"),
  activeEffects: document.getElementById("activeEffects"),
};

const yard = { dummyIndex: 0, hp: 0, hits: 0, dealt: 0, firstSwingAt: 0, broken: false, holding: false, holdPointer: null, nextSwingAt: 0, swingTimer: 0, hitTimer: 0, respawnTimer: 0 };
const SELL_COOLDOWN_MS = 400; // the list reflows after a sale, so a double-click would sell the next sword too
let lastSaleAt = -Infinity;

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
  const swingMs = swordSwingMs(sword);
  const dps = sword.damage / (swingMs / 1000);
  const card = document.createElement("article");
  card.className = "sword-card" + (sword.infinity ? " infinity" : "");
  card.innerHTML =
    swordSVG(sword.tier, sword.color, sword.infinity) +
    '<div class="sword-body"><h3></h3><p class="sword-quality"></p>' +
    statList([
      ["Damage", formatNumber(sword.damage)],
      ["Swing", (swingMs / 1000).toFixed(2) + "s"],
      ["Upgrades", swordUpgrades(sword) + " / " + MAX_SWORD_UPGRADES],
      ["Per second", formatNumber(dps)],
      ["Worth", formatNumber(sellPrice(sword))],
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
    const cost = swordUpgradeCost(sword);
    const maxed = swordUpgrades(sword) >= MAX_SWORD_UPGRADES;
    actions.appendChild(smallButton(maxed ? "Swing fully upgraded" : "Faster swing: " + formatNumber(cost) + " coins", maxed || state.coins < cost, () => upgradeSword(sword.id)));
    const sell = document.createElement("button");
    sell.type = "button";
    sell.className = "small-btn";
    sell.textContent = "Sell for " + formatNumber(sellPrice(sword));
    sell.addEventListener("click", () => sellSword(sword.id));
    actions.appendChild(sell);
    card.querySelector(".sword-body").appendChild(actions);
  }
  return card;
}

function upgradeSword(id) {
  const sword = state.swords.find((s) => s.id === id);
  if (!sword || swordUpgrades(sword) >= MAX_SWORD_UPGRADES) return;
  const cost = swordUpgradeCost(sword);
  if (state.coins < cost) return;
  state.coins -= cost;
  sword.upgrades = swordUpgrades(sword) + 1;
  renderCoins();
  save();
  renderArmory();
}

function equipSword(id) {
  state.equipped = id;
  save();
  renderArmory();
}

function sellSword(id) {
  const sword = state.swords.find((s) => s.id === id);
  if (!sword || performance.now() - lastSaleAt < SELL_COOLDOWN_MS) return;
  if (sword.infinity && !confirm("Sell the Infinity Blade for " + formatNumber(sellPrice(sword)) + " coins? This can't be undone.")) return;
  lastSaleAt = performance.now();
  const wasEquipped = sword.id === state.equipped;
  state.swords = state.swords.filter((s) => s.id !== id);
  state.coins += sellPrice(sword);
  if (wasEquipped) state.equipped = null;
  renderCoins();
  save();
  if (wasEquipped) renderArmory();
  else renderSwordList();
}

function renderSwordList() {
  const cut = sellCut();
  armoryEls.sellCut.hidden = cut <= 0;
  armoryEls.sellCut.textContent = "Your trinkets cut sell prices by " + Math.round(cut * 100) + "%.";
  armoryEls.list.innerHTML = "";
  armoryEls.empty.hidden = state.swords.length > 0;
  armoryEls.count.textContent = state.swords.length;
  [...state.swords].reverse().forEach((sword) => armoryEls.list.appendChild(swordCard(sword, true)));
}

function smallButton(label, disabled, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "small-btn";
  b.textContent = label;
  b.disabled = disabled;
  b.addEventListener("click", onClick);
  return b;
}

function gearCard(gear, withActions) {
  const card = document.createElement("article");
  card.className = "sword-card";
  card.innerHTML =
    gearSVG(gear.slot, gear.color) +
    '<div class="sword-body"><h3></h3><p class="sword-quality"></p>' +
    statList([
      ["Effect", gearEffectText(gear.slot, gear.power)],
      ["Worth", formatNumber(sellPrice(gear))],
    ]) +
    '<p class="sword-materials"></p></div>';
  card.querySelector("h3").textContent = gear.name;
  card.querySelector(".sword-quality").textContent =
    swordQuality(gear.accuracy, gear.perfect) + " · " + (gear.perfect ? 100 : Math.min(99, Math.floor(gear.accuracy))) + "% accuracy";
  card.querySelector(".sword-materials").textContent = Object.entries(gear.materials)
    .sort((a, b) => METAL_BY_NAME.get(b[0]).rank - METAL_BY_NAME.get(a[0]).rank)
    .map(([name, count]) => count + " " + name)
    .join(", ");
  if (withActions) {
    const equipped = state.equippedGear[gear.slot] === gear.id;
    const actions = document.createElement("div");
    actions.className = "sword-actions";
    actions.appendChild(smallButton(equipped ? "Equipped" : "Equip", equipped, () => equipGear(gear)));
    actions.appendChild(smallButton("Sell for " + formatNumber(sellPrice(gear)), false, () => sellGear(gear.id)));
    card.querySelector(".sword-body").appendChild(actions);
  }
  return card;
}

function potionCard(potion, withActions) {
  const def = POTIONS[potion.type];
  const card = document.createElement("article");
  card.className = "sword-card";
  card.innerHTML =
    potionSVG(potion.type) +
    '<div class="sword-body"><h3></h3>' +
    statList([["Lasts", def.lasts + " " + def.unit]]) +
    '<p class="sword-materials"></p></div>';
  card.querySelector("h3").textContent = def.name;
  card.querySelector(".sword-materials").textContent = potionEffectText(potion.type, potion.strength);
  if (withActions) {
    const active = !!activePotion(potion.type);
    const actions = document.createElement("div");
    actions.className = "sword-actions";
    actions.appendChild(smallButton(active ? "One is already active" : "Drink", active, () => drinkPotion(potion.id)));
    card.querySelector(".sword-body").appendChild(actions);
  }
  return card;
}

function equipGear(gear) {
  state.equippedGear[gear.slot] = gear.id;
  save();
  renderGearAndPotions();
}

function sellGear(id) {
  const gear = state.gear.find((g) => g.id === id);
  if (!gear || performance.now() - lastSaleAt < SELL_COOLDOWN_MS) return;
  lastSaleAt = performance.now();
  state.coins += sellPrice(gear);
  state.gear = state.gear.filter((g) => g.id !== id);
  if (state.equippedGear[gear.slot] === id) delete state.equippedGear[gear.slot];
  renderCoins();
  save();
  renderSwordList();
  renderGearAndPotions();
}

function drinkPotion(id) {
  const potion = state.potions.find((p) => p.id === id);
  if (!potion || activePotion(potion.type)) return;
  state.potions = state.potions.filter((p) => p.id !== id);
  state.activePotions[potion.type] = { strength: potion.strength, left: POTIONS[potion.type].lasts };
  save();
  renderGearAndPotions();
}

function renderGearAndPotions() {
  armoryEls.gearList.innerHTML = "";
  armoryEls.gearEmpty.hidden = state.gear.length > 0;
  [...state.gear].reverse().forEach((gear) => armoryEls.gearList.appendChild(gearCard(gear, true)));
  armoryEls.potionList.innerHTML = "";
  armoryEls.potionEmpty.hidden = state.potions.length > 0;
  [...state.potions].reverse().forEach((potion) => armoryEls.potionList.appendChild(potionCard(potion, true)));
  const active = Object.keys(POTIONS).map(activePotionText).filter(Boolean);
  armoryEls.activeEffects.hidden = active.length === 0;
  armoryEls.activeEffects.textContent = active.join(" · ");
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
  const elapsed = sword && yard.hits ? performance.now() - yard.firstSwingAt + swordSwingMs(sword) / 2 : 0;
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
  armoryEls.swordSlot.style.setProperty("--swing", (sword ? swordSwingMs(sword) : 500) + "ms");
  armoryEls.swing.disabled = !sword;
  armoryEls.swing.textContent = sword
    ? "Hold to swing " + sword.name
    : state.swords.length ? "Equip a sword to swing" : "Forge a sword to swing";
  renderDummyPicker();
  resetDummy();
  yard.nextSwingAt = 0;
  renderSwordList();
  renderGearAndPotions();
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
  const swingMs = swordSwingMs(sword);
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
  const direct = sword.damage * damageMultiplier();
  const dealt = Math.min(yard.hp, direct + bonus);
  yard.hp -= dealt;
  yard.dealt += dealt;
  floatNumber(formatNumber(direct), false);
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
  armoryEls.message.textContent = "Broken in " + seconds.toFixed(1) + "s and " + formatNumber(yard.hits) + (yard.hits === 1 ? " hit" : " hits");
  const message = armoryEls.message.textContent;
  yard.respawnTimer = setTimeout(() => {
    resetDummy();
    armoryEls.message.textContent = message;
  }, DUMMY_RESPAWN_MS);
}

function floatNumber(text, special) {
  if (!settingOn("numbers")) return;
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
  yard.holdPointer = null;
  clearTimeout(yard.swingTimer);
}

// Only the finger or button that started the swing can stop it
function stopSwingingPointer(e) {
  if (yard.holdPointer === e.pointerId) stopSwinging();
}

armoryEls.swordSlot.addEventListener("animationend", () => armoryEls.swordSlot.classList.remove("swinging"));
armoryEls.swing.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || yard.holding) return;
  yard.holdPointer = e.pointerId;
  startSwinging();
});
armoryEls.swing.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.code !== "Enter") return;
  e.preventDefault();
  if (!e.repeat) startSwinging();
});
armoryEls.swing.addEventListener("keyup", (e) => {
  if (e.code === "Space" || e.code === "Enter") stopSwinging();
});
armoryEls.swing.addEventListener("blur", stopSwinging);
armoryEls.swing.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("pointerup", stopSwingingPointer);
window.addEventListener("pointercancel", stopSwingingPointer);
window.addEventListener("blur", stopSwinging);
