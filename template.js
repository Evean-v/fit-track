// ===== Template 视图 =====
const TemplateView = {
  currentTab: 'templates',   // 'templates' | 'exercises'
  editingTemplate: null,

  render() {
    const page = document.getElementById('page-train');
    page.innerHTML = `
      <div class="header">
        <div class="header-left"></div>
        <div class="header-title">训练</div>
        <div class="header-right">
          <button class="btn-icon" onclick="TemplateView.showCreateModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
      <div class="filter-tabs" id="template-tabs">
        <button class="filter-tab active" data-tab="templates" onclick="TemplateView.switchTab('templates')">训练模版</button>
        <button class="filter-tab" data-tab="exercises" onclick="TemplateView.switchTab('exercises')">动作库</button>
      </div>
      <div class="main" id="template-content"></div>
    `;
    this.renderTemplates();
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('#template-tabs .filter-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'templates') this.renderTemplates();
    else ExerciseBrowser.render();
  },

  async renderTemplates() {
    const el = document.getElementById('template-content');
    const templates = await getTemplates();
    if (templates.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>
          <p>还没有训练模版<br>点右上角 + 创建一个</p>
        </div>`;
      return;
    }
    el.innerHTML = '<div class="list">' + templates.map(t => `
      <div class="list-item" onclick="TemplateView.startWorkout('${t.id}')">
        <div class="list-item-left">
          <div class="list-item-title">${escHtml(t.name)}</div>
          <div class="list-item-sub">${t.exercises.length} 个动作</div>
        </div>
        <div class="list-item-right">
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();TemplateView.editTemplate('${t.id}')">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();TemplateView.confirmDelete('${t.id}')" style="margin-left:6px">删除</button>
        </div>
      </div>
    `).join('') + '</div>';
  },

  showCreateModal() {
    this.editingTemplate = null;
    this.showTemplateModal('创建训练模版', '');
  },

  async editTemplate(id) {
    const tpl = await getTemplate(id);
    if (!tpl) return;
    this.editingTemplate = tpl;
    this.showTemplateModal('编辑模版', tpl.name);
  },

  showTemplateModal(title, name) {
    const overlay = document.getElementById('modal-template');
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${title}</div>
        <div class="form-group">
          <label class="form-label">模版名称</label>
          <input class="form-input" id="tpl-name" value="${escHtml(name)}" placeholder="例如：推拉腿" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">选择动作</label>
          <div id="tpl-exercise-list" style="max-height:300px;overflow-y:auto"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="TemplateView.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="TemplateView.saveTemplate()">保存</button>
        </div>
      </div>`;
    overlay.classList.add('open');
    this.renderExercisesSelector();
  },

  closeModal() {
    document.getElementById('modal-template').classList.remove('open');
  },

  selectedExercises: new Set(),

  async renderExercisesSelector() {
    const el = document.getElementById('tpl-exercise-list');
    const all = await getAllExercises();
    const editTpl = this.editingTemplate;
    if (editTpl) {
      this.selectedExercises = new Set(editTpl.exercises.map(e => e.exerciseId));
    } else {
      this.selectedExercises = new Set();
    }
    if (all.length === 0) { el.innerHTML = '<p style="color:var(--text-secondary);padding:8px;">暂无动作，请先在动作库中添加</p>'; return; }
    el.innerHTML = all.map(ex => {
      const checked = this.selectedExercises.has(ex.id) ? 'checked' : '';
      return `<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--border);cursor:pointer;">
        <input type="checkbox" ${checked} value="${ex.id}" onchange="TemplateView.toggleExercise('${ex.id}')" style="width:18px;height:18px;accent-color:var(--primary)">
        <span style="flex:1">${escHtml(ex.name)}</span>
        <span class="badge badge-sm">${escHtml(ex.muscleGroup)}</span>
      </label>`;
    }).join('');
  },

  toggleExercise(id) {
    if (this.selectedExercises.has(id)) this.selectedExercises.delete(id);
    else this.selectedExercises.add(id);
  },

  async saveTemplate() {
    const name = document.getElementById('tpl-name').value.trim();
    if (!name) { alert('请输入模版名称'); return; }
    if (this.selectedExercises.size === 0) { alert('请至少选择一个动作'); return; }
    const exercises = Array.from(this.selectedExercises).map((exerciseId, i) => ({ exerciseId, sortOrder: i }));
    if (this.editingTemplate) {
      await saveTemplate({ ...this.editingTemplate, name, exercises });
    } else {
      await saveTemplate({ name, exercises });
    }
    this.closeModal();
    this.switchTab('templates');
  },

  async confirmDelete(id) {
    if (confirm('确定删除这个模版吗？')) {
      await deleteTemplate(id);
      this.renderTemplates();
    }
  },

  async startWorkout(id) {
    const tpl = await getTemplate(id);
    if (!tpl) return;
    App.navigate('workout', { templateId: id });
  }
};

// ===== Exercise Browser (动作库) =====
const ExerciseBrowser = {
  currentGroup: '全部',

  async render() {
    const el = document.getElementById('template-content');
    el.innerHTML = `
      <div class="filter-tabs" id="ex-group-tabs" style="padding-top:0">
        ${MUSCLE_GROUPS.map(g => `<button class="filter-tab ${g === this.currentGroup ? 'active' : ''}" onclick="ExerciseBrowser.filter('${g}')">${g}</button>`).join('')}
      </div>
      <div id="ex-list" style="flex:1;overflow-y:auto"></div>
    `;
    await this.renderList();
  },

  filter(group) {
    this.currentGroup = group;
    document.querySelectorAll('#ex-group-tabs .filter-tab').forEach(t => t.classList.toggle('active', t.textContent === group));
    this.renderList();
  },

  async renderList() {
    const el = document.getElementById('ex-list');
    const exercises = await getExercisesByGroup(this.currentGroup);
    if (exercises.length === 0) {
      el.innerHTML = `<div class="empty-state"><p>没有找到动作</p></div>`;
      return;
    }
    el.innerHTML = '<div class="list">' + exercises.map(ex => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${escHtml(ex.name)}</div>
          <div class="list-item-sub">${escHtml(ex.muscleGroup)}${ex.isCustom ? ' · 自定义' : ''}</div>
        </div>
        ${ex.isCustom ? `
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-outline" onclick="ExerciseBrowser.editCustom('${ex.id}')">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="ExerciseBrowser.deleteCustom('${ex.id}')">删除</button>
        </div>` : ''}
      </div>
    `).join('') + '</div>';

    // 底部添加动作按钮
    el.innerHTML += `
      <div style="padding:0 16px 16px">
        <button class="btn btn-block btn-outline btn-lg" onclick="ExerciseBrowser.showAddForm()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加自定义动作
        </button>
      </div>`;
  },

  showAddForm() {
    this.showExerciseModal('添加自定义动作', '', '胸');
  },

  async editCustom(id) {
    const ex = await dbGet('exercises', id);
    if (!ex) return;
    this.showExerciseModal('编辑动作', ex.name, ex.muscleGroup, id);
  },

  showExerciseModal(title, name, group, editId) {
    const overlay = document.getElementById('modal-template');
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${title}</div>
        <div class="form-group">
          <label class="form-label">动作名称</label>
          <input class="form-input" id="ex-name" value="${escHtml(name)}" placeholder="例如：深蹲" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">肌群</label>
          <select class="form-input" id="ex-group" style="appearance:auto">
            ${MUSCLE_GROUPS.filter(g => g !== '全部').map(g => `<option value="${g}" ${g === group ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="TemplateView.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="ExerciseBrowser.saveExercise('${editId || ''}')">保存</button>
        </div>
      </div>`;
    overlay.classList.add('open');
  },

  async saveExercise(editId) {
    const name = document.getElementById('ex-name').value.trim();
    const group = document.getElementById('ex-group').value;
    if (!name) { alert('请输入动作名称'); return; }
    if (editId) {
      await updateCustomExercise(editId, name, group);
    } else {
      await addCustomExercise(name, group);
    }
    TemplateView.closeModal();
    this.renderList();
  },

  async deleteCustom(id) {
    if (confirm('确定删除这个自定义动作吗？')) {
      await deleteCustomExercise(id);
      this.renderList();
    }
  }
};
