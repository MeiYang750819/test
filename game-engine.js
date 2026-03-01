/* ================================================================
   【 ⚙️ GAME ENGINE - 九階雷達與動態進度版 】
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
        { min: 30,  title: "🥉 D級 基礎學徒" },
        { min: 20,  title: "💀 E級 迷途村民" },
        { min: 2,   title: "🌱 實習小萌新" },
        { min: 0,   title: "🥚 報到新手村" }
    ],

    // 六大試煉的資料庫 (baseProg 為主線基礎進度，最高 90%)
    trialsData: {
        1: { baseProg: 10, loc: '🏰 登錄公會', armor: '🥋 實習皮甲', wUpgrade: null, scoreGain: 5 },
        2: { baseProg: 25, loc: '📁 裝備盤點', armor: '🦺 輕型鎖甲', wUpgrade: null, scoreGain: 5 },
        3: { baseProg: 40, loc: '🛡️ 裝備鑑定所', armor: '🛡️ 鋼鐵重甲', wUpgrade: { '🗡️ 精鋼短劍':'⚔️ 騎士長劍', '🏹 獵人短弓':'🏹 精靈長弓', '🔱 鐵尖長槍':'🔱 鋼鐵戰矛'}, scoreGain: 10 },
        4: { baseProg: 60, loc: '🎒 出征準備營', armor: '💠 秘銀胸甲', wUpgrade: { '⚔️ 騎士長劍':'⚔️ 破甲重劍', '🏹 精靈長弓':'🏹 迅雷連弓', '🔱 鋼鐵戰矛':'🔱 破陣重矛'}, scoreGain: 10 },
        5: { baseProg: 80, loc: '💼 契約祭壇',   armor: '🛡️ 聖光戰鎧', wUpgrade: { '⚔️ 破甲重劍':'🗡️ 聖光戰劍', '🏹 迅雷連弓':'🏹 追風神弓', '🔱 破陣重矛':'🔱 龍膽銀槍'}, scoreGain: 10 },
        6: { baseProg: 90, loc: '👑 榮耀殿堂',   armor: '🌟 永恆守護鎧', wUpgrade: { '🗡️ 聖光戰劍':'👑 王者之聖劍', '🏹 追風神弓':'☄️ 破曉流星弓', '🔱 龍膽銀槍':'🐉 滅世龍吟槍'}, scoreGain: 10 }
    },

    init() {
        try {
            const saved = localStorage.getItem('hero_progress');
            if (saved) { 
                const parsed = JSON.parse(saved);
                this.state = Object.assign({}, this.state, parsed);
                if (!Array.isArray(this.state.achievements)) {
                    this.state.achievements = [];
                }
            }
        } catch (e) {
            console.warn("[GameEngine] 讀取存檔失敗，已重置", e);
            localStorage.removeItem('hero_progress');
        }
        
        setTimeout(() => { this.updateUI(true); }, 50);
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    reset() {
        localStorage.removeItem('hero_progress');
        alert("♻️ 冒險記憶已清除！點擊確定後將重新載入。");
        location.reload();
    },

    unlock(event, id, label, scoreGain, action = null) {
        if (this.state.achievements.includes(id)) { return; }

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
            
            // 隱藏成就觸發後，也要更新進度條
            this.updateUI(true);
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

    completeTrial(event, trialNum) {
        if (this.state.currentTrial >= trialNum) {
            alert("⚠️ 此階段任務已完成，請繼續前進！");
            return;
        }

        if (trialNum > 1 && this.state.currentTrial < trialNum - 1) {
            alert("⚠️ 勿著急，請先完成前一個階段任務！");
            return;
        }

        const tData = this.trialsData[trialNum];
        if (!tData) return;

        const oldLoc = this.state.location;
        const oldItemsStr = this.state.items.join(' ');
        const oldScore = this.state.score;
        const oldRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        
        this.state.currentTrial = trialNum;
        this.state.location = tData.loc;
        this.state.score += tData.scoreGain; // 正式加入闖關得分
        
        const armorList = ['👕 粗製布衣', '🧥 強化布衫', '🥋 實習皮甲', '🦺 輕型鎖甲', '🛡️ 鋼鐵重甲', '💠 秘銀胸甲', '🛡️ 聖光戰鎧', '🌟 永恆守護鎧'];
        this.state.items = this.state.items.map(item => armorList.includes(item) ? tData.armor : item);

        if (tData.wUpgrade && this.state.weaponType) {
            const upgradedWeapon = tData.wUpgrade[this.state.weaponType];
            if (upgradedWeapon) {
                this.state.items = this.state.items.map(item => item === this.state.weaponType ? upgradedWeapon : item);
                this.state.weaponType = upgradedWeapon; 
            }
        }

        this.save();
        const newItemsStr = this.state.items.join(' ');
        const newScore = this.state.score;
        const newRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];

        // 計算動態進度：主線進度 + (隱藏成就數量 * 5%)，最高鎖定 100%
        const hiddenBonus = Math.min(10, this.state.achievements.length * 5);
        const newProg = Math.min(100, tData.baseProg + hiddenBonus);

        if (event && event.clientX) {
            const floater = document.createElement('div');
            floater.className = 'floating-score';
            floater.style.color = '#10b981'; 
            floater.innerText = `✓ 任務完成！ +${tData.scoreGain}分`;
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

            if (oldScore !== newScore) {
                const scoreSpan = document.getElementById('score-text');
                if (scoreSpan) this.triggerFlashAndUpdate(scoreSpan, newScore + "分");
                const scoreFill = document.getElementById('score-fill');
                if (scoreFill) {
                    scoreFill.style.width = Math.min(newScore, 100) + "%";
                    scoreFill.style.backgroundColor = "#fbbf24";
                }
            }

            if (oldRank.title !== newRank.title) {
                const rankSpan = document.getElementById('dyn-rank');
                if (rankSpan) this.triggerFlashAndUpdate(rankSpan, newRank.title);
            }

            const progVal = document.getElementById('prog-val');
            const progFill = document.getElementById('prog-fill');
            if (progVal) this.triggerFlashAndUpdate(progVal, newProg + "%");
            if (progFill) {
                progFill.style.width = newProg + "%";
                const hue = (newProg / 100) * 120;
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
            const hiddenBonus = Math.min(10, this.state.achievements.length * 5);
            const baseProg = this.state.currentTrial > 0 ? this.trialsData[this.state.currentTrial].baseProg : 0;
            const currentProg = Math.min(100, baseProg + hiddenBonus);
            
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
