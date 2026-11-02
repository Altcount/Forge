// Gear and potions: what they cost, what they do, and how the bonuses add up. No page code lives here.
const GEAR_TYPES = [
  { slot: "charm", name: "Luck Charm", min: 3, max: 6, strikes: 5, speed: 1, worthMult: 1, line: "Better metal odds" },
  { slot: "gloves", name: "Swift Gloves", min: 3, max: 6, strikes: 5, speed: 1, worthMult: 1, line: "Faster rolls" },
];

// Everything the forge can make from metals. Indexes 0-3 are swords, the rest are gear.
const FORGE_RECIPES = [...SWORD_TIERS, ...GEAR_TYPES];
const isGearRecipe = (i) => i >= SWORD_TIERS.length;
const gearSlots = () => GEAR_TYPES.map((g) => g.slot);

const POTIONS = {
  luck: { name: "Luck Potion", color: "#6fd08c", lasts: 200, unit: "rolls" },
  speed: { name: "Speed Potion", color: "#5eb2ff", lasts: 200, unit: "rolls" },
  regen: { name: "Regen Potion", color: "#ff6d8f", lasts: 5, unit: "waves" },
};
const ESSENCES_PER_POTION = 2;
const BREW_RECIPE = { name: "Potion", speed: 1, strikes: 0 };

// Luck flattens the odds (see metalChance). The best charm plus the best potion
// makes Mythril about 100 times more likely.
const CHARM_LUCK = 0.32;
const POTION_LUCK = 0.2;
const GLOVES_SPEED = 1.5; // +150% roll speed from the best gloves
const POTION_SPEED = 1; // +100% from the best potion
const POTION_REGEN = 0.03; // share of max HP per second from the best potion
const CHARM_SELL_CUT = 0.75; // the best charm takes 75% off everything you sell
const GLOVES_SELL_CUT = 0.15;

const TOP_METAL_ODDS = Math.log(METALS[METALS.length - 1].oneIn);

// 0 to 1: rarer metals, better accuracy and more material all raise it
function gearPower(recipeIndex, materials, accuracy) {
  const recipe = FORGE_RECIPES[recipeIndex];
  const total = materialTotal(materials);
  let rarity = 0;
  for (const [name, count] of Object.entries(materials)) {
    rarity += (Math.log(METAL_BY_NAME.get(name).oneIn) / TOP_METAL_ODDS) * count;
  }
  const amount = 0.7 + (0.3 * (total - recipe.min)) / (recipe.max - recipe.min);
  return (rarity / total) * amount * (0.5 + (0.5 * accuracy) / 100);
}

function gearWorth(recipeIndex, materials, accuracy) {
  const a = accuracy / 100;
  let value = 0;
  for (const [name, count] of Object.entries(materials)) value += metalValue(METAL_BY_NAME.get(name)) * count;
  return Math.max(1, Math.round(value * WORTH_RATE * FORGE_RECIPES[recipeIndex].worthMult * (0.3 + a * a)));
}

function buildGear(id, recipeIndex, materials, scores) {
  const { accuracy, perfect } = forgeScores(scores);
  const recipe = FORGE_RECIPES[recipeIndex];
  const dominant = dominantMetal(materials);
  const mixed = Object.values(materials).filter((n) => n > 0).length > 1;
  return {
    id,
    slot: recipe.slot,
    materials: Object.assign({}, materials),
    accuracy,
    perfect,
    power: gearPower(recipeIndex, materials, accuracy),
    worth: gearWorth(recipeIndex, materials, accuracy),
    color: dominant.color,
    name: dominant.name + (mixed ? " Alloy " : " ") + recipe.name,
  };
}

function gearEffectText(slot, power) {
  return slot === "charm"
    ? "Luck ×" + luckMultiplier(power * CHARM_LUCK).toFixed(1)
    : "+" + Math.round(power * GLOVES_SPEED * 100) + "% roll speed";
}

// Strength runs from 0.4 to 1, so even a bad brew does something
const potionStrength = (score) => 0.4 + (0.6 * score) / 100;

function potionEffectText(type, strength) {
  if (type === "luck") return "Luck ×" + luckMultiplier(strength * POTION_LUCK).toFixed(1);
  if (type === "speed") return "+" + Math.round(strength * POTION_SPEED * 100) + "% roll speed";
  return "Heals " + (strength * POTION_REGEN * 100).toFixed(1) + "% of max HP per second";
}

function equippedGear(slot) {
  return state.gear.find((g) => g.id === state.equippedGear[slot]) || null;
}

function activePotion(type) {
  const active = state.activePotions[type];
  return active && active.left > 0 ? active : null;
}

function currentLuck() {
  const charm = equippedGear("charm");
  const potion = activePotion("luck");
  return (charm ? charm.power * CHARM_LUCK : 0) + (potion ? potion.strength * POTION_LUCK : 0);
}

function rollSpeedBonus() {
  const gloves = equippedGear("gloves");
  const potion = activePotion("speed");
  return (gloves ? gloves.power * GLOVES_SPEED : 0) + (potion ? potion.strength * POTION_SPEED : 0);
}

function regenPerSecond() {
  const potion = activePotion("regen");
  return potion ? potion.strength * POTION_REGEN : 0;
}

// Counts the strongest trinket owned in each slot, worn or not, so swapping to a weak charm
// just before selling doesn't dodge it. A trinket doesn't cut its own sale price.
function sellCut(excludeId) {
  const best = (slot) => state.gear.reduce((top, g) => (g.slot === slot && g.id !== excludeId ? Math.max(top, g.power) : top), 0);
  return best("charm") * CHARM_SELL_CUT + best("gloves") * GLOVES_SELL_CUT;
}

function sellPrice(item) {
  return Math.max(1, Math.round(item.worth * (1 - sellCut(item.id))));
}

function useUpPotion(type) {
  const potion = activePotion(type);
  if (!potion) return;
  potion.left -= 1;
  if (potion.left <= 0) delete state.activePotions[type];
}

function activePotionText(type) {
  const potion = activePotion(type);
  if (!potion) return "";
  const def = POTIONS[type];
  return def.name + ": " + potion.left + " " + (potion.left === 1 ? def.unit.slice(0, -1) : def.unit) + " left";
}

function gearSVG(slot, color) {
  const art =
    slot === "charm"
      ? '<path d="M18 40Q40 120 62 40" fill="none" stroke="#b08d4a" stroke-width="3"/>' +
        '<circle cx="40" cy="118" r="30" class="blade-dark"/><circle cx="40" cy="118" r="22" class="blade-light"/>' +
        '<polygon points="40,102 45,113 57,114 48,122 51,134 40,128 29,134 32,122 23,114 35,113" class="guard"/>'
      : '<path d="M20 190V116Q20 106 28 108V76Q28 68 34 68T40 76V62Q40 54 46 54T52 62V76Q52 70 58 70T64 78V112L72 100Q78 94 80 102L68 142Q64 160 64 190Z" class="blade-light"/>' +
        '<rect x="18" y="168" width="48" height="22" rx="3" class="blade-dark"/>';
  return '<svg class="sword-art" viewBox="0 0 80 240" style="--metal:' + color + '" aria-hidden="true">' + art + "</svg>";
}

function potionSVG(type) {
  return (
    '<svg class="sword-art" viewBox="0 0 80 240" aria-hidden="true">' +
    '<path d="M32 70H48V104L68 160Q72 190 54 190H26Q8 190 12 160L32 104Z" fill="#ffffff22" stroke="#d8d4c8" stroke-width="3"/>' +
    '<path d="M24 134H56L65 162Q68 186 53 186H27Q12 186 15 162Z" fill="' + POTIONS[type].color + '"/>' +
    '<rect x="28" y="58" width="24" height="14" rx="3" fill="#8a5a32"/>' +
    "</svg>"
  );
}

function recipeArt(recipeIndex, color) {
  return isGearRecipe(recipeIndex) ? gearSVG(FORGE_RECIPES[recipeIndex].slot, color) : swordSVG(recipeIndex, color);
}

function renderBoosts() {
  const parts = [];
  const luck = currentLuck();
  const speed = rollSpeedBonus();
  if (luck > 0) parts.push("Luck ×" + luckMultiplier(luck).toFixed(1));
  if (speed > 0) parts.push("+" + Math.round(speed * 100) + "% roll speed");
  ["luck", "speed"].forEach((type) => {
    const text = activePotionText(type);
    if (text) parts.push(text);
  });
  const el = document.getElementById("rollBoosts");
  el.hidden = parts.length === 0;
  el.textContent = parts.join(" · ");
}
