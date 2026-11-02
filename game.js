const ROLL_COST = 25;
const START_COINS = 250;
const SAVE_KEY = "swordrng.save.v1";
const SHUFFLE_MS = 900;
const SHUFFLE_STEP_MS = 70;

const els = {
  coins: document.getElementById("coins"),
  gems: document.getElementById("soulGems"),
  stage: document.getElementById("stage"),
  name: document.getElementById("metalName"),
  tier: document.getElementById("metalTier"),
  odds: document.getElementById("metalOdds"),
  badge: document.getElementById("newBadge"),
  status: document.getElementById("status"),
  roll: document.getElementById("rollBtn"),
  found: document.getElementById("foundCount"),
  rolls: document.getElementById("rollCount"),
  grid: document.getElementById("metalGrid"),
  reset: document.getElementById("resetBtn"),
  tabs: [...document.querySelectorAll(".tab")],
  views: [...document.querySelectorAll(".view")],
};

const state = load();
const tiles = [];
let rolling = false;
let currentView = "roll";
let savesLocked = false; // set once a reset is underway or another tab has taken over

function freshSave() {
  return { coins: START_COINS, rolls: 0, counts: {}, metals: {}, swords: [], equipped: null, forge: null, swordSeq: 0, soulGems: 0, skills: {}, fields: { furthest: 1 }, essences: 0, gear: [], equippedGear: {}, potions: [], activePotions: {} };
}

// Function declarations: load() runs near the top of this file, before any const below it exists
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isAmount(v) {
  return Number.isFinite(v) && v >= 0;
}

function cleanMetalCounts(counts) {
  const clean = {};
  if (!isPlainObject(counts)) return clean;
  for (const [name, n] of Object.entries(counts)) {
    if (METAL_BY_NAME.has(name) && isAmount(n)) clean[name] = Math.floor(n);
  }
  return clean;
}

function validMaterials(materials) {
  return isPlainObject(materials) && Object.keys(materials).length > 0 &&
    Object.entries(materials).every(([name, n]) => METAL_BY_NAME.has(name) && isAmount(n));
}

function validSword(s) {
  return isPlainObject(s) && Number.isInteger(s.id) && Number.isInteger(s.tier) && !!SWORD_TIERS[s.tier] &&
    validMaterials(s.materials) && typeof s.name === "string" && /^#[0-9a-f]{6}$/i.test(s.color) &&
    isAmount(s.damage) && isAmount(s.worth) && isAmount(s.accuracy);
}

function validGear(g) {
  return isPlainObject(g) && Number.isInteger(g.id) && gearSlots().includes(g.slot) && validMaterials(g.materials) &&
    typeof g.name === "string" && /^#[0-9a-f]{6}$/i.test(g.color) && isAmount(g.power) && isAmount(g.worth) && isAmount(g.accuracy);
}

function validPotion(p) {
  return isPlainObject(p) && Number.isInteger(p.id) && Object.keys(POTIONS).includes(p.type) && isAmount(p.strength);
}

function validForge(f) {
  const score = (v) => v === null || isAmount(v);
  if (!isPlainObject(f) || !score(f.heat) || !score(f.quench) || !Array.isArray(f.strikes) || !f.strikes.every(isAmount)) return false;
  if (f.potion !== undefined) return Object.keys(POTIONS).includes(f.potion);
  return Number.isInteger(f.tier) && !!FORGE_RECIPES[f.tier] && validMaterials(f.materials);
}

// Damaged saves keep whatever is still usable, so one bad field can't brick the game
function cleanSave(saved) {
  const clean = freshSave();
  if (!isPlainObject(saved)) return clean;
  if (isAmount(saved.coins)) clean.coins = saved.coins;
  if (isAmount(saved.rolls)) clean.rolls = saved.rolls;
  if (isAmount(saved.soulGems)) clean.soulGems = saved.soulGems;
  clean.counts = cleanMetalCounts(saved.counts);
  // Saves from before forging only tracked lifetime counts, which were all still owned.
  clean.metals = cleanMetalCounts(saved.metals || saved.counts);
  if (Array.isArray(saved.swords)) clean.swords = saved.swords.filter(validSword);
  if (isAmount(saved.essences)) clean.essences = Math.floor(saved.essences);
  if (Array.isArray(saved.gear)) clean.gear = saved.gear.filter(validGear);
  if (Array.isArray(saved.potions)) clean.potions = saved.potions.filter(validPotion);
  if (isPlainObject(saved.equippedGear)) {
    for (const slot of gearSlots()) {
      if (clean.gear.some((g) => g.id === saved.equippedGear[slot] && g.slot === slot)) clean.equippedGear[slot] = saved.equippedGear[slot];
    }
  }
  if (isPlainObject(saved.activePotions)) {
    for (const type of Object.keys(POTIONS)) {
      const active = saved.activePotions[type];
      if (isPlainObject(active) && isAmount(active.strength) && isAmount(active.left) && active.left > 0) clean.activePotions[type] = active;
    }
  }
  const ids = [...clean.swords, ...clean.gear, ...clean.potions].map((item) => item.id);
  clean.swordSeq = Math.max(isAmount(saved.swordSeq) ? saved.swordSeq : 0, ...ids);
  if (clean.swords.some((s) => s.id === saved.equipped)) clean.equipped = saved.equipped;
  if (validForge(saved.forge)) clean.forge = saved.forge;
  if (isPlainObject(saved.skills)) clean.skills = saved.skills;
  if (isPlainObject(saved.fields) && isAmount(saved.fields.furthest)) clean.fields.furthest = Math.max(1, Math.floor(saved.fields.furthest));
  return clean;
}

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    return cleanSave(JSON.parse(raw));
  } catch (e) {
    // Unreadable save: keep a copy, because the next save overwrites it
    try {
      if (raw !== null) localStorage.setItem(SAVE_KEY + ".unreadable", raw);
    } catch (err) {}
    return freshSave();
  }
}

function save() {
  if (savesLocked) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // storage blocked: the game still works, progress just won't persist
  }
}

function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

function renderCoins() {
  els.coins.textContent = formatNumber(state.coins);
  els.gems.textContent = formatNumber(state.soulGems);
  // aria-disabled during the shuffle: really disabling it would drop keyboard focus each roll
  els.roll.setAttribute("aria-disabled", String(rolling));
  els.roll.disabled = !rolling && state.coins < ROLL_COST;
}

function renderProgress() {
  els.found.textContent = METALS.filter((m) => state.counts[m.name]).length;
  els.rolls.textContent = formatNumber(state.rolls);
}

function showView(view) {
  if (currentView === "armory" && view !== "armory") stopSwinging();
  currentView = view;
  els.views.forEach((v) => {
    v.hidden = v.dataset.view !== view;
  });
  els.tabs.forEach((t) => {
    t.setAttribute("aria-selected", String(t.dataset.view === view));
  });
  if (view === "forge" && !state.forge) showForgeSetup();
  if (view === "armory") renderArmory();
  if (view === "roll") renderBoosts();
  if (view === "fields" && !field) showFieldsLobby();
}

function setTabsLocked(locked, keepView = "forge") {
  els.tabs.forEach((t) => {
    t.disabled = locked && t.dataset.view !== keepView;
  });
}

function showMetal(metal) {
  els.stage.style.setProperty("--metal", metal.color);
  els.name.textContent = metal.name;
}

function reveal(metal, isNew) {
  showMetal(metal);
  els.stage.dataset.tier = metal.tier;
  els.stage.style.setProperty("--tier", TIERS[metal.tier].color);
  els.stage.classList.remove("rolling", "revealed");
  void els.stage.offsetWidth; // restart the reveal animation
  els.stage.classList.add("revealed");
  els.tier.textContent = TIERS[metal.tier].name + " · #" + metal.rank + " of " + METALS.length;
  els.odds.textContent = formatOdds(metal.oneIn);
  els.badge.hidden = !isNew;
  els.status.textContent =
    "You rolled " + metal.name + ", " + TIERS[metal.tier].name + ", " + formatOdds(metal.oneIn) + (isNew ? ". New metal!" : ".");
}

function roll() {
  if (rolling || state.coins < ROLL_COST) return;
  state.coins -= ROLL_COST;
  rolling = true;
  renderCoins();

  const metal = rollMetal(currentLuck());
  const isNew = !state.counts[metal.name];
  const finish = () => {
    state.counts[metal.name] = (state.counts[metal.name] || 0) + 1;
    state.metals[metal.name] = (state.metals[metal.name] || 0) + 1;
    state.rolls += 1;
    useUpPotion("luck");
    useUpPotion("speed");
    renderBoosts();
    rolling = false;
    reveal(metal, isNew);
    renderTile(metal);
    renderProgress();
    renderCoins();
    if (currentView === "forge" && !state.forge) {
      renderMaterials();
      renderSelection();
    }
    save();
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }

  els.stage.classList.remove("revealed");
  els.stage.classList.add("rolling");
  els.badge.hidden = true;
  els.tier.textContent = "Rolling…";
  els.odds.textContent = "";
  const shuffle = setInterval(() => showMetal(rollMetal()), SHUFFLE_STEP_MS);
  setTimeout(() => {
    clearInterval(shuffle);
    finish();
  }, SHUFFLE_MS / (1 + rollSpeedBonus()));
}

function buildGrid() {
  const fragment = document.createDocumentFragment();
  METALS.forEach((metal) => {
    const tile = document.createElement("li");
    tile.className = "tile";
    tile.dataset.tier = metal.tier;
    tile.style.setProperty("--tier", TIERS[metal.tier].color);
    tile.innerHTML =
      '<span class="swatch"></span><span class="tile-name"></span>' +
      '<span class="tile-odds"></span><span class="tile-count"></span>';
    tile.querySelector(".tile-odds").textContent = formatOdds(metal.oneIn);
    tiles[metal.rank - 1] = tile;
    fragment.appendChild(tile);
    renderTile(metal);
  });
  els.grid.appendChild(fragment);
}

// Found stays true forever; the count is how many are left to forge with.
function renderTile(metal) {
  const tile = tiles[metal.rank - 1];
  const found = state.counts[metal.name] > 0;
  tile.classList.toggle("found", found);
  tile.style.setProperty("--metal", found ? metal.color : "");
  tile.querySelector(".tile-name").textContent = found ? metal.name : "???";
  tile.querySelector(".tile-count").textContent = found ? "×" + formatNumber(state.metals[metal.name] || 0) : "";
}

els.roll.addEventListener("click", roll);
els.tabs.forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
els.reset.addEventListener("click", () => {
  if (!confirm("Erase your coins, metals and swords?")) return;
  savesLocked = true; // a roll finishing before the reload must not write the old save back
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  location.reload();
});

// Two tabs saving over each other would lose progress and could undo a botched forge,
// so a tab stops saving as soon as another one writes.
window.addEventListener("storage", (e) => {
  if (e.key !== SAVE_KEY && e.key !== null) return;
  savesLocked = true;
  document.getElementById("staleNotice").hidden = false;
});
document.getElementById("staleReloadBtn").addEventListener("click", () => location.reload());

buildGrid();
renderBoosts();
renderCoins();
renderProgress();
