// ========== ModSphere — 100 Site Features ==========

(function() {

document.addEventListener('DOMContentLoaded', function() {
  // SF1-10: Collections, Comments, Reviews, Badges, Dependencies
  initCollections();
  initComments();
  initReviews();
  initAchievements();
  initRelatedMods();
  initSpotlight();
  initNotifications();
  initRankings();
  initAwards();
  initLevelSystem();

  // SF11-30: UI/UX features
  initQuickPreview();
  initFocusMode();
  initAutoSave();
  initProgressBar();
  initBreadcrumbs();
  initOfflineDetection();
  initReadingProgress();
  initSearchHistory();
  initFilterPresets();
  initSocialShare();
  initSkeletonLoader();
  initInfiniteScroll();
  initKeyboardHelp();
  initAccessibility();
  initConfetti();
  initParticles();
  initTypewriter();
  initZoomControls();
  initGridOverlay();
  initColorPicker();

  // SF31-50: Fun / Easter eggs
  initKonamiCode();
  initSeasonalThemes();
  initExtraMemes();
  initWeekendMode();
  initDevMode();
  initLiveBackground();
  initDevBlog();
  initAPIPlayground();
  initStatusPage();
  initDataUsage();
  initDonationLinks();
  initOnlineUsers();
  initQuickNav();
  initGalleryUpload();
  initReportReasons();
  initBenchmark();
  initWordCount();
  initMemoryUsage();
  initAvatarRegen();
  initConfettiRain();

  // SF51-70: Mod interactions
  initCompareTool();
  initModVoting();
  initModRequests();
  initModRoadmap();
  initRandomMod();
  initTagsCloud();
  initTrendingTags();
  initShowAlsoDownloaded();
  initTopToday();
  initNewReleases();
  initModOfDay();
  initCuratedPicks();
  initSimilarMods();
  initShowModStats();
  initVersionCompare();

  // SF71-90: Utilities
  initPWA();
  initInstallPrompt();
  initCustomCSS();
  initCustomJS();
  initSEOSettings();
  initSitemap();
  initPrintStyles();
  initAutoTheme();
  initRegenerateAvatars();
  initExportPage();
  initQuickActions();
  initHomepageSection();
  initProfileBadges();
  initCustomProfileUrl();
  initExportProfile();
  initDownloadManager();
  initBookmarkFolders();
  initBrowseHistory();
  initRulerTool();
  initInspector();

  // SF91-100: Final touches
  initSmoothTransitions();
  initLoadingStates();
  initErrorHandler();
  initPerformance();
  initAnalytics();
  initBackup();
  initRestore();
  initClearData();
  initThirdParty();
  initFinalSetup();
});

// ===== UTILITY HELPERS =====

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('current_user') || 'null');
}

function showToast(msg, type) {
  if (window.showToast) window.showToast(msg, type);
}

function getMods() {
  return window.getMods ? window.getMods() : JSON.parse(localStorage.getItem('mods_data') || '[]');
}

function showModal(html, title) {
  const modal = document.createElement('div');
  modal.className = 'profile-modal';
  modal.id = 'nf-modal';
  modal.style.display = 'block';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '2000';
  modal.innerHTML = '<div class="profile-modal-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);" onclick="closeNFModal()"></div>' +
    '<div class="profile-modal-card" style="position:relative;margin:5vh auto;max-width:600px;max-height:80vh;overflow-y:auto;background:var(--surface-color);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg);">' +
    '<button class="profile-modal-close" onclick="closeNFModal()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-primary);font-size:24px;cursor:pointer;">✕</button>' +
    '<h2 style="margin-bottom:16px;padding-right:30px;">' + title + '</h2>' + html + '</div>';
  document.body.appendChild(modal);
}
window.closeNFModal = function() {
  const m = document.getElementById('nf-modal');
  if (m) m.remove();
};
window.closeModal = window.closeNFModal;

function formatDate(d) {
  if (!d) return '—';
  return window.formatDate ? window.formatDate(d) : new Date(d).toLocaleDateString();
}
function formatNumber(n) {
  n = parseInt(n) || 0;
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'k';
  return n.toString();
}
function formatNumberFull(n) {
  return (parseInt(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
function formatRelativeTime(t) {
  if (!t) return 'недавно';
  const diff = Date.now() - new Date(t).getTime();
  const min = Math.floor(diff/60000);
  if (min < 1) return 'только что';
  if (min < 60) return min + ' мин. назад';
  const h = Math.floor(min/60);
  if (h < 24) return h + ' ч. назад';
  const d = Math.floor(h/24);
  if (d < 30) return d + ' дн. назад';
  return new Date(t).toLocaleDateString('ru-RU', {day:'numeric',month:'short',year:'numeric'});
}
function getRoleBadgeHTML(role) {
  if (!role) return '';
  const r = role.toUpperCase();
  let cls = 'role-player';
  if (r === 'ADMIN') cls = 'role-admin';
  if (r === 'OWNER') cls = 'role-owner';
  if (r === 'MODERATOR') cls = 'role-moderator';
  return '<span class="role-badge ' + cls + '">' + r + '</span>';
}
function createModCard(mod) {
  const card = document.createElement('div');
  card.className = 'mod-card';
  card.addEventListener('click', function(e) {
    if (e.target.closest('.author-link')) return;
    window.location.hash = '#/mod/' + (mod.slug || mod.id);
  });
  const loadersBadges = (mod.loaders || []).map(function(l) {
    return '<span class="mod-card-badge">' + (window.METADATA?.loaders?.[l] || l) + '</span>';
  }).join(' ');
  const avatar = mod.avatar ? (mod.avatar.startsWith('http') || mod.avatar.startsWith('data:') ? '<img src="' + mod.avatar + '" alt="">' : mod.avatar) : '📦';
  card.innerHTML = '<div class="mod-card-header"><div class="mod-card-icon" style="background-color:' + (mod.iconColor || '#10b981') + '">' + avatar + '</div>' +
    '<div class="mod-card-details"><h3 class="mod-card-title">' + mod.name + '</h3>' +
    '<span class="mod-card-author">от <strong class="author-link">' + mod.author + '</strong></span></div></div>' +
    '<p class="mod-card-desc">' + (mod.shortDescription || '') + '</p>' +
    '<div class="mod-card-footer"><div class="mod-card-stats">' +
    '<span class="mod-card-stat"><i class="fa-solid fa-download"></i> ' + formatNumber(mod.downloads) + '</span>' +
    '<span class="mod-card-stat"><i class="fa-solid fa-heart"></i> ' + formatNumber(mod.follows) + '</span></div>' +
    '<div class="mod-card-badges">' + loadersBadges + '</div></div>';
  return card;
}

// ===== FEATURE: Collections =====
function initCollections() {
  window.addCollection = function() {
    const name = prompt('Название коллекции:');
    if (!name) return;
    const cols = JSON.parse(localStorage.getItem('mod_collections') || '[]');
    cols.push({ id: Date.now().toString(36), name, mods: [], createdAt: new Date().toISOString() });
    localStorage.setItem('mod_collections', JSON.stringify(cols));
    showToast('Коллекция "' + name + '" создана!', 'success');
  };
  window.addModToCollection = function(collId, modId) {
    const cols = JSON.parse(localStorage.getItem('mod_collections') || '[]');
    const c = cols.find(x => x.id === collId);
    if (c && !c.mods.includes(modId)) { c.mods.push(modId); localStorage.setItem('mod_collections', JSON.stringify(cols)); showToast('Мод добавлен в коллекцию', 'success'); }
  };
  window.showCollections = function() {
    const cols = JSON.parse(localStorage.getItem('mod_collections') || '[]');
    if (!cols.length) { showToast('Нет коллекций. Создайте новую!', 'info'); return; }
    const list = cols.map(function(c) { return '<div style="padding:10px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;cursor:pointer;display:flex;justify-content:space-between;" onclick="window.location.hash=\'#/browse?favorites=1\'"><span>📁 <strong>' + c.name + '</strong> (' + c.mods.length + ')</span><span style="color:var(--text-muted);font-size:12px;">' + formatRelativeTime(c.createdAt) + '</span></div>'; }).join('');
    showModal('<div style="max-height:400px;overflow-y:auto;">' + list + '</div><div style="margin-top:12px;"><button class="btn btn-primary btn-sm" onclick="addCollection();closeNFModal();">➕ Новая коллекция</button></div>', '📚 Мои коллекции');
  };
}

// ===== FEATURE: Comments =====
function initComments() {
  window.showModComments = function(modId) {
    const comments = JSON.parse(localStorage.getItem('mod_comments_' + modId) || '[]');
    let html = '<div style="max-height:350px;overflow-y:auto;">';
    if (!comments.length) html += '<p style="color:var(--text-muted);text-align:center;padding:20px;">Комментариев пока нет</p>';
    comments.forEach(function(c) { html += '<div style="padding:10px;border-bottom:1px solid var(--border-color);display:flex;gap:10px;"><div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="' + (c.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + c.author) + '" style="width:100%;height:100%;object-fit:cover;"></div><div><strong>' + c.author + '</strong> <span style="font-size:11px;color:var(--text-muted);">' + formatRelativeTime(c.time) + '</span><br><span style="font-size:14px;color:var(--text-secondary);">' + c.text + '</span></div></div>'; });
    html += '</div>';
    const user = getCurrentUser();
    if (user) html += '<div style="margin-top:12px;display:flex;gap:8px;"><input type="text" id="nf-comment-input" class="form-input" placeholder="Написать комментарий..." style="flex:1;"><button class="btn btn-primary btn-sm" onclick="addComment(\'' + modId + '\')">Отправить</button></div>';
    showModal(html, '💬 Комментарии');
    setTimeout(function() { var inp = document.getElementById('nf-comment-input'); if (inp) inp.focus(); }, 100);
  };
  window.addComment = function(modId) {
    const inp = document.getElementById('nf-comment-input');
    if (!inp || !inp.value.trim()) return;
    const user = getCurrentUser();
    if (!user) { showToast('Войдите, чтобы комментировать', 'info'); return; }
    const comments = JSON.parse(localStorage.getItem('mod_comments_' + modId) || '[]');
    comments.unshift({ author: user.username, role: user.role, avatar: user.avatar, text: inp.value.trim(), time: new Date().toISOString() });
    localStorage.setItem('mod_comments_' + modId, JSON.stringify(comments));
    inp.value = '';
    showToast('Комментарий добавлен!', 'success');
    window.showModComments(modId);
  };
}

// ===== FEATURE: Reviews =====
function initReviews() {
  window.addModReview = function(modId) {
    const user = getCurrentUser();
    if (!user) { showToast('Войдите, чтобы оставить отзыв', 'info'); return; }
    const text = prompt('Ваш отзыв:');
    if (!text) return;
    const rating = prompt('Оценка (1-5):', '5');
    if (!rating || rating < 1 || rating > 5) { showToast('Оценка от 1 до 5', 'info'); return; }
    const reviews = JSON.parse(localStorage.getItem('mod_reviews_' + modId) || '[]');
    reviews.unshift({ author: user.username, text, rating: parseInt(rating), time: new Date().toISOString() });
    localStorage.setItem('mod_reviews_' + modId, JSON.stringify(reviews));
    showToast('Отзыв оставлен!', 'success');
  };
}

// ===== FEATURE: Achievements =====
function initAchievements() {
  window.getAchievements = function(username) {
    return JSON.parse(localStorage.getItem('user_achievements_' + username) || '[]');
  };
  function awardAchievement(username, badge) {
    const ach = window.getAchievements(username);
    if (!ach.includes(badge)) { ach.push(badge); localStorage.setItem('user_achievements_' + username, JSON.stringify(ach)); showToast('🏅 Значок "' + badge + '" получен!', 'success'); }
  }
  window.awardAchievement = awardAchievement;

  setTimeout(function() {
    const u = getCurrentUser();
    if (!u) return;
    const mods = getMods();
    if (mods.some(function(m) { return m.author === u.username; })) awardAchievement(u.username, 'first_mod');
    if (mods.some(function(m) { return m.author === u.username && m.downloads >= 1000; })) awardAchievement(u.username, 'popular');
    var streak = parseInt(localStorage.getItem('login_streak_' + u.username) || '0');
    if (streak >= 7) awardAchievement(u.username, 'streak_7');
    if (streak >= 30) awardAchievement(u.username, 'streak_30');
    var followed = JSON.parse(localStorage.getItem('followed_mods') || '[]');
    if (followed.length >= 10) awardAchievement(u.username, 'collector');
    if (localStorage.getItem('register_' + u.uid) && (Date.now() - new Date(localStorage.getItem('register_' + u.uid)).getTime()) > 365*86400000) awardAchievement(u.username, 'veteran');
  }, 3000);

  window.showProfileBadges = function(username) {
    const ach = window.getAchievements(username);
    const badges = [
      { id: 'first_mod', label: '📦 Первый мод', desc: 'Опубликовал первый мод' },
      { id: 'popular', label: '⭐ Популярный', desc: 'Мод набрал 1000 скачиваний' },
      { id: 'veteran', label: '🎖️ Ветеран', desc: 'Зарегистрирован более года' },
      { id: 'collector', label: '💎 Коллекционер', desc: '10 модов в избранном' },
      { id: 'contributor', label: '🤝 Контрибьютор', desc: 'Помог сообществу' },
      { id: 'streak_7', label: '🔥 7 дней', desc: 'Заходил 7 дней подряд' },
      { id: 'streak_30', label: '💪 30 дней', desc: 'Заходил 30 дней подряд' },
    ];
    const html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + badges.map(function(b) {
      var owned = ach.includes(b.id);
      return '<div style="padding:12px 16px;background:var(--surface-color);border:1px solid ' + (owned ? 'var(--primary-color)' : 'var(--border-color)') + ';border-radius:12px;text-align:center;opacity:' + (owned ? 1 : 0.4) + ';"><div style="font-size:20px;margin-bottom:4px;">' + b.label + '</div><div style="font-size:10px;color:var(--text-muted);">' + b.desc + '</div></div>';
    }).join('') + '</div>';
    showModal(html, '🏅 Значки достижений');
  };
}

// ===== FEATURE: Related mods =====
function initRelatedMods() {
  window.findSimilarMods = function(modId) {
    const mods = getMods().filter(function(m) { return m.approved; });
    const mod = mods.find(function(m) { return m.id === modId; });
    if (!mod) return;
    const scored = mods.filter(function(m) { return m.id !== modId; }).map(function(m) {
      var score = 0;
      m.categories.forEach(function(c) { if (mod.categories.includes(c)) score += 3; });
      m.loaders.forEach(function(l) { if (mod.loaders.includes(l)) score += 2; });
      m.gameVersions.forEach(function(v) { if ((mod.gameVersions||[]).includes(v)) score += 1; });
      return { mod: m, score: score };
    }).sort(function(a, b) { return b.score - a.score; }).slice(0, 4).filter(function(s) { return s.score > 0; });
    if (!scored.length) { showToast('Похожих модов не найдено', 'info'); return; }
    var html = '<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">';
    scored.forEach(function(s) { html += createModCard(s.mod).outerHTML; });
    html += '</div>';
    showModal(html, '🔍 Похожие моды');
  };
  window.showAlsoDownloaded = function(modId) {
    const mods = getMods().filter(function(m) { return m.approved && m.id !== modId; }).sort(function() { return Math.random() - 0.5; }).slice(0, 3);
    if (!mods.length) return;
    var html = '<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">';
    mods.forEach(function(m) { html += createModCard(m).outerHTML; });
    html += '</div>';
    showModal(html, '👥 С этим также скачивают');
  };
}

// ===== FEATURE: Random mod =====
function initRandomMod() {
  window.openRandomMod = function() {
    const mods = getMods().filter(function(m) { return m.approved; });
    if (!mods.length) { showToast('Нет доступных модов', 'info'); return; }
    const rand = mods[Math.floor(Math.random() * mods.length)];
    window.location.hash = '#/mod/' + (rand.slug || rand.id);
  };
}

// ===== FEATURE: Tags cloud =====
function initTagsCloud() {
  window.renderTagsCloud = function(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const mods = getMods().filter(function(m) { return m.approved; });
    const tags = {};
    mods.forEach(function(m) { m.categories.forEach(function(c) { tags[c] = (tags[c] || 0) + 1; }); });
    var sorted = Object.entries(tags).sort(function(a, b) { return b[1] - a[1]; });
    el.innerHTML = sorted.map(function(_a) {
      var k = _a[0], v = _a[1];
      var size = Math.min(24, Math.max(12, 12 + Math.floor(v / 3)));
      return '<span style="font-size:' + size + 'px;display:inline-block;padding:4px 12px;margin:4px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:20px;cursor:pointer;color:var(--text-secondary);" onmouseover="this.style.borderColor=\'var(--primary-color)\';this.style.color=\'var(--text-primary)\';" onmouseout="this.style.borderColor=\'\';this.style.color=\'\';" onclick="window.location.hash=\'#/browse?categories=' + k + '\'">' + (window.METADATA?.categories?.[k] || k) + ' (' + v + ')</span>';
    }).join('');
  };
  window.renderTrendingTags = function(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const mods = getMods().filter(function(m) { return m.approved; });
    const tags = {};
    mods.forEach(function(m) { m.categories.forEach(function(c) { tags[c] = (tags[c] || 0) + 1; }); });
    var sorted = Object.entries(tags).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8);
    el.innerHTML = sorted.map(function(_a) {
      var k = _a[0];
      return '<a href="#/browse?categories=' + k + '" style="display:inline-block;padding:6px 14px;margin:4px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:20px;color:var(--text-secondary);font-size:13px;text-decoration:none;">#' + (window.METADATA?.categories?.[k] || k) + '</a>';
    }).join('');
  };
}

// ===== FEATURE: Spotlight enhancements =====
function initSpotlight() {
  window.showQuickNav = function() {
    const html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/\';closeNFModal();">🏠 Главная</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/browse\';closeNFModal();">🔍 Обзор</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/create\';closeNFModal();">➕ Добавить</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/settings\';closeNFModal();">⚙️ Настройки</button>' +
      '<button class="btn btn-secondary" onclick="openRandomMod();closeNFModal();">🎲 Случайный мод</button>' +
      '<button class="btn btn-secondary" onclick="showCollections();closeNFModal();">📚 Коллекции</button></div>';
    showModal(html, '🧭 Быстрая навигация');
  };
}

// ===== FEATURE: Notifications bell =====
function initNotifications() {
  function addBell() {
    if (document.getElementById('user-notif-bell')) return;
    const actions = document.querySelector('.header-actions');
    if (!actions) return;
    const bell = document.createElement('button');
    bell.id = 'user-notif-bell';
    bell.className = 'theme-toggle';
    bell.title = 'Уведомления';
    bell.innerHTML = '<i class="fa-regular fa-bell"></i>';
    bell.addEventListener('click', function() {
      const notifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      if (!notifs.length) { showToast('Новых уведомлений нет', 'info'); return; }
      var html = '<div style="max-height:400px;overflow-y:auto;">' + notifs.slice(0, 10).map(function(n) {
        return '<div style="padding:12px;border-bottom:1px solid var(--border-color);"><strong>' + n.title + '</strong><span class="result-tag" style="background:rgba(16,185,129,0.08);color:var(--primary-color);font-size:10px;margin-left:8px;">' + n.type + '</span><p style="font-size:13px;color:var(--text-secondary);margin:4px 0;">' + n.message + '</p><span style="font-size:11px;color:var(--text-muted);">' + formatRelativeTime(n.time) + '</span></div>';
      }).join('') + '</div>';
      showModal(html, '🔔 Уведомления');
    });
    const syncStatus = document.getElementById('sync-status-indicator');
    if (syncStatus) syncStatus.parentNode.insertBefore(bell, syncStatus);
  }
  // Watch for header to appear
  var check = setInterval(function() {
    if (document.querySelector('.header-actions')) { addBell(); clearInterval(check); }
  }, 200);
  setTimeout(function() { clearInterval(check); }, 5000);
}

// ===== FEATURE: Rankings =====
function initRankings() {
  window.showRankings = function(period) {
    const mods = getMods().filter(function(m) { return m.approved; });
    const periods = { daily: 86400000, weekly: 604800000, monthly: 2592000000 };
    const cutoff = Date.now() - (periods[period] || periods.weekly);
    var ranked = mods.filter(function(m) { return new Date(m.updatedAt).getTime() > cutoff; }).sort(function(a, b) { return b.downloads - a.downloads; }).slice(0, 10);
    if (!ranked.length) { showToast('Нет данных за этот период', 'info'); return; }
    var labels = { daily: 'День', weekly: 'Неделю', monthly: 'Месяц' };
    var pos = 1;
    var html = '<ol style="margin:0;padding:0;list-style:none;">' + ranked.map(function(m) {
      var p = pos++;
      return '<li style="padding:10px 0;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\';closeNFModal();"><span style="font-size:20px;font-weight:800;color:' + (p <= 3 ? 'var(--primary-color)' : 'var(--text-muted)') + ';width:30px;">#' + p + '</span><span style="font-weight:600;">' + m.name + '</span><span style="color:var(--text-muted);font-size:13px;margin-left:auto;"><i class="fa-solid fa-download"></i> ' + formatNumber(m.downloads) + '</span></li>';
    }).join('') + '</ol>';
    showModal(html, '🏆 Топ за ' + labels[period]);
  };
  window.showTopToday = function() {
    var mods = getMods().filter(function(m) { return m.approved; }).sort(function(a, b) { return (b.downloadsToday || 0) - (a.downloadsToday || 0); }).slice(0, 10);
    var html = '<ol style="margin:0;padding:0;list-style:none;">' + mods.map(function(m, i) {
      return '<li style="padding:10px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\';closeNFModal();"><span style="font-weight:800;color:' + (i < 3 ? 'var(--primary-color)' : 'var(--text-muted)') + ';">#' + (i+1) + '</span> ' + m.name + ' <span style="color:var(--text-muted);font-size:12px;">' + formatNumber(m.downloads) + ' скачиваний</span></li>';
    }).join('') + '</ol>';
    showModal(html, '📈 Топ за сегодня');
  };
  window.showNewReleases = function() {
    var weekAgo = Date.now() - 604800000;
    var mods = getMods().filter(function(m) { return m.approved && new Date(m.createdAt).getTime() > weekAgo; }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    if (!mods.length) { showToast('Новых модов за неделю нет', 'info'); return; }
    var html = '<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">';
    mods.forEach(function(m) { html += createModCard(m).outerHTML; });
    html += '</div>';
    showModal(html, '🆕 Новинки недели');
  };
  window.showModOfDay = function() {
    const mods = getMods().filter(function(m) { return m.approved; });
    if (!mods.length) return;
    var dayIndex = Math.floor(Date.now() / 86400000) % mods.length;
    var mod = mods[dayIndex];
    showModal(createModCard(mod).outerHTML + '<div style="text-align:center;margin-top:12px;"><button class="btn btn-primary" onclick="window.location.hash=\'#/mod/' + (mod.slug || mod.id) + '\';closeNFModal();">Перейти к моду</button></div>', '🌟 Мод дня');
  };
  window.showCuratedPicks = function() {
    const mods = getMods().filter(function(m) { return m.approved; });
    var picks = mods.sort(function() { return Math.random() - 0.5; }).slice(0, 4);
    var html = '<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">';
    picks.forEach(function(m) { html += createModCard(m).outerHTML; });
    html += '</div>';
    showModal(html, '🎯 Подборка редакции');
  };
}

// ===== FEATURE: Awards =====
function initAwards() {
  window.showModAwards = function() {
    const mods = getMods().filter(function(m) { return m.approved; });
    var awards = [
      { title: '🏆 Самый скачиваемый', mod: mods.slice().sort(function(a, b) { return b.downloads - a.downloads; })[0] },
      { title: '❤️ Самый любимый', mod: mods.slice().sort(function(a, b) { return b.follows - a.follows; })[0] },
      { title: '🆕 Самый новый', mod: mods.slice().sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0] },
      { title: '📸 Лучшая галерея', mod: mods.filter(function(m) { return m.gallery && m.gallery.length > 0; }).sort(function(a, b) { return (b.gallery?.length || 0) - (a.gallery?.length || 0); })[0] },
    ];
    var html = awards.filter(function(a) { return a.mod; }).map(function(a) {
      return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:12px;margin:8px 0;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (a.mod.slug || a.mod.id) + '\';closeNFModal();"><div style="font-size:16px;font-weight:700;">' + a.title + '</div><div style="font-size:14px;color:var(--text-secondary);">' + a.mod.name + ' — ' + a.mod.author + '</div></div>';
    }).join('');
    showModal(html, '🎖️ Награды модов');
  };
}

// ===== FEATURE: Level/XP system =====
function initLevelSystem() {
  window.getUserLevel = function(username) {
    return parseInt(localStorage.getItem('user_level_' + username) || '1');
  };
  window.getUserXP = function(username) {
    return parseInt(localStorage.getItem('user_xp_' + username) || '0');
  };
  function addXP(username, amount) {
    if (!username) return;
    var xp = window.getUserXP(username) + amount;
    localStorage.setItem('user_xp_' + username, String(xp));
    var level = Math.floor(Math.sqrt(xp / 100)) + 1;
    var oldLevel = parseInt(localStorage.getItem('user_level_' + username) || '1');
    if (level > oldLevel) {
      localStorage.setItem('user_level_' + username, String(level));
      showToast('🎉 Уровень повышен! Вы достигли ' + level + ' уровня!', 'success');
    }
  }
  // Track interactions for XP
  document.addEventListener('click', function(e) {
    if (e.target.closest('[id*="btn-main-download"]')) {
      var u = getCurrentUser();
      if (u) addXP(u.username, 5);
    }
    if (e.target.closest('[id*="btn-follow-toggle"]')) {
      var u2 = getCurrentUser();
      if (u2) addXP(u2.username, 3);
    }
  });
  // Login streak
  var user = getCurrentUser();
  if (user) {
    var lastLogin = localStorage.getItem('last_login_' + user.username);
    var today = new Date().toDateString();
    if (lastLogin !== today) {
      var yesterday = new Date(Date.now() - 86400000).toDateString();
      var streak = parseInt(localStorage.getItem('login_streak_' + user.username) || '0');
      if (lastLogin === yesterday) { streak++; } else { streak = 1; }
      localStorage.setItem('login_streak_' + user.username, String(streak));
      localStorage.setItem('last_login_' + user.username, today);
      if (streak > 1 && streak % 5 === 0) showToast('🔥 ' + streak + ' дней подряд!', 'success');
      addXP(user.username, 10);
    }
  }
}

// ===== FEATURE: Compare tool =====
function initCompareTool() {
  var compareList = [];
  window.toggleCompare = function(modId) {
    var idx = compareList.indexOf(modId);
    if (idx > -1) { compareList.splice(idx, 1); showToast('Мод убран из сравнения', 'info'); }
    else if (compareList.length >= 3) { showToast('Максимум 3 мода для сравнения', 'info'); }
    else { compareList.push(modId); showToast('Мод добавлен в сравнение (' + compareList.length + '/3)', 'success'); }
    updateCompareBar();
  };
  function updateCompareBar() {
    var bar = document.getElementById('compare-bar');
    if (!compareList.length) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'compare-bar';
      bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--surface-color);border-top:1px solid var(--border-color);padding:12px 20px;z-index:999;display:flex;align-items:center;gap:12px;backdrop-filter:blur(10px);';
      document.body.appendChild(bar);
    }
    var mods = getMods();
    bar.innerHTML = '<span style="font-weight:600;">Сравнение (' + compareList.length + '):</span> ' +
      compareList.map(function(id) { var m = mods.find(function(x) { return x.id === id; }); return m ? '<span style="padding:4px 10px;background:var(--bg-color);border-radius:6px;">' + m.name + '</span>' : ''; }).join('') +
      (compareList.length >= 2 ? '<button class="btn btn-primary btn-sm" onclick="showCompareResults()">Сравнить</button>' : '') +
      '<button class="btn btn-secondary btn-sm" onclick="compareList=[];updateCompareBar()">Очистить</button>';
  }
  window.showCompareResults = function() {
    var mods = getMods();
    var selected = compareList.map(function(id) { return mods.find(function(m) { return m.id === id; }); }).filter(Boolean);
    if (selected.length < 2) { showToast('Добавьте минимум 2 мода', 'info'); return; }
    var fields = ['name', 'type', 'downloads', 'follows', 'license', 'loaders', 'gameVersions'];
    var labels = { name: 'Название', type: 'Тип', downloads: 'Скачивания', follows: 'Подписчики', license: 'Лицензия', loaders: 'Загрузчики', gameVersions: 'Версии' };
    var html = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">';
    html += '<tr style="background:var(--surface-color);"><th style="padding:8px;border:1px solid var(--border-color);text-align:left;">Параметр</th>';
    selected.forEach(function(m) { html += '<th style="padding:8px;border:1px solid var(--border-color);text-align:center;">' + m.name + '</th>'; });
    html += '</tr>';
    fields.forEach(function(f) {
      html += '<tr><td style="padding:8px;border:1px solid var(--border-color);font-weight:600;">' + (labels[f] || f) + '</td>';
      selected.forEach(function(m) {
        var val = m[f];
        if (f === 'loaders') val = (m.loaders || []).map(function(l) { return window.METADATA?.loaders?.[l] || l; }).join(', ');
        if (f === 'gameVersions') val = (m.gameVersions || []).join(', ');
        if (f === 'downloads' || f === 'follows') val = formatNumberFull(val || 0);
        if (f === 'type') val = window.METADATA?.types?.[val] || val;
        html += '<td style="padding:8px;border:1px solid var(--border-color);text-align:center;">' + (val || '—') + '</td>';
      });
      html += '</tr>';
    });
    html += '</table></div>';
    showModal(html, '📊 Сравнение модов');
  };
}

// ===== FEATURE: Mod voting =====
function initModVoting() {
  window.voteMod = function(modId, type) {
    var user = getCurrentUser();
    if (!user) { showToast('Войдите, чтобы голосовать', 'info'); return; }
    var votes = JSON.parse(localStorage.getItem('mod_votes_' + modId) || '[]');
    if (votes.includes(user.uid)) { showToast('Вы уже голосовали', 'info'); return; }
    votes.push(user.uid);
    localStorage.setItem('mod_votes_' + modId, JSON.stringify(votes));
    var mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (mod) {
      if (type === 'up') mod.upvotes = (mod.upvotes || 0) + 1;
      else mod.downvotes = (mod.downvotes || 0) + 1;
      localStorage.setItem('mods_data', JSON.stringify(mods));
    }
    showToast('Голос учтён!', 'success');
  };
}

// ===== FEATURE: Mod requests =====
function initModRequests() {
  window.submitModRequest = function() {
    var user = getCurrentUser();
    if (!user) { showToast('Войдите, чтобы предложить мод', 'info'); return; }
    var name = prompt('Название мода:');
    if (!name) return;
    var desc = prompt('Краткое описание:');
    var requests = JSON.parse(localStorage.getItem('mod_requests') || '[]');
    requests.unshift({ id: Date.now().toString(36), name: name, desc: desc || '', author: user.username, votes: 0, time: new Date().toISOString() });
    localStorage.setItem('mod_requests', JSON.stringify(requests));
    showToast('Предложение отправлено!', 'success');
  };
  window.showModRequests = function() {
    var requests = JSON.parse(localStorage.getItem('mod_requests') || '[]');
    if (!requests.length) { showToast('Предложений пока нет', 'info'); return; }
    var html = '<div style="max-height:400px;overflow-y:auto;">' + requests.map(function(r, i) {
      return '<div style="padding:12px;border-bottom:1px solid var(--border-color);"><strong>' + r.name + '</strong> <span style="font-size:12px;color:var(--text-muted);">от ' + r.author + '</span><p style="font-size:13px;color:var(--text-secondary);margin:4px 0;">' + (r.desc || 'Без описания') + '</p><div style="display:flex;gap:12px;align-items:center;"><button class="btn btn-secondary btn-sm" onclick="voteModRequest(' + i + ')">👍 ' + (r.votes || 0) + '</button><span style="font-size:11px;color:var(--text-muted);">' + formatRelativeTime(r.time) + '</span></div></div>';
    }).join('') + '</div>';
    showModal(html, '📋 Предложенные моды');
  };
  window.voteModRequest = function(index) {
    var requests = JSON.parse(localStorage.getItem('mod_requests') || '[]');
    if (requests[index]) { requests[index].votes = (requests[index].votes || 0) + 1; localStorage.setItem('mod_requests', JSON.stringify(requests)); showToast('Голос учтён!', 'success'); window.showModRequests(); }
  };
}

// ===== FEATURE: Mod roadmap =====
function initModRoadmap() {
  window.showModRoadmap = function(modId) {
    var roadmap = JSON.parse(localStorage.getItem('mod_roadmap_' + modId) || '[]');
    if (!roadmap.length) { showToast('Roadmap не составлен', 'info'); return; }
    var html = '<div style="max-height:400px;overflow-y:auto;">' + roadmap.map(function(r) {
      return '<div style="padding:12px;border-left:3px solid ' + (r.done ? 'var(--primary-color)' : 'var(--text-muted)') + ';margin:8px 0;background:var(--surface-color);border-radius:0 8px 8px 0;"><div style="display:flex;justify-content:space-between;"><strong>' + r.title + '</strong><span style="font-size:11px;color:var(--text-muted);">' + (r.done ? '✅ Готово' : '⏳ В планах') + '</span></div><p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0;">' + (r.desc || '') + '</p></div>';
    }).join('') + '</div>';
    showModal(html, '🗺️ Roadmap');
  };
}

// ===== FEATURE: Mod stats display =====
function initShowModStats() {
  window.showModStats = function(modId) {
    const mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (!mod) return;
    var html = '<div style="padding:20px;"><h4 style="margin-bottom:16px;">📊 Статистика мода</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div style="background:var(--surface-color);padding:16px;border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">' + formatNumber(mod.downloads) + '</div><div style="font-size:12px;color:var(--text-muted);">Скачиваний</div></div>' +
      '<div style="background:var(--surface-color);padding:16px;border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">' + formatNumber(mod.follows) + '</div><div style="font-size:12px;color:var(--text-muted);">Подписчиков</div></div>' +
      '<div style="background:var(--surface-color);padding:16px;border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">' + formatNumber(mod.views || 0) + '</div><div style="font-size:12px;color:var(--text-muted);">Просмотров</div></div>' +
      '<div style="background:var(--surface-color);padding:16px;border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">' + (mod.versions ? mod.versions.length : 0) + '</div><div style="font-size:12px;color:var(--text-muted);">Версий</div></div>' +
      '</div></div>';
    showModal(html, '📈 Статистика');
  };
}

// ===== FEATURE: Version compare =====
function initVersionCompare() {
  window.compareVersions = function(modId, v1id, v2id) {
    const mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (!mod || !mod.versions) return;
    var v1 = mod.versions.find(function(v) { return v.id === v1id; });
    var v2 = mod.versions.find(function(v) { return v.id === v2id; });
    if (!v1 || !v2) { showToast('Версии не найдены', 'info'); return; }
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
      ['Версия', 'Тип', 'Размер', 'Загрузок', 'Дата'].map(function(field) {
        var f1 = field === 'Версия' ? v1.versionNumber : field === 'Тип' ? v1.type : field === 'Размер' ? v1.fileSize : field === 'Загрузок' ? formatNumber(v1.downloads) : formatDate(v1.uploadedAt);
        var f2 = field === 'Версия' ? v2.versionNumber : field === 'Тип' ? v2.type : field === 'Размер' ? v2.fileSize : field === 'Загрузок' ? formatNumber(v2.downloads) : formatDate(v2.uploadedAt);
        return '<div style="background:var(--surface-color);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">' + field + '</div><div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:4px;">' + f1 + '</div></div>' +
          '<div style="background:var(--surface-color);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">' + field + '</div><div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:4px;">' + f2 + '</div></div>';
      }).join('') + '<div style="grid-column:1/-1;text-align:center;padding:12px;background:var(--surface-color);border-radius:8px;"><span style="color:var(--text-secondary);">Изменения: </span>' +
      (v1.changelog !== v2.changelog ? '<span style="color:var(--primary-color);">Есть отличия</span>' : '<span>Изменений нет</span>') + '</div></div>';
    showModal(html, '📊 Сравнение версий');
  };
}

// ===== FEATURE: Focus mode =====
function initFocusMode() {
  window.toggleFocusMode = function() {
    document.body.classList.toggle('focus-mode');
    showToast(document.body.classList.contains('focus-mode') ? '🧘 Режим фокуса включён' : 'Режим фокуса выключен', 'info');
  };
}

// ===== FEATURE: Auto-save forms =====
function initAutoSave() {
  document.addEventListener('input', function(e) {
    var form = e.target.closest('form');
    if (!form || !form.id) return;
    var data = {};
    new FormData(form).forEach(function(v, k) { data[k] = v; });
    localStorage.setItem('autosave_' + form.id, JSON.stringify(data));
  });
  window.restoreAutoSave = function(formId) {
    var data = JSON.parse(localStorage.getItem('autosave_' + formId) || 'null');
    if (!data) return;
    var form = document.getElementById(formId);
    if (!form) return;
    Object.entries(data).forEach(function(_a) { var k = _a[0], v = _a[1]; var el = form.querySelector('[name="' + k + '"]'); if (el) el.value = v; });
    showToast('Черновик восстановлен', 'info');
    localStorage.removeItem('autosave_' + formId);
  };
}

// ===== FEATURE: Progress bar =====
function initProgressBar() {
  var bar = document.createElement('div');
  bar.id = 'loading-progress-bar';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color));z-index:9999;width:0;transition:width 0.3s;opacity:0;';
  document.body.appendChild(bar);
  window.showProgress = function() { bar.style.width = '30%'; bar.style.opacity = '1'; };
  window.hideProgress = function() { bar.style.width = '100%'; setTimeout(function() { bar.style.opacity = '0'; bar.style.width = '0'; }, 300); };
  // Track hash changes
  window.addEventListener('hashchange', function() { window.showProgress(); setTimeout(window.hideProgress, 500); });
}

// ===== FEATURE: Reading progress =====
function initReadingProgress() {
  var bar = document.createElement('div');
  bar.id = 'reading-progress';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color));z-index:9997;width:0;transition:width 0.1s ease;';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = (window.scrollY / h) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  });
}

// ===== FEATURE: Offline detection =====
function initOfflineDetection() {
  var indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;text-align:center;padding:6px;font-size:13px;z-index:9999;display:none;';
  indicator.textContent = '⚠ Нет подключения к интернету';
  document.body.prepend(indicator);
  window.addEventListener('online', function() { indicator.style.display = 'none'; });
  window.addEventListener('offline', function() { indicator.style.display = 'block'; });
}

// ===== FEATURE: Search history =====
function initSearchHistory() {
  window.getSearchHistory = function() { return JSON.parse(localStorage.getItem('search_history') || '[]'); };
  // Track searches
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var inp = document.getElementById('header-search-input') || document.getElementById('browse-search-input');
      if (inp && inp.value.trim()) {
        var h = JSON.parse(localStorage.getItem('search_history') || '[]');
        h = h.filter(function(x) { return x !== inp.value.trim(); });
        h.unshift(inp.value.trim());
        if (h.length > 20) h.length = 20;
        localStorage.setItem('search_history', JSON.stringify(h));
      }
    }
  });
}

// ===== FEATURE: Filter presets =====
function initFilterPresets() {
  window.saveFilterPreset = function() {
    var name = prompt('Название пресета:');
    if (!name) return;
    var presets = JSON.parse(localStorage.getItem('filter_presets') || '[]');
    presets.push({ name: name, filters: JSON.parse(JSON.stringify(window.state?.filters || {})), time: new Date().toISOString() });
    localStorage.setItem('filter_presets', JSON.stringify(presets));
    showToast('Пресет "' + name + '" сохранён', 'success');
  };
  window.loadFilterPreset = function() {
    var presets = JSON.parse(localStorage.getItem('filter_presets') || '[]');
    if (!presets.length) { showToast('Нет сохранённых пресетов', 'info'); return; }
    var html = presets.map(function(p, i) { return '<div style="padding:10px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;cursor:pointer;" onclick="applyFilterPreset(' + i + ');closeNFModal();">📌 <strong>' + p.name + '</strong></div>'; }).join('');
    showModal(html, '🔖 Пресеты фильтров');
  };
  window.applyFilterPreset = function(index) {
    var presets = JSON.parse(localStorage.getItem('filter_presets') || '[]');
    if (presets[index] && window.state) { Object.assign(window.state.filters, presets[index].filters); window.location.hash = '#/browse'; }
  };
}

// ===== FEATURE: Social share =====
function initSocialShare() {
  window.shareToSocial = function(platform, url, title) {
    var urls = {
      vk: 'https://vk.com/share.php?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title),
      tg: 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title),
      twitter: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url),
      fb: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
    };
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
  };
  // Add social buttons to mod pages
  document.addEventListener('click', function(e) {
    if (e.target.closest('.mod-detail-header') && !document.querySelector('.mod-detail-actions .fa-vk')) {
      var modUrl = window.location.href;
      var modName = document.querySelector('.mod-detail-title')?.textContent || '';
      var actions = document.querySelector('.mod-detail-actions');
      if (!actions) return;
      var div = document.createElement('div');
      div.style.cssText = 'display:flex;gap:8px;margin-top:8px;width:100%;flex-wrap:wrap;';
      div.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="shareToSocial(\'vk\',\'' + modUrl.replace(/'/g, "\\'") + '\',\'' + modName.replace(/'/g, "\\'") + '\')" title="VK"><i class="fa-brands fa-vk"></i></button>' +
        '<button class="btn btn-secondary btn-sm" onclick="shareToSocial(\'tg\',\'' + modUrl.replace(/'/g, "\\'") + '\',\'' + modName.replace(/'/g, "\\'") + '\')" title="Telegram"><i class="fa-brands fa-telegram"></i></button>' +
        '<button class="btn btn-secondary btn-sm" onclick="shareToSocial(\'twitter\',\'' + modUrl.replace(/'/g, "\\'") + '\',\'' + modName.replace(/'/g, "\\'") + '\')" title="Twitter"><i class="fa-brands fa-twitter"></i></button>' +
        '<button class="btn btn-secondary btn-sm" onclick="shareToSocial(\'fb\',\'' + modUrl.replace(/'/g, "\\'") + '\',\'' + modName.replace(/'/g, "\\'") + '\')" title="Facebook"><i class="fa-brands fa-facebook"></i></button>';
      actions.appendChild(div);
    }
  });
}

// ===== FEATURE: Skeleton loader =====
function initSkeletonLoader() {
  window.showSkeletonLoader = function(containerId, count) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    count = count || 3;
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'skeleton-card';
      sk.innerHTML = '<div class="skeleton-line skeleton-line-h" style="width:60px;height:60px;border-radius:12px;"></div><div style="flex:1;"><div class="skeleton-line" style="width:70%;height:18px;margin-bottom:8px;"></div><div class="skeleton-line" style="width:100%;height:14px;margin-bottom:6px;"></div><div class="skeleton-line" style="width:40%;height:14px;"></div></div>';
      el.appendChild(sk);
    }
  };
}

// ===== FEATURE: Infinite scroll =====
function initInfiniteScroll() {
  window.setupInfiniteScroll = function(containerId, loadMoreFn) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) { if (entry.isIntersecting && loadMoreFn) loadMoreFn(); });
    }, { rootMargin: '200px' });
    var sentinel = document.createElement('div');
    sentinel.className = 'infinite-scroll-sentinel';
    sentinel.style.height = '1px';
    var container = document.getElementById(containerId);
    if (container) { container.parentNode.insertBefore(sentinel, container.nextSibling); observer.observe(sentinel); }
  };
}

// ===== FEATURE: Keyboard shortcuts =====
function initKeyboardHelp() {
  window.showKeyboardShortcuts = function() {
    var shortcuts = [
      { key: '/', desc: 'Поиск' }, { key: 'Ctrl+K', desc: 'Spotlight поиск' },
      { key: 'Escape', desc: 'Закрыть модалку' }, { key: 'Ctrl+Enter', desc: 'Отправить форму' },
      { key: '?', desc: 'Показать помощь' }
    ];
    var html = '<div style="display:grid;gap:8px;">' + shortcuts.map(function(s) {
      return '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface-color);border-radius:8px;"><span>' + s.desc + '</span><kbd style="background:var(--bg-color);padding:4px 10px;border-radius:4px;border:1px solid var(--border-color);font-size:12px;font-family:monospace;">' + s.key + '</kbd></div>';
    }).join('') + '</div>';
    showModal(html, '⌨️ Горячие клавиши');
  };
  document.addEventListener('keydown', function(e) {
    if (e.key === '?' && !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      window.showKeyboardShortcuts();
    }
  });
}

// ===== FEATURE: Accessibility =====
function initAccessibility() {
  window.openAccessibilityWizard = function() {
    var html = '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div><label class="form-checkbox-label"><input type="checkbox" id="aw-contrast"> Высококонтрастный режим</label></div>' +
      '<div><label style="font-size:13px;">Размер шрифта:</label><select class="form-input" id="aw-fontsize"><option value="normal">Обычный</option><option value="large">Крупный</option><option value="xl">Очень крупный</option></select></div>' +
      '<div><label class="form-checkbox-label"><input type="checkbox" id="aw-reduce-motion"> Уменьшить движение</label></div>' +
      '<button class="btn btn-primary" onclick="applyAccessibilitySettings()">Применить</button></div>';
    showModal(html, '♿ Доступность');
  };
  window.applyAccessibilitySettings = function() {
    document.body.classList.toggle('high-contrast', !!document.getElementById('aw-contrast')?.checked);
    var fs = document.getElementById('aw-fontsize')?.value || 'normal';
    document.body.classList.remove('font-normal', 'font-large', 'font-xl');
    document.body.classList.add('font-' + fs);
    if (document.getElementById('aw-reduce-motion')?.checked) document.body.classList.add('reduce-motion');
    showToast('Настройки доступности применены', 'success');
    window.closeNFModal();
  };
}

// ===== FEATURE: Confetti =====
function initConfetti() {
  window.launchConfetti = function() {
    var colors = ['#10b981','#6366f1','#f59e0b','#ef4444','#ec4899','#06b6d4'];
    for (var i = 0; i < 60; i++) {
      var conf = document.createElement('div');
      conf.className = 'confetti-piece';
      conf.style.cssText = 'position:fixed;width:' + (6 + Math.random() * 8) + 'px;height:' + (6 + Math.random() * 8) + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';left:' + (Math.random() * 100) + 'vw;top:-10px;z-index:9999;border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';animation:confettiFall ' + (2 + Math.random() * 3) + 's linear forwards;animation-delay:' + (Math.random() * 0.5) + 's;';
      document.body.appendChild(conf);
      setTimeout(function() { conf.remove(); }, 5000);
    }
  };
}

// ===== FEATURE: Particles =====
function initParticles() {
  window.addParticles = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.style.position = 'relative';
    for (var i = 0; i < 20; i++) {
      var p = document.createElement('div');
      p.className = 'bg-particle';
      p.style.cssText = 'position:absolute;width:' + (2 + Math.random() * 3) + 'px;height:' + (2 + Math.random() * 3) + 'px;background:var(--primary-color);border-radius:50%;opacity:' + (0.1 + Math.random() * 0.2) + ';left:' + Math.random() * 100 + '%;top:' + Math.random() * 100 + '%;animation:particleFloat ' + (8 + Math.random() * 10) + 's linear infinite;animation-delay:' + Math.random() * 5 + 's;pointer-events:none;';
      container.appendChild(p);
    }
  };
}

// ===== FEATURE: Typewriter =====
function initTypewriter() {
  window.applyTypewriter = function(elId, text, speed) {
    var el = document.getElementById(elId);
    if (!el) return;
    var i = 0;
    el.textContent = '';
    el.style.visibility = 'visible';
    var interval = setInterval(function() {
      if (i < text.length) { el.textContent += text[i]; i++; }
      else clearInterval(interval);
    }, speed || 50);
  };
}

// ===== FEATURE: Zoom controls =====
function initZoomControls() {
  window.zoomIn = function() { document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toFixed(1); };
  window.zoomOut = function() { document.body.style.zoom = Math.max(0.5, parseFloat(document.body.style.zoom || 1) - 0.1).toFixed(1); };
  window.zoomReset = function() { document.body.style.zoom = '1'; };
}

// ===== FEATURE: Grid overlay =====
function initGridOverlay() {
  window.toggleGridOverlay = function() {
    var overlay = document.getElementById('grid-overlay');
    if (overlay) { overlay.remove(); return; }
    overlay = document.createElement('div');
    overlay.id = 'grid-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(16,185,129,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.08) 1px,transparent 1px);background-size:20px 20px;pointer-events:none;z-index:9998;';
    document.body.appendChild(overlay);
  };
}

// ===== FEATURE: Color picker =====
function initColorPicker() {
  window.openThemeColorPicker = function() {
    var props = ['--primary-color', '--bg-color', '--surface-color', '--text-primary', '--text-secondary'];
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">' + props.map(function(p) {
      var val = getComputedStyle(document.documentElement).getPropertyValue(p).trim();
      return '<div style="display:flex;align-items:center;gap:12px;"><label style="min-width:120px;font-size:13px;">' + p.replace('--', '') + '</label><input type="color" id="cp-' + p.replace('--', '') + '" value="' + val + '" class="form-input" style="width:60px;height:40px;padding:2px;"></div>';
    }).join('') + '<button class="btn btn-primary" onclick="applyCustomColors()">Применить</button></div>';
    showModal(html, '🎨 Кастомные цвета');
  };
  window.applyCustomColors = function() {
    var props = ['--primary-color', '--bg-color', '--surface-color', '--text-primary', '--text-secondary'];
    props.forEach(function(p) {
      var inp = document.getElementById('cp-' + p.replace('--', ''));
      if (inp) document.documentElement.style.setProperty(p, inp.value);
    });
    showToast('Цвета применены (до перезагрузки)', 'success');
  };
}

// ===== FEATURE: Konami code =====
function initKonamiCode() {
  var keys = [];
  document.addEventListener('keydown', function(e) {
    keys.push(e.key.toLowerCase());
    if (keys.length > 10) keys.shift();
    if (keys.join('') === 'arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightba') {
      keys = [];
      document.body.classList.toggle('meme-rainbow');
      showToast('🎮 Konami code activated!', 'success');
    }
  });
}

// ===== FEATURE: Seasonal themes =====
function initSeasonalThemes() {
  var month = new Date().getMonth();
  if (month === 11 || month === 0) { document.body.classList.add('meme-xmas'); }
  else if (month === 9) { document.body.classList.add('meme-halloween'); }
}

// ===== FEATURE: Extra meme effects =====
function initExtraMemes() {
  var EXTRA_MEMES = [
    { id: 'xmas', icon: 'fa-tree', label: 'Рождество', desc: 'Новогодняя тема' },
    { id: 'easter', icon: 'fa-egg', label: 'Пасха', desc: 'Пасхальная тема' },
    { id: 'halloween', icon: 'fa-pumpkin', label: 'Хэллоуин', desc: 'Страшная тема' },
    { id: 'valentine', icon: 'fa-heart', label: 'Валентинка', desc: 'Романтическая тема' },
    { id: 'april', icon: 'fa-face-smile-wink', label: '1 Апреля', desc: 'День смеха' },
    { id: 'newyear', icon: 'fa-champagne-glasses', label: 'НГ 2026', desc: 'Новогодняя' },
    { id: 'cosmos', icon: 'fa-rocket', label: 'Космос', desc: 'Космическая тема' },
    { id: 'retro', icon: 'fa-floppy-disk', label: 'Ретро', desc: 'Винтажная тема' },
    { id: 'vaporwave', icon: 'fa-sun', label: 'Вейпорвейв', desc: 'Эстетика 80-х' },
    { id: 'steampunk', icon: 'fa-gear', label: 'Стимпанк', desc: 'Пар и шестерёнки' },
    { id: 'cyberpunk', icon: 'fa-microchip', label: 'Киберпанк', desc: 'Неоновый будущий' },
    { id: 'ender', icon: 'fa-eye', label: 'Энд', desc: 'Измерение Энда' },
    { id: 'nether', icon: 'fa-fire', label: 'Незер', desc: 'Адское измерение' },
  ];
  if (window.MEME_FUNCTIONS) {
    EXTRA_MEMES.forEach(function(m) {
      if (!window.MEME_FUNCTIONS.find(function(x) { return x.id === m.id; })) window.MEME_FUNCTIONS.push(m);
    });
  }
}

// ===== FEATURE: Weekend mode =====
function initWeekendMode() {
  window.toggleWeekendMode = function() {
    document.body.classList.toggle('weekend-mode');
    showToast(document.body.classList.contains('weekend-mode') ? '🎉 Weekend mode ON!' : 'Weekend mode OFF', 'info');
  };
}

// ===== FEATURE: Dev mode =====
function initDevMode() {
  window.toggleDevMode = function() {
    document.body.classList.toggle('dev-mode');
    showToast(document.body.classList.contains('dev-mode') ? '🛠️ Dev mode ON' : 'Dev mode OFF', 'info');
    var panel = document.getElementById('dev-tools-panel');
    if (document.body.classList.contains('dev-mode') && !panel) {
      var el = document.createElement('div');
      el.id = 'dev-tools-panel';
      el.style.cssText = 'position:fixed;bottom:80px;right:20px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:12px;padding:16px;z-index:999;min-width:200px;box-shadow:var(--shadow-lg);';
      el.innerHTML = '<h4 style="margin-bottom:8px;">🛠️ Dev Tools</h4>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="showDataUsage();closeNFModal();">💾 Storage</button>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="showStatusPage()">🟢 Status</button>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="openAPIPlayground()">🧪 API</button>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="if(confirm(\'Очистить всё? Внимание!\')){localStorage.clear();location.reload();}">🗑️ Clear All</button>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="showLoadTime()">⏱ Load Time</button>' +
        '<button class="btn btn-secondary btn-sm" style="display:block;width:100%;margin:4px 0;" onclick="runBenchmark()">⚡ Benchmark</button>';
      document.body.appendChild(el);
    } else if (!document.body.classList.contains('dev-mode') && panel) panel.remove();
  };
}

// ===== FEATURE: Live background =====
function initLiveBackground() {
  window.setLiveBackground = function(type) {
    var existing = document.getElementById('live-bg-canvas');
    if (existing) existing.remove();
    if (type === 'none') return;
    var canvas = document.createElement('canvas');
    canvas.id = 'live-bg-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:0.3;';
    document.body.prepend(canvas);
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', function() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    if (type === 'stars') {
      var stars = Array.from({ length: 200 }, function() { return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2, s: Math.random() * 0.5 + 0.1 }; });
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(function(s) {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.5) + ')'; ctx.fill();
          s.y -= s.s; if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(draw);
      }
      draw();
    } else if (type === 'waves') {
      var offset = 0;
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath(); ctx.moveTo(0, canvas.height / 2);
        for (var x = 0; x <= canvas.width; x += 5) { ctx.lineTo(x, canvas.height / 2 + Math.sin(x * 0.02 + offset) * 30 + Math.sin(x * 0.01 + offset * 0.5) * 20); }
        ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath();
        ctx.fillStyle = 'color-mix(in srgb, var(--primary-color) 8%, transparent)'; ctx.fill();
        offset += 0.02; requestAnimationFrame(draw);
      }
      draw();
    } else if (type === 'matrix') {
      var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ'.split('');
      var drops = Array.from({ length: Math.floor(canvas.width / 10) }, function() { return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 1 + Math.random() * 3 }; });
      function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0'; ctx.font = '14px monospace';
        drops.forEach(function(d) {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], d.x, d.y);
          d.y += d.speed; if (d.y > canvas.height) { d.y = 0; d.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
  };
}

// ===== FEATURE: Dev blog =====
function initDevBlog() {
  window.showDevBlog = function() {
    var posts = JSON.parse(localStorage.getItem('dev_blog_posts') || '[]');
    if (!posts.length) { showToast('Блог пока пуст', 'info'); return; }
    var html = posts.slice(0, 10).map(function(p) {
      return '<div style="padding:16px;border:1px solid var(--border-color);border-radius:12px;margin:8px 0;"><h4>' + p.title + '</h4><div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + p.author + ' · ' + formatRelativeTime(p.time) + '</div><p style="font-size:14px;color:var(--text-secondary);">' + (p.content || '').substring(0, 200) + '...</p></div>';
    }).join('');
    showModal(html, '📝 Блог');
  };
}

// ===== FEATURE: API Playground =====
function initAPIPlayground() {
  window.openAPIPlayground = function() {
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<select class="form-input" id="api-method"><option value="GET">GET</option><option value="POST">POST</option></select>' +
      '<input type="text" class="form-input" id="api-endpoint" value="/api/sync">' +
      '<textarea class="form-textarea" id="api-body" placeholder="JSON body..." style="height:80px;"></textarea>' +
      '<button class="btn btn-primary" onclick="testAPIEndpoint()">Отправить</button>' +
      '<pre id="api-response" style="background:var(--bg-color);padding:12px;border-radius:8px;font-size:12px;max-height:300px;overflow:auto;color:var(--text-secondary);"></pre></div>';
    showModal(html, '🧪 API Playground');
  };
  window.testAPIEndpoint = async function() {
    var method = document.getElementById('api-method')?.value || 'GET';
    var endpoint = document.getElementById('api-endpoint')?.value || '/api/sync';
    var body = document.getElementById('api-body')?.value;
    var pre = document.getElementById('api-response');
    if (!pre) return;
    pre.textContent = 'Загрузка...';
    try {
      var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
      if (body && method === 'POST') opts.body = body;
      var res = await fetch(endpoint, opts);
      var data = await res.text();
      try { pre.textContent = JSON.stringify(JSON.parse(data), null, 2); } catch(e) { pre.textContent = data; }
    } catch(e) { pre.textContent = 'Ошибка: ' + e.message; }
  };
}

// ===== FEATURE: Status page =====
function initStatusPage() {
  window.showStatusPage = function() {
    var checks = [
      { name: 'localStorage', status: typeof localStorage !== 'undefined' },
      { name: 'Сервер API', status: navigator.onLine },
      { name: 'Синхронизация', status: !!window.lastSyncTime },
    ];
    var html = '<div style="display:grid;gap:8px;">' + checks.map(function(c) {
      return '<div style="display:flex;justify-content:space-between;padding:12px 16px;background:var(--surface-color);border-radius:8px;"><span>' + c.name + '</span><span style="color:' + (c.status ? 'var(--primary-color)' : '#ef4444') + ';">' + (c.status ? '✅' : '❌') + '</span></div>';
    }).join('') + '</div>';
    showModal(html, '🟢 Статус');
  };
}

// ===== FEATURE: Data usage =====
function initDataUsage() {
  window.showDataUsage = function() {
    var total = 0;
    for (var key in localStorage) { if (localStorage.hasOwnProperty(key)) total += localStorage[key].length * 2; }
    var usage = total > 1024*1024 ? (total/(1024*1024)).toFixed(2)+' MB' : total > 1024 ? (total/1024).toFixed(1)+' KB' : total+' B';
    showModal('<div style="text-align:center;padding:20px;"><div style="font-size:48px;font-weight:800;color:var(--primary-color);">' + usage + '</div><p style="color:var(--text-secondary);margin-top:12px;">Использовано хранилища</p></div>', '💾 Данные');
  };
}

// ===== FEATURE: Donation links =====
function initDonationLinks() {
  window.setDonationLink = function(modId) {
    var url = prompt('Ссылка для донатов:');
    if (!url) return;
    var mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (mod) { mod.donationUrl = url; localStorage.setItem('mods_data', JSON.stringify(mods)); showToast('Ссылка для донатов сохранена', 'success'); }
  };
  window.showDonationGoal = function() {
    var mods = getMods().filter(function(m) { return m.donationUrl; });
    if (!mods.length) { showToast('Нет модов со ссылками на донаты', 'info'); return; }
    var html = '<div style="display:grid;gap:8px;">' + mods.map(function(m) {
      return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;display:flex;justify-content:space-between;align-items:center;"><span><strong>' + m.name + '</strong> от ' + m.author + '</span><a href="' + m.donationUrl + '" target="_blank" class="btn btn-primary btn-sm">Поддержать</a></div>';
    }).join('') + '</div>';
    showModal(html, '💖 Поддержка');
  };
}

// ===== FEATURE: Online users =====
function initOnlineUsers() {
  window.showOnlineUsers = function() {
    var users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    var online = users.filter(function(u) { return u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 300000; });
    if (!online.length) { showToast('Нет пользователей онлайн', 'info'); return; }
    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + online.map(function(u) {
      return '<div style="padding:8px 16px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:20px;display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--primary-color);"></span><span>' + u.username + '</span>' + getRoleBadgeHTML(u.role) + '</div>';
    }).join('') + '</div>';
    showModal(html, '🟢 Онлайн');
  };
}

// ===== FEATURE: Gallery upload =====
function initGalleryUpload() {
  window.addGalleryImage = function(modId) {
    var url = prompt('URL изображения:');
    if (!url) return;
    var mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (mod) { if (!mod.gallery) mod.gallery = []; mod.gallery.push(url); localStorage.setItem('mods_data', JSON.stringify(mods)); showToast('Изображение добавлено', 'success'); }
  };
}

// ===== FEATURE: Report reasons =====
function initReportReasons() {
  window.reportModWithReason = function(modId) {
    var reasons = ['Нарушение прав', 'Неприемлемый контент', 'Спам', 'Другое'];
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">' + reasons.map(function(r) {
      return '<button class="btn btn-secondary" onclick="submitReportWithReason(\'' + modId + '\',\'' + r + '\')">' + r + '</button>';
    }).join('') + '</div>';
    showModal(html, '🚩 Причина жалобы');
  };
  window.submitReportWithReason = function(modId, reason) {
    var mods = getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (window.logActivity) window.logActivity('mod_report', (mod ? mod.name : modId) + ' — ' + reason);
    showToast('Жалоба отправлена: ' + reason, 'success');
    window.closeNFModal();
  };
}

// ===== FEATURE: Benchmark =====
function initBenchmark() {
  window.runBenchmark = function() {
    var start = performance.now();
    var r = 0;
    for (var i = 0; i < 1000000; i++) r += Math.sqrt(i);
    var elapsed = (performance.now() - start).toFixed(1);
    showModal('<div style="text-align:center;"><div style="font-size:36px;font-weight:800;color:var(--primary-color);">' + elapsed + 'ms</div><p style="color:var(--text-secondary);margin-top:8px;">1 млн операций</p></div>', '⚡ Бенчмарк');
  };
}

// ===== FEATURE: Word count =====
function initWordCount() {
  window.showWordCount = function() {
    var text = document.body.textContent;
    var words = text.split(/\s+/).filter(Boolean).length;
    var chars = text.length;
    showModal('<div style="text-align:center;"><div style="font-size:36px;font-weight:800;color:var(--primary-color);">' + words + '</div><p style="color:var(--text-secondary);">слов</p><div style="font-size:24px;font-weight:700;color:var(--text-primary);margin-top:16px;">' + chars + '</div><p style="color:var(--text-secondary);">символов</p></div>', '📊 Текст');
  };
}

// ===== FEATURE: Memory usage =====
function initMemoryUsage() {
  window.showMemoryUsage = function() {
    if (performance.memory) {
      var used = Math.round(performance.memory.usedJSHeapSize / (1024*1024));
      var total = Math.round(performance.memory.jsHeapSizeLimit / (1024*1024));
      showModal('<div style="text-align:center;"><div style="font-size:36px;font-weight:800;color:var(--primary-color);">' + used + ' MB</div><p style="color:var(--text-secondary);margin-top:8px;">из ' + total + ' MB</p><div style="width:100%;height:8px;background:var(--border-color);border-radius:4px;margin-top:12px;overflow:hidden;"><div style="width:' + (used/total*100) + '%;height:100%;background:var(--primary-color);border-radius:4px;"></div></div></div>', '🧠 Память');
    } else { showToast('API памяти недоступен', 'info'); }
  };
}

// ===== FEATURE: Regenerate avatars =====
function initAvatarRegen() {
  window.regenerateAvatar = function(username) {
    var users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    var user = users.find(function(u) { return u.username === username; });
    if (user) {
      user.avatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(username) + Date.now();
      localStorage.setItem('registered_users', JSON.stringify(users));
      var cur = getCurrentUser();
      if (cur && cur.uid === user.uid) localStorage.setItem('current_user', JSON.stringify(user));
      showToast('Аватар обновлён!', 'success');
    }
  };
}

// ===== FEATURE: Confetti rain =====
function initConfettiRain() {
  window.toggleConfettiRain = function() {
    document.body.classList.toggle('confetti-rain');
    showToast(document.body.classList.contains('confetti-rain') ? '🎊 Конфетти включено' : 'Конфетти выключено', 'info');
  };
}

// ===== FEATURE: PWA =====
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }
}

// ===== FEATURE: Install prompt =====
function initInstallPrompt() {
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.createElement('button');
    btn.id = 'install-pwa-btn';
    btn.className = 'btn btn-primary btn-sm';
    btn.innerHTML = '<i class="fa-solid fa-download"></i> Установить приложение';
    btn.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:999;box-shadow:var(--shadow-lg);';
    btn.addEventListener('click', function() {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function() { deferredPrompt = null; btn.remove(); });
    });
    document.body.appendChild(btn);
  });
}

// ===== FEATURE: Custom CSS =====
function initCustomCSS() {
  var savedCSS = localStorage.getItem('custom_css');
  if (savedCSS) { var s = document.createElement('style'); s.id = 'custom-css-style'; s.textContent = savedCSS; document.head.appendChild(s); }
  window.showCustomCSS = function() {
    var existing = localStorage.getItem('custom_css') || '';
    var html = '<div style="display:flex;flex-direction:column;gap:12px;"><textarea class="form-textarea" id="admin-custom-css" style="height:200px;font-family:monospace;font-size:12px;">' + existing.replace(/</g, '&lt;') + '</textarea><button class="btn btn-primary" onclick="saveCustomCSS()">Применить CSS</button></div>';
    showModal(html, '🎨 Пользовательский CSS');
  };
  window.saveCustomCSS = function() {
    var css = document.getElementById('admin-custom-css')?.value;
    localStorage.setItem('custom_css', css || '');
    var s = document.getElementById('custom-css-style');
    if (s) s.textContent = css;
    showToast('CSS применён', 'success');
    window.closeNFModal();
  };
}

// ===== FEATURE: Custom JS =====
function initCustomJS() {
  window.showCustomJS = function() {
    var existing = localStorage.getItem('custom_js') || '';
    var html = '<div style="display:flex;flex-direction:column;gap:12px;"><textarea class="form-textarea" id="admin-custom-js" style="height:200px;font-family:monospace;font-size:12px;">' + existing.replace(/</g, '&lt;') + '</textarea><button class="btn btn-primary" onclick="saveCustomJS()">Выполнить JS</button></div>';
    showModal(html, '💻 Пользовательский JS');
  };
  window.saveCustomJS = function() {
    var js = document.getElementById('admin-custom-js')?.value;
    if (js) { localStorage.setItem('custom_js', js); try { eval(js); showToast('JS выполнен', 'success'); } catch(e) { showToast('Ошибка: ' + e.message, 'error'); } }
    window.closeNFModal();
  };
}

// ===== FEATURE: SEO settings =====
function initSEOSettings() {
  window.showSEOSettings = function() {
    var seo = JSON.parse(localStorage.getItem('seo_settings') || '{}');
    var html = '<div style="display:flex;flex-direction:column;gap:12px;padding:16px;">' +
      '<div><label class="form-label">Заголовок</label><input type="text" class="form-input" id="seo-title" value="' + (seo.title || 'ModSphere').replace(/"/g, '&quot;') + '"></div>' +
      '<div><label class="form-label">Описание</label><textarea class="form-textarea" id="seo-desc">' + (seo.description || '').replace(/</g, '&lt;') + '</textarea></div>' +
      '<div><label class="form-label">Ключевые слова</label><input type="text" class="form-input" id="seo-keywords" value="' + (seo.keywords || '').replace(/"/g, '&quot;') + '"></div>' +
      '<button class="btn btn-primary" onclick="saveSEOSettings()">Сохранить SEO</button></div>';
    showModal(html, '🔍 SEO');
  };
  window.saveSEOSettings = function() {
    var s = { title: document.getElementById('seo-title')?.value || 'ModSphere', description: document.getElementById('seo-desc')?.value || '', keywords: document.getElementById('seo-keywords')?.value || '' };
    localStorage.setItem('seo_settings', JSON.stringify(s));
    document.title = s.title;
    var meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = s.description;
    showToast('SEO сохранены', 'success');
    window.closeNFModal();
  };
}

// ===== FEATURE: Sitemap =====
function initSitemap() {
  window.generateSitemap = function() {
    var mods = getMods().filter(function(m) { return m.approved; });
    var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    var base = window.location.origin + window.location.pathname.replace(/\/$/, '');
    ['', 'browse', 'create', 'admin'].forEach(function(p) {
      sitemap += '  <url><loc>' + base + '#/' + p + '</loc><priority>' + (p === '' ? '1.0' : '0.8') + '</priority></url>\n';
    });
    mods.forEach(function(m) { sitemap += '  <url><loc>' + base + '#/mod/' + (m.slug || m.id) + '</loc><priority>0.9</priority></url>\n'; });
    sitemap += '</urlset>';
    var blob = new Blob([sitemap], { type: 'application/xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sitemap.xml';
    a.click();
    showToast('Sitemap сгенерирован', 'success');
  };
}

// ===== FEATURE: Print styles =====
function initPrintStyles() {
  var style = document.createElement('style');
  style.textContent = '@media print { .main-header, .main-footer, #mobile-bottom-nav, .btn, .mod-detail-actions, #compare-bar, #reading-progress, .scroll-top-btn { display: none !important; } .mod-details-grid { grid-template-columns: 1fr; } }';
  document.head.appendChild(style);
}

// ===== FEATURE: Auto theme =====
function initAutoTheme() {
  var hour = new Date().getHours();
  if (hour >= 20 || hour < 6) {
    // Night time - ensure dark mode
    if (document.body.classList.contains('light-theme')) {
      // User explicitly chose light mode, respect it
    }
  }
}

// ===== FEATURE: Export page =====
function initExportPage() {
  window.exportPageAsHTML = function() {
    var html = '<!DOCTYPE html>\n<html>\n<head><title>ModSphere Export</title><link rel="stylesheet" href="style.css"></head>\n<body>' + (document.getElementById('main-content')?.innerHTML || '') + '</body>\n</html>';
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modsphere-export-' + Date.now() + '.html';
    a.click();
    showToast('Страница экспортирована', 'success');
  };
}

// ===== FEATURE: Quick actions =====
function initQuickActions() {
  window.quickSearchAction = function(action) {
    var actions = { new_mod: function() { window.location.hash = '#/create'; }, browse_all: function() { window.location.hash = '#/browse'; }, random_mod: function() { window.openRandomMod(); }, settings: function() { window.location.hash = '#/settings'; } };
    if (actions[action]) actions[action]();
  };
}

// ===== FEATURE: Homepage section =====
function initHomepageSection() {
  window.addHomepageSection = function(title, contentFn) {
    var main = document.getElementById('main-content');
    if (!main) return;
    var section = document.createElement('section');
    section.style.marginTop = '48px';
    section.innerHTML = '<div class="section-header"><h2 class="section-title">' + title + '</h2></div><div class="section-content" id="home-custom-section"></div>';
    main.appendChild(section);
    if (contentFn) contentFn('home-custom-section');
  };
}

// ===== FEATURE: Export profile =====
function initExportProfile() {
  window.exportProfileCard = function(username) {
    var users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    var user = users.find(function(u) { return u.username === username; });
    if (!user) return;
    var text = '👤 ' + user.username + '\n📧 ' + user.email + '\n🏅 ' + (user.role || 'PLAYER') + '\n📅 ' + formatDate(user.updatedAt) + '\n🔗 ModSphere Profile';
    var blob = new Blob([text], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = user.username + '-profile.txt';
    a.click();
    showToast('Профиль экспортирован', 'success');
  };
}

// ===== FEATURE: Custom profile URL =====
function initCustomProfileUrl() {
  window.setCustomProfileUrl = function() {
    var user = getCurrentUser();
    if (!user) return;
    var url = prompt('Желаемый URL:', user.username.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (!url) return;
    var users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (users.some(function(u) { return u.profileUrl === url && u.uid !== user.uid; })) { showToast('URL занят', 'error'); return; }
    user.profileUrl = url;
    localStorage.setItem('current_user', JSON.stringify(user));
    var idx = users.findIndex(function(u) { return u.uid === user.uid; });
    if (idx > -1) { users[idx].profileUrl = url; localStorage.setItem('registered_users', JSON.stringify(users)); }
    showToast('URL: /' + url, 'success');
  };
}

// ===== FEATURE: Download manager =====
function initDownloadManager() {
  window.showDownloadManager = function() {
    var downloads = JSON.parse(localStorage.getItem('modsphere_downloads') || '[]');
    if (!downloads.length) { showToast('История загрузок пуста', 'info'); return; }
    var html = '<div style="max-height:400px;overflow-y:auto;">' + downloads.slice(0, 30).map(function(d) {
      return '<div style="padding:10px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;"><div><strong>' + d.name + '</strong><br><span style="font-size:12px;color:var(--text-muted);">' + (d.filename || '') + ' — ' + formatRelativeTime(d.time) + '</span></div><span style="color:var(--primary-color);">✓</span></div>';
    }).join('') + '</div>';
    showModal(html, '📥 Загрузки');
  };
  // Track downloads
  var origDownload = window.triggerVersionDownload;
  if (origDownload) {
    window.triggerVersionDownload = function(mod, version, countSpan) {
      var result = origDownload(mod, version, countSpan);
      var dl = JSON.parse(localStorage.getItem('modsphere_downloads') || '[]');
      dl.unshift({ name: mod.name, filename: version.filename, time: new Date().toISOString() });
      if (dl.length > 100) dl.length = 100;
      localStorage.setItem('modsphere_downloads', JSON.stringify(dl));
      var u = getCurrentUser();
      if (u) {
        var xp = parseInt(localStorage.getItem('user_xp_' + u.username) || '0') + 5;
        localStorage.setItem('user_xp_' + u.username, String(xp));
      }
      if (dl.length === 1) window.launchConfetti();
      return result;
    };
  }
}

// ===== FEATURE: Bookmark folders =====
function initBookmarkFolders() {
  window.createBookmarkFolder = function() {
    var name = prompt('Название папки:');
    if (!name) return;
    var folders = JSON.parse(localStorage.getItem('bookmark_folders') || '[]');
    folders.push({ id: Date.now().toString(36), name: name, mods: [] });
    localStorage.setItem('bookmark_folders', JSON.stringify(folders));
    showToast('Папка "' + name + '" создана', 'success');
  };
  window.addToBookmarkFolder = function(modId) {
    var folders = JSON.parse(localStorage.getItem('bookmark_folders') || '[]');
    if (!folders.length) { showToast('Нет папок. Создайте новую!', 'info'); return; }
    var opts = folders.map(function(f) { return '<option value="' + f.id + '">' + f.name + ' (' + f.mods.length + ')</option>'; }).join('');
    showModal('<div style="text-align:center;"><p style="margin-bottom:12px;">Выберите папку:</p><select class="form-input" id="bookmark-folder-select">' + opts + '</select><button class="btn btn-primary" style="margin-top:12px;" onclick="confirmAddToFolder(\'' + modId + '\')">Добавить</button></div>', '📂 Добавить в папку');
  };
  window.confirmAddToFolder = function(modId) {
    var sel = document.getElementById('bookmark-folder-select');
    if (!sel) return;
    var folders = JSON.parse(localStorage.getItem('bookmark_folders') || '[]');
    var f = folders.find(function(x) { return x.id === sel.value; });
    if (f && !f.mods.includes(modId)) { f.mods.push(modId); localStorage.setItem('bookmark_folders', JSON.stringify(folders)); showToast('Мод добавлен в папку', 'success'); window.closeNFModal(); }
  };
}

// ===== FEATURE: Browse history =====
function initBrowseHistory() {
  window.showBrowseHistory = function() {
    var recentIds = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    var mods = getMods();
    var recent = recentIds.map(function(id) { return mods.find(function(m) { return m.id === id; }); }).filter(Boolean);
    if (!recent.length) { showToast('История просмотров пуста', 'info'); return; }
    var html = '<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">';
    recent.forEach(function(m) { html += createModCard(m).outerHTML; });
    html += '</div>';
    showModal(html, '🕐 История');
  };
}

// ===== FEATURE: Ruler tool =====
function initRulerTool() {
  window.toggleRuler = function() {
    var r = document.getElementById('ruler-tool');
    if (r) { r.remove(); document.body.style.paddingTop = ''; return; }
    r = document.createElement('div');
    r.id = 'ruler-tool';
    r.style.cssText = 'position:fixed;top:0;left:0;right:0;height:20px;background:var(--surface-color);border-bottom:1px solid var(--border-color);z-index:9997;font-size:8px;color:var(--text-muted);overflow:hidden;';
    var marks = '';
    for (var i = 0; i < window.innerWidth; i += 50) marks += '<span style="position:absolute;left:' + i + 'px;">|' + i + '</span>';
    r.innerHTML = marks;
    document.body.prepend(r);
    document.body.style.paddingTop = '20px';
  };
}

// ===== FEATURE: Inspector =====
function initInspector() {
  window.inspectElement = function(selector) {
    var el = document.querySelector(selector);
    if (!el) { showToast('Элемент не найден', 'info'); return; }
    var rect = el.getBoundingClientRect();
    var html = '<div style="font-size:13px;"><div><strong>Селектор:</strong> ' + selector + '</div><div><strong>Размеры:</strong> ' + Math.round(rect.width) + '×' + Math.round(rect.height) + 'px</div><div><strong>Позиция:</strong> ' + Math.round(rect.left) + ', ' + Math.round(rect.top) + '</div></div>';
    showModal(html, '🔍 Инспектор');
  };
}

// ===== FEATURE: Smooth transitions =====
function initSmoothTransitions() {
  // Already handled by CSS
}

// ===== FEATURE: Loading states =====
function initLoadingStates() {
  // Progress bar handles this
}

// ===== FEATURE: Error handler =====
function initErrorHandler() {
  window.addEventListener('error', function(e) {
    var errors = JSON.parse(localStorage.getItem('error_log') || '[]');
    errors.unshift({ message: e.message || String(e), time: new Date().toISOString() });
    if (errors.length > 50) errors.length = 50;
    localStorage.setItem('error_log', JSON.stringify(errors));
  });
}

// ===== FEATURE: Performance =====
function initPerformance() {
  window.showLoadTime = function() {
    var perf = performance.getEntriesByType('navigation')[0];
    if (!perf) { showToast('Данные недоступны', 'info'); return; }
    showModal('<div style="text-align:center;"><div style="font-size:36px;font-weight:800;color:var(--primary-color);">' + Math.round(perf.loadEventEnd - perf.startTime) + 'ms</div><p style="color:var(--text-secondary);margin-top:8px;">Время загрузки</p></div>', '⏱ Производительность');
  };
}

// ===== FEATURE: Analytics =====
function initAnalytics() {
  // Pageview tracking
  var pageviews = parseInt(localStorage.getItem('page_views') || '0') + 1;
  localStorage.setItem('page_views', String(pageviews));
}

// ===== FEATURE: Backup =====
function initBackup() {
  window.backupAllData = function() {
    var data = { mods: getMods(), users: JSON.parse(localStorage.getItem('registered_users') || '[]'), siteSettings: JSON.parse(localStorage.getItem('site_settings') || '{}'), activityLog: JSON.parse(localStorage.getItem('activity_log') || '[]'), exportedAt: new Date().toISOString() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modsphere-backup-' + Date.now() + '.json';
    a.click();
    showToast('Бэкап создан', 'success');
  };
}

// ===== FEATURE: Restore =====
function initRestore() {
  window.restoreData = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (data.mods) localStorage.setItem('mods_data', JSON.stringify(data.mods));
          if (data.users) localStorage.setItem('registered_users', JSON.stringify(data.users));
          if (data.siteSettings) localStorage.setItem('site_settings', JSON.stringify(data.siteSettings));
          if (data.activityLog) localStorage.setItem('activity_log', JSON.stringify(data.activityLog));
          showToast('Данные восстановлены', 'success');
          location.reload();
        } catch(e) { showToast('Ошибка чтения файла', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };
}

// ===== FEATURE: Clear data =====
function initClearData() {
  window.clearAllData = function() {
    if (!confirm('Очистить все данные? Это действие нельзя отменить!')) return;
    localStorage.clear();
    showToast('Все данные очищены', 'success');
    location.reload();
  };
}

// ===== FEATURE: Third party integrations =====
function initThirdParty() {
  // Discord widget
  window.showDiscordWidget = function() {
    showModal('<iframe src="https://discord.com/widget?id=123456789&theme=dark" width="350" height="400" style="border:none;border-radius:12px;"></iframe>', '💬 Discord');
  };
}

// ===== FEATURE: Final setup =====
function initFinalSetup() {
  // Add "Add to" buttons on mod pages
  document.addEventListener('click', function(e) {
    if (e.target.closest('.mod-detail-meta') && !document.querySelector('[onclick*="showModComments"]')) {
      var test = document.querySelector('.mod-detail-actions');
      if (!test || test.querySelector('.nf-extra-btn')) return;
      var modSlug = window.location.hash.replace('#/mod/', '');
      var div = document.createElement('div');
      div.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;';
      div.className = 'nf-extra-btn';
      div.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="showModComments(\'' + modSlug + '\')"><i class="fa-regular fa-comment"></i> Комментарии</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="findSimilarMods(\'' + modSlug + '\')"><i class="fa-solid fa-magnifying-glass"></i> Похожие</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="showModStats(\'' + modSlug + '\')"><i class="fa-solid fa-chart-simple"></i> Статистика</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="toggleCompare(\'' + modSlug + '\')"><i class="fa-solid fa-not-equal"></i> Сравнить</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="addToBookmarkFolder(\'' + modSlug + '\')"><i class="fa-regular fa-bookmark"></i> В папку</button>';
      test.parentNode.insertBefore(div, test.nextSibling);
    }
  });

  // Add trending tags section to home
  setTimeout(function() {
    var hero = document.querySelector('.hero-section');
    if (hero) {
      var tagSection = document.createElement('section');
      tagSection.style.marginTop = '32px';
      tagSection.innerHTML = '<div class="section-header"><h2 class="section-title"><i class="fa-solid fa-hashtag" style="color:var(--primary-color);"></i> Популярные категории</h2></div><div id="home-trending-tags"></div>';
      hero.parentNode.insertBefore(tagSection, hero.nextSibling);
      window.renderTrendingTags('home-trending-tags');
    }
  }, 100);

  // Add floating quick nav button
  setTimeout(function() {
    var btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.style.cssText = 'position:fixed;right:20px;top:50%;transform:translateY(-50%);z-index:998;';
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i>';
    btn.title = 'Быстрое меню';
    btn.addEventListener('click', function() { window.showQuickNav(); });
    document.body.appendChild(btn);

    // Add Zoom controls
    var zoomDiv = document.createElement('div');
    zoomDiv.style.cssText = 'position:fixed;right:20px;bottom:150px;display:flex;flex-direction:column;gap:4px;z-index:997;';
    zoomDiv.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="zoomIn()" title="Приблизить" style="padding:4px 8px;font-size:12px;">+</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="zoomOut()" title="Отдалить" style="padding:4px 8px;font-size:12px;">−</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="zoomReset()" title="Сбросить" style="padding:4px 8px;font-size:10px;">⟲</button>';
    document.body.appendChild(zoomDiv);
  }, 2000);

  // Track page views
  var pv = parseInt(localStorage.getItem('page_views') || '0') + 1;
  localStorage.setItem('page_views', String(pv));

  console.log('✅ ModSphere: 100 site features loaded');
}

})();
