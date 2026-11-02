const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 225;
const PLAYER_MAX_HP = 100;
const PLAYER_HIT_IFRAMES = 0.6;
const WAVE_CLEAR_HEAL = 30;
const INTERMISSION_SECONDS = 2.5;
const SOUL_GEM_CHANCE = 0.01;
const BOSS_SOUL_GEM_CHANCE = 0.15;
const PICKUP_RADIUS = 95;

// Always usable, so a player with no coins, metals or swords can still earn their way back
const BARE_HANDS = { name: "Bare Hands", damage: 3, swingMs: 600, reach: 48, arc: 80, color: "#d8c0a0", infinity: false };
const TIER_REACH = [75, 90, 110, 135];
const TIER_ARC = [90, 110, 140, 180];

const enemyHp = (wave) => 12 * Math.pow(1.2, wave - 1);
const enemyDamage = (wave) => Math.min(40, 6 + 1.2 * (wave - 1));
const enemyGold = (wave) => Math.round(3 * Math.pow(1.13, wave - 1));
const enemyCount = (wave) => Math.min(30, 4 + wave);
const soulGemDrop = (wave) => 1 + Math.floor((wave - 1) / 10);

const ENEMY_TYPES = [
  { minWave: 1, r: 13, speed: 70, hp: 1, dmg: 1, gold: 1, color: "#b5564a" },
  { minWave: 3, r: 10, speed: 128, hp: 0.6, dmg: 0.7, gold: 1, color: "#d9a13c" },
  { minWave: 5, r: 20, speed: 45, hp: 2.6, dmg: 1.5, gold: 2, color: "#6d4f8c" },
  { minWave: 7, r: 12, speed: 55, hp: 0.8, dmg: 0.8, gold: 1.5, color: "#3f8f8a", ranged: true },
];

const fieldEls = {
  lobby: document.getElementById("fieldsLobby"),
  runPanel: document.getElementById("fieldsRun"),
  lastRun: document.getElementById("fieldsLastRun"),
  weapon: document.getElementById("fieldsWeapon"),
  waveValue: document.getElementById("waveValue"),
  waveRange: document.getElementById("waveRange"),
  waveMinus: document.getElementById("waveMinus"),
  wavePlus: document.getElementById("wavePlus"),
  furthest: document.getElementById("furthestWave"),
  start: document.getElementById("startFieldBtn"),
  leave: document.getElementById("leaveFieldBtn"),
  canvas: document.getElementById("fieldCanvas"),
  hudWave: document.getElementById("hudWave"),
  hudHpFill: document.getElementById("hudHpFill"),
  hudHpText: document.getElementById("hudHpText"),
  hudEarned: document.getElementById("hudEarned"),
  bossBar: document.getElementById("bossBar"),
  bossName: document.getElementById("bossName"),
  bossFill: document.getElementById("bossFill"),
};
const fieldCtx = fieldEls.canvas.getContext("2d");
const fieldKeys = new Set();
const MOVE_KEYS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };

let field = null; // the live run, null in the lobby

/* Geometry and movement helpers, shared with bosses.js */

const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const aimAt = (e, f) => Math.atan2(f.player.y - e.y, f.player.x - e.x);

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function moveToward(e, x, y, speed, dt) {
  const dx = x - e.x;
  const dy = y - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1 || !speed) return;
  const step = Math.min(dist, speed * dt);
  e.x += (dx / dist) * step;
  e.y += (dy / dist) * step;
  if (field) {
    e.x = clamp(e.x, e.r, field.w - e.r);
    e.y = clamp(e.y, e.r, field.h - e.r);
  }
}

// Returns false when a wall stopped the move
function moveBy(f, e, dx, dy) {
  const x = clamp(e.x + dx, e.r, f.w - e.r);
  const y = clamp(e.y + dy, e.r, f.h - e.r);
  const moved = x === e.x + dx && y === e.y + dy;
  e.x = x;
  e.y = y;
  return moved;
}

function keepRange(e, f, range, dt) {
  const dist = Math.hypot(f.player.x - e.x, f.player.y - e.y);
  if (dist > range + 20) moveToward(e, f.player.x, f.player.y, e.speed, dt);
  else if (dist < range - 20) moveToward(e, e.x * 2 - f.player.x, e.y * 2 - f.player.y, e.speed, dt);
}

function teleportAwayFromPlayer(f, e, minDist, maxDist) {
  const a = Math.random() * TAU;
  const dist = minDist + Math.random() * (maxDist - minDist);
  e.x = clamp(f.player.x + Math.cos(a) * dist, e.r, f.w - e.r);
  e.y = clamp(f.player.y + Math.sin(a) * dist, e.r, f.h - e.r);
}

/* Things enemies and bosses create */

function shoot(f, x, y, angle, speed, opts) {
  f.shots.push(Object.assign({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 6, dmg: 5, color: "#fff", life: 5 }, opts));
}

// Zones warn for `delay` seconds, then hurt for `life` seconds
function addZone(f, zone) {
  f.zones.push(Object.assign({ t: 0, delay: 0.8, life: 0.2, dmg: 0 }, zone));
}

function addRing(f, ring) {
  f.rings.push(Object.assign({ r: 0, gapSize: 0 }, ring));
}

function makeEnemy(f, opts) {
  const e = Object.assign({ hits: 0, cd: 0, cd2: 0, t: 0, vuln: 1, dead: false, summoned: false }, opts);
  f.enemies.push(e);
  return e;
}

function summon(f, boss, opts) {
  const hp = opts.oneHit ? 1 : Math.max(1, boss.maxHp * (opts.hpShare || 0.03));
  return makeEnemy(f, Object.assign({ summoned: true, hp, maxHp: hp, dmg: boss.dmg * (opts.dmgMult === undefined ? 1 : opts.dmgMult) }, opts));
}

const countSummons = (f) => f.enemies.filter((e) => e.summoned && !e.dead).length;

/* Run flow */

function fieldWeapon() {
  const sword = equippedSword();
  if (!sword) return BARE_HANDS;
  return {
    name: sword.name,
    damage: sword.damage,
    swingMs: SWORD_TIERS[sword.tier].swingMs,
    reach: TIER_REACH[sword.tier],
    arc: TIER_ARC[sword.tier],
    color: sword.infinity ? "#f4f7fb" : sword.color,
    infinity: sword.infinity,
  };
}

function furthestWave() {
  return Math.max(1, Math.floor(state.fields.furthest) || 1);
}

function shuffledBosses() {
  const bag = BOSSES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function createField(wave, w, h) {
  return {
    w,
    h,
    wave,
    phase: "spawning",
    time: 0,
    player: { x: w / 2, y: h / 2, hp: PLAYER_MAX_HP, iframes: 0, slow: 0, pushX: 0, pushY: 0, swingCd: 0, swingLand: 0, swingAngle: 0, swingShow: 0, target: null, pointer: null },
    weapon: fieldWeapon(),
    enemies: [],
    shots: [],
    rings: [],
    zones: [],
    drops: [],
    floats: [],
    spawnLeft: 0,
    spawnTimer: 0,
    phaseTimer: 0,
    bossBag: [],
    boss: null,
    earnedCoins: 0,
    earnedGems: 0,
    wavesCleared: 0,
    shake: 0,
    banner: null,
    saveIn: 2,
    dirty: false,
  };
}

function beginWave(f, wave) {
  f.wave = wave;
  f.phase = "spawning";
  f.spawnLeft = enemyCount(wave);
  f.spawnTimer = 0.4;
  f.boss = null;
  f.banner = { text: "Wave " + wave, t: 1.6 };
  if (wave > state.fields.furthest) {
    state.fields.furthest = wave;
    f.dirty = true;
  }
}

function spawnEnemy(f) {
  const types = ENEMY_TYPES.filter((t) => f.wave >= t.minWave);
  const type = types[Math.floor(Math.random() * types.length)];
  const hp = enemyHp(f.wave) * type.hp;
  const edge = Math.floor(Math.random() * 4);
  const along = Math.random();
  makeEnemy(f, {
    x: edge === 0 ? type.r : edge === 1 ? f.w - type.r : along * f.w,
    y: edge === 2 ? type.r : edge === 3 ? f.h - type.r : along * f.h,
    r: type.r,
    speed: type.speed * (1 + Math.min(0.4, f.wave * 0.01)),
    hp,
    maxHp: hp,
    dmg: enemyDamage(f.wave) * type.dmg,
    gold: enemyGold(f.wave) * type.gold,
    color: type.color,
    ranged: type.ranged,
  });
}

// Bosses come from a shuffled bag, so all 20 appear before any of them repeats
function spawnBoss(f) {
  if (!f.bossBag.length) {
    const last = f.lastBoss;
    f.bossBag = shuffledBosses();
    if (f.bossBag[f.bossBag.length - 1] === last) f.bossBag.unshift(f.bossBag.pop());
  }
  const def = f.bossBag.pop();
  f.lastBoss = def;
  const hp = enemyHp(f.wave) * def.hp;
  const farX = f.player.x < f.w / 2 ? f.w - 90 : 90;
  const farY = f.player.y < f.h / 2 ? f.h - 90 : 90;
  const boss = makeEnemy(f, {
    def,
    isBoss: true,
    x: farX,
    y: farY,
    r: def.radius,
    speed: def.speed,
    hp,
    maxHp: hp,
    dmg: enemyDamage(f.wave),
    gold: enemyGold(f.wave) * 15,
    color: def.color,
    cd: 1.2,
    cd2: 1.2,
  });
  if (def.init) def.init(boss, f);
  f.boss = boss;
  f.phase = "boss";
  f.banner = { text: def.name, t: 1.8 };
  f.shots = [];
}

function waveCleared(f) {
  f.wavesCleared += 1;
  f.enemies = [];
  f.shots = [];
  f.rings = [];
  f.zones = [];
  f.drops.forEach((d) => collectDrop(f, d));
  f.drops = [];
  f.boss = null;
  f.phase = "intermission";
  f.phaseTimer = INTERMISSION_SECONDS;
  f.player.hp = Math.min(PLAYER_MAX_HP, f.player.hp + WAVE_CLEAR_HEAL);
  f.player.target = null;
  f.banner = { text: "Wave " + f.wave + " cleared", t: 2 };
  save();
}

function endRun(reason) {
  const f = field;
  if (!f) return;
  cancelAnimationFrame(f.raf);
  field = null;
  fieldKeys.clear();
  setTabsLocked(false);
  save();
  fieldEls.lastRun.hidden = false;
  fieldEls.lastRun.textContent =
    (reason === "died" ? "You fell on wave " : "You left on wave ") + f.wave + " and kept " +
    formatNumber(f.earnedCoins) + " coins and " + formatNumber(f.earnedGems) + " soul gem" + (f.earnedGems === 1 ? "" : "s") + ".";
  showFieldsLobby();
}

/* Combat */

function hurtPlayer(f, amount) {
  const p = f.player;
  if (p.iframes > 0 || f.phase === "dead" || !(amount > 0)) return false;
  p.hp -= amount;
  p.iframes = PLAYER_HIT_IFRAMES;
  f.shake = 6;
  addFloat(f, p.x, p.y - 22, "-" + formatNumber(amount), "#ff7a6b");
  if (p.hp <= 0) {
    p.hp = 0;
    f.phase = "dead";
    f.phaseTimer = 1.2;
    f.banner = { text: "You fell", t: 1.2 };
  }
  return true;
}

function addFloat(f, x, y, text, color) {
  f.floats.push({ x, y, text, color, t: 0.8 });
  if (f.floats.length > 60) f.floats.shift();
}

function hitEnemy(f, e, weapon) {
  if (e.invuln) {
    addFloat(f, e.x, e.y - e.r - 6, "Shielded", "#a8f0ff");
    return;
  }
  e.hits += 1;
  const percent = weapon.infinity ? infinityPercent(e.hits) : 0;
  const direct = weapon.damage * e.vuln;
  e.hp -= direct + (e.maxHp * percent) / 100;
  addFloat(f, e.x + (Math.random() - 0.5) * e.r, e.y - e.r - 4, formatNumber(direct), "#f1ece2");
  if (percent) addFloat(f, e.x, e.y - e.r - 22, percent + "% of max HP", "#d9b3ff");
  if (e.def && e.def.onHit) e.def.onHit(e, f);
  if (e.hp <= 0) killEnemy(f, e);
}

function killEnemy(f, e) {
  if (e.dead) return;
  e.dead = true;
  if (e.summoned) return; // no loot from summons, or bosses could be farmed forever
  dropLoot(f, e);
  if (e.isBoss) waveCleared(f);
}

function dropLoot(f, e) {
  const scatter = () => (Math.random() - 0.5) * 30;
  f.drops.push({ kind: "gold", amount: Math.max(1, Math.round(e.gold)), x: e.x + scatter(), y: e.y + scatter() });
  if (Math.random() < (e.isBoss ? BOSS_SOUL_GEM_CHANCE : SOUL_GEM_CHANCE)) {
    f.drops.push({ kind: "gem", amount: soulGemDrop(f.wave), x: e.x + scatter(), y: e.y + scatter() });
  }
}

function collectDrop(f, d) {
  if (d.kind === "gold") {
    state.coins += d.amount;
    f.earnedCoins += d.amount;
    addFloat(f, f.player.x, f.player.y - 34, "+" + formatNumber(d.amount), "#f0c040");
  } else {
    state.soulGems += d.amount;
    f.earnedGems += d.amount;
    addFloat(f, f.player.x, f.player.y - 48, "+" + d.amount + " soul gem", "#b78cff");
  }
  f.dirty = true;
  renderCoins();
}

function canReach(p, e, weapon) {
  return !e.untargetable && Math.hypot(e.x - p.x, e.y - p.y) <= weapon.reach + e.r;
}

function angleGap(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

// Swings start by themselves at the sword's speed whenever something is in reach
function updateSwing(f, dt) {
  const p = f.player;
  const w = f.weapon;
  p.swingCd -= dt;
  p.swingShow = Math.max(0, p.swingShow - dt);
  if (p.swingLand > 0) {
    p.swingLand -= dt;
    if (p.target && !p.target.dead) p.swingAngle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
    if (p.swingLand <= 0) {
      const arc = (w.arc * Math.PI) / 180;
      for (const e of f.enemies.slice()) {
        if (e.dead || !canReach(p, e, w)) continue;
        const close = Math.hypot(e.x - p.x, e.y - p.y) <= e.r + PLAYER_RADIUS;
        if (close || angleGap(Math.atan2(e.y - p.y, e.x - p.x), p.swingAngle) <= arc / 2) hitEnemy(f, e, w);
        if (f.phase === "intermission" || f.phase === "dead") break;
      }
    }
  }
  if (p.swingCd > 0 || p.swingLand > 0) return;
  let nearest = null;
  let best = Infinity;
  for (const e of f.enemies) {
    if (e.dead || !canReach(p, e, w)) continue;
    const dist = Math.hypot(e.x - p.x, e.y - p.y) - e.r;
    if (dist < best) {
      best = dist;
      nearest = e;
    }
  }
  if (!nearest) return;
  p.target = nearest;
  p.swingAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
  p.swingCd = w.swingMs / 1000;
  p.swingLand = p.swingCd / 2;
  p.swingShow = p.swingCd;
}

function updatePlayer(f, dt) {
  const p = f.player;
  p.iframes = Math.max(0, p.iframes - dt);
  p.slow = Math.max(0, p.slow - dt);
  let dx = 0;
  let dy = 0;
  fieldKeys.forEach((code) => {
    const move = MOVE_KEYS[code];
    if (move) {
      dx += move[0];
      dy += move[1];
    }
  });
  if (!dx && !dy && p.pointer) {
    const toX = p.pointer.x - p.x;
    const toY = p.pointer.y - p.y;
    if (Math.hypot(toX, toY) > 6) {
      dx = toX;
      dy = toY;
    }
  }
  const length = Math.hypot(dx, dy);
  const speed = PLAYER_SPEED * (p.slow > 0 ? 0.55 : 1);
  const moveX = length ? (dx / length) * speed : 0;
  const moveY = length ? (dy / length) * speed : 0;
  p.x = clamp(p.x + (moveX + p.pushX) * dt, PLAYER_RADIUS, f.w - PLAYER_RADIUS);
  p.y = clamp(p.y + (moveY + p.pushY) * dt, PLAYER_RADIUS, f.h - PLAYER_RADIUS);
  p.pushX = 0;
  p.pushY = 0;
}

function updateEnemies(f, dt) {
  const p = f.player;
  for (const e of f.enemies.slice()) {
    if (e.dead) continue;
    if (e.def) e.def.update(e, f, dt);
    else if (e.ai) e.ai(e, f, dt);
    else if (e.ranged) {
      keepRange(e, f, 210, dt);
      e.cd -= dt;
      if (e.cd <= 0) {
        e.cd = 2.2;
        shoot(f, e.x, e.y, aimAt(e, f), 190, { dmg: e.dmg, color: e.color, r: 5 });
      }
    } else moveToward(e, p.x, p.y, e.speed, dt);
    if (!e.noContact && !e.untargetable && Math.hypot(e.x - p.x, e.y - p.y) < e.r + PLAYER_RADIUS) hurtPlayer(f, e.dmg);
    if (f.phase === "dead") return;
  }
  // Keep regular enemies from stacking into one blob
  const crowd = f.enemies.filter((e) => !e.isBoss && !e.dead && e.speed > 0);
  for (let i = 0; i < crowd.length; i++) {
    for (let j = i + 1; j < crowd.length; j++) {
      const a = crowd[i];
      const b = crowd[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const overlap = a.r + b.r - dist;
      if (overlap <= 0) continue;
      const pushX = (dx / dist) * overlap * 0.5;
      const pushY = (dy / dist) * overlap * 0.5;
      moveBy(f, a, -pushX, -pushY);
      moveBy(f, b, pushX, pushY);
    }
  }
}

function updateShots(f, dt) {
  const p = f.player;
  f.shots = f.shots.filter((s) => {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x < -20 || s.y < -20 || s.x > f.w + 20 || s.y > f.h + 20) return false;
    if (Math.hypot(s.x - p.x, s.y - p.y) >= s.r + PLAYER_RADIUS) return true;
    if (hurtPlayer(f, s.dmg)) {
      if (s.slow) p.slow = s.slow;
      if (s.heal && s.owner && !s.owner.dead) s.owner.hp = Math.min(s.owner.maxHp, s.owner.hp + s.owner.maxHp * s.heal);
    }
    return false;
  });
}

function updateRings(f, dt) {
  const p = f.player;
  const limit = Math.hypot(f.w, f.h);
  f.rings = f.rings.filter((ring) => {
    ring.r += ring.speed * dt;
    const dist = Math.hypot(p.x - ring.x, p.y - ring.y);
    if (Math.abs(dist - ring.r) < ring.width / 2 + PLAYER_RADIUS) {
      const inGap = ring.gapSize && angleGap(Math.atan2(p.y - ring.y, p.x - ring.x), ring.gapAngle) < ring.gapSize / 2;
      if (!inGap) hurtPlayer(f, ring.dmg);
    }
    return ring.r < limit;
  });
}

function zoneTouchesPlayer(z, p) {
  if (z.kind === "line") return distToSegment(p.x, p.y, z.x1, z.y1, z.x2, z.y2) < z.width / 2 + PLAYER_RADIUS;
  const dist = Math.hypot(p.x - z.x, p.y - z.y);
  if (z.kind === "band") return dist > z.r1 - PLAYER_RADIUS && dist < z.r2 + PLAYER_RADIUS;
  return dist < z.r + PLAYER_RADIUS;
}

function updateZones(f, dt) {
  f.zones = f.zones.filter((z) => {
    z.t += dt;
    if (z.t >= z.delay && z.dmg && zoneTouchesPlayer(z, f.player)) {
      if (hurtPlayer(f, z.dmg) && z.slow) f.player.slow = z.slow;
    }
    return z.t < z.delay + z.life;
  });
}

function updateDrops(f, dt) {
  const p = f.player;
  f.drops = f.drops.filter((d) => {
    const dist = Math.hypot(d.x - p.x, d.y - p.y);
    if (dist < PLAYER_RADIUS + 8) {
      collectDrop(f, d);
      return false;
    }
    if (dist < PICKUP_RADIUS) {
      d.x += ((p.x - d.x) / dist) * 340 * dt;
      d.y += ((p.y - d.y) / dist) * 340 * dt;
    }
    return true;
  });
}

// One tick of the run. Kept free of drawing so it can be stepped directly.
function fieldStep(f, dt) {
  f.time += dt;
  f.shake = Math.max(0, f.shake - dt * 30);
  if (f.banner) {
    f.banner.t -= dt;
    if (f.banner.t <= 0) f.banner = null;
  }
  f.floats = f.floats.filter((n) => {
    n.t -= dt;
    n.y -= 34 * dt;
    return n.t > 0;
  });
  f.saveIn -= dt;
  if (f.saveIn <= 0) {
    f.saveIn = 2;
    if (f.dirty) {
      f.dirty = false;
      save();
    }
  }

  if (f.phase === "dead") {
    f.phaseTimer -= dt;
    if (f.phaseTimer <= 0) endRun("died");
    return;
  }

  updatePlayer(f, dt);
  updateDrops(f, dt);

  if (f.phase === "intermission") {
    f.phaseTimer -= dt;
    if (f.phaseTimer <= 0) beginWave(f, f.wave + 1);
    return;
  }

  if (f.phase === "spawning" && f.spawnLeft > 0) {
    f.spawnTimer -= dt;
    if (f.spawnTimer <= 0) {
      spawnEnemy(f);
      f.spawnLeft -= 1;
      f.spawnTimer = Math.max(0.25, 0.8 - f.wave * 0.015);
    }
  }

  updateEnemies(f, dt);
  if (f.phase === "dead") return;
  updateSwing(f, dt);
  if (f.phase === "intermission" || f.phase === "dead") return;
  updateShots(f, dt);
  updateRings(f, dt);
  updateZones(f, dt);
  f.enemies = f.enemies.filter((e) => !e.dead);

  if (f.phase === "spawning" && f.spawnLeft === 0 && f.enemies.length === 0) spawnBoss(f);
}

/* Drawing */

function drawZone(ctx, z) {
  const active = z.t >= z.delay;
  const warm = Math.min(1, z.t / Math.max(0.01, z.delay));
  ctx.strokeStyle = z.color;
  ctx.fillStyle = z.color;
  if (z.kind === "line") {
    ctx.globalAlpha = active ? 0.9 : 0.14 + warm * 0.22;
    ctx.lineWidth = z.width;
    ctx.beginPath();
    ctx.moveTo(z.x1, z.y1);
    ctx.lineTo(z.x2, z.y2);
    ctx.stroke();
  } else if (z.kind === "band") {
    ctx.globalAlpha = active ? 0.75 : 0.1 + warm * 0.22;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r2, 0, TAU);
    ctx.arc(z.x, z.y, z.r1, 0, TAU, true);
    ctx.fill();
  } else {
    ctx.globalAlpha = active ? (z.life > 1 ? 0.45 : 0.75) : 0.1 + warm * 0.22;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, TAU);
    ctx.fill();
    if (!active) {
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * warm, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx, e, f) {
  if (e.draw) e.draw(ctx, e, f);
  else if (e.def) e.def.draw(ctx, e, f);
  else {
    disc(ctx, e.x, e.y, e.r, e.color);
    eyes(ctx, e, "#14110c", 0.32, -0.15, 0.16);
  }
  if (!e.isBoss && e.hp < e.maxHp && !e.oneHit) {
    ctx.fillStyle = "#00000099";
    ctx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2, 4);
    ctx.fillStyle = "#e0604c";
    ctx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2 * Math.max(0, e.hp / e.maxHp), 4);
  }
}

function drawPlayer(ctx, f) {
  const p = f.player;
  const w = f.weapon;
  // Faint reach circle, so players can see how close a sword has to get
  ctx.strokeStyle = "#ffffff14";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, w.reach, 0, TAU);
  ctx.stroke();

  const arc = (w.arc * Math.PI) / 180;
  const progress = p.swingCd > 0 ? 1 - p.swingCd / (w.swingMs / 1000) : 1;
  if (p.swingShow > 0 && progress < 1) {
    ctx.fillStyle = w.color;
    ctx.globalAlpha = 0.16 * (1 - progress);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, w.reach, p.swingAngle - arc / 2, p.swingAngle + arc / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const bladeAngle = p.swingShow > 0 ? p.swingAngle - arc / 2 + arc * Math.min(1, progress * 2) : -0.9;
  ctx.strokeStyle = w.color;
  ctx.lineWidth = w === BARE_HANDS ? 7 : 4 + (w.reach - 75) / 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(bladeAngle) * w.reach, p.y + Math.sin(bladeAngle) * w.reach);
  ctx.stroke();
  ctx.lineCap = "butt";

  const flash = p.iframes > 0 && Math.floor(f.time * 16) % 2 === 0;
  ctx.globalAlpha = flash ? 0.45 : 1;
  disc(ctx, p.x, p.y, PLAYER_RADIUS, p.slow > 0 ? "#a8dcf5" : "#f1ece2");
  disc(ctx, p.x, p.y, PLAYER_RADIUS * 0.55, "#c4752f");
  ctx.globalAlpha = 1;
}

function drawField(f) {
  const ctx = fieldCtx;
  const canvas = fieldEls.canvas;
  const scale = canvas.width / f.w;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#1d2a1c";
  ctx.fillRect(0, 0, f.w, f.h);
  ctx.fillStyle = "#223222";
  for (let x = 0; x < f.w; x += 60) {
    for (let y = (x / 60) % 2 ? 30 : 0; y < f.h; y += 60) ctx.fillRect(x, y, 2, 6);
  }
  if (f.shake > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    ctx.translate((Math.random() - 0.5) * f.shake, (Math.random() - 0.5) * f.shake);
  }
  f.zones.forEach((z) => drawZone(ctx, z));
  f.rings.forEach((ring) => {
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.beginPath();
    if (ring.gapSize) ctx.arc(ring.x, ring.y, ring.r, ring.gapAngle + ring.gapSize / 2, ring.gapAngle - ring.gapSize / 2 + TAU);
    else ctx.arc(ring.x, ring.y, ring.r, 0, TAU);
    ctx.stroke();
  });
  f.drops.forEach((d) => {
    if (d.kind === "gold") disc(ctx, d.x, d.y, 5, "#f0c040");
    else {
      ctx.fillStyle = "#b78cff";
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 8);
      ctx.lineTo(d.x + 6, d.y);
      ctx.lineTo(d.x, d.y + 8);
      ctx.lineTo(d.x - 6, d.y);
      ctx.fill();
    }
  });
  f.enemies.forEach((e) => {
    if (!e.dead) drawEnemy(ctx, e, f);
  });
  f.shots.forEach((s) => disc(ctx, s.x, s.y, s.r, s.color));
  drawPlayer(ctx, f);
  ctx.textAlign = "center";
  ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
  f.floats.forEach((n) => {
    ctx.globalAlpha = Math.min(1, n.t * 2);
    ctx.fillStyle = n.color;
    ctx.fillText(n.text, n.x, n.y);
  });
  ctx.globalAlpha = 1;
  if (f.banner) {
    ctx.font = "700 34px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "#f1ece2";
    ctx.globalAlpha = Math.min(1, f.banner.t * 2);
    ctx.fillText(f.banner.text, f.w / 2, f.h * 0.22);
    ctx.globalAlpha = 1;
  }
}

function renderHud(f) {
  fieldEls.hudWave.textContent = "Wave " + f.wave;
  fieldEls.hudHpFill.style.width = (f.player.hp / PLAYER_MAX_HP) * 100 + "%";
  fieldEls.hudHpText.textContent = Math.ceil(f.player.hp) + " / " + PLAYER_MAX_HP;
  fieldEls.hudEarned.textContent = "+" + formatNumber(f.earnedCoins) + " coins · +" + formatNumber(f.earnedGems) + " gems";
  fieldEls.bossBar.hidden = !f.boss;
  if (f.boss) {
    fieldEls.bossName.textContent = f.boss.def.name + (f.boss.invuln ? " (shielded)" : "");
    fieldEls.bossFill.style.width = Math.max(0, f.boss.hp / f.boss.maxHp) * 100 + "%";
  }
}

function fitFieldCanvas() {
  if (!field) return;
  const available = fieldEls.runPanel.clientWidth;
  const tallest = Math.max(260, window.innerHeight - 290);
  const scale = Math.min(available / field.w, tallest / field.h);
  const canvas = fieldEls.canvas;
  canvas.style.width = field.w * scale + "px";
  canvas.style.height = field.h * scale + "px";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(field.w * scale * dpr);
  canvas.height = Math.round(field.h * scale * dpr);
}

function fieldLoop(now) {
  const f = field;
  if (!f) return;
  // Long gaps mean the tab was hidden; capping dt pauses the fight instead of skipping it
  const dt = Math.min(0.05, (now - f.lastFrame) / 1000 || 0);
  f.lastFrame = now;
  fieldStep(f, dt);
  if (field !== f) return;
  drawField(f);
  renderHud(f);
  f.raf = requestAnimationFrame(fieldLoop);
}

/* Lobby */

function chosenWave() {
  return clamp(Math.round(Number(fieldEls.waveRange.value)) || 1, 1, furthestWave());
}

function renderWaveChooser() {
  const wave = chosenWave();
  fieldEls.waveValue.textContent = wave;
  fieldEls.waveMinus.disabled = wave <= 1;
  fieldEls.wavePlus.disabled = wave >= furthestWave();
}

function showFieldsLobby() {
  fieldEls.lobby.hidden = false;
  fieldEls.runPanel.hidden = true;
  const furthest = furthestWave();
  const previous = Number(fieldEls.waveRange.dataset.touched) ? chosenWave() : furthest;
  fieldEls.furthest.textContent = formatNumber(furthest);
  fieldEls.waveRange.max = furthest;
  fieldEls.waveRange.disabled = furthest <= 1;
  fieldEls.waveRange.value = previous;
  const weapon = fieldWeapon();
  fieldEls.weapon.textContent =
    weapon.name + ": " + formatNumber(weapon.damage) + " damage, " + (weapon.swingMs / 1000).toFixed(1) + "s per swing" +
    (weapon === BARE_HANDS ? ". Equip a sword in the Armory to hit far harder." : ".");
  renderWaveChooser();
}

function startFieldRun() {
  const narrow = fieldEls.lobby.clientWidth < 560;
  const wave = chosenWave();
  field = createField(wave, narrow ? 600 : 900, narrow ? 800 : 600);
  beginWave(field, wave);
  setTabsLocked(true, "fields");
  fieldEls.lobby.hidden = true;
  fieldEls.runPanel.hidden = false;
  fieldEls.lastRun.hidden = true;
  fitFieldCanvas();
  field.lastFrame = performance.now();
  renderHud(field);
  drawField(field);
  field.raf = requestAnimationFrame(fieldLoop);
}

/* Input */

function pointerToField(e) {
  const rect = fieldEls.canvas.getBoundingClientRect();
  return { x: ((e.clientX - rect.left) / rect.width) * field.w, y: ((e.clientY - rect.top) / rect.height) * field.h };
}

fieldEls.canvas.addEventListener("pointerdown", (e) => {
  if (!field) return;
  e.preventDefault();
  try {
    fieldEls.canvas.setPointerCapture(e.pointerId);
  } catch (err) {}
  field.player.pointer = pointerToField(e);
});
fieldEls.canvas.addEventListener("pointermove", (e) => {
  if (field && field.player.pointer) field.player.pointer = pointerToField(e);
});
function releaseFieldPointer() {
  if (field) field.player.pointer = null;
}
window.addEventListener("pointerup", releaseFieldPointer);
window.addEventListener("pointercancel", releaseFieldPointer);
fieldEls.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  if (!field || !MOVE_KEYS[e.code]) return;
  e.preventDefault();
  fieldKeys.add(e.code);
});
document.addEventListener("keyup", (e) => fieldKeys.delete(e.code));
window.addEventListener("blur", () => {
  fieldKeys.clear();
  releaseFieldPointer();
});
window.addEventListener("resize", fitFieldCanvas);
window.addEventListener("pagehide", () => {
  if (field) save();
});

function nudgeWave(delta) {
  fieldEls.waveRange.value = chosenWave() + delta;
  fieldEls.waveRange.dataset.touched = "1";
  renderWaveChooser();
}

fieldEls.waveRange.addEventListener("input", () => {
  fieldEls.waveRange.dataset.touched = "1";
  renderWaveChooser();
});
fieldEls.waveMinus.addEventListener("click", () => nudgeWave(-1));
fieldEls.wavePlus.addEventListener("click", () => nudgeWave(1));
fieldEls.start.addEventListener("click", startFieldRun);
fieldEls.leave.addEventListener("click", () => endRun("left"));
