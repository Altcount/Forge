// Sword sizes, stat formulas and minigame scoring. No page code lives here.
const SWORD_TIERS = [
  { name: "Light Sword", min: 2, max: 4, swingMs: 500, damageMult: 1, worthMult: 1, strikes: 4, speed: 1, bladeLen: 100, bladeHalf: 5, guardHalf: 16, grip: 16 },
  { name: "Medium Sword", min: 5, max: 7, swingMs: 800, damageMult: 1.1, worthMult: 1.1, strikes: 6, speed: 1.1, bladeLen: 125, bladeHalf: 7, guardHalf: 20, grip: 20 },
  { name: "Heavy Sword", min: 8, max: 10, swingMs: 1200, damageMult: 1.25, worthMult: 1.2, strikes: 8, speed: 1.2, bladeLen: 150, bladeHalf: 10, guardHalf: 25, grip: 26 },
  { name: "Greatsword", min: 10, max: 12, swingMs: 1800, damageMult: 1.5, worthMult: 1.3, strikes: 10, speed: 1.3, bladeLen: 178, bladeHalf: 14, guardHalf: 30, grip: 31 },
];

const INFINITY_BLADE = { name: "Infinity Blade", metal: "Mythril", tier: 0, amount: 4 };
const INFINITY_HITS_BEFORE_EFFECT = 10;

// Coins per point of metal value. Tuned against the 25 coin roll cost.
const WORTH_RATE = 0.55;

const METAL_BY_NAME = new Map(METALS.map((m) => [m.name, m]));

const metalPower = (metal) => Math.sqrt(metal.oneIn);
const metalValue = (metal) => Math.pow(metal.oneIn, 0.75);

function materialTotal(materials) {
  return Object.values(materials).reduce((sum, n) => sum + n, 0);
}

// The metal used most; ties go to the rarer one.
function dominantMetal(materials) {
  let best = null;
  for (const [name, count] of Object.entries(materials)) {
    if (count <= 0) continue;
    const metal = METAL_BY_NAME.get(name);
    if (!best || count > best.count || (count === best.count && metal.rank > best.metal.rank)) {
      best = { metal, count };
    }
  }
  return best ? best.metal : null;
}

// accuracy is 0 to 100. Summing per metal makes the result amount × average rarity.
function swordStats(tierIndex, materials, accuracy) {
  const tier = SWORD_TIERS[tierIndex];
  const a = accuracy / 100;
  let power = 0;
  let value = 0;
  for (const [name, count] of Object.entries(materials)) {
    const metal = METAL_BY_NAME.get(name);
    power += metalPower(metal) * count;
    value += metalValue(metal) * count;
  }
  return {
    damage: Math.max(1, Math.round(power * tier.damageMult * (0.5 + 0.5 * a))),
    worth: Math.max(1, Math.round(value * WORTH_RATE * tier.worthMult * (0.3 + a * a))),
  };
}

function isInfinityRecipe(tierIndex, materials, perfect) {
  return (
    perfect &&
    tierIndex === INFINITY_BLADE.tier &&
    materials[INFINITY_BLADE.metal] === INFINITY_BLADE.amount &&
    materialTotal(materials) === INFINITY_BLADE.amount
  );
}

function forgeScores(scores) {
  const hammer = scores.strikes.reduce((sum, s) => sum + s, 0) / scores.strikes.length;
  return {
    accuracy: scores.heat * 0.25 + hammer * 0.5 + scores.quench * 0.25,
    perfect: scores.heat === 100 && scores.quench === 100 && scores.strikes.every((s) => s === 100),
  };
}

function swordQuality(accuracy, perfect) {
  if (perfect) return "Perfect";
  if (accuracy >= 90) return "Masterwork";
  if (accuracy >= 75) return "Superior";
  if (accuracy >= 55) return "Fine";
  if (accuracy >= 30) return "Crude";
  return "Botched";
}

function buildSword(id, tierIndex, materials, scores) {
  const { accuracy, perfect } = forgeScores(scores);
  const dominant = dominantMetal(materials);
  const mixed = Object.values(materials).filter((n) => n > 0).length > 1;
  const infinity = isInfinityRecipe(tierIndex, materials, perfect);
  return Object.assign(swordStats(tierIndex, materials, accuracy), {
    id,
    tier: tierIndex,
    materials: Object.assign({}, materials),
    accuracy,
    perfect,
    infinity,
    color: dominant.color,
    name: infinity ? INFINITY_BLADE.name : dominant.name + (mixed ? " Alloy " : " ") + SWORD_TIERS[tierIndex].name,
  });
}

// Percent of max HP added to the hit that brings an enemy to totalHits.
// Hits 1-10 add nothing, then 11th = 2%, 12th = 4%, 13th = 8% and so on.
function infinityPercent(totalHits) {
  const past = totalHits - INFINITY_HITS_BEFORE_EFFECT;
  return past <= 0 ? 0 : Math.min(100, Math.pow(2, past));
}

// Minigame scoring: within perfectWithin scores exactly 100, and only that does.
function timingScore(error, perfectWithin, zeroAt) {
  if (error <= perfectWithin) return 100;
  if (error >= zeroAt) return 0;
  return Math.min(99, Math.round(100 * (1 - (error - perfectWithin) / (zeroAt - perfectWithin))));
}

const HEAT_PASS_MS = 1000;
const HEAT_PERFECT = 0.03;
const HEAT_ZERO = 0.18;
const HAMMER_RING_MS = 800;
const HAMMER_PERFECT_MS = 30;
const HAMMER_ZERO_MS = 180;
const QUENCH_FILL_MS = 1700;
const QUENCH_PERFECT = 0.03;
const QUENCH_ZERO = 0.15;

// Needle sweeps 0 → 1 → 0 at a steady speed.
function heatPosition(elapsedMs, speed) {
  const pass = HEAT_PASS_MS / speed;
  const p = (elapsedMs % (pass * 2)) / pass;
  return p <= 1 ? p : 2 - p;
}

function scoreHeat(elapsedMs, target, speed) {
  return timingScore(Math.abs(heatPosition(elapsedMs, speed) - target), HEAT_PERFECT, HEAT_ZERO);
}

const hammerRingMs = (speed) => HAMMER_RING_MS / speed;
const hammerLateMs = (speed) => HAMMER_ZERO_MS / speed;

function scoreHammer(elapsedMs, speed) {
  return timingScore(Math.abs(elapsedMs - hammerRingMs(speed)), HAMMER_PERFECT_MS / speed, hammerLateMs(speed));
}

// Level accelerates the longer it is held, and reaching 1 ruins the quench.
const quenchFillMs = (speed) => QUENCH_FILL_MS / speed;
const quenchLevel = (heldMs, speed) => Math.pow(heldMs / quenchFillMs(speed), 2);

function scoreQuench(heldMs, target, speed) {
  const level = quenchLevel(heldMs, speed);
  return level >= 1 ? 0 : timingScore(Math.abs(level - target), QUENCH_PERFECT, QUENCH_ZERO);
}

// All swords share a viewBox, so a heavier sword is visibly bigger side by side.
function swordSVG(tierIndex, color, infinity) {
  const guardY = 190;
  if (infinity) {
    return (
      '<svg class="sword-art" viewBox="0 0 80 240" aria-hidden="true">' +
      '<polygon points="40,20 31,38 31,190 40,190" fill="#f4f7fb"/>' +
      '<polygon points="40,20 49,38 49,190 40,190" fill="#aeb9c9"/>' +
      '<polygon points="40,52 45,62 45,172 40,180 35,172 35,62" fill="#6b4426"/>' +
      '<path d="M40 66V88L37 92V110L43 116V136L37 142V162M40 88L43 92V100M37 110H35M43 136H45" fill="none" stroke="#ffb45c" stroke-width="1.2"/>' +
      '<path d="M12 186Q26 182 40 190Q54 182 68 186L60 198Q50 194 40 198Q30 194 20 198Z" fill="#d9a93c"/>' +
      '<circle cx="40" cy="192" r="6.5" fill="#8e44d8" stroke="#f3d27a" stroke-width="1.5"/>' +
      '<circle cx="38" cy="190" r="1.8" fill="#e6c8ff"/>' +
      '<rect x="36" y="198" width="8" height="24" fill="#4c3322"/>' +
      '<path d="M36 204H44M36 210H44M36 216H44" stroke="#d9a93c" stroke-width="1.2"/>' +
      '<polygon points="40,221 46,228 40,236 34,228" fill="#d9a93c"/>' +
      "</svg>"
    );
  }
  const t = SWORD_TIERS[tierIndex];
  const tip = guardY - t.bladeLen;
  const shoulder = tip + t.bladeHalf * 2;
  const left = 40 - t.bladeHalf;
  const right = 40 + t.bladeHalf;
  const gripHalf = 3 + tierIndex;
  return (
    '<svg class="sword-art" viewBox="0 0 80 240" style="--metal:' + color + '" aria-hidden="true">' +
    `<polygon points="40,${tip} ${left},${shoulder} ${left},${guardY} 40,${guardY}" class="blade-light"/>` +
    `<polygon points="40,${tip} ${right},${shoulder} ${right},${guardY} 40,${guardY}" class="blade-dark"/>` +
    `<rect x="${40 - t.guardHalf}" y="${guardY}" width="${t.guardHalf * 2}" height="7" rx="2" class="guard"/>` +
    `<rect x="${40 - gripHalf}" y="${guardY + 7}" width="${gripHalf * 2}" height="${t.grip}" class="grip"/>` +
    `<circle cx="40" cy="${guardY + 7 + t.grip + 3}" r="${gripHalf + 2}" class="guard"/>` +
    "</svg>"
  );
}
