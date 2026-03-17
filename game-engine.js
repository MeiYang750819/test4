/* ================================================================
   【 ⚙️ GAME ENGINE - 最終完美版 (全自動網址抓取版) 】
   ================================================================ */
const GameEngine = {
    // 🌟 後台 API 設定區
    config: {
        apiUrl: "https://script.google.com/macros/s/AKfycbwhYZ_miQb0iT3ISz2QHPJ7enDYzveMdcuHDRUl4REqzOUsSi3vHmCq4mA4DYFc1Y8Mhw/exec", 
        uid: new URLSearchParams(window.location.search).get('uid') || "TEST_001" 
    },

    state: {
        score: 0,
        backendRank: "", 
        examStatus: "",  
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        checkboxes: {}, 
        weaponType: null,
        currentTrial: 0,
        examDate: null,      
        examDateLocked: false,
        resultDate: null,    
        resultDateLocked: false,
        changeDate: null,    
        changeDateLocked: false,
        bankDate: null,
        bankDateLocked: false,
        bankStatus: null, 
        
        appointmentTime: "等待公會發布...", 
        appointmentLocation: "等待公會發布...", 
        
        scoreDetails: {
            base: 0,
            earlyBird: 0,
            delayPenalty: 0,
            hrEval: 0
        },
        hasSeenAlert: false, 
        hasSeenDoomFlash: false 
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
        // 強制清除所有下拉選單的預設開啟狀態
        document.querySelectorAll('details').forEach(el => el.removeAttribute('open'));

        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
        } catch (e) { localStorage.removeItem('hero_progress'); }
        
        this.injectGlobalCSS();
        
        // 綁定全網頁勾勾自動記憶功能
        setTimeout(() => {
            document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                if (this.state.checkboxes && this.state.checkboxes[chk.id]) {
                    chk.checked = true;
                }
                chk.addEventListener('change', (e) => {
                    if (!this.state.checkboxes) this.state.checkboxes = {};
                    this.state.checkboxes[e.target.id] = e.target.checked;
                    this.save();
                });
            });
        }, 100);
        
        this.syncWithBackend();

        setTimeout(() => { this.updateUI(false); }, 50); // 初始化不閃爍

        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        this.checkSystemAlerts();

        if (this.state.currentTrial >= 6) {
            setTimeout(() => {
                this.showFinalAchievement(false); 
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
            
            input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
            }
            input.locked-input {
                color: #ffffff !important;
                -webkit-text-fill-color: #ffffff !important;
                opacity: 1 !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid #555 !important;
            }
            .text-input-field {
                background: #2a2a2a; color: #fff; border: 1px solid #fbbf24; 
                padding: 4px 8px; border-radius: 4px; font-size: 14px; outline: none;
                width: 150px; display: inline-block;
            }
            .text-input-field:focus { box-shadow: 0 0 5px #fbbf24; }
        `;
        document.head.appendChild(style);
    },

    async syncWithBackend() {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;
        try {
            const fetchUrl = `${this.config.apiUrl}?action=loadData&uid=${encodeURIComponent(this.config.uid)}`;
            const response = await fetch(fetchUrl);
            const res = await response.json();
            
            console.log("後台回應狀態:", res); 

            if (res.status === 'success' && res.data) {
                if (res.data.appointmentTime) this.state.appointmentTime = res.data.appointmentTime;
                if (res.data.appointmentLocation) this.state.appointmentLocation = res.data.appointmentLocation;
                
                if (res.data.currentScore !== "") {
                    this.state.score = parseInt(res.data.currentScore, 10) || 0;
                }
                if (res.data.currentRank) {
                    this.state.backendRank = res.data.currentRank;
                }
                if (res.data.examStatus) {
                    this.state.examStatus = res.data.examStatus;
                }
                if (res.data.scoreDetails) {
                    this.state.scoreDetails = res.data.scoreDetails;
                }

                document.querySelectorAll('.dyn-company').forEach(el => el.innerText = res.data.companyName || "MYs studio");
                document.querySelectorAll('.dyn-team').forEach(el => el.innerText = res.data.team || "外場團隊");
                document.querySelectorAll('.dyn-type').forEach(el => el.innerText = res.data.type || "兼職");
                document.querySelectorAll('.dyn-name').forEach(el => el.innerText = res.data.userName || "測試員");
                
                // 狀態連動
                const statusStr = String(this.state.examStatus).trim().toUpperCase();
                const isExamApproved = (statusStr === '通過' || statusStr === 'OK');
                const isExamRejected = (statusStr === '退件');

                if (this.state.currentTrial >= 6) {
                    this.state.status = '👑 聖殿加冕';
                } else if (isExamRejected) {
                    this.state.status = '❌ 強化失敗';
                } else if (isExamApproved) {
                    this.state.status = '👑 鑑定通過';
                } else if (this.state.currentTrial === 3) {
                    this.state.status = '⏳ 提交公會審查';
                } else {
                    this.state.status = '📦 檢整裝備中';
                }

                this.updateUI(true); // 同步後台後進行精準閃爍
                
                if (res.data.isOverdue && !this.state.hasSeenDoomFlash) {
                    this.triggerDoomFlash();
                }
            } else if (res.status === 'error') {
                console.error("⛔ 後台發生致命錯誤:", res.message);
                this.showToast("連線後台發生異常，請按 F12 檢視錯誤訊息！");
            }
        } catch (err) {
            console.error("Fetch 連線失敗:", err);
        }
    },
    
    // 🌟 三段式奪命連環閃特效
    async triggerDoomFlash() {
        if (document.getElementById('doom-flash-overlay')) return;
        
        this.state.hasSeenDoomFlash = true;
        this.save();
        
        const overlay = document.createElement('div');
        overlay.id = 'doom-flash-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; transition: background-color 0.1s;';
        
        overlay.innerHTML = `
            <div id="doom-text-main" style="color:white; font-size:48px; font-weight:900; text-shadow: 2px 2px 10px rgba(0,0,0,0.8); margin-bottom: 20px; opacity: 0; transition: opacity 0.1s;">⚠️ 警告！！</div>
            <div id="doom-text-sub" style="color:#ffcccc; font-size:20px; font-weight:bold; max-width: 80%; line-height: 1.5; display: none;">
                進度嚴重落後，冒險積分已遭系統扣減，請立即補件！
            </div>
            <button id="doom-btn-close" style="margin-top: 30px; padding: 12px 24px; font-size: 18px; font-weight: bold; background-color: #fbbf24; border: none; border-radius: 8px; cursor: pointer; display: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">我知道了</button>
        `;
        document.body.appendChild(overlay);
        
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const mainText = document.getElementById('doom-text-main');
        const subText = document.getElementById('doom-text-sub');
        const closeBtn = document.getElementById('doom-btn-close');

        // 1. 純紅光閃爍 (紅 -> 黑交替 6 次)
        for (let i = 0; i < 6; i++) {
            overlay.style.backgroundColor = (i % 2 === 0) ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.9)';
            await sleep(150);
        }
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        await sleep(300);

        // 2. 警告字樣閃兩次
        for (let i = 0; i < 2; i++) {
            mainText.style.opacity = '1';
            await sleep(400);
            mainText.style.opacity = '0';
            await sleep(200);
        }

        // 3. 顯示最終文字與關閉按鈕
        subText.style.display = 'block';
        closeBtn.style.display = 'block';

        closeBtn.onclick = () => {
            overlay.remove();
        };
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
            this.state.scoreDetails.base += scoreGain;
            
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
            this.updateUI(true); // 精準閃爍
            
        }, delayTime);
    },

    async notifyBackendScore(field, score) {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP") || score === 0) return;
        try {
            const fetchUrl = `${this.config.apiUrl}?action=updateScore&uid=${encodeURIComponent(this.config.uid)}&field=${encodeURIComponent(field)}&score=${encodeURIComponent(score)}`;
            await fetch(fetchUrl);
        } catch(e) {}
    },

    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8;
        
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id);
            this.state.score += scoreGain;
            this.state.scoreDetails.base += scoreGain;
            this.save();
            setTimeout(() => {
                this.updateUI(true);
            }, 1000); 
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.score -= scoreGain;
            this.state.scoreDetails.base -= scoreGain;
            this.save();
            this.updateUI(true);
        }
    },

    // 🌟 防呆：加分等於 0 的時候絕對不顯示浮空數字
    createFloatingText(e, text) {
        if (text === '+0' || text === '-0') return; 
        
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        const el = document.createElement('div');
        el.className = 'floating-score'; 
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

    // 🌟 實裝精準比對與閃爍邏輯 (doFlash 參數控制是否觸發動畫)
    updateUI(doFlash = false) {
        // 1. 取得舊狀態 (供比對)
        const oldScoreText = document.getElementById('score-text') ? document.getElementById('score-text').innerText : "";
        const oldRankText = document.getElementById('rank-name') ? document.getElementById('rank-name').innerText : "";
        const oldLocText = document.getElementById('loc-text') ? document.getElementById('loc-text').innerText : "";
        const oldItemText = document.getElementById('item-text') ? document.getElementById('item-text').innerText : "";
        const oldStatusText = document.getElementById('dyn-status') ? document.getElementById('dyn-status').innerText : "";

        // 2. 計算新狀態
        let displayRankTitle = this.state.backendRank;
        if (!displayRankTitle) {
            const rankObj = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
            displayRankTitle = rankObj.title;
        }

        const newScoreText = this.state.score + "分";
        const newLocText = this.state.location;
        const newItemText = this.state.items.join(' ');
        const newStatusText = this.state.status;

        // 3. 更新畫面
        const rEl = document.getElementById('rank-text');
        const sEl = document.getElementById('status-tag');
        
        if (rEl) rEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="rank-name">${displayRankTitle}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="loc-text">${newLocText}</span>`;
        if (sEl) sEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="item-text">${newItemText}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status">${newStatusText}</span>`;
        
        const scoreEl = document.getElementById('score-text');
        if (scoreEl) scoreEl.innerText = newScoreText;
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

        const oldProgText = document.getElementById('prog-val') ? document.getElementById('prog-val').innerText : "";
        const newProgText = currentProg + "%";

        const progVal = document.getElementById('prog-val');
        if (progVal) progVal.innerText = newProgText;
        const progFill = document.getElementById('prog-fill');
        if (progFill) progFill.style.width = currentProg + "%";

        // 4. 精準閃爍判定 (只有不一樣才閃)
        if (doFlash) {
            if (oldScoreText !== newScoreText) this.flashElement('score-text');
            if (oldRankText !== displayRankTitle && oldRankText !== "") this.flashElement('rank-name');
            if (oldLocText !== newLocText && oldLocText !== "") this.flashElement('loc-text');
            if (oldItemText !== newItemText && oldItemText !== "") this.flashElement('item-text');
            if (oldStatusText !== newStatusText && oldStatusText !== "") this.flashElement('dyn-status');
            if (oldProgText !== newProgText && oldProgText !== "") this.flashElement('prog-val');
        }

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
                if (field.locked) {
                    input.type = 'text'; 
                    input.value = field.val || ""; 
                    input.disabled = true;
                    input.classList.add('locked-input');
                    btn.innerText = "已鎖定";
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                } else {
                    input.type = 'date';
                    input.classList.remove('locked-input');
                }
            }
        });

        // 🌟 申請改期的按鈕變為「已送出」
        const changeInput = document.getElementById('input-change-date');
        const changeBtn = document.getElementById('btn-lock-change');
        if (changeInput && changeBtn && this.state.changeDateLocked) {
            changeInput.type = 'text';
            changeInput.value = this.state.changeDate || "";
            changeInput.disabled = true;
            changeInput.classList.add('locked-input');
            changeBtn.innerText = "✅ 已送出";
            changeBtn.disabled = true;
            changeBtn.style.opacity = "0.5";
        }
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

        if (type === 'exam') { this.state.examDate = formattedVal; this.state.examDateLocked = true; }
        else if (type === 'result') { this.state.resultDate = formattedVal; this.state.resultDateLocked = true; }
        else if (type === 'bank') { this.state.bankDate = formattedVal; this.state.bankDateLocked = true; }
        
        this.save(); 
        this.updateUI(false);

        this.notifyBackendDate(type, formattedVal);
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value;
        if (!val) { alert("請先選擇要申請改期的日期！"); return; }
        
        const confirmLock = confirm("確定要送出改期申請嗎？");
        if (!confirmLock) return;

        const parts = val.split('-');
        let formattedVal = val;
        if(parts.length === 3) {
            formattedVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        }

        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖，會因此扣分喔！");
        
        this.state.changeDate = formattedVal;
        this.state.changeDateLocked = true;
        this.save();
        this.updateUI(false);
        
        this.notifyBackendDate('change', formattedVal);
    },

    async notifyBackendDate(dateType, dateValue) {
        if (!this.config.apiUrl || this.config.apiUrl.includes("請把_WEB_APP")) return;
        try {
            const fetchUrl = `${this.config.apiUrl}?action=lockDate&uid=${encodeURIComponent(this.config.uid)}&dateType=${encodeURIComponent(dateType)}&dateValue=${encodeURIComponent(dateValue)}`;
            await fetch(fetchUrl);
        } catch(e) {}
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
        
        if (trialNum === 3) {
            if (!this.state.examDateLocked || !this.state.resultDateLocked) {
                alert("⚠️ 請先填寫並「鎖定」體檢相關日期（預計體檢日 ＆ 報告產出日），才能推進關卡！");
                return;
            }
        }
        
        const tData = this.trialsData[trialNum];
        
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save(); 
        
        if (trialNum === 3) this.state.status = '⏳ 提交公會審查';
        this.updateButtonStyles(); 

        const detailsBlock = document.getElementById(`detail-trial-${trialNum}`);
        if (detailsBlock) {
            detailsBlock.removeAttribute('open');
        }

        if (this.config.apiUrl && !this.config.apiUrl.includes("請把_WEB_APP")) {
            const fetchUrl = `${this.config.apiUrl}?action=completeTrial&uid=${encodeURIComponent(this.config.uid)}&trialNum=${encodeURIComponent(trialNum)}`;
            fetch(fetchUrl).catch(e => {});
        }

        if (trialNum === 6) {
            setTimeout(() => {
                this.showFinalAchievement(true); 
                if (this.upgradeArmor()) {}
                if (this.upgradeWeapon()) {}
                this.save(); 
                this.updateUI(true);
            }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);

            // 🌟 破關瞬間飄出大加分數字
            if (tData.scoreGain > 0 && event) {
                this.createFloatingText(event, `+${tData.scoreGain}`);
            }

            setTimeout(() => {
                if (trialNum !== 5) {
                    this.state.score += tData.scoreGain;
                    this.state.scoreDetails.base += tData.scoreGain;
                }
                
                if (this.upgradeArmor()) {}
                if (this.upgradeWeapon()) {}

                this.save(); 
                this.updateUI(true); // 精準閃爍
            }, 3000);
        }
    },

    handleFileUpload(inputElement, chkId) {
        const file = inputElement.files[0];
        if (!file) return;

        const statusSpan = inputElement.parentElement.querySelector('.upload-status');
        const chkBox = document.getElementById(chkId);
        
        statusSpan.innerText = "⏳ 上傳中...";
        statusSpan.classList.remove('success');

        setTimeout(() => {
            statusSpan.innerText = "✅ 已上傳";
            statusSpan.classList.add('success');
            if (chkBox) {
                chkBox.checked = true;
                if (!this.state.checkboxes) this.state.checkboxes = {};
                this.state.checkboxes[chkId] = true;
                this.save();
            }
        }, 1500);
    },

    // 🌟 終極六字訣：動態大結局明細
    showFinalAchievement(withFirework = true) {
        let displayRankTitle = this.state.backendRank;
        if (!displayRankTitle) {
            const rankObj = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
            displayRankTitle = rankObj.title;
        }
        
        const rankLetter = displayRankTitle.match(/[A-ZS]+/)?.[0] || 'D';
        const fullRankTitle = displayRankTitle.replace(/.*?([A-ZSS]+級.*)/, '$1');

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
            
            // 🌟 使用從後台抓來的六字訣細項
            const baseScore = this.state.scoreDetails.base;
            const earlyBird = this.state.scoreDetails.earlyBird;
            const delayPenalty = this.state.scoreDetails.delayPenalty;
            const hrEval = this.state.scoreDetails.hrEval;
            
            let detailHtml = `
                <div style="font-size: 13px; color: #888; margin-left: 10px; margin-top: 5px; line-height: 1.4;">
                    └ 🗺️ 基礎探索積分：${baseScore} 分<br>
            `;
            if (earlyBird > 0) detailHtml += `└ ⚡ 高效早鳥紅利：<span style="color:#4ade80;">+${earlyBird} 分</span><br>`;
            if (delayPenalty < 0) detailHtml += `└ ⏳ 任務延宕損耗：<span style="color:#ff8a8a;">${delayPenalty} 分</span><br>`;
            if (hrEval !== 0) detailHtml += `└ 👁️ 公會長老評鑑：<span style="${hrEval > 0 ? 'color:#4ade80;' : 'color:#ff8a8a;'}">${hrEval > 0 ? '+'+hrEval : hrEval} 分</span><br>`;
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
                            <strong>💯 最終冒險積分：</strong>${this.state.score} 分
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
            modal.onclick = () => {
                modal.classList.remove('active');
                setTimeout(()=>modal.remove(),300);
            };
            
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
                setTimeout(() => {
                    fw.remove();
                    renderModal();
                }, 500);
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
        
        // 🌟 嚴格判定「通過、ok、OK」與「退件」
        const statusStr = String(this.state.examStatus).trim().toUpperCase();
        const isExamApproved = (statusStr === '通過' || statusStr === 'OK');
        const isExamRejected = (statusStr === '退件');
        
        const trials = [1, 2, 3, 4, 5, 6];
        trials.forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`);
            const detailsBlock = document.getElementById(`detail-trial-${n}`);
            
            if (btn) {
                // 基本破關鎖定邏輯
                if (this.state.currentTrial >= n) {
                    btn.disabled = true;
                    btn.innerText = lockedTexts[n];
                    btn.style.backgroundColor = ""; 
                    btn.style.color = ""; 
                    
                    if (detailsBlock) {
                        const inputs = detailsBlock.querySelectorAll('input');
                        inputs.forEach(input => {
                            input.disabled = true;
                            if(input.type === 'checkbox' || input.type === 'radio' || input.type === 'file') {
                                input.style.opacity = "1"; 
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

                // 🌟 特例：第三關通過，按鈕直接變身綠色金牌
                if (n === 3 && this.state.currentTrial >= 3 && isExamApproved) {
                    btn.innerText = "✅ 鑑定所・已通過";
                    btn.style.backgroundColor = "#2a2a2a"; 
                    btn.style.color = "#4ade80"; // 綠色文字
                    btn.style.border = "1px solid #4ade80";
                }

                // 🌟 特例：第三關被退件，強制解鎖輸入框讓勇者重傳
                if (n === 3 && isExamRejected) {
                    btn.disabled = false;
                    btn.innerText = "❌ 被退件・重新提交";
                    btn.style.backgroundColor = "#ef4444"; 
                    btn.style.color = "#ffffff";
                    
                    if (detailsBlock) {
                        detailsBlock.querySelectorAll('input').forEach(input => {
                            input.disabled = false;
                            input.style.cursor = "pointer";
                        });
                        detailsBlock.querySelectorAll('.file-upload-btn').forEach(uBtn => {
                            uBtn.style.opacity = "1";
                            uBtn.style.cursor = "pointer";
                            uBtn.style.pointerEvents = "auto";
                        });
                    }
                }
            }
            
            // 🌟 關卡順序防偷跑解鎖邏輯 (並清除未解鎖關卡的快取勾勾)
            if (detailsBlock) {
                if (n === 1) {
                    detailsBlock.classList.remove('locked-details');
                } else if (n === 4) {
                    // 第四關：必須第三關送出(>=3) 且 後台「通過或OK」才解鎖
                    if (this.state.currentTrial >= 3 && isExamApproved) {
                        detailsBlock.classList.remove('locked-details');
                    } else {
                        detailsBlock.classList.add('locked-details');
                        detailsBlock.removeAttribute('open');
                        // 🌟 防呆：未解鎖關卡強制洗掉勾勾
                        detailsBlock.querySelectorAll('input[type="checkbox"]').forEach(chk => { chk.checked = false; });
                    }
                } else {
                    if (this.state.currentTrial >= n - 1) {
                        detailsBlock.classList.remove('locked-details');
                    } else {
                        detailsBlock.classList.add('locked-details');
                        detailsBlock.removeAttribute('open'); 
                        // 🌟 防呆：未解鎖關卡強制洗掉勾勾
                        detailsBlock.querySelectorAll('input[type="checkbox"]').forEach(chk => { chk.checked = false; });
                    }
                }
            }
        });
    }
};
window.addEventListener('load', () => GameEngine.init());
