/* ================================================================
   【 ⚙️ GAME ENGINE  】
   ================================================================ */
const GameEngine = {
    state: {
        score: 0,
        items: ['👕 粗製布衣'], // 更新為新版預設防具
        location: '⛺ 新手村',
        status: '📦 檢整裝備中',
        achievements: [],
        weaponType: null // 記憶玩家抽到的武器種類
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
        this.updateUI();
    },

    save() { localStorage.setItem('hero_progress', JSON.stringify(this.state)); },

    unlock(id, label, scoreGain, action = null) {
        // 檢查是否重複解鎖
        if (this.state.achievements.includes(id)) {
            console.log(`[GameEngine] ${label} 已領取過，不再重覆跳轉。`);
            return;
        }

        // 紀錄加分前的戰力，用來比對是否有晉升
        const oldRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        
        this.state.achievements.push(id);
        this.state.score += scoreGain;

        let toastMsg = "";

        // 動作判定：隨機抽武器 或 升級衣服
        if (action === 'random_weapon') {
            const weapons = ['🗡️ 精鋼短劍', '🏹 獵人短弓', '🔱 鐵尖長槍'];
            const w = weapons[Math.floor(Math.random() * weapons.length)];
            this.state.weaponType = w; // 記憶到存檔中
            this.state.items.push(w);
            toastMsg = `✨ 拾獲裝備【${w}】，積分+${scoreGain}`;
        } else if (action === 'upgrade_armor') {
            this.state.items = this.state.items.map(i => i === '👕 粗製布衣' ? '🧥 強化布衫' : i);
            toastMsg = `✨ 深入探索，裝備升級，冒險積分+${scoreGain}`;
        } else {
            toastMsg = `✨ 深入探索，裝備升級，冒險積分+${scoreGain}`;
        }
        
        this.save();
        this.updateUI();

        // 取得加分後的新戰力
        const newRank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];

        // 彈窗與滑入通知邏輯
        if (scoreGain >= 2) {
            setTimeout(() => { alert(`🔔 發現隱藏關卡，冒險積分 +${scoreGain}`); }, 100);
            // 如果觸發大摺疊剛好晉升，0.5秒後滑出晉升通知
            if (oldRank.title !== newRank.title) {
                setTimeout(() => { this.showToast(`✨ 戰力晉升：【${newRank.title}】`); }, 500);
            }
        } else if (scoreGain === 1) {
            this.showToast(toastMsg);
            // 如果觸發小摺疊剛好晉升，等原本的通知 4 秒消失後，緊接著滑出晉升通知
            if (oldRank.title !== newRank.title) {
                setTimeout(() => { this.showToast(`✨ 戰力晉升：【${newRank.title}】`); }, 4500);
            }
        }
    },

    updateUI() {
        const rank = this.ranks.find(r => this.state.score >= r.min) || this.ranks[this.ranks.length - 1];
        const rankEl = document.getElementById('rank-text');
        const statusTagEl = document.getElementById('status-tag');
        const scoreEl = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');

        if (rankEl) {
            rankEl.innerHTML = `<span style="color:#fbbf24;">戰力：</span><span style="color:#FFFFFF;">${rank.title}</span>　｜　<span style="color:#fbbf24;">關卡：</span><span style="color:#FFFFFF;">${this.state.location}</span>`;
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

    showToast(msg) {
        // 移除舊的通知
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
        }, 4000); // 改為 4 秒消失
    }
};
window.addEventListener('load', () => GameEngine.init());
