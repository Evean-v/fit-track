// ===== 训练模式 =====
const WorkoutView = {
  template: null,
  exercises: [],
  session: null,
  currentExIdx: 0,
  timerInterval: null,
  timerSeconds: 90,
  timerRemaining: 90,

  async start(templateId) {
    this.template = await getTemplate(templateId);
    if (!this.template) { App.navigate('train'); return; }
    // 获取所有动作数据
    const allEx = await getAllExercises();
    const exMap = {};
    allEx.forEach(e => exMap[e.id] = e);
    this.exercises = this.template.exercises.sort((a, b) => a.sortOrder - b.sortOrder).map(e => ({
      ...e,
      exercise: exMap[e.exerciseId] || { name: '未知动作', muscleGroup: '' },
      sets: [{ weight: 0, reps: 0, completed: false, sortOrder: 0 }]
    }));
    this.currentExIdx = 0;
    this.session = {
      id: 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      templateId: this.template.id,
      templateName: this.template.name,
      date: new Date().toISOString().slice(0, 10),
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      exercises: this.exercises.map(e => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exercise ? e.exercise.name : '未知',
        sets: e.sets.map(s => ({ ...s }))
      }))
    };
    this.render();
  },

  render() {
    const page = document.getElementById('page-workout');
    page.style.display = 'flex';
    page.innerHTML = this._buildUI();
    this.renderCurrentExercise();
    App.showPage('workout');
  },

  _buildUI() {
    return `
      <div class="header">
        <div class="header-left">
          <button class="btn-icon" onclick="WorkoutView.endWorkout()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
        <div class="header-title">${escHtml(this.template.name)}</div>
        <div class="header-right"></div>
      </div>
      <div style="padding:8px 16px 0;display:flex;gap:6px;overflow-x:auto;flex-shrink:0;scrollbar-width:none" id="wo-progress">
        ${this.exercises.map((ex, i) => `
          <div class="badge ${i === this.currentExIdx ? '' : ''}" style="${i === this.currentExIdx ? 'background:var(--primary);color:#fff' : 'opacity:0.5'};flex-shrink:0;cursor:pointer" onclick="WorkoutView.goToExercise(${i})">${escHtml(ex.exercise ? ex.exercise.name : '?')}</div>
        `).join('')}
      </div>
      <div class="main" id="wo-main"></div>
      <div style="flex-shrink:0;padding:8px 16px calc(8px + var(--safe-bottom));border-top:1px solid var(--border);background:var(--card)">
        <button class="btn btn-block btn-primary btn-lg" onclick="WorkoutView.completeWorkout()">完成训练</button>
      </div>
      <div class="timer-overlay" id="timer-overlay">
        <div class="timer-circle">
          <div class="timer-display" id="timer-display">1:30</div>
          <div class="timer-label">休息计时</div>
        </div>
        <div class="timer-controls">
          <button class="btn btn-outline btn-lg" onclick="WorkoutView.addTimer30()">+30s</button>
          <button class="btn btn-primary btn-lg" onclick="WorkoutView.skipTimer()">跳过</button>
        </div>
        <div style="display:flex;gap:12px;margin-top:12px">
          <button class="btn btn-sm btn-outline" onclick="WorkoutView.setTimer(60)">60s</button>
          <button class="btn btn-sm btn-outline" onclick="WorkoutView.setTimer(90)">90s</button>
          <button class="btn btn-sm btn-outline" onclick="WorkoutView.setTimer(120)">120s</button>
          <button class="btn btn-sm btn-outline" onclick="WorkoutView.setTimer(180)">180s</button>
        </div>
      </div>`;
  },

  renderCurrentExercise() {
    const el = document.getElementById('wo-main');
    const ex = this.exercises[this.currentExIdx];
    if (!ex) { el.innerHTML = ''; return; }

    // Update progress badges
    const badges = document.querySelectorAll('#wo-progress .badge');
    badges.forEach((b, i) => {
      b.style.opacity = i === this.currentExIdx ? '1' : '0.5';
      b.style.background = i === this.currentExIdx ? 'var(--primary)' : '';
      b.style.color = i === this.currentExIdx ? '#fff' : '';
    });

    const sessionEx = this.session.exercises[this.currentExIdx];

    el.innerHTML = `
      <div class="workout-exercise">
        <div class="workout-exercise-header">
          <span>${escHtml(ex.exercise ? ex.exercise.name : '?')}</span>
          <span class="badge badge-sm">${escHtml(ex.exercise ? ex.exercise.muscleGroup : '')}</span>
        </div>
        <div id="wo-sets">
          ${sessionEx.sets.map((s, i) => `
            <div class="workout-set-row">
              <div class="set-number ${s.completed ? 'done' : ''}">${i + 1}</div>
              <input class="set-input" type="number" min="0" step="0.5" value="${s.weight || ''}" placeholder="重量" onchange="WorkoutView.updateSet(${i}, 'weight', this.value)" onfocus="this.select()">
              <span style="color:var(--text-secondary);font-size:13px">kg</span>
              <input class="set-input" type="number" min="0" step="1" value="${s.reps || ''}" placeholder="次数" onchange="WorkoutView.updateSet(${i}, 'reps', this.value)" onfocus="this.select()">
              <span style="color:var(--text-secondary);font-size:13px">次</span>
              <button class="set-check ${s.completed ? 'done' : ''}" onclick="WorkoutView.toggleSet(${i})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
        <div style="padding:10px 16px;display:flex;gap:10px">
          <button class="btn btn-sm btn-outline" onclick="WorkoutView.addSet()">+ 加组</button>
          ${sessionEx.sets.length > 1 ? `<button class="btn btn-sm btn-danger" onclick="WorkoutView.removeSet()">- 删组</button>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:10px;padding:0 16px;margin-top:8px">
        ${this.currentExIdx > 0 ? `<button class="btn btn-outline" style="flex:1" onclick="WorkoutView.goToExercise(${this.currentExIdx - 1})">上一动作</button>` : ''}
        ${this.currentExIdx < this.exercises.length - 1 ? `<button class="btn btn-primary" style="flex:1" onclick="WorkoutView.goToExercise(${this.currentExIdx + 1})">下一动作</button>` : ''}
      </div>`;
  },

  goToExercise(idx) {
    this.currentExIdx = idx;
    this.renderCurrentExercise();
  },

  updateSet(setIdx, field, value) {
    const sessionEx = this.session.exercises[this.currentExIdx];
    sessionEx.sets[setIdx][field] = parseFloat(value) || 0;
  },

  toggleSet(setIdx) {
    const sessionEx = this.session.exercises[this.currentExIdx];
    sessionEx.sets[setIdx].completed = !sessionEx.sets[setIdx].completed;
    if (sessionEx.sets[setIdx].completed) {
      this.startTimer();
    }
    this.renderCurrentExercise();
  },

  addSet() {
    const sessionEx = this.session.exercises[this.currentExIdx];
    sessionEx.sets.push({ weight: 0, reps: 0, completed: false, sortOrder: sessionEx.sets.length });
    this.renderCurrentExercise();
  },

  removeSet() {
    const sessionEx = this.session.exercises[this.currentExIdx];
    if (sessionEx.sets.length > 1) {
      sessionEx.sets.pop();
      this.renderCurrentExercise();
    }
  },

  startTimer() {
    this.stopTimer();
    this.timerRemaining = this.timerSeconds;
    const overlay = document.getElementById('timer-overlay');
    overlay.classList.add('open');
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timerRemaining--;
      this.updateTimerDisplay();
      if (this.timerRemaining <= 0) {
        this.stopTimer();
        this.timerEnded();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateTimerDisplay() {
    const el = document.getElementById('timer-display');
    if (!el) return;
    const m = Math.floor(this.timerRemaining / 60);
    const s = this.timerRemaining % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  },

  timerEnded() {
    document.getElementById('timer-overlay').classList.remove('open');
    // 震动反馈
    if (navigator.vibrate) navigator.vibrate(200);
  },

  skipTimer() {
    this.stopTimer();
    document.getElementById('timer-overlay').classList.remove('open');
  },

  addTimer30() {
    this.timerRemaining += 30;
    this.updateTimerDisplay();
  },

  setTimer(secs) {
    this.timerSeconds = secs;
    this.timerRemaining = secs;
    this.updateTimerDisplay();
  },

  async completeWorkout() {
    this.stopTimer();
    this.session.endTime = Date.now();
    this.session.duration = Math.round((this.session.endTime - this.session.startTime) / 1000);
    await saveSession(this.session);
    App.navigate('history');
  },

  async endWorkout() {
    this.stopTimer();
    const sure = confirm('确定要结束训练吗？未保存的数据将丢失。');
    if (!sure) {
      this.render();
      return;
    }
    // 检查是否有任何完成的组
    const hasCompleted = this.session.exercises.some(ex => ex.sets.some(s => s.completed));
    if (hasCompleted) {
      const saveIt = confirm('部分组已完成，是否保存训练记录？');
      if (saveIt) {
        await this.completeWorkout();
        return;
      }
    }
    App.navigate('train');
  }
};
