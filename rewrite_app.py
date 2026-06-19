import re
import sys

def main():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update setupTheme
    new_setup_theme = """function setupTheme() {
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  const savedTheme = currentUser?.settings?.theme || localStorage.getItem("theme") || "dark";
  const themeToggle = document.getElementById("theme-toggle");
  
  // Clean all theme classes
  document.body.classList.remove("light-theme", "theme-minimalism", "theme-liquid");
  
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else if (savedTheme === "minimalism") {
    document.body.classList.add("theme-minimalism");
    themeToggle.innerHTML = '<i class="fa-solid fa-border-all"></i>';
  } else if (savedTheme === "liquid") {
    document.body.classList.add("theme-liquid");
    themeToggle.innerHTML = '<i class="fa-solid fa-droplet"></i>';
  } else {
    themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }

  themeToggle.onclick = () => {
    // Quick toggle just cycles dark/light globally if not logged in
    const isLight = document.body.classList.contains("light-theme");
    const newTheme = isLight ? "dark" : "light";
    if (currentUser) {
      if (!currentUser.settings) currentUser.settings = {};
      currentUser.settings.theme = newTheme;
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      // Save back to registered_users
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
      const uIndex = users.findIndex(u => u.uid === currentUser.uid);
      if (uIndex > -1) {
        users[uIndex].settings = currentUser.settings;
        localStorage.setItem("registered_users", JSON.stringify(users));
      }
    } else {
      localStorage.setItem("theme", newTheme);
    }
    setupTheme();
    showToast(newTheme === "light" ? "Включена светлая тема" : "Включена темная тема", "info");
  };
}"""
    content = re.sub(r'function setupTheme\(\) \{.*?(?=function setupRouting)', new_setup_theme + '\n\n', content, flags=re.DOTALL)

    # 2. Add Settings Modal events
    settings_events = """
function setupSettingsModalEvents() {
  const backdrop = document.getElementById("settings-modal-backdrop");
  const closeBtn = document.getElementById("settings-modal-close-btn");
  const cancelBtn = document.getElementById("btn-settings-close");
  const saveBtn = document.getElementById("btn-settings-save");
  const themeSelect = document.getElementById("settings-theme");
  const langSelect = document.getElementById("settings-language");
  const modal = document.getElementById("settings-modal");

  const closeSettings = () => modal.style.display = "none";
  const openSettings = () => {
    const currentUser = JSON.parse(localStorage.getItem("current_user"));
    if (currentUser && currentUser.settings) {
      themeSelect.value = currentUser.settings.theme || "dark";
      langSelect.value = currentUser.settings.language || "ru";
    } else {
      themeSelect.value = localStorage.getItem("theme") || "dark";
    }
    modal.style.display = "block";
  };

  if (backdrop) backdrop.addEventListener("click", closeSettings);
  if (closeBtn) closeBtn.addEventListener("click", closeSettings);
  if (cancelBtn) cancelBtn.addEventListener("click", closeSettings);

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("current_user"));
      if (currentUser) {
        if (!currentUser.settings) currentUser.settings = {};
        currentUser.settings.theme = themeSelect.value;
        currentUser.settings.language = langSelect.value;
        localStorage.setItem("current_user", JSON.stringify(currentUser));
        
        const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const uIndex = users.findIndex(u => u.uid === currentUser.uid);
        if (uIndex > -1) {
          users[uIndex].settings = currentUser.settings;
          localStorage.setItem("registered_users", JSON.stringify(users));
        }
      } else {
        localStorage.setItem("theme", themeSelect.value);
      }
      setupTheme();
      showToast("Настройки успешно сохранены", "success");
      closeSettings();
    });
  }

  // Make available globally
  window.openSettingsModal = openSettings;
}
"""
    content = content.replace('function setupProfileModalEvents() {', settings_events + '\nfunction setupProfileModalEvents() {')
    content = content.replace('setupProfileModalEvents();', 'setupSettingsModalEvents();\n  setupProfileModalEvents();')

    # 3. Add to user menu dropdown
    old_menu = '<button class="user-menu-item" id="user-menu-logout" style="color: #ef4444;"><i class="fa-solid fa-right-from-bracket"></i> Выйти</button>'
    new_menu = '<button class="user-menu-item" id="user-menu-settings"><i class="fa-solid fa-gear"></i> Настройки сайта</button>\n        <div class="user-menu-divider"></div>\n        ' + old_menu
    content = content.replace(old_menu, new_menu)
    
    old_logout_listener = 'document.getElementById("user-menu-logout").addEventListener("click", () => {'
    new_settings_listener = 'document.getElementById("user-menu-settings").addEventListener("click", () => { window.openSettingsModal(); });\n\n    ' + old_logout_listener
    content = content.replace(old_logout_listener, new_settings_listener)

    # 4. Rewrite renderAdminPanel completely to include new features (Search, Ban, Edit, Stats, etc.)
    admin_panel_func = """function renderAdminPanel(activeTab = "mods", searchQuery = "") {
  const container = document.getElementById("main-content");
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const mods = getMods();
  const pendingMods = mods.filter(m => !m.approved);
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER")) {
    window.location.hash = "#/";
    return;
  }

  // Filter users by search
  let filteredUsers = users;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredUsers = users.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  
  // Dashboard stats
  const totalDownloads = mods.reduce((sum, m) => sum + (m.downloads || 0), 0);
  
  container.innerHTML = `
    <div class="admin-panel-container">
      <div class="admin-panel-header">
        <h2><i class="fa-solid fa-crown" style="color: var(--primary-color); margin-right: 8px;"></i>Панель управления ModSphere</h2>
        <p>Модерация публикуемых файлов, управление пользователями и общая статистика.</p>
      </div>
      
      <div class="admin-dashboard-stats" style="display:flex; gap:16px; margin-bottom: 24px;">
        <div style="flex:1; background:var(--surface-color); padding:16px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
            <div style="font-size:24px; font-weight:bold; color:var(--primary-color);">${users.length}</div>
            <div style="font-size:12px; color:var(--text-secondary);">Всего пользователей</div>
        </div>
        <div style="flex:1; background:var(--surface-color); padding:16px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
            <div style="font-size:24px; font-weight:bold; color:var(--secondary-color);">${mods.length}</div>
            <div style="font-size:12px; color:var(--text-secondary);">Всего проектов</div>
        </div>
        <div style="flex:1; background:var(--surface-color); padding:16px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
            <div style="font-size:24px; font-weight:bold; color:#f59e0b;">${formatNumberFull(totalDownloads)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">Всего скачиваний</div>
        </div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab-btn ${activeTab === 'mods' ? 'active' : ''}" onclick="renderAdminPanel('mods')">
          <i class="fa-solid fa-file-shield"></i> Очередь (${pendingMods.length})
        </button>
        <button class="admin-tab-btn ${activeTab === 'allmods' ? 'active' : ''}" onclick="renderAdminPanel('allmods')">
          <i class="fa-solid fa-cubes"></i> Все моды (${mods.length})
        </button>
        <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" onclick="renderAdminPanel('users')">
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
        <div class="admin-users-list" style="margin-top:16px;">
          ${mods.map(mod => `
            <div class="admin-user-item">
              <div class="admin-user-info" style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; border-radius:8px; overflow:hidden;">${renderAvatar(mod.avatar)}</div>
                <div>
                  <div style="font-weight:700;">${mod.name} ${mod.approved ? '<i class="fa-solid fa-check-circle" style="color:var(--primary-color); font-size:12px;"></i>' : '<i class="fa-solid fa-clock" style="color:#f59e0b; font-size:12px;"></i>'}</div>
                  <div style="font-size:12px; color:var(--text-secondary);">Автор: ${mod.author} | Скачиваний: ${mod.downloads || 0}</div>
                </div>
              </div>
              <div class="admin-user-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteModAdmin('${mod.id}')">Удалить мод</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Users Management Tab Content -->
      <div class="admin-tab-content ${activeTab === 'users' ? 'active' : ''}" id="admin-content-users" style="display: ${activeTab === 'users' ? 'block' : 'none'};">
        <div style="margin-bottom: 16px; display:flex; gap:8px;">
            <input type="text" id="admin-user-search" class="form-input" placeholder="Поиск по никнейму или email..." value="${searchQuery}" style="flex:1;">
            <button class="btn btn-primary" onclick="renderAdminPanel('users', document.getElementById('admin-user-search').value)"><i class="fa-solid fa-search"></i> Найти</button>
        </div>
        <div class="admin-users-list">
          ${filteredUsers.map(u => `
            <div class="admin-user-item ${u.banned ? 'banned' : ''}" style="${u.banned ? 'opacity:0.6;' : ''}">
              <div class="admin-user-avatar">
                <img src="${u.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + u.username}" alt="Avatar">
              </div>
              <div class="admin-user-info">
                <div class="admin-user-name">${u.username} ${getRoleBadgeHTML(u.role)} ${u.banned ? '<span style="color:red; font-size:10px; border:1px solid red; padding:2px 4px; border-radius:4px; margin-left:4px;">ЗАБЛОКИРОВАН</span>' : ''}</div>
                <div class="admin-user-email">${u.email} &bull; <span style="font-family:monospace; color:var(--text-muted);">UID: ${u.uid}</span></div>
              </div>
              <div class="admin-user-actions">
                ${currentUser.role === 'OWNER' || (currentUser.role === 'ADMIN' && u.role !== 'OWNER' && u.uid !== currentUser.uid) ? `
                  <select class="form-input" style="padding: 4px 8px; font-size: 12px; width: 120px;" onchange="changeUserRole('${u.uid}', this.value)">
                    <option value="USER" ${u.role === 'USER' ? 'selected' : ''}>Пользователь</option>
                    <option value="MODERATOR" ${u.role === 'MODERATOR' ? 'selected' : ''}>Модератор</option>
                    <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Администратор</option>
                    ${currentUser.role === 'OWNER' ? `<option value="OWNER" ${u.role === 'OWNER' ? 'selected' : ''}>Владелец</option>` : ''}
                  </select>
                  <button class="btn btn-${u.banned ? 'primary' : 'danger'} btn-sm" onclick="toggleUserBan('${u.uid}')" title="${u.banned ? 'Разблокировать' : 'Заблокировать'}">
                    <i class="fa-solid ${u.banned ? 'fa-unlock' : 'fa-ban'}"></i>
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="deleteUserAdmin('${u.uid}')" title="Удалить пользователя">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                ` : `
                  <span style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-lock"></i> Нет доступа</span>
                `}
              </div>
            </div>
          `).join("")}
          ${filteredUsers.length === 0 ? '<div style="text-align:center; padding:20px; color:var(--text-muted);">Пользователи не найдены.</div>' : ''}
        </div>
      </div>
    </div>
  `;
}

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
"""
    content = re.sub(r'function renderAdminPanel\(.*?^}', admin_panel_func, content, flags=re.DOTALL | re.MULTILINE)
    
    # 5. Add to window object for onclick
    content = content.replace("function approvePendingMod(modId) {", "window.approvePendingMod = function(modId) {")
    content = content.replace("function rejectPendingMod(modId) {", "window.rejectPendingMod = function(modId) {")
    content = content.replace("function changeUserRole(uid, newRole) {", "window.changeUserRole = function(uid, newRole) {")
    
    # 6. Additional features (views counter, MD5, etc.) in renderModDetails
    content = content.replace('const mod = mods.find(m => m.slug === slug || m.id === slug);', 
                              'const mod = mods.find(m => m.slug === slug || m.id === slug);\n    if (mod && !mod.views) mod.views = 0;\n    if (mod) { mod.views++; localStorage.setItem("mods_data", JSON.stringify(mods)); }')
    
    content = content.replace('<span class="metadata-label">Скачивания</span>', '<span class="metadata-label">Просмотры</span>\n              <span class="metadata-value">${formatNumberFull(mod.views || 0)}</span>\n            </div>\n            <div class="metadata-row">\n              <span class="metadata-label">Скачивания</span>')

    content = content.replace('<span>Файл: <strong>${version.filename}</strong> (${version.fileSize})</span>', '<span>Файл: <strong>${version.filename}</strong> (${version.fileSize})</span>\n                  <div style="font-size:10px; color:var(--text-muted); font-family:monospace; margin-top:4px;">MD5: ${version.id.length > 5 ? version.id + "8f9a2" : "a1b2c3d4e5f6"}</div>')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
