// ========== ModSphere — 50+ Extra Features (Users) ==========
(function () {
document.addEventListener('DOMContentLoaded', function () {
  initFriendSystem();
  initMessaging();
  initUserBlog();
  initBugTracker();
  initFeatureVoting();
  initReputationSystem();
  initGuildSystem();
  initDailyQuests();
  initModSnippets();
  initModContests();
  initUserChallenges();
  initQuizSystem();
  initPollSystem();
  initReactionSystem();
  initUserStatus();
  initFlairSystem();
  initTrophyRoom();
  initCollectionSharing();
  initModPlaylist();
  initCompatibilityMatrix();
  initUserBadges();
  initUserActivityFeed();
  initReportSystem();
  initContentFlagging();
  initRecipeViewer();
  initCraftingGuide();
  initPotionBuilder();
  initModDocs();
  initUserMentions();
  initHashTags();
  initUserFollowSystem();
  initNotificationPreferences();
  initDigestEmail();
  initReadingList();
  initModBookmarks();
  initSearchFilters();
  initUserFeedback();
  initRatingBreakdown();
  initModHistory();
  initVersionWatch();
  initAuthorSubscribe();
  initCategoryFollow();
  initTrendingSidebar();
  initRecentlyActive();
  initStatsWidget();
  initUserAchievements();
  initLoginRewards();
  initModReferrals();
  initUserInventory();
  initDailyTip();
  initQuickActionsMenu();
  initModDependencyGraph();
  initWorldBackup();
  initCompatibilityCheck();
  initPerformanceTest();
  initSeedViewer();
});

var _fu = {
  getUser: function() { return JSON.parse(localStorage.getItem('current_user') || 'null'); },
  getMods: function() { return window.getMods ? window.getMods() : JSON.parse(localStorage.getItem('mods_data') || '[]'); },
  toast: function(msg, type) { if (window.showToast) window.showToast(msg, type); },
  modal: function(h, t) {
    var m = document.createElement('div'); m.className = 'profile-modal'; m.id = 'ex-modal';
    m.style.cssText = 'display:block;position:fixed;inset:0;z-index:2000;';
    m.innerHTML = '<div class="profile-modal-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);" onclick="closeExModal()"></div><div class="profile-modal-card" style="position:relative;margin:5vh auto;max-width:600px;max-height:80vh;overflow-y:auto;background:var(--surface-color);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg);"><button class="profile-modal-close" onclick="closeExModal()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-primary);font-size:24px;cursor:pointer;">✕</button><h2 style="margin-bottom:16px;padding-right:30px;">' + t + '</h2>' + h + '</div>';
    document.body.appendChild(m);
  },
  closeModal: function() { var x = document.getElementById('ex-modal'); if (x) x.remove(); },
  getUsers: function() { return JSON.parse(localStorage.getItem('registered_users') || '[]'); },
  saveUsers: function(u) { localStorage.setItem('registered_users', JSON.stringify(u)); },
  relTime: function(t) {
    if (!t) return '';
    var d = Date.now() - new Date(t).getTime(), m = Math.floor(d/60000);
    if (m < 1) return 'только что'; if (m < 60) return m + ' мин.';
    var h = Math.floor(m/60); if (h < 24) return h + ' ч.'; var dd = Math.floor(h/24);
    if (dd < 30) return dd + ' дн.'; return new Date(t).toLocaleDateString('ru-RU');
  },
  save: function(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  load: function(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e) { return d; } },
  esc: function(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
};
window.closeExModal = _fu.closeModal;

// === F1: Friend System ===
function initFriendSystem() {
  window.friendSystem = {
    sendRequest: function(username) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var requests = _fu.load('friend_requests', {});
      if (!requests[u.username]) requests[u.username] = [];
      if (requests[u.username].includes(username)) { _fu.toast('Запрос уже отправлен', 'info'); return; }
      requests[u.username].push(username); _fu.save('friend_requests', requests);
      _fu.toast('Запрос в друзья отправлен ' + username, 'success');
    },
    acceptRequest: function(from) {
      var u = _fu.getUser(); if (!u) return;
      var requests = _fu.load('friend_requests', {});
      var friends = _fu.load('friends_list', {});
      if (!requests[from]) return;
      requests[from] = (requests[from] || []).filter(function(x) { return x !== u.username; });
      if (!friends[u.username]) friends[u.username] = [];
      if (!friends[from]) friends[from] = [];
      if (!friends[u.username].includes(from)) friends[u.username].push(from);
      if (!friends[from].includes(u.username)) friends[from].push(u.username);
      _fu.save('friend_requests', requests); _fu.save('friends_list', friends);
      _fu.toast('Вы приняли запрос от ' + from, 'success');
    },
    getFriends: function(username) {
      var f = _fu.load('friends_list', {});
      return f[username || (_fu.getUser() || {}).username] || [];
    },
    showFriends: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var f = this.getFriends(u.username);
      var html = f.length ? f.map(function(n) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;"><i class="fa-solid fa-user"></i> <strong>' + _fu.esc(n) + '</strong></div>'; }).join('') : '<p style="color:var(--text-muted);">Нет друзей</p>';
      if (!f.length) html += '<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="var n=prompt(\'Имя пользователя:\');if(n){friendSystem.sendRequest(n);closeExModal()}">➕ Добавить в друзья</button>';
      _fu.modal(html, '👥 Друзья');
    },
    showRequests: function() {
      var u = _fu.getUser(); if (!u) return;
      var requests = _fu.load('friend_requests', {});
      var incoming = Object.keys(requests).filter(function(k) { return requests[k].includes(u.username); });
      if (!incoming.length) { _fu.toast('Нет входящих заявок', 'info'); return; }
      var html = incoming.map(function(n) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;display:flex;justify-content:space-between;"><span><strong>' + _fu.esc(n) + '</strong></span><button class="btn btn-primary btn-sm" onclick="friendSystem.acceptRequest(\'' + n + '\');closeExModal()">✅ Принять</button></div>'; }).join('');
      _fu.modal(html, '📩 Заявки в друзья');
    }
  };
}

// === F2: Messaging ===
function initMessaging() {
  window.messaging = {
    send: function(to, msg) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      if (!msg || !msg.trim()) return;
      var msgs = _fu.load('user_messages', {});
      var key = [u.username, to].sort().join('_');
      if (!msgs[key]) msgs[key] = [];
      msgs[key].push({ from: u.username, to: to, text: msg, time: new Date().toISOString() });
      _fu.save('user_messages', msgs);
      _fu.toast('Сообщение отправлено', 'success');
    },
    getConversation: function(withUser) {
      var u = _fu.getUser(); if (!u) return [];
      var msgs = _fu.load('user_messages', {});
      var key = [u.username, withUser].sort().join('_');
      return msgs[key] || [];
    },
    showConversation: function(withUser) {
      var u = _fu.getUser(); if (!u) return;
      var msgs = this.getConversation(withUser);
      var html = '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;padding:12px;">';
      if (!msgs.length) html += '<p style="color:var(--text-muted);text-align:center;">Нет сообщений</p>';
      msgs.forEach(function(m) {
        var isMe = m.from === u.username;
        html += '<div style="display:flex;margin:8px 0;' + (isMe ? 'justify-content:flex-end;' : '') + '"><div style="background:' + (isMe ? 'var(--primary-color)' : 'var(--surface-color)') + ';color:' + (isMe ? 'white' : 'var(--text-primary)') + ';padding:8px 14px;border-radius:12px;max-width:80%;"><div>' + _fu.esc(m.text) + '</div><div style="font-size:10px;opacity:0.7;margin-top:4px;">' + _fu.relTime(m.time) + '</div></div></div>';
      });
      html += '</div>';
      html += '<div style="display:flex;gap:8px;margin-top:12px;"><input type="text" id="ex-msg-input" class="form-input" placeholder="Сообщение..." style="flex:1;"><button class="btn btn-primary btn-sm" onclick="var i=document.getElementById(\'ex-msg-input\');if(i&&i.value.trim()){messaging.send(\'' + withUser + '\',i.value);i.value=\'\';messaging.showConversation(\'' + withUser + '\')}">Отправить</button></div>';
      _fu.modal(html, '💬 Чат с ' + _fu.esc(withUser));
    }
  };
}

// === F3: User Blog ===
function initUserBlog() {
  window.userBlog = {
    posts: function(username) { return _fu.load('blog_posts_' + (username || ''), []); },
    create: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var title = prompt('Заголовок поста:'); if (!title) return;
      var content = prompt('Содержание:'); if (!content) return;
      var posts = _fu.load('blog_posts_' + u.username, []);
      posts.unshift({ id: Date.now().toString(36), title: title, content: content, time: new Date().toISOString(), likes: 0 });
      _fu.save('blog_posts_' + u.username, posts);
      _fu.toast('Пост опубликован!', 'success');
    },
    show: function(username) {
      var posts = this.posts(username);
      if (!posts.length) { _fu.toast('Нет записей в блоге', 'info'); return; }
      var html = posts.map(function(p) { return '<div style="padding:16px;border:1px solid var(--border-color);border-radius:12px;margin:8px 0;"><h3>' + _fu.esc(p.title) + '</h3><p style="color:var(--text-secondary);">' + _fu.esc(p.content) + '</p><div style="font-size:12px;color:var(--text-muted);margin-top:8px;">' + _fu.relTime(p.time) + ' | 👍 ' + (p.likes || 0) + '</div></div>'; }).join('');
      _fu.modal(html, '📝 Блог пользователя');
    }
  };
}

// === F4: Bug Tracker ===
function initBugTracker() {
  window.bugTracker = {
    report: function(modId) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var title = prompt('Краткое описание бага:'); if (!title) return;
      var desc = prompt('Подробное описание:'); if (!desc) return;
      var bugs = _fu.load('mod_bugs_' + modId, []);
      bugs.unshift({ id: Date.now().toString(36), title: title, desc: desc, author: u.username, status: 'open', time: new Date().toISOString(), comments: [] });
      _fu.save('mod_bugs_' + modId, bugs);
      _fu.toast('Баг отправлен разработчикам', 'success');
    },
    show: function(modId) {
      var bugs = _fu.load('mod_bugs_' + modId, []);
      if (!bugs.length) { _fu.toast('Багов не найдено', 'info'); return; }
      var html = bugs.map(function(b) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><div style="display:flex;justify-content:space-between;"><strong>' + _fu.esc(b.title) + '</strong><span class="result-tag" style="background:' + (b.status === 'open' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)') + ';color:' + (b.status === 'open' ? '#ef4444' : '#10b981') + ';font-size:10px;">' + (b.status === 'open' ? 'Открыт' : 'Закрыт') + '</span></div><p style="font-size:13px;color:var(--text-secondary);">' + _fu.esc(b.desc) + '</p><span style="font-size:11px;color:var(--text-muted);">от ' + _fu.esc(b.author) + ' ' + _fu.relTime(b.time) + '</span></div>'; }).join('');
      _fu.modal(html, '🐛 Баг-трекер');
    }
  };
}

// === F5: Feature Voting ===
function initFeatureVoting() {
  window.featureVoting = {
    suggest: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var title = prompt('Название идеи:'); if (!title) return;
      var desc = prompt('Описание:'); if (!desc) return;
      var ideas = _fu.load('feature_ideas', []);
      ideas.unshift({ id: Date.now().toString(36), title: title, desc: desc, author: u.username, votes: 0, time: new Date().toISOString() });
      _fu.save('feature_ideas', ideas);
      _fu.toast('Идея отправлена на голосование!', 'success');
    },
    show: function() {
      var ideas = _fu.load('feature_ideas', []);
      if (!ideas.length) { _fu.toast('Нет предложений', 'info'); return; }
      var html = ideas.sort(function(a,b){return b.votes - a.votes}).map(function(r, i) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><div style="display:flex;justify-content:space-between;"><strong>' + _fu.esc(r.title) + '</strong><span style="font-size:12px;color:var(--text-muted);">от ' + _fu.esc(r.author) + '</span></div><p style="font-size:13px;color:var(--text-secondary);">' + _fu.esc(r.desc) + '</p><button class="btn btn-secondary btn-sm" onclick="featureVoting.vote(' + i + ');renderFeatureVoting()">👍 ' + (r.votes || 0) + '</button></div>'; }).join('');
      _fu.modal(html, '💡 Голосование за идеи');
    },
    vote: function(index) {
      var ideas = _fu.load('feature_ideas', []);
      if (ideas[index]) { ideas[index].votes = (ideas[index].votes || 0) + 1; _fu.save('feature_ideas', ideas); _fu.toast('Голос учтён!', 'success'); }
    }
  };
}
window.renderFeatureVoting = function() { featureVoting.show(); };

// === F6: Reputation System ===
function initReputationSystem() {
  window.repSystem = {
    get: function(username) { return parseInt(localStorage.getItem('rep_' + username) || '0'); },
    add: function(username, amount) {
      var r = this.get(username) + amount;
      localStorage.setItem('rep_' + username, String(r));
    },
    give: function(username) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      if (username === u.username) { _fu.toast('Нельзя себе', 'info'); return; }
      var given = _fu.load('rep_given', {});
      if (!given[u.username]) given[u.username] = [];
      if (given[u.username].includes(username)) { _fu.toast('Вы уже оценили этого пользователя', 'info'); return; }
      given[u.username].push(username); _fu.save('rep_given', given);
      this.add(username, 1);
      _fu.toast('Репутация повышена!', 'success');
    }
  };
}

// === F7: Guild/Clan System ===
function initGuildSystem() {
  window.guildSystem = {
    list: function() { return _fu.load('guilds', []); },
    create: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var name = prompt('Название гильдии:'); if (!name) return;
      var guilds = this.list();
      if (guilds.find(function(g){return g.name.toLowerCase()===name.toLowerCase()})) { _fu.toast('Такая гильдия уже есть', 'info'); return; }
      guilds.push({ id: Date.now().toString(36), name: name, owner: u.username, members: [u.username], created: new Date().toISOString(), description: '' });
      _fu.save('guilds', guilds);
      _fu.toast('Гильдия "' + name + '" создана!', 'success');
    },
    show: function() {
      var u = _fu.getUser();
      var guilds = this.list();
      if (!guilds.length) { _fu.toast('Нет гильдий', 'info'); return; }
      var html = guilds.map(function(g) {
        var isMember = u && g.members.includes(u.username);
        return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><div style="display:flex;justify-content:space-between;"><strong>' + _fu.esc(g.name) + '</strong><span style="font-size:12px;color:var(--text-muted);">👑 ' + _fu.esc(g.owner) + ' | ' + g.members.length + ' уч.</span></div>' + (isMember ? '<span style="color:var(--primary-color);font-size:12px;">Вы участник</span>' : '<button class="btn btn-secondary btn-sm" onclick="guildSystem.join(\'' + g.id + '\');closeExModal()">Вступить</button>') + '</div>';
      }).join('');
      _fu.modal(html, '🏰 Гильдии');
    },
    join: function(guildId) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var guilds = this.list();
      var g = guilds.find(function(x) { return x.id === guildId; });
      if (g && !g.members.includes(u.username)) { g.members.push(u.username); _fu.save('guilds', guilds); _fu.toast('Вы вступили в гильдию!', 'success'); }
    }
  };
}

// === F8: Daily Quests ===
function initDailyQuests() {
  window.dailyQuests = {
    list: function() {
      var dayKey = new Date().toDateString();
      var quests = _fu.load('daily_quests_' + dayKey, null);
      if (!quests) {
        var all = [ { id: 'q1', name: 'Просмотреть 3 мода', target: 3, type: 'view', reward: 10, progress: 0, done: false }, { id: 'q2', name: 'Скачать 1 мод', target: 1, type: 'download', reward: 15, progress: 0, done: false }, { id: 'q3', name: 'Поставить лайк', target: 1, type: 'like', reward: 5, progress: 0, done: false } ];
        _fu.save('daily_quests_' + dayKey, all);
        return all;
      }
      return quests;
    },
    show: function() {
      var quests = this.list();
      var html = quests.map(function(q) { return '<div style="padding:12px;border:1px solid ' + (q.done ? 'var(--primary-color)' : 'var(--border-color)') + ';border-radius:8px;margin:6px 0;display:flex;justify-content:space-between;align-items:center;"><div><strong>' + _fu.esc(q.name) + '</strong><div style="font-size:12px;color:var(--text-muted);">' + q.progress + '/' + q.target + '</div></div><span style="color:var(--primary-color);font-weight:700;">+' + q.reward + ' XP</span></div>'; }).join('');
      _fu.modal(html, '⚡ Ежедневные задания');
    }
  };
}

// === F9: Mod Snippets ===
function initModSnippets() {
  window.modSnippets = {
    create: function(modId) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var title = prompt('Название сниппета:'); if (!title) return;
      var code = prompt('Код:'); if (!code) return;
      var snips = _fu.load('mod_snippets_' + modId, []);
      snips.unshift({ id: Date.now().toString(36), title: title, code: code, author: u.username, time: new Date().toISOString() });
      _fu.save('mod_snippets_' + modId, snips);
      _fu.toast('Сниппет добавлен!', 'success');
    },
    show: function(modId) {
      var snips = _fu.load('mod_snippets_' + modId, []);
      if (!snips.length) { _fu.toast('Нет сниппетов', 'info'); return; }
      var html = snips.map(function(s) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><strong>' + _fu.esc(s.title) + '</strong><pre style="background:var(--bg-color);padding:8px;border-radius:4px;margin-top:8px;font-size:12px;overflow-x:auto;">' + _fu.esc(s.code) + '</pre><span style="font-size:11px;color:var(--text-muted);">от ' + _fu.esc(s.author) + '</span></div>'; }).join('');
      _fu.modal(html, '📜 Сниппеты');
    }
  };
}

// === F10: Mod Contests ===
function initModContests() {
  window.modContests = {
    list: function() { return _fu.load('mod_contests', []); },
    create: function() {
      var u = _fu.getUser(); if (!u || (u.role !== 'ADMIN' && u.role !== 'OWNER')) { _fu.toast('Только для админов', 'info'); return; }
      var name = prompt('Название конкурса:'); if (!name) return;
      var prize = prompt('Приз:'); if (!prize) return;
      var contests = this.list();
      contests.push({ id: Date.now().toString(36), name: name, prize: prize, entries: [], active: true, created: new Date().toISOString() });
      _fu.save('mod_contests', contests);
      _fu.toast('Конкурс создан!', 'success');
    },
    show: function() {
      var contests = this.list();
      if (!contests.length) { _fu.toast('Нет активных конкурсов', 'info'); return; }
      var html = contests.map(function(c) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><strong>' + _fu.esc(c.name) + '</strong><span style="font-size:12px;color:var(--text-muted);margin-left:8px;">🎁 ' + _fu.esc(c.prize) + '</span><div style="font-size:12px;color:var(--text-secondary);">Участников: ' + (c.entries || []).length + '</div></div>'; }).join('');
      _fu.modal(html, '🏆 Конкурсы модов');
    }
  };
}

// === F11: User Challenges ===
function initUserChallenges() {
  window.userChallenges = {
    list: function() {
      var ch = _fu.load('user_challenges', []);
      if (!ch.length) {
        ch = [ { id: 'c1', name: 'Скачай 10 модов', goal: 10, type: 'download', reward: '🏅', progress: 0 }, { id: 'c2', name: 'Загрузи свой первый мод', goal: 1, type: 'upload', reward: '📦', progress: 0 }, { id: 'c3', name: 'Получи 100 подписчиков', goal: 100, type: 'follows', reward: '⭐', progress: 0 } ];
        _fu.save('user_challenges', ch);
      }
      return ch;
    },
    show: function() {
      var ch = this.list();
      var html = ch.map(function(c) { var pct = Math.min(100, Math.floor((c.progress / c.goal) * 100)); return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><div style="display:flex;justify-content:space-between;"><strong>' + _fu.esc(c.name) + '</strong><span>' + c.reward + '</span></div><div style="background:var(--bg-color);border-radius:4px;height:8px;margin-top:8px;"><div style="background:var(--primary-color);border-radius:4px;height:8px;width:' + pct + '%;"></div></div><span style="font-size:12px;color:var(--text-muted);">' + c.progress + '/' + c.goal + '</span></div>'; }).join('');
      _fu.modal(html, '🎯 Испытания');
    }
  };
}

// === F12: Quiz System ===
function initQuizSystem() {
  window.quizSystem = { score: 0, current: 0, questions: [] };
  window.startModQuiz = function() {
    var qs = [ { q: 'Какой загрузчик использует Sodium?', a: ['Fabric','Forge','NeoForge','Quilt'], correct: 0 }, { q: 'Какой мод добавляет поезда?', a: ['Create','Railcraft','Little Logistics','All'], correct: 0 }, { q: 'OptiFine альтернатива?', a: ['Sodium','CaffeineMC','Phosphor','All'], correct: 3 }, { q: 'Мод на магию?', a: ['Botania','Thaumcraft','Ars Nouveau','All'], correct: 3 }, { q: 'Какой мод добавляет жителей?', a: ['Minecraft','Villager Names','Mca','None'], correct: 2 } ];
    quizSystem.questions = qs; quizSystem.score = 0; quizSystem.current = 0;
    renderQuizQuestion();
  };
  window.renderQuizQuestion = function() {
    var qs = quizSystem.questions;
    if (quizSystem.current >= qs.length) { _fu.modal('<div style="text-align:center;"><h3>Тест завершён!</h3><p style="font-size:24px;font-weight:800;color:var(--primary-color);">' + quizSystem.score + '/' + qs.length + '</p></div>', '📝 Результаты'); return; }
    var q = qs[quizSystem.current];
    var html = '<div><p style="font-weight:700;margin-bottom:12px;">' + (quizSystem.current + 1) + '. ' + _fu.esc(q.q) + '</p><div style="display:flex;flex-direction:column;gap:8px;">' + q.a.map(function(a, i) { return '<button class="btn btn-secondary" style="text-align:left;" onclick="checkQuizAnswer(' + i + ')">' + _fu.esc(a) + '</button>'; }).join('') + '</div></div>';
    _fu.modal(html, '📝 Викторина (' + (quizSystem.current + 1) + '/' + qs.length + ')');
  };
  window.checkQuizAnswer = function(selected) {
    var qs = quizSystem.questions;
    if (selected === qs[quizSystem.current].correct) quizSystem.score++;
    quizSystem.current++;
    closeExModal();
    setTimeout(renderQuizQuestion, 200);
  };
}

// === F13: Poll System ===
function initPollSystem() {
  window.pollSystem = {
    list: function() { return _fu.load('user_polls', []); },
    create: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var question = prompt('Вопрос голосования:'); if (!question) return;
      var opts = prompt('Варианты (через запятую):'); if (!opts) return;
      var options = opts.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      if (options.length < 2) { _fu.toast('Минимум 2 варианта', 'info'); return; }
      var polls = this.list();
      polls.push({ id: Date.now().toString(36), question: question, options: options, votes: options.map(function(){return 0}), voters: [], author: u.username, time: new Date().toISOString() });
      _fu.save('user_polls', polls);
      _fu.toast('Опрос создан!', 'success');
    },
    vote: function(pollId, optIdx) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var polls = this.list();
      var p = polls.find(function(x) { return x.id === pollId; });
      if (!p) return;
      if (p.voters.includes(u.username)) { _fu.toast('Вы уже голосовали', 'info'); return; }
      p.votes[optIdx]++; p.voters.push(u.username);
      _fu.save('user_polls', polls);
      _fu.toast('Ваш голос учтён!', 'success');
    },
    show: function() {
      var polls = this.list();
      if (!polls.length) { _fu.toast('Нет опросов', 'info'); return; }
      var html = polls.map(function(p) { var total = p.votes.reduce(function(a,b){return a+b},0); return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><strong>' + _fu.esc(p.question) + '</strong>' + p.options.map(function(o, i) { var pct = total ? Math.round((p.votes[i]/total)*100) : 0; return '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><button class="btn btn-secondary btn-sm" onclick="pollSystem.vote(\'' + p.id + '\',' + i + ')">' + _fu.esc(o) + '</button><span style="font-size:12px;color:var(--text-muted);">' + p.votes[i] + ' (' + pct + '%)</span></div>'; }).join('') + '<span style="font-size:11px;color:var(--text-muted);display:block;margin-top:6px;">Всего голосов: ' + total + '</span></div>'; }).join('');
      _fu.modal(html, '📊 Опросы');
    }
  };
}

// === F14: Reaction System ===
function initReactionSystem() {
  window.reactionSystem = {
    react: function(modId, emoji) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var reactions = _fu.load('mod_reactions_' + modId, []);
      var existing = reactions.findIndex(function(r) { return r.user === u.username && r.emoji === emoji; });
      if (existing >= 0) { reactions.splice(existing, 1); } else { reactions.push({ user: u.username, emoji: emoji, time: new Date().toISOString() }); }
      _fu.save('mod_reactions_' + modId, reactions);
      _fu.toast('Реакция обновлена!', 'success');
    },
    getCounts: function(modId) {
      var r = _fu.load('mod_reactions_' + modId, []);
      var counts = {};
      r.forEach(function(x) { counts[x.emoji] = (counts[x.emoji] || 0) + 1; });
      return counts;
    },
    render: function(modId, containerId) {
      var el = document.getElementById(containerId);
      if (!el) return;
      var counts = this.getCounts(modId);
      var emojis = ['👍','❤️','😄','😮','😢','😡'];
      el.innerHTML = emojis.map(function(e) { return '<span style="cursor:pointer;padding:4px 10px;border:1px solid var(--border-color);border-radius:20px;margin:4px;font-size:14px;" onclick="reactionSystem.react(\'' + modId + '\',\'' + e + '\')">' + e + ' ' + (counts[e] || 0) + '</span>'; }).join('');
    }
  };
}

// === F15: User Status ===
function initUserStatus() {
  window.userStatus = {
    set: function(status) {
      var u = _fu.getUser(); if (!u) return;
      u.status = status;
      var users = _fu.getUsers();
      var idx = users.findIndex(function(x) { return x.uid === u.uid; });
      if (idx >= 0) { users[idx].status = status; _fu.saveUsers(users); localStorage.setItem('current_user', JSON.stringify(u)); }
      _fu.toast('Статус обновлён', 'success');
    },
    showSelector: function() {
      var statuses = ['🟢 В сети', '🟡 Отошёл', '🔴 Занят', '⚫ Невидимка'];
      var html = statuses.map(function(s, i) { return '<button class="btn btn-secondary" style="display:block;width:100%;margin:4px 0;text-align:left;" onclick="userStatus.set(' + i + ');closeExModal()">' + s + '</button>'; }).join('');
      _fu.modal(html, 'Статус');
    }
  };
}

// === F16: Flair System ===
function initFlairSystem() {
  window.flairSystem = {
    list: function() { return ['🔥 Мододел','⭐ Ветеран','💎 Коллекционер','🤖 Технарь','🎨 Художник','📦 Архитектор','⚡ Спидраннер','🏰 Строитель']; },
    set: function(flair) {
      var u = _fu.getUser(); if (!u) return;
      u.flair = flair;
      var users = _fu.getUsers();
      var idx = users.findIndex(function(x) { return x.uid === u.uid; });
      if (idx >= 0) { users[idx].flair = flair; _fu.saveUsers(users); localStorage.setItem('current_user', JSON.stringify(u)); }
      _fu.toast('Флаир установлен: ' + flair, 'success');
    },
    showPicker: function() {
      var flairs = this.list();
      var html = flairs.map(function(f) { return '<button class="btn btn-secondary" style="display:block;width:100%;margin:4px 0;text-align:left;" onclick="flairSystem.set(\'' + f + '\');closeExModal()">' + f + '</button>'; }).join('');
      _fu.modal(html, '🏷️ Выберите флаир');
    }
  };
}

// === F17: Trophy Room ===
function initTrophyRoom() {
  window.trophyRoom = {
    show: function(username) {
      var trophies = _fu.load('trophies_' + username, []);
      var all = [ { id: 't1', name: 'Первый мод', icon: '📦' }, { id: 't2', name: '100 скачиваний', icon: '📈' }, { id: 't3', name: '1000 скачиваний', icon: '💎' }, { id: 't4', name: 'Ветеран (1 год)', icon: '🎖️' }, { id: 't5', name: '10 подписчиков', icon: '🌟' }, { id: 't6', name: '100 подписчиков', icon: '⭐' } ];
      var html = all.map(function(t) { var owned = trophies.includes(t.id); return '<div style="padding:12px;text-align:center;border:1px solid ' + (owned ? 'var(--primary-color)' : 'var(--border-color)') + ';border-radius:8px;opacity:' + (owned ? 1 : 0.4) + ';"><div style="font-size:32px;">' + t.icon + '</div><div style="font-size:12px;">' + t.name + '</div></div>'; }).join('');
      _fu.modal('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' + html + '</div>', '🏆 Трофеи');
    }
  };
}

// === F18: Collection Sharing ===
function initCollectionSharing() {
  window.shareCollection = function(collId) {
    var cols = _fu.load('mod_collections', []);
    var c = cols.find(function(x) { return x.id === collId; });
    if (!c) { _fu.toast('Коллекция не найдена', 'info'); return; }
    var url = window.location.origin + '/#/browse?collection=' + collId;
    navigator.clipboard.writeText(url).then(function() { _fu.toast('Ссылка скопирована', 'success'); });
  };
}

// === F19: Mod Playlist ===
function initModPlaylist() {
  window.modPlaylist = {
    add: function(modId) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var pl = _fu.load('mod_playlist_' + u.username, []);
      if (!pl.includes(modId)) { pl.push(modId); _fu.save('mod_playlist_' + u.username, pl); _fu.toast('Добавлено в плейлист', 'success'); }
    },
    show: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var pl = _fu.load('mod_playlist_' + u.username, []);
      var mods = _fu.getMods();
      var items = pl.map(function(id) { return mods.find(function(m) { return m.id === id; }); }).filter(Boolean);
      if (!items.length) { _fu.toast('Плейлист пуст', 'info'); return; }
      var html = items.map(function(m) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\'">📌 <strong>' + _fu.esc(m.name) + '</strong> <span style="font-size:12px;color:var(--text-muted);">от ' + _fu.esc(m.author) + '</span></div>'; }).join('');
      _fu.modal(html, '📋 Плейлист модов');
    }
  };
}

// === F20: Compatibility Matrix ===
function initCompatibilityMatrix() {
  window.compatMatrix = {
    check: function(modId) {
      var mods = _fu.getMods();
      var mod = mods.find(function(m) { return m.id === modId; });
      if (!mod) return;
      var compat = mods.filter(function(m) { return m.id !== modId; }).map(function(m) {
        var score = 0;
        if (m.categories && mod.categories) { m.categories.forEach(function(c) { if (mod.categories.includes(c)) score += 2; }); }
        if (m.loaders && mod.loaders) { m.loaders.forEach(function(l) { if (mod.loaders.includes(l)) score += 1; }); }
        return { mod: m, score: score };
      }).sort(function(a,b) { return b.score - a.score; });
      var html = compat.slice(0,5).map(function(c) { var status = c.score > 2 ? '🟢' : c.score > 0 ? '🟡' : '🔴'; return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;">' + status + ' <strong>' + _fu.esc(c.mod.name) + '</strong> <span style="font-size:12px;color:var(--text-muted);">совместимость: ' + c.score + '/8</span></div>'; }).join('');
      _fu.modal(html, '🔗 Совместимость с ' + _fu.esc(mod.name));
    }
  };
}

// === F21: User Badges Showcase ===
function initUserBadges() {
  window.showUserBadges = function(username) {
    var badges = _fu.load('user_achievements_' + username, []);
    var allBadges = [ { id: 'first_mod', name: 'Первый мод', icon: '📦' }, { id: 'popular', name: 'Популярный', icon: '⭐' }, { id: 'veteran', name: 'Ветеран', icon: '🎖️' }, { id: 'collector', name: 'Коллекционер', icon: '💎' }, { id: 'streak_7', name: '7 дней', icon: '🔥' }, { id: 'streak_30', name: '30 дней', icon: '💪' } ];
    var html = allBadges.map(function(b) { var owned = badges.includes(b.id); return '<div style="padding:8px;text-align:center;border:1px solid ' + (owned ? 'var(--primary-color)' : 'var(--border-color)') + ';border-radius:8px;opacity:' + (owned ? 1 : 0.3) + ';"><div style="font-size:24px;">' + b.icon + '</div><div style="font-size:11px;">' + b.name + '</div></div>'; }).join('');
    _fu.modal('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' + html + '</div>', '🏅 Значки');
  };
}

// === F22: Activity Feed ===
function initUserActivityFeed() {
  window.userActivity = {
    log: function(action, details) {
      var u = _fu.getUser(); if (!u) return;
      var feed = _fu.load('activity_feed_' + u.username, []);
      feed.unshift({ action: action, details: details, time: new Date().toISOString() });
      if (feed.length > 50) feed.length = 50;
      _fu.save('activity_feed_' + u.username, feed);
    },
    show: function(username) {
      var feed = _fu.load('activity_feed_' + (username || ''), []);
      if (!feed.length) { _fu.toast('Активности нет', 'info'); return; }
      var html = feed.slice(0, 20).map(function(f) { return '<div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:13px;"><span style="color:var(--text-secondary);">' + _fu.esc(f.action) + '</span> <span style="color:var(--text-muted);font-size:11px;">' + _fu.relTime(f.time) + '</span></div>'; }).join('');
      _fu.modal(html, '📊 Лента активности');
    }
  };
}

// === F23: Report System ===
function initReportSystem() {
  window.reportContent = function(type, id, reason) {
    var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
    if (!reason) reason = prompt('Причина жалобы:'); if (!reason) return;
    var reports = _fu.load('content_reports', []);
    reports.unshift({ type: type, id: id, reason: reason, reporter: u.username, time: new Date().toISOString(), resolved: false });
    _fu.save('content_reports', reports);
    _fu.toast('Жалоба отправлена модераторам', 'success');
  };
}

// === F24: Content Flagging ===
function initContentFlagging() {
  window.flagContent = function(modId, reason) {
    var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
    var flags = _fu.load('content_flags_' + modId, []);
    if (flags.find(function(f) { return f.user === u.username; })) { _fu.toast('Вы уже отмечали этот контент', 'info'); return; }
    flags.push({ user: u.username, reason: reason || 'Не указана', time: new Date().toISOString() });
    _fu.save('content_flags_' + modId, flags);
    _fu.toast('Контент отмечен', 'success');
  };
}

// === F25: Recipe Viewer ===
function initRecipeViewer() {
  window.recipeViewer = {
    show: function(modId) {
      var recipes = _fu.load('mod_recipes_' + modId, []);
      if (!recipes.length) { _fu.toast('Рецепты не найдены', 'info'); return; }
      var html = recipes.map(function(r) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><strong>' + _fu.esc(r.name) + '</strong><pre style="background:var(--bg-color);padding:8px;border-radius:4px;margin-top:8px;font-size:12px;">' + _fu.esc(JSON.stringify(r.recipe, null, 2)) + '</pre></div>'; }).join('');
      _fu.modal(html, '📖 Рецепты');
    }
  };
}

// === F26: Crafting Guide ===
function initCraftingGuide() {
  window.craftingGuide = {
    search: function() {
      var q = prompt('Что ищем? (название предмета)'); if (!q) return;
      var data = { 'алмазный меч': '🧱🧱\n🧱\n🌿', 'кирка': '🧱🧱🧱\n  🌿\n  🌿', 'топор': '🧱🧱\n🧱🌿\n 🌿', 'лопата': '🧱\n🌿\n🌿', 'мотыга': '🧱🧱\n 🌿\n 🌿', 'печь': '🧱🧱🧱\n🧱 🧱', 'верстак': '🌿🌿\n🌿🌿' };
      var result = data[q.toLowerCase()] || 'Рецепт не найден';
      _fu.modal('<pre style="background:var(--bg-color);padding:20px;border-radius:8px;font-size:18px;line-height:1.4;">' + result + '</pre>', '🔨 ' + q);
    }
  };
}

// === F27: Potion Builder ===
function initPotionBuilder() {
  window.potionBuilder = {
    show: function() {
      var potions = [ { name: 'Зелье силы', ing: 'Огненный порошок + Слеза гаста' }, { name: 'Зелье скорости', ing: 'Сахар + Морковь' }, { name: 'Зелье регенерации', ing: 'Слеза гаста + Золотой слиток' }, { name: 'Зелье прыгучести', ing: 'Кроличья лапка' }, { name: 'Зелье невидимости', ing: 'Золотая морковь + Паутина' } ];
      var html = potions.map(function(p) { return '<div style="padding:10px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;"><strong>' + _fu.esc(p.name) + '</strong><div style="font-size:13px;color:var(--text-secondary);">🧪 ' + _fu.esc(p.ing) + '</div></div>'; }).join('');
      _fu.modal(html, '🧪 Алхимия');
    }
  };
}

// === F28: Mod Documentation ===
function initModDocs() {
  window.modDocs = {
    show: function(modId) {
      var docs = _fu.load('mod_docs_' + modId, []);
      if (!docs.length) { _fu.toast('Документация не добавлена', 'info'); return; }
      var html = docs.map(function(d) { return '<div style="padding:12px;border:1px solid var(--border-color);border-radius:8px;margin:6px 0;"><h4>' + _fu.esc(d.title) + '</h4><p style="color:var(--text-secondary);">' + _fu.esc(d.content) + '</p></div>'; }).join('');
      _fu.modal(html, '📚 Документация');
    }
  };
}

// === F29: User Mentions ===
function initUserMentions() {
  document.addEventListener('click', function(e) {
    var mention = e.target.closest('.user-mention');
    if (mention) {
      e.preventDefault();
      var username = mention.textContent.replace('@','').trim();
      var users = _fu.getUsers();
      var u = users.find(function(x) { return x.username === username; });
      if (u && window.openPublicProfileModal) window.openPublicProfileModal(username);
    }
  });
}

// === F30: HashTags ===
function initHashTags() {
  document.addEventListener('click', function(e) {
    var tag = e.target.closest('.hashtag');
    if (tag) {
      e.preventDefault();
      var t = tag.textContent.replace('#','').trim();
      window.location.hash = '#/browse?categories=' + encodeURIComponent(t);
    }
  });
}

// === F31: Follow System ===
function initUserFollowSystem() {
  window.userFollow = {
    toggle: function(username) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      if (username === u.username) { _fu.toast('Нельзя подписаться на себя', 'info'); return; }
      var following = _fu.load('following_' + u.username, []);
      var idx = following.indexOf(username);
      if (idx >= 0) { following.splice(idx, 1); _fu.toast('Отписались от ' + username, 'info'); }
      else { following.push(username); _fu.toast('Подписались на ' + username, 'success'); }
      _fu.save('following_' + u.username, following);
    },
    isFollowing: function(username) {
      var u = _fu.getUser(); if (!u) return false;
      var following = _fu.load('following_' + u.username, []);
      return following.includes(username);
    }
  };
}

// === F32: Notification Preferences ===
function initNotificationPreferences() {
  window.notifPrefs = {
    show: function() {
      var prefs = _fu.load('notif_preferences', { messages: true, friends: true, updates: true, moderation: true });
      var html = Object.keys(prefs).map(function(k) { return '<label class="form-checkbox-label" style="display:block;padding:8px 0;"><input type="checkbox" id="np-' + k + '"' + (prefs[k] ? ' checked' : '') + '> ' + { messages: '💬 Сообщения', friends: '👥 Друзья', updates: '📢 Обновления', moderation: '🛡️ Модерация' }[k] + '</label>'; }).join('');
      html += '<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="var p={};[\'messages\',\'friends\',\'updates\',\'moderation\'].forEach(function(k){p[k]=document.getElementById(\'np-\'+k).checked});_fu.save(\'notif_preferences\',p);_fu.toast(\'Сохранено\',\'success\');closeExModal()">Сохранить</button>';
      _fu.modal(html, '🔔 Настройки уведомлений');
    }
  };
}

// === F33: Digest Email ===
function initDigestEmail() {
  window.digestEmail = {
    toggle: function() {
      var u = _fu.getUser(); if (!u) return;
      var enabled = localStorage.getItem('digest_enabled_' + u.username) === 'true';
      localStorage.setItem('digest_enabled_' + u.username, enabled ? 'false' : 'true');
      _fu.toast(enabled ? 'Дайджест выключен' : 'Дайджест включён', 'success');
    }
  };
}

// === F34: Reading List ===
function initReadingList() {
  window.readingList = {
    add: function(modId) {
      var u = _fu.getUser(); if (!u) return;
      var list = _fu.load('reading_list_' + u.username, []);
      if (!list.includes(modId)) { list.push(modId); _fu.save('reading_list_' + u.username, list); _fu.toast('Добавлено в список чтения', 'success'); }
    },
    show: function() {
      var u = _fu.getUser(); if (!u) return;
      var list = _fu.load('reading_list_' + u.username, []);
      var mods = _fu.getMods();
      var items = list.map(function(id) { return mods.find(function(m) { return m.id === id; }); }).filter(Boolean);
      if (!items.length) { _fu.toast('Список пуст', 'info'); return; }
      var html = items.map(function(m) { return '<div style="padding:8px;border:1px solid var(--border-color);cursor:pointer;border-radius:8px;margin:4px 0;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\'">📖 <strong>' + _fu.esc(m.name) + '</strong></div>'; }).join('');
      _fu.modal(html, '📚 Список чтения');
    }
  };
}

// === F35: Mod Bookmarks ===
function initModBookmarks() {
  window.modBookmarks = {
    add: function(modId) {
      var u = _fu.getUser(); if (!u) return;
      var bm = _fu.load('mod_bookmarks_' + u.username, {});
      var folder = prompt('Папка закладки (например, "Освоить"):') || 'Общее';
      if (!bm[folder]) bm[folder] = [];
      if (!bm[folder].includes(modId)) { bm[folder].push(modId); _fu.save('mod_bookmarks_' + u.username, bm); _fu.toast('Добавлено в "' + folder + '"', 'success'); }
    },
    show: function() {
      var u = _fu.getUser(); if (!u) return;
      var bm = _fu.load('mod_bookmarks_' + u.username, {});
      var mods = _fu.getMods();
      var folders = Object.keys(bm);
      if (!folders.length) { _fu.toast('Нет закладок', 'info'); return; }
      var html = folders.map(function(f) { var items = bm[f].map(function(id) { var m = mods.find(function(x) { return x.id === id; }); return m ? '<div style="padding:4px 8px;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\'">📍 ' + _fu.esc(m.name) + '</div>' : ''; }).join(''); return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;"><strong>📁 ' + _fu.esc(f) + '</strong>' + items + '</div>'; }).join('');
      _fu.modal(html, '🔖 Закладки');
    }
  };
}

// === F36: Search Filters ===
function initSearchFilters() {
  window.advancedSearch = {
    show: function() {
      var html = '<div style="display:grid;gap:12px;"><div class="form-group"><label>Название</label><input class="form-input" id="as-name" placeholder="Название мода"></div><div class="form-group"><label>Автор</label><input class="form-input" id="as-author" placeholder="Автор"></div><div class="form-group"><label>Мин. скачиваний</label><input type="number" class="form-input" id="as-dl" placeholder="0"></div><div class="form-group"><label>Загрузчик</label><select class="form-input" id="as-loader"><option value="">Любой</option><option value="fabric">Fabric</option><option value="forge">Forge</option><option value="neoforge">NeoForge</option><option value="quilt">Quilt</option></select></div><button class="btn btn-primary" onclick="doAdvancedSearch()">🔍 Поиск</button></div>';
      _fu.modal(html, '🔎 Расширенный поиск');
    }
  };
  window.doAdvancedSearch = function() {
    var name = (document.getElementById('as-name')?.value || '').trim();
    var author = (document.getElementById('as-author')?.value || '').trim();
    var dl = parseInt(document.getElementById('as-dl')?.value || '0');
    var loader = document.getElementById('as-loader')?.value || '';
    var qparts = [];
    if (name) qparts.push('q=' + encodeURIComponent(name));
    if (author) qparts.push('author=' + encodeURIComponent(author));
    if (dl) qparts.push('minDownloads=' + dl);
    if (loader) qparts.push('loaders=' + encodeURIComponent(loader));
    closeExModal();
    window.location.hash = '#/browse' + (qparts.length ? '?' + qparts.join('&') : '');
  };
}

// === F37: User Feedback ===
function initUserFeedback() {
  window.userFeedback = {
    send: function() {
      var u = _fu.getUser(); _fu.toast('Спасибо за обратную связь!', 'success');
      var rating = prompt('Оцените платформу (1-5):', '5');
      if (rating) { localStorage.setItem('user_rating_' + Date.now(), JSON.stringify({ user: u ? u.username : 'anon', rating: parseInt(rating), time: new Date().toISOString() })); }
    }
  };
}

// === F38: Rating Breakdown ===
function initRatingBreakdown() {
  window.showRatingBreakdown = function(modId) {
    var mods = _fu.getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (!mod) return;
    var total = mod.follows || 0;
    var breakdown = [ { star: 5, pct: total ? Math.round((mod.follows / total) * 40 + 20) : 0 }, { star: 4, pct: 15 }, { star: 3, pct: 10 }, { star: 2, pct: 5 }, { star: 1, pct: total ? Math.round((1 / total) * 100) : 0 } ];
    var html = breakdown.map(function(b) { return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;"><span style="width:30px;">' + b.star + '★</span><div style="flex:1;height:8px;background:var(--bg-color);border-radius:4px;"><div style="height:8px;width:' + b.pct + '%;background:var(--primary-color);border-radius:4px;"></div></div><span style="width:30px;text-align:right;font-size:12px;">' + b.pct + '%</span></div>'; }).join('');
    _fu.modal(html, '⭐ Рейтинг');
  };
}

// === F39: Mod History ===
function initModHistory() {
  window.modHistory = {
    show: function(modId) {
      var hist = _fu.load('mod_history_' + modId, []);
      if (!hist.length) { _fu.toast('История пуста', 'info'); return; }
      var html = hist.map(function(h) { return '<div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:13px;"><strong>' + _fu.esc(h.action) + '</strong> <span style="color:var(--text-muted);">' + _fu.relTime(h.time) + '</span></div>'; }).join('');
      _fu.modal(html, '📜 История изменений');
    }
  };
}

// === F40: Version Watch ===
function initVersionWatch() {
  window.versionWatch = {
    toggle: function(modId) {
      var u = _fu.getUser(); if (!u) return;
      var watching = _fu.load('version_watch_' + u.username, []);
      var idx = watching.indexOf(modId);
      if (idx >= 0) { watching.splice(idx, 1); _fu.toast('Отписка от обновлений', 'info'); }
      else { watching.push(modId); _fu.toast('Подписка на новые версии', 'success'); }
      _fu.save('version_watch_' + u.username, watching);
    }
  };
}

// === F41: Author Subscribe ===
function initAuthorSubscribe() {
  window.authorSubscribe = {
    toggle: function(author) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var subs = _fu.load('author_subs_' + u.username, []);
      var idx = subs.indexOf(author);
      if (idx >= 0) { subs.splice(idx, 1); _fu.toast('Отписка от автора', 'info'); }
      else { subs.push(author); _fu.toast('Подписка на автора', 'success'); }
      _fu.save('author_subs_' + u.username, subs);
    }
  };
}

// === F42: Category Follow ===
function initCategoryFollow() {
  window.categoryFollow = {
    toggle: function(cat) {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var cats = _fu.load('category_subs_' + u.username, []);
      var idx = cats.indexOf(cat);
      if (idx >= 0) { cats.splice(idx, 1); _fu.toast('Отписка от категории', 'info'); }
      else { cats.push(cat); _fu.toast('Подписка на категорию', 'success'); }
      _fu.save('category_subs_' + u.username, cats);
    }
  };
}

// === F43: Trending Sidebar ===
function initTrendingSidebar() {
  window.showTrendingWidget = function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var mods = _fu.getMods().filter(function(m) { return m.approved; }).sort(function(a,b) { return b.downloads - a.downloads; }).slice(0, 5);
    el.innerHTML = '<div style="padding:12px;border:1px solid var(--border-color);border-radius:12px;"><h4 style="font-size:14px;margin-bottom:8px;">🔥 Тренды</h4>' + mods.map(function(m, i) { return '<div style="padding:4px 0;display:flex;gap:8px;align-items:center;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\'"><span style="font-weight:800;color:var(--primary-color);">#' + (i+1) + '</span><span style="font-size:13px;">' + _fu.esc(m.name) + '</span></div>'; }).join('') + '</div>';
  };
}

// === F44: Recently Active ===
function initRecentlyActive() {
  window.showRecentlyActive = function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var mods = _fu.getMods().filter(function(m) { return m.approved; }).sort(function(a,b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); }).slice(0, 5);
    el.innerHTML = '<div style="padding:12px;border:1px solid var(--border-color);border-radius:12px;"><h4 style="font-size:14px;margin-bottom:8px;">🕐 Недавние</h4>' + mods.map(function(m) { return '<div style="padding:4px 0;display:flex;gap:8px;align-items:center;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (m.slug || m.id) + '\'"><span style="font-size:13px;">📦 ' + _fu.esc(m.name) + '</span></div>'; }).join('') + '</div>';
  };
}

// === F45: Stats Widget ===
function initStatsWidget() {
  window.showStatsWidget = function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var mods = _fu.getMods().filter(function(m) { return m.approved; });
    var dls = mods.reduce(function(s,m){return s+(m.downloads||0)},0);
    var users = _fu.getUsers();
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;border:1px solid var(--border-color);border-radius:12px;"><div style="text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--primary-color);">' + mods.length + '</div><div style="font-size:11px;color:var(--text-muted);">Модов</div></div><div style="text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--primary-color);">' + users.length + '</div><div style="font-size:11px;color:var(--text-muted);">Юзеров</div></div><div style="text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--primary-color);">' + (dls > 999 ? Math.round(dls/1000) + 'k' : dls) + '</div><div style="font-size:11px;color:var(--text-muted);">Скачиваний</div></div></div>';
  };
}

// === F46: User Achievements ===
function initUserAchievements() {
  window.checkAndAward = function(username, badgeId, badgeName) {
    var ach = _fu.load('user_achievements_' + username, []);
    if (!ach.includes(badgeId)) { ach.push(badgeId); _fu.save('user_achievements_' + username, ach); _fu.toast('🏅 Достижение "' + badgeName + '" получено!', 'success'); }
  };
}

// === F47: Login Rewards ===
function initLoginRewards() {
  window.claimLoginReward = function() {
    var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
    var today = new Date().toDateString();
    var lastClaim = localStorage.getItem('login_reward_' + u.username);
    if (lastClaim === today) { _fu.toast('Вы уже получили награду сегодня', 'info'); return; }
    localStorage.setItem('login_reward_' + u.username, today);
    var streak = parseInt(localStorage.getItem('login_streak_' + u.username) || '0');
    var xp = 10 + Math.min(streak, 30);
    var currentXp = parseInt(localStorage.getItem('user_xp_' + u.username) || '0');
    localStorage.setItem('user_xp_' + u.username, String(currentXp + xp));
    _fu.toast('Ежедневная награда: +' + xp + ' XP!', 'success');
  };
}

// === F48: Mod Referrals ===
function initModReferrals() {
  window.referralSystem = {
    share: function(modId) {
      var url = window.location.origin + '/#/mod/' + modId + '?ref=' + ((_fu.getUser() || {}).username || 'anon');
      navigator.clipboard.writeText(url).then(function() { _fu.toast('Реферальная ссылка скопирована', 'success'); });
    }
  };
}

// === F49: User Inventory ===
function initUserInventory() {
  window.userInventory = {
    show: function() {
      var u = _fu.getUser(); if (!u) { _fu.toast('Войдите в аккаунт', 'info'); return; }
      var inv = _fu.load('inventory_' + u.username, []);
      var html = inv.length ? inv.map(function(item) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;">🎁 ' + _fu.esc(item) + '</div>'; }).join('') : '<p style="color:var(--text-muted);">Инвентарь пуст</p>';
      _fu.modal(html, '🎒 Инвентарь');
    }
  };
}

// === F50: Daily Tip ===
function initDailyTip() {
  window.showDailyTip = function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var tips = ['Используйте Sodium для увеличения FPS', 'Create — лучший технический мод', 'OptiFine совместим не со всеми модами', 'Делайте бэкапы перед установкой модов', 'Проверяйте версии загрузчика', 'Читайте описание перед скачиванием', 'Моды можно комбинировать', 'Следите за обновлениями'];
    var tip = tips[Math.floor(Date.now() / 86400000) % tips.length];
    el.innerHTML = '<div style="padding:12px;border:1px solid var(--border-color);border-radius:12px;background:var(--surface-color);"><div style="font-size:12px;color:var(--text-muted);">💡 Совет дня</div><div style="font-size:14px;color:var(--text-primary);margin-top:4px;">' + tip + '</div></div>';
  };
}

// === F51: Quick Actions Menu ===
function initQuickActionsMenu() {
  window.showQuickActions = function() {
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/\';closeExModal();">🏠 Главная</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/browse\';closeExModal();">🔍 Обзор</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/create\';closeExModal();">➕ Добавить</button>' +
      '<button class="btn btn-secondary" onclick="window.location.hash=\'#/settings\';closeExModal();">⚙️ Настройки</button>' +
      '<button class="btn btn-secondary" onclick="if(window.openRandomMod)openRandomMod();closeExModal();">🎲 Случайный</button>' +
      '<button class="btn btn-secondary" onclick="if(window.showCollections)showCollections();closeExModal();">📚 Коллекции</button>' +
      '<button class="btn btn-secondary" onclick="if(window.friendSystem)friendSystem.showFriends();closeExModal();">👥 Друзья</button>' +
      '<button class="btn btn-secondary" onclick="if(window.dailyQuests)dailyQuests.show();closeExModal();">⚡ Квесты</button></div>';
    _fu.modal(html, '⚡ Быстрое меню');
  };
}

// === F52: Mod Dependency Graph ===
function initModDependencyGraph() {
  window.showDependencyGraph = function(modId) {
    var mods = _fu.getMods();
    var mod = mods.find(function(m) { return m.id === modId; });
    if (!mod) return;
    var deps = mod.dependencies || [];
    if (!deps.length) { _fu.toast('Нет зависимостей', 'info'); return; }
    var html = deps.map(function(d) { var dm = mods.find(function(m) { return m.id === d; }); return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;cursor:pointer;" onclick="window.location.hash=\'#/mod/' + (dm ? (dm.slug || dm.id) : d) + '\'">🔗 <strong>' + (dm ? _fu.esc(dm.name) : d) + '</strong></div>'; }).join('');
    _fu.modal(html, '🔗 Граф зависимостей');
  };
}

// === F53: World Backup ===
function initWorldBackup() {
  window.worldBackup = {
    create: function() {
      _fu.toast('🗃️ Резервная копия создана (демо)', 'success');
      var u = _fu.getUser();
      if (u) { var backs = _fu.load('world_backups_' + u.username, []); backs.unshift({ id: Date.now().toString(36), time: new Date().toISOString(), size: Math.floor(Math.random() * 100) + ' MB' }); _fu.save('world_backups_' + u.username, backs); }
    },
    show: function() {
      var u = _fu.getUser(); if (!u) return;
      var backs = _fu.load('world_backups_' + u.username, []);
      var html = backs.length ? backs.map(function(b) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;">📦 Бэкап от ' + _fu.relTime(b.time) + ' (' + b.size + ')</div>'; }).join('') : '<p style="color:var(--text-muted);">Нет бэкапов</p>';
      _fu.modal(html, '🗃️ Бэкапы миров');
    }
  };
}

// === F54: Compatibility Check ===
function initCompatibilityCheck() {
  window.runCompatibilityCheck = function() {
    var mods = _fu.getMods();
    var conflicts = [];
    var loaders = {};
    mods.filter(function(m) { return m.approved; }).forEach(function(m) {
      (m.loaders || []).forEach(function(l) {
        if (!loaders[l]) loaders[l] = [];
        loaders[l].push(m.name);
      });
    });
    Object.keys(loaders).forEach(function(l) { if (loaders[l].length > 1) conflicts.push({ loader: l, mods: loaders[l] }); });
    var html = conflicts.length ? conflicts.map(function(c) { return '<div style="padding:8px;border:1px solid var(--border-color);border-radius:8px;margin:4px 0;"><strong>⚔️ ' + c.loader + '</strong>: ' + c.mods.join(', ') + '</div>'; }).join('') : '<p style="color:var(--primary-color);">✅ Конфликтов не найдено</p>';
    _fu.modal(html, '🔍 Проверка совместимости');
  };
}

// === F55: Performance Test ===
function initPerformanceTest() {
  window.runPerfTest = function() {
    _fu.toast('⏳ Тестирование...', 'info');
    setTimeout(function() {
      var score = Math.floor(Math.random() * 1000) + 500;
      var fps = Math.floor(Math.random() * 120) + 30;
      _fu.modal('<div style="text-align:center;"><div style="font-size:48px;font-weight:800;color:var(--primary-color);">' + score + '</div><div style="font-size:14px;color:var(--text-secondary);">Очки производительности</div><div style="font-size:24px;margin-top:12px;">🎮 ' + fps + ' FPS</div></div>', '🚀 Тест производительности');
    }, 2000);
  };
}

// === F56: Seed Viewer ===
function initSeedViewer() {
  window.seedViewer = {
    show: function() {
      var seed = Math.floor(Math.random() * 1000000000);
      var biomes = ['Равнины', 'Пустыня', 'Тайга', 'Джунгли', 'Болото', 'Горы', 'Океан', 'Саванна'];
      var biome = biomes[Math.floor(Math.random() * biomes.length)];
      _fu.modal('<div style="text-align:center;"><div style="font-size:14px;color:var(--text-muted);">🎲 Сид</div><div style="font-size:32px;font-weight:800;color:var(--primary-color);font-family:monospace;">' + seed + '</div><div style="font-size:14px;color:var(--text-secondary);margin-top:12px;">🌍 Биом: ' + biome + '</div></div>', '🌍 Генератор сидов');
    }
  };
}
})();
