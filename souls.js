// Soul gems are XP: they are never spent, and each soul level grants one skill point.
const SKILLS = [
  { id: "loot", name: "Loot gain", perPoint: "+10% gold and soul gem chance", total: (n) => "+" + n * 10 + "%" },
  { id: "damage", name: "Base damage", perPoint: "+5% damage with any weapon", total: (n) => "+" + n * 5 + "%" },
  { id: "hp", name: "HP", perPoint: "+10 max HP", total: (n) => PLAYER_MAX_HP + n * 10 + " HP" },
  { id: "shield", name: "Shield", perPoint: "+10 shield, which takes damage before your HP and refills after each wave", total: (n) => n * 10 + " shield" },
];

const soulEls = {
  level: document.getElementById("soulLevel"),
  points: document.getElementById("soulPoints"),
  fill: document.getElementById("soulFill"),
  progress: document.getElementById("soulProgress"),
  list: document.getElementById("skillList"),
};
const skillRows = new Map();

const gemsForNextLevel = (level) => level + 1;

function soulProgress(gems) {
  let level = 1;
  let left = Math.max(0, Math.floor(gems) || 0);
  while (left >= gemsForNextLevel(level)) {
    left -= gemsForNextLevel(level);
    level += 1;
  }
  return { level, into: left, needed: gemsForNextLevel(level) };
}

const skillPoints = (id) => Math.max(0, Math.floor(state.skills[id]) || 0);
const lootMultiplier = () => 1 + skillPoints("loot") * 0.1;
const damageMultiplier = () => 1 + skillPoints("damage") * 0.05;
const playerMaxHp = () => PLAYER_MAX_HP + skillPoints("hp") * 10;
const playerMaxShield = () => skillPoints("shield") * 10;

function unspentPoints() {
  const spent = SKILLS.reduce((sum, skill) => sum + skillPoints(skill.id), 0);
  return Math.max(0, soulProgress(state.soulGems).level - 1 - spent);
}

function spendPoint(id) {
  if (unspentPoints() <= 0 || !SKILLS.some((skill) => skill.id === id)) return;
  state.skills[id] = skillPoints(id) + 1;
  save();
  showFieldsLobby();
}

function buildSkillList() {
  SKILLS.forEach((skill) => {
    const row = document.createElement("li");
    row.className = "skill-row";
    row.innerHTML =
      '<span class="skill-info"><strong></strong><span class="skill-effect"></span></span>' +
      '<span class="skill-total"></span><button class="step" type="button">+</button>';
    row.querySelector("strong").textContent = skill.name;
    row.querySelector(".skill-effect").textContent = skill.perPoint;
    const button = row.querySelector("button");
    button.setAttribute("aria-label", "Spend a skill point on " + skill.name);
    button.addEventListener("click", () => spendPoint(skill.id));
    skillRows.set(skill.id, { total: row.querySelector(".skill-total"), button });
    soulEls.list.appendChild(row);
  });
}

function renderSoulPanel() {
  const progress = soulProgress(state.soulGems);
  const points = unspentPoints();
  soulEls.level.textContent = formatNumber(progress.level);
  soulEls.points.textContent = points + " skill point" + (points === 1 ? "" : "s") + " to spend";
  soulEls.points.classList.toggle("has-points", points > 0);
  soulEls.fill.style.width = (progress.into / progress.needed) * 100 + "%";
  soulEls.progress.textContent = progress.into + " / " + progress.needed + " soul gems to the next level";
  SKILLS.forEach((skill) => {
    const row = skillRows.get(skill.id);
    row.total.textContent = skill.total(skillPoints(skill.id));
    row.button.disabled = points <= 0;
  });
}

buildSkillList();
