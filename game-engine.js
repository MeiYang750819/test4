//* --------配色／字級設定區（可自行調整）--------*//
/* <======== 檔案用途：遊戲核心邏輯與狀態管理 ======== > */

/* ================================================================
   【 ⚙️ GAME ENGINE - 最終完美連動版 】
   專案名稱：test4
   描述：處理行政與評分分流、兩段式極速載入、大/小摺疊清單式累加備註。
   ================================================================ */
const GameEngine = {
    // 🌟 API 設定區
    API_URL: "https://script.google.com/macros/s/AKfycbxPKOg6IcpgNF8QTtgI4_vEZ6SdH4PARV30D09vU7e5V6Rm9EvgkZfnLvs91S7Le__3mA/exec", /* GAS 部署網址，可調 */

    state: {
        sysId: null, /* 系統編號，由網址 id 參數取得 */
        userName: "勇者", /* 玩家本名 */
        companyName: "載入中...", /* 公司名稱 */
        team: "載入中...", /* 隸屬團隊 */
        jobType: "載入中...", /* 工作型態（兼職/正職） */
        score: 0, /* 總積分 */
        items: ['👕 粗製布衣'], /* 道具清單 */
        location: '⛺ 新手村', /* 地圖位置 */
        status: '📦 檢整裝備中', /* 狀態說明 */
        achievements: [], /* 已觸發的成就 ID */
        weaponType: null, /* 初始隨機武器類別 */
        currentTrial: 0, /* 完成關卡數 */
        examDate: null, /* 體檢日期 */
        examDateLocked: false, /* 體檢日期鎖定開關 */
        resultDate: null, /* 報告日期 */
        resultDateLocked: false, /* 報告日期鎖定開關 */
        bankDate: null, /* 薪轉辦理日 */
        bankDateLocked: false, /* 薪轉辦理日鎖定開關 */
        bankStatus: null, /* 銀行辦理狀態紀錄 */
        appointmentTime: "等待公會發布...", /* 報到時間 */
        appointmentLocation: "等待公會發布...", /* 報到地點 */
        scoreDetails: {
            baseAndExplore: 0, /* 基礎與探索得分細項 */
            penalty: 0, /* 扣分細項 */
            bonus: 0, /* 獎勵細項 */
            hrEval: 0 /* 人資評分細項 */
        },
        hasSeenAlert: false /* 系統強提醒開關 */
    },

    // 🏆 戰力階級稱號設定
    ranks: [
        { min: 101, title: "💎 SS級 神話級玩家" }, /* 101分以上 */
        { min: 96,  title: "🌟 S級 傳說級玩家" },  /* 96-100分 */
        { min: 80,  title: "🟢 A級 菁英玩家" },    /* 80-95分 */
        { min: 60,  title: "🥇 B級 穩健玩家" },    /* 60-79分 */
        { min: 40,  title: "🥈 C級 潛力玩家" },    /* 40-59分 */
        { min: 20,  title: "🥉 D級 基礎學徒" },    /* 20-39分 */
        { min: 10,  title: "🌱 實習小萌新" },      /* 10-19分 */
        { min: 0,   title: "🥚 報到新手村" }       /* 0-9分 */
    ],

    // 🛡️ 防具進化線
    armorPath: ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'],

    // ⚔️ 武器升級邏輯路徑（Key 為現有，Value 為進化後）
    weaponPaths: {
        '🗡️ 精鋼短劍': '⚔️ 騎士長劍', '⚔️ 騎士長劍': '⚔️ 破甲重劍', '⚔️ 破甲重劍': '🗡️ 聖光戰劍', '🗡️ 聖光戰劍': '👑 王者之聖劍',
        '🏹 獵人短弓': '🏹 精靈長弓', '🏹 精靈長弓': '🏹 迅雷連弓', '🏹 迅雷連弓': '🏹 追風神弓', '🏹 追風神弓': '☄️ 破曉流星弓',
        '🔱 鐵尖長槍': '🔱 鋼鐵戰矛', '🔱 鋼鐵戰矛': '🔱 破陣重矛', '🔱 破陣重矛': '🔱 龍膽銀槍', '🔱 龍膽銀槍': '🐉 滅世龍吟槍'
    },

    // 🚩 關卡屬性設定
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
        if (urlId) this.state.sysId = urlId;

        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { this.state = Object.assign({}, this.state, JSON.parse(saved)); }
            if (urlId) this.state.sysId = urlId; 
        } catch (e) { localStorage.removeItem('hero_progress'); }

        this.injectGlobalCSS();
        
        if (this.state.sysId) {
            this.fetchIdentityOnly(); /* 兩段式載入：1.身分 */
        } else {
            this.updateUI();
        }

        if (window.location.search.includes('delay=1')) {
            setTimeout(() => this.showDelayWarning(), 500);
        }

        this.checkSystemAlerts();

        if (this.state.currentTrial >= 6) {
            setTimeout(() => { this.showFinalAchievement(false); }, 800);
        }
    },

    // 🌐 GAS 連動：極速獲取身分
    fetchIdentityOnly() {
        fetch(`${this.API_URL}?id=${this.state.sysId}&mode=identity`)
            .then(res => res.json()).then(res => {
                if (res.success) {
                    this.state.companyName = res.data.companyName;
                    this.state.team = res.data.team;
                    this.state.jobType = res.data.type;
                    this.state.userName = res.data.userName;
                    this.updateUI();
                    this.fetchFullData(); /* 兩段式載入：2.完整數據與日期 */
                }
            });
    },

    fetchFullData() {
        fetch(`${this.API_URL}?id=${this.state.sysId}`)
            .then(res => res.json()).then(res => {
                if (res.success) {
                    const d = res.data;
                    this.state.score = d.totalScore || 0;
                    this.state.appointmentTime = d.appointmentTime;
                    this.state.appointmentLocation = d.appointmentLocation;
                    if (d.examDate) { this.state.examDate = d.examDate; this.state.examDateLocked = true; }
                    if (d.resultDate) { this.state.resultDate = d.resultDate; this.state.resultDateLocked = true; }
                    if (d.bankDate) { this.state.bankDate = d.bankDate; this.state.bankDateLocked = true; }
                    this.save(); this.updateUI();
                }
            });
    },

    // 💰 點擊解鎖：大/小摺疊加分，並同步至後台累加備註
    unlock(event, id, action, foldLabel, foldScore) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id);
        this.save();

        let scoreGain = foldScore || 0;
        let foldType = '';
        let toastMsg = "";
        let alertMsg = "";
        let doFlashItem = false;

        if (action === 'large_fold') {
            foldType = 'big';
            scoreGain = 2;
            alertMsg = `🔔 發現隱藏關卡，冒險積分 +${scoreGain}`;
        } else if (action.includes('explore')) {
            foldType = 'small';
            scoreGain = 1;
            toastMsg = action === 'explore_armor' ? `✨ 防具升級，冒險積分+${scoreGain}` : `🧩 獲得情報，冒險積分 +${scoreGain}`;
        } else if (action === 'random_weapon') {
            scoreGain = 1;
            toastMsg = `⚔️ 獲得基礎武器，戰力大幅提升！`;
        }

        if (alertMsg) alert(alertMsg);
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
            
            // 🌟 同步至 GAS：觸發後台 updateFoldNote 邏輯
            this.syncToBackend({
                foldType: foldType,
                foldLabel: foldLabel || id,
                foldScore: scoreGain
            });

            if (scoreGain > 0) this.flashElement('score-text');
            if (doFlashItem) { this.flashElement('item-text'); this.flashElement('rank-name'); }
        }, delayTime);
    },

    syncToBackend(payload) {
        if (!this.state.sysId) return;
        Object.assign(payload, { id: this.state.sysId, userName: this.state.userName });
        fetch(this.API_URL, { method: "POST", body: JSON.stringify(payload) })
            .then(res => res.json()).then(result => {
                if (result.success) {
                    this.state.score = result.newScoreData.totalScore;
                    this.updateUI();
                }
            });
    },

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) return;
        if (trialNum === 5 && !this.canUnlockTrial5().can) { alert(this.canUnlockTrial5().reason); return; }

        const tData = this.trialsData[trialNum];
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.save();
        this.updateButtonStyles();

        // 🌟 通關時間戳記同步至評分表 Q~V 欄
        const syncData = { [`trial${trialNum}Done`]: true };
        if (trialNum === 3) syncData.trial3Submit = true;
        this.syncToBackend(syncData);

        if (trialNum === 6) {
            setTimeout(() => {
                this.showFinalAchievement(true);
                this.upgradeArmor(); this.upgradeWeapon();
                this.save(); this.updateUI();
            }, 1500);
        } else {
            let msg = trialNum === 3 ? '📣 此階段任務已完成，請稍待鑑定！' : '📣 此階段任務已完成，請繼續前進！';
            this.showToast(msg);
            setTimeout(() => {
                if (trialNum !== 5) {
                    this.state.scoreDetails.baseAndExplore += tData.scoreGain;
                }
                this.upgradeArmor(); this.upgradeWeapon();
                this.save(); this.updateUI();
                this.flashElement('loc-text');
                this.flashElement('prog-val');
            }, 3000);
        }
    },

    toggleTrial5Score(event, id) {
        const isChecked = event.target.checked;
        let scoreGain = 8; /* 第五關拆分分數 */
        if (isChecked && !this.state.achievements.includes(id)) {
            this.createFloatingText(event, `+${scoreGain}`);
            this.state.achievements.push(id);
            this.state.score += scoreGain;
            this.state.scoreDetails.baseAndExplore += scoreGain;
            this.save();
            setTimeout(() => { this.updateUI(); this.flashElement('score-text'); }, 1000);
        } else if (!isChecked && this.state.achievements.includes(id)) {
            this.state.achievements = this.state.achievements.filter(a => a !== id);
            this.state.score -= scoreGain;
            this.state.scoreDetails.baseAndExplore -= scoreGain;
            this.save(); this.updateUI(); this.flashElement('score-text');
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
        let currentWeapon = this.state.items.find(item => Object.keys(this.weaponPaths).includes(item));
        if (currentWeapon && this.weaponPaths[currentWeapon]) {
            let nextWeapon = this.weaponPaths[currentWeapon];
            this.state.items = this.state.items.map(item => item === currentWeapon ? nextWeapon : item);
            return true;
        }
        return false;
    },

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
        for(let i=1; i<=this.state.currentTrial; i++) { if(i <= 6) currentProg += this.trialsData[i].progGain; }
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
        dateFields.forEach(f => {
            const input = document.getElementById(f.id);
            const btn = document.getElementById(f.btn);
            if (input && btn) {
                input.value = f.val || "";
                if (f.locked) {
                    input.type = 'text'; input.disabled = true;
                    btn.innerText = "已鎖定"; btn.disabled = true; btn.style.opacity = "0.5";
                } else { input.type = 'date'; }
            }
        });
    },

    lockDate(type) {
        const id = type === 'exam' ? 'input-exam-date' : type === 'result' ? 'input-result-date' : 'input-bank-date';
        const val = document.getElementById(id).value;
        if (!val) { alert("請先選擇日期！"); return; }
        if (!confirm("鎖定後不可修改，確定嗎？")) return;

        const parts = val.split('-');
        let formattedVal = val;
        if(parts.length === 3) formattedVal = `${parts[0]}年${parts[1]}月${parts[2]}日`;

        let payload = {};
        if (type === 'exam') { this.state.examDate = formattedVal; this.state.examDateLocked = true; payload.examDate = formattedVal; }
        else if (type === 'result') { this.state.resultDate = formattedVal; this.state.resultDateLocked = true; payload.resultDate = formattedVal; }
        else if (type === 'bank') { this.state.bankDate = formattedVal; this.state.bankDateLocked = true; payload.bankDate = formattedVal; }
        
        this.save(); this.updateUI(); this.syncToBackend(payload);
    },

    requestChange() {
        const val = document.getElementById('input-change-date').value;
        if (!val) return;
        alert("🚨 已送出申請，請私訊人資承辦，核准後將為您解鎖，會因此扣分喔！");
        this.syncToBackend({ changeDate: val });
    },

    canUnlockTrial5() {
        if (!this.state.appointmentTime || this.state.appointmentTime.includes("等待")) return { can: false, reason: "⚠️ 尚未發布報到時間。" };
        const now = new Date();
        const aptDateStr = this.state.appointmentTime.replace(/\//g, '-').split(' ')[0];
        const openTime = new Date(`${aptDateStr}T08:00:00`);
        if (now < openTime) return { can: false, reason: `⚠️ 營地大門深鎖\請於 ${aptDateStr} 08:00 後再來！` };
        return { can: true };
    },

    showFinalAchievement(withFirework = true) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rankLetter = rank.title.match(/[A-ZSS]+/)?.[0] || 'D';
        const fullRankTitle = rank.title;
        const currentProg = document.getElementById('prog-val').innerText;

        let evalStr = (this.state.score >= 96) ? "無懈可擊的執行力！積極度與效率令人驚豔！" : (this.state.score >= 80) ? "穩健可靠完成所有準備，是個好的開始！" : "試煉過程充滿驚險，請調整狀態拿出更好表現！";
        const weaponItem = this.state.items.find(i => Object.keys(this.weaponPaths).includes(i) || Object.values(this.weaponPaths).includes(i)) || "";
        const armorItem = this.state.items.find(i => this.armorPath.includes(i)) || "";
        const finalEquip = [armorItem, weaponItem].filter(Boolean).join(' 、 ');

        const renderModal = () => {
            const modal = document.createElement('div');
            modal.id = 'final-achievement-modal';
            modal.innerHTML = `
                <div class="achievement-box" onclick="event.stopPropagation()">
                    <div class="close-modal-btn" onclick="document.getElementById('final-achievement-modal').remove()">✕</div>
                    <div class="typing-container">
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0s;">評</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.4s;">定</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 0.8s;">${rankLetter}</span>
                        <span class="type-char" style="animation: stampIn 0.5s forwards 1.2s;">級</span>
                    </div>
                    <div style="margin-top: 30px;">
                        <div class="fade-in-row"><strong>🏆 最終評級：</strong>${fullRankTitle}</div>
                        <div class="fade-in-row"><strong>💯 冒險積分：</strong>${this.state.score} 分</div>
                        <div class="fade-in-row"><strong>✅ 試煉完成：</strong>${currentProg}</div>
                        <div class="fade-in-row"><strong>🛡️ 最終裝備：</strong>${finalEquip}</div>
                        <div class="fade-in-row eval-text"><strong>📜 系統總評：</strong><br>${evalStr}</div>
                    </div>
                </div>
            `;
            modal.onclick = () => modal.remove();
            document.body.appendChild(modal);
            modal.classList.add('active');
        };

        if (withFirework) {
            const fw = document.createElement('div');
            fw.id = 'firework-overlay';
            fw.innerHTML = `<div class="firework-text">入職試煉圓滿達成<br>歡迎正式踏入我們的行列</div>`;
            document.body.appendChild(fw);
            fw.classList.add('active');
            setTimeout(() => { fw.remove(); renderModal(); }, 3000);
        } else { renderModal(); }
    },

    updateButtonStyles() {
        const lockedTexts = { 1: "🔒 啟程點・已封印", 2: "🔒 行囊區・已封印", 3: "⏳ 鑑定所・審核中", 4: "🔒 前線營・已就緒", 5: "📜 誓約日・已締約", 6: "👑 聖殿區・已加冕" };
        [1, 2, 3, 4, 5, 6].forEach(n => {
            const btn = document.getElementById(`btn-trial-${n}`);
            const det = document.getElementById(`detail-trial-${n}`);
            if (btn && this.state.currentTrial >= n) {
                btn.disabled = (n !== 6);
                btn.innerText = lockedTexts[n];
                if (det) det.querySelectorAll('input').forEach(i => i.disabled = true);
                if (n === 6) btn.onclick = () => this.showFinalAchievement(false);
            }
            if (det && n > 1 && this.state.currentTrial < n - 1) det.classList.add('locked-details');
            else if (det) det.classList.remove('locked-details');
        });
    },

    injectGlobalCSS() { /* 保持原有的 CSS 特效注入 */ },
    createFloatingText(e, t) { /* 保持原有的飄浮文字 */ },
    showToast(m) { /* 保持原有的通知彈窗 */ },
    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); }
};
window.addEventListener('load', () => GameEngine.init());
