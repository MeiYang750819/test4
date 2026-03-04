/* --------配色／字級設定區（可自行調整）-------- */
/* <======== 檔案用途：遊戲核心邏輯與狀態管理 ======== > */

const GameEngine = {
    API_URL: "https://script.google.com/macros/s/AKfycbyzi8oHumX5UFx3jTu78zA2n_IBrIEWpGKAiTX7cMkARSj5ZCW1xN06Ie7KB0J5exKuSA/exec",

    state: {
        sysId: null,
        userName: "勇者",
        companyName: "載入中...",
        team: "載入中...",
        jobType: "載入中...",
        score: 0,
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        currentTrial: 0,
        examDate: null,      
        examDateLocked: false,
        resultDate: null,    
        resultDateLocked: false,
        bankDate: null,
        bankDateLocked: false,
        bankStatus: null,
        appointmentTime: "等待公會發布...", 
        appointmentLocation: "等待公會發布...", 
        scoreDetails: { baseScore: 0, exploreScore: 0, bonusScore: 0, trapScore: 0 },
        hasSeenAlert: false,
        hasSeenApprovedAlert: false 
    },

    ranks: [
        { min: 101, title: "💎 SS級 神話級玩家" },
        { min: 96,  title: "🌟 S級 傳說級玩家" },
        { min: 80,  title: "🟢 A級 菁英玩家" },
        { min: 60,  title: "🥇 B級 穩健玩家" },
        { min: 40,  title: "🥈 C級 潛力玩家" },
        { min: 20,  title: "🥉 D級 基礎學徒" },
        { min: 10,  title: "🌱 實習小萌新" },
        { min: 0,   title: "🥚 報到新手村" }
    ],

    armorPath: ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'],
    
    weaponPaths: {
        '🗡️ 精鋼短劍': '⚔️ 騎士長劍', '⚔️ 騎士長劍': '⚔️ 破甲重劍', '⚔️ 破甲重劍': '🗡️ 聖光戰劍', '🗡️ 聖光戰劍': '👑 王者之聖劍',
        '🏹 獵人短弓': '🏹 精靈長弓', '🏹 精靈長弓': '🏹 迅雷連弓', '🏹 迅雷連弓': '🏹 追風神弓', '🏹 追風神弓': '☄️ 破曉流星弓',
        '🔱 鐵尖長槍': '🔱 鋼鐵戰矛', '🔱 鋼鐵戰矛': '🔱 破陣重矛', '🔱 破陣重矛': '🔱 龍膽銀槍', '🔱 龍膽銀槍': '🐉 滅世龍吟槍'
    },

    trialsData: {
        1: { progGain: 14, loc: '🏰 登錄公會', scoreGain: 16 },
        2: { progGain: 14, loc: '📁 裝備盤點', scoreGain: 16 },
        3: { progGain: 17, loc: '🛡️ 裝備鑑定所', scoreGain: 21 },
        4: { progGain: 13, loc: '🎒 出征準備營', scoreGain: 16 },
        5: { progGain: 13, loc: '💼 契約祭壇', scoreGain: 16 }, 
        6: { progGain: 12, loc: '👑 榮耀殿堂', scoreGain: 0 }
    },

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) { this.state.sysId = urlId; }

        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
            if (urlId) this.state.sysId = urlId; 
        } catch (e) { localStorage.removeItem('hero_progress'); }
        
        this.injectGlobalCSS();
        
        if (this.state.sysId) {
            this.fetchBackendData();
        } else {
            this.updateUI();
            this.checkSystemAlerts();
        }

        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        if (this.state.currentTrial >= 6) {
            setTimeout(() => { this.showFinalAchievement(false); }, 800);
        }
    },

    fetchBackendData() {
        document.querySelectorAll('.dyn-name').forEach(el => el.innerText = "讀取中...");

        fetch(this.API_URL + "?id=" + this.state.sysId)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const data = result.data;
                    this.state.userName = data.userName;
                    this.state.companyName = data.companyName;
                    this.state.team = data.team;
                    this.state.jobType = data.type;
                    this.state.appointmentTime = data.appointmentTime;
                    this.state.appointmentLocation = data.appointmentLocation;
                    this.state.score = data.totalScore || 0;

                    if (data.scoreDetails) {
                        this.state.scoreDetails.baseScore = data.scoreDetails.baseScore || 0;
                        this.state.scoreDetails.exploreScore = data.scoreDetails.exploreScore || 0;
                        this.state.scoreDetails.bonusScore = data.scoreDetails.bonusScore || 0;
                        this.state.scoreDetails.trapScore = data.scoreDetails.trapScore || 0;
                    }

                    if (data.examDate) { this.state.examDate = data.examDate; this.state.examDateLocked = true; }
                    if (data.resultDate) { this.state.resultDate = data.resultDate; this.state.resultDateLocked = true; }
                    if (data.bankDate) { this.state.bankDate = data.bankDate; this.state.bankDateLocked = true; }

                    if (data.trial3Status === '退件' && this.state.currentTrial >= 3 && this.state.currentTrial < 6) {
                        this.state.currentTrial = 2;
                        this.state.location = '📁 裝備盤點';
                        this.state.examDateLocked = false;
                        this.state.resultDateLocked = false;
                    }
                    
                    this.save();
                    this.updateUI();
                    
                    let alertTriggered = false;
                    if (data.isApproved && !this.state.hasSeenApprovedAlert) {
                        alertTriggered = true; this.state.hasSeenApprovedAlert = true; this.save();
                        this.showSysAlert('reward', '✨ 任務進度更新', '恭喜！您的申請或鑑定文件已審核通過！', () => { if (data.isDelayed) this.showDelayWarning(); });
                    } else if (data.systemAlert && !this.state.hasSeenAlert) {
                        alertTriggered = true; this.state.hasSeenAlert = true; this.save();
                        this.showSysAlert(data.systemAlert === 'penalty' ? 'danger' : 'reward', data.systemAlert === 'penalty' ? '⚠️ 系統通知' : '✨ 系統通知', data.systemAlert === 'penalty' ? '任務遭遇挫折，積分有所減損！' : '表現優異！系統已發放效率獎勵積分！', () => { if (data.isDelayed) this.showDelayWarning(); });
                    } else if (data.isDelayed) {
                        this.showDelayWarning();
                    }
                }
            })
            .catch(err => {
                console.error("載入失敗", err);
                document.querySelectorAll('.dyn-name').forEach(el => el.innerText = "連線失敗");
            });
    },

    syncToBackend(payload) {
        if (!this.state.sysId) return; 
        payload.id = this.state.sysId;
        payload.userName = this.state.userName;
        payload.baseScore = this.state.scoreDetails.baseScore;
        payload.exploreScore = this.state.scoreDetails.exploreScore;

        fetch(this.API_URL, { method: "POST", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.success && result.newScoreData) {
                this.state.score = result.newScoreData.totalScore || 0;
                this.state.scoreDetails.bonusScore = result.newScoreData.newBonus || 0;
                this.state.scoreDetails.trapScore = result.newScoreData.newTrap || 0;
                this.save(); this.updateUI();
            }
        });
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const style = document.createElement('style');
        style.id = 'game-fx-style';
        style.innerHTML = `
            @keyframes shinyUpdate { 0% { filter: brightness(1); transform: scale(1); } 40% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 8px #fbbf24; } 100% { filter: brightness(1); transform: scale(1); } }
            .shiny-effect { animation: shinyUpdate 1s ease-in-out; display: inline-block; }
            .game-toast { position: fixed; bottom: 20px; right: -300px; background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24; padding: 12px 20px; border-radius: 8px; z-index: 9999; transition: 0.5s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-weight: bold; }
            .game-toast.show { right: 20px; }
            #delay-warning-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10005; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.3s; }
            #delay-warning-overlay.active { opacity: 1; pointer-events: all; }
            .warning-text { color: #ef4444; font-size: 20px; font-weight: bold; margin-top: 20px; opacity: 0; transition: 1s; }
            .warning-text.show { opacity: 1; }
            @keyframes heavyFlash { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        `;
        document.head.appendChild(style);
    },

    flashElement(id) { const el = document.getElementById(id); if (el) { el.classList.remove('shiny-effect'); void el.offsetWidth; el.classList.add('shiny-effect'); } },

    upgradeArmor() {
        let currentArmor = this.state.items.find(item => this.armorPath.includes(item));
        if (currentArmor) {
            let idx = this.armorPath.indexOf(currentArmor);
            if (idx < this.armorPath.length - 1) {
                let nextArmor = this.armorPath[idx + 1];
                this.state.items = this.state.items.map(item => item === currentArmor ? nextArmor : item);
                return true;
            }
        }
        return false;
    },

    upgradeWeapon() {
        let currentWeapon = this.state.items.find(item => Object.keys(this.weaponPaths).includes(item) || Object.values(this.weaponPaths).includes(item));
        if (currentWeapon && this.weaponPaths[currentWeapon]) {
            let nextWeapon = this.weaponPaths[currentWeapon];
            this.state.items = this.state.items.map(item => item === currentWeapon ? nextWeapon : item);
            return true;
        }
        return false;
    },

    showDelayWarning() {
        if(document.getElementById('delay-warning-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'delay-warning-overlay';
        overlay.innerHTML = `<div class="warning-icon" style="font-size: 80px; animation: heavyFlash 0.5s 3;">⚠️ 警告</div><div class="warning-text">進度延宕，冒險積分持續流失中..</div>`;
        document.body.appendChild(overlay);
        void overlay.offsetWidth; overlay.classList.add('active');
        setTimeout(() => { overlay.querySelector('.warning-text').classList.add('show'); }, 1500); 
        overlay.onclick = () => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); };
    },

    showSysAlert(type, titleText, msgText, onCloseCallback) {
        const modalId = 'sys-alert-' + Date.now();
        const html = `<div class="sys-alert-modal active" id="${modalId}"><div class="sys-alert-box ${type}"><div class="sys-alert-title ${type}">${titleText}</div><div class="sys-alert-text">${msgText}</div><button class="sys-alert-btn" id="btn-${modalId}">我知道了</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById(`btn-${modalId}`).onclick = () => { document.getElementById(modalId).remove(); if (typeof onCloseCallback === 'function') onCloseCallback(); };
    },

    unlock(event, id, action) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id); this.save();
        let scoreGain = 0; let toastMsg = ""; let alertMsg = ""; let doFlashItem = false; 
        if (action === 'large_fold') { scoreGain = 2; alertMsg = `🔔 發現隱藏關卡，冒險積分 +${scoreGain}`; } 
        else if (action === 'explore1') { scoreGain = 1; toastMsg = `✨ 深入探索，冒險積分+${scoreGain}`; } 
        else if (action === 'explore2') { scoreGain = 1; toastMsg = `🧩 獲得情報，冒險積分 +${scoreGain}`; } 
        else if (action === 'explore_armor') { scoreGain = 1; toastMsg = `✨ 防具升級，冒險積分+${scoreGain}`; } 
        else if (action === 'random_weapon') { scoreGain = 1; toastMsg = `⚔️ 獲得基礎武器，戰力大幅提升！`; }
        if (alertMsg) alert(alertMsg);
        this.createFloatingText(event, `+${scoreGain}`);
        if (toastMsg) this.showToast(toastMsg);
        setTimeout(() => {
            this.state.scoreDetails.exploreScore += scoreGain; 
            if (action === 'explore_armor') { if (this.upgradeArmor()) doFlashItem = true; } 
            else if (action === 'random_weapon') {
                const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
                const w = weapons[Math.floor(Math.random() * weapons.length)];
                this.state.weaponType = w; this.state.items.push(w); doFlashItem = true;
            }
            this.save(); this.updateUI(); this.syncToBackend({}); 
            if (scoreGain > 0 && action !== 'random_weapon') this.flashElement('score-text');
            if (doFlashItem) { this.flashElement('item-text'); this.flashElement('rank-name'); }
        }, 1500);
    },

    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8;
        let payload = {};
        if (id === 't5_score_1' && isChecked) payload.nameCardDone = true;
        if (id === 't5_score_2' && isChecked) payload.contractDone = true;
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id); this.state.scoreDetails.baseScore += scoreGain;
            this.save(); if(Object.keys(payload).length > 0) this.syncToBackend(payload);
            setTimeout(() => { this.updateUI(); this.flashElement('score-text'); }, 1000); 
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.scoreDetails.baseScore -= scoreGain; this.save(); this.updateUI();
        }
    },

    createFloatingText(e, text) {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        const el = document.createElement('div'); el.className = 'floating-text'; el.innerText = text;
        el.style.left = `${x}px`; el.style.top = `${y}px`;
        document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
    },

    showToast(msg) {
        const toast = document.createElement('div'); toast.className = 'game-toast'; toast.innerText = msg;
        document.body.appendChild(toast); setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000); 
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    updateUI() {
        document.querySelectorAll('.dyn-company').forEach(el => el.innerText = this.state.companyName);
        document.querySelectorAll('.dyn-team').forEach(el => el.innerText = this.state.team);
        document.querySelectorAll('.dyn-type').forEach(el => el.innerText = this.state.jobType);
        document.querySelectorAll('.dyn-name').forEach(el => el.innerText = this.state.userName);
        
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        if (document.getElementById('rank-text')) document.getElementById('rank-text').innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="rank-name">${rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="loc-text">${this.state.location}</span>`;
        if (document.getElementById('status-tag')) document.getElementById('status-tag').innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="item-text">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status">${this.state.status}</span>`;
        
        const scoreEl = document.getElementById('score-text'); if (scoreEl) scoreEl.innerText = this.state.score + "分";
        const scoreFill = document.getElementById('score-fill'); if (scoreFill) scoreFill.style.width = Math.min(this.state.score, 100) + "%";
        
        let currentProg = 0;
        for(let i=1; i<=this.state.currentTrial; i++) { if(i <= 6) currentProg += this.trialsData[i].progGain; }
        if(this.state.achievements.includes('faq_main')) currentProg += 6;
        if(this.state.achievements.includes('onboard_main')) currentProg += 6;
        if(this.state.achievements.includes('pg2-m-1')) currentProg += 5;
        currentProg = Math.min(100, currentProg);
        if (document.getElementById('prog-val')) document.getElementById('prog-val').innerText = currentProg + "%";
        if (document.getElementById('prog-fill')) document.getElementById('prog-fill').style.width = currentProg + "%";
        
        this.updateDateControls();
        if (document.getElementById('dyn-apt-time')) document.getElementById('dyn-apt-time').innerText = this.state.appointmentTime;
        if (document.getElementById('dyn-apt-loc')) document.getElementById('dyn-apt-loc').innerText = this.state.appointmentLocation;
        this.updateButtonStyles();
    },

    updateDateControls() {
        const dateFields = [{ id: 'input-exam-date', btn: 'btn-lock-exam', val: this.state.examDate, locked: this.state.examDateLocked }, { id: 'input-result-date', btn: 'btn-lock-result', val: this.state.resultDate, locked: this.state.resultDateLocked }, { id: 'input-bank-date', btn: 'btn-lock-bank', val: this.state.bankDate, locked: this.state.bankDateLocked }];
        dateFields.forEach(field => {
            const input = document.getElementById(field.id); const btn = document.getElementById(field.btn);
            if (input && btn) { input.value = field.val || ""; if (field.locked) { input.type = 'text'; input.disabled = true; btn.innerText = "已鎖定"; btn.disabled = true; btn.style.opacity = "0.5"; } else { input.type = 'date'; } }
        });
    },

    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : type === 'result' ? 'input-result-date' : 'input-bank-date';
        const val = document.getElementById(id).value; if (!val) { alert("請先選擇日期！"); return; }
        if (!confirm("鎖定就不能更改了喔，確定要鎖定嗎？")) return;
        const parts = val.split('-'); let formattedVal = val; if(parts.length === 3) formattedVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        let payload = {};
        if (type === 'exam') { this.state.examDate = formattedVal; this.state.examDateLocked = true; payload.examDate = formattedVal; }
        else if (type === 'result') { this.state.resultDate = formattedVal; this.state.resultDateLocked = true; payload.resultDate = formattedVal; }
        else if (type === 'bank') { this.state.bankDate = formattedVal; this.state.bankDateLocked = true; payload.bankDate = formattedVal; }
        this.syncToBackend(payload); this.save(); this.updateUI();
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value; if (!val) return;
        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖，會因此扣分喔！");
        this.syncToBackend({ changeDate: val });
    },

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        const tData = this.trialsData[trialNum];
        this.state.currentTrial = trialNum; this.state.location = tData.loc;
        let payload = {};
        if (trialNum === 1) payload.trial1Done = true; if (trialNum === 2) payload.trial2Done = true; if (trialNum === 3) payload.trial3Submit = true;
        if (trialNum === 4) payload.trial4Done = true; if (trialNum === 5) payload.trial5Done = true;
        if (trialNum === 6) payload.bankStatus = this.state.bankStatus;
        this.syncToBackend(payload);
        if (document.getElementById(`detail-trial-${trialNum}`)) document.getElementById(`detail-trial-${trialNum}`).removeAttribute('open');
        if (trialNum === 6) { setTimeout(() => { this.showFinalAchievement(true); this.save(); this.updateUI(); }, 1500); } 
        else {
            this.showToast('📣 此階段任務已完成，請繼續前進！');
            setTimeout(() => { if (trialNum !== 5) this.state.scoreDetails.baseScore += tData.scoreGain; this.upgradeArmor(); this.upgradeWeapon(); this.save(); this.updateUI(); this.syncToBackend({}); }, 3000);
        }
    },

    handleFileUpload(inputElement, chkId) {
        const file = inputElement.files[0]; if (!file) return;
        let typeLabel = "其他證明";
        if(chkId === 'chk-t3-1') typeLabel = "勞工體檢"; else if(chkId === 'chk-t3-2') typeLabel = "從業體檢"; else if(chkId === 'chk-t3-3') typeLabel = "存摺";
        const statusSpan = inputElement.closest('.upload-btn-group').querySelector('.upload-status');
        if(statusSpan) { statusSpan.innerText = "⏳ 上傳中..."; statusSpan.classList.remove('success'); }
        const reader = new FileReader();
        reader.onload = (e) => {
            const payload = { fileUploads: [{ base64: e.target.result, mimeType: file.type, fileName: file.name, typeLabel: typeLabel }] };
            fetch(this.API_URL, { method: "POST", body: JSON.stringify(Object.assign(payload, {id: this.state.sysId, userName: this.state.userName})) })
            .then(res => res.json()).then(result => { if (result.success) { if(statusSpan) { statusSpan.innerText = "✅ 已上傳"; statusSpan.classList.add('success'); } document.getElementById(chkId).checked = true; } });
        };
        reader.readAsDataURL(file);
    },

    showFinalAchievement(withFirework = true) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const detailHtml = `<div style="font-size: 13px; color: #888; margin-top: 5px;">└ 基礎分：${this.state.scoreDetails.baseScore} 分<br>└ 探索分：${this.state.scoreDetails.exploreScore} 分<br>└ 獎勵分：<span style="color:#4ade80;">${this.state.scoreDetails.bonusScore} 分</span><br>└ 陷阱分：<span style="color:#ff8a8a;">${this.state.scoreDetails.trapScore} 分</span></div>`;
        const modal = document.createElement('div'); modal.id = 'final-achievement-modal'; modal.className = 'sys-alert-modal active';
        modal.innerHTML = `<div class="achievement-box"><div class="close-modal-btn" onclick="this.closest('.sys-alert-modal').remove()">✕</div><div style="text-align:center; font-size:24px; font-weight:bold; color:#fbbf24; margin-bottom:20px;">評定級別：${rank.title.split(' ')[1]}</div><div style="color:#efefef;">🏆 最終戰力：${rank.title}</div><div style="color:#efefef;">💯 冒險總積分：${this.state.score} 分</div>${detailHtml}<div style="margin-top:20px; color:#aaa; font-size:14px;">📜 系統總評：試煉圓滿完成，歡迎入職！</div></div>`;
        document.body.appendChild(modal);
    },

    updateButtonStyles() {
        const lockedTexts = { 1: "🔒 啟程點・已封印", 2: "🔒 行囊區・已封印", 3: "⏳ 鑑定所・審核中", 4: "🔒 前線營・已就緒", 5: "📜 誓約日・已締約", 6: "👑 聖殿區・已加冕" };
        [1, 2, 3, 4, 5, 6].forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`); const detailsBlock = document.getElementById(`detail-trial-${n}`);
            if (btn && this.state.currentTrial >= n) { btn.disabled = true; btn.innerText = lockedTexts[n]; if (detailsBlock) { detailsBlock.querySelectorAll('input').forEach(i => i.disabled = true); detailsBlock.querySelectorAll('.file-upload-btn').forEach(b => b.style.pointerEvents = 'none'); } if(n===6){btn.disabled=false; btn.onclick=()=>this.showFinalAchievement(false);}}
            if (detailsBlock) { if (n === 1 || this.state.currentTrial >= n - 1) detailsBlock.classList.remove('locked-details'); else { detailsBlock.classList.add('locked-details'); detailsBlock.removeAttribute('open'); } }
        });
        const bankMap = { have: 'chk-bank-have', process: 'chk-bank-process', done: 'chk-bank-done' }; if(this.state.bankStatus && bankMap[this.state.bankStatus]) document.getElementById(bankMap[this.state.bankStatus]).checked = true;
    }
};
window.addEventListener('load', () => GameEngine.init());
