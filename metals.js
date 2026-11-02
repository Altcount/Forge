// All 700 metals, ordered from most common (Iron) to rarest (Adamantite).
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

  ["Soft Iron", "#8f9296"], ["Gray Iron", "#6c6f73"], ["Ductile Iron", "#5c6064"], ["Malleable Iron", "#74777a"], ["White Iron", "#b4b7b8"], ["Sponge Iron", "#6a5f55"], ["Scrap Iron", "#7a6c5e"], ["Rusted Iron", "#9a5b38"], ["Tinplate", "#cfd3d6"], ["Sheet Tin", "#bcc1c5"],
  ["Black Lead", "#43474c"], ["Hard Lead", "#5f646b"], ["Spelter", "#a7b0b5"], ["Prince's Metal", "#d0ae55"], ["Dutch Metal", "#d8b64e"], ["Tombac", "#c9974d"], ["Gilding Metal", "#d7a94c"], ["Yellow Brass", "#d2b04a"], ["Admiralty Brass", "#bf9a44"], ["Arsenical Bronze", "#a6764a"],
  ["Tin Bronze", "#ad7c42"], ["Bismuth Bronze", "#b48a6a"], ["Nickel Bronze", "#b7a07c"], ["Leaded Bronze", "#8f6c44"], ["Statuary Bronze", "#7f5a36"], ["Bell Bronze", "#b98c50"], ["Beryllium Copper", "#d08a5c"], ["Chromium Copper", "#c67c54"], ["Tellurium Copper", "#c47a58"], ["Oxygen-Free Copper", "#d9804c"],
  ["Blister Copper", "#a8623c"], ["Electrolytic Copper", "#e08850"], ["Arsenical Copper", "#b8764e"], ["Alclad", "#cfd6da"], ["Silumin", "#c8cdcf"], ["Hydronalium", "#d3dadc"], ["Alumel", "#b9bcb4"], ["Chromel", "#bfc2bc"], ["Nicrosil", "#b0b3ae"], ["Nisil", "#a8aba8"],
  ["Cunife", "#b6aa94"], ["Mu-Metal", "#9da2a5"], ["Permalloy", "#a7aba9"], ["Supermalloy", "#b0b4b3"], ["Sendust", "#8e918c"], ["Ferrosilicon", "#7f8488"], ["Ferromanganese", "#6f6c68"], ["Ferrochrome", "#868c90"], ["Ferrotungsten", "#626669"], ["Spiegeleisen", "#8c8f90"],
  ["Cold-Rolled Steel", "#a3abb2"], ["Hot-Rolled Steel", "#5e646a"], ["Weathering Steel", "#8e5a3a"], ["Rebar Steel", "#5a5650"], ["Boiler Steel", "#6e7680"], ["Rail Steel", "#666c70"], ["Wire Steel", "#a0a8ad"], ["Cutlery Steel", "#bcc6cc"], ["Surgical Steel", "#d0d8dd"], ["High-Carbon Steel", "#5c6268"],
  ["Low-Alloy Steel", "#7a8288"], ["Silicon Steel", "#848c94"], ["Manganese Steel", "#7e7a74"], ["Nickel Steel", "#9fa4a2"], ["Chrome Steel", "#c0c9cf"], ["Vanadium Steel", "#7f90a0"], ["Tungsten Steel", "#616870"], ["Cobalt Steel", "#5f7da8"], ["Bearing Steel", "#8a9299"], ["Lead Shot", "#54585e"],
  ["Bearing Bronze", "#a57a4c"], ["Pot Metal", "#98a0a4"], ["White Metal", "#c6c9c6"], ["Queen's Metal", "#c3c6c2"], ["Ormolu", "#d9b45e"], ["Pinchbeck", "#cda54c"], ["Nordic Gold", "#d8bd5a"], ["Billet Iron", "#6b6f72"], ["Anchor Iron", "#55595d"], ["Trench Iron", "#65604f"],

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

  ["Pattern Steel", "#75828a"], ["Folded Steel", "#8b98a2"], ["Sword Steel", "#a2aeb8"], ["Blade Steel", "#98a6b0"], ["Mail Steel", "#8c949a"], ["Armor Steel", "#7e8a94"], ["Swedish Iron", "#7f8c96"], ["Styrian Steel", "#909ca6"], ["Toledo Steel", "#a6b0b4"], ["Noric Steel", "#8a949c"],
  ["Aogami Steel", "#6c8cb0"], ["Shirogami Steel", "#c0ccd4"], ["Nihonto Steel", "#a8b4bc"], ["Pamor Iron", "#6e7880"], ["Wolf Steel", "#848e96"], ["Ricasso Steel", "#929ca4"], ["Fuller Steel", "#8a96a0"], ["Tang Steel", "#7c868e"], ["Crossguard Iron", "#6c747a"], ["Pommel Bronze", "#a8804a"],
  ["Coin Silver", "#d2d6da"], ["Fine Silver", "#eef1f4"], ["Mexican Silver", "#d9dde0"], ["Tibetan Silver", "#b6bab8"], ["German Silver", "#cfd0c4"], ["Nielloed Silver", "#707680"], ["Oxidized Silver", "#8a9096"], ["Vermeil", "#e6c26c"], ["Sheffield Plate", "#d4d8d8"], ["Sterling Plate", "#dce0e2"],
  ["Yellow Gold", "#ecc544"], ["Red Gold", "#dc8c5c"], ["Black Gold", "#3c3524"], ["Crown Gold", "#e4bc48"], ["Ducat Gold", "#e8c04c"], ["Pale Gold", "#ecdc9c"], ["Fool's Brass", "#c8ac4c"], ["Nugget Gold", "#dfb238"], ["River Gold", "#e4c460"], ["Leaf Gold", "#f0d070"],
  ["Strontium", "#d8d4b8"], ["Barium", "#c8ccb0"], ["Caesium", "#e4cc84"], ["Rubidium", "#c8c4bc"], ["Sodium", "#d4d8dc"], ["Potassium", "#c8ccd0"], ["Calcium", "#d8d8cc"], ["Europium", "#c8d0b8"], ["Aerospace Titanium", "#a4a8b4"], ["Sponge Titanium", "#84868c"],
  ["Gummetal", "#9098a0"], ["Beta Titanium", "#a8a0b4"], ["Titanium Aluminide", "#b0b4bc"], ["Zircaloy", "#a8acaa"], ["Hafnium Carbide", "#6c7074"], ["Niobium Tin", "#8c90a8"], ["Mischmetal", "#b0b0a4"], ["Samarium Cobalt", "#6c88a4"], ["Neodymium Alloy", "#a4aca4"], ["Terfenol", "#9c9ca8"],
  ["Galfenol", "#94a0a0"], ["Mercury", "#dfe6ea"], ["Amalgam", "#c4ccd0"], ["Gold Amalgam", "#dcc888"], ["Silver Amalgam", "#d0d8dc"], ["Cerrosafe", "#b0b4b8"], ["Cerrobend", "#a8acb4"], ["Cerrolow", "#b8bcc0"], ["Molybdenum Steel", "#868e96"], ["Tantalum Alloy", "#7a84a0"],
  ["Palladium Silver", "#d4d4d0"], ["Platinum Rhodium", "#e0e2e4"], ["Platina", "#cfd2d0"], ["Pink Gold", "#ecb4a0"], ["Lustre Bronze", "#c8964c"], ["Temple Bronze", "#b88844"], ["Shrine Copper", "#d07c50"], ["Verdigris Copper", "#50a890"], ["Patina Bronze", "#6c9c80"], ["Sun Silver", "#f4eccc"],

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

  ["Rene Alloy", "#a8b0a8"], ["Nimonic", "#a4a89c"], ["Haynes Alloy", "#acb4b0"], ["Incoloy", "#a0a490"], ["Mar-M Alloy", "#b4bcc0"], ["Udimet", "#a8a8a0"], ["Refractaloy", "#bcb494"], ["Elgiloy", "#b0c0c8"], ["Ticonium", "#a8bcc4"], ["MP35N", "#b8c4c8"],
  ["Maraging Cobalt", "#5c84b8"], ["Chromium Carbide", "#585e66"], ["Titanium Carbide", "#6c6660"], ["Tantalum Carbide", "#8c7c60"], ["Boron Steel", "#6c7880"], ["Bulk Metallic Glass", "#a0b8cc"], ["Metal Foam", "#b0b4b0"], ["Graphene Steel", "#3c4048"], ["Nanosteel", "#7c8c9c"], ["Quasicrystal Alloy", "#c0d0e0"],
  ["Shape Memory Alloy", "#a8bcb4"], ["Aerogel Steel", "#c0d4e4"], ["Superconducting Niobium", "#7088c8"], ["Transuranic Alloy", "#a0c870"], ["Depleted Uranium", "#6c7c5c"], ["Enriched Uranium", "#88d060"], ["Thoriated Tungsten", "#8c9884"], ["Radium Bronze", "#a8d890"], ["Tritium Steel", "#88e0a0"], ["Isotope Iron", "#80c0a0"],
  ["Pallasite", "#b09c50"], ["Octahedrite", "#8c8070"], ["Hexahedrite", "#9c8c78"], ["Ataxite", "#a89880"], ["Widmanstatten Iron", "#948c80"], ["Tektite Steel", "#3c4c38"], ["Stony Iron", "#7c7464"], ["Cohenite", "#887c6c"], ["Schreibersite", "#a09070"], ["Troilite Iron", "#b09858"],
  ["Moonrust Iron", "#a87c68"], ["Witch Iron", "#6c5c88"], ["Grave Iron", "#4c5450"], ["Hag Copper", "#6c8c58"], ["Fey Silver", "#d0c0f0"], ["Changeling Tin", "#b8c8d8"], ["Hobnail Iron", "#5c5c5c"], ["Horseshoe Iron", "#787470"], ["Blessed Iron", "#c0c8d8"], ["Cursed Iron", "#4c3c58"],
  ["Hallowed Silver", "#f0f0e0"], ["Banshee Silver", "#c8d8e8"], ["Goblin Silver", "#9cb088"], ["Kobold Cobalt", "#4c70a8"], ["Imp Nickel", "#b09080"], ["Troll Iron", "#607058"], ["Ogre Bronze", "#8c7044"], ["Giant's Iron", "#707880"], ["Barrow Bronze", "#6c6448"], ["Bog Bronze", "#70683c"],
  ["Sunken Gold", "#a8a850"], ["Pirate Gold", "#d8ac38"], ["Hoard Gold", "#e8b830"], ["Tomb Gold", "#bca050"], ["Pharaoh's Gold", "#ecc030"], ["Temple Gold", "#e0b848"], ["Altar Silver", "#e0e0e8"], ["Reliquary Silver", "#d0d0d8"], ["Pilgrim Pewter", "#989c9c"], ["Monk's Bronze", "#a07c48"],
  ["Knight's Steel", "#a4b0bc"], ["Squire's Iron", "#808890"], ["Crusader Steel", "#b0bcc8"], ["Templar Steel", "#c0c4c8"], ["Samurai Steel", "#9cacbc"], ["Viking Iron", "#68747c"], ["Spartan Bronze", "#b87c38"], ["Legion Iron", "#787c80"], ["Gladiator Bronze", "#a87040"], ["Warden Steel", "#8898a8"],

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

  ["Flamesteel", "#e06828"], ["Blazebrass", "#f08c30"], ["Scorchiron", "#a84820"], ["Ashsteel", "#80786c"], ["Soot Iron", "#383430"], ["Cinderbronze", "#b85c28"], ["Hearthgold", "#f0a838"], ["Kilnsteel", "#c07040"], ["Forgefire Iron", "#e05820"], ["Furnace Bronze", "#d06c2c"],
  ["Icesteel", "#a8e0f4"], ["Snowsilver", "#e8f4fc"], ["Hailbronze", "#a0c4cc"], ["Winter Iron", "#8cb4c8"], ["Boreal Steel", "#70c0d8"], ["Glacier Bronze", "#88c8d0"], ["Permafrost Iron", "#9cc8dc"], ["Aurora Silver", "#90f0d0"], ["Tundra Steel", "#a0bcc8"], ["Sleetbrass", "#b8d0c8"],
  ["Galesteel", "#a0d8c8"], ["Windsilver", "#d4f0e8"], ["Cloudbronze", "#d0d4dc"], ["Thundersteel", "#4c70c0"], ["Sparkbrass", "#f0e060"], ["Lightning Iron", "#e8e870"], ["Tempest Bronze", "#6090b8"], ["Squall Iron", "#7498b0"], ["Zephyr Steel", "#a8e8d0"], ["Monsoon Silver", "#80a8c8"],
  ["Seasilver", "#90d0e0"], ["Coral Bronze", "#f08870"], ["Abyssal Silver", "#406080"], ["Pearl Steel", "#e8e4d8"], ["Leviathan Iron", "#205870"], ["Kraken Bronze", "#385858"], ["Mariner's Brass", "#c0a050"], ["Trident Steel", "#40a0b0"], ["Riverbronze", "#60a098"], ["Tidegold", "#80c0a0"],
  ["Stonesteel", "#80807c"], ["Deepiron", "#404850"], ["Mountain Bronze", "#8c7c64"], ["Cavern Silver", "#808c98"], ["Quake Iron", "#6c5c4c"], ["Obsidian Steel", "#24242c"], ["Granite Iron", "#70706c"], ["Basalt Bronze", "#4c4840"], ["Gemsteel", "#60d0c0"], ["Crystal Silver", "#d8f0ff"],
  ["Rootbronze", "#806838"], ["Oakheart Steel", "#6c5834"], ["Moss Copper", "#6c8c40"], ["Vinesteel", "#5c9048"], ["Bloomgold", "#e8c070"], ["Petal Silver", "#f0d0e0"], ["Elderwood Iron", "#5c5038"], ["Sap Bronze", "#c09030"], ["Beast Iron", "#785c48"], ["Fangsteel", "#d8d0b8"],
  ["Phoenix Bronze", "#f07030"], ["Griffin Steel", "#c8b070"], ["Wyvern Iron", "#70885c"], ["Basilisk Steel", "#50a060"], ["Chimera Bronze", "#c07858"], ["Hydra Steel", "#388870"], ["Manticore Iron", "#a85c48"], ["Unicorn Silver", "#f8f0ff"], ["Pegasus Steel", "#d8e8ff"], ["Roc Gold", "#e8b040"],
  ["Spellsteel", "#8870e0"], ["Hexiron", "#6840a0"], ["Wardsilver", "#b0b8f0"], ["Manabronze", "#5888e0"], ["Alchemist's Gold", "#e0c040"], ["Sorcerer's Silver", "#c0a8f0"], ["Warlock Iron", "#583880"], ["Druid Bronze", "#80984c"], ["Necrosteel", "#485840"], ["Lichbronze", "#708870"],

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

  ["Twilight Steel", "#7858a8"], ["Eclipse Iron", "#30243c"], ["Equinox Silver", "#d8d0f0"], ["Solstice Gold", "#ffc850"], ["Daybreak Steel", "#ffb890"], ["Midnight Iron", "#18203c"], ["Moonshard", "#d0e0ff"], ["Sunshard", "#ffe060"], ["Starshard", "#b8c8ff"], ["Voidshard", "#4c2080"],
  ["Orionite", "#80a0ff"], ["Andromedite", "#a080ff"], ["Polarite", "#c0f0ff"], ["Zenithium", "#fff0b0"], ["Nadirite", "#3c2c60"], ["Vegite", "#b0d8ff"], ["Siriusite", "#e0f0ff"], ["Lyranite", "#c090e0"], ["Pulsarite", "#60e0ff"], ["Quasarite", "#f080ff"],
  ["Supernova Steel", "#ff8040"], ["Nova Iron", "#ffb060"], ["Stardust Bronze", "#d0b0a0"], ["Darkmatter Alloy", "#1c1030"], ["Event Horizon Iron", "#0c0c18"], ["Singularite", "#281848"], ["Gravitite", "#6040a0"], ["Antimatter Steel", "#f040a0"], ["Neutronium", "#a0b0c0"], ["Plasmium", "#40f0f0"],
  ["Ragnarite", "#d04030"], ["Valkyrie Steel", "#e0e8ff"], ["Asgardian Gold", "#ffd040"], ["Olympian Bronze", "#e8a850"], ["Titan's Gold", "#f0b020"], ["Stygian Iron", "#202830"], ["Elysian Silver", "#e8fff0"], ["Tartarian Iron", "#401820"], ["Avalon Silver", "#d0f0e0"], ["Atlantean Bronze", "#40c0b0"],
  ["Soulsteel", "#70e0d0"], ["Spiritium", "#b0f0e0"], ["Wraithsilver", "#a8c0c8"], ["Reaper Iron", "#2c2c38"], ["Deathless Iron", "#70508c"], ["Revenant Steel", "#688880"], ["Ghostforged Steel", "#c8e0e8"], ["Bloodforged Steel", "#b02030"], ["Runeforged Iron", "#4890e0"], ["Dragonforged Steel", "#e05030"],
  ["Archon Gold", "#fff0a0"], ["Paladin Silver", "#f8f4e0"], ["Seraphium", "#fff8e0"], ["Cherubite", "#ffe0e8"], ["Sanctium", "#f0f8ff"], ["Radiant Steel", "#fff8b0"], ["Prismatic Silver", "#e0d0ff"], ["Astral Gold", "#e0d080"], ["Ethereal Bronze", "#d8c8b0"], ["Everlasting Iron", "#a0c0a0"],

  // Mythic: the metals of legend
  ["Fateforged Steel", "#c0a0ff"], ["Destiny Alloy", "#ffa0d0"], ["Worldroot Bronze", "#60d080"], ["Skyforge Iron", "#80d0ff"], ["Godsilver", "#ffffff"], ["Kingsbane Steel", "#e04060"], ["Dawnbreaker Alloy", "#ffc080"], ["Nightfall Alloy", "#4040a0"], ["Starheart", "#d0e0ff"], ["Sunheart", "#ffd040"],
  ["Moonheart", "#e0f0ff"], ["Voidheart", "#6020c0"], ["Dragonheart Steel", "#ff5030"], ["Phoenix Gold", "#ff9020"], ["Ancient Orichalcum", "#ffa850"], ["Black Adamant", "#501030"], ["Moon Mithral", "#a0f8ff"], ["Pale Adamant", "#ffa0c0"], ["Elder Orichalcum", "#f09040"], ["Primeval Gold", "#ffe080"],
  ["Elder Silver", "#e8fff8"], ["Worldforge Iron", "#ff7838"], ["Genesis Alloy", "#80ffc0"], ["Starforged Steel", "#a0b8ff"], ["Titanite", "#70c8c0"],
  ["Orichalcum", "#ff9c40"], ["Aegisite", "#60c0ff"], ["Excalibrium", "#f0f0ff"], ["Celestium", "#b0e8ff"], ["Empyrium", "#ffe080"],
  ["Wyrmite", "#ff4060"], ["Elven Silver", "#d8fff0"], ["Dwarven Steel", "#ffb060"], ["Mythril", "#70f0ff"], ["Adamantite", "#ff2878"],
];

// Each metal is this many times rarer than the one before it.
const RARITY_STEP = 1.0134;

const TIERS = [
  { name: "Common", color: "#b4bac0", lastRank: 140 },
  { name: "Uncommon", color: "#6fd08c", lastRank: 280 },
  { name: "Rare", color: "#5eb2ff", lastRank: 420 },
  { name: "Epic", color: "#c58bff", lastRank: 560 },
  { name: "Legendary", color: "#ffb84d", lastRank: 665 },
  { name: "Mythic", color: "#ff5d8f", lastRank: 700 },
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
