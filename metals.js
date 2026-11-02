// All 300 metals, ordered from most common (Iron) to rarest (Adamantite).
// Rank in this list decides the odds, so moving a metal changes its rarity.
const METAL_LIST = [
  // Common: base metals and everyday alloys
  ["Iron", "#8a8d91"], ["Tin", "#c4c8cc"], ["Lead", "#6b7078"], ["Zinc", "#a9b4bd"], ["Copper", "#c9774a"],
  ["Aluminum", "#d3d7da"], ["Pewter", "#9a9e9f"], ["Brass", "#c9a648"], ["Bronze", "#a9713a"], ["Nickel", "#b5b0a0"],
  ["Pig Iron", "#6f6a66"], ["Wrought Iron", "#5e6266"], ["Cast Iron", "#4f5154"], ["Mild Steel", "#9aa2a9"], ["Steel", "#a8b2bb"],
  ["Carbon Steel", "#6d747b"], ["Galvanized Steel", "#b6c0c6"], ["Solder", "#bfc2c0"], ["Babbitt", "#b3b1a6"], ["Britannia Metal", "#c5c9c6"],
  ["Cupronickel", "#c2b6a4"], ["Nickel Silver", "#cfcdbf"], ["Gunmetal", "#5a6068"], ["Bell Metal", "#b8905a"], ["Speculum Metal", "#dcdcd6"],
  ["Phosphor Bronze", "#b5804a"], ["Silicon Bronze", "#b98a5c"], ["Aluminum Bronze", "#d4ac5e"], ["Manganese Bronze", "#9c6c3e"], ["Cartridge Brass", "#d6b252"],
  ["Naval Brass", "#c49c44"], ["Red Brass", "#c9824e"], ["Muntz Metal", "#d0a650"], ["Duralumin", "#c0c8cd"], ["Magnalium", "#d6dcdc"],
  ["Alnico", "#8f8d86"], ["Invar", "#a3a7a6"], ["Kovar", "#94989a"], ["Monel", "#b9b5a5"], ["Constantan", "#c0a58a"],
  ["Nichrome", "#a9a9a2"], ["Manganin", "#bb9f80"], ["Zamak", "#aeb6ba"], ["Terne", "#8e9296"], ["Type Metal", "#74787c"],
  ["Wood's Metal", "#a8acb0"], ["Field's Metal", "#b4b8ba"], ["Rose's Metal", "#c0aeb0"], ["Galinstan", "#c8ccd0"], ["Bismuth", "#d0a6c4"],
  ["Antimony", "#b0b6bc"], ["Magnesium", "#dfe3e4"], ["Manganese", "#9f9a94"], ["Cobalt", "#5277b5"], ["Chromium", "#d8e0e6"],
  ["Stainless Steel", "#c4ced4"], ["Tool Steel", "#7b838a"], ["Spring Steel", "#6e7c88"], ["Crucible Steel", "#868c8e"], ["Blister Steel", "#77706a"],

  // Uncommon: fine steels, silver and gold alloys, rare earths
  ["Shear Steel", "#8c959c"], ["High-Speed Steel", "#7f8fa0"], ["Maraging Steel", "#8a9ca8"], ["Mangalloy", "#8d8880"], ["Hadfield Steel", "#7a7670"],
  ["Chromoly", "#a4b0b8"], ["Bulat Steel", "#6c7a84"], ["Wootz Steel", "#5f6e78"], ["Damascus Steel", "#77848c"], ["Tamahagane", "#9ca8b2"],
  ["Silver", "#d8dde2"], ["Sterling Silver", "#e0e4e8"], ["Britannia Silver", "#e6eaee"], ["Argentium", "#eaeef2"], ["Billon", "#b09a7c"],
  ["Electrum", "#e3d089"], ["Shakudo", "#3d3640"], ["Shibuichi", "#7f8a7c"], ["Corinthian Bronze", "#c79358"], ["Tumbaga", "#d68f5e"],
  ["Titanium", "#9b9da6"], ["Vanadium", "#8fa0a8"], ["Molybdenum", "#a0a6ac"], ["Tungsten", "#70757b"], ["Tantalum", "#7d8596"],
  ["Niobium", "#7f86b0"], ["Zirconium", "#b4b6b2"], ["Hafnium", "#9fa2a0"], ["Beryllium", "#b6c6c2"], ["Indium", "#c0c0d0"],
  ["Gallium", "#c6d0d6"], ["Germanium", "#9299a0"], ["Cadmium", "#c8c896"], ["Thallium", "#a2a6a0"], ["Lithium", "#d8d4c8"],
  ["Lanthanum", "#c8ccb8"], ["Cerium", "#bcbcac"], ["Neodymium", "#aab0a6"], ["Samarium", "#c0b8a8"], ["Gadolinium", "#b8bcb4"],
  ["Dysprosium", "#b4c0b8"], ["Terbium", "#a8c0a8"], ["Holmium", "#d0b8b0"], ["Erbium", "#e0a8b8"], ["Thulium", "#a8c8c0"],
  ["Ytterbium", "#d0d4b0"], ["Lutetium", "#c4ccd0"], ["Yttrium", "#ccd0c0"], ["Scandium", "#d4d8c4"], ["Praseodymium", "#a8c890"],
  ["Gold", "#e6bd3f"], ["Rose Gold", "#e0a085"], ["White Gold", "#e8e4d0"], ["Green Gold", "#c8c860"], ["Purple Gold", "#a85cc0"],
  ["Blue Gold", "#5c88c8"], ["Platinum", "#dcdedc"], ["Palladium", "#ccccc8"], ["Rhodium", "#e4e8ec"], ["Ruthenium", "#a0a4a8"],

  // Rare: superalloys, meteoric iron, radioactive and synthetic elements
  ["Iridium", "#d4dce8"], ["Osmium", "#7c9cb8"], ["Rhenium", "#a4a8b0"], ["Platiniridium", "#dce4ec"], ["Osmiridium", "#9cb4cc"],
  ["Nitinol", "#a8b4b0"], ["Stellite", "#b8c4cc"], ["Inconel", "#a4a498"], ["Hastelloy", "#a8b0a4"], ["Waspaloy", "#c0b070"],
  ["Tungsten Carbide", "#50565e"], ["Cermet", "#887c74"], ["Vitallium", "#c0d0d4"], ["Liquidmetal", "#b0c4d8"], ["Meteoric Iron", "#70645c"],
  ["Kamacite", "#8c8478"], ["Taenite", "#a09484"], ["Tetrataenite", "#b4a88c"], ["Uranium", "#7ca858"], ["Thorium", "#98a488"],
  ["Plutonium", "#c86c48"], ["Radium", "#b8f0a0"], ["Polonium", "#b0d0f0"], ["Promethium", "#88f0c8"], ["Technetium", "#a0b0b8"],
  ["Actinium", "#8cc8f8"], ["Protactinium", "#a8c0a0"], ["Neptunium", "#60a0c0"], ["Americium", "#d8b0a0"], ["Curium", "#c8a0d0"],
  ["Californium", "#f0c868"], ["Einsteinium", "#88b0f0"], ["Fermium", "#c0d868"], ["Francium", "#f09858"], ["Astatine", "#60486c"],
  ["Rutherfordium", "#c85868"], ["Dubnium", "#d07858"], ["Seaborgium", "#50a8a8"], ["Bohrium", "#8870c8"], ["Hassium", "#6888c8"],
  ["Meitnerium", "#c868a8"], ["Darmstadtium", "#70c0b0"], ["Roentgenium", "#e8d070"], ["Copernicium", "#d89068"], ["Nihonium", "#e87070"],
  ["Flerovium", "#70d090"], ["Moscovium", "#a080e0"], ["Livermorium", "#60c8e0"], ["Tennessine", "#b0e070"], ["Oganesson", "#e8a0e0"],
  ["Bog Iron", "#7a5a3c"], ["Cold Iron", "#90a8bc"], ["Black Iron", "#2e3034"], ["Star Iron", "#9cb0e0"], ["Blood Iron", "#8c2f2f"],
  ["Bone Steel", "#d8cfb4"], ["Ghost Copper", "#c0d8c8"], ["Witch Silver", "#b090d8"], ["Moon Silver", "#d8e4f8"], ["Dragon Bronze", "#c8602c"],

  // Epic: enchanted and elemental metals
  ["Quicksilver", "#d0e0ec"], ["Truesilver", "#f0f4f8"], ["Stormsilver", "#a8c0e8"], ["Nightsilver", "#5c6490"], ["Frostiron", "#a4d8f0"],
  ["Emberiron", "#d06030"], ["Ironwood Steel", "#6c5a40"], ["Sunbronze", "#f0a838"], ["Duskbronze", "#9c5c70"], ["Thunderbrass", "#e8d048"],
  ["Hepatizon", "#6c3c48"], ["Aurichalcum", "#e0b060"], ["Hihiirokane", "#f05828"], ["Damascene Gold", "#d8a830"], ["Sanguine Steel", "#a82838"],
  ["Gravesteel", "#58605c"], ["Wraithiron", "#88a098"], ["Shadowsteel", "#343048"], ["Nightsteel", "#28345c"], ["Sunsteel", "#f8d060"],
  ["Moonsteel", "#c4d4f0"], ["Starsteel", "#b0c0ff"], ["Skysteel", "#70b8f0"], ["Tidesteel", "#2c8ca8"], ["Stormsteel", "#5078b8"],
  ["Frostbronze", "#80c0d0"], ["Emberbronze", "#d87038"], ["Ashgold", "#a89c78"], ["Dawngold", "#f8c088"], ["Duskgold", "#c88850"],
  ["Spiritgold", "#e8e8a0"], ["Soulbrass", "#78c8b0"], ["Rimesilver", "#d0f0f8"], ["Glacial Cobalt", "#58a8e8"], ["Molten Cobalt", "#e85838"],
  ["Verdant Copper", "#48b088"], ["Thornsteel", "#588050"], ["Venomsteel", "#80c030"], ["Wyrmsteel", "#b84830"], ["Drakescale Alloy", "#a03868"],
  ["Titansteel", "#909cb8"], ["Giantsbane Iron", "#7c6c98"], ["Runic Iron", "#5c80c0"], ["Runesteel", "#60a0e0"], ["Sigilbronze", "#d09048"],
  ["Glyphsilver", "#b8c8f8"], ["Arcanium", "#9060f0"], ["Aetherium", "#90e0f0"], ["Eldritch Bronze", "#708040"], ["Voidiron", "#301c50"],
  ["Voidsteel", "#44207c"], ["Abyssal Iron", "#143048"], ["Hellforged Iron", "#982010"], ["Infernium", "#f04010"], ["Cinderite", "#d05020"],
  ["Brimstone Steel", "#d8b020"], ["Celestial Bronze", "#f0c070"], ["Seraphic Silver", "#fff4d8"], ["Angelsteel", "#f4f0ff"], ["Demonsteel", "#a01030"],

  // Legendary: metals of the sky, the elements and time itself
  ["Luminite", "#a0f0e0"], ["Solarium", "#ffc830"], ["Lunarium", "#c8d8ff"], ["Stellarium", "#90a8ff"], ["Nebulite", "#c060e0"],
  ["Cometite", "#70e0ff"], ["Meteorite Steel", "#a06840"], ["Astralite", "#7080ff"], ["Cosmium", "#6040d0"], ["Galaxite", "#8040c8"],
  ["Zephyrite", "#a0f0c8"], ["Tempestite", "#4890f0"], ["Fulgurite Steel", "#f0e850"], ["Glacite", "#90e8ff"], ["Cryonite", "#60d0f8"],
  ["Pyronite", "#ff6020"], ["Magmatite", "#e83818"], ["Terranite", "#90a040"], ["Abyssite", "#1060a0"], ["Verdite", "#30d070"],
  ["Sylvanite", "#70e090"], ["Chronium", "#e0c890"], ["Temporite", "#c0a0f0"], ["Paradoxium", "#f060c0"], ["Quantium", "#50f0d0"],
  ["Phasium", "#a0a0ff"], ["Etherite", "#b8f0ff"], ["Spectrite", "#d0b0ff"], ["Phantasmite", "#9080d0"], ["Dreamsteel", "#f0a0e0"],
  ["Nightmare Iron", "#501040"], ["Oblivium", "#180830"], ["Eternium", "#40e8b0"], ["Everium", "#60f090"], ["Immortalite", "#f8e070"],
  ["Regalite", "#9030c0"], ["Imperium Gold", "#ffb820"], ["Sovereign Silver", "#f0f8ff"], ["Kingsteel", "#d8b850"], ["Godsteel", "#fff0a0"],
  ["Divinium", "#fff8c0"], ["Ambrosial Gold", "#ffd870"], ["Empyrean Steel", "#a0d8ff"], ["Hallowed Bronze", "#ffc060"], ["Primordial Iron", "#b05030"],

  // Mythic: the metals of legend
  ["Elder Silver", "#e8fff8"], ["Worldforge Iron", "#ff7838"], ["Genesis Alloy", "#80ffc0"], ["Starforged Steel", "#a0b8ff"], ["Titanite", "#70c8c0"],
  ["Orichalcum", "#ff9c40"], ["Aegisite", "#60c0ff"], ["Excalibrium", "#f0f0ff"], ["Celestium", "#b0e8ff"], ["Empyrium", "#ffe080"],
  ["Wyrmite", "#ff4060"], ["Elven Silver", "#d8fff0"], ["Dwarven Steel", "#ffb060"], ["Mythril", "#70f0ff"], ["Adamantite", "#ff2878"],
];

// Each metal is this many times rarer than the one before it.
const RARITY_STEP = 1.035;

const TIERS = [
  { name: "Common", color: "#b4bac0", lastRank: 60 },
  { name: "Uncommon", color: "#6fd08c", lastRank: 120 },
  { name: "Rare", color: "#5eb2ff", lastRank: 180 },
  { name: "Epic", color: "#c58bff", lastRank: 240 },
  { name: "Legendary", color: "#ffb84d", lastRank: 285 },
  { name: "Mythic", color: "#ff5d8f", lastRank: 300 },
];

const METALS = METAL_LIST.map(([name, color], i) => ({
  name,
  color,
  rank: i + 1,
  weight: Math.pow(RARITY_STEP, -i),
  tier: TIERS.findIndex((t) => i + 1 <= t.lastRank),
}));

const TOTAL_WEIGHT = METALS.reduce((sum, m) => sum + m.weight, 0);
METALS.forEach((m) => {
  m.oneIn = TOTAL_WEIGHT / m.weight;
});

// Luck flattens the rarity curve: at 0 each metal is RARITY_STEP times rarer than the last,
// and at 1 they would all be equal. Listed odds and metal values always use luck 0.
const luckWeight = (metal, luck) => Math.pow(RARITY_STEP, -(metal.rank - 1) * (1 - luck));

function metalChance(metal, luck) {
  return luckWeight(metal, luck) / METALS.reduce((sum, m) => sum + luckWeight(m, luck), 0);
}

// How many times more likely the rarest metals are at this luck
function luckMultiplier(luck) {
  const mythril = METALS[METALS.length - 2];
  return metalChance(mythril, luck) * mythril.oneIn;
}

function rollMetal(luck = 0) {
  let r = Math.random() * METALS.reduce((sum, m) => sum + luckWeight(m, luck), 0);
  for (const m of METALS) {
    r -= luckWeight(m, luck);
    if (r < 0) return m;
  }
  return METALS[0]; // only reachable through float rounding
}

// Three significant figures: "1 in 29", "1 in 4,180", "1 in 1,030,000"
function formatOdds(oneIn) {
  const digits = Math.floor(Math.log10(oneIn)) + 1;
  const scale = Math.pow(10, Math.max(0, digits - 3));
  return "1 in " + (Math.round(oneIn / scale) * scale).toLocaleString("en-US");
}
