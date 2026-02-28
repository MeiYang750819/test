/* ================================================================
   【 ⚙️ GAME ENGINE - 獨立閃爍與精準時間軸版 】
   ================================================================ */
const GameEngine = {
    state: {
        score: 0,
        items: ['👕 粗製布衣'],
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        weaponType: null
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

    init() {
        const saved = localStorage.getItem('hero_progress');
        if (saved) { this.state = JSON.parse(saved); }
        this.updateUI(true); // 初始載入強制更新全部文字，不觸發閃爍
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    unlock(event, id, label, scoreGain, action = null) {
        if (this.state.achievements.includes(id)) {
            console.log(`[GameEngine] ${label} 已領取過，不再重覆跳轉。`);
            return;
        }

        // 紀錄舊狀態以比對差異
        const oldRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const oldScore = this.state.score;
        const oldItemsStr = this.state.items.join(' ');
        
        this.state.achievements.push(id);
        this.state.score += scoreGain;

        // 🌟 特效 1：滑鼠點擊處立刻飄出金色的 +1 或 +2
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

        // 處理裝備邏輯
        if (action === 'random_weapon') {
            const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
            const w = weapons[Math.floor(Math.random() * weapons.length)];
            this.state.weaponType = w;
            this.state.items.push(w);
            toastMsg = `✨ 拾獲裝備【${w}】，積分+${scoreGain}`;
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

        // 閃爍更新邏輯包裝成函式，方便統一延遲呼叫
        const executeFlashUpdates = () => {
            // 處理戰力晉升閃爍
            if (oldRank.title !== newRank.title) {
                const rankSpan = document.getElementById('dyn-rank');
                if (rankSpan) this.triggerFlashAndUpdate(rankSpan, newRank.title);
            }
            // 處理裝備變更閃爍
            if (oldItemsStr !== newItemsStr) {
                const itemSpan = document.getElementById('dyn-items');
                if (itemSpan) this.triggerFlashAndUpdate(itemSpan, newItemsStr);
            }
            // 處理積分變更閃爍 (進度條維持原本邏輯)
            if (oldScore !== newScore) {
                const scoreSpan = document.getElementById('score-text');
                if (scoreSpan) this.triggerFlashAndUpdate(scoreSpan, newScore + "分");
                
                // 進度條直接更新不閃爍
                const scoreFill = document.getElementById('score-fill');
                if (scoreFill) {
                    const displayScore = Math.min(newScore, 100);
                    scoreFill.style.width = displayScore + "%";
                    scoreFill.style.backgroundColor = "#fbbf24";
                }
            }
        };

        // 🌟 特效 2 & 3：精準時間軸判定
        if (scoreGain >= 2) {
            // 為了讓點擊飄數字能先渲染，稍微延遲 100 毫秒再跳出阻斷畫面的 alert
            setTimeout(() => { 
                alert(`🔔 發現隱藏關卡，冒險積分 +${scoreGain}`); 
                // 當玩家按下「確定」關閉視窗後，等待 1.5 秒執行上方閃爍
                setTimeout(() => {
                    executeFlashUpdates();
                }, 1500);
            }, 100);
        } else if (scoreGain === 1) {
            // 觸發右下角 4 秒通知
            this.showToast(toastMsg);
            // 等待通知的 4 秒 + 您要求的 1.5 秒 = 總共 5.5 秒後執行上方閃爍
            setTimeout(() => {
                executeFlashUpdates();
            }, 5500);
        }
    },

    // 負責觸發單一元素的閃爍與文字切換
    triggerFlashAndUpdate(element, newText) {
        element.classList.add('rank-flash'); // 加入閃爍 CSS
        // 在閃爍最高潮 (大約 0.75 秒時) 切換文字
        setTimeout(() => { element.innerText = newText; }, 750);
        // 動畫結束後移除 class，以便下次還能閃
        setTimeout(() => { element.classList.remove('rank-flash'); }, 1500);
    },

    // 初始化與強制更新時使用 (把整行拆開，只更新動態值)
    updateUI(isInit = false) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rankEl = document.getElementById('rank-text');
        const statusTagEl = document.getElementById('status-tag');
        const scoreEl = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');

        // 為了讓 JavaScript 能精準找到要閃爍的字，我們在 HTML 中包上 ID
        if (rankEl && isInit) {
            rankEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span id="dyn-rank" style="color:#FFFFFF;">${rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span id="dyn-loc" style="color:#FFFFFF;">${this.state.location}</span>`;
        }
        if (statusTagEl && isInit) {
            statusTagEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span id="dyn-items" style="color:#FFFFFF;">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span id="dyn-status" style="color:#FFFFFF;">${this.state.status}</span>`;
        }
        if (scoreEl && isInit) scoreEl.innerText = this.state.score + "分";
        if (scoreFill && isInit) {
            const displayScore = Math.min(this.state.score, 100);
            scoreFill.style.width = displayScore + "%";
            scoreFill.style.backgroundColor = "#fbbf24";
        }
    },

    showToast(msg) {
        const oldToast = document.querySelector('.game-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.style.cssText = "position:fixed; bottom:80px; right:20px; background:rgba(0,0,0,0.9); color:#ffd700; padding:12px 20px; border-radius:8px; border:1px solid #ffd700; transform:translateX(150%); transition:0.5s; z-index:10000; font-weight:bold; box-shadow:0 0 10px rgba(0,0,0,0.5);";
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
