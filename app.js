// ===== 主应用 =====
const App = {
  currentTab: 'train',

  async init() {
    await initDB();
    this.setupUI();
    this.bindTabEvents();
    this.navigate('train');
  },

  setupUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Pages -->
      <div class="page active" id="page-train"></div>
      <div class="page" id="page-exercises">
        <div class="header">
          <div class="header-left"></div>
          <div class="header-title">动作库</div>
          <div class="header-right"></div>
        </div>
        <div class="main"><div class="empty-state"><p>请在训练页面查看动作库</p></div></div>
      </div>
      <div class="page" id="page-history"></div>
      <div class="page" id="page-progress"></div>
      <div class="page" id="page-workout" style="z-index:50"></div>

      <!-- Tab Bar -->
      <div class="tab-bar" id="tab-bar">
        <button class="tab-item active" data-tab="train">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 17.5 17.5M6.5 17.5 17.5 6.5"/><circle cx="12" cy="12" r="10"/><path d="m12 2 0 20M2 12l20 0"/></svg>
          <span>训练</span>
        </button>
        <button class="tab-item" data-tab="exercises">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
          <span>动作库</span>
        </button>
        <button class="tab-item" data-tab="history">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>历史</span>
        </button>
        <button class="tab-item" data-tab="progress">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>进度</span>
        </button>
      </div>

      <!-- Modals -->
      <div class="modal-overlay" id="modal-template"></div>
    `;
  },

  bindTabEvents() {
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.navigate(tab);
      });
    });
  },

  navigate(tab, params) {
    // Hide workout page if navigating away
    const woPage = document.getElementById('page-workout');
    if (tab !== 'workout') {
      WorkoutView.stopTimer();
      woPage.style.display = 'none';
    }

    // Show/hide tab bar
    const tabBar = document.getElementById('tab-bar');
    tabBar.style.display = tab === 'workout' ? 'none' : 'flex';

    // Update tabs
    document.querySelectorAll('.tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Switch
    this.currentTab = tab;
    switch (tab) {
      case 'train':
        document.getElementById('page-train').classList.add('active');
        TemplateView.render();
        break;
      case 'exercises':
        document.getElementById('page-exercises').classList.add('active');
        ExerciseBrowser.currentGroup = '全部';
        ExerciseBrowser.render();
        break;
      case 'history':
        document.getElementById('page-history').classList.add('active');
        HistoryView.render();
        break;
      case 'progress':
        document.getElementById('page-progress').classList.add('active');
        ProgressView.render();
        break;
      case 'workout':
        WorkoutView.start(params.templateId);
        break;
    }
  },

  showPage(pageId) {
    // Only used for workout page which has its own lifecycle
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
  }
};

// Launch
document.addEventListener('DOMContentLoaded', () => App.init());
