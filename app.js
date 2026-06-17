// Main application controller for ModSphere

let isSpotlightActive = false;
let spotlightPlaceholder = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// App State
const state = {
  currentView: "home", // home, browse, detail, create
  selectedModId: null,
  activeDetailTab: "description", // description, versions, gallery
  filters: {
    q: "",
    type: "", // mod, modpack, resourcepack, plugin
    categories: [],
    loaders: [],
    gameVersions: [],
    sort: "downloads" // downloads, relevance, follows, updated, created
  }
};

// Available Filter Options Meta-data (Russian Labels)
const METADATA = {
  types: {
    mod: "Моды",
    modpack: "Модпаки",
    resourcepack: "Шейдеры и текстуры",
    plugin: "Плагины"
  },
  categories: {
    optimization: "Оптимизация",
    client: "Клиент",
    cosmetic: "Косметика",
    technology: "Технологии",
    design: "Декор",
    automation: "Автоматизация",
    adventure: "Приключения",
    rpg: "RPG",
    hardcore: "Хардкор",
    utility: "Утилиты"
  },
  loaders: {
    fabric: "Fabric",
    forge: "Forge",
    neoforge: "NeoForge",
    quilt: "Quilt"
  },
  gameVersions: ["1.20.4", "1.20.2", "1.20.1", "1.19.4", "1.19.2", "1.18.2", "1.12.2"]
};

// Initialize User Database in LocalStorage
function initUserDatabase() {
  const DEFAULT_USERS = [
    {
      uid: "0001",
      username: "MineDev",
      email: "finalwarningbee@gmail.com",
      password: "github",
      role: "OWNER",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=MineDev"
    },
    {
      uid: "0002",
      username: "Steve",
      email: "steve@minecraft.net",
      password: "stevepassword",
      role: "PLAYER",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Steve"
    },
    {
      uid: "0003",
      username: "Alex",
      email: "alex@minecraft.net",
      password: "alexpassword",
      role: "PLAYER",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Alex"
    }
  ];
  
  const stored = localStorage.getItem("registered_users");
  if (!stored || !stored.includes('"role"') || stored.includes('minedev.work@gmail.com') || stored.includes('MS-')) {
    localStorage.setItem("registered_users", JSON.stringify(DEFAULT_USERS));
  }

  const curUser = localStorage.getItem("current_user");
  if (curUser && curUser.includes("MS-")) {
    localStorage.removeItem("current_user");
  }
}

// Initialize Application
function initApp() {
  initUserDatabase();
  setupTheme();
  setupRouting();
  setupGlobalEvents();
  setupSpotlightSearch();
  renderUserAuth();
  setupAuthModalEvents();
  setupGoogleChooserEvents();
  setupProfileModalEvents();
  setupPublicProfileEvents();
}

// --- THEME MANAGEMENT ---
function setupTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  const themeToggle = document.getElementById("theme-toggle");
  
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove("light-theme");
    themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    showToast(isLight ? "Включена светлая тема" : "Включена темная тема", "info");
  });
}

// --- ROUTING SYSTEM ---
function setupRouting() {
  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("load", handleRoute);
}

function handleRoute() {
  const { path, params } = parseHash();
  
  // Highlight active header and mobile navigation links
  document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(link => link.classList.remove("active"));
  
  // Collapse search input in header for Home page, show it for others
  const headerSearch = document.getElementById("header-search-container");
  if (path === "#/") {
    headerSearch.style.display = "none";
    const navHome = document.getElementById("nav-home");
    if (navHome) navHome.classList.add("active");
    const mobileNavHome = document.getElementById("mobile-nav-home");
    if (mobileNavHome) mobileNavHome.classList.add("active");
  } else {
    headerSearch.style.display = "flex";
    if (path === "#/browse") {
      const navBrowse = document.getElementById("nav-browse");
      if (navBrowse) navBrowse.classList.add("active");
      const mobileNavBrowse = document.getElementById("mobile-nav-browse");
      if (mobileNavBrowse) mobileNavBrowse.classList.add("active");
    } else if (path === "#/create") {
      const navCreate = document.getElementById("nav-create");
      if (navCreate) navCreate.classList.add("active");
      const mobileNavCreate = document.getElementById("mobile-nav-create");
      if (mobileNavCreate) mobileNavCreate.classList.add("active");
    }
  }

  // Route Views
  if (path === "#/") {
    renderHome();
  } else if (path === "#/browse") {
    // Sync URL parameters to state.filters
    state.filters.q = params.q || "";
    state.filters.type = params.type || "";
    state.filters.sort = params.sort || "downloads";
    
    // Parse array filters (e.g. loaders=fabric&loaders=forge)
    state.filters.categories = parseArrayParam(params.categories);
    state.filters.loaders = parseArrayParam(params.loaders);
    state.filters.gameVersions = parseArrayParam(params.gameVersions);
    
    renderBrowse();
  } else if (path.startsWith("#/mod/")) {
    const slug = path.replace("#/mod/", "");
    const mods = getMods();
    const mod = mods.find(m => m.slug === slug || m.id === slug);
    if (mod) {
      state.selectedModId = mod.id;
      renderModDetails(mod);
    } else {
      showToast("Мод не найден!", "info");
      window.location.hash = "#/";
    }
  } else if (path === "#/create") {
    const currentUser = localStorage.getItem("current_user");
    if (!currentUser) {
      showToast("Вам необходимо войти в аккаунт, чтобы опубликовать проект!", "info");
      window.location.hash = "#/";
      setTimeout(() => {
        openAuthModal();
      }, 500);
    } else {
      renderCreateForm();
    }
  } else if (path === "#/admin") {
    const currentUser = JSON.parse(localStorage.getItem("current_user"));
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER")) {
      showToast("Доступ ограничен! Требуются права модератора/администратора.", "info");
      window.location.hash = "#/";
    } else {
      renderAdminPanel();
    }
  } else {
    // Default fallback
    window.location.hash = "#/";
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Router Helpers
function parseHash() {
  const hash = window.location.hash || "#/";
  const qMarkIndex = hash.indexOf("?");
  const path = qMarkIndex !== -1 ? hash.substring(0, qMarkIndex) : hash;
  const queryString = qMarkIndex !== -1 ? hash.substring(qMarkIndex + 1) : "";
  
  const params = {};
  if (queryString) {
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, val] = pair.split("=");
      const decodedKey = decodeURIComponent(key);
      const decodedVal = decodeURIComponent(val || "");
      
      if (params[decodedKey]) {
        if (Array.isArray(params[decodedKey])) {
          params[decodedKey].push(decodedVal);
        } else {
          params[decodedKey] = [params[decodedKey], decodedVal];
        }
      } else {
        params[decodedKey] = decodedVal;
      }
    }
  }
  return { path, params };
}

function parseArrayParam(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return [param];
}

function updateBrowseHash() {
  const queryParts = [];
  
  if (state.filters.q) queryParts.push(`q=${encodeURIComponent(state.filters.q)}`);
  if (state.filters.type) queryParts.push(`type=${encodeURIComponent(state.filters.type)}`);
  if (state.filters.sort) queryParts.push(`sort=${encodeURIComponent(state.filters.sort)}`);
  
  state.filters.categories.forEach(c => queryParts.push(`categories=${encodeURIComponent(c)}`));
  state.filters.loaders.forEach(l => queryParts.push(`loaders=${encodeURIComponent(l)}`));
  state.filters.gameVersions.forEach(v => queryParts.push(`gameVersions=${encodeURIComponent(v)}`));
  
  const queryStr = queryParts.length ? `?${queryParts.join("&")}` : "";
  
  // Replace current hash state to avoid polluting search history step-by-step
  window.history.replaceState(null, "", `#/browse${queryStr}`);
  // Force update display
  renderBrowseResults();
}


// --- GLOBAL NAVIGATION SEARCH EVENTS ---
function setupGlobalEvents() {
  const headerSearchInput = document.getElementById("header-search-input");
  
  headerSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = headerSearchInput.value.trim();
      headerSearchInput.value = "";
      window.location.hash = `#/browse?q=${encodeURIComponent(query)}`;
    }
  });

  // Mobile Search Toggle Overlay
  const header = document.querySelector(".main-header");
  const searchToggle = document.getElementById("mobile-search-toggle-btn");
  const searchClose = document.getElementById("mobile-search-close-btn");
  
  if (searchToggle) {
    searchToggle.addEventListener("click", () => {
      header.classList.add("search-active");
      setTimeout(() => {
        if (headerSearchInput) headerSearchInput.focus();
      }, 100);
    });
  }
  
  if (searchClose) {
    searchClose.addEventListener("click", () => {
      header.classList.remove("search-active");
    });
  }

  // Lightbox close events
  const lightbox = document.getElementById("gallery-lightbox");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  closeBtn.addEventListener("click", () => lightbox.classList.remove("active"));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });

  // Global click listener for author links to open their public profiles
  document.body.addEventListener("click", (e) => {
    const authorLink = e.target.closest(".author-link");
    if (authorLink) {
      e.preventDefault();
      e.stopPropagation();
      const username = authorLink.textContent.trim();
      openPublicProfileModal(username);
    }
  });
}


function getRoleBadgeHTML(role) {
  if (!role) return "";
  const r = role.toUpperCase();
  let className = "role-player";
  if (r === "ADMIN") className = "role-admin";
  if (r === "OWNER") className = "role-owner";
  return `<span class="role-badge ${className}">${r}</span>`;
}

function getAuthorBadgeHTML(authorName) {
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const user = users.find(u => u.username === authorName);
  if (user) {
    return getRoleBadgeHTML(user.role);
  }
  return "";
}


// --- RENDER 1: HOME PAGE ---
function renderHome() {
  const container = document.getElementById("main-content");
  const mods = getMods().filter(m => m.approved);
  
  // Calculate aggregate stats (100% real numbers from mods database!)
  const totalDownloads = mods.reduce((sum, m) => sum + m.downloads, 0);
  const totalMods = mods.length;
  const totalAuthors = new Set(mods.map(m => m.author)).size;
  
  // Take top 6 mods by downloads
  const trendingMods = [...mods]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 6);

  container.innerHTML = `
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="hero-glow-1"></div>
      <div class="hero-glow-2"></div>
      <h1>Будущее моддинга Minecraft</h1>
      <p>Современный, быстрый и безопасный репозиторий для ваших любимых модов, модпаков и шейдеров.</p>
      
      <div class="hero-search-container">
        <div class="hero-search-bar" id="main-hero-search-bar">
          <div class="hero-search-bar-row">
            <i class="fa-solid fa-magnifying-glass search-icon-active" style="display:none; color:var(--primary-color); margin-left: 16px; margin-right: -4px; font-size:16px;"></i>
            <input type="text" placeholder="Поиск модов, например: Sodium, Create..." id="hero-search-input" autocomplete="off">
            <button id="hero-search-btn"><i class="fa-solid fa-magnifying-glass"></i> Искать</button>
            <button id="hero-search-close-btn" style="display:none;" title="Закрыть (ESC)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="hero-search-results" id="hero-search-results" style="display:none;"></div>
        </div>
      </div>

      <div class="quick-categories">
        <button class="quick-cat-btn" data-cat="optimization"><i class="fa-solid fa-bolt"></i> Оптимизация</button>
        <button class="quick-cat-btn" data-cat="technology"><i class="fa-solid fa-gears"></i> Инженерия</button>
        <button class="quick-cat-btn" data-cat="adventure"><i class="fa-solid fa-compass"></i> Приключения</button>
        <button class="quick-cat-btn" data-cat="cosmetic"><i class="fa-solid fa-wand-magic-sparkles"></i> Косметика</button>
      </div>
    </section>

    <!-- Platform Stats -->
    <section class="stats-banner">
      <div class="stat-item">
        <span class="stat-num" id="stat-downloads">0</span>
        <span class="stat-label">Скачиваний</span>
      </div>
      <div class="stat-item">
        <span class="stat-num" id="stat-mods">0</span>
        <span class="stat-label">Проектов в сети</span>
      </div>
      <div class="stat-item">
        <span class="stat-num" id="stat-authors">0</span>
        <span class="stat-label">Создателей</span>
      </div>
    </section>

    <!-- Trending Section -->
    <section>
      <div class="section-header">
        <h2 class="section-title"><i class="fa-solid fa-fire"></i> Популярные проекты</h2>
        <a href="#/browse" class="view-all-link">Все проекты <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="mods-grid" id="trending-grid">
        <!-- Rendered dynamically -->
      </div>
    </section>
  `;

  // Render trending cards
  const trendingGrid = document.getElementById("trending-grid");
  trendingMods.forEach(mod => {
    trendingGrid.appendChild(createModCard(mod));
  });

  // Wire up Spotlight Search events
  const heroSearchInput = document.getElementById("hero-search-input");
  const heroSearchBtn = document.getElementById("hero-search-btn");
  const heroSearchCloseBtn = document.getElementById("hero-search-close-btn");

  // Clicking or focusing opens spotlight
  heroSearchInput.addEventListener("focus", activateSpotlightSearch);
  heroSearchInput.addEventListener("click", activateSpotlightSearch);
  
  // Close button
  heroSearchCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deactivateSpotlightSearch();
  });
  
  // Prevent default form submission and trigger spotlight
  heroSearchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isSpotlightActive) {
      activateSpotlightSearch();
    } else {
      // If active and has value, run search redirect
      const query = heroSearchInput.value.trim();
      if (query) {
        deactivateSpotlightSearch();
        setTimeout(() => {
          window.location.hash = `#/browse?q=${encodeURIComponent(query)}`;
        }, 350);
      }
    }
  });

  // Typing triggers filtering
  heroSearchInput.addEventListener("input", () => {
    if (isSpotlightActive) {
      renderSpotlightResults(heroSearchInput.value);
    }
  });

  // Quick categories navigation
  document.querySelectorAll(".quick-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.getAttribute("data-cat");
      window.location.hash = `#/browse?categories=${encodeURIComponent(cat)}`;
    });
  });

  // Trigger count-up animation for stats banner numbers!
  animateCountUp("stat-downloads", totalDownloads, true);
  animateCountUp("stat-mods", totalMods, false);
  animateCountUp("stat-authors", totalAuthors, false);
}

// Smooth Count Up Animation for Statistics
function animateCountUp(elementId, targetVal, isFormatted = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let start = 0;
  const duration = 1200; // milliseconds
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing out quadratic function
    const easeProgress = progress * (2 - progress);
    const currentVal = Math.floor(easeProgress * targetVal);
    
    el.textContent = isFormatted ? formatNumberFull(currentVal) : currentVal;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = isFormatted ? formatNumberFull(targetVal) : targetVal;
    }
  }
  
  requestAnimationFrame(update);
}

// Card Renderer Helper
function createModCard(mod) {
  const card = document.createElement("div");
  card.className = "mod-card";
  card.addEventListener("click", (e) => {
    if (e.target.closest(".author-link")) {
      return;
    }
    window.location.hash = `#/mod/${mod.slug || mod.id}`;
  });

  const loadersBadges = mod.loaders.map(loader => 
    `<span class="mod-card-badge">${METADATA.loaders[loader] || loader}</span>`
  ).join(" ");

  card.innerHTML = `
    <div class="mod-card-header">
      <div class="mod-card-icon" style="background-color: ${mod.iconColor || '#10b981'}">
        ${renderAvatar(mod.avatar)}
      </div>
      <div class="mod-card-details">
        <h3 class="mod-card-title">${mod.name}</h3>
        <span class="mod-card-author">от <strong class="author-link">${mod.author}</strong>${getAuthorBadgeHTML(mod.author)}</span>
      </div>
    </div>
    <p class="mod-card-desc">${mod.shortDescription}</p>
    <div class="mod-card-footer">
      <div class="mod-card-stats">
        <span class="mod-card-stat"><i class="fa-solid fa-download"></i> ${formatNumber(mod.downloads)}</span>
        <span class="mod-card-stat"><i class="fa-solid fa-heart"></i> ${formatNumber(mod.follows)}</span>
      </div>
      <div class="mod-card-badges">
        ${loadersBadges}
      </div>
    </div>
  `;
  return card;
}


// --- RENDER 2: BROWSE / SEARCH PAGE ---
let searchDebounceTimeout = null;

function renderBrowse() {
  const container = document.getElementById("main-content");

  container.innerHTML = `
    <div class="browse-layout">
      <!-- Left Sidebar Filters -->
      <aside class="filters-sidebar" id="filters-sidebar">
        <div class="drawer-header" style="display: none;">
          <h3>Фильтры</h3>
          <button class="drawer-close-btn" id="drawer-close-btn" title="Закрыть"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="filter-group">
          <div class="filter-group-title">
            <span>Тип проекта</span>
            <button class="clear-group-btn" id="clear-type">Сбросить</button>
          </div>
          <div class="filter-options">
            ${Object.entries(METADATA.types).map(([key, label]) => `
              <label class="filter-checkbox-label">
                <input type="radio" name="project-type" value="${key}" ${state.filters.type === key ? 'checked' : ''}>
                <span>${label}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title">
            <span>Загрузчики</span>
            <button class="clear-group-btn" id="clear-loaders">Сбросить</button>
          </div>
          <div class="filter-options" id="loader-options-container">
            ${Object.entries(METADATA.loaders).map(([key, label]) => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="loader-cb" value="${key}" ${state.filters.loaders.includes(key) ? 'checked' : ''}>
                <span>${label}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title">
            <span>Категории</span>
            <button class="clear-group-btn" id="clear-categories">Сбросить</button>
          </div>
          <div class="filter-options">
            ${Object.entries(METADATA.categories).map(([key, label]) => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="category-cb" value="${key}" ${state.filters.categories.includes(key) ? 'checked' : ''}>
                <span>${label}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title">
            <span>Версии игры</span>
            <button class="clear-group-btn" id="clear-gameVersions">Сбросить</button>
          </div>
          <div class="filter-options">
            ${METADATA.gameVersions.map(version => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="version-cb" value="${version}" ${state.filters.gameVersions.includes(version) ? 'checked' : ''}>
                <span>${version}</span>
              </label>
            `).join("")}
          </div>
        </div>
      </aside>

      <!-- Right Main Results Panel -->
      <section class="browse-results-panel">
        <!-- Search and Sort Panel -->
        <div class="search-controls">
          <button class="btn btn-secondary filter-toggle-btn" id="mobile-filter-toggle" style="display: none;">
            <i class="fa-solid fa-filter"></i> <span>Фильтры</span>
          </button>
          
          <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Поиск среди сотен дополнений..." id="browse-search-input" value="${state.filters.q}">
          </div>
          
          <div class="sort-select-wrapper">
            <span>Сортировка:</span>
            <select id="browse-sort-select">
              <option value="downloads" ${state.filters.sort === 'downloads' ? 'selected' : ''}>Скачивания</option>
              <option value="follows" ${state.filters.sort === 'follows' ? 'selected' : ''}>Подписчики</option>
              <option value="relevance" ${state.filters.sort === 'relevance' ? 'selected' : ''}>Название</option>
              <option value="updated" ${state.filters.sort === 'updated' ? 'selected' : ''}>Обновлено</option>
            </select>
          </div>
        </div>

        <!-- Listing Area -->
        <div class="results-list" id="results-list-container">
          <!-- Rendered dynamically -->
        </div>
      </section>
    </div>
  `;

  // Wire up sidebar filters interactive events
  
  // Project type (Radio inputs)
  document.querySelectorAll('input[name="project-type"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.filters.type = e.target.value;
      updateBrowseHash();
    });
  });

  // Checkboxes list (loaders, categories, versions)
  const setupCheckboxGroup = (selector, stateArrayKey) => {
    document.querySelectorAll(selector).forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        const val = checkbox.value;
        if (checkbox.checked) {
          if (!state[stateArrayKey].includes(val)) state[stateArrayKey].push(val);
        } else {
          state[stateArrayKey] = state[stateArrayKey].filter(x => x !== val);
        }
        updateBrowseHash();
      });
    });
  };

  setupCheckboxGroup(".loader-cb", "filters").loaders = state.filters.loaders; // Bind context
  setupCheckboxGroup(".category-cb", "filters").categories = state.filters.categories;
  setupCheckboxGroup(".version-cb", "filters").gameVersions = state.filters.gameVersions;

  // Re-bind to ensure state matches (vanilla JS array passing helper)
  const syncGroupCheckbox = (selector, filterArray) => {
    document.querySelectorAll(selector).forEach(cb => {
      cb.addEventListener("change", () => {
        const checkedValues = Array.from(document.querySelectorAll(`${selector}:checked`)).map(c => c.value);
        filterArray.length = 0;
        checkedValues.forEach(v => filterArray.push(v));
        updateBrowseHash();
      });
    });
  };
  syncGroupCheckbox(".loader-cb", state.filters.loaders);
  syncGroupCheckbox(".category-cb", state.filters.categories);
  syncGroupCheckbox(".version-cb", state.filters.gameVersions);

  // Clear Buttons
  document.getElementById("clear-type").addEventListener("click", () => {
    document.querySelectorAll('input[name="project-type"]').forEach(r => r.checked = false);
    state.filters.type = "";
    updateBrowseHash();
  });
  
  const setupClearBtn = (btnId, cbSelector, filterArray) => {
    document.getElementById(btnId).addEventListener("click", () => {
      document.querySelectorAll(cbSelector).forEach(c => c.checked = false);
      filterArray.length = 0;
      updateBrowseHash();
    });
  };
  setupClearBtn("clear-loaders", ".loader-cb", state.filters.loaders);
  setupClearBtn("clear-categories", ".category-cb", state.filters.categories);
  setupClearBtn("clear-gameVersions", ".version-cb", state.filters.gameVersions);

  // Search Input debounced
  const browseSearchInput = document.getElementById("browse-search-input");
  browseSearchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      state.filters.q = browseSearchInput.value.trim();
      updateBrowseHash();
    }, 250);
  });

  // Sort dropdown
  document.getElementById("browse-sort-select").addEventListener("change", (e) => {
    state.filters.sort = e.target.value;
    updateBrowseHash();
  });

  // Mobile filter drawer toggling
  const filterSidebar = document.getElementById("filters-sidebar");
  const filterBackdrop = document.getElementById("sidebar-backdrop");
  const filterToggle = document.getElementById("mobile-filter-toggle");
  const drawerClose = document.getElementById("drawer-close-btn");
  
  const openDrawer = () => {
    if (filterSidebar) filterSidebar.classList.add("active");
    if (filterBackdrop) filterBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  };
  
  const closeDrawer = () => {
    if (filterSidebar) filterSidebar.classList.remove("active");
    if (filterBackdrop) filterBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  };
  
  if (filterToggle) filterToggle.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (filterBackdrop) filterBackdrop.addEventListener("click", closeDrawer);

  // Render search results for the first time
  renderBrowseResults();
}

function renderBrowseResults() {
  const container = document.getElementById("results-list-container");
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  const mods = getMods().filter(m => {
    if (m.approved) return true;
    if (currentUser && (m.author === currentUser.username || currentUser.role === "ADMIN" || currentUser.role === "OWNER")) {
      return true;
    }
    return false;
  });
  
  // Apply filtering
  let filtered = mods.filter(mod => {
    // 1. Search text
    if (state.filters.q) {
      const query = state.filters.q.toLowerCase();
      const nameMatch = mod.name.toLowerCase().includes(query);
      const descMatch = mod.shortDescription.toLowerCase().includes(query);
      const authorMatch = mod.author.toLowerCase().includes(query);
      if (!nameMatch && !descMatch && !authorMatch) return false;
    }
    
    // 2. Project type
    if (state.filters.type && mod.type !== state.filters.type) {
      return false;
    }
    
    // 3. Loaders
    if (state.filters.loaders.length > 0) {
      // Must match at least one selected loader
      const hasMatchingLoader = mod.loaders.some(l => state.filters.loaders.includes(l));
      if (!hasMatchingLoader) return false;
    }
    
    // 4. Categories
    if (state.filters.categories.length > 0) {
      // Must contain all of the selected categories
      const hasAllCategories = state.filters.categories.every(cat => mod.categories.includes(cat));
      if (!hasAllCategories) return false;
    }
    
    // 5. Game Versions
    if (state.filters.gameVersions.length > 0) {
      // Must match at least one selected version
      const hasMatchingVersion = mod.gameVersions.some(v => state.filters.gameVersions.includes(v));
      if (!hasMatchingVersion) return false;
    }
    
    return true;
  });

  // Apply Sorting
  filtered.sort((a, b) => {
    if (state.filters.sort === "downloads") {
      return b.downloads - a.downloads;
    }
    if (state.filters.sort === "follows") {
      return b.follows - a.follows;
    }
    if (state.filters.sort === "relevance") {
      return a.name.localeCompare(b.name);
    }
    if (state.filters.sort === "updated") {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    return 0;
  });

  // Search matching users
  let matchingUsersHTML = "";
  if (state.filters.q) {
    const query = state.filters.q.toLowerCase();
    const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    
    // Also collect any authors from mods that might not be registered:
    const modAuthors = [...new Set(getMods().map(m => m.author))];
    const allUsernames = new Set(users.map(u => u.username));
    modAuthors.forEach(author => {
      if (!allUsernames.has(author)) {
        users.push({
          uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
          username: author,
          role: author === "JellySquid" || author === "CoderBot" ? "OWNER" : "PLAYER",
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(author)}`,
          banner: "",
          bio: author === "JellySquid" 
            ? "Разработчик Sodium — оптимизационного движка для Minecraft." 
            : author === "CoderBot" 
              ? "Создатель Iris Shaders — мода для поддержки шейдеров на Fabric/Sodium." 
              : "Активный участник сообщества ModSphere."
        });
        allUsernames.add(author);
      }
    });

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(query));
    if (filteredUsers.length > 0) {
      matchingUsersHTML = `
        <div class="search-users-section" style="margin-bottom: 24px; padding: 20px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <h4 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-top: 0; margin-bottom: 14px; letter-spacing: 0.5px; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-users" style="color:var(--primary-color);"></i> Найденные авторы (${filteredUsers.length})
          </h4>
          <div class="search-users-list" style="display: flex; gap: 16px; flex-wrap: wrap;">
            ${filteredUsers.map(user => `
              <div class="search-user-card" onclick="openPublicProfileModal('${user.username}')" style="cursor: pointer; display: flex; align-items: center; gap: 12px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 16px; transition: border-color 0.2s, box-shadow 0.2s;">
                <div style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: var(--surface-color); border: 1.5px solid var(--border-color); display:flex; align-items:center; justify-content:center;">
                  <img src="${user.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(user.username)}" alt="${user.username}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
                    ${user.username}
                  </div>
                  <div style="margin-top: 2px;">${getRoleBadgeHTML(user.role || 'PLAYER')}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  }

  // Render list
  if (filtered.length === 0 && !matchingUsersHTML) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-folder-open"></i>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте смягчить фильтры поиска или изменить ключевые слова.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  if (matchingUsersHTML) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = matchingUsersHTML;
    container.appendChild(tempDiv);
  }

  if (filtered.length > 0) {
    filtered.forEach(mod => {
      const item = document.createElement("div");
      item.className = "result-item";
      item.addEventListener("click", (e) => {
        if (e.target.closest(".author-link")) {
          return;
        }
        window.location.hash = `#/mod/${mod.slug || mod.id}`;
      });

      const categoryBadges = mod.categories.slice(0, 3).map(cat => 
        `<span class="result-tag">${METADATA.categories[cat] || cat}</span>`
      ).join("");

      const loadersBadges = mod.loaders.map(l => 
        `<span class="result-tag" style="background: rgba(16, 185, 129, 0.08); color: var(--primary-color); font-weight: 600;">${METADATA.loaders[l] || l}</span>`
      ).join("");

      item.innerHTML = `
        <div class="result-icon" style="background-color: ${mod.iconColor || '#10b981'}">
          ${renderAvatar(mod.avatar)}
        </div>
        <div class="result-info">
          <div class="result-title-row">
            <h3 class="result-title">${mod.name}</h3>
            <span class="result-badge-type">${METADATA.types[mod.type] || mod.type}</span>
          </div>
          <p class="result-author-tag" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">
            от <span class="author-link" style="font-weight: 600;">${mod.author}</span>${getAuthorBadgeHTML(mod.author)}
          </p>
          <p class="result-desc">${mod.shortDescription}</p>
          <div class="result-tags">
            ${loadersBadges}
            ${categoryBadges}
          </div>
      </div>
      <div class="result-stats">
        <div><i class="fa-solid fa-download"></i> <span class="result-stat-val">${formatNumber(mod.downloads)}</span></div>
        <div><i class="fa-solid fa-heart"></i> <span class="result-stat-val">${formatNumber(mod.follows)}</span></div>
        <div style="font-size: 11px;">Обновлен: ${formatDate(mod.updatedAt)}</div>
      </div>
    `;
    container.appendChild(item);
  });
}
}

// --- RENDER 3: MOD DETAILS PAGE ---
function renderModDetails(mod) {
  const container = document.getElementById("main-content");
  state.activeDetailTab = "description"; // Reset tab

  const followed = isModFollowed(mod.id);

  container.innerHTML = `
    <!-- Header -->
    <div class="mod-detail-header">
      <div class="mod-detail-icon" style="background-color: ${mod.iconColor || '#10b981'}">
        ${renderAvatar(mod.avatar)}
      </div>
      <div class="mod-detail-meta">
        <div class="mod-detail-title-row">
          <h1 class="mod-detail-title">${mod.name}</h1>
          <span class="result-badge-type">${METADATA.types[mod.type] || mod.type}</span>
        </div>
        <p class="mod-detail-author-tag">от разработчика <span class="author-link">${mod.author}</span>${getAuthorBadgeHTML(mod.author)}</p>
        <p class="mod-detail-desc">${mod.shortDescription}</p>
        
        <div class="mod-detail-actions">
          <button class="btn btn-primary" id="btn-main-download"><i class="fa-solid fa-download"></i> Скачать последний файл</button>
          <button class="btn btn-secondary ${followed ? 'active' : ''}" id="btn-follow-toggle">
            <i class="${followed ? 'fa-solid' : 'fa-regular'} fa-heart"></i> 
            <span id="follow-text">${followed ? 'Вы подписаны' : 'В избранное'}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Columns -->
    <div class="mod-details-grid">
      <!-- Left Tab Area -->
      <div class="tab-content-panel">
        <nav class="tabs-nav">
          <button class="tab-btn active" data-tab="description"><i class="fa-solid fa-file-lines"></i> Описание</button>
          <button class="tab-btn" data-tab="versions"><i class="fa-solid fa-code-branch"></i> Версии (${mod.versions.length})</button>
          <button class="tab-btn" data-tab="gallery"><i class="fa-solid fa-images"></i> Галерея (${mod.gallery ? mod.gallery.length : 0})</button>
        </nav>

        <!-- Description Tab -->
        <div class="tab-panel active" id="panel-description">
          <div class="rich-description">
            ${mod.description}
          </div>
        </div>

        <!-- Versions Tab -->
        <div class="tab-panel" id="panel-versions">
          <div class="versions-list" id="versions-container">
            <!-- Versions inserted here -->
          </div>
        </div>

        <!-- Gallery Tab -->
        <div class="tab-panel" id="panel-gallery">
          <div class="gallery-grid" id="gallery-container">
            <!-- Images inserted here -->
          </div>
        </div>
      </div>

      <!-- Right Metadata Sidebar -->
      <aside class="details-sidebar">
        <div class="sidebar-panel">
          <h3 class="sidebar-panel-title">Статистика</h3>
          <div class="metadata-table">
            <div class="metadata-row">
              <span class="metadata-label">Скачивания</span>
              <span class="metadata-value" id="detail-stat-downloads">${formatNumberFull(mod.downloads)}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Подписчики</span>
              <span class="metadata-value" id="detail-stat-follows">${formatNumberFull(mod.follows)}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Лицензия</span>
              <span class="metadata-value">${mod.license}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Создан</span>
              <span class="metadata-value">${formatDate(mod.createdAt)}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Обновлен</span>
              <span class="metadata-value">${formatDate(mod.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-panel">
          <h3 class="sidebar-panel-title">Ссылки</h3>
          <div class="sidebar-links">
            ${mod.sourceUrl ? `<a href="${mod.sourceUrl}" target="_blank" rel="noopener" class="sidebar-link"><i class="fa-brands fa-github"></i> Исходный код</a>` : ''}
            ${mod.issuesUrl ? `<a href="${mod.issuesUrl}" target="_blank" rel="noopener" class="sidebar-link"><i class="fa-solid fa-bug"></i> Сообщить об ошибке</a>` : ''}
            ${mod.wikiUrl ? `<a href="${mod.wikiUrl}" target="_blank" rel="noopener" class="sidebar-link"><i class="fa-solid fa-book"></i> База знаний (Wiki)</a>` : ''}
            <a href="https://discord.gg" target="_blank" rel="noopener" class="sidebar-link"><i class="fa-brands fa-discord"></i> Сообщество Discord</a>
          </div>
        </div>

        <div class="sidebar-panel">
          <h3 class="sidebar-panel-title">Загрузчики & Теги</h3>
          <div class="result-tags">
            ${mod.loaders.map(l => `<span class="result-tag" style="background: rgba(16, 185, 129, 0.08); color: var(--primary-color); font-weight:600;">${METADATA.loaders[l] || l}</span>`).join("")}
            ${mod.categories.map(c => `<span class="result-tag">${METADATA.categories[c] || c}</span>`).join("")}
          </div>
        </div>
      </aside>
    </div>
  `;

  // --- ACTIONS WIRE UP ---
  
  // Follow/Unfollow Toggle
  const followBtn = document.getElementById("btn-follow-toggle");
  followBtn.addEventListener("click", () => {
    const res = toggleModFollow(mod.id);
    const isNowFollowing = res.isFollowing;
    
    // Update local variables in view
    const targetMod = res.mods.find(m => m.id === mod.id);
    if (targetMod) {
      document.getElementById("detail-stat-follows").textContent = formatNumberFull(targetMod.follows);
    }
    
    // Update button states
    followBtn.classList.toggle("active", isNowFollowing);
    const icon = followBtn.querySelector("i");
    icon.className = isNowFollowing ? "fa-solid fa-heart" : "fa-regular fa-heart";
    document.getElementById("follow-text").textContent = isNowFollowing ? "Вы подписаны" : "В избранное";
    
    showToast(isNowFollowing ? `Вы подписались на ${mod.name}` : `Вы отписались от ${mod.name}`, "success");
  });

  // Main download button downloads the first available version
  const mainDownloadBtn = document.getElementById("btn-main-download");
  mainDownloadBtn.addEventListener("click", () => {
    if (mod.versions && mod.versions.length > 0) {
      triggerVersionDownload(mod, mod.versions[0]);
    } else {
      showToast("Нет доступных версий файла!", "info");
    }
  });

  // Tab switcher
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle nav
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Toggle panels
      const targetTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      document.getElementById(`panel-${targetTab}`).classList.add("active");
      
      state.activeDetailTab = targetTab;
      
      // Lazily render content if needed
      if (targetTab === "versions") {
        renderModVersions(mod);
      } else if (targetTab === "gallery") {
        renderModGallery(mod);
      }
    });
  });
}

// Subrender: Versions Tab
function renderModVersions(mod) {
  const container = document.getElementById("versions-container");
  if (!mod.versions || mod.versions.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Версии не загружены для этого проекта.</div>`;
    return;
  }

  container.innerHTML = "";
  mod.versions.forEach(ver => {
    const item = document.createElement("div");
    item.className = "version-item";

    const loadersStr = ver.loaders.map(l => `<span class="result-tag" style="background: rgba(16, 185, 129, 0.08); color: var(--primary-color);">${METADATA.loaders[l] || l}</span>`).join(" ");
    const gameVersionsStr = ver.gameVersions.join(", ");

    item.innerHTML = `
      <div class="version-header-row">
        <div class="version-title-group">
          <span class="version-title">${ver.name}</span>
          <span class="version-badge-type ${ver.type}">${ver.type}</span>
        </div>
        <button class="btn btn-primary btn-sm btn-dl-ver" data-ver-id="${ver.id}">
          <i class="fa-solid fa-download"></i> Скачать
        </button>
      </div>
      
      <div class="version-changelog">
        <strong>Список изменений:</strong> ${ver.changelog || 'Без описания изменений.'}
      </div>

      <div class="version-download-row">
        <div class="file-info">
          <i class="fa-solid fa-file-zipper"></i> Имя файла: <span>${ver.filename}</span> (${ver.fileSize})
        </div>
        <div class="version-metadata">
          <div class="version-metadata-item"><i class="fa-solid fa-gamepad"></i> Версия игры: <span>${gameVersionsStr}</span></div>
          <div class="version-metadata-item"><i class="fa-solid fa-download"></i> Загрузок: <span class="ver-dl-cnt">${formatNumber(ver.downloads)}</span></div>
          <div class="version-metadata-item"><i class="fa-solid fa-calendar"></i> Загружен: <span>${formatDate(ver.uploadedAt)}</span></div>
        </div>
      </div>
    `;
    
    // Wire up download button
    item.querySelector(".btn-dl-ver").addEventListener("click", () => {
      triggerVersionDownload(mod, ver, item.querySelector(".ver-dl-cnt"));
    });

    container.appendChild(item);
  });
}

// Subrender: Gallery Tab
function renderModGallery(mod) {
  const container = document.getElementById("gallery-container");
  if (!mod.gallery || mod.gallery.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Изображения отсутствуют.</div>`;
    return;
  }

  container.innerHTML = "";
  mod.gallery.forEach(imgUrl => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    
    item.innerHTML = `
      <img src="${imgUrl}" alt="Скриншот галереи">
      <div class="gallery-item-overlay">
        <i class="fa-solid fa-magnifying-glass-plus"></i>
      </div>
    `;

    // Click to open Lightbox
    item.addEventListener("click", () => {
      const lightbox = document.getElementById("gallery-lightbox");
      const lightboxImg = lightbox.querySelector(".lightbox-img");
      lightboxImg.src = imgUrl;
      lightbox.classList.add("active");
    });

    container.appendChild(item);
  });
}

// Download Simulation Action
function triggerVersionDownload(mod, version, countSpanElement) {
  // Start simulation animation
  showToast(`Загрузка файла ${version.filename}...`, "info");
  
  setTimeout(() => {
    // Simulated completion
    updateModDownloads(mod.id, version.id);
    
    // Refresh stats in local state
    const currentMods = getMods();
    const updatedMod = currentMods.find(m => m.id === mod.id);
    const updatedVer = updatedMod.versions.find(v => v.id === version.id);
    
    // Update counters in UI
    const detailDownloads = document.getElementById("detail-stat-downloads");
    if (detailDownloads) {
      detailDownloads.textContent = formatNumberFull(updatedMod.downloads);
      detailDownloads.style.animation = "none";
      setTimeout(() => detailDownloads.style.animation = "pulseGlow 1s ease", 10);
    }
    
    if (countSpanElement) {
      countSpanElement.textContent = formatNumber(updatedVer.downloads);
    }
    
    // Trigger virtual file download
    let downloadUrl;
    if (version.fileData && version.fileData.startsWith("data:")) {
      downloadUrl = version.fileData;
    } else {
      const blob = new Blob([`Dummy JAR content for ${mod.name}`], { type: "application/java-archive" });
      downloadUrl = URL.createObjectURL(blob);
    }
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = version.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (downloadUrl.startsWith("blob:")) {
      URL.revokeObjectURL(downloadUrl);
    }
    
    showToast(`Файл ${version.filename} успешно сохранен!`, "success");
  }, 1200);
}


// --- RENDER 4: CREATE MOD VIEW (FORM) ---
function renderCreateForm() {
  const container = document.getElementById("main-content");
  
  // Custom states for form
  let selectedEmoji = "📦";
  let selectedColor = "#10b981";
  
  const emojis = ["📦", "⚙️", "⚡", "👁️", "🏔️", "✨", "🐉", "📖", "🔨", "🧩", "🧪", "🚀"];
  const colors = ["#10b981", "#a855f7", "#f59e0b", "#ef4444", "#dc2626", "#3b82f6", "#06b6d4", "#ec4899", "#8b5cf6"];
  const presetIcons = [
    { name: "Sodium", url: "https://cdn.modrinth.com/data/A5R1o1Zd/icon.png" },
    { name: "Iris", url: "https://cdn.modrinth.com/data/ylSubb7E/icon.png" },
    { name: "Create", url: "https://cdn.modrinth.com/data/Cod6t3nd/icon.png" },
    { name: "JEI", url: "https://cdn.modrinth.com/data/u6th5mrr/icon.png" },
    { name: "RLCraft", url: "https://media.forgecdn.net/avatars/223/452/637042571217730386.png" },
    { name: "Distant Horizons", url: "https://cdn.modrinth.com/data/P7dR8mSH/icon.png" },
    { name: "Complementary Shaders", url: "https://cdn.modrinth.com/data/gC9AV25h/icon.png" },
    { name: "OptiFine", url: "https://media.forgecdn.net/avatars/76/906/636142171120286786.png" },
    { name: "WorldEdit", url: "https://cdn.modrinth.com/data/1uN2V5oT/icon.png" },
    { name: "Xaero's Minimap", url: "https://cdn.modrinth.com/data/148tUzUi/icon.png" },
    { name: "Alex's Mobs", url: "https://cdn.modrinth.com/data/89vL1y4z/icon.png" },
    { name: "AppleSkin", url: "https://cdn.modrinth.com/data/EsAf2P5H/icon.png" }
  ];

  container.innerHTML = `
    <div class="form-panel">
      <h2 class="form-title">Создание нового проекта</h2>
      <p class="form-subtitle">Загрузите свой мод, модпак или ресурспак и поделитесь им с миллионами игроков.</p>
      
      <form id="create-mod-form">
        <div class="form-grid">
          
          <!-- Name -->
          <div class="form-group">
            <label class="form-label">Название проекта *</label>
            <input type="text" class="form-input" id="form-name" required placeholder="Например: Create Astral">
          </div>

          <!-- URL Slug -->
          <div class="form-group">
            <label class="form-label">Уникальный ID (Slug) *</label>
            <input type="text" class="form-input" id="form-slug" required placeholder="create-astral">
          </div>

          <!-- Type selection -->
          <div class="form-group">
            <label class="form-label">Тип проекта</label>
            <select class="form-select" id="form-type">
              <option value="mod">Мод</option>
              <option value="modpack">Модпак</option>
              <option value="resourcepack">Шейдер / Текстурпак</option>
              <option value="plugin">Плагин</option>
            </select>
          </div>

          <!-- License -->
          <div class="form-group">
            <label class="form-label">Лицензия</label>
            <input type="text" class="form-input" id="form-license" value="MIT" placeholder="MIT, LGPL-3.0, Proprietary">
          </div>

          <!-- Mod File Upload -->
          <div class="form-group full-width" style="border: 2px dashed var(--border-color); padding: 20px; border-radius: var(--radius-md); text-align: center; background: rgba(255,255,255,0.01); margin-bottom: 8px;">
            <label class="form-label" style="font-weight: 700;"><i class="fa-solid fa-file-zipper" style="color: var(--primary-color); margin-right: 6px;"></i> Загрузить файл проекта (.jar, .zip) *</label>
            <input type="file" id="form-mod-file" required accept=".jar,.zip,.rar" class="form-input" style="padding: 10px; margin-top: 8px; max-width: 100%;">
            <p class="form-label" style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Максимальный размер для сохранения в БД: 1.5 МБ. Более крупные файлы будут сохранены в виде метаданных.</p>
          </div>

          <!-- Avatar / Logo Customizer -->
          <div class="form-group full-width">
            <label class="form-label">Иконка проекта *</label>
            <div class="avatar-picker">
              <div class="avatar-preview" id="form-avatar-preview" style="background-color: ${selectedColor}">
                ${selectedEmoji}
              </div>
              <div class="avatar-inputs" style="display:flex; flex-direction:column; gap:12px;">
                <div class="form-group" style="margin: 0; padding: 0;">
                  <div class="form-label" style="font-size: 12px; color: var(--text-secondary);">Загрузить свою иконку (PNG/JPG):</div>
                  <input type="file" id="form-icon-file" accept="image/*" class="form-input" style="padding: 6px 12px; font-size:12px; max-width: 320px;">
                </div>
                
                <div class="form-group" style="margin: 4px 0 0 0; padding: 0;">
                  <div class="form-label" style="font-size: 12px; color: var(--text-secondary);">ИЛИ выберите оригинальную / готовую иконку:</div>
                  <div class="preset-icons-grid">
                    ${presetIcons.map(p => `
                      <div class="preset-icon-item" title="${p.name}" data-url="${p.url}">
                        <img src="${p.url}" alt="${p.name}">
                      </div>
                    `).join("")}
                  </div>
                </div>

                <div class="auth-divider" style="margin: 8px 0; font-size:11px;"><span>ИЛИ создать в конструкторе</span></div>

                <div class="form-group" style="margin: 0; padding: 0;">
                  <div class="form-label" style="font-size: 12px; color: var(--text-secondary);">Выберите символ:</div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${emojis.map(e => `<span class="emoji-choice" style="cursor:pointer; font-size: 20px; padding: 4px; border-radius:4px;" data-emoji="${e}">${e}</span>`).join("")}
                  </div>
                </div>
                
                <div class="form-group" style="margin: 0; padding: 0;">
                  <div class="form-label" style="font-size: 12px; color: var(--text-secondary);">Выберите цвет фона:</div>
                  <div class="avatar-color-choices">
                    ${colors.map(c => `
                      <div class="color-dot ${c === selectedColor ? 'selected' : ''}" style="background-color: ${c}" data-color="${c}"></div>
                    `).join("")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Short Description -->
          <div class="form-group full-width">
            <label class="form-label">Краткое описание проекта *</label>
            <input type="text" class="form-input" id="form-short-desc" required placeholder="Кратко расскажите о функциях мода (до 120 символов)..." maxlength="150">
          </div>

          <!-- Long Description -->
          <div class="form-group full-width">
            <label class="form-label">Полное описание (Поддерживает HTML разметку) *</label>
            <textarea class="form-textarea" id="form-desc" required placeholder="Подробно расскажите о функциях, инструкциях по установке и особенностях вашего дополнения..."></textarea>
          </div>

          <!-- Loaders -->
          <div class="form-group full-width">
            <label class="form-label">Поддерживаемые загрузчики</label>
            <div class="form-checkbox-group">
              ${Object.entries(METADATA.loaders).map(([key, label]) => `
                <label class="form-checkbox-label">
                  <input type="checkbox" name="form-loader" value="${key}">
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Game Versions -->
          <div class="form-group full-width">
            <label class="form-label">Поддерживаемые версии Minecraft</label>
            <div class="form-checkbox-group">
              ${METADATA.gameVersions.map(v => `
                <label class="form-checkbox-label">
                  <input type="checkbox" name="form-version" value="${v}">
                  <span>${v}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Categories -->
          <div class="form-group full-width">
            <label class="form-label">Категории</label>
            <div class="form-checkbox-group">
              ${Object.entries(METADATA.categories).map(([key, label]) => `
                <label class="form-checkbox-label">
                  <input type="checkbox" name="form-category" value="${key}">
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Code Links -->
          <div class="form-group">
            <label class="form-label">Ссылка на исходный код (GitHub)</label>
            <input type="url" class="form-input" id="form-source" placeholder="https://github.com/username/project">
          </div>

          <!-- Issues Link -->
          <div class="form-group">
            <label class="form-label">Ссылка на трекер ошибок (Issues)</label>
            <input type="url" class="form-input" id="form-issues" placeholder="https://github.com/username/project/issues">
          </div>

        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-create">Отменить</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-upload"></i> Опубликовать проект</button>
        </div>
      </form>
    </div>
  `;

  // --- INTERACTIVE EVENTS ---

  const previewEl = document.getElementById("form-avatar-preview");
  const fileInput = document.getElementById("form-icon-file");
  let uploadedAvatarData = null;

  // File Upload handling
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB
        showToast("Размер файла не должен превышать 2 МБ!", "info");
        fileInput.value = "";
        return;
      }
      document.querySelectorAll(".preset-icon-item").forEach(i => i.classList.remove("selected"));
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedAvatarData = event.target.result;
        previewEl.innerHTML = `<img src="${uploadedAvatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Project Mod File Reader
  let modFileName = "";
  let modFileSize = "";
  let modFileData = "";

  setTimeout(() => {
    const modFileInput = document.getElementById("form-mod-file");
    if (modFileInput) {
      modFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          modFileName = file.name;
          modFileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
          
          if (file.size > 1.5 * 1024 * 1024) {
            modFileData = "data:application/octet-stream;base64,TW9kU3BoZXJlTW9kRmlsZUNvbnRlbnRzTW9ja1VwbG9hZA==";
            showToast("Файл сохранен (сжатая демо-версия для экономии локального хранилища)", "info");
          } else {
            const reader = new FileReader();
            reader.onload = (event) => {
              modFileData = event.target.result;
            };
            reader.readAsDataURL(file);
          }
        }
      });
    }
  }, 100);

  // Preset icon choices
  document.querySelectorAll(".preset-icon-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".preset-icon-item").forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      uploadedAvatarData = item.getAttribute("data-url");
      fileInput.value = ""; // Clear file input
      previewEl.innerHTML = `<img src="${uploadedAvatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    });
  });

  // Custom Emoji choices
  document.querySelectorAll(".emoji-choice").forEach(choice => {
    choice.addEventListener("click", () => {
      document.querySelectorAll(".preset-icon-item").forEach(i => i.classList.remove("selected"));
      selectedEmoji = choice.getAttribute("data-emoji");
      uploadedAvatarData = null; // Reset file/preset upload
      fileInput.value = ""; // Clear file input
      previewEl.textContent = selectedEmoji;
      previewEl.style.backgroundColor = selectedColor;
    });
  });

  // Color selection choices
  document.querySelectorAll(".color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("selected"));
      dot.classList.add("selected");
      selectedColor = dot.getAttribute("data-color");
      if (!uploadedAvatarData || (!uploadedAvatarData.startsWith('http') && !uploadedAvatarData.startsWith('data:image'))) {
        previewEl.style.backgroundColor = selectedColor;
      }
    });
  });

  // Cancel Button
  document.getElementById("btn-cancel-create").addEventListener("click", () => {
    window.location.hash = "#/";
  });

  // Form Submission
  const form = document.getElementById("create-mod-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Collect data
    const name = document.getElementById("form-name").value.trim();
    const slug = document.getElementById("form-slug").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const type = document.getElementById("form-type").value;
    const license = document.getElementById("form-license").value.trim() || "MIT";
    const shortDesc = document.getElementById("form-short-desc").value.trim();
    const desc = document.getElementById("form-desc").value.trim();
    const source = document.getElementById("form-source").value.trim();
    const issues = document.getElementById("form-issues").value.trim();
    
    const loaders = Array.from(document.querySelectorAll('input[name="form-loader"]:checked')).map(c => c.value);
    const gameVersions = Array.from(document.querySelectorAll('input[name="form-version"]:checked')).map(c => c.value);
    const categories = Array.from(document.querySelectorAll('input[name="form-category"]:checked')).map(c => c.value);

    // Validations
    if (loaders.length === 0) {
      showToast("Выберите хотя бы один загрузчик модов!", "info");
      return;
    }
    if (gameVersions.length === 0) {
      showToast("Выберите хотя бы одну версию игры!", "info");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("current_user"));
    const authorName = currentUser ? currentUser.username : "MineDev";

    const newMod = {
      id: slug,
      name,
      slug,
      author: authorName,
      avatar: uploadedAvatarData || selectedEmoji,
      iconColor: selectedColor,
      shortDescription: shortDesc,
      description: desc,
      type,
      categories,
      loaders,
      gameVersions,
      downloads: 0,
      follows: 0,
      license,
      sourceUrl: source || null,
      issuesUrl: issues || null,
      gallery: [],
      filename: modFileName || `${slug}-1.0.0.jar`,
      fileSize: modFileSize || "450 KB",
      fileData: modFileData || "",
      approved: false
    };

    saveMod(newMod);
    showToast("Проект успешно создан и отправлен на модерацию!", "success");

    setTimeout(() => {
      window.location.hash = `#/mod/${slug}`;
    }, 800);
  });
}

function formatDate(dateString) {
  if (!dateString) return "Неизвестно";
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(".0", "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(".0", "") + "k";
  }
  return num.toString();
}

function formatNumberFull(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-circle-info"></i>';
    
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3000);
}

function renderUserAuth() {
  const wrapper = document.getElementById("user-auth-wrapper");
  if (!wrapper) return;

  const currentUser = JSON.parse(localStorage.getItem("current_user"));

  if (currentUser) {
    const isAdminOrOwner = currentUser.role === "ADMIN" || currentUser.role === "OWNER";
    wrapper.innerHTML = `
      <div class="user-profile" id="header-user-profile">
        <img src="${currentUser.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + currentUser.username}" alt="Аватар" class="user-avatar">
        <span class="user-name" style="display:inline-flex; align-items:center; gap:2px;">${currentUser.username}${getRoleBadgeHTML(currentUser.role)}</span>
        <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 4px; color: var(--text-secondary);"></i>
      </div>
      <div class="user-menu-dropdown" id="user-menu-dropdown">
        <div class="user-menu-info">
          <div class="user-menu-info-name" style="display:flex; align-items:center; gap:4px; font-weight:700;">
            ${currentUser.username}${getRoleBadgeHTML(currentUser.role)}
          </div>
          <div class="user-menu-info-uid" style="font-size:11px; color:var(--text-muted); margin-top:2px;">UID: ${currentUser.uid || 'XXXX'}</div>
          <div class="user-menu-info-email" style="margin-top:2px;">${currentUser.email}</div>
        </div>
        <div class="user-menu-divider"></div>
        ${isAdminOrOwner ? `
          <button class="user-menu-item" id="user-menu-admin"><i class="fa-solid fa-crown" style="color:var(--primary-color);"></i> Админ-панель</button>
          <div class="user-menu-divider"></div>
        ` : ''}
        <button class="user-menu-item" id="user-menu-my-projects"><i class="fa-solid fa-folder"></i> Мои проекты</button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" id="user-menu-profile"><i class="fa-solid fa-user-gear"></i> Настройки профиля</button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" id="user-menu-logout" style="color: #ef4444;"><i class="fa-solid fa-right-from-bracket"></i> Выйти</button>
      </div>
    `;

    const profileBtn = document.getElementById("header-user-profile");
    const dropdown = document.getElementById("user-menu-dropdown");

    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("active");
    });

    if (isAdminOrOwner) {
      document.getElementById("user-menu-admin").addEventListener("click", () => {
        window.location.hash = "#/admin";
      });
    }

    document.getElementById("user-menu-my-projects").addEventListener("click", () => {
      window.location.hash = `#/browse?q=${encodeURIComponent(currentUser.username)}`;
    });

    document.getElementById("user-menu-profile").addEventListener("click", () => {
      openProfileModal();
    });

    document.getElementById("user-menu-logout").addEventListener("click", () => {
      localStorage.removeItem("current_user");
      showToast("Вы успешно вышли из аккаунта", "info");
      renderUserAuth();
      if (window.location.hash === "#/create" || window.location.hash === "#/admin") {
        window.location.hash = "#/";
      }
    });

  } else {
    wrapper.innerHTML = `
      <button class="btn btn-secondary btn-sm" id="header-login-btn" style="padding: 6px 16px;">
        <i class="fa-solid fa-right-to-bracket"></i> Войти
      </button>
    `;

    document.getElementById("header-login-btn").addEventListener("click", openAuthModal);
  }
}

function openAuthModal() {
  const modal = document.getElementById("auth-modal");
  modal.classList.add("active");
  document.getElementById("login-email").focus();
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  modal.classList.remove("active");
  document.getElementById("login-form").reset();
  document.getElementById("register-form").reset();
}

function setupAuthModalEvents() {
  const backdrop = document.getElementById("auth-modal-backdrop");
  const closeBtn = document.getElementById("auth-modal-close-btn");
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const googleBtn = document.getElementById("btn-google-login");

  backdrop.addEventListener("click", closeAuthModal);
  closeBtn.addEventListener("click", closeAuthModal);

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    
    const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      showToast("Пользователь с такой почтой не найден!", "info");
      return;
    }
    
    if (user.password !== password) {
      showToast("Неверный пароль!", "info");
      return;
    }
    
    localStorage.setItem("current_user", JSON.stringify(user));
    showToast(`Рады видеть вас снова, ${user.username}!`, "success");
    closeAuthModal();
    renderUserAuth();
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    
    const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      showToast("Пользователь с такой почтой уже зарегистрирован!", "info");
      return;
    }

    const user = {
      uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
      username: username,
      email: email,
      password: password,
      role: "PLAYER",
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`
    };

    users.push(user);
    localStorage.setItem("registered_users", JSON.stringify(users));
    localStorage.setItem("current_user", JSON.stringify(user));
    
    showToast(`Аккаунт успешно создан! Добро пожаловать, ${username}!`, "success");
    closeAuthModal();
    renderUserAuth();
  });

  googleBtn.addEventListener("click", () => {
    openGoogleModal();
  });
}

function openGoogleModal() {
  const googleModal = document.getElementById("google-modal");
  googleModal.classList.add("active");
  
  const accountsList = document.getElementById("google-accounts-list");
  const accounts = [
    { name: "MineDev Coder", email: "finalwarningbee@gmail.com", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=minedev" },
    { name: "Steve Builder", email: "steve.builder@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=steve" },
    { name: "Alex Explorer", email: "alex.explorer@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=alex" }
  ];
  
  let html = accounts.map((acc, index) => `
    <div class="google-account-item" data-index="${index}">
      <img src="${acc.avatar}" alt="Avatar" class="google-account-avatar">
      <div class="google-account-info">
        <div class="google-account-name">${acc.name}</div>
        <div class="google-account-email">${acc.email}</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: #70757a; font-size:10px;"></i>
    </div>
  `).join("");
  
  html += `
    <div class="google-account-item" id="google-use-another-btn">
      <div class="google-account-avatar" style="display:flex; align-items:center; justify-content:center; background:#f1f3f4; color:#5f6368;">
        <i class="fa-solid fa-user-plus" style="font-size:14px;"></i>
      </div>
      <div class="google-account-info">
        <div class="google-account-name" style="color:#1a73e8;">Использовать другой аккаунт</div>
      </div>
    </div>
  `;
  
  accountsList.innerHTML = html;
  document.getElementById("google-custom-account-form").style.display = "none";
  accountsList.style.display = "flex";
  
  const items = accountsList.querySelectorAll(".google-account-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      if (item.id === "google-use-another-btn") {
        accountsList.style.display = "none";
        document.getElementById("google-custom-account-form").style.display = "block";
        document.getElementById("google-custom-name").focus();
        return;
      }
      
      const idx = item.getAttribute("data-index");
      const selectedAcc = accounts[idx];
      loginWithGoogleAccount(selectedAcc);
    });
  });
}

function loginWithGoogleAccount(account) {
  const card = document.querySelector(".google-modal-card");
  const originalHtml = card.innerHTML;
  
  card.innerHTML = `
    <div style="padding: 40px 0; text-align: center;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; color: #1a73e8; margin-bottom: 24px;"></i>
      <h3 style="font-size: 18px; margin-bottom: 8px; color: #202124;">Вход в аккаунт...</h3>
      <p style="font-size: 14px; color: #5f6368;">Связываем ваш Google профиль с ModSphere</p>
    </div>
  `;
  
  setTimeout(() => {
    const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    let userObj = users.find(u => u.email.toLowerCase() === account.email.toLowerCase());
    
    if (!userObj) {
      const username = account.name.replace(/\s+/g, "");
      userObj = {
        uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        username: username,
        email: account.email,
        password: "google_login_no_password",
        role: (account.email.toLowerCase() === "finalwarningbee@gmail.com") ? "OWNER" : "PLAYER",
        avatar: account.avatar
      };
      users.push(userObj);
      localStorage.setItem("registered_users", JSON.stringify(users));
    }
    
    localStorage.setItem("current_user", JSON.stringify(userObj));
    
    closeGoogleModal();
    closeAuthModal();
    renderUserAuth();
    
    showToast(`Вход через Google успешно выполнен! Добро пожаловать, ${username}!`, "success");
    
    card.innerHTML = originalHtml;
  }, 1500);
}

function closeGoogleModal() {
  document.getElementById("google-modal").classList.remove("active");
}

function setupGoogleChooserEvents() {
  const googleModalBackdrop = document.getElementById("google-modal-backdrop");
  const googleModalCloseBtn = document.getElementById("google-modal-close-btn");
  const customCancel = document.getElementById("btn-google-custom-cancel");
  const customSubmit = document.getElementById("btn-google-custom-submit");
  
  googleModalBackdrop.addEventListener("click", closeGoogleModal);
  googleModalCloseBtn.addEventListener("click", closeGoogleModal);
  
  customCancel.addEventListener("click", () => {
    document.getElementById("google-custom-account-form").style.display = "none";
    document.getElementById("google-accounts-list").style.display = "flex";
  });
  
  customSubmit.addEventListener("click", () => {
    const name = document.getElementById("google-custom-name").value.trim();
    const email = document.getElementById("google-custom-email").value.trim();
    
    if (!name || !email) {
      showToast("Заполните все поля!", "info");
      return;
    }
    if (!email.includes("@")) {
      showToast("Введите корректный email!", "info");
      return;
    }
    
    const customAcc = {
      name: name,
      email: email,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`
    };
    
    loginWithGoogleAccount(customAcc);
  });
}

// --- PROFILE EDIT MODAL HANDLERS ---
let tempAvatarData = null;
let tempBannerData = null;

function openProfileModal() {
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  if (!currentUser) return;

  document.getElementById("profile-preview-username").textContent = currentUser.username;
  document.getElementById("profile-preview-uid").textContent = `UID: ${currentUser.uid || 'XXXX'}`;
  document.getElementById("profile-preview-badge").innerHTML = getRoleBadgeHTML(currentUser.role);
  
  const avatarEl = document.getElementById("profile-preview-avatar");
  avatarEl.innerHTML = `<img src="${currentUser.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + currentUser.username}" alt="Avatar">`;

  const bannerEl = document.getElementById("profile-preview-banner");
  if (currentUser.banner) {
    bannerEl.style.backgroundImage = `url(${currentUser.banner})`;
    bannerEl.style.backgroundSize = "cover";
    bannerEl.style.backgroundPosition = "center";
  } else {
    bannerEl.style.backgroundImage = `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`;
  }

  // Clear inputs
  document.getElementById("profile-banner-input").value = "";
  document.getElementById("profile-avatar-input").value = "";
  document.getElementById("profile-bio-input").value = currentUser.bio || "";
  document.getElementById("profile-username-input").value = currentUser.username || "";

  // Reset local temp storage
  tempAvatarData = null;
  tempBannerData = null;

  document.getElementById("profile-modal").classList.add("active");
}

function closeProfileModal() {
  document.getElementById("profile-modal").classList.remove("active");
}

function setupProfileModalEvents() {
  const backdrop = document.getElementById("profile-modal-backdrop");
  const closeBtn = document.getElementById("profile-modal-close-btn");
  const cancelBtn = document.getElementById("btn-profile-close");
  const saveBtn = document.getElementById("btn-profile-save");
  
  const avatarInput = document.getElementById("profile-avatar-input");
  const bannerInput = document.getElementById("profile-banner-input");

  if (backdrop) backdrop.addEventListener("click", closeProfileModal);
  if (closeBtn) closeBtn.addEventListener("click", closeProfileModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeProfileModal);

  if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1.5 * 1024 * 1024) {
          showToast("Размер аватарки не должен превышать 1.5 МБ!", "info");
          avatarInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          tempAvatarData = event.target.result;
          document.getElementById("profile-preview-avatar").innerHTML = `<img src="${tempAvatarData}" alt="Avatar">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (bannerInput) {
    bannerInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1.5 * 1024 * 1024) {
          showToast("Размер шапки не должен превышать 1.5 МБ!", "info");
          bannerInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          tempBannerData = event.target.result;
          const bannerEl = document.getElementById("profile-preview-banner");
          bannerEl.style.backgroundImage = `url(${tempBannerData})`;
          bannerEl.style.backgroundSize = "cover";
          bannerEl.style.backgroundPosition = "center";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("current_user"));
      if (!currentUser) return;

      const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
      const userInDb = registeredUsers.find(u => u.uid === currentUser.uid);

      const newUsername = document.getElementById("profile-username-input").value.trim();
      if (!newUsername) {
        showToast("Никнейм не может быть пустым!", "error");
        return;
      }

      // Check if username is already taken by someone else
      const nameExists = registeredUsers.some(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.uid !== currentUser.uid);
      if (nameExists) {
        showToast("Этот никнейм уже занят другим пользователем!", "error");
        return;
      }

      // Update nickname
      const oldUsername = currentUser.username;
      currentUser.username = newUsername;
      if (userInDb) userInDb.username = newUsername;

      if (tempAvatarData) {
        currentUser.avatar = tempAvatarData;
        if (userInDb) userInDb.avatar = tempAvatarData;
      }
      if (tempBannerData) {
        currentUser.banner = tempBannerData;
        if (userInDb) userInDb.banner = tempBannerData;
      }

      const newBio = document.getElementById("profile-bio-input").value.trim();
      currentUser.bio = newBio;
      if (userInDb) userInDb.bio = newBio;

      localStorage.setItem("current_user", JSON.stringify(currentUser));
      localStorage.setItem("registered_users", JSON.stringify(registeredUsers));

      // Update any mods where this user is the author
      if (oldUsername !== newUsername) {
        const mods = getMods();
        let updatedCount = 0;
        mods.forEach(mod => {
          if (mod.author === oldUsername) {
            mod.author = newUsername;
            updatedCount++;
          }
        });
        if (updatedCount > 0) {
          localStorage.setItem("mods_data", JSON.stringify(mods));
        }
      }

      showToast("Профиль успешно обновлен!", "success");
      renderUserAuth();
      
      if (window.location.hash === "#/admin") {
        renderAdminPanel();
      } else if (window.location.hash === "#/") {
        renderHome();
      } else if (window.location.hash === "#/browse") {
        renderBrowseResults();
      }

      closeProfileModal();
    });
  }
}

function setupPublicProfileEvents() {
  const backdrop = document.getElementById("public-profile-modal-backdrop");
  const closeBtn = document.getElementById("public-profile-modal-close-btn");
  
  if (backdrop) backdrop.addEventListener("click", closePublicProfileModal);
  if (closeBtn) closeBtn.addEventListener("click", closePublicProfileModal);

  // Tab switching logic
  const tabBio = document.getElementById("public-profile-tab-bio");
  const tabMods = document.getElementById("public-profile-tab-mods");
  const panelBio = document.getElementById("public-profile-panel-bio");
  const panelMods = document.getElementById("public-profile-panel-mods");

  if (tabBio && tabMods && panelBio && panelMods) {
    tabBio.addEventListener("click", () => {
      tabBio.classList.add("active");
      tabMods.classList.remove("active");
      panelBio.style.display = "block";
      panelBio.classList.add("active");
      panelMods.style.display = "none";
      panelMods.classList.remove("active");
    });

    tabMods.addEventListener("click", () => {
      tabMods.classList.add("active");
      tabBio.classList.remove("active");
      panelMods.style.display = "block";
      panelMods.classList.add("active");
      panelBio.style.display = "none";
      panelBio.classList.remove("active");
    });
  }
}

function closePublicProfileModal() {
  document.getElementById("public-profile-modal").classList.remove("active");
}

function openPublicProfileModal(username) {
  if (!username) return;

  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    // Fallback profile for mock authors (e.g. Sodium/Iris mock authors)
    user = {
      uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
      username: username,
      role: username === "JellySquid" || username === "CoderBot" ? "OWNER" : "PLAYER",
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      banner: "",
      bio: username === "JellySquid" 
        ? "Разработчик Sodium — оптимизационного движка для Minecraft." 
        : username === "CoderBot" 
          ? "Создатель Iris Shaders — мода для поддержки шейдеров на Fabric/Sodium." 
          : "Активный участник сообщества ModSphere."
    };
  }

  // Reset tabs to default (Bio tab active)
  const tabBio = document.getElementById("public-profile-tab-bio");
  const tabMods = document.getElementById("public-profile-tab-mods");
  const panelBio = document.getElementById("public-profile-panel-bio");
  const panelMods = document.getElementById("public-profile-panel-mods");

  if (tabBio && tabMods && panelBio && panelMods) {
    tabBio.classList.add("active");
    tabMods.classList.remove("active");
    panelBio.style.display = "block";
    panelBio.classList.add("active");
    panelMods.style.display = "none";
    panelMods.classList.remove("active");
  }

  // Populate avatar
  const avatarEl = document.getElementById("public-profile-avatar");
  if (avatarEl) {
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="Avatar">`;
    } else {
      avatarEl.innerHTML = `<span style="font-size: 48px;">👤</span>`;
    }
  }

  // Populate banner
  const bannerEl = document.getElementById("public-profile-banner");
  if (bannerEl) {
    if (user.banner) {
      bannerEl.style.backgroundImage = `url(${user.banner})`;
      bannerEl.style.backgroundSize = "cover";
      bannerEl.style.backgroundPosition = "center";
    } else {
      bannerEl.style.backgroundImage = `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`;
    }
  }

  // Populate text contents
  const usernameEl = document.getElementById("public-profile-username");
  const uidEl = document.getElementById("public-profile-uid");
  const badgeEl = document.getElementById("public-profile-badge");
  const bioEl = document.getElementById("public-profile-bio");

  if (usernameEl) usernameEl.textContent = user.username;
  if (uidEl) uidEl.textContent = `UID: ${user.uid || 'XXXX'}`;
  if (badgeEl) badgeEl.innerHTML = getRoleBadgeHTML(user.role || "PLAYER");
  if (bioEl) bioEl.textContent = user.bio || "Пользователь еще не рассказал о себе.";

  // Retrieve and filter mods
  const allMods = getMods();
  const authorMods = allMods.filter(m => m.author.toLowerCase() === username.toLowerCase() && m.approved);

  // Stats
  const totalDownloads = authorMods.reduce((sum, m) => sum + m.downloads, 0);
  const totalFollows = authorMods.reduce((sum, m) => sum + m.follows, 0);

  const countEl = document.getElementById("public-profile-mods-count");
  const statDownloadsEl = document.getElementById("public-profile-stat-downloads");
  const statFollowsEl = document.getElementById("public-profile-stat-follows");

  if (countEl) countEl.textContent = authorMods.length;
  if (statDownloadsEl) statDownloadsEl.textContent = formatNumber(totalDownloads);
  if (statFollowsEl) statFollowsEl.textContent = formatNumber(totalFollows);

  // Populate Projects Grid
  const gridEl = document.getElementById("public-profile-mods-grid");
  if (gridEl) {
    gridEl.innerHTML = "";
    if (authorMods.length === 0) {
      gridEl.innerHTML = `
        <div class="no-results" style="padding: 48px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(0,0,0,0.1); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i class="fa-solid fa-folder-open" style="font-size: 40px; color: var(--text-muted);"></i>
          <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0;">Проектов не найдено</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0; text-align: center;">У этого автора пока нет опубликованных и одобренных проектов.</p>
        </div>
      `;
    } else {
      authorMods.forEach(mod => {
        const card = createModCard(mod);
        // Ensure clicking card closes the profile modal
        card.addEventListener("click", () => {
          closePublicProfileModal();
        });
        gridEl.appendChild(card);
      });
    }
  }

  // Open modal
  const modalEl = document.getElementById("public-profile-modal");
  if (modalEl) modalEl.classList.add("active");
}

function renderAvatar(avatar) {
  if (!avatar) return '📦';
  if (avatar.startsWith('http') || avatar.startsWith('data:image')) {
    return `<img src="${avatar}" alt="Иконка мода">`;
  }
  return avatar;
}

function setupSpotlightSearch() {
  const backdrop = document.getElementById("search-backdrop");
  backdrop.addEventListener("click", deactivateSpotlightSearch);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isSpotlightActive) {
      deactivateSpotlightSearch();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const heroInput = document.getElementById("hero-search-input");
      if (heroInput) {
        activateSpotlightSearch();
      } else {
        const headerInput = document.getElementById("header-search-input");
        if (headerInput) headerInput.focus();
      }
    }
  });
}

function activateSpotlightSearch() {
  if (isSpotlightActive) return;
  
  const searchBar = document.getElementById("main-hero-search-bar");
  const backdrop = document.getElementById("search-backdrop");
  const closeBtn = document.getElementById("hero-search-close-btn");
  const resultsDiv = document.getElementById("hero-search-results");
  const input = document.getElementById("hero-search-input");
  const activeIcon = searchBar.querySelector(".search-icon-active");
  
  if (!searchBar) return;
  
  isSpotlightActive = true;
  
  const rect = searchBar.getBoundingClientRect();
  
  spotlightPlaceholder = document.createElement("div");
  spotlightPlaceholder.className = "hero-search-placeholder";
  spotlightPlaceholder.style.height = `${rect.height}px`;
  spotlightPlaceholder.style.width = `${rect.width}px`;
  const computedStyle = window.getComputedStyle(searchBar);
  spotlightPlaceholder.style.margin = computedStyle.margin;
  searchBar.parentNode.insertBefore(spotlightPlaceholder, searchBar);
  
  document.body.appendChild(searchBar);
  
  searchBar.style.transition = "none";
  searchBar.style.position = "fixed";
  searchBar.style.top = `${rect.top}px`;
  searchBar.style.left = `${rect.left}px`;
  searchBar.style.width = `${rect.width}px`;
  searchBar.style.height = `${rect.height}px`;
  searchBar.style.margin = "0";
  searchBar.style.zIndex = "2000";
  
  backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
  
  searchBar.offsetHeight;
  
  searchBar.style.transition = "";
  searchBar.classList.add("active-spotlight");
  
  const targetWidth = Math.min(680, window.innerWidth - 40);
  const targetLeft = (window.innerWidth - targetWidth) / 2;
  
  searchBar.style.top = "100px";
  searchBar.style.left = `${targetLeft}px`;
  searchBar.style.width = `${targetWidth}px`;
  searchBar.style.height = "auto";
  
  closeBtn.style.display = "flex";
  resultsDiv.style.display = "flex";
  if (activeIcon) activeIcon.style.display = "block";
  
  renderSpotlightResults(input.value);
  
  setTimeout(() => {
    input.focus();
  }, 100);
}

function deactivateSpotlightSearch() {
  if (!isSpotlightActive) return;
  
  const searchBar = document.getElementById("main-hero-search-bar");
  const backdrop = document.getElementById("search-backdrop");
  const closeBtn = document.getElementById("hero-search-close-btn");
  const resultsDiv = document.getElementById("hero-search-results");
  const activeIcon = searchBar.querySelector(".search-icon-active");
  
  if (!searchBar || !spotlightPlaceholder) return;
  
  isSpotlightActive = false;
  
  const rect = spotlightPlaceholder.getBoundingClientRect();
  
  searchBar.style.transition = "top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease, background-color 0.4s ease, border-radius 0.4s ease";
  searchBar.style.top = `${rect.top}px`;
  searchBar.style.left = `${rect.left}px`;
  searchBar.style.width = `${rect.width}px`;
  searchBar.style.height = `${rect.height}px`;
  
  searchBar.classList.remove("active-spotlight");
  backdrop.classList.remove("active");
  document.body.style.overflow = "";
  
  closeBtn.style.display = "none";
  resultsDiv.style.display = "none";
  if (activeIcon) activeIcon.style.display = "none";
  
  setTimeout(() => {
    if (spotlightPlaceholder && spotlightPlaceholder.parentNode) {
      spotlightPlaceholder.parentNode.insertBefore(searchBar, spotlightPlaceholder);
      spotlightPlaceholder.parentNode.removeChild(spotlightPlaceholder);
    }
    spotlightPlaceholder = null;
    
    searchBar.style.transition = "none";
    searchBar.style.position = "";
    searchBar.style.top = "";
    searchBar.style.left = "";
    searchBar.style.width = "";
    searchBar.style.height = "";
    searchBar.style.margin = "";
    searchBar.style.zIndex = "";
    
    resultsDiv.innerHTML = "";
  }, 400);
}

function renderSpotlightResults(query) {
  const resultsContainer = document.getElementById("hero-search-results");
  const mods = getMods();
  if (!resultsContainer) return;

  if (!query.trim()) {
    const trending = [...mods].sort((a, b) => b.downloads - a.downloads).slice(0, 3);
    resultsContainer.innerHTML = `
      <div style="font-size:11px; font-weight:700; color:var(--text-muted); padding: 8px 16px 4px 16px; text-transform:uppercase; letter-spacing:0.5px;">Рекомендуемые проекты</div>
    `;
    trending.forEach(mod => {
      resultsContainer.appendChild(createSpotlightResultItem(mod));
    });
    return;
  }

  const queryLC = query.toLowerCase();
  
  // Search mods
  const filteredMods = mods.filter(mod => 
    mod.name.toLowerCase().includes(queryLC) ||
    mod.shortDescription.toLowerCase().includes(queryLC) ||
    mod.author.toLowerCase().includes(queryLC)
  );

  // Search users
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const modAuthors = [...new Set(mods.map(m => m.author))];
  const allUsernames = new Set(users.map(u => u.username));
  modAuthors.forEach(author => {
    if (!allUsernames.has(author)) {
      users.push({
        uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        username: author,
        role: author === "JellySquid" || author === "CoderBot" ? "OWNER" : "PLAYER",
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(author)}`,
        banner: "",
        bio: author === "JellySquid" 
          ? "Разработчик Sodium — оптимизационного движка для Minecraft." 
          : author === "CoderBot" 
            ? "Создатель Iris Shaders — мода для поддержки шейдеров на Fabric/Sodium." 
            : "Активный участник сообщества ModSphere."
      });
      allUsernames.add(author);
    }
  });

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(queryLC));

  if (filteredMods.length === 0 && filteredUsers.length === 0) {
    resultsContainer.innerHTML = `
      <div class="overlay-no-results">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>Ничего не найдено по запросу <strong>"${query}"</strong></span>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = "";
  
  // Show matched users if any
  if (filteredUsers.length > 0) {
    const userSectionTitle = document.createElement("div");
    userSectionTitle.style = "font-size:11px; font-weight:700; color:var(--text-muted); padding: 8px 16px 4px 16px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border-color); margin-bottom:4px;";
    userSectionTitle.textContent = "Найденные авторы";
    resultsContainer.appendChild(userSectionTitle);
    
    filteredUsers.forEach(user => {
      resultsContainer.appendChild(createSpotlightUserItem(user));
    });
  }

  // Show matched mods if any
  if (filteredMods.length > 0) {
    const modSectionTitle = document.createElement("div");
    modSectionTitle.style = "font-size:11px; font-weight:700; color:var(--text-muted); padding: 12px 16px 4px 16px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border-color); margin-bottom:4px;";
    modSectionTitle.textContent = "Проекты";
    resultsContainer.appendChild(modSectionTitle);
    
    filteredMods.forEach(mod => {
      resultsContainer.appendChild(createSpotlightResultItem(mod));
    });
  }
}

function createSpotlightUserItem(user) {
  const el = document.createElement("div");
  el.className = "overlay-result-item user-search-result";
  
  el.innerHTML = `
    <div class="overlay-result-icon" style="background-color: var(--surface-color); border: 1.5px solid var(--border-color); border-radius: 50%; padding: 0; overflow: hidden; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center;">
      <img src="${user.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(user.username)}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div class="overlay-result-info">
      <div class="overlay-result-title-row" style="display:flex; align-items:center; gap:4px;">
        <span class="overlay-result-title">${user.username}</span>
        ${getRoleBadgeHTML(user.role || "PLAYER")}
      </div>
      <div class="overlay-result-desc">${user.bio || "Пользователь платформы ModSphere."}</div>
    </div>
    <div class="overlay-result-meta">
      <span class="result-tag" style="background: rgba(139, 92, 246, 0.08); color: var(--secondary-color); font-size:10px; padding:1px 6px;">Пользователь</span>
    </div>
  `;

  el.addEventListener("click", () => {
    deactivateSpotlightSearch();
    openPublicProfileModal(user.username);
  });

  return el;
}

function createSpotlightResultItem(mod) {
  const el = document.createElement("div");
  el.className = "overlay-result-item";
  
  const loadersStr = mod.loaders.map(l => 
    `<span class="result-tag" style="background: rgba(16, 185, 129, 0.08); color: var(--primary-color); font-size:10px; padding:1px 6px; margin-left:4px;">${METADATA.loaders[l] || l}</span>`
  ).join("");

  el.innerHTML = `
    <div class="overlay-result-icon" style="background-color: ${mod.iconColor || '#10b981'}">
      ${renderAvatar(mod.avatar)}
    </div>
    <div class="overlay-result-info">
      <div class="overlay-result-title-row">
        <span class="overlay-result-title">${mod.name}</span>
        <span class="overlay-result-badge">${METADATA.types[mod.type] || mod.type}</span>
      </div>
      <div class="overlay-result-desc">${mod.shortDescription}</div>
    </div>
    <div class="overlay-result-meta">
      <span><i class="fa-solid fa-download"></i> ${formatNumber(mod.downloads)}</span>
      <span>${loadersStr}</span>
    </div>
  `;

  el.addEventListener("click", () => {
    deactivateSpotlightSearch();
    window.location.hash = `#/mod/${mod.slug || mod.id}`;
  });

  return el;
}

// --- VIEW 5: ADMIN MANAGEMENT PANEL ---
function renderAdminPanel(activeTab = "mods") {
  const container = document.getElementById("main-content");
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const mods = getMods();
  const pendingMods = mods.filter(m => !m.approved);
  const currentUser = JSON.parse(localStorage.getItem("current_user"));

  container.innerHTML = `
    <div class="admin-panel-container">
      <div class="admin-panel-header">
        <h2><i class="fa-solid fa-crown" style="color: var(--primary-color); margin-right: 8px;"></i>Панель управления ModSphere</h2>
        <p>Модерация публикуемых файлов и выдача титулов (ролей) пользователям платформы.</p>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab-btn ${activeTab === 'mods' ? 'active' : ''}" id="admin-tab-mods-btn">
          <i class="fa-solid fa-file-shield"></i> Проекты на проверку (${pendingMods.length})
        </button>
        <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" id="admin-tab-users-btn">
          <i class="fa-solid fa-users-gear"></i> Пользователи (${users.length})
        </button>
      </div>

      <!-- Projects Moderation Tab Content -->
      <div class="admin-tab-content ${activeTab === 'mods' ? 'active' : ''}" id="admin-content-mods" style="display: ${activeTab === 'mods' ? 'block' : 'none'};">
        ${pendingMods.length === 0 ? `
          <div class="no-results" style="padding: 48px 20px;">
            <i class="fa-solid fa-circle-check" style="font-size: 48px; color: var(--primary-color);"></i>
            <h3>Очередь проверки пуста</h3>
            <p>Все загруженные проекты уже проверены и опубликованы.</p>
          </div>
        ` : `
          <div class="admin-pending-list">
            ${pendingMods.map(mod => {
              const mainFile = mod.versions && mod.versions.length > 0 ? mod.versions[0] : null;
              return `
                <div class="admin-pending-item" data-id="${mod.id}">
                  <div class="admin-pending-item-main">
                    <div class="admin-pending-icon" style="background-color: ${mod.iconColor || '#10b981'}">
                      ${renderAvatar(mod.avatar)}
                    </div>
                    <div class="admin-pending-info">
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <h3 class="admin-pending-title">${mod.name}</h3>
                        <span class="result-badge-type">${METADATA.types[mod.type] || mod.type}</span>
                      </div>
                      <p class="admin-pending-author">Автор: <strong class="author-link">${mod.author}</strong>${getAuthorBadgeHTML(mod.author)}</p>
                      <p class="admin-pending-desc">${mod.shortDescription}</p>
                      
                      ${mainFile ? `
                        <div class="admin-file-details">
                          <i class="fa-solid fa-paperclip"></i>
                          <span>Файл: <strong>${mainFile.filename}</strong> (${mainFile.fileSize})</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  <div class="admin-pending-actions">
                    ${mainFile ? `
                      <button class="btn btn-secondary btn-sm btn-download-pending" data-id="${mod.id}" title="Скачать файл для проверки">
                        <i class="fa-solid fa-download"></i> Скачать файл
                      </button>
                    ` : ''}
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-primary btn-sm btn-approve-pending" data-id="${mod.id}" style="background-color: var(--primary-color); flex:1; justify-content:center;">
                        <i class="fa-solid fa-check"></i> Одобрить
                      </button>
                      <button class="btn btn-secondary btn-sm btn-reject-pending" data-id="${mod.id}" style="border-color:#ef4444; color:#ef4444; flex:1; justify-content:center;">
                        <i class="fa-solid fa-xmark"></i> Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Users Management Tab Content -->
      <div class="admin-tab-content ${activeTab === 'users' ? 'active' : ''}" id="admin-content-users" style="display: ${activeTab === 'users' ? 'block' : 'none'};">
        <div class="admin-users-table-container">
          <table class="admin-users-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>UID</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Действия (Изменить роль)</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => {
                const isSelf = currentUser && currentUser.uid === user.uid;
                const isOwner = user.role === 'OWNER';
                return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${user.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + user.username}" alt="Avatar" class="user-avatar" style="width:28px; height:28px;">
                        <strong class="admin-username-display" data-uid="${user.uid}">${user.username}</strong>
                        ${(!isSelf && !(isOwner && currentUser.role !== 'OWNER')) ? `
                          <button class="btn btn-secondary btn-sm btn-edit-username" data-uid="${user.uid}" title="Редактировать ник" style="padding: 2px 6px; font-size: 11px; margin-left: 6px; display:inline-flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-pen" style="font-size:10px;"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                    <td><code style="color:var(--text-muted); font-size:12px;">${user.uid || 'XXXX'}</code></td>
                    <td>${user.email}</td>
                    <td>${getRoleBadgeHTML(user.role)}</td>
                    <td>
                      ${isSelf ? `
                        <span style="font-size:12px; color:var(--text-muted);">Вы сами (нельзя изменить)</span>
                      ` : (isOwner && currentUser.role !== 'OWNER') ? `
                        <span style="font-size:12px; color:var(--text-muted);">Владелец (нельзя изменить)</span>
                      ` : `
                        <select class="admin-role-select" data-uid="${user.uid}" style="background:var(--bg-color); border:1px solid var(--border-color); color:var(--text-primary); padding:4px 8px; border-radius:var(--radius-sm); font-size:13px; cursor:pointer;">
                          <option value="PLAYER" ${user.role === 'PLAYER' ? 'selected' : ''}>Игрок (PLAYER)</option>
                          <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Администратор (ADMIN)</option>
                          <option value="OWNER" ${user.role === 'OWNER' ? 'selected' : ''}>Владелец (OWNER)</option>
                        </select>
                      `}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // --- TAB SWITCHING EVENTS ---
  const modsBtn = document.getElementById("admin-tab-mods-btn");
  const usersBtn = document.getElementById("admin-tab-users-btn");
  const modsPanel = document.getElementById("admin-content-mods");
  const usersPanel = document.getElementById("admin-content-users");

  modsBtn.addEventListener("click", () => {
    modsBtn.classList.add("active");
    usersBtn.classList.remove("active");
    modsPanel.style.display = "block";
    usersPanel.style.display = "none";
  });

  usersBtn.addEventListener("click", () => {
    usersBtn.classList.add("active");
    modsBtn.classList.remove("active");
    usersPanel.style.display = "block";
    modsPanel.style.display = "none";
  });

  // --- ACTIONS: MODERATION EVENTS ---
  
  // Download button
  document.querySelectorAll(".btn-download-pending").forEach(btn => {
    btn.addEventListener("click", () => {
      const modId = btn.getAttribute("data-id");
      const currentMods = getMods();
      const modObj = currentMods.find(m => m.id === modId);
      if (modObj && modObj.versions && modObj.versions.length > 0) {
        triggerVersionDownload(modObj, modObj.versions[0]);
      }
    });
  });

  // Approve button
  document.querySelectorAll(".btn-approve-pending").forEach(btn => {
    btn.addEventListener("click", () => {
      const modId = btn.getAttribute("data-id");
      approvePendingMod(modId);
    });
  });

  // Reject button
  document.querySelectorAll(".btn-reject-pending").forEach(btn => {
    btn.addEventListener("click", () => {
      const modId = btn.getAttribute("data-id");
      rejectPendingMod(modId);
    });
  });

  // --- ACTIONS: ROLE MANAGEMENT ---
  document.querySelectorAll(".admin-role-select").forEach(select => {
    select.addEventListener("change", (e) => {
      const uid = select.getAttribute("data-uid");
      const newRole = e.target.value;
      changeUserRole(uid, newRole);
    });
  });

  // --- ACTIONS: USERNAME MANAGEMENT ---
  document.querySelectorAll(".btn-edit-username").forEach(btn => {
    btn.addEventListener("click", () => {
      const uid = btn.getAttribute("data-uid");
      const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
      const user = registeredUsers.find(u => u.uid === uid);
      if (!user) return;
      
      const newNickname = prompt(`Редактирование никнейма для ${user.username}. Введите новый ник:`, user.username);
      if (newNickname === null) return; // Cancelled
      
      const trimmed = newNickname.trim();
      if (!trimmed) {
        showToast("Никнейм не может быть пустым!", "error");
        return;
      }
      
      // Check if username is already taken
      const nameExists = registeredUsers.some(u => u.username.toLowerCase() === trimmed.toLowerCase() && u.uid !== uid);
      if (nameExists) {
        showToast("Этот никнейм уже занят!", "error");
        return;
      }
      
      // Update nickname
      const oldUsername = user.username;
      user.username = trimmed;
      localStorage.setItem("registered_users", JSON.stringify(registeredUsers));
      
      // Update any mods where this user is the author
      const mods = getMods();
      let updatedCount = 0;
      mods.forEach(mod => {
        if (mod.author === oldUsername) {
          mod.author = trimmed;
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        localStorage.setItem("mods_data", JSON.stringify(mods));
      }
      
      showToast(`Никнейм изменен с "${oldUsername}" на "${trimmed}"!`, "success");
      
      // Re-render staying on the users tab
      renderAdminPanel("users");
    });
  });
}

function approvePendingMod(modId) {
  const currentMods = getMods();
  const mod = currentMods.find(m => m.id === modId);
  if (mod) {
    mod.approved = true;
    mod.updatedAt = new Date().toISOString();
    localStorage.setItem("mods_data", JSON.stringify(currentMods));
    showToast(`Проект "${mod.name}" успешно одобрен и опубликован!`, "success");
    renderAdminPanel();
  }
}

function rejectPendingMod(modId) {
  let currentMods = getMods();
  const mod = currentMods.find(m => m.id === modId);
  if (mod) {
    currentMods = currentMods.filter(m => m.id !== modId);
    localStorage.setItem("mods_data", JSON.stringify(currentMods));
    showToast(`Проект "${mod.name}" отклонен и удален.`, "info");
    renderAdminPanel();
  }
}

function changeUserRole(uid, newRole) {
  const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const user = registeredUsers.find(u => u.uid === uid);
  if (user) {
    const oldRole = user.role;
    user.role = newRole;
    localStorage.setItem("registered_users", JSON.stringify(registeredUsers));
    
    // Update current user locally if editing self
    const currentUser = JSON.parse(localStorage.getItem("current_user"));
    if (currentUser && currentUser.uid === uid) {
      currentUser.role = newRole;
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      renderUserAuth();
    }
    
    showToast(`Роль пользователя ${user.username} изменена с ${oldRole} на ${newRole}`, "success");
    renderAdminPanel("users");
  }
}
