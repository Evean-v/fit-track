// ===== 训练模版页面 =====
const TemplateView = { currentTab: 'templates', editingTemplate: null, selectedExercises: new Set(), templates: [] };

TemplateView.render = function() {
  const page = document.getElementById('page-train');
  page.innerHTML = ''
    + '<div class="header"><div class="header-left"></div><div class="header-title">训练</div><div class="header-right">'
    + '<button class="btn-icon" onclick="TemplateView.showCreateModal()">'
    + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    + '</button></div></div>'
    + '<div class="filter-tabs" id="template-tabs">'
    + '<button class="filter-tab active" onclick="TemplateView.switchTab(\'templates\')">训练模版</button>'
    + '<button class="filter-tab" onclick="TemplateView.switchTab(\'exercises\')">动作库</button></div>'
    + '<div class="main" id="template-content"></div>';
  TemplateView.switchTab('templates');
};

TemplateView.switchTab = function(tab) {
  TemplateView.currentTab = tab;
  document.querySelectorAll('#template-tabs .filter-tab').forEach(function(t) { t.classList.toggle('active', t.textContent === (tab === 'templates' ? '训练模版' : '动作库')); });
  if (tab === 'templates') TemplateView.renderTemplates();
  else ExerciseBrowser.render();
};

TemplateView.renderTemplates = function() {
  var el = document.getElementById('template-content');
  getTemplates().then(function(tpls) {
    TemplateView.templates = tpls;
    if (tpls.length === 0) {
      el.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg><p>还没有训练模版<br>点右上角 + 创建一个</p></div>';
      return;
    }
    var html = '<div class="list">';
    for (var i = 0; i < tpls.length; i++) {
      var t = tpls[i];
      html += '<div class="list-item" onclick="TemplateView.startWorkout(\'' + t.id + '\')">'
        + '<div class="list-item-left"><div class="list-item-title">' + escHtml(t.name) + '</div><div class="list-item-sub">' + t.exercises.length + ' 个动作</div></div>'
        + '<div class="list-item-right">'
        + '<button class="btn btn-sm btn-outline" onclick="event.stopPropagation();TemplateView.editTemplate(\'' + t.id + '\')">编辑</button>'
        + '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();TemplateView.confirmDelete(\'' + t.id + '\')" style="margin-left:6px">删除</button>'
        + '</div></div>';
    }
    el.innerHTML = html + '</div>';
  });
};

TemplateView.showCreateModal = function() { TemplateView.editingTemplate = null; TemplateView.showTemplateModal('创建训练模版', ''); };

TemplateView.editTemplate = function(id) {
  getTemplate(id).then(function(tpl) { if (tpl) { TemplateView.editingTemplate = tpl; TemplateView.showTemplateModal('编辑模版', tpl.name); } });
};

TemplateView.showTemplateModal = function(title, name) {
  var overlay = document.getElementById('modal-template');
  overlay.innerHTML = ''
    + '<div class="modal"><div class="modal-title">' + escHtml(title) + '</div>'
    + '<div class="modal-body"><div class="form-group"><label class="form-label">模版名称</label>'
    + '<input class="form-input" id="tpl-name" value="' + escHtml(name) + '" placeholder="例如：推拉腿" autocomplete="off"></div>'
    + '<div class="form-group" style="margin-bottom:0"><label class="form-label">选择动作</label>'
    + '<div id="tpl-exercise-list"></div></div></div>'
    + '<div class="modal-actions"><button class="btn btn-outline" id="modal-cancel">取消</button><button class="btn btn-primary" id="modal-save">保存</button></div></div>';
  overlay.classList.add('open');
  document.getElementById('modal-cancel').onclick = function() { TemplateView.closeModal(); };
  document.getElementById('modal-save').onclick = function() { TemplateView.saveTemplate(); };
  TemplateView.renderExercisesSelector();
};

TemplateView.closeModal = function() { document.getElementById('modal-template').classList.remove('open'); };

TemplateView.renderExercisesSelector = function() {
  var el = document.getElementById('tpl-exercise-list');
  var editTpl = TemplateView.editingTemplate;
  TemplateView.selectedExercises = new Set();
  if (editTpl) { for (var j = 0; j < editTpl.exercises.length; j++) TemplateView.selectedExercises.add(editTpl.exercises[j].exerciseId); }
  getAllExercises().then(function(all) {
    if (all.length === 0) { el.innerHTML = '<p style="padding:8px;color:grey">暂无动作</p>'; return; }
    var html = '';
    for (var i = 0; i < all.length; i++) {
      var ex = all[i];
      var checked = TemplateView.selectedExercises.has(ex.id) ? 'checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);cursor:pointer">'
        + '<input type="checkbox" ' + checked + ' value="' + ex.id + '" style="width:18px;height:18px;accent-color:var(--primary)">'
        + '<span style="flex:1;font-size:14px">' + escHtml(ex.name) + '</span>'
        + '<span class="badge badge-sm">' + escHtml(ex.muscleGroup) + '</span></label>';
    }
    el.innerHTML = html;
    el.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener('change', function() { if (cb.checked) TemplateView.selectedExercises.add(cb.value); else TemplateView.selectedExercises.delete(cb.value); });
    });
  });
};

TemplateView.saveTemplate = function() {
  var name = document.getElementById('tpl-name').value.trim();
  if (!name) { alert('请输入模版名称'); return; }
  if (TemplateView.selectedExercises.size === 0) { alert('请至少选择一个动作'); return; }
  var exs = []; var idx = 0;
  TemplateView.selectedExercises.forEach(function(id) { exs.push({ exerciseId: id, sortOrder: idx++ }); });
  var tpl = TemplateView.editingTemplate || {};
  tpl.name = name; tpl.exercises = exs;
  if (!tpl.id) tpl.id = null;
  saveTemplate(tpl).then(function() { TemplateView.closeModal(); TemplateView.switchTab('templates'); });
};

TemplateView.confirmDelete = function(id) {
  if (confirm('确定删除这个模版吗？')) { deleteTemplate(id).then(function() { TemplateView.renderTemplates(); }); }
};

TemplateView.startWorkout = function(id) {
  getTemplate(id).then(function(tpl) { if (tpl) App.navigate('workout', { templateId: id }); });
};

// ===== 动作库 =====
const ExerciseBrowser = { currentGroup: '全部' };

ExerciseBrowser.render = function() {
  var el = document.getElementById('template-content');
  var groups = ['全部','胸','背','肩','腿','手臂','腹','有氧'];
  var tabs = '<div class="filter-tabs" id="ex-group-tabs" style="padding-top:0">';
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    tabs += '<button class="filter-tab' + (g === ExerciseBrowser.currentGroup ? ' active' : '') + '" onclick="ExerciseBrowser.filter(\'' + g + '\')">' + g + '</button>';
  }
  el.innerHTML = tabs + '</div><div id="ex-list" style="flex:1;overflow-y:auto"></div>';
  ExerciseBrowser.renderList();
};

ExerciseBrowser.filter = function(group) {
  ExerciseBrowser.currentGroup = group;
  document.querySelectorAll('#ex-group-tabs .filter-tab').forEach(function(t) { t.classList.toggle('active', t.textContent === group); });
  ExerciseBrowser.renderList();
};

ExerciseBrowser.renderList = function() {
  var el = document.getElementById('ex-list');
  getExercisesByGroup(ExerciseBrowser.currentGroup).then(function(exercises) {
    if (exercises.length === 0) { el.innerHTML = '<div class="empty-state"><p>没有找到动作</p></div>'; return; }
    var html = '<div class="list">';
    for (var i = 0; i < exercises.length; i++) {
      var ex = exercises[i];
      html += '<div class="list-item"><div class="list-item-left"><div class="list-item-title">' + escHtml(ex.name) + '</div><div class="list-item-sub">' + escHtml(ex.muscleGroup) + (ex.isCustom ? ' · 自定义' : '') + '</div></div>';
      if (ex.isCustom) {
        html += '<div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" onclick="ExerciseBrowser.editCustom(\'' + ex.id + '\')">编辑</button>'
          + '<button class="btn btn-sm btn-danger" onclick="ExerciseBrowser.deleteCustom(\'' + ex.id + '\')">删除</button></div>';
      }
      html += '</div>';
    }
    html += '</div><div style="padding:0 16px 16px">'
      + '<button class="btn btn-block btn-outline btn-lg" onclick="ExerciseBrowser.showAddForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加自定义动作</button></div>';
    el.innerHTML = html;
  });
};

ExerciseBrowser.showAddForm = function() { ExerciseBrowser.showExerciseModal('添加自定义动作', '', '胸'); };

ExerciseBrowser.editCustom = function(id) {
  dbGet('exercises', id).then(function(ex) { if (ex) ExerciseBrowser.showExerciseModal('编辑动作', ex.name, ex.muscleGroup, id); });
};

ExerciseBrowser.showExerciseModal = function(title, name, group, editId) {
  var overlay = document.getElementById('modal-template');
  var groups = ['胸','背','肩','腿','手臂','腹','有氧'];
  var opts = '';
  for (var i = 0; i < groups.length; i++) opts += '<option value="' + groups[i] + '"' + (groups[i] === group ? ' selected' : '') + '>' + groups[i] + '</option>';
  overlay.innerHTML = ''
    + '<div class="modal"><div class="modal-title">' + escHtml(title) + '</div>'
    + '<div class="modal-body"><div class="form-group"><label class="form-label">动作名称</label>'
    + '<input class="form-input" id="ex-name" value="' + escHtml(name) + '" placeholder="例如：深蹲" autocomplete="off"></div>'
    + '<div class="form-group"><label class="form-label">肌群</label>'
    + '<select class="form-input" id="ex-group" style="appearance:auto">' + opts + '</select></div></div>'
    + '<div class="modal-actions"><button class="btn btn-outline" id="modal-cancel">取消</button><button class="btn btn-primary" id="modal-save">保存</button></div></div>';
  overlay.classList.add('open');
  document.getElementById('modal-cancel').onclick = function() { TemplateView.closeModal(); };
  document.getElementById('modal-save').onclick = function() { ExerciseBrowser.saveExercise(editId || ''); };
};

ExerciseBrowser.saveExercise = function(editId) {
  var name = document.getElementById('ex-name').value.trim();
  var group = document.getElementById('ex-group').value;
  if (!name) { alert('请输入动作名称'); return; }
  var p = editId ? updateCustomExercise(editId, name, group) : addCustomExercise(name, group);
  p.then(function() { TemplateView.closeModal(); ExerciseBrowser.renderList(); });
};

ExerciseBrowser.deleteCustom = function(id) {
  if (confirm('确定删除这个自定义动作吗？')) { deleteCustomExercise(id).then(function() { ExerciseBrowser.renderList(); }); }
};
