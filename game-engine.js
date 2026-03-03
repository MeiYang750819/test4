/* --------配色／字級設定區（可自行調整）-------- */
/* <======== 檔案用途：遊戲核心邏輯與狀態管理 ======== > */

/* ================================================================
   【 ⚙️ GAME ENGINE - 最終完美連線版 】
   ================================================================ */
const GameEngine = {
    // 🌟 您專屬的 API 連線網址
    API_URL: "https://script.google.com/macros/s/AKfycbwQp1nj6f1UieZliPx7GeCEgyJN8IAmcsp02xpsxGOUki5W8aE4RtUlOvfgfRY8YIOsAw/exec",

    state: {
        sysId: null, // 系統編號 (由 URL 取得)
        score: 0,
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        weaponType: null,
        currentTrial: 0,
        examDate: null,      
        examDateLocked: false,
        resultDate: null,    
        resultDateLocked: false,
        bankDate: null,
        bankDateLocked: false,
        bankStatus: null, /* 🌟 記錄銀行狀態 */
        
        // 🌟 預設等待字樣，將由後台資料覆蓋
        appointmentTime: "等待公會發布...", 
        appointmentLocation: "等待公會發布...", 
        
        // 🌟 分數細項記錄
        scoreDetails: {
            baseAndExplore: 0,
            penalty: 0,
            bonus: 0,
            hrEval: 0
        },
        hasSeenAlert: false 
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
        // 🌟 1. 從網址列抓取 ?id=EMP-001
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) { this.state.sysId = urlId; }

        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
            // 確保以網址的 ID 為主
            if (urlId) this.state.sysId = urlId; 
        } catch (e) { localStorage.removeItem('hero_progress'); }
        
        this.injectGlobalCSS();
        
        // 🌟 2. 啟動時先從後台拉取最新資料 (GET)
        if (this.state.sysId) {
            this.fetchBackendData();
        } else {
            setTimeout(() => { this.updateUI(); }, 50);
            this.checkSystemAlerts();
        }

        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        if (this.state.currentTrial >= 6) {
            setTimeout(() => {
                this.showFinalAchievement(false);
            }, 800);
        }
    },

    // 🌟 從後台抓取資料並同步介面
    fetchBackendData() {
        fetch(this.API_URL + "?id=" + this.state.sysId)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const data = result.data;
                    
                    document.querySelectorAll('.dyn-company').forEach(el => el.innerText = data.companyName);
                    document.querySelectorAll('.dyn-team').forEach(el => el.innerText = data.team);
                    document.querySelectorAll('.dyn-type').forEach(el => el.innerText = data.type);
                    document.querySelectorAll('.dyn-name').forEach(el => el.innerText = data.userName);
                    
                    this.state.appointmentTime = data.appointmentTime;
                    this.state.appointmentLocation = data.appointmentLocation;
                    this.state.score = data.totalScore || 0; // 防呆處理
                    this.state.scoreDetails = data.scoreDetails || { baseAndExplore: 0, penalty: 0, bonus: 0, hrEval: 0 };
                    
                    if (data.trial3Status === '退件' && this.state.currentTrial >= 3 && this.state.currentTrial < 6) {
                        this.state.currentTrial = 2;
                        this.state.location = '📁 裝備盤點';
                        this.state.examDateLocked = false;
                        this.state.resultDateLocked = false;
                    }
                    
                    this.save();
                    this.updateUI();
                    
                    let alertTriggered = false;

                    // 🌟 觸發系統彈窗 (並綁定關閉後的回呼函數)
                    if (data.systemAlert) {
                        if (data.systemAlert === 'penalty' && !this.state.hasSeenAlert) {
                            alertTriggered = true;
                            this.state.hasSeenAlert = true;
                            this.save();
                            // 等彈窗關閉後，再判斷是否要呼叫奪命連環閃
                            this.showSysAlert('danger', '⚠️ 系統通知', '任務遭遇挫折，積分有所減損！', () => {
                                if (data.isDelayed) this.showDelayWarning();
                            });
                        } else if (data.systemAlert === 'bonus' && !this.state.hasSeenAlert) {
                            alertTriggered = true;
                            this.state.hasSeenAlert = true;
                            this.save();
                            this.showSysAlert('reward', '✨ 系統通知', '表現優異！系統已發放效率獎勵積分！', () => {
                                if (data.isDelayed) this.showDelayWarning();
                            });
                        }
                    }
                    
                    // 🌟 若沒有觸發彈窗，但有逾期，則直接呼叫奪命連環閃
                    if (!alertTriggered && data.isDelayed) {
                        this.showDelayWarning();
                    }

                } else {
                     console.error("API 讀取失敗，後端回傳：", result.error);
                     // 即使後端報錯，仍強制渲染預設 UI，避免卡死在載入中
                     this.updateUI();
                }
            })
            .catch(error => {
                console.error("API 網路請求失敗:", error);
                this.updateUI();
            });
    },

    // 🌟 向後台發送更新資料
    syncToBackend(payload) {
        if (!this.state.sysId) return; 
        
        payload.id = this.state.sysId;
        payload.currentScore = this.state.scoreDetails.baseAndExplore; 
        
        fetch(this.API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success && result.newScoreData) {
                this.state.score = result.newScoreData.totalScore || 0;
                this.state.scoreDetails = result.newScoreData.scoreDetails || { baseAndExplore: 0, penalty: 0, bonus: 0, hrEval: 0 };
                this.save();
                this.updateUI();
            }
        })
        .catch(error => console.error("API 寫入失敗:", error));
    },

    injectGlobalCSS() {
        if (document.getElementById('game-fx-style')) return;
        const style = document.createElement('style');
        style.id = 'game-fx-style';
        style.innerHTML = `
            @keyframes shinyUpdate {
                0% { filter: brightness(1); transform: scale(1); color: inherit; }
                40% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 8px #fbbf24, 0 0 16px #fbbf24; }
                60% { filter: brightness(1.5); transform: scale(1.2); color: #ffffff; text-shadow: 0 0 8px #fbbf24, 0 0 16px #fbbf24; }
                100% { filter: brightness(1); transform: scale(1); color: inherit; }
            }
            .shiny-effect { animation: shinyUpdate 1s ease-in-out; display: inline-block; }
            .game-toast {
                position: fixed; bottom: 20px; right: -300px;
                background: #1a1a1a; color: #efefef; border: 1px solid #fbbf24;
                padding: 12px 20px; border-radius: 8px; z-index: 9999;
                transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-weight: bold;
            }
            .game-toast.show { right: 20px; }
            
            /* 🌟 恢復原始奪命連環閃的 CSS 設定 (閃三次後靜止) */
            #delay-warning-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 10005; display: flex;
                flex-direction: column; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity 0.3s;
            }
            #delay-warning-overlay.active { opacity: 1; pointer-events: all; }
            .warning-text { color: #ef4444; font-size: 20px; font-weight: bold; margin-top: 20px; opacity: 0; transition: opacity 1s; }
            .warning-text.show { opacity: 1; }
            @keyframes heavyFlash { 
                0% { opacity: 1; transform: scale(1); filter: brightness(1); } 
                50% { opacity: 0; transform: scale(1.5); filter: brightness(2); } 
                100% { opacity: 1; transform: scale(1); filter: brightness(1); } 
            }
        `;
        document.head.appendChild(style);
    },

    flashElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('shiny-effect');
            void el.offsetWidth;
            el.classList.add('shiny-effect');
        }
    },

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

    // 🌟 延宕奪命連環閃警告動畫 (結合 CSS 閃三次後變靜態)
    showDelayWarning() {
        if(document.getElementById('delay-warning-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'delay-warning-overlay';
        // 直接在 icon 上綁定 heavyFlash 動畫 (0.5秒閃1次，共3次)
        overlay.innerHTML = `<div class="warning-icon" style="font-size: 80px; animation: heavyFlash 0.5s 3;">⚠️ 警告</div><div class="warning-text">進度延宕，冒險積分持續流失中..</div>`;
        document.body.appendChild(overlay);
        
        void overlay.offsetWidth;
        overlay.classList.add('active');
        
        setTimeout(() => { overlay.querySelector('.warning-text').classList.add('show'); }, 1500); 
        
        overlay.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };
    },

    checkSystemAlerts() {
        if (this.state.hasSeenAlert) return;
        const urlParams = new URLSearchParams(window.location.search);
        const alertType = urlParams.get('alert');

        if (alertType === 'penalty') {
            this.showSysAlert('danger', '⚠️ 系統通知', '任務遭遇挫折，積分有所減損！');
            this.state.hasSeenAlert = true;
            this.save();
        } else if (alertType === 'bonus') {
            this.showSysAlert('reward', '✨ 系統通知', '表現優異！系統已發放效率獎勵積分！');
            this.state.hasSeenAlert = true;
            this.save();
        }
    },

    // 🌟 修改彈窗函數，支援傳入關閉後的回呼函數 (Callback)
    showSysAlert(type, titleText, msgText, onCloseCallback) {
        const modalId = 'sys-alert-' + Date.now();
        const html = `
            <div class="sys-alert-modal active" id="${modalId}">
                <div class="sys-alert-box ${type}">
                    <div class="sys-alert-title ${type}">${titleText}</div>
                    <div class="sys-alert-text">${msgText}</div>
                    <button class="sys-alert-btn" id="btn-${modalId}">我知道了</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        // 綁定點擊事件，關閉後執行 callback
        document.getElementById(`btn-${modalId}`).onclick = () => {
            document.getElementById(modalId).remove();
            if (typeof onCloseCallback === 'function') {
                onCloseCallback();
            }
        };
    },

    unlock(event, id, action) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id); 
        this.save();

        let scoreGain = 0;
        let toastMsg = "";
        let alertMsg = "";
        let doFlashItem = false; 
        
        if (action === 'large_fold') {
            scoreGain = 2;
            alertMsg = `🔔 發現隱藏關卡，冒險積分 +${scoreGain}`;
        } else if (action === 'explore1') {
            scoreGain = 1;
            toastMsg = `✨ 深入探索，冒險積分+${scoreGain}`;
        } else if (action === 'explore2') {
            scoreGain = 1;
            toastMsg = `🧩 獲得情報，冒險積分 +${scoreGain}`;
        } else if (action === 'explore_armor') {
            scoreGain = 1;
            toastMsg = `✨ 防具升級，冒險積分+${scoreGain}`;
        } else if (action === 'random_weapon') {
            scoreGain = 1; 
            toastMsg = `⚔️ 獲得基礎武器，戰力大幅提升！`;
        }

        if (alertMsg) { alert(alertMsg); }

        this.createFloatingText(event, `+${scoreGain}`);
        if (toastMsg) this.showToast(toastMsg);
        
        let delayTime = toastMsg ? 3000 : 1000;

        setTimeout(() => {
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain; 
            
            if (action === 'explore_armor') {
                if (this.upgradeArmor()) doFlashItem = true;
            } else if (action === 'random_weapon') {
                const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
                const w = weapons[Math.floor(Math.random() * weapons.length)];
                this.state.weaponType = w;
                this.state.items.push(w);
                doFlashItem = true;
            }
            this.save();
            this.updateUI();
            this.syncToBackend({}); 
            
            if (scoreGain > 0 && action !== 'random_weapon') { this.flashElement('score-text'); }
            if (doFlashItem) { this.flashElement('item-text'); this.flashElement('rank-name'); }
        }, delayTime);
    },

    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8;
        
        let payload = {};
        if (id === 't5_score_1' && isChecked) payload.nameCardDone = true;
        if (id === 't5_score_2' && isChecked) payload.contractDone = true;
        
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id);
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain;
            this.save();
            if(Object.keys(payload).length > 0) this.syncToBackend(payload);
            setTimeout(() => { this.updateUI(); this.flashElement('score-text'); }, 1000); 
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.score -= scoreGain;
            this.state.scoreDetails.baseAndExplore -= scoreGain;
            this.save();
            this.updateUI();
            this.flashElement('score-text');
        }
    },

    createFloatingText(e, text) {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000); 
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    updateUI() {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rEl = document.getElementById('rank-text');
        const sEl = document.getElementById('status-tag');
        
        if (rEl) rEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="rank-name">${rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="loc-text">${this.state.location}</span>`;
        if (sEl) sEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="item-text">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status">${this.state.status}</span>`;
        
        const scoreEl = document.getElementById('score-text');
        if (scoreEl) scoreEl.innerText = this.state.score + "分";
        const scoreFill = document.getElementById('score-fill');
        if (scoreFill) scoreFill.style.width = Math.min(this.state.score, 100) + "%";

        let currentProg = 0;
        for(let i=1; i<=this.state.currentTrial; i++) {
            if(i <= 6) currentProg += this.trialsData[i].progGain;
        }
        if(this.state.achievements.includes('faq_main')) currentProg += 6;
        if(this.state.achievements.includes('onboard_main')) currentProg += 6;
        if(this.state.achievements.includes('pg2-m-1')) currentProg += 5;
        currentProg = Math.min(100, currentProg);

        const progVal = document.getElementById('prog-val');
        if (progVal) progVal.innerText = currentProg + "%";
        const progFill = document.getElementById('prog-fill');
        if (progFill) progFill.style.width = currentProg + "%";

        this.updateDateControls();
        const timeEl = document.getElementById('dyn-apt-time');
        if (timeEl) timeEl.innerText = this.state.appointmentTime;
        const locEl = document.getElementById('dyn-apt-loc');
        if (locEl) locEl.innerText = this.state.appointmentLocation;
        
        this.updateButtonStyles();
    },

    updateDateControls() {
        const dateFields = [
            { id: 'input-exam-date', btn: 'btn-lock-exam', val: this.state.examDate, locked: this.state.examDateLocked },
            { id: 'input-result-date', btn: 'btn-lock-result', val: this.state.resultDate, locked: this.state.resultDateLocked },
            { id: 'input-bank-date', btn: 'btn-lock-bank', val: this.state.bankDate, locked: this.state.bankDateLocked }
        ];

        dateFields.forEach(field => {
            const input = document.getElementById(field.id);
            const btn = document.getElementById(field.btn);
            if (input && btn) {
                input.value = field.val || "";
                if (field.locked) {
                    input.type = 'text'; 
                    input.disabled = true;
                    btn.innerText = "已鎖定";
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                } else {
                    input.type = 'date';
                }
            }
        });
    },

    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : type === 'result' ? 'input-result-date' : 'input-bank-date';
        const val = document.getElementById(id).value;
        if (!val) { alert("請先選擇日期！"); return; }
        
        const confirmLock = confirm("鎖定就不能更改了喔，確定要鎖定嗎？");
        if (!confirmLock) return;

        const parts = val.split('-');
        let formattedVal = val;
        if(parts.length === 3) {
            formattedVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        }

        let payload = {};
        if (type === 'exam') { this.state.examDate = formattedVal; this.state.examDateLocked = true; payload.examDate = formattedVal; }
        else if (type === 'result') { this.state.resultDate = formattedVal; this.state.resultDateLocked = true; payload.resultDate = formattedVal; }
        else if (type === 'bank') { this.state.bankDate = formattedVal; this.state.bankDateLocked = true; payload.bankDate = formattedVal; }
        
        this.syncToBackend(payload);
        this.save(); 
        this.updateUI();
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value;
        if (!val) return;
        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖，會因此扣分喔！");
        const btn = document.getElementById('btn-lock-change');
        if (btn) { btn.disabled = true; btn.innerText = "申請"; btn.style.opacity = "0.5"; }
        this.syncToBackend({ changeDate: val });
    },

    canUnlockTrial5() {
        if (!this.state.appointmentTime || this.state.appointmentTime.includes("等待")) return { can: false, reason: "⚠️ 尚未發布報到時間。" };
        const now = new Date();
        const aptDateStr = this.state.appointmentTime.replace(/\//g, '-'); 
        const aptTimeParts = aptDateStr.split(' ');
        const dateStr = aptTimeParts[0];
        
        const openTime = new Date(`${dateStr}T08:00:00`);
        
        if (now < openTime) return { can: false, reason: `⚠️ 營地大門深鎖\n請於 ${dateStr} 08:00 後再來！` };
        return { can: true };
    },

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        if (trialNum === 5 && !this.canUnlockTrial5().can) { alert(this.canUnlockTrial5().reason); return; }
        
        const tData = this.trialsData[trialNum];
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save(); 
        this.updateButtonStyles(); 

        let payload = {};
        if (trialNum === 1) payload.trial1Done = true;
        if (trialNum === 2) payload.trial2Done = true;
        if (trialNum === 3) payload.trial3Submit = true;
        if (trialNum === 4) payload.trial4Done = true;
        if (trialNum === 5) payload.trial5Done = true;
        if (trialNum === 6) payload.bankStatus = (this.state.bankStatus === 'have' ? '已有帳戶' : (this.state.bankStatus === 'process' ? '申辦中' : '辦理完成'));

        this.syncToBackend(payload);

        // 🌟 自動收合當前過關的詳細選單
        const currentDetails = document.getElementById(`detail-trial-${trialNum}`);
        if (currentDetails) {
            currentDetails.removeAttribute('open');
        }

        if (trialNum === 6) {
            setTimeout(() => {
                this.showFinalAchievement(true); 
                if (this.upgradeArmor()) {}
                if (this.upgradeWeapon()) {}
                this.save(); 
                this.updateUI();
            }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);

            setTimeout(() => {
                if (trialNum !== 5) {
                    this.state.score += tData.scoreGain;
                    this.state.scoreDetails.baseAndExplore += tData.scoreGain;
                }
                
                let doFlashItem = false;
                if (this.upgradeArmor()) doFlashItem = true;
                if (this.upgradeWeapon()) doFlashItem = true;

                this.save(); 
                this.updateUI();
                this.syncToBackend({});

                if (doFlashItem) this.flashElement('item-text');
                this.flashElement('loc-text');
                this.flashElement('prog-val');
                if (trialNum !== 5) this.flashElement('score-text');
                
            }, 3000);
        }
    },

    handleFileUpload(inputElement, chkId) {
        const file = inputElement.files[0];
        if (!file) return;

        let typeLabel = "其他證明";
        if(chkId === 'chk-t3-1') typeLabel = "勞工體檢";
        else if(chkId === 'chk-t3-2') typeLabel = "從業體檢";
        else if(chkId === 'chk-t3-3') typeLabel = "存摺";
        else if(chkId === 'chk-t3-opt1') typeLabel = "健保轉出";
        else if(chkId === 'chk-t3-opt2') typeLabel = "離職證明";

        const statusSpan = inputElement.closest('.upload-btn-group').querySelector('.upload-status');
        if(statusSpan) {
            statusSpan.innerText = "⏳ 上傳中...";
            statusSpan.classList.remove('success');
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            const payload = {
                fileUploads: [{
                    base64: base64Data,
                    mimeType: file.type,
                    fileName: file.name,
                    typeLabel: typeLabel
                }]
            };
            
            if (this.state.sysId) {
                payload.id = this.state.sysId;
                fetch(this.API_URL, {
                    method: "POST",
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        if(statusSpan) {
                            statusSpan.innerText = "✅ 已上傳";
                            statusSpan.classList.add('success');
                        }
                        const chkBox = document.getElementById(chkId);
                        if (chkBox) chkBox.checked = true;
                    } else {
                        if(statusSpan) statusSpan.innerText = "❌ 失敗";
                    }
                })
                .catch(err => {
                    if(statusSpan) statusSpan.innerText = "❌ 網路錯誤";
                });
            } else {
                setTimeout(() => {
                    if(statusSpan) {
                        statusSpan.innerText = "✅ 已上傳 (單機測試)";
                        statusSpan.classList.add('success');
                    }
                    const chkBox = document.getElementById(chkId);
                    if (chkBox) chkBox.checked = true;
                }, 1500);
            }
        };
        reader.readAsDataURL(file);
    },

    showFinalAchievement(withFirework = true) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rankLetter = rank.title.match(/[A-ZS]+/)?.[0] || 'D';
        const fullRankTitle = rank.title.replace(/.*?([A-ZSS]+級.*)/, '$1');
        const currentProg = document.getElementById('prog-val').innerText;

        let evalStr = "";
        if(this.state.score >= 96) evalStr = "無懈可擊的執行力！<br>積極度與效率令人驚豔，未來的表現值得期待！";
        else if(this.state.score >= 80) evalStr = "穩健可靠地完成了所有準備，<br>這是一個好的開始，繼續保持這份用心！";
        else if(this.state.score >= 41) evalStr = "雖然過程有些波折，但總算完成試煉，<br>未來的任務請務必更加留意細節與時效喔！";
        else evalStr = "試煉過程充滿驚險，職場如同戰場，<br>請重新調整狀態，拿出更好的表現！";

        const weaponItem = this.state.items.find(i => Object.keys(this.weaponPaths).includes(i) || Object.values(this.weaponPaths).includes(i) || ['👑 王者之聖劍', '☄️ 破曉流星弓', '🐉 滅世龍吟槍'].includes(i)) || "";
        const armorItem = this.state.items.find(i => this.armorPath.includes(i)) || "";
        const finalEquip = [armorItem, weaponItem].filter(Boolean).join(' 、 '); 

        const hasWeapon = !!weaponItem;
        let mockeryHTML = !hasWeapon ? `<div class="fade-in-row mockery-text" style="animation: fadeUpIn 0.8s forwards 3.3s;">📝 系統額外判定：<br>勇者雖已通關，但未詳閱《鍛造秘笈》，<br>仍全程赤手空拳完成試煉...敬佩！敬佩！</div>` : "";

        const renderModal = () => {
            if(document.getElementById('final-achievement-modal')) document.getElementById('final-achievement-modal').remove();
            
            const baseScore = this.state.scoreDetails.baseAndExplore;
            const penalty = this.state.scoreDetails.penalty;
            const hrEval = this.state.scoreDetails.hrEval;
            
            let detailHtml = `
                <div style="font-size: 13px; color: #888; margin-left: 10px; margin-top: 5px; line-height: 1.4;">
                    └ 基礎與探索得分：${baseScore} 分<br>
            `;
            if (penalty < 0) detailHtml += `└ 鑑定所或逾期扣分：<span style="color:#ff8a8a;">${penalty} 分</span><br>`;
            if (hrEval !== 0) detailHtml += `└ 人資綜合評估：<span style="${hrEval > 0 ? 'color:#4ade80;' : 'color:#ff8a8a;'}">${hrEval > 0 ? '+'+hrEval : hrEval} 分</span><br>`;
            detailHtml += `</div>`;

            const modal = document.createElement('div');
            modal.id = 'final-achievement-modal';
            modal.innerHTML = `
                <div class="achievement-box" onclick="event.stopPropagation()">
                    <div class="close-modal-btn" onclick="document.getElementById('final-achievement-modal').classList.remove('active'); setTimeout(()=>document.getElementById('final-achievement-modal').remove(),300)">✕</div>
                    <div class="typing-container">
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0s;">評</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.4s;">定</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.8s;">${rankLetter}</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 1.2s;">級</span>
                    </div>
                    <div style="margin-top: 30px;">
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 1.8s;"><strong>🏆 最終戰力評級：</strong>${fullRankTitle}</div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.1s;">
                            <strong>💯 冒險總積分：</strong>${this.state.score} 分
                            ${detailHtml}
                        </div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.4s;"><strong>✅ 試煉完成度：</strong>${currentProg}</div>
                        <div class="fade-in-row" style="animation: fadeUpIn 0.8s forwards 2.7s;"><strong>🛡️ 最終裝備：</strong>${finalEquip}</div>
                        
                        <div class="fade-in-row eval-text" style="animation: fadeUpIn 0.8s forwards 3.0s;">
                            <strong>📜 系統總評：</strong><br>${evalStr}
                        </div>
                        ${mockeryHTML}
                    </div>
                </div>
            `;
            modal.onclick = () => { modal.classList.remove('active'); setTimeout(()=>modal.remove(),300); };
            document.body.appendChild(modal);
            void modal.offsetWidth;
            modal.classList.add('active');
        };

        if (withFirework) {
            const fw = document.createElement('div');
            fw.id = 'firework-overlay';
            fw.innerHTML = `
                <div class="css-firework fw-1"></div>
                <div class="css-firework fw-2"></div>
                <div class="css-firework fw-3"></div>
                <div class="firework-text">入職試煉圓滿達成<br>歡迎正式踏入我們的行列</div>
            `;
            document.body.appendChild(fw);
            void fw.offsetWidth;
            fw.classList.add('active');

            setTimeout(() => {
                fw.classList.remove('active');
                setTimeout(() => { fw.remove(); renderModal(); }, 500);
            }, 3000); 
        } else {
            renderModal();
        }
    },

    updateButtonStyles() {
        const lockedTexts = {
            1: "🔒 啟程點・已封印",
            2: "🔒 行囊區・已封印",
            3: "⏳ 鑑定所・審核中",
            4: "🔒 前線營・已就緒",
            5: "📜 誓約日・已締約",
            6: "👑 聖殿區・已加冕"
        };
        
        const trials = [1, 2, 3, 4, 5, 6];
        trials.forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`);
            const detailsBlock = document.getElementById(`detail-trial-${n}`);
            
            if (btn) {
                if (this.state.currentTrial >= n) {
                    btn.disabled = true;
                    btn.innerText = lockedTexts[n];
                    
                    if (detailsBlock) {
                        const inputs = detailsBlock.querySelectorAll('input');
                        inputs.forEach(input => {
                            input.disabled = true;
                            if(input.type === 'checkbox' || input.type === 'radio' || input.type === 'file' || input.type === 'text') {
                                input.style.opacity = "0.5";
                                input.style.cursor = "not-allowed";
                            }
                        });
                        const uploadBtns = detailsBlock.querySelectorAll('.file-upload-btn');
                        uploadBtns.forEach(uBtn => {
                            uBtn.style.opacity = "0.5";
                            uBtn.style.cursor = "not-allowed";
                            uBtn.style.pointerEvents = "none";
                        });
                    }

                    if (n === 6) {
                        btn.disabled = false; 
                        btn.style.cursor = "pointer";
                        btn.onclick = () => { this.showFinalAchievement(false); };
                    }
                }
            }
            
            if (detailsBlock) {
                if (n === 1) {
                    detailsBlock.classList.remove('locked-details');
                } else {
                    if (this.state.currentTrial >= n - 1) {
                        detailsBlock.classList.remove('locked-details');
                    } else {
                        detailsBlock.classList.add('locked-details');
                        detailsBlock.removeAttribute('open'); 
                    }
                }
            }
        });

        if(this.state.achievements.includes('t5_score_1')) {
            const chk = document.getElementById('chk-t5-1');
            if (chk && this.state.currentTrial < 5) chk.checked = true; 
        }
        if(this.state.achievements.includes('t5_score_2')) {
            const chk = document.getElementById('chk-t5-2');
            if (chk && this.state.currentTrial < 5) chk.checked = true;
        }

        const have = document.getElementById('chk-bank-have');
        const process = document.getElementById('chk-bank-process');
        const done = document.getElementById('chk-bank-done');
        const bDate = document.getElementById('input-bank-date');
        const bBtn = document.getElementById('btn-lock-bank');

        if (have && process && done && this.state.currentTrial < 6) {
            have.disabled = false; process.disabled = false; done.disabled = false;
            if(!this.state.bankDateLocked) { bDate.disabled = false; bBtn.disabled = false; }
            
            if (this.state.bankStatus === 'have') {
                have.checked = true;
                process.disabled = true; done.disabled = true;
                bDate.disabled = true; bBtn.disabled = true;
            } else if (this.state.bankStatus === 'process') {
                process.checked = true;
                have.disabled = true; done.disabled = true;
            } else if (this.state.bankStatus === 'done') {
                done.checked = true;
                have.disabled = true; process.disabled = true;
                bDate.disabled = true; bBtn.disabled = true;
            }
        }
    }
};
window.addEventListener('load', () => GameEngine.init());
