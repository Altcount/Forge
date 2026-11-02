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

function load() {
  const fresh = { coins: START_COINS, rolls: 0, counts: {}, metals: {}, swords: [], equipped: null, forge: null, swordSeq: 0, soulGems: 0, fields: { furthest: 1 } };
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    // Saves from before forging only tracked lifetime counts, which were all still owned.
    if (saved && !saved.metals) saved.metals = Object.assign({}, saved.counts);
    return Object.assign(fresh, saved);
  } catch (e) {
    return fresh;
  }
}

function save() {
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
  els.roll.disabled = rolling || state.coins < ROLL_COST;
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

  const metal = rollMetal();
  const isNew = !state.counts[metal.name];
  const finish = () => {
    state.counts[metal.name] = (state.counts[metal.name] || 0) + 1;
    state.metals[metal.name] = (state.metals[metal.name] || 0) + 1;
    state.rolls += 1;
    rolling = false;
    reveal(metal, isNew);
    renderTile(metal);
    renderProgress();
    renderCoins();
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
  }, SHUFFLE_MS);
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
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  location.reload();
});

buildGrid();
renderCoins();
renderProgress();
