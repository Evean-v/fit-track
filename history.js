// ===== 历史记录 =====
const HistoryView = {
  async render() {
    const page = document.getElementById('page-history');
    page.innerHTML = `
      <div class="header">
        <div class="header-left"></div>
        <div class="header-title">历史记录</div>
        <div class="header-right"></div>
      </div>
      <div class="main" id="history-content"></div>
    `;
    await this.renderList();
  },

  async renderList() {
    const el = document.getElementById('history-content');
    const sessions = await getSessions();
    sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

    if (sessions.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <p>还没有训练记录<br>完成一次训练后这里会显示</p>
        </div>`;
      return;
    }

    // 按日期分组
    const groups = {};
    sessions.forEach(s => {
      const d = s.date || s.startTime?.toString().slice(0, 10) || '未知日期';
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });

    el.innerHTML = Object.entries(groups).map(([date, sessList]) => `
      <div style="padding:12px 16px 4px">
        <div style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:4px">${formatDate(date)}</div>
      </div>
      <div class="list" style="padding-top:0">
        ${sessList.map(s => {
          const totalSets = s.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
          const dur = s.duration ? formatDuration(s.duration) : '';
          return `
          <div class="list-item" onclick="HistoryView.showDetail('${s.id}')">
            <div class="list-item-left">
              <div class="list-item-title">${escHtml(s.templateName || '训练')}</div>
              <div class="list-item-sub">${s.exercises.length} 个动作 · ${totalSets} 组${dur ? ' · ' + dur : ''}</div>
            </div>
            <div class="list-item-right">›</div>
          </div>`;
        }).join('')}
      </div>
    `).join('');
  },

  async showDetail(id) {
    const s = await getSession(id);
    if (!s) return;
    const page = document.getElementById('page-history');
    const totalSets = s.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
    const totalCompleted = s.exercises.reduce((sum, ex) => sum + (ex.sets?.filter(s => s.completed)?.length || 0), 0);
    page.innerHTML = `
      <div class="header">
        <div class="header-left">
          <button class="btn-icon" onclick="HistoryView.render()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
        <div class="header-title">训练详情</div>
        <div class="header-right"></div>
      </div>
      <div class="main summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span class="label">训练名称</span>
            <span class="value">${escHtml(s.templateName || '训练')}</span>
          </div>
          <div class="summary-row">
            <span class="label">日期</span>
            <span class="value">${formatDate(s.date)}</span>
          </div>
          <div class="summary-row">
            <span class="label">用时</span>
            <span class="value">${s.duration ? formatDuration(s.duration) : '-'}</span>
          </div>
          <div class="summary-row">
            <span class="label">总组数</span>
            <span class="value">${totalSets} 组</span>
          </div>
          <div class="summary-row">
            <span class="label">完成组数</span>
            <span class="value">${totalCompleted} 组</span>
          </div>
        </div>
        ${s.exercises.map(ex => `
          <div class="summary-card">
            <div style="font-weight:600;font-size:16px;margin-bottom:8px">${escHtml(ex.exerciseName)}</div>
            ${(ex.sets || []).map((set, i) => `
              <div class="summary-row" style="padding:4px 0;margin:0;border:none;font-size:14px">
                <span class="label">第 ${i+1} 组</span>
                <span class="value" style="color:${set.completed ? 'var(--success)' : 'var(--text-secondary)'}">
                  ${set.weight || 0}kg × ${set.reps || 0} 次
                  ${set.completed ? ' ✅' : ' ☐'}
                </span>
              </div>
            `).join('')}
          </div>
        `).join('')}
        <button class="btn btn-block btn-outline" onclick="if(confirm('确定删除这条记录？')){deleteSession('${s.id}').then(()=>HistoryView.render())}" style="margin-top:8px">删除记录</button>
      </div>`;
  }
};

// ===== 进度查看 =====
const ProgressView = {
  async render() {
    const page = document.getElementById('page-progress');
    page.innerHTML = `
      <div class="header">
        <div class="header-left"></div>
        <div class="header-title">进度</div>
        <div class="header-right"></div>
      </div>
      <div class="main" id="progress-content"></div>
    `;
    await this.renderList();
  },

  async renderList() {
    const el = document.getElementById('progress-content');
    const sessions = await getSessions();
    if (sessions.length === 0) {
      el.innerHTML = `<div class="empty-state"><p>还没有训练数据<br>完成几次训练后再来看进度</p></div>`;
      return;
    }

    // 收集所有动作的历史数据
    const exerciseData = {};
    sessions.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    sessions.forEach(s => {
      (s.exercises || []).forEach(ex => {
        if (!exerciseData[ex.exerciseId]) {
          exerciseData[ex.exerciseId] = { name: ex.exerciseName, data: [] };
        }
        // 取该动作本次训练最佳重量
        const bestSet = (ex.sets || []).filter(s => s.completed).reduce((best, set) => {
          return (!best || (set.weight || 0) > (best.weight || 0)) ? set : best;
        }, null);
        if (bestSet) {
          exerciseData[ex.exerciseId].data.push({
            date: s.date,
            weight: bestSet.weight || 0,
            reps: bestSet.reps || 0
          });
        }
      });
    });

    const tracked = Object.values(exerciseData).filter(d => d.data.length >= 2);
    if (tracked.length === 0) {
      el.innerHTML = `<div class="empty-state"><p>还没有足够的数据<br>同一个动作完成至少 2 次训练后显示进度</p></div>`;
      return;
    }

    el.innerHTML = '<div class="list">' + tracked.map(ex => {
      const latest = ex.data[ex.data.length - 1];
      const first = ex.data[0];
      const change = latest.weight - first.weight;
      const changeStr = change > 0 ? `+${change}` : change < 0 ? `${change}` : '不变';
      const changeColor = change > 0 ? 'var(--success)' : change < 0 ? 'var(--danger)' : 'var(--text-secondary)';
      return `
        <div class="list-item" onclick="ProgressView.showChart('${escHtml(ex.name)}', ${encodeURIComponent(JSON.stringify(ex.data))})">
          <div class="list-item-left">
            <div class="list-item-title">${escHtml(ex.name)}</div>
            <div class="list-item-sub">${ex.data.length} 次记录 · 当前 ${latest.weight}kg</div>
          </div>
          <div style="color:${changeColor};font-weight:500;font-size:15px">${changeStr}</div>
        </div>`;
    }).join('') + '</div>';
  },

  showChart(name, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    const page = document.getElementById('page-progress');
    const maxW = Math.max(...data.map(d => d.weight), 1);
    const maxShow = Math.ceil(maxW / 5) * 5 + 5;

    page.innerHTML = `
      <div class="header">
        <div class="header-left">
          <button class="btn-icon" onclick="ProgressView.render()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
        <div class="header-title">${escHtml(name)}</div>
        <div class="header-right"></div>
      </div>
      <div class="main">
        <div class="chart-container">
          <div style="font-size:14px;font-weight:500;color:var(--text-secondary);margin-bottom:8px">重量趋势 (kg)</div>
          <div class="chart-bar">
            ${data.map(d => {
              const h = (d.weight / maxShow) * 100;
              return `
                <div class="bar-item">
                  <div style="font-size:11px;font-weight:500">${d.weight}</div>
                  <div class="bar-fill" style="height:${h}%"></div>
                  <div class="bar-label">${d.date ? d.date.slice(5) : ''}</div>
                </div>`;
            }).join('')}
          </div>
        </div>
        <div class="chart-container">
          <div style="font-size:14px;font-weight:500;color:var(--text-secondary);margin-bottom:8px">历史记录</div>
          ${data.map(d => `
            <div class="summary-row" style="padding:6px 4px;margin:0;border-bottom:1px solid var(--border);font-size:14px">
              <span style="color:var(--text-secondary)">${formatDate(d.date)}</span>
              <span style="font-weight:500">${d.weight}kg × ${d.reps} 次</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
};

// ===== 工具函数 =====
function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}小时${m % 60}分`;
  }
  return `${m}分${s > 0 ? s + '秒' : ''}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  }
  return dateStr;
}
