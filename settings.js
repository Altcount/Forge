const SETTING_OPTIONS = [
  { id: "animations", name: "Animations", detail: "Flashing metal names, glows and swing animations. The roll wait stays." },
  { id: "shake", name: "Screen shake", detail: "Shakes the Fields when you take a hit or a boss slams into a wall." },
  { id: "numbers", name: "Floating numbers", detail: "Damage and pickup numbers in the Fields and training yard." },
  { id: "reach", name: "Reach circle", detail: "The faint ring in the Fields showing how far your weapon reaches." },
];

// Codes work once per save
const CODES = {
  FORGEMASTER: { metalsEach: 14, coins: 1000000, message: "14 of every metal and 1,000,000 coins added!" },
};

const settingsEls = {
  list: document.getElementById("settingsList"),
  form: document.getElementById("codeForm"),
  input: document.getElementById("codeInput"),
  message: document.getElementById("codeMessage"),
};

function applySettings() {
  document.body.classList.toggle("no-animations", !settingOn("animations"));
}

function buildSettingsList() {
  SETTING_OPTIONS.forEach((option) => {
    const row = document.createElement("label");
    row.className = "setting-row";
    row.innerHTML =
      '<span class="skill-info"><strong></strong><span class="skill-effect"></span></span>' +
      '<input type="checkbox">';
    row.querySelector("strong").textContent = option.name;
    row.querySelector(".skill-effect").textContent = option.detail;
    const box = row.querySelector("input");
    box.checked = settingOn(option.id);
    box.addEventListener("change", () => {
      state.settings[option.id] = box.checked;
      applySettings();
      save();
    });
    settingsEls.list.appendChild(row);
  });
}

function redeemCode(text) {
  const key = text.trim().toUpperCase();
  const code = Object.prototype.hasOwnProperty.call(CODES, key) ? CODES[key] : null;
  if (!code) return { ok: false, message: key ? "That code isn't valid." : "Type a code first." };
  if (state.redeemed.includes(key)) return { ok: false, message: "You've already used that code." };
  state.redeemed.push(key);
  state.coins += code.coins;
  METALS.forEach((metal) => {
    state.metals[metal.name] = (state.metals[metal.name] || 0) + code.metalsEach;
    state.counts[metal.name] = (state.counts[metal.name] || 0) + code.metalsEach;
    renderTile(metal);
  });
  renderCoins();
  renderProgress();
  save();
  return { ok: true, message: code.message };
}

settingsEls.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const result = redeemCode(settingsEls.input.value);
  settingsEls.message.textContent = result.message;
  settingsEls.message.classList.toggle("code-ok", result.ok);
  if (result.ok) settingsEls.input.value = "";
});

buildSettingsList();
applySettings();
