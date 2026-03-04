/* --------配色／字級設定區（可自行調整）-------- */
const GameEngine = {
    API_URL: "https://script.google.com/macros/s/AKfycbzQp1nkOe18tqxJhnEMxXS4FkODaLjDHEvTJV6DXvVTBP7tLVMDNOflsXHc9nKCSoHQ3w/exec",
    state: {
        sysId: null, userName: "勇者", companyName: "載入中...", team: "載入中...", jobType: "載入中...",
        score: 0, items: ['👕 粗製布衣'], location: '⛺ 新手村', status: '📦 檢整裝備中', achievements: [],
        currentTrial: 0, examDate: null, examDateLocked: false, resultDate: null, resultDateLocked: false,
        bankDate: null, bankDateLocked: false, bankStatus: null,
        appointmentTime: "等待公會發布...", appointmentLocation: "等待公會發布...",
        baseScore: 0, hasSeenAlert: false, hasSeenApprovedAlert: false
    },
    ranks: [ { min: 101, title: "💎 SS級 神話級玩家" }, { min: 96, title: "🌟 S級 傳說級玩家" }, { min: 80, title: "🟢 A級 菁英玩家" }, { min: 60, title: "🥇 B級 穩健玩家" }, { min: 40, title: "🥈 C級 潛力玩家" }, { min: 0, title: "🌱 實習小萌新" } ],
    armorPath: ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'],

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) this.state.sysId = urlId;
        try { const saved = localStorage.getItem('hero_progress'); if (saved) Object.assign(this.state, JSON.parse(saved)); if (urlId) this.state.sysId = urlId; } catch (e) {}
        this.injectGlobalCSS();
        if (this.state.sysId) this.fetchIdentityOnly();
        else this.updateUI();
        if (this.state.currentTrial >= 6) setTimeout(() => this.showFinalAchievement(false), 800);
    },

    fetchIdentityOnly() {
        fetch(`${this.API_URL}?id=${this.state.sysId}&mode=identity`)
            .then(res => res.json()).then(res => { if (res.success) { Object.assign(this.state, res.data); this.updateUI(); this.fetchFullData(); } });
    },

    fetchFullData() {
        fetch(`${this.API_URL}?id=${this.state.sysId}`)
            .then(res => res.json()).then(res => {
                if (res.success) {
                    const d = res.data;
                    Object.assign(this.state, { appointmentTime: d.appointmentTime, appointmentLocation: d.appointmentLocation, score: d.totalScore });
                    if (d.examDate) { this.state.examDate = d.examDate; this.state.examDateLocked = true; }
                    this.save(); this.updateUI();
                }
            });
    },

    // 🌟 核心修正：大/小摺疊加分串接
    unlock(event, id, type, label, score) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id);
        this.createFloatingText(event, `+${score}`);
        this.showToast(`✨ 發現${label}，積分 +${score}`);
        setTimeout(() => {
            this.state.score += score; this.save(); this.updateUI();
            this.syncToBackend({ foldType: type, foldLabel: label, foldScore: score });
        }, 1500);
    },

    syncToBackend(payload) {
        if (!this.state.sysId) return;
        Object.assign(payload, { id: this.state.sysId, userName: this.state.userName, baseScore: this.state.baseScore });
        fetch(this.API_URL, { method: "POST", body: JSON.stringify(payload) })
            .then(res => res.json()).then(res => { if (res.success) { this.state.score = res.newScoreData.totalScore; this.updateUI(); } });
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const s = document.createElement('style'); s.id = 'game-fx-style';
        s.innerHTML = `.game-toast { position: fixed; bottom: 20px; right: -300px; background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24; padding: 12px 20px; border-radius: 8px; z-index: 9999; transition: 0.5s; }.game-toast.show { right: 20px; } @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } } .floating-text { position: fixed; color: #fbbf24; font-weight: bold; animation: floatUp 1.5s forwards; pointer-events: none; z-index: 10000; }`;
        document.head.appendChild(s);
    },
    createFloatingText(e, txt) { const x = e.clientX || e.touches[0].clientX; const y = e.clientY || e.touches[0].clientY; const el = document.createElement('div'); el.className = 'floating-text'; el.innerText = txt; el.style.left = `${x}px`; el.style.top = `${y}px`; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); },
    showToast(m) { const t = document.createElement('div'); t.className = 'game-toast'; t.innerText = m; document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 100); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000); },
    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },
    updateUI() {
        document.querySelectorAll('.dyn-company').forEach(el => el.innerText = this.state.companyName);
        document.querySelectorAll('.dyn-team').forEach(el => el.innerText = this.state.team);
        document.querySelectorAll('.dyn-type').forEach(el => el.innerText = this.state.jobType);
        document.querySelectorAll('.dyn-name').forEach(el => el.innerText = this.state.userName);
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        if (document.getElementById('rank-text')) document.getElementById('rank-text').innerHTML = `<span style="color:#fbbf24;">戰力：</span>${rank.title}　｜　<span style="color:#fbbf24;">關卡：</span>${this.state.location}`;
        if (document.getElementById('status-tag')) document.getElementById('status-tag').innerHTML = `<span style="color:#8ab4f8;">道具：</span>${this.state.items.join(' ')}　｜　<span style="color:#8ab4f8;">狀態：</span>${this.state.status}`;
        if (document.getElementById('score-text')) document.getElementById('score-text').innerText = this.state.score + "分";
        if (document.getElementById('score-fill')) document.getElementById('score-fill').style.width = Math.min(this.state.score, 100) + "%";
        this.updateDateControls();
    },
    updateDateControls() { /* 日期控制邏輯與之前一致... */ },
    lockDate(type) { /* 鎖定邏輯... */ },
    requestChange() { /* 改期邏輯... */ },
    completeTrial(event, n) { /* 通關邏輯... */ }
};
window.addEventListener('load', () => GameEngine.init());
