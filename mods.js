// Mock database of mods for our platform (ModSphere)
const INITIAL_MODS = [
  {
    id: "sodium",
    name: "Sodium",
    slug: "sodium",
    author: "JellySquid",
    avatar: "⚡",
    iconColor: "#10b981",
    shortDescription: "A modern rendering engine for Minecraft which greatly improves frame rates and fixes micro-stutter.",
    description: `
      <h2>Features</h2>
      <p>Sodium is a free and open-source rendering engine replacement for the Minecraft client that greatly improves frame rates, reduces micro-stutter, and fixes graphical issues in Minecraft.</p>
      <ul>
        <li><strong>Significant FPS improvements:</strong> Sodium uses modern OpenGL features to render chunks much more efficiently, reducing CPU overhead.</li>
        <li><strong>Fixed micro-stuttering:</strong> Memory allocations are optimized, and rendering pipeline updates are smoothed out to keep frame times consistent.</li>
        <li><strong>Visual fixes:</strong> Fluid rendering is improved, block transitions look smoother, and custom block rendering bugs are resolved.</li>
      </ul>
      <h2>Compatibility</h2>
      <p>Sodium is highly compatible with the Fabric modding ecosystem. It replaces the default chunk renderer, meaning it is not compatible with OptiFine. For shaders, use the <strong>Iris</strong> mod alongside Sodium.</p>
    `,
    type: "mod",
    categories: ["optimization", "client"],
    loaders: ["fabric", "quilt"],
    gameVersions: ["1.20.4", "1.20.2", "1.20.1", "1.19.4"],
    downloads: 14502034,
    follows: 245300,
    license: "LGPL-3.0",
    sourceUrl: "https://github.com/CaffeineMC/sodium-fabric",
    issuesUrl: "https://github.com/CaffeineMC/sodium-fabric/issues",
    wikiUrl: "https://github.com/CaffeineMC/sodium-fabric/wiki",
    createdAt: "2020-08-15T12:00:00Z",
    updatedAt: "2024-05-10T15:30:00Z",
    gallery: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60"
    ],
    versions: [
      {
        id: "s-1",
        versionNumber: "0.5.8",
        name: "Sodium 0.5.8 for Minecraft 1.20.4",
        type: "release",
        changelog: "Fixes a crash when rendering custom biome colors and improves memory usage during chunk rebuilds.",
        gameVersions: ["1.20.4"],
        loaders: ["fabric", "quilt"],
        filename: "sodium-fabric-mc1.20.4-0.5.8.jar",
        fileSize: "1.2 MB",
        downloads: 120530,
        uploadedAt: "2024-05-10T15:30:00Z"
      },
      {
        id: "s-2",
        versionNumber: "0.5.5",
        name: "Sodium 0.5.5 for Minecraft 1.20.1",
        type: "release",
        changelog: "Adds performance optimizations for graphics drivers on Windows and Linux.",
        gameVersions: ["1.20.1"],
        loaders: ["fabric", "quilt"],
        filename: "sodium-fabric-mc1.20.1-0.5.5.jar",
        fileSize: "1.2 MB",
        downloads: 5430292,
        uploadedAt: "2023-12-04T10:15:00Z"
      },
      {
        id: "s-3",
        versionNumber: "0.4.10",
        name: "Sodium 0.4.10 for Minecraft 1.19.4",
        type: "release",
        changelog: "Backport of various performance fixes and compatibility patches.",
        gameVersions: ["1.19.4"],
        loaders: ["fabric"],
        filename: "sodium-fabric-mc1.19.4-0.4.10.jar",
        fileSize: "1.1 MB",
        downloads: 3201480,
        uploadedAt: "2023-06-20T08:45:00Z"
      }
    ]
  },
  {
    id: "iris",
    name: "Iris Shaders",
    slug: "iris",
    author: "CoderBot",
    avatar: "👁️",
    iconColor: "#a855f7",
    shortDescription: "A modern shaders mod for Minecraft designed to be compatible with existing OptiFine shader packs.",
    description: `
      <h2>Shaders with Performance</h2>
      <p>Iris is a modern shader pack loader for Minecraft, designed to work seamlessly with Sodium. It supports almost all standard OptiFine shaders, but renders them at a much higher framerate.</p>
      <h2>Key Features</h2>
      <ul>
        <li><strong>Perfect Sodium Integration:</strong> Unlike other shader options, Iris works directly with Sodium's rendering pipeline for optimal speed.</li>
        <li><strong>OptiFine Shaders Support:</strong> Load your favorite shaders like Complementary, BSL, or SEUS without installing OptiFine.</li>
        <li><strong>Instant Toggle:</strong> Press a hotkey (K by default) to instantly turn shaders on or off without reloading the world!</li>
      </ul>
    `,
    type: "mod",
    categories: ["cosmetic", "optimization", "client"],
    loaders: ["fabric", "quilt"],
    gameVersions: ["1.20.4", "1.20.1", "1.19.4"],
    downloads: 9840231,
    follows: 184500,
    license: "GPL-3.0",
    sourceUrl: "https://github.com/IrisShaders/Iris",
    issuesUrl: "https://github.com/IrisShaders/Iris/issues",
    wikiUrl: "https://github.com/IrisShaders/Iris/wiki",
    createdAt: "2021-02-10T14:00:00Z",
    updatedAt: "2024-05-12T18:20:00Z",
    gallery: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60"
    ],
    versions: [
      {
        id: "i-1",
        versionNumber: "1.7.0",
        name: "Iris Shaders 1.7.0 for Minecraft 1.20.4",
        type: "release",
        changelog: "Added support for real-time shadows on block entities and optimized shader compilation.",
        gameVersions: ["1.20.4"],
        loaders: ["fabric", "quilt"],
        filename: "iris-mc1.20.4-1.7.0.jar",
        fileSize: "2.8 MB",
        downloads: 85300,
        uploadedAt: "2024-05-12T18:20:00Z"
      },
      {
        id: "i-2",
        versionNumber: "1.6.8",
        name: "Iris Shaders 1.6.8 for Minecraft 1.20.1",
        type: "release",
        changelog: "Bugfix update. Corrects water rendering glitches with BSL shaders.",
        gameVersions: ["1.20.1"],
        loaders: ["fabric", "quilt"],
        filename: "iris-mc1.20.1-1.6.8.jar",
        fileSize: "2.7 MB",
        downloads: 4102049,
        uploadedAt: "2023-11-15T19:00:00Z"
      }
    ]
  },
  {
    id: "create",
    name: "Create",
    slug: "create",
    author: "simibubi",
    avatar: "⚙️",
    iconColor: "#f59e0b",
    shortDescription: "A rich aesthetic mod offering a variety of tools and blocks for Building, Decoration and Aesthetic Automation.",
    description: `
      <h2>Welcome to Create!</h2>
      <p>The Create mod offers a wide variety of tools and blocks for building, decoration, and aesthetic automation. Its components are designed to leave as many design choices to the player as possible.</p>
      <h2>Mechanical Power</h2>
      <p>With Create, you don't process items inside single-block interfaces. Instead, you build real assemblies of rotating shafts, gears, belts, water wheels, and steam engines to power mechanical presses, mixers, mechanical saws, and much more.</p>
      <h2>Visual Conveyors</h2>
      <p>Transport your items through open, physical conveyors, elevators, and pipes, letting you watch your factory operate in real-time!</p>
    `,
    type: "mod",
    categories: ["technology", "design", "automation"],
    loaders: ["forge", "fabric"],
    gameVersions: ["1.20.1", "1.19.2", "1.18.2"],
    downloads: 18450123,
    follows: 395100,
    license: "MIT",
    sourceUrl: "https://github.com/Creators-of-Create/Create",
    issuesUrl: "https://github.com/Creators-of-Create/Create/issues",
    wikiUrl: "https://create.fandom.com/wiki/Create_Mod_Wiki",
    createdAt: "2019-03-02T10:00:00Z",
    updatedAt: "2024-04-01T12:00:00Z",
    gallery: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60"
    ],
    versions: [
      {
        id: "c-1",
        versionNumber: "0.5.1-f",
        name: "Create 0.5.1-f for Forge 1.20.1",
        type: "release",
        changelog: "Fixes trains sometimes decoupling when entering unloaded chunks. Optimized stress calculations.",
        gameVersions: ["1.20.1"],
        loaders: ["forge"],
        filename: "create-1.20.1-0.5.1-f.jar",
        fileSize: "12.4 MB",
        downloads: 2450302,
        uploadedAt: "2024-04-01T12:00:00Z"
      },
      {
        id: "c-2",
        versionNumber: "0.5.1-fabric",
        name: "Create Fabric 0.5.1-d for 1.20.1",
        type: "release",
        changelog: "Ported Create 0.5.1-d features to Fabric. Fixes fluid rendering issues.",
        gameVersions: ["1.20.1"],
        loaders: ["fabric", "quilt"],
        filename: "create-fabric-1.20.1-0.5.1-d.jar",
        fileSize: "12.1 MB",
        downloads: 1954302,
        uploadedAt: "2024-02-18T16:20:00Z"
      }
    ]
  },
  {
    id: "jei",
    name: "Just Enough Items (JEI)",
    slug: "jei",
    author: "mezz",
    avatar: "📖",
    iconColor: "#ef4444",
    shortDescription: "An item and recipe viewing mod for Minecraft, built from the ground up for stability and performance.",
    description: `
      <h2>Description</h2>
      <p>JEI is a recipe and item viewing mod for Minecraft, designed to replace older mods like NEI. It lets you search for any block or item in the game, view its crafting recipes, and check how it is used in other recipes.</p>
      <h2>Key Bindings</h2>
      <ul>
        <li><strong>Hover over item + R:</strong> Show Recipe (how to craft this item)</li>
        <li><strong>Hover over item + U:</strong> Show Uses (what recipes use this item)</li>
        <li><strong>Ctrl + F:</strong> Focus search bar</li>
      </ul>
    `,
    type: "mod",
    categories: ["utility", "client"],
    loaders: ["forge", "neoforge", "fabric"],
    gameVersions: ["1.20.4", "1.20.1", "1.19.2"],
    downloads: 35402092,
    follows: 412000,
    license: "MIT",
    sourceUrl: "https://github.com/mezz/JustEnoughItems",
    issuesUrl: "https://github.com/mezz/JustEnoughItems/issues",
    createdAt: "2015-08-01T00:00:00Z",
    updatedAt: "2024-05-15T09:10:00Z",
    gallery: [],
    versions: [
      {
        id: "j-1",
        versionNumber: "17.3.0.49",
        name: "JEI 17.3.0.49 for 1.20.4 (Forge/NeoForge)",
        type: "release",
        changelog: "Fixed layout calculations when search bar is focused. Updated localization files.",
        gameVersions: ["1.20.4"],
        loaders: ["forge", "neoforge"],
        filename: "jei-1.20.4-forge-17.3.0.49.jar",
        fileSize: "3.2 MB",
        downloads: 94002,
        uploadedAt: "2024-05-15T09:10:00Z"
      },
      {
        id: "j-2",
        versionNumber: "15.3.0.4",
        name: "JEI 15.3.0.4 for 1.20.1 (Fabric/Quilt)",
        type: "release",
        changelog: "Improves recipe search caching speeds on larger modpacks.",
        gameVersions: ["1.20.1"],
        loaders: ["fabric", "quilt"],
        filename: "jei-1.20.1-fabric-15.3.0.4.jar",
        fileSize: "3.1 MB",
        downloads: 8203042,
        uploadedAt: "2023-12-10T11:00:00Z"
      }
    ]
  },
  {
    id: "rlcraft",
    name: "RLCraft",
    slug: "rlcraft",
    author: "Shivaxi",
    avatar: "🐉",
    iconColor: "#dc2626",
    shortDescription: "Real Life or Realism Craft, currently the hardest modpack in Minecraft. Survival, RPG elements, and dungeons.",
    description: `
      <h2>The Hardest Modpack in Minecraft</h2>
      <p>RLCraft is a fully integrated modpack focusing on realism, pure survival, exploration, and RPG progression. It contains over 120 individual mods combined and tweaked to create a challenging, punishing survival environment.</p>
      <h2>Key Features</h2>
      <ul>
        <li><strong>Thirst & Temperature:</strong> You must stay hydrated and protect yourself from extreme heat and freezing cold.</li>
        <li><strong>Locational Damage:</strong> Enemies can target head, torso, or limbs. A hit to the head will end your run instantly!</li>
        <li><strong>Dragon Infested Lands:</strong> Fire and Ice Dragons roam the skies, making outdoor traversal extremely hazardous.</li>
        <li><strong>Leveling System:</strong> You cannot use high-tier equipment until you level up your skills through exploration.</li>
      </ul>
    `,
    type: "modpack",
    categories: ["adventure", "rpg", "hardcore"],
    loaders: ["forge"],
    gameVersions: ["1.12.2"],
    downloads: 12403920,
    follows: 582100,
    license: "Proprietary",
    sourceUrl: "https://www.curseforge.com/minecraft/modpacks/rlcraft",
    createdAt: "2018-09-10T12:00:00Z",
    updatedAt: "2023-10-22T14:30:00Z",
    gallery: [
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=60"
    ],
    versions: [
      {
        id: "rl-1",
        versionNumber: "2.9.3",
        name: "RLCraft v2.9.3 (Server & Client Pack)",
        type: "release",
        changelog: "Massive bugfix update. Balances dragon spawn rates, updates Lycanites Mobs, fixes server exploits.",
        gameVersions: ["1.12.2"],
        loaders: ["forge"],
        filename: "RLCraft+Server+Pack+1.12.2+-+Beta+v2.9.3.zip",
        fileSize: "235 MB",
        downloads: 1530294,
        uploadedAt: "2023-10-22T14:30:00Z"
      }
    ]
  },
  {
    id: "distant-horizons",
    name: "Distant Horizons",
    slug: "distant-horizons",
    author: "James_Shaw",
    avatar: "🏔️",
    iconColor: "#3b82f6",
    shortDescription: "A Level of Detail (LOD) mod that draws simplified terrain past Minecraft's standard render distance.",
    description: `
      <h2>Breathtaking Render Distances</h2>
      <p>Distant Horizons is a Level of Detail (LOD) mod for Minecraft. It generates simplified, low-poly chunks outside your active render distance. This allows you to see miles into the distance without lagging your PC!</p>
      <h2>How it works</h2>
      <p>While Minecraft struggles to render 32 chunks (1024 blocks), Distant Horizons can easily render 256 or 512 chunks (up to 8,192 blocks) by rendering distant blocks as simple meshes. As you get closer, they seamlessly transition to active Minecraft chunks.</p>
    `,
    type: "mod",
    categories: ["optimization", "client", "cosmetic"],
    loaders: ["forge", "fabric", "neoforge"],
    gameVersions: ["1.20.4", "1.20.1", "1.19.4"],
    downloads: 3840293,
    follows: 98120,
    license: "LGPL-3.0",
    sourceUrl: "https://gitlab.com/jerryspacecraft/distant-horizons",
    createdAt: "2022-01-20T10:00:00Z",
    updatedAt: "2024-05-08T17:15:00Z",
    gallery: [],
    versions: [
      {
        id: "dh-1",
        versionNumber: "2.1.0-a",
        name: "Distant Horizons 2.1.0-a for 1.20.4",
        type: "beta",
        changelog: "Adds shader support compatibility with Iris 1.7.0. Improves CPU chunk generation speeds.",
        gameVersions: ["1.20.4"],
        loaders: ["forge", "fabric", "neoforge"],
        filename: "DistantHorizons-v2.1.0-a-1.20.4.jar",
        fileSize: "8.4 MB",
        downloads: 45030,
        uploadedAt: "2024-05-08T17:15:00Z"
      }
    ]
  },
  {
    id: "complementary-reimagined",
    name: "Complementary Shaders - Reimagined",
    slug: "complementary-reimagined",
    author: "EminGT",
    avatar: "✨",
    iconColor: "#06b6d4",
    shortDescription: "A shader pack that aims for visual perfection, performance, and preservation of Minecraft's original style.",
    description: `
      <h2>The Definitive Shader Pack</h2>
      <p>Complementary Shaders - Reimagined is a shader pack designed for Minecraft Java Edition. It focuses on high-quality visuals, exceptional performance, compatibility, and a stylized, blocky look that respects Minecraft's core aesthetic.</p>
      <h2>Visual Highlights</h2>
      <ul>
        <li><strong>Stylized Cloud System:</strong> Gorgeous, voxelized 3D clouds that fit Minecraft perfectly.</li>
        <li><strong>Colored Light Sources:</strong> Torches, glowstone, and portals cast realistic, colored shadows.</li>
        <li><strong>Water & Wave Effects:</strong> Dynamic wave reflections and refractions with custom water colors per biome.</li>
        <li><strong>Auto-Compatibility:</strong> Works out-of-the-box with mods like Sodium, Iris, Canvas, and standard resource packs.</li>
      </ul>
    `,
    type: "resourcepack",
    categories: ["cosmetic"],
    loaders: [],
    gameVersions: ["1.20.4", "1.20.1", "1.19.4", "1.18.2"],
    downloads: 15403291,
    follows: 284500,
    license: "Proprietary",
    sourceUrl: "https://www.complementary.dev",
    createdAt: "2020-11-01T00:00:00Z",
    updatedAt: "2024-04-20T10:45:00Z",
    gallery: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60"
    ],
    versions: [
      {
        id: "cr-1",
        versionNumber: "r5.1.1",
        name: "Complementary Reimagined r5.1.1",
        type: "release",
        changelog: "Added support for glowing ore blocks and optimized memory usage on AMD graphics cards.",
        gameVersions: ["1.20.4", "1.20.1", "1.19.4", "1.18.2"],
        loaders: [],
        filename: "ComplementaryReimagined_r5.1.1.zip",
        fileSize: "7.1 MB",
        downloads: 820394,
        uploadedAt: "2024-04-20T10:45:00Z"
      }
    ]
  }
];

// Helper to load/save custom mods from LocalStorage so the user can interactively create new ones
function getMods() {
  const stored = localStorage.getItem("mods_data");
  if (!stored) {
    localStorage.setItem("mods_data", JSON.stringify(INITIAL_MODS));
    return INITIAL_MODS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_MODS;
  }
}

function saveMod(newMod) {
  const current = getMods();
  
  // Format version uploaded date
  const nowStr = new Date().toISOString();
  newMod.createdAt = nowStr;
  newMod.updatedAt = nowStr;
  
  // Create first version package for the user mod
  newMod.versions = [
    {
      id: `${newMod.id}-v1`,
      versionNumber: "1.0.0",
      name: `${newMod.name} v1.0.0`,
      type: "release",
      changelog: "Initial release on ModSphere!",
      gameVersions: newMod.gameVersions || ["1.20.4"],
      loaders: newMod.loaders || ["fabric"],
      filename: `${newMod.id}-1.0.0.jar`,
      fileSize: "450 KB",
      downloads: 0,
      uploadedAt: nowStr
    }
  ];
  
  current.push(newMod);
  localStorage.setItem("mods_data", JSON.stringify(current));
  return current;
}

function updateModDownloads(modId, versionId) {
  const current = getMods();
  const mod = current.find(m => m.id === modId);
  if (mod) {
    mod.downloads++;
    if (versionId) {
      const ver = mod.versions.find(v => v.id === versionId);
      if (ver) ver.downloads++;
    }
    localStorage.setItem("mods_data", JSON.stringify(current));
  }
  return current;
}

function toggleModFollow(modId) {
  const current = getMods();
  const mod = current.find(m => m.id === modId);
  let isFollowing = false;
  
  if (mod) {
    const followed = JSON.parse(localStorage.getItem("followed_mods") || "[]");
    const idx = followed.indexOf(modId);
    if (idx === -1) {
      followed.push(modId);
      mod.follows++;
      isFollowing = true;
    } else {
      followed.splice(idx, 1);
      mod.follows--;
      isFollowing = false;
    }
    localStorage.setItem("followed_mods", JSON.stringify(followed));
    localStorage.setItem("mods_data", JSON.stringify(current));
  }
  return { mods: current, isFollowing };
}

function isModFollowed(modId) {
  const followed = JSON.parse(localStorage.getItem("followed_mods") || "[]");
  return followed.includes(modId);
}
