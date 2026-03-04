/* --------配色／字級設定區（可自行調整）-------- */
/* <======== 檔案用途：遊戲核心邏輯與狀態管理 ======== > */

const GameEngine = {
    API_URL: "https://script.google.com/macros/s/AKfycbxzkANs9NKmYTA30pU5TBNK9QpPwFL41vpHS17doimdq8IMR3ZRFfOckdFWwrP6oOJPkw/exec",

    state: {
        sysId: null, userName: "勇者", companyName: "載入中...", team: "載入中...", jobType: "載入中...",
        score: 0, items: ['👕 粗製布衣'], location: '⛺ 新手村', status: '📦 檢整裝備中', achievements: [],
        currentTrial: 0, examDate: null, examDateLocked: false, resultDate: null, resultDateLocked: false,
        bankDate: null, bankDateLocked: false, bankStatus: null,
        appointmentTime: "等待公會發布...", appointmentLocation: "等待公會發布...",
        baseScore: 0 // 用於記錄 1~6 關固定分
    },

    ranks: [ { min: 101, title: "💎 SS級 神話級玩家" }, { min: 96, title: "🌟 S級 傳說級玩家" }, { min: 80, title: "🟢 A級 菁英玩家" }, { min: 60, title: "🥇 B級 穩健玩家" }, { min: 40, title: "🥈 C級 潛力玩家" }, { min: 0, title: "🌱 實習小萌新" } ],

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) this.state.sysId = urlId;

        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) Object.assign(this.state, JSON.parse(saved));
            if (urlId) this.state.sysId = urlId; 
        } catch (e) {}

        this.injectGlobalCSS();
        if (this.state.sysId) this.fetchIdentityOnly();
        else this.updateUI();

        if (this.state.currentTrial >= 6) setTimeout(() => this.showFinalAchievement(false), 800);
    },

    // 兩段式載入 - 第一階段：極速身分
    fetchIdentityOnly() {
        document.querySelectorAll('.dyn-name').forEach(el => el.innerText = "連線中...");
        fetch(`${this.API_URL}?id=${this.state.sysId}&mode=identity`)
            .then(res => res.json()).then(result => {
                if (result.success) {
                    Object.assign(this.state, result.data);
                    this.updateUI();
                    this.fetchFullData();
                }
            }).catch(() => this.fetchFullData());
    },

    // 兩段式載入 - 第二階段：全文背景同步
    fetchFullData() {
        fetch(`${this.API_URL}?id=${this.state.sysId}`)
            .then(res => res.json()).then(result => {
                if (result.success) {
                    const d = result.data;
                    this.state.score = d.totalScore || 0;
                    this.state.appointmentTime = d.appointmentTime;
                    this.state.appointmentLocation = d.appointmentLocation;
                    if (d.examDate) { this.state.examDate = d.examDate; this.state.examDateLocked = true; }
                    this.save();
                    this.updateUI();
                }
            });
    },

    // 🌟 核心：大/小摺疊加分串接 (不重複加分，但後台會記錄)
    unlock(event, id, foldType, foldLabel, score) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id);
        this.createFloatingText(event, `+${score}`);
        this.showToast(`✨ 發現${foldLabel}，積分 +${score}`);
        
        setTimeout(() => {
            this.state.score += score;
            this.save();
            this.updateUI();
            // 同步至後端：類型(big/small)、標籤名稱、分數
            this.syncToBackend({ foldType: foldType, foldLabel: foldLabel, foldScore: score });
        }, 1500);
    },

    syncToBackend(payload) {
        if (!this.state.sysId) return; 
        Object.assign(payload, { id: this.state.sysId, userName: this.state.userName, baseScore: this.state.baseScore });
        fetch(this.API_URL, { method: "POST", body: JSON.stringify(payload) })
            .then(res => res.json()).then(result => {
                if (result.success) { this.state.score = result.newScoreData.totalScore; this.updateUI(); }
            });
    },

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        const scoreGains = { 1:16, 2:16, 3:21, 4:16, 5:16, 6:0 };
        this.state.currentTrial = trialNum;
        this.state.baseScore += (scoreGains[trialNum] || 0);
        this.save();
        this.updateButtonStyles();
        
        let payload = {};
        if (trialNum === 1) payload.trial1Done = true;
        if (trialNum === 2) payload.trial2Done = true;
        if (trialNum === 3) payload.trial3Submit = true;
        
        this.syncToBackend(payload);
        this.showToast('📣 任務已完成，請繼續前進！');
        setTimeout(() => this.updateUI(), 2000);
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const s = document.createElement('style'); s.id = 'game-fx-style';
        s.innerHTML = `.game-toast { position: fixed; bottom: 20px; right: -300px; background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24; padding: 12px 20px; border-radius: 8px; z-index: 9999; transition: 0.5s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-weight: bold; }.game-toast.show { right: 20px; } @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } } .floating-text { position: fixed; color: #fbbf24; font-weight: bold; animation: floatUp 1.5s forwards; pointer-events: none; z-index: 10000; }`;
        document.head.appendChild(s);
    },
    createFloatingText(e, txt) { const x = e.clientX || (e.touches && e.touches[0].clientX); const y = e.clientY || (e.touches && e.touches[0].clientY); const el = document.createElement('div'); el.className = 'floating-text'; el.innerText = txt; el.style.left = `${x}px`; el.style.top = `${y}px`; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); },
    showToast(m) { const t = document.createElement('div'); t.className = 'game-toast'; t.innerText = m; document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 100); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000); },
    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },
    updateUI() {
        document.querySelectorAll('.dyn-company').forEach(el => el.innerText = this.state.companyName);
        document.querySelectorAll('.dyn-team').forEach(el => el.innerText = this.state.team);
        document.querySelectorAll('.dyn-type').forEach(el => el.innerText = this.state.jobType);
        document.querySelectorAll('.dyn-name').forEach(el => el.innerText = this.state.userName);
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        if (document.getElementById('rank-text')) document.getElementById('rank-text').innerHTML = `<span style="color:#fbbf24;">戰力：</span>${rank.title}`;
        if (document.getElementById('score-text')) document.getElementById('score-text').innerText = this.state.score + "分";
        if (document.getElementById('score-fill')) document.getElementById('score-fill').style.width = Math.min(this.state.score, 100) + "%";
        this.updateDateControls();
        this.updateButtonStyles();
    },
    updateDateControls() {
        const fields = [ { id: 'input-exam-date', btn: 'btn-lock-exam', val: this.state.examDate, locked: this.state.examDateLocked }, { id: 'input-result-date', btn: 'btn-lock-result', val: this.state.resultDate, locked: this.state.resultDateLocked } ];
        fields.forEach(f => {
            const input = document.getElementById(f.id); const btn = document.getElementById(f.btn);
            if (input && btn) { input.value = f.val || ""; if (f.locked) { input.type = 'text'; input.disabled = true; btn.innerText = "已鎖定"; btn.disabled = true; btn.style.opacity = "0.5"; } }
        });
    },
    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : 'input-result-date';
        const val = document.getElementById(id).value; if (!val) { alert("請選擇日期！"); return; }
        if (!confirm("鎖定後不可修改，確定嗎？")) return;
        const parts = val.split('-'); const fVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        let payload = {};
        if (type === 'exam') { this.state.examDate = fVal; this.state.examDateLocked = true; payload.examDate = fVal; }
        else { this.state.resultDate = fVal; this.state.resultDateLocked = true; payload.resultDate = fVal; }
        this.syncToBackend(payload); this.save(); this.updateUI();
    },
    requestChange() {
        const val = document.getElementById('input-change-date').value; if (!val) return;
        alert("🚨 申請已送出，核准後將為您解鎖，將扣分喔！");
        this.syncToBackend({ changeDate: val });
    },
    updateButtonStyles() {
        [1, 2, 3, 4, 5, 6].forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`); const det = document.getElementById(`detail-trial-${n}`);
            if (btn && this.state.currentTrial >= n) { btn.disabled = true; btn.innerText = "🔒 已完成"; if (det) det.querySelectorAll('input').forEach(i => i.disabled = true); }
        });
    }
};
window.addEventListener('load', () => GameEngine.init());
