<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💼 勇者入職試煉</title>

    <meta property="og:title" content="🛠️｜MYs系統｜新手村登入區" />
    <meta property="og:description" content="闖關冒險即將開始！詳閱任務指南並完成關卡，解鎖職場新身分！" />
    <meta property="og:image" content="https://meiyang750819.github.io/test3/assets/img1/MYs_logo_去背1.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://meiyang750819.github.io/test3/" />

    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="nav.css">
    <script src="game-engine.js"></script>
    <style>
        .details-body {
            white-space: normal !important; 
            color: #b0b0b0; 
        }

        /* 🎯 任務目標顏色設定為 #cccccc */
        .task-target {
            color: #cccccc; 
            font-weight: bold;
            display: block;
            margin-bottom: 12px; 
        }

        .check-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px; 
            cursor: pointer;
            font-size: 14px;
            color: #a0a0a0; 
        }

        .check-item input[type="checkbox"] {
            margin-right: 8px; 
            width: 16px;
            height: 16px;
            flex-shrink: 0; 
        }

        .underline-text {
            border-bottom: 1px solid #8ab4f8;
            min-width: 100px;
            display: inline-block;
            margin-left: 5px;
        }

        /* 超連結樣式優化 */
        .external-link {
            color: #8ab4f8;
            text-decoration: underline;
            font-weight: bold;
            margin: 10px 0;
            display: inline-block;
            transition: 0.3s;
        }

        .external-link:hover {
            color: #4ade80;
        }

        .tracking-box { 
            background: rgba(0,0,0,0.2); 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px dashed #555;
            margin: 20px 0;
        }

        .tracking-header { text-align: center; display: block; margin-bottom: 15px; font-weight: bold; color: #cccccc; }
        .date-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; gap: 10px; }
        
        .btn-lock { background: #232a35; color: rgba(255, 255, 255, 0.7); border: 1px solid #4ade80; padding: 8px 12px; border-radius: 4px; font-size: 14px; cursor: pointer; flex: 1; transition: 0.3s; white-space: nowrap; }
        .btn-lock:hover { background: #4ade80; color: #000; }
        .btn-lock:disabled { opacity: 0.3; cursor: not-allowed; border-color: #555; color: #666; }
        
        .lock-note { font-size: 13px; color: #ff8a8a; line-height: 1.8; display: block; margin-top: 10px; }
        .info-highlight { color: #fbbf24; font-weight: bold; }
        .action-center { text-align: center; margin-top: 20px; }
        .btn-confirm { width: 100%; padding: 12px; background: #2d3748; color: #4ade80; font-weight: bold; font-size: 15px; border: 1px solid #4ade80; border-radius: 6px; cursor: pointer; letter-spacing: 1px; transition: all 0.3s ease; }

        @media (max-width: 480px) {
            .date-row input[type="date"], .date-row input[type="text"] { flex: 2.5; }
            .btn-lock { flex: 1; font-size: 13px; }
        }
    </style>
</head>
<body class="page-3">

    <div class="sticky-bar" id="block-identity">
        <span class="dyn-company">載入中...</span>　｜　<span class="dyn-team">載入中...</span>　｜　<span class="dyn-type">載入中...</span>　｜　<span class="dyn-name">載入中...</span>
    </div>

    <div class="sticky-bar" id="block-status-1" style="top: 45px;"><span id="rank-text">載入中...</span></div>
    <div class="sticky-bar" id="block-status-2" style="top: 90px;"><span id="status-tag">載入中...</span></div>
    <div class="sticky-bar" id="block-status-3" style="top: 135px;">
        <span style="color:#ff8a8a;">🏆 冒險積分：</span><span id="score-text">0分</span>
        <div class="progress-track"><div class="progress-fill" id="score-fill" style="width: 0%;"></div></div>
        　｜　<span style="color:#ff8a8a;">⚔️ 攻略進度：</span><span id="prog-val">0%</span>
        <div class="progress-track"><div class="progress-fill" id="prog-fill" style="width: 0%;"></div></div>
    </div>

    <nav class="nav-tabs" style="top: 180px;">
        <a href="index.html" class="tab-btn">📜 冒險指南</a>
        <a href="page2.html" class="tab-btn">🏹 鍛造秘笈</a>
        <a href="javascript:void(0)" onclick="location.reload();" class="tab-btn active">⚔️ 勇者試煉</a>
    </nav>

    <main class="tab-content active">

        <details id="detail-trial-1" open>
            <summary class="main-summary">【新手報到】啟程點</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 確認已詳閱入職規範<br>
                    　　- 確保完全理解冒險指南內容
                </span>
                
                <label class="check-item"><input type="checkbox" id="chk-guide"> 我已閱讀「📜 冒險指南」</label>
                <label class="check-item"><input type="checkbox" id="chk-forge"> 我已閱讀「🏹 鍛造秘笈」</label>
                <label class="check-item"><input type="checkbox" id="chk-risk"> 若被退件「👤 本人承擔」</label>
                
                <div class="action-center">
                    <button class="btn-confirm" id="btn-trial-1" onclick="checkTrial1(event)">🚀 提交本關任務</button>
                </div>
            </div>
        </details>


        <details id="detail-trial-2">
            <summary class="main-summary">【裝備盤點】行囊區</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 確認現有證照與銀行帳戶<br>
                    　　- 若無下列文件亦可直接確認
                </span>
                
                <label class="check-item"><input type="checkbox"> 台新國際商業銀行-實體存摺</label>
                <label class="check-item"><input type="checkbox"> 中餐證照</label>
                <label class="check-item"><input type="checkbox"> 西餐證照</label>
                <label class="check-item">其他：<span class="underline-text"></span></label>
                
                <div class="action-center">
                    <button class="btn-confirm" id="btn-trial-2" onclick="GameEngine.completeTrial(event, 2)">🚀 提交本關任務</button>
                </div>
            </div>
        </details>


        <details id="detail-trial-3">
            <summary class="main-summary">【裝備強化】鑑定所</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 上傳入職五大必備文件<br>
                    　　- 確實填寫並追蹤體檢進度
                </span>
                
                <label class="check-item"><input type="checkbox" class="chk-trial3"> 經認證醫療機構 -勞工體格檢查報告</label>
                <label class="check-item"><input type="checkbox" class="chk-trial3"> 經認證醫療機構 -食品從業人員體檢報告</label>
                <label class="check-item"><input type="checkbox" class="chk-trial3"> 兩吋照片一張</label>
                <label class="check-item"><input type="checkbox"> 前份工作健保轉出證明 -新鮮人免附</label>
                <label class="check-item"><input type="checkbox"> 前份工作離職證明 -新鮮人免附</label>

                <div class="tracking-box">
                    <span class="tracking-header">🕒 體檢進度追蹤</span>
                    <div class="date-row"><label>預計體檢日期：</label><input type="date" id="input-exam-date"><button class="btn-lock" id="btn-lock-exam" onclick="GameEngine.lockDate('exam')">確認</button></div>
                    <div class="date-row"><label>報告預計產出：</label><input type="date" id="input-result-date"><button class="btn-lock" id="btn-lock-result" onclick="GameEngine.lockDate('result')">確認</button></div>
                    <div class="date-row"><label>申請更改日期：</label><input type="date" id="input-change-date"><button class="btn-lock" id="btn-lock-change" onclick="GameEngine.requestChange()">確認</button></div>
                    <div class="lock-note">⚠️ 日期一經鎖定無法修改,若需調整請洽人資承辦.<br>⚠️ 無理由延期予以扣分,請再三確認後再動作.</div>
                </div>

                <div class="action-center"><button class="btn-confirm" id="btn-trial-3" onclick="checkTrial3(event)">🚀 提交本關任務</button></div>
            </div>
        </details>


        <details id="detail-trial-4">
            <summary class="main-summary">【戰役集結】前線營</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 確認物品與服裝規範<br>
                    　　- 當日未符規定會影響最終積極度總分
                </span>
                
                <div style="background: rgba(251,191,36,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #fbbf24;">
                    📅 報到時間：<span class="info-highlight" id="dyn-apt-time">等待公會發布...</span><br>
                    📍 報到地點：<span class="info-highlight" id="dyn-apt-loc">等待公會發布...</span>
                </div>

                <label class="check-item"><input type="checkbox" class="chk-trial4"> 確認當日服裝儀容規範</label>
                <label class="check-item"><input type="checkbox" class="chk-trial4"> 五大正本文件夾已備妥</label>
                <label class="check-item"><input type="checkbox" class="chk-trial4"> 確認報到時間與地點</label>

                <div class="action-center"><button class="btn-confirm" id="btn-trial-4" onclick="checkTrial4(event)">🚀 提交本關任務</button></div>
            </div>
        </details>


        <details id="detail-trial-5">
            <summary class="main-summary">【最終戰役】誓約日</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 勞工名卡填寫<br>
                    　　- 勞動契約查看並簽署
                </span>
                <a href="https://mys0819.github.io/LCS1/" target="_blank" class="external-link">🔗 開啟勞工名卡填寫表單</a>
                
                <div style="margin-top: 10px;">
                    <label class="check-item"><input type="checkbox" class="chk-trial5" id="chk-t5-1" onclick="GameEngine.toggleTrial5Score(event, 't5_score_1')"> 勞工名卡已填寫完成</label>
                    <label class="check-item"><input type="checkbox" class="chk-trial5" id="chk-t5-2" onclick="GameEngine.toggleTrial5Score(event, 't5_score_2')"> 勞動契約已填寫完成</label>
                </div>

                <div class="action-center"><button class="btn-confirm" id="btn-trial-5" onclick="checkTrial5(event)">🚀 提交本關任務</button></div>
            </div>
        </details>


        <details id="detail-trial-6">
            <summary class="main-summary">【榮耀加冕】聖殿區</summary>
            <div class="details-body">
                <span class="task-target">
                    📣 任務目標 <br>
                    　　- 待公會完成最後審核<br>
                    　　- 正式踏入榮耀殿堂
                </span>
                
                <label class="check-item"><input type="checkbox" class="bank-chk" id="chk-bank-have" onclick="checkBankLogic(this, 'have')"> 已有台新國際商業銀行戶頭</label>
                <label class="check-item"><input type="checkbox" class="bank-chk" id="chk-bank-process" onclick="checkBankLogic(this, 'process')"> 申辦中</label>
                <label class="check-item"><input type="checkbox" class="bank-chk" id="chk-bank-done" onclick="checkBankLogic(this, 'done')"> 辦理完成</label>
                
                <div class="tracking-box">
                    <div class="date-row"><label>預計辦理日期：</label><input type="date" id="input-bank-date"><button class="btn-lock" id="btn-lock-bank" onclick="GameEngine.lockDate('bank')">確認</button></div>
                    <div class="lock-note">⚠️ 日期一經鎖定無法修改,若需調整請洽人資承辦.</div>
                </div>

                <div class="action-center"><button class="btn-confirm" id="btn-trial-6" style="color:#fbbf24; border-color:#fbbf24;" onclick="checkTrial6(event)">👑 迎接最終榮耀</button></div>
            </div>
        </details>

    </main>

    <footer class="footer">
        <img src="assets/MYs_logo_去背.png" alt="MYs Logo" class="footer-logo">
        © Copyright 2026 MYs System-b1.0.0-03-02-2026-115
    </footer>

    <script>
        const fetchedData = { companyName: "MYs studio", team: "外場團隊", type: "兼職", userName: "測試員" };
        function applyData(data) {
            document.querySelectorAll('.dyn-company').forEach(el => el.innerText = data.companyName);
            document.querySelectorAll('.dyn-team').forEach(el => el.innerText = data.team);
            document.querySelectorAll('.dyn-type').forEach(el => el.innerText = data.type);
            document.querySelectorAll('.dyn-name').forEach(el => el.innerText = data.userName);
        }
        window.addEventListener('load', () => {
            applyData(fetchedData);
            if (typeof GameEngine !== 'undefined') { GameEngine.init(); }
        });
        
        function checkTrial1(e) { if (!document.getElementById('chk-guide').checked || !document.getElementById('chk-forge').checked || !document.getElementById('chk-risk').checked) { alert("⚠️ 勇主請注意\n必須勾選所有確認項目，才能推進！"); return; } GameEngine.completeTrial(e, 1); }
        function checkTrial3(e) { const chks = document.querySelectorAll('.chk-trial3'); let all = true; chks.forEach(c => { if(!c.checked) all = false; }); if (!all) { alert("⚠️ 勇主請注意\n必須勾選所有確認項目，才能推進！"); return; } GameEngine.completeTrial(e, 3); }
        function checkTrial4(e) { const chks = document.querySelectorAll('.chk-trial4'); let all = true; chks.forEach(c => { if(!c.checked) all = false; }); if (!all) { alert("⚠️ 勇主請注意\n必須勾選所有確認項目，才能推進！"); return; } GameEngine.completeTrial(e, 4); }
        function checkTrial5(e) { const chks = document.querySelectorAll('.chk-trial5'); let all = true; chks.forEach(c => { if(!c.checked) all = false; }); if (!all) { alert("⚠️ 勇主請注意\n必須勾選所有確認項目，才能推進！"); return; } GameEngine.completeTrial(e, 5); }

        /* 🌟 單選霸道防呆邏輯 */
        function checkBankLogic(clickedEl, statusType) {
            if (clickedEl.checked) {
                GameEngine.state.bankStatus = statusType;
            } else {
                GameEngine.state.bankStatus = null;
            }
            GameEngine.save();
            GameEngine.updateButtonStyles(); // 即刻刷新封印狀態
        }

        /* 🌟 第六關最終決斷邏輯 */
        function checkTrial6(e) { 
            const status = GameEngine.state.bankStatus;
            if (!status) { 
                alert("⚠️ 勇主請注意\n請勾選銀行戶頭狀態，才能推進！"); 
                return; 
            } 
            
            // 若為「申辦中」，僅記錄不封印關卡
            if (status === 'process') {
                const bDate = document.getElementById('input-bank-date').value;
                if (!bDate && !GameEngine.state.bankDateLocked) {
                    alert("⚠️ 勇主請注意\n請填寫並鎖定預計辦理日期！");
                    return;
                }
                alert("📝 已記錄進度，等待辦理完成");
                return; 
            }

            // 若為「已有」或「辦理完成」，進入大結局
            GameEngine.completeTrial(e, 6); 
        }
    </script>
</body>
</html>
