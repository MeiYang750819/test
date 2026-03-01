/* ================================================================
   【 ⚙️ GAME ENGINE - 六大試煉與自動修復版 】
   ================================================================ */
const GameEngine = {
    state: {
        score: 0,
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        weaponType: null,
        currentTrial: 0 // 記錄目前通關到第幾試煉 (0~6)
    },

    ranks: [
        { min: 101, title: "💎 SS級 神話級玩家" },
        { min: 96,  title: "🌟 S級 傳說級玩家" },
        { min: 80,  title: "🟢 A級 菁英玩家" },
        { min: 60,  title: "🥇 B級 穩健玩家" },
        { min: 40,  title: "🥈 C級 潛力玩家" },
        { min: 1,   title: "🥉 實習小萌新" },
        { min: 0,   title: "🥚 報到新手村" }
    ],

    // 六大試煉的資料庫 (進度、關卡、衣服升級、武器升級對照表)
    trialsData: {
        1: { prog: 10,  loc: '🏰 登錄公會', armor: '🥋 實習皮甲', wUpgrade: null },
        2: { prog: 25,  loc: '📁 裝備盤點', armor: '🦺 輕型鎖甲', wUpgrade: null }, // 第二區還不升武器
        3: { prog: 40,  loc: '🛡️ 裝備鑑定所', armor: '🛡️ 鋼鐵重甲', wUpgrade: { '🗡️ 精鋼短劍':'⚔️ 騎士長劍', '🏹 獵人短弓':'🏹 精靈長弓', '🔱 鐵尖長槍':'🔱 鋼鐵戰矛'} },
        4: { prog: 60,  loc: '🎒 出征準備營', armor: '💠 秘銀胸甲', wUpgrade: { '⚔️ 騎士長劍':'⚔️ 破甲重劍', '🏹 精靈長弓':'🏹 迅雷連弓', '🔱 鋼鐵戰矛':'🔱 破陣重矛'} },
        5: { prog: 80,  loc: '💼 契約祭壇',   armor: '🛡️ 聖光戰鎧', wUpgrade: { '⚔️ 破甲重劍':'🗡️ 聖光戰劍', '🏹 迅雷連弓':'🏹 追風神弓', '🔱 破陣重矛':'🔱 龍膽銀槍'} },
        6: { prog: 100, loc: '👑 榮耀殿堂',   armor: '🌟 永恆守護鎧', wUpgrade: { '🗡️ 聖光戰劍':'👑 王者之聖劍', '🏹 追風神弓':'☄️ 破曉流星弓', '🔱 龍膽銀槍':'🐉 滅世龍吟槍'} }
    },

    init() {
        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { 
                const parsed = JSON.parse(saved);
                // 防呆修復：完美合併舊存檔與新預設值，避免缺少 currentTrial 欄位導致當機
                this.state = Object.assign({}, this.state, parsed);
                if (!Array.isArray(this.state.achievements)) {
                    this.state.achievements = [];
                }
            }
        } catch (e) {
            console.warn("[GameEngine] 讀取存檔失敗，已重置", e);
            localStorage.removeItem('hero_progress');
        }
        
        // 延遲一點點確保 HTML 渲染完畢再更新文字，避免 "載入中..." 卡住
        setTimeout(() => { this.updateUI(true); }, 50);
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    // 開發測試專用：清除記憶
    reset() {
        localStorage.removeItem('hero_progress');
        alert("♻️ 冒險記憶已清除！點擊確定後將重新載入。");
        location.reload();
    },

    unlock(event, id, label, scoreGain, action = null) {
        // 如果這個成就 id 已經在陣列裡，代表領過獎勵了，直接退出不觸發！
        if (this.state.achievements.includes(id)) { 
            console.log(`[GameEngine] ${label} 已經觸發過囉！`);
            return; 
        }

        const oldRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const oldScore = this.state.score;
        const oldItemsStr = this.state.items.join(' ');
        
        this.state.achievements.push(id);
        this.state.score += scoreGain;

        if (event && event.clientX) {
            const floater = document.createElement('div');
            floater.className = 'floating-score';
            floater.innerText = `+${scoreGain}`;
            floater.style.left = `${event.clientX}px`;
            floater.style.top = `${event.clientY - 20}px`; 
            document.body.appendChild(floater);
            setTimeout(() => floater.remove(), 2000); 
        }

        let toastMsg = "";

        if (action === 'random_weapon') {
            const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
            const w = weapons[Math.floor(Math.random() * weapons.length)];
            this.state.weaponType = w;
            this.state.items.push(w);
            toastMsg = `✨ 拾獲裝備【${w}】，冒險積分+${scoreGain}`;
        } else if (action === 'upgrade_armor') {
            this.state.items = this.state.items.map(i => i === '👕 粗製布衣' ? '🧥 強化布衫' : i);
            toastMsg = `✨ 深入探索，裝備升級，冒險積分+${scoreGain}`;
        } else {
            toastMsg = `✨ 深入探索，裝備升級，冒險積分+${scoreGain}`;
        }
        
        this.save();
        
        const newRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const newScore = this.state.score;
        const newItemsStr = this.state.items.join(' ');

        const executeFlashUpdates = () => {
            if (oldRank.title !== newRank.title) {
                const rankSpan = document.getElementById('dyn-rank');
                if (rankSpan) this.triggerFlashAndUpdate(rankSpan, newRank.title);
            }
            if (oldItemsStr !== newItemsStr) {
                const itemSpan = document.getElementById('dyn-items');
                if (itemSpan) this.triggerFlashAndUpdate(itemSpan, newItemsStr);
            }
            if (oldScore !== newScore) {
                const scoreSpan = document.getElementById('score-text');
                if (scoreSpan) this.triggerFlashAndUpdate(scoreSpan, newScore + "分");
                
                const scoreFill = document.getElementById('score-fill');
                if (scoreFill) {
                    scoreFill.style.width = Math.min(newScore, 100) + "%";
                    scoreFill.style.backgroundColor = "#fbbf24";
                }
            }
        };

        if (scoreGain >= 2) {
            setTimeout(() => { 
                alert(`🔔 發現隱藏關卡，冒險積分 +${scoreGain}`); 
                setTimeout(() => { executeFlashUpdates(); }, 1000);
            }, 100);
        } else if (scoreGain === 1) {
            this.showToast(toastMsg);
            setTimeout(() => { executeFlashUpdates(); }, 5000);
        }
    },

    // ⚔️ 試煉通關指令
    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) {
            alert("⚠️ 此階段任務已經完成了，請繼續前進！");
            return;
        }

        // 防呆：必須照順序解鎖
        if (trialNum > 1 && this.state.currentTrial < trialNum - 1) {
            alert("⚠️ 請先完成前一個階段的任務！");
            return;
        }

        const tData = this.trialsData[trialNum];
        if (!tData) return;

        const oldLoc = this.state.location;
        const oldItemsStr = this.state.items.join(' ');
        
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        
        // 更新防具清單 (加入了第5階的 🛡️ 聖光戰鎧)
        const armorList = ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'];
        this.state.items = this.state.items.map(item => armorList.includes(item) ? tData.armor : item);

        // 更新武器 (第三階段才開始觸發)
        if (tData.wUpgrade && this.state.weaponType) {
            const upgradedWeapon = tData.wUpgrade[this.state.weaponType];
            if (upgradedWeapon) {
                this.state.items = this.state.items.map(item => item === this.state.weaponType ? upgradedWeapon : item);
                this.state.weaponType = upgradedWeapon; 
            }
        }

        this.save();
        const newItemsStr = this.state.items.join(' ');

        if (event && event.clientX) {
            const floater = document.createElement('div');
            floater.className = 'floating-score';
            floater.style.color = '#10b981'; 
            floater.innerText = `✓ 任務完成！`;
            floater.style.left = `${event.clientX - 20}px`;
            floater.style.top = `${event.clientY - 20}px`; 
            document.body.appendChild(floater);
            setTimeout(() => floater.remove(), 2000); 
        }

        this.showToast(`✨ 恭喜完成任務，階段推進，裝備進化！`);

        setTimeout(() => {
            const locSpan = document.getElementById('dyn-loc');
            if (locSpan) this.triggerFlashAndUpdate(locSpan, this.state.location);

            const itemSpan = document.getElementById('dyn-items');
            if (itemSpan && oldItemsStr !== newItemsStr) {
                this.triggerFlashAndUpdate(itemSpan, newItemsStr);
            }

            const progVal = document.getElementById('prog-val');
            const progFill = document.getElementById('prog-fill');
            if (progVal) this.triggerFlashAndUpdate(progVal, tData.prog + "%");
            if (progFill) {
                progFill.style.width = tData.prog + "%";
                const hue = (tData.prog / 100) * 120;
                progFill.style.backgroundColor = `hsl(${hue}, 80%, 55%)`;
                progFill.classList.add('bar-flash'); 
                setTimeout(() => progFill.classList.remove('bar-flash'), 1500);
            }
        }, 5000); 
    },

    triggerFlashAndUpdate(element, newText) {
        element.classList.add('rank-flash'); 
        setTimeout(() => { element.innerText = newText; }, 750);
        setTimeout(() => { element.classList.remove('rank-flash'); }, 1500);
    },

    updateUI(isInit = false) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rankEl = document.getElementById('rank-text');
        const statusTagEl = document.getElementById('status-tag');
        const scoreEl = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');
        const progVal = document.getElementById('prog-val');
        const progFill = document.getElementById('prog-fill');

        if (rankEl && isInit) {
            rankEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="dyn-rank" style="color:#FFFFFF;">${rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="dyn-loc" style="color:#FFFFFF;">${this.state.location}</span>`;
        }
        if (statusTagEl && isInit) {
            statusTagEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="dyn-items" style="color:#FFFFFF;">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status" style="color:#FFFFFF;">${this.state.status}</span>`;
        }
        if (scoreEl && isInit) scoreEl.innerText = this.state.score + "分";
        if (scoreFill && isInit) {
            scoreFill.style.width = Math.min(this.state.score, 100) + "%";
            scoreFill.style.backgroundColor = "#fbbf24";
        }
        
        if (isInit) {
            const currentProg = this.state.currentTrial > 0 ? this.trialsData[this.state.currentTrial].prog : 0;
            if (progVal) progVal.innerText = currentProg + "%";
            if (progFill) {
                progFill.style.width = currentProg + "%";
                const hue = (currentProg / 100) * 120;
                progFill.style.backgroundColor = `hsl(${hue}, 80%, 55%)`;
            }
        }
    },

    showToast(msg) {
        const oldToast = document.querySelector('.game-toast');
        if (oldToast) oldToast.remove();
        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.style.cssText = "position:fixed; bottom:80px; right:20px; background:rgba(0,0,0,0.9); color:#10b981; padding:12px 20px; border-radius:8px; border:1px solid #10b981; transform:translateX(150%); transition:0.5s; z-index:10000; font-weight:bold; box-shadow:0 0 10px rgba(0,0,0,0.5);";
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.style.transform = 'translateX(0)', 50);
        setTimeout(() => {
            toast.style.transform = 'translateX(150%)';
            setTimeout(() => toast.remove(), 500);
        }, 4000); 
    }
};
window.addEventListener('load', () => GameEngine.init());
