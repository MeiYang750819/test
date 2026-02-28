/* ================================================================
   【 ⚙️ GAME ENGINE  】
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
        this.updateUI(true); // 初始載入強制更新全部文字
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    // 加入 event 參數來抓取滑鼠座標
    unlock(event, id, label, scoreGain, action = null) {
        if (this.state.achievements.includes(id)) {
            console.log(`[GameEngine] ${label} 已領取過，不再重覆跳轉。`);
            return;
        }

        const oldRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        
        this.state.achievements.push(id);
        this.state.score += scoreGain;

        // 🌟 特效 1：滑鼠點擊處飄出金色的 +1 或 +2 (維持2秒)
        if (event && event.clientX) {
            const floater = document.createElement('div');
            floater.className = 'floating-score';
            floater.innerText = `+${scoreGain}`;
            floater.style.left = `${event.clientX}px`;
            floater.style.top = `${event.clientY - 20}px`; // 稍微偏上出現
            document.body.appendChild(floater);
            setTimeout(() => floater.remove(), 2000); // 2秒後移除DOM
        }

        let toastMsg = "";
        let hasToast = false;

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
        
        // 為了特效，我們先不馬上更新頂部戰力文字，先更新底下的進度與道具即可
        this.updateUI(false); 

        const newRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const isRankUp = oldRank.title !== newRank.title;

        // 判定通知與延遲時間
        if (scoreGain >= 2) {
            setTimeout(() => { alert(`🔔 發現隱藏關卡，冒險積分 +${scoreGain}`); }, 100);
            hasToast = false; // 大摺疊不觸發右下角滑入通知
        } else if (scoreGain === 1) {
            this.showToast(toastMsg);
            hasToast = true;
        }

        // 🌟 特效 2 & 3：判斷是否有晉升，並計算閃爍延遲
        if (isRankUp) {
            // 如果有 Toast 就等 4 秒消失後再閃；如果沒有 Toast 就等 1 秒後閃
            const delayTime = hasToast ? 4000 : 1000;
            
            setTimeout(() => {
                const rankEl = document.getElementById('rank-text');
                if (rankEl) {
                    rankEl.classList.add('rank-flash'); // 加入閃爍動畫
                    
                    // 在閃爍最高潮 (大約 0.75 秒時) 切換文字
                    setTimeout(() => {
                        this.updateRankText(newRank);
                    }, 750);

                    // 動畫結束後移除 class，以便下次還能閃
                    setTimeout(() => {
                        rankEl.classList.remove('rank-flash');
                    }, 1500);
                }
            }, delayTime);
        } else {
            // 如果沒升級，直接默默把字體換掉即可 (萬一分數變了但稱號沒變)
            this.updateRankText(newRank);
        }
    },

    updateUI(forceUpdateRankText = false) {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const statusTagEl = document.getElementById('status-tag');
        const scoreEl = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');

        if (forceUpdateRankText) {
            this.updateRankText(rank);
        }

        if (statusTagEl) {
            statusTagEl.innerHTML = `<span style="color:#8ab4f8;">道具：</span><span style="color:#FFFFFF;">${this.state.items.join(' ')}</span>　｜　<span style="color:#8ab4f8;">狀態：</span><span style="color:#FFFFFF;">${this.state.status}</span>`;
        }
        if (scoreEl) scoreEl.innerText = this.state.score + "分";
        if (scoreFill) {
            const displayScore = Math.min(this.state.score, 100);
            scoreFill.style.width = displayScore + "%";
            scoreFill.style.backgroundColor = "#fbbf24";
        }
    },

    updateRankText(rankObj) {
        const rankEl = document.getElementById('rank-text');
        if (rankEl) {
            rankEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span style="color:#FFFFFF;">${rankObj.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span style="color:#FFFFFF;">${this.state.location}</span>`;
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
