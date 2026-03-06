/* ================================================================
   【 ⚙️ GAME ENGINE - 最終完美版 (全自動網址抓取版) 】
   ================================================================ */
const GameEngine = {
    // 🌟 [新增] 後台 API 設定區
    config: {
        apiUrl: "https://script.google.com/macros/s/AKfycbyFXNtA8VE5VGA7oGNOX1HIJP-cxVww8R386VanaffFBnv4csTHqpaYpeGbSWn9h8oh0A/exec", // ← 第一步拿到的網址貼這！
        // 🌟 自動抓取網址後方的 uid 參數 (例如 ?uid=EMP_001)，如果沒抓到，就預設拿 TEST_001 來墊檔測試
        uid: new URLSearchParams(window.location.search).get('uid') || "TEST_001" 
    },

    state: {
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
        
        // 🌟 已將寫死的測試時間與地點拉掉，改為預設等待字樣，等待後台資料覆蓋
        appointmentTime: "等待公會發布...", 
        appointmentLocation: "等待公會發布...", 
        
        // 🌟 新增：分數細項記錄 (供大結局結算與彈窗判定用)
        scoreDetails: {
            baseAndExplore: 0,
            penalty: 0,
            bonus: 0,
            hrEval: 0
        },
        hasSeenAlert: false // 防止重新整理無限跳警告
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

    // 🌟 重新分配進度條：前五關共 71%，第六關 12%，總合 83%
    trialsData: {
        1: { progGain: 14, loc: '🏰 登錄公會', scoreGain: 16 },
        2: { progGain: 14, loc: '📁 裝備盤點', scoreGain: 16 },
        3: { progGain: 17, loc: '🛡️ 裝備鑑定所', scoreGain: 21 },
        4: { progGain: 13, loc: '🎒 出征準備營', scoreGain: 16 },
        5: { progGain: 13, loc: '💼 契約祭壇', scoreGain: 16 }, /* 第五關分數已拆至 checkbox */
        6: { progGain: 12, loc: '👑 榮耀殿堂', scoreGain: 0 }
    },

    init() {
        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
        } catch (e) { localStorage.removeItem('hero_progress'); }
        this.injectGlobalCSS();
        
        // 🌟 [新增] 啟動時向後台同步最新資料
        this.syncWithBackend();

        setTimeout(() => { this.updateUI(); }, 50);

        // 🌟 隱藏彩蛋：加上 ?delay=1 網址參數，直接觸發奪命連環閃警告！
        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        // 🌟 檢查是否需要跳出強提醒彈窗 (模擬從後台取得資料後的判定)
        this.checkSystemAlerts();

        // 🌟 成就回顧機制：若已破關，重整網頁時直接顯示結算面板 (不放煙火)
        if (this.state.currentTrial >= 6) {
            setTimeout(() => {
                this.showFinalAchievement(false); // 傳入 false 代表略過煙火
            }, 800);
        }
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
        `;
        document.head.appendChild(style);
    },

    // 🌟 [新增] 與 GAS 後台通訊的非同步引擎 (含強大偵錯)
    async syncWithBackend() {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;
        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'loadData', uid: this.config.uid })
            });
            const res = await response.json();
            
            console.log("後台回應狀態:", res); // F12 可查看詳細報錯

            if (res.status === 'success' && res.data) {
                // 覆蓋前台的動態報到時地
                if (res.data.appointmentTime) this.state.appointmentTime = res.data.appointmentTime;
                if (res.data.appointmentLocation) this.state.appointmentLocation = res.data.appointmentLocation;
                
                // 替換畫面上的基本資料
                document.querySelectorAll('.dyn-company').forEach(el => el.innerText = res.data.companyName || "MYs studio");
                document.querySelectorAll('.dyn-team').forEach(el => el.innerText = res.data.team || "外場團隊");
                document.querySelectorAll('.dyn-type').forEach(el => el.innerText = res.data.type || "兼職");
                document.querySelectorAll('.dyn-name').forEach(el => el.innerText = res.data.userName || "測試員");
                
                this.updateUI();
                
                // 🚨 奪命連環閃判定
                if (res.data.isOverdue) {
                    this.triggerDoomFlash();
                }
            } else if (res.status === 'error') {
                console.error("⛔ 後台發生致命錯誤:", res.message, res.stack);
                this.showToast("連線後台發生異常，請按 F12 檢視錯誤訊息！");
            }
        } catch (err) {
            console.error("Fetch 連線失敗:", err);
        }
    },
    
    // 🌟 [新增] 奪命連環閃 (Doom Flash) 特效
    triggerDoomFlash() {
        // 避免重複觸發
        if (document.getElementById('doom-flash-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'doom-flash-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,0,0,0.4); z-index:99999; pointer-events:none; display:none;';
        document.body.appendChild(overlay);
        
        // 黑屏紅閃 3 次
        let count = 0;
        const flashInterval = setInterval(() => {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
            count++;
            if (count >= 6) { // 閃3次 (開關共6次)
                clearInterval(flashInterval);
                overlay.remove();
                // 閃完後跳出扣分警告
                this.showSysAlert('danger', '🚨 系統嚴重警告', '您已超過任務規定期限！冒險積分持續扣減中，請立即補件！');
            }
        }, 150);
    },

    // 🌟 針對單一特定元素進行閃爍特效
    flashElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('shiny-effect');
            void el.offsetWidth;
            el.classList.add('shiny-effect');
        }
    },

    // 🌟 主線防具與奇遇武器的專屬升級邏輯
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

    // 🌟 延宕奪命連環閃警告動畫
    showDelayWarning() {
        if(document.getElementById('delay-warning-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'delay-warning-overlay';
        overlay.innerHTML = `<div class="warning-icon">⚠️ 警告</div><div class="warning-text">進度延宕，冒險積分持續流失中..</div>`;
        document.body.appendChild(overlay);
        
        void overlay.offsetWidth;
        overlay.classList.add('active');
        
        setTimeout(() => { overlay.querySelector('.warning-text').classList.add('show'); }, 1500); 
        
        overlay.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };
    },

    // 🌟 強提醒彈窗系統 (模擬判定)
    checkSystemAlerts() {
        if (this.state.hasSeenAlert) return;

        // 這裡未來會從 GAS 取得實際扣分/加分狀態。目前用模擬邏輯。
        // 假設如果網址有帶 ?alert=penalty 則跳扣分，帶 ?alert=bonus 則跳加分
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

    showSysAlert(type, titleText, msgText) {
        const modalId = 'sys-alert-' + Date.now();
        const html = `
            <div class="sys-alert-modal active" id="${modalId}">
                <div class="sys-alert-box ${type}">
                    <div class="sys-alert-title ${type}">${titleText}</div>
                    <div class="sys-alert-text">${msgText}</div>
                    <button class="sys-alert-btn" onclick="document.getElementById('${modalId}').remove()">我知道了</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 💰 解鎖機制 (大摺疊、小摺疊、隱藏武器、防具彩蛋)
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
        
        // 🌟 延遲優化：有通知等 3 秒，沒通知等 1 秒
        let delayTime = toastMsg ? 3000 : 1000;

        setTimeout(() => {
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain; // 記錄細項
            
            // 🌟 通知後台加分
            this.notifyBackendScore(id, scoreGain);
            
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
            
            if (scoreGain > 0 && action !== 'random_weapon') {
                this.flashElement('score-text');
            }
            if (doFlashItem) {
                this.flashElement('item-text'); 
                this.flashElement('rank-name'); 
            }
        }, delayTime);
    },

    // 🌟 通知後台寫入加分紀錄
    async notifyBackendScore(field, score) {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;
        try {
            await fetch(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'updateScore', uid: this.config.uid, field: field, score: score })
            });
        } catch(e) {}
    },

    // 🌟 第五關可自由取消的獨立計分觸發器
    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8;
        
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id);
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain;
            this.save();
            setTimeout(() => {
                this.updateUI();
                this.flashElement('score-text');
            }, 1000); // 無通知，1秒後結算閃爍
        } else if (!isChecked && this.state.achievements.includes(id)) {
            // 反悔取消打勾時，扣回分數
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
        el.className = 'floating-score'; // 🌟 修正點：改回 floating-score 才會吃到特效
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

        // 🌟 逼死強迫症：非整數進度條計算 (含第六關才會滿100%)
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
                    input.type = 'text'; // 🌟 鎖定後變形為純文字顯示
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

        // 🌟 自動變換日期格式為 XXXX年XX月XX日
        const parts = val.split('-');
        let formattedVal = val;
        if(parts.length === 3) {
            formattedVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        }

        if (type === 'exam') { this.state.examDate = formattedVal; this.state.examDateLocked = true; }
        else if (type === 'result') { this.state.resultDate = formattedVal; this.state.resultDateLocked = true; }
        else if (type === 'bank') { this.state.bankDate = formattedVal; this.state.bankDateLocked = true; }
        
        this.save(); 
        this.updateUI();

        // 🌟 鎖定日期時同步寫入後台
        this.notifyBackendDate(type, formattedVal);
    },

    // 🌟 通知後台紀錄日期
    async notifyBackendDate(dateType, dateValue) {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;
        try {
            await fetch(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'lockDate', uid: this.config.uid, dateType: dateType, dateValue: dateValue })
            });
        } catch(e) {}
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value;
        if (!val) return;
        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖，會因此扣分喔！");
        const btn = document.getElementById('btn-lock-change');
        if (btn) { btn.disabled = true; btn.innerText = "申請"; btn.style.opacity = "0.5"; }
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
        
        // 🌟 立即更新按鈕狀態與本機資料，防連點
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save(); 
        this.updateButtonStyles(); 

        // 🌟 通知後台紀錄闖關完成時間
        if (this.config.apiUrl && !this.config.apiUrl.includes("請把_WEB_APP")) {
            fetch(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'completeTrial', uid: this.config.uid, trialNum: trialNum })
            }).catch(e => {});
        }

        if (trialNum === 6) {
            // 🌟 拔除 Toast，改為 1.5 秒後直接進入大結局 (煙火動畫)
            setTimeout(() => {
                this.showFinalAchievement(true); // 傳入 true 代表要放煙火
                if (this.upgradeArmor()) {}
                if (this.upgradeWeapon()) {}
                this.save(); 
                this.updateUI();
            }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);

            // 🌟 延遲 3 秒結算特效 (等待 Toast 消失)
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

                if (doFlashItem) this.flashElement('item-text');
                this.flashElement('loc-text');
                this.flashElement('prog-val');
                if (trialNum !== 5) this.flashElement('score-text');
            }, 3000);
        }
    },

    // 🌟 檔案上傳模擬處理
    handleFileUpload(inputElement, chkId) {
        const file = inputElement.files[0];
        if (!file) return;

        const statusSpan = inputElement.parentElement.querySelector('.upload-status');
        const chkBox = document.getElementById(chkId);
        
        statusSpan.innerText = "⏳ 上傳中...";
        statusSpan.classList.remove('success');

        // 模擬上傳延遲 1.5 秒
        setTimeout(() => {
            statusSpan.innerText = "✅ 已上傳";
            statusSpan.classList.add('success');
            if (chkBox) {
                chkBox.checked = true;
                // 不自動鎖死，讓同仁仍可操作
            }
            // 這裡未來會接 GAS 傳送檔案的邏輯
        }, 1500);
    },

    // 🌟 史詩級大結局演出腳本 (支援重播模式與分數細項)
    showFinalAchievement(withFirework = true) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        
        // 抓取階級英文字母 (SS, S, A, B, C, D)
        const rankLetter = rank.title.match(/[A-ZS]+/)?.[0] || 'D';
        // 抓取完整稱號文字 (A級 菁英玩家)
        const fullRankTitle = rank.title.replace(/.*?([A-ZSS]+級.*)/, '$1');

        // 抓取完成度 % (此時已包含第六關的 12%)
        const currentProg = document.getElementById('prog-val').innerText;

        // 🌟 更新版評價文字庫
        let evalStr = "";
        if(this.state.score >= 96) evalStr = "無懈可擊的執行力！<br>積極度與效率令人驚豔，未來的表現值得期待！";
        else if(this.state.score >= 80) evalStr = "穩健可靠地完成了所有準備，<br>這是一個好的開始，繼續保持這份用心！";
        else if(this.state.score >= 41) evalStr = "雖然過程有些波折，但總算完成試煉，<br>未來的任務請務必更加留意細節與時效喔！";
        else evalStr = "試煉過程充滿驚險，職場如同戰場，<br>請重新調整狀態，拿出更好的表現！";

        // 裝備與嘲諷判定 (加上全形頓號)
        const weaponItem = this.state.items.find(i => Object.keys(this.weaponPaths).includes(i) || Object.values(this.weaponPaths).includes(i) || ['👑 王者之聖劍', '☄️ 破曉流星弓', '🐉 滅世龍吟槍'].includes(i)) || "";
        const armorItem = this.state.items.find(i => this.armorPath.includes(i)) || "";
        const finalEquip = [armorItem, weaponItem].filter(Boolean).join(' 、 '); 

        const hasWeapon = !!weaponItem;
        // 🌟 嘲諷顏色調淡 (#ff8a8a)
        let mockeryHTML = !hasWeapon ? `<div class="fade-in-row mockery-text" style="animation: fadeUpIn 0.8s forwards 3.3s;">📝 系統額外判定：<br>勇者雖已通關，但未詳閱《鍛造秘笈》，<br>仍全程赤手空拳完成試煉...敬佩！敬佩！</div>` : "";

        // 渲染結算面板的 HTML 結構 (綁定點擊背景關閉與分數明細)
        const renderModal = () => {
            if(document.getElementById('final-achievement-modal')) document.getElementById('final-achievement-modal').remove();
            
            // 這裡的分數細項，之後會由 GAS 傳來的真實數據取代
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
            // 點擊黑底也可關閉
            modal.onclick = () => {
                modal.classList.remove('active');
                setTimeout(()=>modal.remove(),300);
            };
            
            document.body.appendChild(modal);
            void modal.offsetWidth;
            modal.classList.add('active');
        };

        if (withFirework) {
            // 1. 放 CSS 粒子煙火 (停留 3 秒)
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

            // 2. 煙火結束，浮現結算面板
            setTimeout(() => {
                fw.classList.remove('active');
                setTimeout(() => {
                    fw.remove();
                    renderModal();
                }, 500);
            }, 3000); // 🌟 煙火維持 3 秒
        } else {
            // 無煙火模式 (重新登入時)，直接顯示面板
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
                            if(input.type === 'checkbox' || input.type === 'radio' || input.type === 'file') {
                                input.style.opacity = "0.5";
                                input.style.cursor = "not-allowed";
                            }
                        });
                        // 鎖定上傳按鈕外觀
                        const uploadBtns = detailsBlock.querySelectorAll('.file-upload-btn');
                        uploadBtns.forEach(uBtn => {
                            uBtn.style.opacity = "0.5";
                            uBtn.style.cursor = "not-allowed";
                            uBtn.style.pointerEvents = "none";
                        });
                    }

                    // 🌟 若是第六關破關按鈕，賦予「點擊回顧成就」功能
                    if (n === 6) {
                        btn.disabled = false; // 解開 disabled 讓它可以被點
                        btn.style.cursor = "pointer";
                        btn.onclick = () => { this.showFinalAchievement(false); };
                    }
                }
            }
            
            // 🌟 關卡順序防偷跑解鎖邏輯 (不再預設展開第一關)
            if (detailsBlock) {
                if (n === 1) {
                    detailsBlock.classList.remove('locked-details');
                } else {
                    if (this.state.currentTrial >= n - 1) {
                        detailsBlock.classList.remove('locked-details');
                    } else {
                        detailsBlock.classList.add('locked-details');
                        detailsBlock.removeAttribute('open'); // 強制關閉並鎖定
                    }
                }
            }
        });

        // 🌟 恢復第五關的勾選狀態 (但未破關前不反灰鎖死)
        if(this.state.achievements.includes('t5_score_1')) {
            const chk = document.getElementById('chk-t5-1');
            if (chk && this.state.currentTrial < 5) chk.checked = true; 
        }
        if(this.state.achievements.includes('t5_score_2')) {
            const chk = document.getElementById('chk-t5-2');
            if (chk && this.state.currentTrial < 5) chk.checked = true;
        }

        // 🌟 第六關霸道單選深度鎖定邏輯
        const have = document.getElementById('chk-bank-have');
        const process = document.getElementById('chk-bank-process');
        const done = document.getElementById('chk-bank-done');
        const bDate = document.getElementById('input-bank-date');
        const bBtn = document.getElementById('btn-lock-bank');

        if (have && process && done && this.state.currentTrial < 6) {
            // 先全部解鎖恢復正常
            have.disabled = false; process.disabled = false; done.disabled = false;
            if(!this.state.bankDateLocked) { bDate.disabled = false; bBtn.disabled = false; }
            
            // 再依照狀態進行封印
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
