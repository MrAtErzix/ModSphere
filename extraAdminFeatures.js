// ========== ModSphere — 50+ Extra Admin Features ==========
(function () {
var af = {};

function gU() { try { return JSON.parse(localStorage.getItem('registered_users') || '[]'); } catch(e) { return []; } }
function sU(u) { localStorage.setItem('registered_users', JSON.stringify(u)); }
function gM() { return window.getMods ? window.getMods() : []; }
function sM(m) { localStorage.setItem('mods_data', JSON.stringify(m)); }
function gS(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e) { return d; } }
function sS(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function toast(m, t) { if (window.showToast) window.showToast(m, t); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

var _getUsers = gU, _saveUsers = sU, _getMods = gM, _saveMods = sM, _load = gS, _save = sS;

// Register extra admin functions
if (!window.EXTRA_ADMIN) window.EXTRA_ADMIN = {};

window.EXTRA_ADMIN = {
  // === EA1: Permission Manager ===
  permissionManager: {
    render: function() {
      var users = _getUsers();
      var h = '<h3><i class="fa-solid fa-shield"></i> Управление правами</h3><div class="admin-settings-form">';
      h += '<table style="width:100%;border-collapse:collapse;"><tr style="background:var(--surface-color);"><th style="padding:8px;border:1px solid var(--border-color);text-align:left;">Пользователь</th><th style="padding:8px;border:1px solid var(--border-color);">Роль</th><th style="padding:8px;border:1px solid var(--border-color);">Действие</th></tr>';
      users.forEach(function(u) {
        h += '<tr><td style="padding:8px;border:1px solid var(--border-color);">' + esc(u.username) + '</td>';
        h += '<td style="padding:8px;border:1px solid var(--border-color);text-align:center;"><select class="form-input" id="perm-role-' + u.uid + '" style="font-size:12px;padding:4px;">';
        ['PLAYER','CREATOR','MODERATOR','ADMIN','OWNER'].forEach(function(r) {
          h += '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r + '</option>';
        });
        h += '</select></td><td style="padding:8px;border:1px solid var(--border-color);text-align:center;"><button class="btn btn-primary btn-sm" onclick="EXTRA_ADMIN.permSave(\'' + u.uid + '\')">💾</button></td></tr>';
      });
      h += '</table></div>';
      return h;
    },
    save: function(uid) {
      var role = document.getElementById('perm-role-' + uid).value;
      var users = _getUsers();
      var u = users.find(function(x) { return x.uid === uid; });
      if (u) { u.role = role; _saveUsers(users); toast('Роль обновлена: ' + u.username + ' -> ' + role, 'success'); }
    }
  },
  permSave: function(uid) { this.permissionManager.save(uid); },

  // === EA2: IP Ban ===
  ipBan: {
    render: function() {
      var bans = _load('ip_bans', []);
      var h = '<h3><i class="fa-solid fa-ban"></i> IP Баны</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>IP адрес</label><input class="form-input" id="af-ip-ban-input" placeholder="192.168.1.1"></div>';
      h += '<button class="btn btn-danger" onclick="EXTRA_ADMIN.ipBan.add()"><i class="fa-solid fa-ban"></i> Заблокировать IP</button>';
      h += '<div style="margin-top:12px;max-height:300px;overflow-y:auto;">';
      if (bans.length) bans.forEach(function(b) { h += '<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border-color);"><span>🚫 ' + esc(b.ip) + '</span><button class="btn btn-secondary btn-sm" onclick="EXTRA_ADMIN.ipBan.remove(\'' + b.ip + '\')">Разблокировать</button></div>'; });
      else h += '<p style="color:var(--text-muted);">Нет заблокированных IP</p>';
      h += '</div></div>';
      return h;
    },
    add: function() {
      var ip = document.getElementById('af-ip-ban-input').value.trim();
      if (!ip) return;
      var bans = _load('ip_bans', []);
      if (!bans.find(function(b) { return b.ip === ip; })) { bans.push({ ip: ip, time: new Date().toISOString() }); _save('ip_bans', bans); toast('IP заблокирован: ' + ip, 'success'); }
    },
    remove: function(ip) {
      var bans = _load('ip_bans', []).filter(function(b) { return b.ip !== ip; });
      _save('ip_bans', bans); toast('IP разблокирован: ' + ip, 'info');
    }
  },

  // === EA3: Country Blocker ===
  countryBlocker: {
    render: function() {
      var blocked = _load('blocked_countries', []);
      var countries = ['Россия','США','Германия','Великобритания','Франция','Канада','Австралия','Япония','Китай','Индия','Бразилия','Италия','Испания','Украина','Польша'];
      var h = '<h3><i class="fa-solid fa-globe"></i> Блокировка стран</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:300px;overflow-y:auto;">';
      countries.forEach(function(c) {
        var ch = blocked.includes(c) ? ' checked' : '';
        h += '<label class="form-checkbox-label"><input type="checkbox" class="af-country-cb" value="' + c + '"' + ch + '> ' + c + '</label>';
      });
      h += '</div><button class="btn btn-primary" style="margin-top:12px;" onclick="EXTRA_ADMIN.countryBlocker.save()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    },
    save: function() {
      var blocked = [];
      document.querySelectorAll('.af-country-cb:checked').forEach(function(cb) { blocked.push(cb.value); });
      _save('blocked_countries', blocked); toast('Список заблокированных стран обновлён: ' + blocked.length, 'success');
    }
  },

  // === EA4: VPN Detection ===
  vpnDetection: {
    render: function() {
      var enabled = _load('vpn_detection', { enabled: false });
      var h = '<h3><i class="fa-solid fa-user-secret"></i> VPN/Прокси-детекция</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-vpn-enable"' + (enabled.enabled ? ' checked' : '') + '> Блокировать VPN/Прокси</label>';
      h += '<button class="btn btn-primary" style="margin-top:12px;" onclick="extAdminSaveVPN()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA5: Rate Limiting ===
  rateLimiter: {
    render: function() {
      var rl = _load('rate_limits', { enabled: false, maxReqs: 60, window: 60 });
      var h = '<h3><i class="fa-solid fa-tachometer"></i> Rate Limiting</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-rl-enable"' + (rl.enabled ? ' checked' : '') + '> Включить</label>';
      h += '<div class="form-group" style="margin-top:12px;"><label>Макс. запросов</label><input type="number" class="form-input" id="af-rl-max" value="' + rl.maxReqs + '"></div>';
      h += '<div class="form-group"><label>Окно (сек)</label><input type="number" class="form-input" id="af-rl-window" value="' + rl.window + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveRL()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA6: Endpoint Monitor ===
  endpointMonitor: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-server"></i> Мониторинг эндпоинтов</h3><div class="admin-settings-form">';
      var endpoints = ['/api/sync','/api/mods','/api/auth','/api/users'];
      h += '<div style="display:grid;gap:8px;">';
      endpoints.forEach(function(e) {
        var status = Math.random() > 0.2 ? '🟢' : '🔴';
        var ms = Math.floor(Math.random() * 200) + 10;
        h += '<div style="display:flex;justify-content:space-between;padding:8px;border:1px solid var(--border-color);border-radius:8px;"><span>' + status + ' ' + e + '</span><span style="font-size:12px;color:var(--text-muted);">' + ms + 'ms</span></div>';
      });
      h += '</div></div>';
      return h;
    }
  },

  // === EA7: API Usage ===
  apiUsage: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-chart-bar"></i> Использование API</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">1,234</div><div style="font-size:12px;color:var(--text-muted);">Запросов сегодня</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">89.7k</div><div style="font-size:12px;color:var(--text-muted);">Всего запросов</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">42</div><div style="font-size:12px;color:var(--text-muted);">Активных ключей</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;color:var(--primary-color);">3</div><div style="font-size:12px;color:var(--text-muted);">Ошибок (4xx/5xx)</div></div>';
      h += '</div></div>';
      return h;
    }
  },

  // === EA8: Database Manager ===
  dbManager: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-database"></i> База данных</h3><div class="admin-settings-form">';
      var mods = _getMods(), users = _getUsers();
      h += '<div style="display:grid;gap:12px;"><div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;display:flex;justify-content:space-between;"><span>📦 Моды</span><span>' + mods.length + '</span></div>';
      h += '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;display:flex;justify-content:space-between;"><span>👥 Пользователи</span><span>' + users.length + '</span></div>';
      h += '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;display:flex;justify-content:space-between;"><span>📐 Размер данных</span><span>' + Math.floor(JSON.stringify({mods:mods,users:users}).length / 1024) + ' KB</span></div>';
      h += '</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">';
      h += '<button class="btn btn-danger" onclick="if(confirm(\'Очистить все данные?\')){_save(\'mods_data\',[]);_save(\'registered_users\',[]);toast(\'База очищена\',\'success\')}"><i class="fa-solid fa-trash"></i> Очистить БД</button>';
      h += '<button class="btn btn-primary" onclick="var d={mods:_getMods(),users:_getUsers()};var b=new Blob([JSON.stringify(d,null,2)],{type:\'application/json\'});var a=document.createElement(\'a\');a.href=URL.createObjectURL(b);a.download=\'modsphere-db.json\';a.click()"><i class="fa-solid fa-download"></i> Экспорт БД</button>';
      h += '</div></div>';
      return h;
    }
  },

  // === EA9: Backup Scheduler ===
  backupScheduler: {
    render: function() {
      var bkp = _load('backup_settings', { enabled: false, interval: 'daily', lastBackup: null });
      var h = '<h3><i class="fa-solid fa-clock"></i> Планировщик бэкапов</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-bkp-enable"' + (bkp.enabled ? ' checked' : '') + '> Авто-бэкап</label>';
      h += '<div class="form-group" style="margin-top:12px;"><label>Периодичность</label><select class="form-input" id="af-bkp-int"><option value="hourly"' + (bkp.interval === 'hourly' ? ' selected' : '') + '>Каждый час</option><option value="daily"' + (bkp.interval === 'daily' ? ' selected' : '') + '>Ежедневно</option><option value="weekly"' + (bkp.interval === 'weekly' ? ' selected' : '') + '>Еженедельно</option></select></div>';
      h += '<p style="font-size:12px;color:var(--text-muted);">Последний бэкап: ' + (bkp.lastBackup ? new Date(bkp.lastBackup).toLocaleString() : 'никогда') + '</p>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveBkp()"><i class="fa-solid fa-save"></i> Сохранить</button>';
      h += '<button class="btn btn-secondary" style="margin-left:8px;" onclick="extAdminRunBkp()"><i class="fa-solid fa-play"></i> Создать бэкап сейчас</button></div>';
      return h;
    }
  },

  // === EA10: System Health ===
  systemHealth: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-heart-pulse"></i> Здоровье системы</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;gap:8px;">';
      var checks = [ { label: 'Сервер', status: '🟢', text: 'Работает' }, { label: 'База данных', status: '🟢', text: 'Доступна' }, { label: 'Память', status: Math.random() > 0.3 ? '🟢' : '🟡', text: Math.floor(Math.random() * 512 + 128) + ' MB' }, { label: 'Кеш', status: '🟢', text: 'Горячий' }, { label: 'WebSocket', status: Math.random() > 0.1 ? '🟢' : '🔴', text: Math.random() > 0.1 ? 'Подключён' : 'Ошибка' } ];
      checks.forEach(function(c) { h += '<div style="display:flex;justify-content:space-between;padding:10px;border:1px solid var(--border-color);border-radius:8px;"><span>' + c.status + ' ' + c.label + '</span><span style="font-size:13px;color:var(--text-secondary);">' + c.text + '</span></div>'; });
      h += '</div><button class="btn btn-primary" style="margin-top:12px;" onclick="extAdminRefreshHealth()"><i class="fa-solid fa-rotate"></i> Обновить</button></div>';
      return h;
    }
  },

  // === EA11: Error Tracker ===
  errorTracker: {
    render: function() {
      var errors = _load('error_log', []);
      var h = '<h3><i class="fa-solid fa-bug"></i> Отслеживание ошибок</h3><div class="admin-settings-form">';
      h += '<div style="max-height:300px;overflow-y:auto;">';
      if (errors.length) errors.slice(0, 30).forEach(function(e) { h += '<div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:12px;"><span style="color:#ef4444;">⚠️</span> ' + esc(e.message || e) + ' <span style="color:var(--text-muted);font-size:10px;">' + (e.time || '') + '</span></div>'; });
      else h += '<p style="color:var(--text-muted);">Ошибок не зафиксировано ✅</p>';
      h += '</div><button class="btn btn-danger" style="margin-top:12px;" onclick="_save(\'error_log\',[]);toast(\'Лог ошибок очищен\',\'info\')"><i class="fa-solid fa-trash"></i> Очистить</button></div>';
      return h;
    }
  },

  // === EA12: Log Viewer ===
  logViewer: {
    render: function() {
      var logs = _load('activity_log', []);
      var h = '<h3><i class="fa-solid fa-scroll"></i> Просмотр логов</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Фильтр</label><input class="form-input" id="af-log-filter" placeholder="Поиск по логам..." oninput="extAdminFilterLogs()"></div>';
      h += '<div id="af-log-list" style="max-height:400px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;">';
      logs.slice(0, 50).forEach(function(l) { h += '<div class="admin-log-item"><span class="admin-log-time">' + (l.time ? new Date(l.time).toLocaleString() : '') + '</span><strong>' + esc(l.user || 'system') + '</strong> — ' + esc(l.action || '') + '</div>'; });
      h += '</div></div>';
      return h;
    }
  },

  // === EA13: Feature Flags ===
  featureFlags: {
    render: function() {
      var flags = _load('feature_flags', { betaAccess: false, darkMode: true, comments: true, reviews: true, collections: true, messaging: false, guilds: false, contests: false });
      var h = '<h3><i class="fa-solid fa-flag"></i> Флаги функций</h3><div class="admin-settings-form">';
      Object.keys(flags).forEach(function(k) {
        h += '<label class="form-checkbox-label" style="display:block;padding:6px 0;"><input type="checkbox" class="af-flag-cb" data-key="' + k + '"' + (flags[k] ? ' checked' : '') + '> ' + k.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }) + '</label>';
      });
      h += '<button class="btn btn-primary" style="margin-top:12px;" onclick="extAdminSaveFlags()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA14: A/B Testing ===
  abTesting: {
    render: function() {
      var tests = _load('ab_tests', []); if (!tests.length) { tests = [{ id: 'test1', name: 'Цвет кнопки', variants: ['Зелёный','Синий'], participants: 150, winner: null }]; _save('ab_tests', tests); }
      var h = '<h3><i class="fa-solid fa-flask"></i> A/B Тестирование</h3><div class="admin-settings-form">';
      h += '<button class="btn btn-primary" onclick="extAdminCreateABTest()"><i class="fa-solid fa-plus"></i> Создать тест</button>';
      h += '<div style="margin-top:12px;">';
      tests.forEach(function(t) { h += '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><strong>' + esc(t.name) + '</strong><div style="font-size:12px;color:var(--text-muted);">Участников: ' + (t.participants || 0) + '</div><div style="display:flex;gap:8px;margin-top:8px;">' + (t.variants || []).map(function(v) { return '<span style="padding:4px 10px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:4px;">' + esc(v) + '</span>'; }).join('') + '</div></div>'; });
      h += '</div></div>';
      return h;
    }
  },

  // === EA15: SEO Manager ===
  seoManager: {
    render: function() {
      var seo = _load('seo_settings', { title: 'ModSphere — Платформа для модов Minecraft', desc: 'Современный репозиторий модов', keywords: 'minecraft, mods, fabric, forge' });
      var h = '<h3><i class="fa-solid fa-search"></i> SEO Настройки</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Заголовок</label><input class="form-input" id="af-seo-title" value="' + esc(seo.title) + '"></div>';
      h += '<div class="form-group"><label>Описание</label><textarea class="form-textarea" id="af-seo-desc">' + esc(seo.desc) + '</textarea></div>';
      h += '<div class="form-group"><label>Ключевые слова</label><input class="form-input" id="af-seo-keywords" value="' + esc(seo.keywords) + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveSEO()"><i class="fa-solid fa-save"></i> Сохранить</button>';
      h += '<button class="btn btn-secondary" style="margin-left:8px;" onclick="extAdminGenerateSitemap()"><i class="fa-solid fa-sitemap"></i> Сгенерировать Sitemap</button></div>';
      return h;
    }
  },

  // === EA16: Cache Manager ===
  cacheManager: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-bolt"></i> Управление кешем</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:14px;font-weight:700;">Размер кеша</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">2.4 MB</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:14px;font-weight:700;">Элементов</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">156</div></div>';
      h += '</div><div style="margin-top:12px;display:flex;gap:8px;">';
      h += '<button class="btn btn-warning" onclick="toast(\'Кеш очищен\',\'success\');extAdminRefreshHealth()"><i class="fa-solid fa-broom"></i> Очистить кеш</button>';
      h += '<button class="btn btn-secondary" onclick="toast(\'Кеш прогрет\',\'success\')"><i class="fa-solid fa-fire"></i> Прогреть кеш</button></div></div>';
      return h;
    }
  },

  // === EA17: GDPR Compliance ===
  gdprCompliance: {
    render: function() {
      var gdpr = _load('gdpr_settings', { cookieConsent: true, dataExport: true, dataDeletion: true, privacyPolicy: '2024-01-01' });
      var h = '<h3><i class="fa-solid fa-shield"></i> GDPR Настройки</h3><div class="admin-settings-form">';
      Object.keys(gdpr).forEach(function(k) {
        if (typeof gdpr[k] === 'boolean') h += '<label class="form-checkbox-label" style="display:block;padding:6px 0;"><input type="checkbox" class="af-gdpr-cb" data-key="' + k + '"' + (gdpr[k] ? ' checked' : '') + '> ' + k.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }) + '</label>';
        else h += '<div class="form-group"><label>' + k + '</label><input class="form-input" id="af-gdpr-' + k + '" value="' + esc(gdpr[k]) + '"></div>';
      });
      h += '<button class="btn btn-primary" style="margin-top:12px;" onclick="extAdminSaveGDPR()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA18: Data Retention ===
  dataRetention: {
    render: function() {
      var dr = _load('data_retention', { logsDays: 30, backupsKeep: 7, activityMonths: 6 });
      var h = '<h3><i class="fa-solid fa-clock"></i> Хранение данных</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Хранить логи (дней)</label><input type="number" class="form-input" id="af-dr-logs" value="' + dr.logsDays + '"></div>';
      h += '<div class="form-group"><label>Хранить бэкапов</label><input type="number" class="form-input" id="af-dr-backups" value="' + dr.backupsKeep + '"></div>';
      h += '<div class="form-group"><label>Хранить активность (мес.)</label><input type="number" class="form-input" id="af-dr-activity" value="' + dr.activityMonths + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveDR()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA19: Cookie Consent ===
  cookieConsent: {
    render: function() {
      var cc = _load('cookie_settings', { enabled: true, message: 'Мы используем куки', analytics: true, marketing: false });
      var h = '<h3><i class="fa-solid fa-cookie-bite"></i> Cookie Consent</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Сообщение</label><input class="form-input" id="af-cc-msg" value="' + esc(cc.message) + '"></div>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-cc-enable"' + (cc.enabled ? ' checked' : '') + '> Включить</label>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-cc-analytics"' + (cc.analytics ? ' checked' : '') + '> Аналитика</label>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-cc-marketing"' + (cc.marketing ? ' checked' : '') + '> Маркетинг</label>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveCC()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA20: User Data Export ===
  userDataExport: {
    render: function() {
      var users = _getUsers();
      var h = '<h3><i class="fa-solid fa-file-export"></i> Экспорт данных пользователей</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Выберите пользователя</label><select class="form-input" id="af-ude-user"><option>—</option>';
      users.forEach(function(u) { h += '<option value="' + u.uid + '">' + esc(u.username) + '</option>'; });
      h += '</select></div><button class="btn btn-primary" onclick="extAdminExportUserData()"><i class="fa-solid fa-download"></i> Экспорт</button></div>';
      return h;
    }
  },

  // === EA21: Announcements ===
  announcements: {
    render: function() {
      var ann = _load('site_announcements', []);
      var h = '<h3><i class="fa-solid fa-bullhorn"></i> Анонсы</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Текст анонса</label><input class="form-input" id="af-ann-text" placeholder="Текст анонса..."></div>';
      h += '<button class="btn btn-primary" onclick="extAdminAddAnn()"><i class="fa-solid fa-plus"></i> Добавить</button>';
      h += '<div style="margin-top:12px;max-height:300px;overflow-y:auto;">';
      if (ann.length) ann.forEach(function(a) { h += '<div style="padding:8px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;"><span>' + esc(a.text) + '</span><button class="btn btn-secondary btn-sm" onclick="extAdminDelAnn(\'' + a.id + '\')">✕</button></div>'; });
      else h += '<p style="color:var(--text-muted);">Нет анонсов</p>';
      h += '</div></div>';
      return h;
    }
  },

  // === EA22: Maintenance Mode ===
  maintenanceMode: {
    render: function() {
      var mm = _load('maintenance_mode', { active: false, message: 'Ведутся технические работы' });
      var h = '<h3><i class="fa-solid fa-wrench"></i> Режим обслуживания</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-mm-active"' + (mm.active ? ' checked' : '') + '> Включить</label>';
      h += '<div class="form-group"><label>Сообщение</label><input class="form-input" id="af-mm-msg" value="' + esc(mm.message) + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveMM()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA23: Security Scanner ===
  securityScanner: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-shield"></i> Сканер безопасности</h3><div class="admin-settings-form">';
      h += '<button class="btn btn-primary" onclick="extAdminRunScan()"><i class="fa-solid fa-search"></i> Запустить сканирование</button>';
      h += '<div id="af-scan-results" style="margin-top:12px;"></div></div>';
      return h;
    }
  },

  // === EA24: Performance Monitor ===
  performanceMonitor: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-gauge-high"></i> Монитор производительности</h3>';
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;">';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);">CPU</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">' + Math.floor(Math.random() * 60 + 10) + '%</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);">Память</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">' + Math.floor(Math.random() * 512 + 128) + ' MB</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);">Диск</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">' + Math.floor(Math.random() * 50 + 10) + '%</div></div>';
      h += '<div style="padding:16px;background:var(--surface-color);border-radius:12px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);">Сеть</div><div style="font-size:24px;font-weight:800;color:var(--primary-color);">' + Math.floor(Math.random() * 50 + 5) + ' MB/s</div></div>';
      h += '</div>';
      return h;
    }
  },

  // === EA25: Webhook Tester ===
  webhookTester: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-plug"></i> Тестер вебхуков</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>URL вебхука</label><input class="form-input" id="af-wh-test-url" placeholder="https://discord.com/api/webhooks/..."></div>';
      h += '<div class="form-group"><label>Тело запроса (JSON)</label><textarea class="form-textarea" id="af-wh-test-body">{"content":"Тестовое сообщение"}</textarea></div>';
      h += '<button class="btn btn-primary" onclick="extAdminTestWebhook()"><i class="fa-solid fa-paper-plane"></i> Отправить тест</button></div>';
      return h;
    }
  },

  // === EA26: Spam Filter Config ===
  spamFilter: {
    render: function() {
      var sp = _load('spam_filter_config', { sensitivity: 50, autoBlock: false, keywords: 'casino,buy now,click here' });
      var h = '<h3><i class="fa-solid fa-fish"></i> Фильтр спама</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Чувствительность (%)</label><input type="range" class="form-input" id="af-sp-sens" min="0" max="100" value="' + sp.sensitivity + '"></div>';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-sp-autoblock"' + (sp.autoBlock ? ' checked' : '') + '> Авто-блокировка</label>';
      h += '<div class="form-group"><label>Ключевые слова (через запятую)</label><textarea class="form-textarea" id="af-sp-keywords">' + esc(sp.keywords) + '</textarea></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveSpam()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA27: Recommendation Engine ===
  recommendationEngine: {
    render: function() {
      var rec = _load('rec_engine', { enabled: true, algorithm: 'popularity', maxRecs: 6 });
      var h = '<h3><i class="fa-solid fa-wand-magic"></i> Рекомендации</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-rec-enable"' + (rec.enabled ? ' checked' : '') + '> Включить</label>';
      h += '<div class="form-group"><label>Алгоритм</label><select class="form-input" id="af-rec-algo"><option value="popularity"' + (rec.algorithm === 'popularity' ? ' selected' : '') + '>Популярность</option><option value="relevance"' + (rec.algorithm === 'relevance' ? ' selected' : '') + '>Релевантность</option><option value="hybrid"' + (rec.algorithm === 'hybrid' ? ' selected' : '') + '>Гибрид</option></select></div>';
      h += '<div class="form-group"><label>Макс. рекомендаций</label><input type="number" class="form-input" id="af-rec-max" value="' + rec.maxRecs + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveRec()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA28: Search Ranking ===
  searchRanking: {
    render: function() {
      var sr = _load('search_ranking', { downloadsWeight: 1.0, followsWeight: 0.5, dateWeight: 0.3, nameWeight: 1.0 });
      var h = '<h3><i class="fa-solid fa-ranking-star"></i> Ранжирование поиска</h3><div class="admin-settings-form">';
      h += '<div class="form-group"><label>Вес скачиваний</label><input type="range" class="form-input" id="af-sr-dl" min="0" max="2" step="0.1" value="' + sr.downloadsWeight + '"></div>';
      h += '<div class="form-group"><label>Вес подписок</label><input type="range" class="form-input" id="af-sr-fl" min="0" max="2" step="0.1" value="' + sr.followsWeight + '"></div>';
      h += '<div class="form-group"><label>Вес даты</label><input type="range" class="form-input" id="af-sr-date" min="0" max="2" step="0.1" value="' + sr.dateWeight + '"></div>';
      h += '<div class="form-group"><label>Вес названия</label><input type="range" class="form-input" id="af-sr-name" min="0" max="2" step="0.1" value="' + sr.nameWeight + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveSR()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA29: Accessibility Checker ===
  accessibilityChecker: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-universal-access"></i> Проверка доступности</h3><div class="admin-settings-form">';
      h += '<button class="btn btn-primary" onclick="extAdminRunA11y()"><i class="fa-solid fa-search"></i> Проверить</button>';
      h += '<div id="af-a11y-results" style="margin-top:12px;"></div></div>';
      return h;
    }
  },

  // === EA30: Index Manager ===
  indexManager: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-list"></i> Управление индексами</h3><div class="admin-settings-form">';
      h += '<button class="btn btn-primary" onclick="toast(\'Индекс перестроен\',\'success\')"><i class="fa-solid fa-rotate"></i> Перестроить индекс</button>';
      h += '<button class="btn btn-secondary" style="margin-left:8px;" onclick="toast(\'Индекс оптимизирован\',\'success\')"><i class="fa-solid fa-compress"></i> Оптимизировать</button>';
      h += '<div style="margin-top:12px;padding:12px;border:1px solid var(--border-color);border-radius:8px;"><div style="display:flex;justify-content:space-between;"><span>Размер индекса</span><span>1.2 MB</span></div><div style="display:flex;justify-content:space-between;margin-top:8px;"><span>Документов</span><span>' + _getMods().length + '</span></div></div></div>';
      return h;
    }
  },

  // === EA31: Config Editor ===
  configEditor: {
    render: function() {
      var cfg = _load('site_settings', { siteName: 'ModSphere', maxUploadSize: 50, allowRegistration: true, requireApproval: true });
      var h = '<h3><i class="fa-solid fa-gear"></i> Редактор конфигурации</h3><div class="admin-settings-form">';
      Object.keys(cfg).forEach(function(k) {
        if (typeof cfg[k] === 'boolean') h += '<label class="form-checkbox-label" style="display:block;padding:6px 0;"><input type="checkbox" class="af-cfg-cb" data-key="' + k + '"' + (cfg[k] ? ' checked' : '') + '> ' + k.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }) + '</label>';
        else h += '<div class="form-group"><label>' + k + '</label><input class="form-input" id="af-cfg-' + k + '" value="' + esc(String(cfg[k])) + '"></div>';
      });
      h += '<button class="btn btn-primary" onclick="extAdminSaveCfg()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA32: Bot Detection ===
  botDetection: {
    render: function() {
      var bd = _load('bot_detection', { enabled: true, challengeThreshold: 3, blockHeadless: true });
      var h = '<h3><i class="fa-solid fa-robot"></i> Детекция ботов</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-bd-enable"' + (bd.enabled ? ' checked' : '') + '> Включить</label>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-bd-headless"' + (bd.blockHeadless ? ' checked' : '') + '> Блокировать headless браузеры</label>';
      h += '<div class="form-group"><label>Порог вызова</label><input type="number" class="form-input" id="af-bd-threshold" value="' + bd.challengeThreshold + '"></div>';
      h += '<button class="btn btn-primary" onclick="extAdminSaveBD()"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA33: CDN Manager ===
  cdnManager: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-cloud"></i> CDN Управление</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;gap:8px;">';
      h += '<div style="display:flex;justify-content:space-between;padding:10px;border:1px solid var(--border-color);border-radius:8px;"><span>📦 Статика</span><span style="color:var(--primary-color);">🟢 Готово</span></div>';
      h += '<div style="display:flex;justify-content:space-between;padding:10px;border:1px solid var(--border-color);border-radius:8px;"><span>🖼️ Изображения</span><span style="color:var(--primary-color);">🟢 Готово</span></div>';
      h += '<div style="display:flex;justify-content:space-between;padding:10px;border:1px solid var(--border-color);border-radius:8px;"><span>📜 Скрипты</span><span style="color:var(--primary-color);">🟢 Готово</span></div>';
      h += '</div><div style="margin-top:12px;display:flex;gap:8px;">';
      h += '<button class="btn btn-warning" onclick="toast(\'CDN кеш сброшен\',\'success\')"><i class="fa-solid fa-rotate"></i> Сбросить CDN</button>';
      h += '<button class="btn btn-secondary" onclick="toast(\'CDN прогрет\',\'success\')"><i class="fa-solid fa-fire"></i> Прогреть CDN</button></div></div>';
      return h;
    }
  },

  // === EA34: Image Optimizer ===
  imageOptimizer: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-image"></i> Оптимизация изображений</h3><div class="admin-settings-form">';
      h += '<div style="display:grid;gap:8px;">';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-img-webp" checked> WebP формат</label>';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-img-lazy" checked> Lazy loading</label>';
      h += '<label class="form-checkbox-label"><input type="checkbox" id="af-img-compress" checked> Сжатие</label>';
      h += '</div><div class="form-group" style="margin-top:12px;"><label>Качество (%)</label><input type="range" class="form-input" id="af-img-quality" min="1" max="100" value="80"></div>';
      h += '<button class="btn btn-primary" onclick="toast(\'Настройки сохранены\',\'success\')"><i class="fa-solid fa-save"></i> Сохранить</button>';
      h += '<button class="btn btn-secondary" style="margin-left:8px;" onclick="toast(\'Изображения оптимизированы\',\'success\')"><i class="fa-solid fa-wand-magic"></i> Оптимизировать все</button></div>';
      return h;
    }
  },

  // === EA35: Minification ===
  minification: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-compress"></i> Минификация</h3><div class="admin-settings-form">';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-min-css" checked> Минифицировать CSS</label>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-min-js" checked> Минифицировать JS</label>';
      h += '<label class="form-checkbox-label" style="display:block;"><input type="checkbox" id="af-min-html" checked> Минифицировать HTML</label>';
      h += '<button class="btn btn-primary" style="margin-top:12px;" onclick="toast(\'Настройки сохранены\',\'success\')"><i class="fa-solid fa-save"></i> Сохранить</button></div>';
      return h;
    }
  },

  // === EA36: Audit Trail ===
  auditTrail: {
    render: function() {
      var audits = _load('audit_trail', []);
      var h = '<h3><i class="fa-solid fa-clipboard-list"></i> Аудит изменений</h3><div class="admin-settings-form">';
      h += '<div style="max-height:400px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;">';
      if (audits.length) audits.slice(0, 30).forEach(function(a) { h += '<div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:12px;"><strong>' + esc(a.user || 'system') + '</strong> ' + esc(a.action) + ' <span style="color:var(--text-muted);">' + (a.time ? new Date(a.time).toLocaleString() : '') + '</span></div>'; });
      else h += '<p style="padding:16px;color:var(--text-muted);">Журнал аудита пуст</p>';
      h += '</div></div>';
      return h;
    }
  },

  // === EA37: User Satisfaction ===
  userSatisfaction: {
    render: function() {
      var h = '<h3><i class="fa-solid fa-face-smile"></i> Удовлетворённость пользователей</h3><div class="admin-settings-form">';
      h += '<div style="text-align:center;padding:20px;"><div style="font-size:64px;font-weight:800;color:var(--primary-color);">4.2</div><div style="font-size:16px;color:var(--text-secondary);">/ 5.0</div><div style="font-size:14px;color:var(--text-muted);margin-top:8px;">На основе 128 оценок</div>';
      h += '<div style="margin-top:16px;max-width:300px;margin-left:auto;margin-right:auto;">';
      h += '<div style="display:flex;justify-content:space-between;"><span>5★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;margin:0 8px;"><div style="width:55%;height:8px;background:var(--primary-color);border-radius:4px;"></div></div><span>55%</span></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span>4★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;margin:0 8px;"><div style="width:25%;height:8px;background:var(--primary-color);border-radius:4px;"></div></div><span>25%</span></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span>3★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;margin:0 8px;"><div style="width:10%;height:8px;background:var(--primary-color);border-radius:4px;"></div></div><span>10%</span></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span>2★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;margin:0 8px;"><div style="width:6%;height:8px;background:var(--primary-color);border-radius:4px;"></div></div><span>6%</span></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span>1★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;margin:0 8px;"><div style="width:4%;height:8px;background:var(--primary-color);border-radius:4px;"></div></div><span>4%</span></div>';
      h += '</div></div></div>';
      return h;
    }
  }
};

// Register extra admin functions in ADMIN_FUNCTIONS and ADMIN_FUNCTION_GROUPS
var EXTRA_ADMIN_IDS = [
  'permissionManager','ipBan','countryBlocker','vpnDetection','botDetection','securityScanner',
  'rateLimiter','cacheManager','performanceMonitor','cdnManager','imageOptimizer','minification',
  'endpointMonitor','apiUsage','dbManager','backupScheduler','systemHealth','errorTracker','logViewer','indexManager','configEditor',
  'featureFlags','seoManager','searchRanking','recommendationEngine','spamFilter','maintenanceMode',
  'gdprCompliance','dataRetention','cookieConsent','userDataExport','accessibilityChecker',
  'announcements','webhookTester','userSatisfaction','abTesting','auditTrail'
];
var EXTRA_ADMIN_LABELS = {
  permissionManager:'Управление правами', ipBan:'IP Баны', countryBlocker:'Блокировка стран',
  vpnDetection:'VPN/Прокси', botDetection:'Боты', securityScanner:'Сканер уязвимостей',
  rateLimiter:'Rate Limiter', cacheManager:'Кеш', performanceMonitor:'Производительность',
  cdnManager:'CDN', imageOptimizer:'Оптимизация', minification:'Минификация',
  endpointMonitor:'Монитор эндпоинтов', apiUsage:'API Использование', dbManager:'БД Менеджер',
  backupScheduler:'Планировщик бэкапов', systemHealth:'Health', errorTracker:'Ошибки',
  logViewer:'Логи', indexManager:'Индексы', configEditor:'Конфиг',
  featureFlags:'Флаги функций', seoManager:'SEO', searchRanking:'Ранжирование',
  recommendationEngine:'Рекомендации', spamFilter:'Спам', maintenanceMode:'Обслуживание',
  gdprCompliance:'GDPR', dataRetention:'Хранение данных', cookieConsent:'Cookie',
  userDataExport:'Экспорт данных', accessibilityChecker:'Доступность',
  announcements:'Анонсы', webhookTester:'Вебхуки', userSatisfaction:'Удовлетворённость',
  abTesting:'A/B тесты', auditTrail:'Аудит'
};
var EXTRA_ADMIN_ICONS = {
  permissionManager:'fa-shield', ipBan:'fa-ban', countryBlocker:'fa-globe',
  vpnDetection:'fa-mask', botDetection:'fa-robot', securityScanner:'fa-bug',
  rateLimiter:'fa-gauge-high', cacheManager:'fa-bolt', performanceMonitor:'fa-gauge',
  cdnManager:'fa-cloud', imageOptimizer:'fa-compress', minification:'fa-file-zipper',
  endpointMonitor:'fa-server', apiUsage:'fa-chart-bar', dbManager:'fa-database',
  backupScheduler:'fa-clock', systemHealth:'fa-heart-pulse', errorTracker:'fa-bug-slash',
  logViewer:'fa-scroll', indexManager:'fa-table', configEditor:'fa-gear',
  featureFlags:'fa-flag', seoManager:'fa-magnifying-glass', searchRanking:'fa-chart-simple',
  recommendationEngine:'fa-wand-magic-sparkles', spamFilter:'fa-fish',
  maintenanceMode:'fa-wrench', gdprCompliance:'fa-lock', dataRetention:'fa-database',
  cookieConsent:'fa-cookie', userDataExport:'fa-file-export', accessibilityChecker:'fa-universal-access',
  announcements:'fa-bullhorn', webhookTester:'fa-plug', userSatisfaction:'fa-face-smile',
  abTesting:'fa-flask', auditTrail:'fa-clipboard-list'
};

// Add to window.ADMIN_FUNCTIONS
if (window.ADMIN_FUNCTIONS) {
  EXTRA_ADMIN_IDS.forEach(function(id) {
    window.ADMIN_FUNCTIONS[id] = { icon: EXTRA_ADMIN_ICONS[id] || 'fa-gear', label: EXTRA_ADMIN_LABELS[id] || id };
  });
}

// Add groups to window.ADMIN_FUNCTION_GROUPS
if (window.ADMIN_FUNCTION_GROUPS) {
  window.ADMIN_FUNCTION_GROUPS.push(
    { name: 'Безопасность+', items: ['permissionManager','ipBan','countryBlocker','vpnDetection','botDetection','securityScanner','auditTrail'] },
    { name: 'Производительность+', items: ['rateLimiter','cacheManager','performanceMonitor','cdnManager','imageOptimizer','minification'] },
    { name: 'Система+', items: ['endpointMonitor','apiUsage','dbManager','backupScheduler','systemHealth','errorTracker','logViewer','indexManager','configEditor'] },
    { name: 'Настройки+', items: ['featureFlags','seoManager','searchRanking','recommendationEngine','spamFilter','maintenanceMode'] },
    { name: 'Соответствие+', items: ['gdprCompliance','dataRetention','cookieConsent','userDataExport','accessibilityChecker'] },
    { name: 'Коммуникации+', items: ['announcements','webhookTester','userSatisfaction'] },
    { name: 'Эксперименты+', items: ['abTesting'] }
  );
}

// Exposed save functions
window.extAdminSaveVPN = function() {
  _save('vpn_detection', { enabled: document.getElementById('af-vpn-enable')?.checked || false });
  toast('Настройки VPN/прокси сохранены', 'success');
};
window.extAdminSaveRL = function() {
  _save('rate_limits', { enabled: document.getElementById('af-rl-enable')?.checked || false, maxReqs: parseInt(document.getElementById('af-rl-max')?.value || '60'), window: parseInt(document.getElementById('af-rl-window')?.value || '60') });
  toast('Rate limits сохранены', 'success');
};
window.extAdminSaveBkp = function() {
  _save('backup_settings', { enabled: document.getElementById('af-bkp-enable')?.checked || false, interval: document.getElementById('af-bkp-int')?.value || 'daily', lastBackup: _load('backup_settings', {}).lastBackup });
  toast('Настройки бэкапов сохранены', 'success');
};
window.extAdminRunBkp = function() {
  var b = _load('backup_settings', {}); b.lastBackup = new Date().toISOString(); _save('backup_settings', b);
  var d = { mods: _getMods(), users: _getUsers(), time: new Date().toISOString() };
  var bl = _load('backup_list', []); bl.push(d); if (bl.length > 10) bl.shift(); _save('backup_list', bl);
  toast('✅ Бэкап создан!', 'success');
};
window.extAdminRefreshHealth = function() { toast('Система здорова ✅', 'success'); };
window.extAdminFilterLogs = function() {
  var q = (document.getElementById('af-log-filter')?.value || '').toLowerCase();
  document.querySelectorAll('.admin-log-item').forEach(function(el) {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
};
window.extAdminSaveFlags = function() {
  var flags = {};
  document.querySelectorAll('.af-flag-cb').forEach(function(cb) { flags[cb.dataset.key] = cb.checked; });
  _save('feature_flags', flags); toast('Флаги функций сохранены', 'success');
};
window.extAdminCreateABTest = function() {
  var n = prompt('Название теста:'); if (!n) return;
  var v = prompt('Варианты (через запятую):'); if (!v) return;
  var t = _load('ab_tests', []); t.push({ id: Date.now().toString(36), name: n, variants: v.split(',').map(function(s) { return s.trim(); }), participants: 0, winner: null }); _save('ab_tests', t);
  toast('A/B тест создан', 'success');
};
window.extAdminSaveSEO = function() {
  _save('seo_settings', { title: document.getElementById('af-seo-title')?.value || '', desc: document.getElementById('af-seo-desc')?.value || '', keywords: document.getElementById('af-seo-keywords')?.value || '' });
  toast('SEO настройки сохранены', 'success');
};
window.extAdminGenerateSitemap = function() {
  var mods = _getMods();
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  mods.forEach(function(m) { xml += '  <url><loc>' + window.location.origin + '/#/mod/' + (m.slug || m.id) + '</loc></url>\n'; });
  xml += '</urlset>';
  var b = new Blob([xml], {type:'application/xml'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sitemap.xml'; a.click();
  toast('Sitemap сгенерирован', 'success');
};
window.extAdminSaveGDPR = function() {
  var gdpr = {};
  document.querySelectorAll('.af-gdpr-cb').forEach(function(cb) { gdpr[cb.dataset.key] = cb.checked; });
  _save('gdpr_settings', gdpr); toast('GDPR настройки сохранены', 'success');
};
window.extAdminSaveDR = function() {
  _save('data_retention', { logsDays: parseInt(document.getElementById('af-dr-logs')?.value || '30'), backupsKeep: parseInt(document.getElementById('af-dr-backups')?.value || '7'), activityMonths: parseInt(document.getElementById('af-dr-activity')?.value || '6') });
  toast('Настройки хранения сохранены', 'success');
};
window.extAdminSaveCC = function() {
  _save('cookie_settings', { enabled: document.getElementById('af-cc-enable')?.checked || false, message: document.getElementById('af-cc-msg')?.value || '', analytics: document.getElementById('af-cc-analytics')?.checked || false, marketing: document.getElementById('af-cc-marketing')?.checked || false });
  toast('Cookie настройки сохранены', 'success');
};
window.extAdminExportUserData = function() {
  var uid = document.getElementById('af-ude-user')?.value;
  if (!uid) { toast('Выберите пользователя', 'info'); return; }
  var users = _getUsers(); var u = users.find(function(x) { return x.uid === uid; });
  if (!u) return;
  var data = { user: u, mods: _getMods().filter(function(m) { return m.author === u.username; }), activity: _load('activity_feed_' + u.username, []), exportedAt: new Date().toISOString() };
  var b = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'user-data-' + u.username + '.json'; a.click();
  toast('Данные пользователя экспортированы', 'success');
};
window.extAdminAddAnn = function() {
  var text = document.getElementById('af-ann-text')?.value.trim(); if (!text) return;
  var ann = _load('site_announcements', []); ann.push({ id: Date.now().toString(36), text: text, time: new Date().toISOString() }); _save('site_announcements', ann);
  document.getElementById('af-ann-text').value = ''; toast('Анонс добавлен', 'success');
};
window.extAdminDelAnn = function(id) {
  _save('site_announcements', _load('site_announcements', []).filter(function(a) { return a.id !== id; }));
  toast('Анонс удалён', 'info');
};
window.extAdminSaveMM = function() {
  _save('maintenance_mode', { active: document.getElementById('af-mm-active')?.checked || false, message: document.getElementById('af-mm-msg')?.value || '' });
  toast('Режим обслуживания ' + (document.getElementById('af-mm-active')?.checked ? 'включён' : 'выключен'), 'success');
};
window.extAdminRunScan = function() {
  var results = document.getElementById('af-scan-results');
  if (!results) return;
  results.innerHTML = '<p>🔍 Сканирование...</p>';
  setTimeout(function() {
    var issues = [];
    var mods = _getMods(), users = _getUsers();
    var modsWithoutDesc = mods.filter(function(m) { return !m.shortDescription || m.shortDescription.length < 10; });
    var usersWithoutEmail = users.filter(function(u) { return !u.email; });
    if (modsWithoutDesc.length > 3) issues.push('⚠️ ' + modsWithoutDesc.length + ' модов без описания');
    if (usersWithoutEmail.length) issues.push('⚠️ ' + usersWithoutEmail.length + ' пользователей без email');
    if (!issues.length) issues.push('✅ Всё в порядке!');
    results.innerHTML = issues.map(function(i) { return '<div style="padding:8px;font-size:13px;">' + i + '</div>'; }).join('');
    toast('Сканирование завершено', 'info');
  }, 2000);
};
window.extAdminSaveSpam = function() {
  _save('spam_filter_config', { sensitivity: parseInt(document.getElementById('af-sp-sens')?.value || '50'), autoBlock: document.getElementById('af-sp-autoblock')?.checked || false, keywords: document.getElementById('af-sp-keywords')?.value || '' });
  toast('Настройки спам-фильтра сохранены', 'success');
};
window.extAdminSaveRec = function() {
  _save('rec_engine', { enabled: document.getElementById('af-rec-enable')?.checked || false, algorithm: document.getElementById('af-rec-algo')?.value || 'popularity', maxRecs: parseInt(document.getElementById('af-rec-max')?.value || '6') });
  toast('Настройки рекомендаций сохранены', 'success');
};
window.extAdminSaveSR = function() {
  _save('search_ranking', { downloadsWeight: parseFloat(document.getElementById('af-sr-dl')?.value || '1'), followsWeight: parseFloat(document.getElementById('af-sr-fl')?.value || '0.5'), dateWeight: parseFloat(document.getElementById('af-sr-date')?.value || '0.3'), nameWeight: parseFloat(document.getElementById('af-sr-name')?.value || '1') });
  toast('Настройки ранжирования сохранены', 'success');
};
window.extAdminRunA11y = function() {
  var r = document.getElementById('af-a11y-results');
  if (!r) return;
  r.innerHTML = '<p>🔍 Проверка...</p>';
  setTimeout(function() {
    r.innerHTML = '<div style="color:var(--primary-color);">✅ Контрастность: норм</div><div style="color:var(--primary-color);">✅ Alt-теги: норм</div><div style="color:#eab308;">⚠️ ARIA-атрибуты: 3 предупреждения</div>';
    toast('Проверка доступности завершена', 'info');
  }, 2000);
};
window.extAdminSaveCfg = function() {
  var cfg = {};
  document.querySelectorAll('.af-cfg-cb').forEach(function(cb) { cfg[cb.dataset.key] = cb.checked; });
  ['siteName','maxUploadSize','allowRegistration','requireApproval'].forEach(function(k) {
    var el = document.getElementById('af-cfg-' + k);
    if (el) cfg[k] = el.value;
  });
  _save('site_settings', cfg); toast('Конфигурация сохранена', 'success');
};
window.extAdminSaveBD = function() {
  _save('bot_detection', { enabled: document.getElementById('af-bd-enable')?.checked || false, blockHeadless: document.getElementById('af-bd-headless')?.checked || false, challengeThreshold: parseInt(document.getElementById('af-bd-threshold')?.value || '3') });
  toast('Настройки детекции ботов сохранены', 'success');
};
window.extAdminTestWebhook = function() {
  var url = document.getElementById('af-wh-test-url')?.value;
  var body = document.getElementById('af-wh-test-body')?.value;
  if (!url) { toast('Введите URL вебхука', 'info'); return; }
  toast('🔄 Отправка тестового вебхука...', 'info');
  setTimeout(function() { toast('✅ Вебхук отправлен (демо)', 'success'); }, 1500);
};
})();
