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
    favorites: false,
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
  gameVersions: generateAllGameVersions()
};

function generateAllGameVersions() {
  const releases = [
    ["1.21", [5, 4, 3, 2, 1, 0]],
    ["1.20", [6, 5, 4, 3, 2, 1, 0]],
    ["1.19", [4, 3, 2, 1, 0]],
    ["1.18", [2, 1, 0]],
    ["1.17", [1, 0]],
    ["1.16", [5, 4, 3, 2, 1, 0]],
    ["1.15", [2, 1, 0]],
    ["1.14", [4, 3, 2, 1, 0]],
    ["1.13", [2, 1, 0]],
    ["1.12", [2, 1, 0]],
    ["1.11", [2, 1, 0]],
    ["1.10", [2, 1, 0]],
    ["1.9", [4, 3, 2, 1, 0]],
    ["1.8", [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
    ["1.7", [10, 9, 8, 7, 6, 5, 4, 3, 2]],
    ["1.6", [4, 2, 1]],
    ["1.5", [2, 1]],
    ["1.4", [7, 6, 5, 4, 2]],
    ["1.3", [2, 1]],
    ["1.2", [5, 4, 3, 2, 1]],
    ["1.1", [0]],
    ["1.0.0", []]
  ];
  const versions = [];
  releases.forEach(([major, patches]) => {
    if (patches.length === 0) {
      versions.push(major);
      return;
    }
    patches.forEach(p => {
      versions.push(p === 0 ? major : `${major}.${p}`);
    });
  });
  return versions;
}

function getVersionsInRange(fromVer, toVer) {
  const all = METADATA.gameVersions;
  const fromIdx = all.indexOf(fromVer);
  const toIdx = all.indexOf(toVer);
  if (fromIdx === -1 || toIdx === -1) return [];
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  return all.slice(start, end + 1);
}

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
    const defaults = DEFAULT_USERS.map(u => ({ ...u, updatedAt: new Date().toISOString() }));
    localStorage.setItem("registered_users", JSON.stringify(defaults));
  }

  const curUser = localStorage.getItem("current_user");
  if (curUser && curUser.includes("MS-")) {
    localStorage.removeItem("current_user");
  }
}

let syncPushTimeout = null;
let syncPollInterval = null;
let lastSyncTime = null;

function parseSyncTime(value) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function mergeUsersSync(local, remote) {
  const map = new Map();
  [...local, ...remote].forEach(u => {
    if (!u?.uid) return;
    const existing = map.get(u.uid);
    if (!existing) {
      map.set(u.uid, u);
      return;
    }
    const pick = parseSyncTime(u.updatedAt) >= parseSyncTime(existing.updatedAt) ? u : existing;
    const other = pick === u ? existing : u;
    map.set(u.uid, {
      ...other,
      ...pick,
      settings: { ...(other.settings || {}), ...(pick.settings || {}) }
    });
  });
  return Array.from(map.values());
}

function mergeModsSync(local, remote) {
  const map = new Map();
  [...local, ...remote].forEach(m => {
    if (!m?.id) return;
    const existing = map.get(m.id);
    if (!existing) {
      map.set(m.id, m);
      return;
    }
    const pick = parseSyncTime(m.updatedAt) >= parseSyncTime(existing.updatedAt) ? m : existing;
    const other = pick === m ? existing : m;
    map.set(m.id, {
      ...other,
      ...pick,
      downloads: Math.max(existing.downloads || 0, m.downloads || 0),
      follows: Math.max(existing.follows || 0, m.follows || 0),
      views: Math.max(existing.views || 0, m.views || 0)
    });
  });
  return Array.from(map.values());
}

function refreshCurrentUserFromDb() {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  if (!currentUser?.uid) return;
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const fresh = users.find(u => u.uid === currentUser.uid);
  if (fresh) {
    localStorage.setItem("current_user", JSON.stringify(fresh));
    setupTheme();
    applyUserSettings();
  }
}

function applyRemoteSyncData(data, silent = false) {
  if (!data) return false;
  let changed = false;
  const localMods = JSON.parse(localStorage.getItem("mods_data") || "[]");
  const localUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");

  if (Array.isArray(data.mods)) {
    const merged = mergeModsSync(localMods, data.mods);
    if (JSON.stringify(merged) !== JSON.stringify(localMods)) {
      originalSetItem.call(localStorage, "mods_data", JSON.stringify(merged));
      changed = true;
    }
  }
  if (Array.isArray(data.users)) {
    const merged = mergeUsersSync(localUsers, data.users);
    if (JSON.stringify(merged) !== JSON.stringify(localUsers)) {
      originalSetItem.call(localStorage, "registered_users", JSON.stringify(merged));
      changed = true;
    }
  }
  if (data.siteSettings) {
    originalSetItem.call(localStorage, "site_settings", JSON.stringify(data.siteSettings));
  }
  if (Array.isArray(data.activityLog)) {
    originalSetItem.call(localStorage, "activity_log", JSON.stringify(data.activityLog));
  }
  if (data.lastSync) lastSyncTime = data.lastSync;

  refreshCurrentUserFromDb();
  updateSyncStatusIndicator();

  if (changed && !silent) {
    const path = window.location.hash;
    if (path === "#/" || path.startsWith("#/browse") || path.startsWith("#/mod/") || path === "#/admin") {
      handleRoute();
    }
  }
  return changed;
}

async function syncPush() {
  try {
    const mods = JSON.parse(localStorage.getItem("mods_data") || "[]");
    const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const siteSettings = JSON.parse(localStorage.getItem("site_settings") || "{}");
    const activityLog = JSON.parse(localStorage.getItem("activity_log") || "[]");
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ mods, users, siteSettings, activityLog })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.data) applyRemoteSyncData(result.data, true);
      lastSyncTime = new Date().toISOString();
      updateSyncStatusIndicator();
    }
  } catch(e) {
    console.log("Local sync push failed (expected if on static host):", e);
  }
}

async function syncPull(silent = true) {
  try {
    const res = await fetch("/api/sync");
    if (res.ok) {
      const data = await res.json();
      return applyRemoteSyncData(data, silent);
    }
  } catch(e) {
    console.log("Local sync pull failed (expected if on static host):", e);
  }
  return false;
}

function startSyncPolling() {
  if (syncPollInterval) return;
  syncPollInterval = setInterval(() => syncPull(true), 12000);
}

function logActivity(action, details = "") {
  const log = JSON.parse(localStorage.getItem("activity_log") || "[]");
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  log.unshift({
    id: Date.now().toString(36),
    action,
    details,
    user: currentUser?.username || "system",
    time: new Date().toISOString()
  });
  if (log.length > 200) log.length = 200;
  localStorage.setItem("activity_log", JSON.stringify(log));

  // Also track reports for admin panel
  if (action === "mod_report") {
    const reports = JSON.parse(localStorage.getItem("mod_reports") || "[]");
    reports.unshift({ action, details, user: currentUser?.username || "system", time: new Date().toISOString() });
    if (reports.length > 100) reports.length = 100;
    localStorage.setItem("mod_reports", JSON.stringify(reports));
  }

  // Track login history for security tab
  if (action === "user_login" || action === "user_register") {
    const loginLog = JSON.parse(localStorage.getItem("login_history") || "[]");
    loginLog.unshift({ action, username: currentUser?.username || "system", time: new Date().toISOString(), ip: "local" });
    if (loginLog.length > 100) loginLog.length = 100;
    localStorage.setItem("login_history", JSON.stringify(loginLog));
  }
}

function touchUserUpdated(user) {
  user.updatedAt = new Date().toISOString();
  return user;
}

// Intercept LocalStorage to auto-sync to backend
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  if (key === "mods_data" || key === "registered_users" || key === "site_settings" || key === "activity_log") {
    if (syncPushTimeout) clearTimeout(syncPushTimeout);
    syncPushTimeout = setTimeout(syncPush, 500);
  }
};

// Initialize Application
async function initApp() {
  initUserDatabase();
  
  await syncPull(true);
  startSyncPolling();

  setupTheme();
  applyUserSettings();
  setupRouting();
  setupGlobalEvents();
  setupSpotlightSearch();
  setupSiteFeatures();
  renderUserAuth();
  setupAuthModalEvents();
  setupSettingsModalEvents();
  setupProfileModalEvents();
  setupPublicProfileEvents();
  renderSiteAnnouncement();
}

// --- THEME & USER SETTINGS ---
const I18N = {
  ru: {
    nav_home: "Главная", nav_browse: "Обзор", nav_create: "Добавить мод",
    login: "Войти", logout: "Выйти", settings_saved: "Настройки успешно сохранены",
    sync_ok: "Синхронизировано", sync_pending: "Синхронизация...",
    // Admin panel
    admin_title: "Панель управления ModSphere",
    admin_subtitle: "Модерация, пользователи, статистика и настройки платформы.",
    admin_sync: "Синхронизировать", admin_export: "Экспорт JSON", admin_import: "Импорт JSON",
    admin_approve_all: "Одобрить все", admin_tab_queue: "Очередь", admin_tab_allmods: "Все моды",
    admin_tab_users: "Пользователи", admin_tab_stats: "Статистика", admin_tab_settings: "Настройки",
    admin_tab_logs: "Журнал", admin_tab_reports: "Жалобы", admin_tab_notifications: "Уведомления",
    admin_tab_security: "Безопасность", admin_tab_tools: "Инструменты",
    admin_users_count: "Пользователей", admin_projects_count: "Проектов",
    admin_pending: "На модерации", admin_downloads: "Скачиваний",
    admin_banned: "Заблокировано", admin_new_week: "Новых за неделю",
    admin_queue_empty: "Очередь проверки пуста",
    admin_queue_empty_desc: "Все загруженные проекты уже проверены и опубликованы.",
    admin_search_users: "Поиск по никнейму, email или UID...",
    admin_search_mods: "Поиск модов по названию, автору...",
    admin_all_roles: "Все роли", admin_find: "Найти",
    admin_role_player: "Игрок", admin_role_moderator: "Модератор",
    admin_role_admin: "Администратор", admin_role_owner: "Владелец",
    admin_approve: "Одобрить", admin_reject: "Отклонить",
    admin_no_access: "Нет доступа", admin_author: "Автор",
    admin_top_authors: "Топ авторов", admin_top_mods: "Топ модов",
    admin_by_types: "По типам", admin_no_data: "Нет данных",
    admin_announcement: "Объявление на сайте", admin_maintenance: "Режим обслуживания",
    admin_save_settings: "Сохранить настройки", admin_log_empty: "Журнал пуст.",
    admin_users_not_found: "Пользователи не найдены.",
    admin_mods_not_found: "Моды не найдены.",
    admin_delete: "Удалить", admin_ban: "Заблокировать", admin_unban: "Разблокировать",
    admin_reset_password: "Сброс пароля", admin_profile: "Профиль",
    admin_featured: "★ На главную", admin_unfeatured: "Убрать ★",
    admin_reports_empty: "Жалоб нет",
    admin_reports_empty_desc: "Пользователи пока не отправляли жалобы.",
    admin_send_notification: "Отправить уведомление",
    admin_notif_title: "Заголовок", admin_notif_message: "Сообщение",
    admin_notif_type: "Тип", admin_notif_send: "Отправить всем",
    admin_notif_history: "История уведомлений", admin_notif_empty: "Уведомления не отправлялись.",
    admin_security: "Безопасность и защита",
    admin_ip_log: "Журнал входов", admin_force_logout: "Выход всех",
    admin_2fa: "Двухфакторная аутентификация",
    admin_tools: "Инструменты администратора",
    admin_clear_cache: "Очистить кеш", admin_rebuild_index: "Пересобрать индекс",
    admin_export_users_csv: "Экспорт юзеров CSV", admin_export_mods_csv: "Экспорт модов CSV",
    admin_database_size: "Размер базы данных",
    admin_quick_actions: "Быстрые действия",
    // Settings
    settings_title: "Настройки сайта",
    settings_subtitle: "Выберите язык и тему оформления. Изменения сохраняются в вашем профиле.",
    settings_language: "Язык интерфейса", settings_theme: "Тема (Стиль сайта)",
    settings_compact: "Компактный режим", settings_compact_desc: "Уменьшить отступы интерфейса",
    settings_animations: "Анимации", settings_animations_desc: "Включить анимации интерфейса",
    settings_notifications: "Уведомления", settings_notifications_desc: "Email-уведомления о модерации",
    settings_default_sort: "Сортировка по умолчанию", settings_date_format: "Формат дат",
    settings_privacy: "Приватность", settings_show_profile: "Показывать профиль публично",
    settings_show_email: "Показывать email в профиле",
    settings_show_activity: "Показывать активность",
    settings_accessibility: "Доступность",
    settings_font_size: "Размер шрифта",
    settings_font_normal: "Обычный", settings_font_large: "Крупный", settings_font_xl: "Очень крупный",
    settings_high_contrast: "Повышенный контраст",
    settings_danger_zone: "Опасная зона",
    settings_clear_data: "Очистить просмотры",
    settings_clear_data_desc: "Очистить историю просмотренных модов и избранное.",
    settings_apply: "Применить", settings_cancel: "Отмена",
    // General
    downloads: "Скачиваний", follows: "Подписчиков",
    sort_downloads: "Скачивания", sort_follows: "Подписчики",
    sort_updated: "Обновлено", sort_name: "Название",
    date_relative: "Относительный", date_absolute: "Абсолютный",
    theme_dark: "Стандартная (Тёмная)", theme_light: "Светлая",
    theme_minimalism: "Минимализм", theme_liquid: "Ликуид"
  },
  en: {
    nav_home: "Home", nav_browse: "Browse", nav_create: "Add Mod",
    login: "Sign In", logout: "Sign Out", settings_saved: "Settings saved",
    sync_ok: "Synced", sync_pending: "Syncing...",
    // Admin panel
    admin_title: "ModSphere Control Panel",
    admin_subtitle: "Moderation, users, statistics, and platform settings.",
    admin_sync: "Synchronize", admin_export: "Export JSON", admin_import: "Import JSON",
    admin_approve_all: "Approve All", admin_tab_queue: "Queue", admin_tab_allmods: "All Mods",
    admin_tab_users: "Users", admin_tab_stats: "Statistics", admin_tab_settings: "Settings",
    admin_tab_logs: "Logs", admin_tab_reports: "Reports", admin_tab_notifications: "Notifications",
    admin_tab_security: "Security", admin_tab_tools: "Tools",
    admin_users_count: "Users", admin_projects_count: "Projects",
    admin_pending: "Pending", admin_downloads: "Downloads",
    admin_banned: "Banned", admin_new_week: "New this week",
    admin_queue_empty: "Queue is empty",
    admin_queue_empty_desc: "All uploaded projects have been reviewed and published.",
    admin_search_users: "Search by username, email or UID...",
    admin_search_mods: "Search mods by name, author...",
    admin_all_roles: "All roles", admin_find: "Find",
    admin_role_player: "Player", admin_role_moderator: "Moderator",
    admin_role_admin: "Administrator", admin_role_owner: "Owner",
    admin_approve: "Approve", admin_reject: "Reject",
    admin_no_access: "No access", admin_author: "Author",
    admin_top_authors: "Top Authors", admin_top_mods: "Top Mods",
    admin_by_types: "By Types", admin_no_data: "No data",
    admin_announcement: "Site Announcement", admin_maintenance: "Maintenance Mode",
    admin_save_settings: "Save Settings", admin_log_empty: "Log is empty.",
    admin_users_not_found: "Users not found.",
    admin_mods_not_found: "Mods not found.",
    admin_delete: "Delete", admin_ban: "Ban", admin_unban: "Unban",
    admin_reset_password: "Reset Password", admin_profile: "Profile",
    admin_featured: "★ Featured", admin_unfeatured: "Remove ★",
    admin_reports_empty: "No reports",
    admin_reports_empty_desc: "Users have not submitted any reports yet.",
    admin_send_notification: "Send Notification",
    admin_notif_title: "Title", admin_notif_message: "Message",
    admin_notif_type: "Type", admin_notif_send: "Send to all",
    admin_notif_history: "Notification History", admin_notif_empty: "No notifications sent.",
    admin_security: "Security & Protection",
    admin_ip_log: "Login History", admin_force_logout: "Force Logout All",
    admin_2fa: "Two-Factor Authentication",
    admin_tools: "Admin Tools",
    admin_clear_cache: "Clear Cache", admin_rebuild_index: "Rebuild Index",
    admin_export_users_csv: "Export Users CSV", admin_export_mods_csv: "Export Mods CSV",
    admin_database_size: "Database Size",
    admin_quick_actions: "Quick Actions",
    // Settings
    settings_title: "Site Settings",
    settings_subtitle: "Choose language and theme. Changes are saved to your profile.",
    settings_language: "Interface Language", settings_theme: "Theme (Site Style)",
    settings_compact: "Compact Mode", settings_compact_desc: "Reduce interface padding",
    settings_animations: "Animations", settings_animations_desc: "Enable interface animations",
    settings_notifications: "Notifications", settings_notifications_desc: "Email notifications about moderation",
    settings_default_sort: "Default Sort", settings_date_format: "Date Format",
    settings_privacy: "Privacy", settings_show_profile: "Show profile publicly",
    settings_show_email: "Show email in profile",
    settings_show_activity: "Show activity",
    settings_accessibility: "Accessibility",
    settings_font_size: "Font Size",
    settings_font_normal: "Normal", settings_font_large: "Large", settings_font_xl: "Extra Large",
    settings_high_contrast: "High Contrast",
    settings_danger_zone: "Danger Zone",
    settings_clear_data: "Clear browsing data",
    settings_clear_data_desc: "Clear recently viewed mods and favorites history.",
    settings_apply: "Apply", settings_cancel: "Cancel",
    // General
    downloads: "Downloads", follows: "Followers",
    sort_downloads: "Downloads", sort_follows: "Followers",
    sort_updated: "Updated", sort_name: "Name",
    date_relative: "Relative", date_absolute: "Absolute",
    theme_dark: "Default (Dark)", theme_light: "Light",
    theme_minimalism: "Minimalism", theme_liquid: "Liquid"
  }
};

function t(key) {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const lang = currentUser?.settings?.language || localStorage.getItem("language") || "ru";
  return (I18N[lang] && I18N[lang][key]) || I18N.ru[key] || key;
}

function applyUserSettings() {
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const settings = currentUser?.settings || {};
  document.body.classList.toggle("compact-mode", !!settings.compactMode);
  document.body.classList.toggle("no-animations", settings.animations === false);
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
  document.body.classList.remove("font-normal", "font-large", "font-xl");
  document.body.classList.add("font-" + (settings.fontSize || "normal"));
  applyI18nNav();
}

function applyI18nNav() {
  const map = [
    ["nav-home", "nav_home"], ["nav-browse", "nav_browse"], ["nav-create", "nav_create"],
    ["mobile-nav-home", "nav_home"], ["mobile-nav-browse", "nav_browse"], ["mobile-nav-create", "nav_create"]
  ];
  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector("i");
    const iconHtml = icon ? icon.outerHTML + " " : "";
    const text = t(key);
    if (el.classList.contains("mobile-nav-link")) {
      el.innerHTML = `${iconHtml}<span>${text}</span>`;
    } else {
      el.innerHTML = `${iconHtml}${text}`;
    }
  });
}

function updateSyncStatusIndicator() {
  const el = document.getElementById("sync-status-indicator");
  if (!el) return;
  el.title = lastSyncTime ? `${t("sync_ok")}: ${formatRelativeTime(lastSyncTime)}` : t("sync_pending");
  el.classList.toggle("synced", !!lastSyncTime);
}

function setupTheme() {
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  const savedTheme = currentUser?.settings?.theme || localStorage.getItem("theme") || "dark";
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;
  
  document.body.classList.remove("light-theme", "theme-minimalism", "theme-liquid");
  
  const icons = {
    light: '<i class="fa-solid fa-sun"></i>',
    minimalism: '<i class="fa-solid fa-border-all"></i>',
    liquid: '<i class="fa-solid fa-droplet"></i>',
    dark: '<i class="fa-solid fa-moon"></i>'
  };
  
  if (savedTheme === "light") document.body.classList.add("light-theme");
  else if (savedTheme === "minimalism") document.body.classList.add("theme-minimalism");
  else if (savedTheme === "liquid") document.body.classList.add("theme-liquid");
  
  themeToggle.innerHTML = icons[savedTheme] || icons.dark;
  themeToggle.title = savedTheme === "minimalism" ? "Минимализм" : savedTheme === "liquid" ? "Ликуид" : "Переключить тему";

  themeToggle.onclick = () => {
    window.location.hash = "#/settings";
  };
}

function setupRouting() {
  window.addEventListener("hashchange", handleRoute);
  // Explicitly run routing to handle initial page load (load event may have already fired)
  handleRoute();
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
    state.filters.favorites = params.favorites === "1";
    
    renderBrowse();
  } else if (path.startsWith("#/mod/")) {
    const slug = path.replace("#/mod/", "");
    const mods = getMods();
    const mod = mods.find(m => m.slug === slug || m.id === slug);
    if (mod && !mod.views) mod.views = 0;
    if (mod) { mod.views++; localStorage.setItem("mods_data", JSON.stringify(mods)); }
    if (mod) {
      state.selectedModId = mod.id;
      addRecentlyViewed(mod.id);
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
  } else if (path === "#/settings") {
    renderSettingsPage();
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

  // Settings header button
  const settingsHeaderBtn = document.getElementById("settings-header-btn");
  if (settingsHeaderBtn) {
    settingsHeaderBtn.addEventListener("click", () => {
      window.location.hash = "#/settings";
    });
  }

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
      <div class="mods-grid" id="trending-grid"></div>
    </section>

    <section id="recently-viewed-section" style="display:none; margin-top:48px;">
      <div class="section-header">
        <h2 class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Недавно просмотренные</h2>
      </div>
      <div class="mods-grid" id="recently-viewed-grid"></div>
    </section>
  `;

  // Render trending cards
  const trendingGrid = document.getElementById("trending-grid");
  const siteSettings = getSiteSettings();
  const featuredIds = siteSettings.featuredModIds || [];
  let displayMods = trendingMods;
  if (featuredIds.length > 0) {
    const featured = mods.filter(m => featuredIds.includes(m.id));
    if (featured.length > 0) displayMods = featured.slice(0, 6);
  }
  displayMods.forEach(mod => trendingGrid.appendChild(createModCard(mod)));

  const recentIds = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
  const recentMods = recentIds.map(id => mods.find(m => m.id === id)).filter(Boolean).slice(0, 4);
  if (recentMods.length > 0) {
    document.getElementById("recently-viewed-section").style.display = "block";
    const recentGrid = document.getElementById("recently-viewed-grid");
    recentMods.forEach(mod => recentGrid.appendChild(createModCard(mod)));
  }

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
        <h3 class="mod-card-title">${mod.name}${isModNew(mod) ? ' <span class="badge-new">NEW</span>' : ''}</h3>
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
          <div class="version-range-picker" style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
            <select class="form-input" id="filter-version-from" style="flex:1; min-width:90px; padding:6px 8px; font-size:12px;">
              <option value="">От версии</option>
              ${METADATA.gameVersions.map(v => `<option value="${v}">${v}</option>`).join("")}
            </select>
            <select class="form-input" id="filter-version-to" style="flex:1; min-width:90px; padding:6px 8px; font-size:12px;">
              <option value="">До версии</option>
              ${METADATA.gameVersions.map(v => `<option value="${v}">${v}</option>`).join("")}
            </select>
            <button type="button" class="btn btn-secondary btn-sm" id="filter-version-range-btn" style="white-space:nowrap;">Диапазон</button>
          </div>
          <input type="text" class="form-input" id="filter-version-search" placeholder="Поиск версии..." style="margin-bottom:8px; padding:6px 10px; font-size:12px;">
          <div class="filter-options filter-options-scroll" id="version-filter-options">
            ${METADATA.gameVersions.map(version => `
              <label class="filter-checkbox-label version-filter-item" data-version="${version}">
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

  const versionSearch = document.getElementById("filter-version-search");
  if (versionSearch) {
    versionSearch.addEventListener("input", () => {
      const q = versionSearch.value.trim().toLowerCase();
      document.querySelectorAll(".version-filter-item").forEach(item => {
        const ver = item.getAttribute("data-version") || "";
        item.style.display = !q || ver.includes(q) ? "" : "none";
      });
    });
  }

  const rangeBtn = document.getElementById("filter-version-range-btn");
  if (rangeBtn) {
    rangeBtn.addEventListener("click", () => {
      const from = document.getElementById("filter-version-from")?.value;
      const to = document.getElementById("filter-version-to")?.value;
      if (!from || !to) {
        showToast("Выберите начальную и конечную версию", "info");
        return;
      }
      const range = getVersionsInRange(from, to);
      state.filters.gameVersions = [...new Set([...state.filters.gameVersions, ...range])];
      syncGroupCheckbox(".version-cb", state.filters.gameVersions);
      updateBrowseHash();
    });
  }

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
    if (state.filters.favorites) {
      const followed = JSON.parse(localStorage.getItem("followed_mods") || "[]");
      if (!followed.includes(mod.id)) return false;
    }
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
  const modUrl = `${window.location.origin}${window.location.pathname}#/mod/${mod.slug || mod.id}`;
  const rating = getModRating(mod.id);
  const newBadge = isModNew(mod) ? '<span class="badge-new">NEW</span>' : '';

  container.innerHTML = `
    <nav class="breadcrumbs" aria-label="Навигация">
      <a href="#/">Главная</a> <span>/</span>
      <a href="#/browse">Обзор</a> <span>/</span>
      <span>${mod.name}</span>
    </nav>
    <button class="btn btn-secondary btn-sm back-nav-btn" onclick="history.back()" style="margin-bottom:12px;"><i class="fa-solid fa-arrow-left"></i> Назад</button>
    <!-- Header -->
    <div class="mod-detail-header">
      <div class="mod-detail-icon" style="background-color: ${mod.iconColor || '#10b981'}">
        ${renderAvatar(mod.avatar)}
      </div>
      <div class="mod-detail-meta">
        <div class="mod-detail-title-row">
          <h1 class="mod-detail-title">${mod.name} ${newBadge}</h1>
          <span class="result-badge-type">${METADATA.types[mod.type] || mod.type}</span>
        </div>
        <div class="mod-rating" id="mod-rating-stars" title="Оценка сообщества">
          ${renderStarRating(rating)}
        </div>
        <p class="mod-detail-author-tag">от разработчика <span class="author-link">${mod.author}</span>${getAuthorBadgeHTML(mod.author)}</p>
        <p class="mod-detail-desc">${mod.shortDescription}</p>
        
        <div class="mod-detail-actions">
          <button class="btn btn-primary" id="btn-main-download"><i class="fa-solid fa-download"></i> Скачать последний файл</button>
          <button class="btn btn-secondary ${followed ? 'active' : ''}" id="btn-follow-toggle">
            <i class="${followed ? 'fa-solid' : 'fa-regular'} fa-heart"></i> 
            <span id="follow-text">${followed ? 'Вы подписаны' : 'В избранное'}</span>
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-copy-link" title="Копировать ссылку"><i class="fa-solid fa-link"></i></button>
          <button class="btn btn-secondary btn-sm" id="btn-share-mod" title="Поделиться"><i class="fa-solid fa-share-nodes"></i></button>
          <button class="btn btn-secondary btn-sm" id="btn-print-mod" title="Печать"><i class="fa-solid fa-print"></i></button>
          <button class="btn btn-secondary btn-sm" id="btn-report-mod" title="Пожаловаться"><i class="fa-solid fa-flag"></i></button>
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
              <span class="metadata-label">Просмотры</span>
              <span class="metadata-value">${formatNumberFull(mod.views || 0)}</span>
            </div>
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

  document.getElementById("btn-copy-link")?.addEventListener("click", () => {
    copyTextToClipboard(modUrl);
    showToast("Ссылка скопирована в буфер обмена", "success");
  });

  document.getElementById("btn-share-mod")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: mod.name, text: mod.shortDescription, url: modUrl });
      } catch (_) {}
    } else {
      copyTextToClipboard(modUrl);
      showToast("Ссылка скопирована (Web Share недоступен)", "info");
    }
  });

  document.getElementById("btn-print-mod")?.addEventListener("click", () => window.print());

  document.getElementById("btn-report-mod")?.addEventListener("click", () => {
    logActivity("mod_report", mod.name);
    showToast("Жалоба отправлена модераторам. Спасибо!", "success");
  });

  document.getElementById("mod-rating-stars")?.addEventListener("click", (e) => {
    const star = e.target.closest("[data-star]");
    if (!star) return;
    const value = parseInt(star.getAttribute("data-star"), 10);
    setModRating(mod.id, value);
    document.getElementById("mod-rating-stars").innerHTML = renderStarRating(value);
    showToast(`Вы оценили мод на ${value}/5`, "success");
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
            <div class="version-range-picker" style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
              <select class="form-input" id="form-version-from" style="flex:1; min-width:120px; padding:8px;">
                <option value="">От версии</option>
                ${METADATA.gameVersions.map(v => `<option value="${v}">${v}</option>`).join("")}
              </select>
              <select class="form-input" id="form-version-to" style="flex:1; min-width:120px; padding:8px;">
                <option value="">До версии</option>
                ${METADATA.gameVersions.map(v => `<option value="${v}">${v}</option>`).join("")}
              </select>
              <button type="button" class="btn btn-secondary btn-sm" id="form-version-range-btn">Выбрать диапазон</button>
              <button type="button" class="btn btn-secondary btn-sm" id="form-version-clear-btn">Снять все</button>
            </div>
            <input type="text" class="form-input" id="form-version-search" placeholder="Поиск версии..." style="margin-bottom:8px;">
            <div class="form-checkbox-group form-checkbox-scroll" id="form-version-list">
              ${METADATA.gameVersions.map(v => `
                <label class="form-checkbox-label form-version-item" data-version="${v}">
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

  const formVersionSearch = document.getElementById("form-version-search");
  if (formVersionSearch) {
    formVersionSearch.addEventListener("input", () => {
      const q = formVersionSearch.value.trim().toLowerCase();
      document.querySelectorAll(".form-version-item").forEach(item => {
        item.style.display = !q || (item.getAttribute("data-version") || "").includes(q) ? "" : "none";
      });
    });
  }

  document.getElementById("form-version-range-btn")?.addEventListener("click", () => {
    const from = document.getElementById("form-version-from")?.value;
    const to = document.getElementById("form-version-to")?.value;
    if (!from || !to) {
      showToast("Выберите начальную и конечную версию", "info");
      return;
    }
    getVersionsInRange(from, to).forEach(v => {
      const cb = document.querySelector(`input[name="form-version"][value="${v}"]`);
      if (cb) cb.checked = true;
    });
    showToast(`Выбрано версий: ${getVersionsInRange(from, to).length}`, "success");
  });

  document.getElementById("form-version-clear-btn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="form-version"]').forEach(cb => { cb.checked = false; });
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
    logActivity("mod_create", newMod.name);
    showToast("Проект успешно создан и отправлен на модерацию!", "success");

    setTimeout(() => {
      window.location.hash = `#/mod/${slug}`;
    }, 800);
  });
}

function formatDate(dateString) {
  if (!dateString) return "Неизвестно";
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  if (currentUser?.settings?.dateFormat === "relative") {
    return formatRelativeTime(dateString);
  }
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

function formatRelativeTime(dateString) {
  if (!dateString) return "недавно";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн. назад`;
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isModNew(mod) {
  if (!mod.createdAt) return false;
  return (Date.now() - new Date(mod.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
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
        <button class="user-menu-item" id="user-menu-favorites"><i class="fa-solid fa-heart"></i> Избранные моды</button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" id="user-menu-profile"><i class="fa-solid fa-user-gear"></i> Настройки профиля</button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" id="user-menu-settings"><i class="fa-solid fa-gear"></i> Настройки сайта</button>
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

    document.getElementById("user-menu-favorites").addEventListener("click", () => {
      window.location.hash = "#/browse?favorites=1";
    });

    document.getElementById("user-menu-profile").addEventListener("click", () => {
      openProfileModal();
    });

    document.getElementById("user-menu-settings").addEventListener("click", () => { window.location.hash = "#/settings"; });

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
  
  restoreRegistrationFormHTML();
  
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const divider = document.querySelector(".auth-modal-card .auth-divider");
  if (tabLogin) tabLogin.style.display = "block";
  if (tabRegister) tabRegister.style.display = "block";
  if (divider) divider.style.display = "flex";
}

function setupAuthModalEvents() {
  const backdrop = document.getElementById("auth-modal-backdrop");
  const closeBtn = document.getElementById("auth-modal-close-btn");
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

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

    if (user.banned) {
      showToast("Ваш аккаунт заблокирован администрацией.", "error");
      return;
    }
    
    localStorage.setItem("current_user", JSON.stringify(user));
    setupTheme();
    applyUserSettings();
    window.logActivity("user_login", user.username);
    showToast(`Рады видеть вас снова, ${user.username}!`, "success");
    closeAuthModal();
    renderUserAuth();
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (document.getElementById("verification-code-input")) {
      return; // Handled by inline submit listener in showVerificationStep
    }
    handleRegisterFormSubmit(e);
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


function setupSettingsModalEvents() {
  const backdrop = document.getElementById("settings-modal-backdrop");
  const closeBtn = document.getElementById("settings-modal-close-btn");
  const cancelBtn = document.getElementById("btn-settings-close");
  const saveBtn = document.getElementById("btn-settings-save");
  const themeSelect = document.getElementById("settings-theme");
  const langSelect = document.getElementById("settings-language");
  const compactToggle = document.getElementById("settings-compact");
  const animToggle = document.getElementById("settings-animations");
  const notifyToggle = document.getElementById("settings-notifications");
  const defaultSort = document.getElementById("settings-default-sort");
  const dateFormat = document.getElementById("settings-date-format");
  const showProfileToggle = document.getElementById("settings-show-profile");
  const showEmailToggle = document.getElementById("settings-show-email");
  const showActivityToggle = document.getElementById("settings-show-activity");
  const fontSizeSelect = document.getElementById("settings-font-size");
  const highContrastToggle = document.getElementById("settings-high-contrast");
  const clearDataBtn = document.getElementById("btn-clear-browsing-data");
  const modal = document.getElementById("settings-modal");

  const closeSettings = () => modal.style.display = "none";
  const openSettings = () => {
    const currentUser = JSON.parse(localStorage.getItem("current_user"));
    const s = currentUser?.settings || {};
    themeSelect.value = s.theme || localStorage.getItem("theme") || "dark";
    langSelect.value = s.language || "ru";
    if (compactToggle) compactToggle.checked = !!s.compactMode;
    if (animToggle) animToggle.checked = s.animations !== false;
    if (notifyToggle) notifyToggle.checked = !!s.notifications;
    if (defaultSort) defaultSort.value = s.defaultSort || "downloads";
    if (dateFormat) dateFormat.value = s.dateFormat || "relative";
    if (showProfileToggle) showProfileToggle.checked = s.showProfile !== false;
    if (showEmailToggle) showEmailToggle.checked = !!s.showEmail;
    if (showActivityToggle) showActivityToggle.checked = s.showActivity !== false;
    if (fontSizeSelect) fontSizeSelect.value = s.fontSize || "normal";
    if (highContrastToggle) highContrastToggle.checked = !!s.highContrast;
    modal.style.display = "block";
  };

  if (backdrop) backdrop.addEventListener("click", closeSettings);
  if (closeBtn) closeBtn.addEventListener("click", closeSettings);
  if (cancelBtn) cancelBtn.addEventListener("click", closeSettings);

  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      localStorage.removeItem("recently_viewed");
      localStorage.removeItem("followed_mods");
      localStorage.removeItem("mod_ratings");
      showToast("История просмотров и избранное очищены", "success");
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("current_user"));
      const settingsPayload = {
        theme: themeSelect.value,
        language: langSelect.value,
        compactMode: compactToggle?.checked || false,
        animations: animToggle ? animToggle.checked : true,
        notifications: notifyToggle?.checked || false,
        defaultSort: defaultSort?.value || "downloads",
        dateFormat: dateFormat?.value || "relative",
        showProfile: showProfileToggle ? showProfileToggle.checked : true,
        showEmail: showEmailToggle?.checked || false,
        showActivity: showActivityToggle ? showActivityToggle.checked : true,
        fontSize: fontSizeSelect?.value || "normal",
        highContrast: highContrastToggle?.checked || false
      };
      if (currentUser) {
        currentUser.settings = { ...(currentUser.settings || {}), ...settingsPayload };
        touchUserUpdated(currentUser);
        localStorage.setItem("current_user", JSON.stringify(currentUser));
        const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const uIndex = users.findIndex(u => u.uid === currentUser.uid);
        if (uIndex > -1) {
          users[uIndex].settings = currentUser.settings;
          touchUserUpdated(users[uIndex]);
          localStorage.setItem("registered_users", JSON.stringify(users));
        }
      } else {
        localStorage.setItem("theme", settingsPayload.theme);
        localStorage.setItem("language", settingsPayload.language);
      }
      setupTheme();
      applyUserSettings();
      if (settingsPayload.defaultSort) state.filters.sort = settingsPayload.defaultSort;
      document.body.classList.toggle("high-contrast", !!settingsPayload.highContrast);
      document.body.classList.remove("font-normal", "font-large", "font-xl");
      document.body.classList.add("font-" + (settingsPayload.fontSize || "normal"));
      showToast(t("settings_saved"), "success");
      logActivity("settings_update", JSON.stringify(settingsPayload));
      closeSettings();
    });
  }

  window.openSettingsModal = openSettings;
}

function renderSettingsPage() {
  const container = document.getElementById("main-content");
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  const s = currentUser?.settings || {};

  container.innerHTML = `
    <div class="settings-page">
      <div class="settings-page-header">
        <h1><i class="fa-solid fa-sliders" style="color:var(--primary-color); margin-right:10px;"></i>Настройки</h1>
        <p>Язык, тема, приватность и доступность</p>
      </div>

      <div class="settings-page-grid">
        <div class="settings-page-section">
          <h3><i class="fa-solid fa-globe"></i> Язык интерфейса</h3>
          <select class="form-input" id="sp-lang">
            <option value="ru" ${(s.language || "ru") === "ru" ? "selected" : ""}>Русский</option>
            <option value="en" ${s.language === "en" ? "selected" : ""}>English</option>
          </select>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-palette"></i> Тема оформления</h3>
          <select class="form-input" id="sp-theme">
            <option value="dark" ${(s.theme || "dark") === "dark" ? "selected" : ""}>Стандартная (Тёмная)</option>
            <option value="light" ${s.theme === "light" ? "selected" : ""}>Светлая</option>
            <option value="minimalism" ${s.theme === "minimalism" ? "selected" : ""}>Минимализм</option>
            <option value="liquid" ${s.theme === "liquid" ? "selected" : ""}>Ликуид</option>
          </select>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-compress"></i> Компактный режим</h3>
          <label class="form-checkbox-label"><input type="checkbox" id="sp-compact" ${s.compactMode ? "checked" : ""}> Уменьшить отступы</label>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Анимации</h3>
          <label class="form-checkbox-label"><input type="checkbox" id="sp-anim" ${s.animations !== false ? "checked" : ""}> Включить анимации</label>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-bell"></i> Уведомления</h3>
          <label class="form-checkbox-label"><input type="checkbox" id="sp-notif" ${s.notifications ? "checked" : ""}> Email-уведомления о модерации</label>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-arrow-down-wide-short"></i> Сортировка по умолчанию</h3>
          <select class="form-input" id="sp-sort">
            <option value="downloads" ${(s.defaultSort || "downloads") === "downloads" ? "selected" : ""}>Скачивания</option>
            <option value="follows" ${s.defaultSort === "follows" ? "selected" : ""}>Подписчики</option>
            <option value="updated" ${s.defaultSort === "updated" ? "selected" : ""}>Обновлено</option>
            <option value="relevance" ${s.defaultSort === "relevance" ? "selected" : ""}>Название</option>
          </select>
        </div>

        <div class="settings-page-section">
          <h3><i class="fa-solid fa-clock"></i> Формат дат</h3>
          <select class="form-input" id="sp-datefmt">
            <option value="relative" ${(s.dateFormat || "relative") === "relative" ? "selected" : ""}>Относительный</option>
            <option value="absolute" ${s.dateFormat === "absolute" ? "selected" : ""}>Абсолютный</option>
          </select>
        </div>

        <div class="settings-page-section settings-page-section-full">
          <h3><i class="fa-solid fa-shield"></i> Приватность</h3>
          <div class="settings-page-checkboxes">
            <label class="form-checkbox-label"><input type="checkbox" id="sp-show-profile" ${s.showProfile !== false ? "checked" : ""}> Показывать профиль публично</label>
            <label class="form-checkbox-label"><input type="checkbox" id="sp-show-email" ${s.showEmail ? "checked" : ""}> Показывать email в профиле</label>
            <label class="form-checkbox-label"><input type="checkbox" id="sp-show-activity" ${s.showActivity !== false ? "checked" : ""}> Показывать активность</label>
          </div>
        </div>

        <div class="settings-page-section settings-page-section-full">
          <h3><i class="fa-solid fa-universal-access"></i> Доступность</h3>
          <div class="settings-page-inline">
            <label class="form-label" style="font-size:13px;">Размер шрифта</label>
            <select class="form-input" id="sp-fontsize" style="width:200px;">
              <option value="normal" ${(s.fontSize || "normal") === "normal" ? "selected" : ""}>Обычный</option>
              <option value="large" ${s.fontSize === "large" ? "selected" : ""}>Крупный</option>
              <option value="xl" ${s.fontSize === "xl" ? "selected" : ""}>Очень крупный</option>
            </select>
          </div>
          <label class="form-checkbox-label" style="margin-top:8px;"><input type="checkbox" id="sp-contrast" ${s.highContrast ? "checked" : ""}> Повышенный контраст</label>
        </div>

        <div class="settings-page-section settings-page-section-full settings-page-danger">
          <h3 style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Опасная зона</h3>
          <p style="color:var(--text-secondary); font-size:13px; margin-bottom:12px;">Очистить историю просмотров и избранное.</p>
          <button class="btn btn-danger btn-sm" id="sp-clear-data"><i class="fa-solid fa-eraser"></i> Очистить просмотры</button>
        </div>
      </div>

      <div class="settings-page-actions">
        <button class="btn btn-secondary" onclick="window.location.hash='#/'"><i class="fa-solid fa-xmark"></i> Отмена</button>
        <button class="btn btn-primary" id="sp-save-btn"><i class="fa-solid fa-check"></i> Сохранить настройки</button>
      </div>
    </div>
  `;

  // Wire up clear data
  document.getElementById("sp-clear-data")?.addEventListener("click", () => {
    localStorage.removeItem("recently_viewed");
    localStorage.removeItem("followed_mods");
    localStorage.removeItem("mod_ratings");
    showToast("История просмотров и избранное очищены", "success");
  });

  // Wire up save
  document.getElementById("sp-save-btn")?.addEventListener("click", () => {
    const payload = {
      theme: document.getElementById("sp-theme").value,
      language: document.getElementById("sp-lang").value,
      compactMode: document.getElementById("sp-compact").checked,
      animations: document.getElementById("sp-anim").checked,
      notifications: document.getElementById("sp-notif").checked,
      defaultSort: document.getElementById("sp-sort").value,
      dateFormat: document.getElementById("sp-datefmt").value,
      showProfile: document.getElementById("sp-show-profile").checked,
      showEmail: document.getElementById("sp-show-email").checked,
      showActivity: document.getElementById("sp-show-activity").checked,
      fontSize: document.getElementById("sp-fontsize").value,
      highContrast: document.getElementById("sp-contrast").checked
    };

    if (currentUser) {
      currentUser.settings = { ...(currentUser.settings || {}), ...payload };
      touchUserUpdated(currentUser);
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
      const idx = users.findIndex(u => u.uid === currentUser.uid);
      if (idx > -1) {
        users[idx].settings = currentUser.settings;
        touchUserUpdated(users[idx]);
        localStorage.setItem("registered_users", JSON.stringify(users));
      }
    } else {
      localStorage.setItem("theme", payload.theme);
      localStorage.setItem("language", payload.language);
    }

    setupTheme();
    applyUserSettings();
    if (payload.defaultSort) state.filters.sort = payload.defaultSort;
    logActivity("settings_update", JSON.stringify(payload));
    showToast("Настройки сохранены", "success");
  });
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
    const trending = [...mods].filter(m => m.approved).sort((a, b) => b.downloads - a.downloads).slice(0, 3);
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
    (mod.approved) && (
      mod.name.toLowerCase().includes(queryLC) ||
      mod.shortDescription.toLowerCase().includes(queryLC) ||
      mod.author.toLowerCase().includes(queryLC)
    )
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
function renderAdminPanel(activeTab = "mods", searchQuery = "", modSearchQuery = "", roleFilter = "") {
  const container = document.getElementById("main-content");
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const mods = getMods();
  const pendingMods = mods.filter(m => !m.approved);
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  const siteSettings = getSiteSettings();
  const activityLog = JSON.parse(localStorage.getItem("activity_log") || "[]");
  
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER")) {
    window.location.hash = "#/";
    return;
  }

  let filteredUsers = users;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(u =>
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.uid || "").includes(q)
    );
  }
  if (roleFilter) {
    filteredUsers = filteredUsers.filter(u => (u.role || "PLAYER").toUpperCase() === roleFilter.toUpperCase());
  }

  let filteredModsList = mods;
  if (modSearchQuery) {
    const q = modSearchQuery.toLowerCase();
    filteredModsList = mods.filter(m =>
      m.name.toLowerCase().includes(q) || m.author.toLowerCase().includes(q) || (m.id || "").includes(q)
    );
  }

  const featuredIds = siteSettings.featuredModIds || [];
  const totalDownloads = mods.reduce((sum, m) => sum + (m.downloads || 0), 0);
  const bannedCount = users.filter(u => u.banned).length;
  const newUsersWeek = users.filter(u => u.updatedAt && (Date.now() - new Date(u.updatedAt).getTime()) < 7 * 86400000).length;
  
  container.innerHTML = `
    <div class="admin-panel-container">
      <div class="admin-panel-header">
        <h2><i class="fa-solid fa-crown" style="color: var(--primary-color); margin-right: 8px;"></i>Панель управления ModSphere</h2>
        <p>Модерация, пользователи, статистика и настройки платформы.</p>
        <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="syncPull(false).then(() => showToast('Данные синхронизированы', 'success'))"><i class="fa-solid fa-rotate"></i> Синхронизировать</button>
          <button class="btn btn-secondary btn-sm" onclick="exportAdminData()"><i class="fa-solid fa-file-export"></i> Экспорт JSON</button>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('admin-import-file').click()"><i class="fa-solid fa-file-import"></i> Импорт JSON</button>
          <input type="file" id="admin-import-file" accept="application/json" style="display:none" onchange="importAdminData(event)">
          ${pendingMods.length > 0 ? `<button class="btn btn-primary btn-sm" onclick="bulkApproveMods()"><i class="fa-solid fa-check-double"></i> Одобрить все (${pendingMods.length})</button>` : ''}
        </div>
      </div>
      
      <div class="admin-dashboard-stats" style="display:flex; gap:16px; margin-bottom: 24px; flex-wrap:wrap;">
        <div class="admin-stat-card"><div class="admin-stat-num">${users.length}</div><div class="admin-stat-label">Пользователей</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${mods.length}</div><div class="admin-stat-label">Проектов</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${pendingMods.length}</div><div class="admin-stat-label">На модерации</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${formatNumberFull(totalDownloads)}</div><div class="admin-stat-label">Скачиваний</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${bannedCount}</div><div class="admin-stat-label">Заблокировано</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${newUsersWeek}</div><div class="admin-stat-label">Новых за неделю</div></div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab-btn ${activeTab === 'mods' ? 'active' : ''}" onclick="renderAdminPanel('mods')"><i class="fa-solid fa-file-shield"></i> Очередь (${pendingMods.length})</button>
        <button class="admin-tab-btn ${activeTab === 'allmods' ? 'active' : ''}" onclick="renderAdminPanel('allmods')"><i class="fa-solid fa-cubes"></i> Все моды (${mods.length})</button>
        <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" onclick="renderAdminPanel('users')"><i class="fa-solid fa-users-gear"></i> Пользователи (${users.length})</button>
        <button class="admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}" onclick="renderAdminPanel('stats')"><i class="fa-solid fa-chart-line"></i> Статистика</button>
        <button class="admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}" onclick="renderAdminPanel('settings')"><i class="fa-solid fa-sliders"></i> Настройки</button>
        <button class="admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}" onclick="renderAdminPanel('logs')"><i class="fa-solid fa-list"></i> Журнал</button>
        <button class="admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}" onclick="renderAdminPanel('reports')"><i class="fa-solid fa-flag"></i> Жалобы</button>
        <button class="admin-tab-btn ${activeTab === 'notifications' ? 'active' : ''}" onclick="renderAdminPanel('notifications')"><i class="fa-solid fa-bell"></i> Уведомления</button>
        <button class="admin-tab-btn ${activeTab === 'security' ? 'active' : ''}" onclick="renderAdminPanel('security')"><i class="fa-solid fa-shield"></i> Безопасность</button>
        <button class="admin-tab-btn ${activeTab === 'tools' ? 'active' : ''}" onclick="renderAdminPanel('tools')"><i class="fa-solid fa-screwdriver-wrench"></i> Инструменты</button>
        <button class="admin-tab-btn ${activeTab === 'system' ? 'active' : ''}" onclick="renderAdminPanel('system')"><i class="fa-solid fa-server"></i> Система</button>
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
                      <p class="admin-pending-author">Автор: <strong class="author-link">${mod.author}</strong></p>
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
                      <button class="btn btn-secondary btn-sm" onclick="triggerVersionDownload(getMods().find(m=>m.id==='${mod.id}'), getMods().find(m=>m.id==='${mod.id}').versions[0])" title="Скачать файл для проверки">
                        <i class="fa-solid fa-download"></i>
                      </button>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" onclick="approvePendingMod('${mod.id}')">
                      <i class="fa-solid fa-check"></i> Одобрить
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectPendingMod('${mod.id}')">
                      <i class="fa-solid fa-xmark"></i> Отклонить
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- All Mods Tab Content -->
      <div class="admin-tab-content ${activeTab === 'allmods' ? 'active' : ''}" style="display: ${activeTab === 'allmods' ? 'block' : 'none'};">
        <div style="margin-bottom: 16px; display:flex; gap:8px;">
          <input type="text" id="admin-mod-search" class="form-input" placeholder="Поиск модов по названию, автору..." value="${modSearchQuery}" style="flex:1;">
          <button class="btn btn-primary" onclick="renderAdminPanel('allmods', '', document.getElementById('admin-mod-search').value)"><i class="fa-solid fa-search"></i></button>
        </div>
        <div class="admin-users-list" style="margin-top:16px;">
          ${filteredModsList.map(mod => `
            <div class="admin-user-item">
              <div class="admin-user-info" style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; border-radius:8px; overflow:hidden;">${renderAvatar(mod.avatar)}</div>
                <div>
                  <div style="font-weight:700;">${mod.name} ${mod.approved ? '<i class="fa-solid fa-check-circle" style="color:var(--primary-color); font-size:12px;"></i>' : '<i class="fa-solid fa-clock" style="color:#f59e0b; font-size:12px;"></i>'} ${featuredIds.includes(mod.id) ? '<span class="badge-featured">★</span>' : ''}</div>
                  <div style="font-size:12px; color:var(--text-secondary);">Автор: <span class="author-link" style="font-weight:600;">${mod.author}</span>${getAuthorBadgeHTML(mod.author)} | Скачиваний: ${mod.downloads || 0}</div>
                </div>
              </div>
              <div class="admin-user-actions">
                <button class="btn btn-secondary btn-sm" onclick="toggleFeaturedMod('${mod.id}')" title="В избранное на главной">${featuredIds.includes(mod.id) ? 'Убрать ★' : '★ На главную'}</button>
                ${!mod.approved ? `<button class="btn btn-primary btn-sm" onclick="approvePendingMod('${mod.id}')">Одобрить</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteModAdmin('${mod.id}')">Удалить</button>
              </div>
            </div>
          `).join('')}
          ${filteredModsList.length === 0 ? '<div style="text-align:center; padding:20px; color:var(--text-muted);">Моды не найдены.</div>' : ''}
        </div>
      </div>

      <!-- Users Management Tab Content -->
      <div class="admin-tab-content ${activeTab === 'users' ? 'active' : ''}" id="admin-content-users" style="display: ${activeTab === 'users' ? 'block' : 'none'};">
        <div style="margin-bottom: 16px; display:flex; gap:8px; flex-wrap:wrap;">
            <input type="text" id="admin-user-search" class="form-input" placeholder="Поиск по никнейму, email или UID..." value="${searchQuery}" style="flex:1; min-width:200px;">
            <select id="admin-user-role-filter" class="form-input" style="width:140px; padding:8px;" onchange="renderAdminPanel('users', document.getElementById('admin-user-search').value, '', this.value)">
              <option value="">Все роли</option>
              <option value="PLAYER" ${roleFilter === 'PLAYER' ? 'selected' : ''}>PLAYER</option>
              <option value="ADMIN" ${roleFilter === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
              <option value="OWNER" ${roleFilter === 'OWNER' ? 'selected' : ''}>OWNER</option>
              <option value="MODERATOR" ${roleFilter === 'MODERATOR' ? 'selected' : ''}>MODERATOR</option>
            </select>
            <button class="btn btn-primary" onclick="renderAdminPanel('users', document.getElementById('admin-user-search').value, '', document.getElementById('admin-user-role-filter').value)"><i class="fa-solid fa-search"></i> Найти</button>
        </div>
        <div class="admin-users-list">
          ${filteredUsers.map(u => `
            <div class="admin-user-item ${u.banned ? 'banned' : ''}" style="${u.banned ? 'opacity:0.6;' : ''}">
              <div class="admin-user-avatar">
                <img src="${u.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + u.username}" alt="Avatar">
              </div>
              <div class="admin-user-info">
                <div class="admin-user-name">${u.username} ${getRoleBadgeHTML(u.role)} ${u.banned ? '<span class="badge-banned">ЗАБЛОКИРОВАН</span>' : ''}</div>
                <div class="admin-user-email">${u.email} &bull; <span style="font-family:monospace; color:var(--text-muted);">UID: ${u.uid}</span> &bull; ${u.updatedAt ? formatRelativeTime(u.updatedAt) : '—'}</div>
              </div>
              <div class="admin-user-actions">
                <button class="btn btn-secondary btn-sm" onclick="openPublicProfileModal('${u.username.replace(/'/g, "\\'")}')" title="Профиль"><i class="fa-solid fa-eye"></i></button>
                ${currentUser.role === 'OWNER' || (currentUser.role === 'ADMIN' && u.role !== 'OWNER' && u.uid !== currentUser.uid) ? `
                  <select class="form-input" style="padding: 4px 8px; font-size: 12px; width: 120px;" onchange="changeUserRole('${u.uid}', this.value)">
                    <option value="PLAYER" ${(u.role === 'PLAYER' || u.role === 'USER') ? 'selected' : ''}>Игрок</option>
                    <option value="MODERATOR" ${u.role === 'MODERATOR' ? 'selected' : ''}>Модератор</option>
                    <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Администратор</option>
                    ${currentUser.role === 'OWNER' ? `<option value="OWNER" ${u.role === 'OWNER' ? 'selected' : ''}>Владелец</option>` : ''}
                  </select>
                  <button class="btn btn-${u.banned ? 'primary' : 'danger'} btn-sm" onclick="toggleUserBan('${u.uid}')" title="${u.banned ? 'Разблокировать' : 'Заблокировать'}">
                    <i class="fa-solid ${u.banned ? 'fa-unlock' : 'fa-ban'}"></i>
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="resetUserPassword('${u.uid}')" title="Сброс пароля"><i class="fa-solid fa-key"></i></button>
                  <button class="btn btn-secondary btn-sm" onclick="deleteUserAdmin('${u.uid}')" title="Удалить"><i class="fa-solid fa-trash"></i></button>
                ` : `<span style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-lock"></i> Нет доступа</span>`}
              </div>
            </div>
          `).join("")}
          ${filteredUsers.length === 0 ? '<div style="text-align:center; padding:20px; color:var(--text-muted);">Пользователи не найдены.</div>' : ''}
        </div>
      </div>

      <div class="admin-tab-content ${activeTab === 'stats' ? 'active' : ''}" style="display: ${activeTab === 'stats' ? 'block' : 'none'};">
        <div class="admin-stats-grid">
          <div class="admin-stats-block"><h4>Топ авторов</h4>${getTopAuthors(mods).map(a => `<div class="admin-stats-row"><span>${a.name}</span><strong>${a.count} проектов</strong></div>`).join('') || '<p class="text-muted">Нет данных</p>'}</div>
          <div class="admin-stats-block"><h4>Топ модов</h4>${[...mods].sort((a,b) => b.downloads - a.downloads).slice(0,5).map(m => `<div class="admin-stats-row"><span>${m.name}</span><strong>${formatNumber(m.downloads)}</strong></div>`).join('')}</div>
          <div class="admin-stats-block"><h4>По типам</h4>${Object.entries(countByField(mods, 'type')).map(([k,v]) => `<div class="admin-stats-row"><span>${METADATA.types[k] || k}</span><strong>${v}</strong></div>`).join('')}</div>
        </div>
      </div>

      <div class="admin-tab-content ${activeTab === 'settings' ? 'active' : ''}" style="display: ${activeTab === 'settings' ? 'block' : 'none'};">
        <div class="admin-settings-form">
          <div class="form-group"><label class="form-label">Объявление на сайте</label>
            <textarea id="admin-announcement" class="form-textarea" placeholder="Текст баннера для всех пользователей...">${siteSettings.announcement || ''}</textarea>
          </div>
          <div class="form-group"><label class="form-label"><input type="checkbox" id="admin-maintenance" ${siteSettings.maintenance ? 'checked' : ''}> Режим обслуживания</label></div>
          <button class="btn btn-primary" onclick="saveAdminSiteSettings()"><i class="fa-solid fa-save"></i> Сохранить настройки</button>
        </div>
      </div>

      <div class="admin-tab-content ${activeTab === 'logs' ? 'active' : ''}" style="display: ${activeTab === 'logs' ? 'block' : 'none'};">
        <div class="admin-log-list">
          ${activityLog.slice(0, 50).map(entry => `
            <div class="admin-log-item">
              <span class="admin-log-time">${formatRelativeTime(entry.time)}</span>
              <strong>${entry.user}</strong> — ${entry.action}${entry.details ? `: ${entry.details}` : ''}
            </div>
          `).join('') || '<p style="color:var(--text-muted);">Журнал пуст.</p>'}
        </div>
      </div>

      <!-- Reports Tab -->
      <div class="admin-tab-content ${activeTab === 'reports' ? 'active' : ''}" style="display: ${activeTab === 'reports' ? 'block' : 'none'};">
        ${renderAdminReportsTab(users)}
      </div>

      <!-- Notifications Tab -->
      <div class="admin-tab-content ${activeTab === 'notifications' ? 'active' : ''}" style="display: ${activeTab === 'notifications' ? 'block' : 'none'};">
        ${renderAdminNotificationsTab()}
      </div>

      <!-- Security Tab -->
      <div class="admin-tab-content ${activeTab === 'security' ? 'active' : ''}" style="display: ${activeTab === 'security' ? 'block' : 'none'};">
        ${renderAdminSecurityTab()}
      </div>

      <!-- Tools Tab -->
      <div class="admin-tab-content ${activeTab === 'tools' ? 'active' : ''}" style="display: ${activeTab === 'tools' ? 'block' : 'none'};">
        ${renderAdminToolsTab(users)}
      </div>

      <!-- System Info Tab -->
      <div class="admin-tab-content ${activeTab === 'system' ? 'active' : ''}" style="display: ${activeTab === 'system' ? 'block' : 'none'};">
        ${renderAdminSystemTab(users, mods)}
      </div>
    </div>
  `;

  const userSearchInput = document.getElementById("admin-user-search");
  if (userSearchInput) {
    userSearchInput.addEventListener("input", () => {
      clearTimeout(window.adminSearchDebounce);
      window.adminSearchDebounce = setTimeout(() => {
        renderAdminPanel("users", userSearchInput.value, "", document.getElementById("admin-user-role-filter")?.value || "");
      }, 350);
    });
  }

  const modSearchInput = document.getElementById("admin-mod-search");
  if (modSearchInput) {
    modSearchInput.addEventListener("input", () => {
      clearTimeout(window.adminModSearchDebounce);
      window.adminModSearchDebounce = setTimeout(() => {
        renderAdminPanel("allmods", "", modSearchInput.value);
      }, 350);
    });
  }
}

function getTopAuthors(mods) {
  const counts = {};
  mods.forEach(m => { counts[m.author] = (counts[m.author] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
}

function countByField(items, field) {
  const counts = {};
  items.forEach(i => { const k = i[field] || "unknown"; counts[k] = (counts[k] || 0) + 1; });
  return counts;
}

window.exportAdminData = function() {
  const data = {
    mods: getMods(),
    users: JSON.parse(localStorage.getItem("registered_users") || "[]"),
    siteSettings: getSiteSettings(),
    activityLog: JSON.parse(localStorage.getItem("activity_log") || "[]"),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `modsphere-backup-${Date.now()}.json`;
  a.click();
  logActivity("admin_export", "database backup");
};

window.importAdminData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.mods) localStorage.setItem("mods_data", JSON.stringify(data.mods));
      if (data.users) localStorage.setItem("registered_users", JSON.stringify(data.users));
      if (data.siteSettings) saveSiteSettings(data.siteSettings);
      if (data.activityLog) localStorage.setItem("activity_log", JSON.stringify(data.activityLog));
      logActivity("admin_import", file.name);
      showToast("Данные успешно импортированы", "success");
      renderAdminPanel("settings");
    } catch (_) {
      showToast("Ошибка чтения JSON файла", "error");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
};

window.bulkApproveMods = function() {
  const mods = getMods();
  let count = 0;
  mods.forEach(m => { if (!m.approved) { m.approved = true; m.updatedAt = new Date().toISOString(); count++; } });
  localStorage.setItem("mods_data", JSON.stringify(mods));
  logActivity("bulk_approve", `${count} mods`);
  showToast(`Одобрено проектов: ${count}`, "success");
  renderAdminPanel("mods");
};

window.toggleFeaturedMod = function(modId) {
  const settings = getSiteSettings();
  const ids = settings.featuredModIds || [];
  const idx = ids.indexOf(modId);
  if (idx === -1) ids.push(modId); else ids.splice(idx, 1);
  saveSiteSettings({ featuredModIds: ids });
  logActivity("featured_toggle", modId);
  renderAdminPanel("allmods", "", document.getElementById("admin-mod-search")?.value || "");
};

window.resetUserPassword = function(uid) {
  const newPass = prompt("Введите новый пароль для пользователя (мин. 6 символов):");
  if (!newPass || newPass.length < 6) return;
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const u = users.find(x => x.uid === uid);
  if (u) {
    u.password = newPass;
    touchUserUpdated(u);
    localStorage.setItem("registered_users", JSON.stringify(users));
    logActivity("password_reset", u.username);
    showToast(`Пароль для ${u.username} обновлён`, "success");
  }
};

window.saveAdminSiteSettings = function() {
  saveSiteSettings({
    announcement: document.getElementById("admin-announcement")?.value.trim() || "",
    maintenance: document.getElementById("admin-maintenance")?.checked || false
  });
  logActivity("site_settings_update");
  showToast("Настройки сайта сохранены", "success");
};

window.deleteModAdmin = function(modId) {
    if(confirm("Вы уверены, что хотите удалить этот мод?")) {
        let mods = getMods();
        mods = mods.filter(m => m.id !== modId);
        localStorage.setItem("mods_data", JSON.stringify(mods));
        showToast("Мод удален", "success");
        renderAdminPanel('allmods');
    }
};

window.toggleUserBan = function(uid) {
    let users = JSON.parse(localStorage.getItem("registered_users") || "[]");
    let u = users.find(x => x.uid === uid);
    if(u) {
        u.banned = !u.banned;
        localStorage.setItem("registered_users", JSON.stringify(users));
        showToast(u.banned ? "Пользователь заблокирован" : "Пользователь разблокирован", "success");
        renderAdminPanel('users', document.getElementById('admin-user-search')?.value || '');
    }
};

window.deleteUserAdmin = function(uid) {
    if(confirm("Вы уверены, что хотите полностью удалить пользователя?")) {
        let users = JSON.parse(localStorage.getItem("registered_users") || "[]");
        users = users.filter(x => x.uid !== uid);
        localStorage.setItem("registered_users", JSON.stringify(users));
        showToast("Пользователь удален", "success");
        renderAdminPanel('users', document.getElementById('admin-user-search')?.value || '');
    }
};


window.approvePendingMod = function(modId) {
  const currentMods = getMods();
  const mod = currentMods.find(m => m.id === modId);
  if (mod) {
    mod.approved = true;
    mod.updatedAt = new Date().toISOString();
    localStorage.setItem("mods_data", JSON.stringify(currentMods));
    logActivity("mod_approve", mod.name);
    showToast(`Проект "${mod.name}" успешно одобрен и опубликован!`, "success");
    renderAdminPanel();
  }
}

window.rejectPendingMod = function(modId) {
  let currentMods = getMods();
  const mod = currentMods.find(m => m.id === modId);
  if (mod) {
    currentMods = currentMods.filter(m => m.id !== modId);
    localStorage.setItem("mods_data", JSON.stringify(currentMods));
    showToast(`Проект "${mod.name}" отклонен и удален.`, "info");
    renderAdminPanel();
  }
}

window.changeUserRole = function(uid, newRole) {
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

// --- NEW ADMIN TAB RENDERERS ---

function renderAdminReportsTab(users) {
  const reports = JSON.parse(localStorage.getItem("mod_reports") || "[]");
  if (reports.length === 0) {
    return `
      <div class="no-results" style="padding: 48px 20px;">
        <i class="fa-solid fa-flag" style="font-size: 48px; color: var(--primary-color);"></i>
        <h3>Жалоб нет</h3>
        <p>Пользователи пока не отправляли жалобы.</p>
      </div>
    `;
  }
  return `
    <div style="margin-bottom:12px;">
      <button class="btn btn-danger btn-sm" onclick="clearAllReports()"><i class="fa-solid fa-trash"></i> Очистить все жалобы</button>
    </div>
    <div class="admin-log-list">
      ${reports.map((r, i) => `
        <div class="admin-log-item">
          <span class="admin-log-time">${formatRelativeTime(r.time)}</span>
          <strong>${r.user}</strong> — ${r.action}${r.details ? `: ${r.details}` : ''}
          <button class="btn btn-danger btn-sm" style="margin-left:8px;" onclick="dismissReport(${i})"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAdminNotificationsTab() {
  const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
  return `
    <div class="admin-settings-form">
      <h4 style="margin-bottom:16px;">Отправить уведомление всем пользователям</h4>
      <div class="form-group">
        <label class="form-label">Заголовок</label>
        <input type="text" id="admin-notif-title" class="form-input" placeholder="Важное объявление">
      </div>
      <div class="form-group">
        <label class="form-label">Сообщение</label>
        <textarea id="admin-notif-message" class="form-textarea" placeholder="Текст уведомления..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Тип</label>
        <select id="admin-notif-type" class="form-input" style="width:200px;">
          <option value="info">Информация</option>
          <option value="warning">Предупреждение</option>
          <option value="success">Успех</option>
          <option value="error">Ошибка</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="sendAdminNotification()"><i class="fa-solid fa-paper-plane"></i> Отправить всем</button>
    </div>
    <div style="margin-top:24px;">
      <h4 style="margin-bottom:12px;">История уведомлений</h4>
      <div class="admin-log-list">
        ${notifications.length === 0 ? '<p style="color:var(--text-muted);">Уведомления не отправлялись.</p>' :
          notifications.map(n => `
            <div class="admin-log-item">
              <span class="admin-log-time">${formatRelativeTime(n.time)}</span>
              <strong>${n.title}</strong> — ${n.message} <span class="result-tag" style="background:rgba(16,185,129,0.08);color:var(--primary-color);">${n.type}</span>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function renderAdminSecurityTab() {
  const loginLog = JSON.parse(localStorage.getItem("login_history") || "[]");
  return `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-shield"></i> Безопасность и защита</h4>
        <p style="color:var(--text-secondary); font-size:13px; margin:12px 0;">Управление безопасностью платформы.</p>
        <button class="btn btn-secondary btn-sm" onclick="forceLogoutAllUsers()"><i class="fa-solid fa-right-from-bracket"></i> Выход всех пользователей</button>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-lock"></i> Двухфакторная аутентификация</h4>
        <p style="color:var(--text-secondary); font-size:13px; margin:12px 0;">2FA пока в разработке.</p>
        <button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-qrcode"></i> Настроить 2FA</button>
      </div>
    </div>
    <div class="admin-settings-form">
      <h4 style="margin-bottom:12px;">Журнал входов</h4>
      <div class="admin-log-list">
        ${loginLog.length === 0 ? '<p style="color:var(--text-muted);">История входов пуста.</p>' :
          loginLog.slice(0, 30).map(entry => `
            <div class="admin-log-item">
              <span class="admin-log-time">${formatRelativeTime(entry.time)}</span>
              <strong>${entry.username}</strong> — ${entry.action} (${entry.ip || 'IP не сохранён'})
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function renderAdminToolsTab(users) {
  const dbSize = new Blob([JSON.stringify({
    mods: getMods(),
    users: users,
    activityLog: JSON.parse(localStorage.getItem("activity_log") || "[]")
  })]).size;
  const dbSizeFormatted = dbSize > 1024 * 1024
    ? (dbSize / (1024 * 1024)).toFixed(2) + ' MB'
    : dbSize > 1024
      ? (dbSize / 1024).toFixed(1) + ' KB'
      : dbSize + ' B';
  return `
    <div class="admin-stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-database"></i> База данных</h4>
        <p style="font-size:24px; font-weight:700; color:var(--primary-color); margin:12px 0;">${dbSizeFormatted}</p>
        <p style="font-size:13px; color:var(--text-secondary);">Текущий размер хранилища</p>
        <div style="display:flex; gap:8px; margin-top:16px; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="clearLocalCache()"><i class="fa-solid fa-broom"></i> Очистить кеш</button>
          <button class="btn btn-secondary btn-sm" onclick="rebuildSearchIndex()"><i class="fa-solid fa-arrows-rotate"></i> Пересобрать индекс</button>
        </div>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-file-export"></i> Экспорт данных</h4>
        <p style="font-size:13px; color:var(--text-secondary); margin:12px 0;">Выгрузить данные в различных форматах.</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="exportUsersCSV()"><i class="fa-solid fa-table"></i> Экспорт юзеров CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="exportModsCSV()"><i class="fa-solid fa-table"></i> Экспорт модов CSV</button>
        </div>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-bolt"></i> Быстрые действия</h4>
        <p style="font-size:13px; color:var(--text-secondary); margin:12px 0;">Часто используемые операции.</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="bulkApproveMods()"><i class="fa-solid fa-check-double"></i> Одобрить все</button>
          <button class="btn btn-secondary btn-sm" onclick="syncPull(false).then(() => showToast('Синхронизировано', 'success'))"><i class="fa-solid fa-cloud"></i> Синхр.</button>
          <button class="btn btn-secondary btn-sm" onclick="if(confirm('Удалить все неодобренные моды?')){ rejectAllPending() }"><i class="fa-solid fa-trash"></i> Очистить очередь</button>
        </div>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-flag"></i> Забаненные пользователи</h4>
        <p style="font-size:24px; font-weight:700; color:#ef4444; margin:12px 0;">${users.filter(u => u.banned).length}</p>
        <p style="font-size:13px; color:var(--text-secondary);">Пользователей в бане</p>
        <button class="btn btn-secondary btn-sm" onclick="renderAdminPanel('users')"><i class="fa-solid fa-eye"></i> Просмотреть</button>
      </div>
    </div>
  `;
}

function renderAdminSystemTab(users, mods) {
  const totalStorage = estimateStorageUsage();
  const userAgents = JSON.parse(localStorage.getItem("user_agents") || "[]");
  return `
    <div class="admin-stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-microchip"></i> Информация о системе</h4>
        <div class="admin-stats-row"><span>Версия платформы</span><strong>ModSphere v2.0</strong></div>
        <div class="admin-stats-row"><span>Тип хранилища</span><strong>localStorage + Серверная синхронизация</strong></div>
        <div class="admin-stats-row"><span>Браузер</span><strong>${navigator.userAgent.substring(0, 80)}</strong></div>
        <div class="admin-stats-row"><span>Язык браузера</span><strong>${navigator.language}</strong></div>
        <div class="admin-stats-row"><span>Онлайн-режим</span><strong>${navigator.onLine ? 'Да' : 'Нет'}</strong></div>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-database"></i> Использование хранилища</h4>
        <div class="admin-stats-row"><span>Модов в БД</span><strong>${mods.length}</strong></div>
        <div class="admin-stats-row"><span>Пользователей</span><strong>${users.length}</strong></div>
        <div class="admin-stats-row"><span>Всего записей в журнале</span><strong>${JSON.parse(localStorage.getItem("activity_log") || "[]").length}</strong></div>
        <div class="admin-stats-row"><span>Загруженность localStorage</span><strong>${totalStorage}</strong></div>
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-chart-simple"></i> Ролевая статистика</h4>
        ${['PLAYER', 'MODERATOR', 'ADMIN', 'OWNER'].map(role => {
          const count = users.filter(u => (u.role || 'PLAYER').toUpperCase() === role).length;
          return `<div class="admin-stats-row"><span>${role}</span><strong>${count}</strong></div>`;
        }).join('')}
      </div>
      <div class="admin-stats-block" style="padding:20px;">
        <h4><i class="fa-solid fa-bug"></i> Диагностика</h4>
        <button class="btn btn-secondary btn-sm" style="margin-bottom:8px;" onclick="runSystemDiagnostic()"><i class="fa-solid fa-stethoscope"></i> Запустить диагностику</button>
        <div id="admin-diag-result" style="font-size:13px; color:var(--text-secondary); margin-top:8px;"></div>
      </div>
    </div>
  `;
}

// --- ADMIN TOOLS HANDLERS ---

window.forceLogoutAllUsers = function() {
  localStorage.removeItem("current_user");
  showToast("Все пользователи принудительно вышли из системы", "info");
  renderAdminPanel();
  renderUserAuth();
};

window.sendAdminNotification = function() {
  const title = document.getElementById("admin-notif-title")?.value.trim();
  const message = document.getElementById("admin-notif-message")?.value.trim();
  const type = document.getElementById("admin-notif-type")?.value || "info";
  if (!title || !message) {
    showToast("Заполните заголовок и сообщение!", "info");
    return;
  }
  const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
  notifications.unshift({ title, message, type, time: new Date().toISOString() });
  localStorage.setItem("admin_notifications", JSON.stringify(notifications));
  showToast(`Уведомление "${title}" отправлено всем пользователям!`, "success");
  logActivity("notification_send", title);
  renderAdminPanel("notifications");
};

window.dismissReport = function(index) {
  const reports = JSON.parse(localStorage.getItem("mod_reports") || "[]");
  reports.splice(index, 1);
  localStorage.setItem("mod_reports", JSON.stringify(reports));
  renderAdminPanel("reports");
};

window.clearAllReports = function() {
  if (!confirm("Очистить все жалобы?")) return;
  localStorage.setItem("mod_reports", "[]");
  showToast("Все жалобы удалены", "success");
  renderAdminPanel("reports");
};

window.clearLocalCache = function() {
  localStorage.removeItem("mods_db_version");
  localStorage.removeItem("recently_viewed");
  localStorage.removeItem("mod_ratings");
  showToast("Кеш очищен", "success");
  logActivity("cache_clear");
};

window.rebuildSearchIndex = function() {
  const mods = getMods();
  const index = mods.map(m => ({
    id: m.id,
    name: m.name,
    author: m.author,
    desc: m.shortDescription
  }));
  localStorage.setItem("search_index", JSON.stringify(index));
  showToast(`Индекс пересобран: ${index.length} записей`, "success");
  logActivity("index_rebuild", `${index.length} entries`);
};

window.rejectAllPending = function() {
  let mods = getMods();
  const pending = mods.filter(m => !m.approved);
  mods = mods.filter(m => m.approved);
  localStorage.setItem("mods_data", JSON.stringify(mods));
  showToast(`Отклонено и удалено: ${pending.length} проектов`, "success");
  logActivity("reject_all_pending", `${pending.length} mods`);
  renderAdminPanel("mods");
};

window.exportUsersCSV = function() {
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  let csv = "UID,Username,Email,Role,Banned,Created\n";
  users.forEach(u => {
    csv += `${u.uid || ''},${u.username},${u.email},${u.role || 'PLAYER'},${u.banned ? 'Yes' : 'No'},${u.updatedAt || ''}\n`;
  });
  downloadBlob(csv, 'text/csv', `users-export-${Date.now()}.csv`);
  logActivity("export_users_csv");
};

window.exportModsCSV = function() {
  const mods = getMods();
  let csv = "ID,Name,Author,Type,Downloads,Follows,Approved,Created\n";
  mods.forEach(m => {
    csv += `${m.id},${m.name},${m.author},${m.type},${m.downloads || 0},${m.follows || 0},${m.approved},${m.createdAt || ''}\n`;
  });
  downloadBlob(csv, 'text/csv', `mods-export-${Date.now()}.csv`);
  logActivity("export_mods_csv");
};

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function estimateStorageUsage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2;
    }
  }
  return total > 1024 * 1024
    ? (total / (1024 * 1024)).toFixed(2) + ' MB'
    : total > 1024
      ? (total / 1024).toFixed(1) + ' KB'
      : total + ' B';
}

window.runSystemDiagnostic = function() {
  const issues = [];
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const mods = getMods();

  if (users.length === 0) issues.push("❌ Нет зарегистрированных пользователей");
  if (mods.length === 0) issues.push("❌ Нет модов в базе");
  const orphanMods = mods.filter(m => !users.some(u => u.username === m.author));
  if (orphanMods.length > 0) issues.push(`⚠ Найдено ${orphanMods.length} модов без авторов`);
  const dupEmails = users.filter((u, i) => users.some((u2, j) => i !== j && u2.email === u.email));
  if (dupEmails.length > 0) issues.push(`❌ Найдены дубликаты email: ${dupEmails.map(u => u.email).join(', ')}`);
  if (!navigator.onLine) issues.push("⚠ Нет подключения к интернету");

  const diagEl = document.getElementById("admin-diag-result");
  if (diagEl) {
    diagEl.innerHTML = issues.length > 0
      ? issues.join('<br>')
      : '✅ Все проверки пройдены успешно!';
  }
};



// --- EMAIL REGISTRATION VERIFICATION SYSTEM ---
function handleRegisterFormSubmit(e) {
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

  // Create temporary user object
  const tempUser = {
    uid: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    username: username,
    email: email,
    password: password,
    role: "PLAYER",
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`
  };

  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  
  // Show sending state
  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Отправка кода...`;

  const emailJsData = {
    service_id: 'ModSphere3',
    template_id: 'template_waeyhik',
    user_id: 'ExEAPt8dO-dVEm6rF',
    template_params: {
      to_email: email,
      email: email,
      to_name: username,
      username: username,
      message: verificationCode,
      code: verificationCode,
      verification_code: verificationCode
    }
  };

  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(emailJsData)
  })
  .then(res => {
    if (!res.ok) {
      return res.text().then(text => { throw new Error(text || "Ошибка сервера EmailJS"); });
    }
    return res.text();
  })
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    showVerificationStep(tempUser, verificationCode);
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    showToast(`Не удалось отправить код: ${err.message || 'Ошибка сети'}. Проверьте правильность почты.`, "error");
  });
}

function showVerificationStep(tempUser, verificationCode) {
  const registerForm = document.getElementById("register-form");
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const divider = document.querySelector(".auth-modal-card .auth-divider");

  // Hide tabs during verification to keep user focused
  if (tabLogin) tabLogin.style.display = "none";
  if (tabRegister) tabRegister.style.display = "none";
  if (divider) divider.style.display = "none";

  registerForm.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <i class="fa-solid fa-envelope-circle-check" style="font-size: 48px; color: var(--primary-color); margin-bottom: 16px;"></i>
      <h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">Код отправлен!</h3>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">Мы отправили код подтверждения на почту <strong style="color:var(--text-primary);">${tempUser.email}</strong>. Введите его ниже для завершения регистрации.</p>
    </div>
    
    <div class="form-group">
      <label class="form-label" style="text-align:center; display:block; font-size:12px; font-weight:600;">Код подтверждения *</label>
      <input type="text" class="form-input" id="verification-code-input" required placeholder="123456" maxlength="6" style="text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 6px; padding: 12px; font-family:monospace;">
    </div>
    
    <div style="display:flex; gap:12px; margin-top: 20px;">
      <button type="button" class="btn btn-secondary" id="btn-verification-back" style="flex:1; justify-content:center;">Назад</button>
      <button type="submit" class="btn btn-primary" style="flex:2; justify-content:center; background-color: var(--primary-color); color: white;">Подтвердить</button>
    </div>
  `;

  // Bind back button
  document.getElementById("btn-verification-back").addEventListener("click", () => {
    restoreRegistrationFormHTML();
    if (tabLogin) tabLogin.style.display = "block";
    if (tabRegister) tabRegister.style.display = "block";
    if (divider) divider.style.display = "flex";
  });

  // Handle code submission
  registerForm.onsubmit = (e) => {
    e.preventDefault();
    const enteredCode = document.getElementById("verification-code-input").value.trim();
    if (enteredCode === String(verificationCode)) {
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
      touchUserUpdated(tempUser);
      users.push(tempUser);
      localStorage.setItem("registered_users", JSON.stringify(users));
      localStorage.setItem("current_user", JSON.stringify(tempUser));
      logActivity("user_register", tempUser.username);
      
      showToast(`Аккаунт успешно создан! Добро пожаловать, ${tempUser.username}!`, "success");
      closeAuthModal();
      renderUserAuth();
    } else {
      showToast("Неверный код подтверждения! Проверьте почту и попробуйте еще раз.", "error");
    }
  };
}

function restoreRegistrationFormHTML() {
  const registerForm = document.getElementById("register-form");
  if (!registerForm) return;
  
  registerForm.innerHTML = `
    <div class="form-group">
      <label class="form-label">Имя пользователя (Никнейм) *</label>
      <input type="text" class="form-input" id="register-username" required placeholder="Steve3000">
    </div>
    <div class="form-group">
      <label class="form-label">Электронная почта *</label>
      <input type="email" class="form-input" id="register-email" required placeholder="name@domain.com">
    </div>
    <div class="form-group">
      <label class="form-label">Пароль *</label>
      <input type="password" class="form-input" id="register-password" required placeholder="Минимум 6 символов" minlength="6">
    </div>
    <button type="submit" class="btn btn-primary full-width" style="margin-top: 16px; justify-content: center;">Зарегистрироваться</button>
  `;
  registerForm.onsubmit = null;
}

// --- SITE FEATURES & UTILITIES ---
function setupSiteFeatures() {
  if (!document.getElementById("scroll-top-btn")) {
    const btn = document.createElement("button");
    btn.id = "scroll-top-btn";
    btn.className = "scroll-top-btn";
    btn.title = "Наверх";
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
  }

  window.addEventListener("scroll", () => {
    const btn = document.getElementById("scroll-top-btn");
    if (btn) btn.classList.toggle("visible", window.scrollY > 400);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.target.matches("input, textarea, select")) {
      e.preventDefault();
      const search = document.getElementById("header-search-input") || document.getElementById("hero-search-input");
      if (search) search.focus();
    }
    if (e.key === "Escape") {
      closeAuthModal();
      closeProfileModal();
      closePublicProfileModal();
      document.getElementById("settings-modal").style.display = "none";
      deactivateSpotlightSearch();
    }
  });

  updateSyncStatusIndicator();
}

function renderSiteAnnouncement() {
  const settings = JSON.parse(localStorage.getItem("site_settings") || "{}");
  let bar = document.getElementById("site-announcement-bar");
  if (!settings.announcement) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "site-announcement-bar";
    bar.className = "site-announcement-bar";
    document.body.prepend(bar);
  }
  bar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> <span>${settings.announcement}</span>`;
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function addRecentlyViewed(modId) {
  let list = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
  list = list.filter(id => id !== modId);
  list.unshift(modId);
  if (list.length > 12) list.length = 12;
  localStorage.setItem("recently_viewed", JSON.stringify(list));
}

function getModRating(modId) {
  const ratings = JSON.parse(localStorage.getItem("mod_ratings") || "{}");
  return ratings[modId] || 0;
}

function setModRating(modId, value) {
  const ratings = JSON.parse(localStorage.getItem("mod_ratings") || "{}");
  ratings[modId] = value;
  localStorage.setItem("mod_ratings", JSON.stringify(ratings));
}

function renderStarRating(value) {
  return [1, 2, 3, 4, 5].map(i =>
    `<span class="star-rating-item ${i <= value ? 'active' : ''}" data-star="${i}"><i class="fa-${i <= value ? 'solid' : 'regular'} fa-star"></i></span>`
  ).join("");
}

function getSiteSettings() {
  return JSON.parse(localStorage.getItem("site_settings") || "{}");
}

function saveSiteSettings(settings) {
  localStorage.setItem("site_settings", JSON.stringify({ ...getSiteSettings(), ...settings }));
  renderSiteAnnouncement();
}
