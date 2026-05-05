// ============ СОСТОЯНИЕ ИГРЫ ============
const game = {
    resources: { stone: 0, iron: 0, gold: 0, diamond: 0, oil: 0, coins: 100 },
    miners: { count: 1, cost: 50, power: 1 },
    pickaxe: { level: 1, name: 'Деревянная', power: 1, cost: 100 },
    oilRigs: { count: 0, cost: 200, power: 1 },
    barrels: { count: 0, cost: 100, capacity: 50 },
    oilStored: 0,
    level: 1, xp: 0, xpToLevel: 100,
    inventory: [],
    achievements: [
        { id: 'first_click', name: 'Первая руда', desc: 'Добыть 10 камня', icon: '🪨', done: false, check: () => game.resources.stone >= 10 },
        { id: 'miner_5', name: 'Бригадир', desc: 'Нанять 5 шахтёров', icon: '👷', done: false, check: () => game.miners.count >= 5 },
        { id: 'iron_100', name: 'Железный человек', desc: 'Добыть 100 железа', icon: '🔩', done: false, check: () => game.resources.iron >= 100 },
        { id: 'gold_50', name: 'Золотая лихорадка', desc: 'Добыть 50 золота', icon: '🥇', done: false, check: () => game.resources.gold >= 50 },
        { id: 'diamond_10', name: 'Алмазный король', desc: 'Добыть 10 алмазов', icon: '💎', done: false, check: () => game.resources.diamond >= 10 },
        { id: 'oil_100', name: 'Нефтяной магнат', desc: 'Добыть 100 нефти', icon: '🛢', done: false, check: () => game.resources.oil >= 100 },
        { id: 'coins_1000', name: 'Богач', desc: 'Накопить 1000 монет', icon: '🪙', done: false, check: () => game.resources.coins >= 1000 },
        { id: 'level_10', name: 'Шахтёр 10 уровня', desc: 'Достичь 10 уровня', icon: '⭐', done: false, check: () => game.level >= 10 },
    ]
};

// Типы руды (меняются каждые N кликов)
const oreTypes = [
    { name: 'Камень', icon: '🪨', key: 'stone', threshold: 0, color: '#888' },
    { name: 'Железо', icon: '🔩', key: 'iron', threshold: 50, color: '#bdc3c7' },
    { name: 'Золото', icon: '🥇', key: 'gold', threshold: 200, color: '#f1c40f' },
    { name: 'Алмаз', icon: '💎', key: 'diamond', threshold: 500, color: '#3498db' },
];

let clickCount = 0;
let currentOre = oreTypes[0];
let autoSaveInterval;

// ============ ЗАГРУЗКА ============
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        updateAll();
    }, 2000);

    // Кнопка копать
    document.getElementById('mine-btn').addEventListener('click', mine);
    
    // Кнопка продать всё
    document.getElementById('sell-all-btn').addEventListener('click', sellAll);
    
    // Собрать нефть
    document.getElementById('collect-oil-btn').addEventListener('click', collectOil);

    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Табы магазина
    document.querySelectorAll('.stab').forEach(btn => {
        btn.addEventListener('click', () => switchShopTab(btn.dataset.tab));
    });

    // Анимация клика по шахтёру
    document.getElementById('miner-icon').addEventListener('click', mine);

    // Модалка кейса
    document.getElementById('case-close-btn').addEventListener('click', () => {
        document.getElementById('case-modal').classList.add('hidden');
    });

    // Авто-добыча
    setInterval(autoMine, 1000);
    
    // Автосохранение
    autoSaveInterval = setInterval(saveGame, 10000);
});

// ============ МЕХАНИКИ ============
function mine() {
    const power = game.pickaxe.power + game.miners.power;
    const ore = getCurrentOre();
    
    game.resources[ore.key] += power;
    clickCount += power;
    game.xp += power;
    
    // Анимация
    const pop = document.getElementById('ore-pop');
    pop.textContent = ore.icon;
    pop.classList.add('show');
    setTimeout(() => pop.classList.remove('show'), 300);
    
    // Анимация шахтёра
    const miner = document.getElementById('miner-icon');
    miner.style.animation = 'none';
    miner.offsetHeight;
    miner.style.animation = 'minerHit 0.2s';
    setTimeout(() => { miner.style.animation = 'minerBounce 0.6s infinite alternate'; }, 200);
    
    // Смена руды
    updateCurrentOre();
    checkLevelUp();
    checkAchievements();
    updateAll();
}

function getCurrentOre() {
    for (let i = oreTypes.length - 1; i >= 0; i--) {
        if (clickCount >= oreTypes[i].threshold && Math.random() < 0.3 + i * 0.2) {
            return oreTypes[i];
        }
    }
    return oreTypes[0];
}

function updateCurrentOre() {
    for (let i = oreTypes.length - 1; i >= 0; i--) {
        if (clickCount >= oreTypes[i].threshold) {
            currentOre = oreTypes[i];
            document.getElementById('current-ore-text').textContent = currentOre.icon + ' ' + currentOre.name;
            document.getElementById('ore-progress').style.background = 
                `linear-gradient(90deg, ${currentOre.color}, #e74c3c)`;
            return;
        }
    }
}

function autoMine() {
    if (game.miners.count > 0) {
        const autoPower = game.miners.count * game.pickaxe.power;
        const ore = getCurrentOre();
        game.resources[ore.key] += autoPower;
        clickCount += autoPower;
        game.xp += autoPower;
        
        // Авто-нефть
        if (game.oilRigs.count > 0) {
            const oilProduced = game.oilRigs.count * game.oilRigs.power;
            game.oilStored = Math.min(game.oilStored + oilProduced, game.barrels.count * game.barrels.capacity + 50);
            game.resources.oil += oilProduced;
        }
        
        updateCurrentOre();
        checkLevelUp();
        updateAll();
    }
}

function collectOil() {
    const collected = game.oilStored;
    game.resources.oil += collected;
    game.oilStored = 0;
    updateAll();
}

function sellAll() {
    const prices = { stone: 1, iron: 5, gold: 25, diamond: 100, oil: 15 };
    let total = 0;
    
    for (const [res, price] of Object.entries(prices)) {
        total += game.resources[res] * price;
        game.resources[res] = 0;
    }
    
    game.resources.coins += total;
    game.xp += Math.floor(total / 10);
    checkLevelUp();
    updateAll();
}

// ============ МАГАЗИН ============
function switchShopTab(tab) {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.stab[data-tab="${tab}"]`).classList.add('active');
    renderShop(tab);
}

function renderShop(tab) {
    const container = document.getElementById('shop-content');
    
    if (tab === 'miners') {
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">👷</div>
                <h4>Нанять шахтёра</h4>
                <div class="card-desc">+1 к авто-добыче</div>
                <div class="card-price">🪙 ${game.miners.cost}</div>
                <button onclick="buyMiner()" ${game.resources.coins < game.miners.cost ? 'disabled' : ''}>Нанять</button>
            </div>
        `;
    } else if (tab === 'pickaxes') {
        const nextPick = game.pickaxe.level + 1;
        const pickNames = ['', 'Деревянная', 'Каменная', 'Железная', 'Золотая', 'Алмазная', 'Нефритовая', 'Мифриловая', 'Адамантитовая', 'Божественная'];
        const pickCost = game.pickaxe.cost;
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">🧰</div>
                <h4>${pickNames[nextPick] || 'Макс.'} кирка</h4>
                <div class="card-desc">Текущая: ${game.pickaxe.name} (x${game.pickaxe.power})</div>
                <div class="card-price">🪙 ${pickCost}</div>
                <button onclick="upgradePickaxe()" ${game.resources.coins < pickCost ? 'disabled' : ''}>Улучшить</button>
            </div>
        `;
    } else if (tab === 'oilrigs') {
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">🏭</div>
                <h4>Нефтяная вышка</h4>
                <div class="card-desc">Добывает нефть автоматически</div>
                <div class="card-price">🪙 ${game.oilRigs.cost}</div>
                <button onclick="buyOilRig()" ${game.resources.coins < game.oilRigs.cost ? 'disabled' : ''}>Купить</button>
            </div>
        `;
    } else if (tab === 'barrels') {
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">🛢</div>
                <h4>Бочка для нефти</h4>
                <div class="card-desc">Вместимость: +${game.barrels.capacity} ед.</div>
                <div class="card-price">🪙 ${game.barrels.cost}</div>
                <button onclick="buyBarrel()" ${game.resources.coins < game.barrels.cost ? 'disabled' : ''}>Купить</button>
            </div>
        `;
    } else if (tab === 'cases') {
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">📦</div>
                <h4>Кейс шахтёра</h4>
                <div class="card-desc">Случайная руда, монеты или редкий предмет!</div>
                <div class="card-price">🪙 150</div>
                <button onclick="openCase()" ${game.resources.coins < 150 ? 'disabled' : ''}>Открыть</button>
            </div>
            <div class="shop-card">
                <div class="card-icon">🎁</div>
                <h4>Премиум-кейс</h4>
                <div class="card-desc">Повышенный шанс алмазов и редких предметов</div>
                <div class="card-price">🪙 500</div>
                <button onclick="openPremiumCase()" ${game.resources.coins < 500 ? 'disabled' : ''}>Открыть</button>
            </div>
        `;
    } else if (tab === 'boosts') {
        container.innerHTML = `
            <div class="shop-card">
                <div class="card-icon">⚡</div>
                <h4>Ускорение x2</h4>
                <div class="card-desc">Двойная добыча на 30 секунд</div>
                <div class="card-price">🪙 200</div>
                <button onclick="buyBoost()" ${game.resources.coins < 200 ? 'disabled' : ''}>Активировать</button>
            </div>
        `;
    }
}

function buyMiner() {
    if (game.resources.coins >= game.miners.cost) {
        game.resources.coins -= game.miners.cost;
        game.miners.count++;
        game.miners.power++;
        game.miners.cost = Math.floor(game.miners.cost * 1.5);
        updateAll();
        renderShop('miners');
    }
}

function upgradePickaxe() {
    if (game.resources.coins >= game.pickaxe.cost) {
        game.resources.coins -= game.pickaxe.cost;
        game.pickaxe.level++;
        game.pickaxe.power = game.pickaxe.level * 2;
        const pickNames = ['', 'Деревянная', 'Каменная', 'Железная', 'Золотая', 'Алмазная', 'Нефритовая', 'Мифриловая', 'Адамантитовая', 'Божественная'];
        game.pickaxe.name = pickNames[game.pickaxe.level] || 'Максимальная';
        game.pickaxe.cost = Math.floor(game.pickaxe.cost * 2.2);
        updateAll();
        renderShop('pickaxes');
    }
}

function buyOilRig() {
    if (game.resources.coins >= game.oilRigs.cost) {
        game.resources.coins -= game.oilRigs.cost;
        game.oilRigs.count++;
        game.oilRigs.cost = Math.floor(game.oilRigs.cost * 1.8);
        updateAll();
        renderShop('oilrigs');
    }
}

function buyBarrel() {
    if (game.resources.coins >= game.barrels.cost) {
        game.resources.coins -= game.barrels.cost;
        game.barrels.count++;
        game.barrels.cost = Math.floor(game.barrels.cost * 1.6);
        updateAll();
        renderShop('barrels');
    }
}

function openCase() {
    if (game.resources.coins >= 150) {
        game.resources.coins -= 150;
        const loot = caseRoll(false);
        showCaseResult(loot);
        updateAll();
    }
}

function openPremiumCase() {
    if (game.resources.coins >= 500) {
        game.resources.coins -= 500;
        const loot = caseRoll(true);
        showCaseResult(loot);
        updateAll();
    }
}

function caseRoll(premium) {
    const roll = Math.random();
    const bonus = premium ? 1.5 : 1;
    
    if (roll < 0.3) {
        const amount = Math.floor((Math.random() * 20 + 5) * bonus);
        game.resources.stone += amount;
        return { icon: '🪨', text: `${amount} камня`, rare: false };
    } else if (roll < 0.55) {
        const amount = Math.floor((Math.random() * 10 + 3) * bonus);
        game.resources.iron += amount;
        return { icon: '🔩', text: `${amount} железа`, rare: false };
    } else if (roll < 0.75) {
        const amount = Math.floor((Math.random() * 5 + 2) * bonus);
        game.resources.gold += amount;
        return { icon: '🥇', text: `${amount} золота`, rare: true };
    } else if (roll < 0.9) {
        const amount = Math.floor((Math.random() * 3 + 1) * bonus);
        game.resources.diamond += amount;
        return { icon: '💎', text: `${amount} алмазов!`, rare: true };
    } else if (roll < 0.97) {
        const coins = Math.floor((Math.random() * 200 + 50) * bonus);
        game.resources.coins += coins;
        return { icon: '🪙', text: `${coins} монет!`, rare: true };
    } else {
        game.inventory.push({ name: 'Золотая кирка', icon: '⛏️' });
        game.pickaxe.power += 5;
        return { icon: '⛏️', text: 'ЗОЛОТАЯ КИРКА! +5 силы', rare: true };
    }
}

function showCaseResult(loot) {
    const modal = document.getElementById('case-modal');
    const result = document.getElementById('case-result');
    result.innerHTML = `<span style="font-size:3rem;">${loot.icon}</span><br><span style="color:${loot.rare ? '#f39c12' : '#fff'};">${loot.text}</span>`;
    modal.classList.remove('hidden');
}

function buyBoost() {
    if (game.resources.coins >= 200) {
        game.resources.coins -= 200;
        game.pickaxe.power *= 2;
        updateAll();
        setTimeout(() => {
            game.pickaxe.power /= 2;
            updateAll();
        }, 30000);
    }
}

// ============ УРОВНИ И АЧИВКИ ============
function checkLevelUp() {
    while (game.xp >= game.xpToLevel) {
        game.xp -= game.xpToLevel;
        game.level++;
        game.xpToLevel = Math.floor(game.xpToLevel * 1.5);
        game.resources.coins += game.level * 50;
    }
}

function checkAchievements() {
    game.achievements.forEach(a => {
        if (!a.done && a.check()) {
            a.done = true;
            showAchievementPopup(a);
        }
    });
}

function showAchievementPopup(a) {
    const popup = document.getElementById('achieve-popup');
    document.getElementById('achieve-name').textContent = a.name;
    document.getElementById('achieve-desc').textContent = a.desc;
    popup.querySelector('.achieve-icon').textContent = a.icon;
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 3000);
}

function renderAchievements() {
    const container = document.getElementById('achievements-content');
    container.innerHTML = game.achievements.map(a => `
        <div class="achieve-card ${a.done ? 'done' : 'locked'}">
            <div class="ach-icon">${a.done ? a.icon : '🔒'}</div>
            <div>
                <strong>${a.name}</strong>
                <p style="font-size:0.8rem;color:#888;">${a.desc}</p>
            </div>
        </div>
    `).join('');
}

function renderInventory() {
    const container = document.getElementById('inventory-content');
    if (game.inventory.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;">Пока пусто</p>';
        return;
    }
    container.innerHTML = game.inventory.map(item => `
        <div class="inv-item">
            <div class="inv-icon">${item.icon}</div>
            <p style="font-size:0.8rem;">${item.name}</p>
        </div>
    `).join('');
}

// ============ ИНТЕРФЕЙС ============
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const viewMap = { mine: 'mine-view', shop: 'shop-view', inventory: 'inventory-view', achievements: 'achievements-view' };
    document.getElementById(viewMap[view]).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
    
    if (view === 'shop') switchShopTab('miners');
    if (view === 'achievements') renderAchievements();
    if (view === 'inventory') renderInventory();
}

function updateAll() {
    document.getElementById('stone').textContent = Math.floor(game.resources.stone);
    document.getElementById('iron').textContent = Math.floor(game.resources.iron);
    document.getElementById('gold').textContent = Math.floor(game.resources.gold);
    document.getElementById('diamond').textContent = Math.floor(game.resources.diamond);
    document.getElementById('oil').textContent = Math.floor(game.resources.oil);
    document.getElementById('coins').textContent = Math.floor(game.resources.coins);
    document.getElementById('level').textContent = game.level;
    document.getElementById('miners-count').textContent = game.miners.count;
    document.getElementById('click-power').textContent = game.pickaxe.power + game.miners.power;
    document.getElementById('auto-power').textContent = game.miners.count * game.pickaxe.power;
    document.getElementById('oil-rigs-count').textContent = game.oilRigs.count;
    document.getElementById('barrels-count').textContent = game.barrels.count;
    document.getElementById('oil-auto').textContent = game.oilRigs.count * game.oilRigs.power;
    document.getElementById('oil-ready').textContent = Math.floor(game.oilStored);
    
    const progress = (game.xp / game.xpToLevel) * 100;
    document.getElementById('ore-progress').style.width = progress + '%';
}

// ============ СОХРАНЕНИЕ ============
function saveGame() {
    localStorage.setItem('shahter-mir-save', JSON.stringify(game));
}

function loadGame() {
    const saved = localStorage.getItem('shahter-mir-save');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(game.resources, data.resources);
        Object.assign(game.miners, data.miners);
        Object.assign(game.pickaxe, data.pickaxe);
        Object.assign(game.oilRigs, data.oilRigs);
        Object.assign(game.barrels, data.barrels);
        game.oilStored = data.oilStored || 0;
        game.level = data.level || 1;
        game.xp = data.xp || 0;
        game.xpToLevel = data.xpToLevel || 100;
        game.inventory = data.inventory || [];
        if (data.achievements) {
            game.achievements.forEach((a, i) => {
                if (data.achievements[i]) a.done = data.achievements[i].done;
            });
        }
        clickCount = data.clickCount || 0;
        updateCurrentOre();
    }
}

window.addEventListener('beforeunload', saveGame);
